import Constants from "expo-constants";
import { Platform } from "react-native";

const BACKEND_PORT = 8000;

/**
 * Your computer's LAN IP, used as a fallback when Expo can't tell us the host
 * (common on physical iOS devices). Update this if your PC's IP changes.
 */
const LAN_FALLBACK_IP = "192.168.100.157";

/**
 * Resolve the host where the Django backend is running.
 *
 * In dev, Expo usually reports the LAN IP of the machine running the bundler
 * (e.g. "192.168.1.42:8081"), so a physical phone can reach the backend on the
 * same Wi-Fi. If that isn't available we fall back to the hardcoded LAN IP
 * (physical device) or emulator-friendly hosts.
 */
function resolveHost(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    "";

  const host = hostUri.split(":")[0];
  if (host && host !== "127.0.0.1" && host !== "localhost") {
    return host;
  }

  // No usable host from Expo. On a real device use the LAN IP; emulators/sim
  // can use their loopback aliases.
  if (Platform.OS === "android") return "10.0.2.2";
  return LAN_FALLBACK_IP;
}

export const API_BASE_URL = `http://${resolveHost()}:${BACKEND_PORT}/api`;
