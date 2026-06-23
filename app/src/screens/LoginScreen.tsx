import { LinearGradient } from "expo-linear-gradient";
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
import { Field, Ionicons, PrimaryButton } from "../components/ui";
import { API_BASE_URL } from "../config";
import { colors, gradients, radius, spacing, type as T } from "../theme";

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
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
          <Ionicons name="pulse" size={36} color={colors.bg} />
        </LinearGradient>
        <Text style={styles.brand}>SmartKinetoFit</Text>
        <Text style={styles.subtitle}>Guided kinesiotherapy, scored in real time.</Text>

        <View style={{ height: spacing(4) }} />

        <Field
          label="EMAIL"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field label="PASSWORD" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Log in" icon="log-in-outline" onPress={onSubmit} loading={loading} />
        <View style={{ height: spacing(1.5) }} />
        <PrimaryButton title="Create an account" variant="ghost" onPress={() => navigation.navigate("Register")} />

        <Text style={styles.debug}>API: {API_BASE_URL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing(3), paddingTop: spacing(9), flexGrow: 1 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(2),
  },
  brand: { ...T.display, color: colors.text },
  subtitle: { ...T.muted, marginTop: spacing(0.5), fontSize: 15 },
  error: { color: colors.danger, marginBottom: spacing(1.5) },
  debug: { color: colors.textFaint, marginTop: spacing(3), fontSize: 11, textAlign: "center" },
});
