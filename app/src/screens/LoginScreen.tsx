import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Field, Icon, PrimaryButton } from "../components/ui";
import { API_BASE_URL } from "../config";
import { body, disp, light, mono, spacing } from "../theme";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brandRow}>
          <Icon name="pulse" size={14} color={light.accentText} />
          <Text style={mono(10, light.text, "bold", { letterSpacing: 1.5 })}>SKF</Text>
        </View>
        <Text style={mono(9, light.muted, "semibold", { letterSpacing: 1.4, marginBottom: 8 })}>REHABILITATION PLATFORM</Text>
        <Text style={disp(44, light.text, { marginBottom: spacing(1) })}>
          WELCOME{"\n"}
          <Text style={{ color: light.accentText }}>BACK</Text>
        </Text>
        <Text style={[body(14, light.muted), { marginBottom: spacing(3) }]}>Guided kinesiotherapy, scored in real time.</Text>

        <Field
          label="EMAIL"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          palette={light}
        />
        <Field
          label="PASSWORD"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          palette={light}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Log in" icon="log-in-outline" onPress={onSubmit} loading={loading} palette={light} />
        <PrimaryButton title="Create an account" variant="ghost" onPress={() => navigation.navigate("Register")} palette={light} />

        <Text style={styles.debug}>API: {API_BASE_URL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: light.bg },
  container: { padding: spacing(3), paddingTop: spacing(9), flexGrow: 1, gap: spacing(1.5) },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  error: { color: light.danger, marginBottom: spacing(0.5) },
  debug: { color: light.faint, marginTop: spacing(3), fontSize: 11, textAlign: "center" },
});
