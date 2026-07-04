import Constants, { ExecutionEnvironment } from "expo-constants";

import { BleWandClient } from "./BleWandClient";
import { SimulatedWandClient } from "./SimulatedWandClient";
import type { WandClient } from "./WandClient";

let instance: WandClient | null = null;

/**
 * Single seam for swapping in a real BLE implementation. `BleWandClient` needs
 * a native module that only exists in a dev-client/standalone build (see
 * app/README.md) — under Expo Go it isn't there, so we fall back to the
 * simulator instead of crashing.
 */
export function getWandClient(): WandClient {
  if (instance) return instance;

  const canUseRealBle = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
  if (canUseRealBle) {
    try {
      instance = new BleWandClient();
      return instance;
    } catch {
      // Native module unavailable for some other reason — fall back below.
    }
  }

  instance = new SimulatedWandClient();
  return instance;
}

export * from "./WandClient";
