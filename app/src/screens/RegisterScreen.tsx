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
import { Field, PrimaryButton } from "../components/ui";
import { body, disp, light, mono, spacing } from "../theme";

const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: "PATIENT", label: "PATIENT", desc: "Follow programs & track recovery" },
  { id: "TRAINER", label: "TRAINER / PT", desc: "Build programs & manage patients" },
];

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
        <Text style={disp(38, light.text, { marginBottom: 6 })}>
          CREATE{"\n"}
          <Text style={{ color: light.accentText }}>ACCOUNT</Text>
        </Text>
        <Text style={[body(13, light.muted), { marginBottom: spacing(2.5) }]}>Start your recovery journey today.</Text>

        <Text style={mono(9, light.muted, "semibold", { letterSpacing: 1, marginBottom: 8 })}>I AM A…</Text>
        <View style={styles.roleList}>
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[
                  styles.roleRow,
                  { backgroundColor: active ? `${light.accent}1F` : light.bg, borderLeftColor: active ? light.accentText : "transparent" },
                ]}
              >
                <View style={styles.roleHead}>
                  <Text style={mono(11, active ? light.accentText : light.text, "bold")}>{r.label}</Text>
                  {active && (
                    <View style={styles.selectedBadge}>
                      <Text style={mono(8, light.accentText, "bold")}>SELECTED</Text>
                    </View>
                  )}
                </View>
                <Text style={body(13, light.muted)}>{r.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="FULL NAME" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" palette={light} />
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

        <PrimaryButton title="Sign up" icon="arrow-forward-outline" onPress={onSubmit} loading={loading} palette={light} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: light.bg },
  container: { padding: spacing(3), paddingTop: spacing(6), flexGrow: 1 },
  roleList: { flexDirection: "column", gap: 1, backgroundColor: light.border, marginBottom: spacing(3) },
  roleRow: { borderLeftWidth: 2, paddingVertical: 13, paddingHorizontal: 16, gap: 3 },
  roleHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedBadge: { borderWidth: 1, borderColor: light.accentText, paddingHorizontal: 8, paddingVertical: 1 },
  error: { color: light.danger, marginBottom: spacing(1.5) },
});
