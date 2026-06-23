import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api/client";

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission, obtain an Expo push token, and register it with the backend.
 *
 * NOTE: Remote push tokens are NOT available in Expo Go (SDK 53+). This will no-op
 * gracefully there; it starts working once you run a custom dev build / EAS build.
 * Returns true if a token was registered.
 */
export async function registerForPush(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return false;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await api.registerDevice(tokenResponse.data, Platform.OS);
    return true;
  } catch (e) {
    // Expected in Expo Go (no remote push). Don't crash the app.
    console.log("Push registration skipped:", (e as Error)?.message);
    return false;
  }
}
