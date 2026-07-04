import type { WandFrame } from "../api/client";

export type { WandFrame as WandFeatureFrame } from "../api/client";

export interface WandCaptureResult {
  frames: WandFrame[];
  duration_ms: number;
}

export type WandConnectionState = "disconnected" | "connecting" | "connected" | "error";

/**
 * Abstraction over "a wand device that can be connected to and asked to
 * record a movement" — mirrors app/src/wand/WandClient.ts so the trainer
 * reference recorder and patient session player can be written the same way
 * on both surfaces. The only implementation today is `BleWandClient`
 * (Web Bluetooth); see Firmware/README.md for the GATT contract.
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
