import type { WandCaptureResult, WandClient, WandConnectionState, WandFeatureFrame } from "./WandClient";

// Must match Firmware/include/AppConfig.h and Firmware/README.md exactly.
const SERVICE_UUID = "3f14498e-fd41-4682-8056-1e15ff36adfa";
const IMU_CHARACTERISTIC_UUID = "158796bd-587e-425c-b161-43d08aa320dc";
const CONTROL_CHARACTERISTIC_UUID = "47584c68-23f8-4a64-bdca-b18c8d3698bf";
const CMD_CALIBRATE = 0x01;

const PACKET_LENGTH = 14; // uint32 t_ms + 5x int16

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

function decodePacket(view: DataView): { roll: number; pitch: number; gx: number; gy: number; gz: number } | null {
  if (view.byteLength < PACKET_LENGTH) return null;
  return {
    roll: view.getInt16(4, true) / 100,
    pitch: view.getInt16(6, true) / 100,
    gx: view.getInt16(8, true) / 10,
    gy: view.getInt16(10, true) / 10,
    gz: view.getInt16(12, true) / 10,
  };
}

/**
 * Real Web Bluetooth implementation of `WandClient`, talking to the ESP32-S3
 * firmware's GATT service (see Firmware/README.md). Chrome/Edge desktop and
 * Android Chrome only — not supported in Safari or Firefox.
 */
export class BleWandClient implements WandClient {
  private state: WandConnectionState = "disconnected";
  private listeners = new Set<(state: WandConnectionState) => void>();
  private device: BluetoothDevice | null = null;
  private imuCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private controlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private capturing = false;
  private frames: WandFeatureFrame[] = [];
  private captureStartedAt = 0;

  private readonly onNotification = (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    if (!this.capturing || !characteristic.value) return;
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
  };

  private readonly onGattDisconnected = () => {
    this.cleanupConnection();
    this.setState("disconnected");
  };

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
    if (!isWebBluetoothSupported()) {
      this.setState("error");
      throw new Error("This browser doesn't support Web Bluetooth. Use Chrome or Edge.");
    }

    this.setState("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });
      device.addEventListener("gattserverdisconnected", this.onGattDisconnected);
      this.device = device;

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      this.imuCharacteristic = await service.getCharacteristic(IMU_CHARACTERISTIC_UUID);
      this.controlCharacteristic = await service.getCharacteristic(CONTROL_CHARACTERISTIC_UUID).catch(() => null as any);

      await this.imuCharacteristic.startNotifications();
      this.imuCharacteristic.addEventListener("characteristicvaluechanged", this.onNotification);

      this.setState("connected");
    } catch (e) {
      this.cleanupConnection();
      this.setState("error");
      throw e;
    }
  }

  disconnect(): void {
    this.device?.gatt?.disconnect();
    this.cleanupConnection();
    this.setState("disconnected");
  }

  private cleanupConnection() {
    this.imuCharacteristic?.removeEventListener("characteristicvaluechanged", this.onNotification);
    this.device?.removeEventListener("gattserverdisconnected", this.onGattDisconnected);
    this.imuCharacteristic = null;
    this.controlCharacteristic = null;
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
    if (!this.controlCharacteristic) return;
    await this.controlCharacteristic.writeValueWithResponse(new Uint8Array([CMD_CALIBRATE]));
  }
}
