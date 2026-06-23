import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError, Role } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Field, Ionicons, PrimaryButton } from "../components/ui";
import { colors, radius, spacing, type as T } from "../theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register({ email: email.trim(), full_name: fullName.trim(), role, password });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={T.h1}>Create your account</Text>
        <Text style={[T.muted, { marginTop: spacing(0.5) }]}>Start your recovery journey today.</Text>

        <View style={{ height: spacing(3) }} />

        <Field label="FULL NAME" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
        <Field label="EMAIL" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <Field label="PASSWORD" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        <Text style={styles.roleLabel}>I AM A…</Text>
        <View style={styles.roleRow}>
          <RoleCard label="Patient" desc="Follow programs & track recovery" icon="walk-outline" active={role === "PATIENT"} onPress={() => setRole("PATIENT")} />
          <RoleCard label="Trainer" desc="Build programs & manage patients" icon="fitness-outline" active={role === "TRAINER"} onPress={() => setRole("TRAINER")} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Sign up" icon="arrow-forward-outline" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleCard({ label, desc, icon, active, onPress }: { label: string; desc: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.role, active && styles.roleActive]}>
      <Ionicons name={icon} size={26} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.roleTitle, active && { color: colors.primary }]}>{label}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing(3), paddingTop: spacing(6), flexGrow: 1 },
  roleLabel: { ...T.label, marginBottom: spacing(1.25) },
  roleRow: { flexDirection: "row", gap: spacing(1.5), marginBottom: spacing(3) },
  role: {
    flex: 1,
    padding: spacing(2),
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  roleTitle: { ...T.h2, fontSize: 16 },
  roleDesc: { ...T.muted, fontSize: 12 },
  error: { color: colors.danger, marginBottom: spacing(1.5) },
});
