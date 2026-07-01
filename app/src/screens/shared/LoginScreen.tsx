import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../auth/AuthContext";
import { Field, Notice, PrimaryButton } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>SK</Text>
      </View>
      <Text style={T.display}>SmartKinetoFit</Text>
      <Text style={[T.muted, { marginBottom: spacing(3) }]}>Guided recovery, live coaching, clear progress.</Text>
      <Field label="Email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Password" icon="lock-closed-outline" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Notice text={error} tone="error" /> : null}
      <PrimaryButton title="Sign in" loading={busy} onPress={submit} />
      <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
        Create an account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: spacing(3) },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(2)
  },
  logoText: { color: colors.bg, fontWeight: "900", fontSize: 18 },
  link: { color: colors.primary, textAlign: "center", fontWeight: "700", marginTop: spacing(2) }
});
