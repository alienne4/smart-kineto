import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, AuthUser } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Badge, Card, EmptyState, Field, Ionicons, Loading, Notice, PrimaryButton } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";

export default function FindPatientsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.searchPatients(query.trim());
        if (active) setResults(res);
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : "Search failed");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  async function add(p: AuthUser) {
    setBusy(p.id);
    try {
      await api.addPatient(p.id);
      setResults((cur) => cur.map((x) => (x.id === p.id ? { ...x, trainer: { id: user!.id, full_name: user!.full_name, email: user!.email } } : x)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field icon="search-outline" placeholder="Search by name or email" value={query} onChangeText={setQuery} autoCapitalize="none" />
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && results.length === 0 && <EmptyState icon="people-outline" title="No patients found" subtitle="Try a different name or email." />}

      {results.map((p) => {
        const mine = p.trainer?.id === user?.id;
        const otherTrainer = p.trainer && !mine;
        return (
          <Card key={p.id} style={styles.row}>
            <Avatar name={p.full_name || p.email} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{p.full_name || p.email}</Text>
              <Text style={T.muted}>{p.email}</Text>
              {otherTrainer ? <View style={{ marginTop: 4 }}><Badge text="Has a trainer" color={colors.warning} /></View> : null}
            </View>
            {mine ? (
              <Badge text="Yours" color={colors.success} />
            ) : (
              <PrimaryButton title={busy === p.id ? "…" : "Add"} icon="person-add-outline" onPress={() => add(p)} loading={busy === p.id} />
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
});
