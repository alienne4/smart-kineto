import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../auth/AuthContext";
import { Field, Notice, PrimaryButton } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PATIENT" | "TRAINER">("PATIENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await register({ full_name: fullName, email, password, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={T.display}>Create account</Text>
      <Text style={[T.muted, { marginBottom: spacing(3) }]}>Choose the role that matches your workflow.</Text>
      <Field label="Full name" icon="person-outline" value={fullName} onChangeText={setFullName} />
      <Field label="Email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Password" icon="lock-closed-outline" secureTextEntry value={password} onChangeText={setPassword} />
      <View style={styles.roleRow}>
        <PrimaryButton title="Patient" variant={role === "PATIENT" ? "primary" : "ghost"} onPress={() => setRole("PATIENT")} />
        <PrimaryButton title="Trainer" variant={role === "TRAINER" ? "primary" : "ghost"} onPress={() => setRole("TRAINER")} />
      </View>
      {error ? <Notice text={error} tone="error" /> : null}
      <PrimaryButton title="Create account" loading={busy} onPress={submit} />
      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        Back to sign in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: spacing(3) },
  roleRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(2) },
  link: { color: colors.primary, textAlign: "center", fontWeight: "700", marginTop: spacing(2) }
});
