import { toByteArray, fromByteArray } from "base64-js";
import { PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device, State, Subscription } from "react-native-ble-plx";

import type { WandCaptureResult, WandClient, WandConnectionState, WandFeatureFrame } from "./WandClient";

// Must match Firmware/include/AppConfig.h and Firmware/README.md exactly.
const SERVICE_UUID = "3f14498e-fd41-4682-8056-1e15ff36adfa";
const IMU_CHARACTERISTIC_UUID = "158796bd-587e-425c-b161-43d08aa320dc";
const CONTROL_CHARACTERISTIC_UUID = "47584c68-23f8-4a64-bdca-b18c8d3698bf";
const CMD_CALIBRATE = 0x01;

const PACKET_LENGTH = 14; // uint32 t_ms + 5x int16
const SCAN_TIMEOUT_MS = 15000;

interface DecodedSample {
  roll: number;
  pitch: number;
  gx: number;
  gy: number;
  gz: number;
}

function decodePacket(base64Value: string): DecodedSample | null {
  const bytes = toByteArray(base64Value);
  if (bytes.length < PACKET_LENGTH) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    roll: view.getInt16(4, true) / 100,
    pitch: view.getInt16(6, true) / 100,
    gx: view.getInt16(8, true) / 10,
    gy: view.getInt16(10, true) / 10,
    gz: view.getInt16(12, true) / 10,
  };
}

async function ensurePermissions(): Promise<void> {
  if (Platform.OS !== "android") return;

  const apiLevel = Number(Platform.Version);
  if (apiLevel >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    const granted = Object.values(result).every((value) => value === PermissionsAndroid.RESULTS.GRANTED);
    if (!granted) throw new Error("Bluetooth permission was denied.");
    return;
  }

  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error("Location permission was denied.");
}

function waitForPoweredOn(manager: BleManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const subscription = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        subscription.remove();
        resolve();
      } else if (state === State.Unsupported || state === State.Unauthorized || state === State.PoweredOff) {
        subscription.remove();
        reject(new Error(`Bluetooth is not available (${state}). Turn it on and try again.`));
      }
    }, true);
  });
}

/**
 * Real BLE implementation of `WandClient`, talking to the ESP32-S3 firmware's
 * GATT service (see Firmware/README.md). Scans for the wand by service UUID,
 * subscribes to the IMU notify characteristic, and buffers frames locally
 * between `startCapture()`/`stopCapture()` — same shape as `SimulatedWandClient`.
 */
export class BleWandClient implements WandClient {
  private manager = new BleManager();
  private state: WandConnectionState = "disconnected";
  private listeners = new Set<(state: WandConnectionState) => void>();
  private device: Device | null = null;
  private monitorSub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;

  private capturing = false;
  private frames: WandFeatureFrame[] = [];
  private captureStartedAt = 0;

  getState(): WandConnectionState {
    return this.state;
  }

  private setState(next: WandConnectionState) {
    this.state = next;
    this.listeners.forEach((cb) => cb(next));
  }

  onStateChange(cb: (state: WandConnectionState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async connect(): Promise<void> {
    if (this.state === "connected" || this.state === "connecting") return;
    this.setState("connecting");

    try {
      await ensurePermissions();
      await waitForPoweredOn(this.manager);

      const found = await this.scanForDevice();
      const connected = await found.connect();
      await connected.discoverAllServicesAndCharacteristics();
      this.device = connected;

      this.disconnectSub = connected.onDisconnected(() => {
        this.cleanupConnection();
        this.setState("disconnected");
      });

      this.monitorSub = connected.monitorCharacteristicForService(
        SERVICE_UUID,
        IMU_CHARACTERISTIC_UUID,
        (error, characteristic) => this.onNotification(error, characteristic)
      );

      this.setState("connected");
    } catch (e) {
      this.cleanupConnection();
      this.setState("error");
      throw e;
    }
  }

  private scanForDevice(): Promise<Device> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        reject(new Error("No SmartKineto wand found nearby."));
      }, SCAN_TIMEOUT_MS);

      this.manager.startDeviceScan([SERVICE_UUID], null, (error, scanned) => {
        if (error) {
          clearTimeout(timeout);
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }
        if (scanned) {
          clearTimeout(timeout);
          this.manager.stopDeviceScan();
          resolve(scanned);
        }
      });
    });
  }

  private onNotification(error: BleError | null, characteristic: Characteristic | null) {
    if (error || !characteristic?.value || !this.capturing) return;
    const decoded = decodePacket(characteristic.value);
    if (!decoded) return;

    this.frames.push({
      t_ms: Date.now() - this.captureStartedAt,
      roll: decoded.roll,
      pitch: decoded.pitch,
      gx: decoded.gx,
      gy: decoded.gy,
      gz: decoded.gz,
    });
  }

  disconnect(): void {
    const deviceId = this.device?.id;
    this.cleanupConnection();
    if (deviceId) {
      this.manager.cancelDeviceConnection(deviceId).catch(() => {});
    }
    this.setState("disconnected");
  }

  private cleanupConnection() {
    this.monitorSub?.remove();
    this.monitorSub = null;
    this.disconnectSub?.remove();
    this.disconnectSub = null;
    this.device = null;
    this.capturing = false;
    this.frames = [];
  }

  isCapturing(): boolean {
    return this.capturing;
  }

  startCapture(): void {
    if (this.capturing) return;
    this.capturing = true;
    this.frames = [];
    this.captureStartedAt = Date.now();
  }

  stopCapture(): WandCaptureResult {
    this.capturing = false;
    const duration_ms = this.frames.length > 0 ? this.frames[this.frames.length - 1].t_ms : 0;
    const result: WandCaptureResult = { frames: this.frames, duration_ms };
    this.frames = [];
    return result;
  }

  /** Not part of `WandClient` — asks the device to re-zero its gyro drift. */
  async calibrate(): Promise<void> {
    if (!this.device) return;
    const payload = fromByteArray(new Uint8Array([CMD_CALIBRATE]));
    await this.device.writeCharacteristicWithResponseForService(SERVICE_UUID, CONTROL_CHARACTERISTIC_UUID, payload);
  }
}
