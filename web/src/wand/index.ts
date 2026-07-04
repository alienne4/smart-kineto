import { BleWandClient } from "./BleWandClient";
import type { WandClient } from "./WandClient";

let instance: WandClient | null = null;

/** Single seam for swapping the wand implementation, mirroring app/src/wand/index.ts. */
export function getWandClient(): WandClient {
  if (!instance) instance = new BleWandClient();
  return instance;
}

export * from "./WandClient";
export { isWebBluetoothSupported } from "./BleWandClient";
