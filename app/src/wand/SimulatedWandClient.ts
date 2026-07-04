import type { WandCaptureResult, WandClient, WandConnectionState, WandFeatureFrame } from "./WandClient";

const SAMPLE_INTERVAL_MS = 20; // ~50 Hz, matching the wand's real sample rate

/**
 * Fakes a BLE-connected wand: a short "handshake" delay on connect, then a
 * synthetic half-sine roll/pitch movement (with small per-rep variation and
 * noise) streamed at ~50 Hz while capturing. Stopping a capture early yields a
 * short/incomplete repetition, which is useful for exercising the backend's
 * rejection-reason paths without needing real hardware.
 */
export class SimulatedWandClient implements WandClient {
  private state: WandConnectionState = "disconnected";
  private listeners = new Set<(state: WandConnectionState) => void>();
  private capturing = false;
  private frames: WandFeatureFrame[] = [];
  private captureStartedAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private peakRoll = 60;
  private peakPitch = 20;
  private plannedDurationMs = 1000;

  getState(): WandConnectionState {
    return this.state;
  }

  private setState(next: WandConnectionState) {
    this.state = next;
    this.listeners.forEach((cb) => cb(next));
  }

  async connect(): Promise<void> {
    this.setState("connecting");
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.setState("connected");
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.capturing = false;
    this.setState("disconnected");
  }

  onStateChange(cb: (state: WandConnectionState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  isCapturing(): boolean {
    return this.capturing;
  }

  startCapture(): void {
    if (this.capturing) return;
    this.capturing = true;
    this.frames = [];
    this.captureStartedAt = Date.now();
    // Vary the simulated movement slightly each rep, like a real patient would.
    this.peakRoll = 45 + Math.random() * 30;
    this.peakPitch = 15 + Math.random() * 15;
    this.plannedDurationMs = 900 + Math.random() * 400;

    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.captureStartedAt;
      const t = Math.min(elapsed / this.plannedDurationMs, 1);
      const phase = t * Math.PI;
      const noise = () => (Math.random() - 0.5) * 1.5;
      this.frames.push({
        t_ms: elapsed,
        roll: Math.sin(phase) * this.peakRoll + noise(),
        pitch: Math.sin(phase) * this.peakPitch + noise(),
        gx: Math.cos(phase) * this.peakRoll * 2,
        gy: Math.cos(phase) * this.peakPitch * 2,
        gz: 0,
      });
    }, SAMPLE_INTERVAL_MS);
  }

  stopCapture(): WandCaptureResult {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.capturing = false;
    const duration_ms = this.frames.length > 0 ? this.frames[this.frames.length - 1].t_ms : 0;
    const result: WandCaptureResult = { frames: this.frames, duration_ms };
    this.frames = [];
    return result;
  }
}
