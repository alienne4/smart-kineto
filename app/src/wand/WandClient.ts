export interface WandFeatureFrame {
  t_ms: number;
  roll: number;
  pitch: number;
  gx: number;
  gy: number;
  gz: number;
}

export interface WandCaptureResult {
  frames: WandFeatureFrame[];
  duration_ms: number;
}

export type WandConnectionState = "disconnected" | "connecting" | "connected" | "error";

/**
 * Abstraction over "a wand device that can be connected to and asked to record
 * a movement". The only implementation wired up today is `SimulatedWandClient`
 * (no real ESP32-S3 BLE firmware exists yet) — a future `BleWandClient` using
 * react-native-ble-plx drops in behind this same interface via `index.ts`.
 */
export interface WandClient {
  getState(): WandConnectionState;
  connect(): Promise<void>;
  disconnect(): void;
  /** Returns an unsubscribe function. */
  onStateChange(cb: (state: WandConnectionState) => void): () => void;
  isCapturing(): boolean;
  startCapture(): void;
  /** Stops capturing and returns whatever frames were collected. */
  stopCapture(): WandCaptureResult;
}
