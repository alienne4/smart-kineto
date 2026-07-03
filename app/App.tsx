import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/auth/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { dark, disp, fontMap, mono } from "./src/theme";

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: dark.bg, alignItems: "center", justifyContent: "center", gap: 20 }}>
      <View
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: `${dark.accent}12`,
          top: "22%",
        }}
      />
      <Text style={mono(10, dark.muted, "medium", { letterSpacing: 1.4 })}>REHABILITATION INTELLIGENCE</Text>
      <Text style={[disp(56, dark.text, { textAlign: "center" })]}>
        SMART{"\n"}KINETO{"\n"}
        <Text style={{ color: dark.accent }}>FIT</Text>
      </Text>
      <Text style={mono(9, dark.faint, "regular", { letterSpacing: 1 })}>INITIALIZING…</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontMap);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Splash />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
