import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, EmptyState, Icon, Loading, Notice, SLabel } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, spacing, type as T } from "../../theme";

export default function PickTrainerScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const { data, loading, error } = useApi(() => api.listTrainers());
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(trainerId: string, name: string) {
    setBusy(trainerId);
    try {
      await api.setTrainer(trainerId);
      await refreshUser();
      Alert.alert("Linked ✓", `You're now linked to ${name}.`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not link", e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={[T.muted, { marginBottom: spacing(2) }]}>Pick a trainer to follow their programs.</Text>

      <SLabel n="01" label="Trainers" right={data?.length ? `${data.length}` : undefined} />
      <View style={{ height: spacing(1.5) }} />

      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="people-outline" title="No trainers available yet" />}

      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((tr, i) => {
            const current = user?.trainer?.id === tr.id;
            return (
              <Pressable
                key={tr.id}
                onPress={() => choose(tr.id, tr.full_name || tr.email)}
                style={({ pressed }) => [
                  styles.row,
                  i < data.length - 1 && styles.rowDivider,
                  { borderLeftWidth: 2, borderLeftColor: current ? colors.success : "transparent" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Avatar name={tr.full_name || tr.email} />
                <View style={{ flex: 1 }}>
                  <Text style={T.body}>{tr.full_name || tr.email}</Text>
                  <Text style={T.muted}>{busy === tr.id ? "Linking…" : current ? "Current trainer" : tr.email}</Text>
                </View>
                <Icon name={current ? "checkmark-circle" : "arrow-forward-circle"} size={24} color={current ? colors.success : colors.primary} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  list: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), padding: spacing(1.75) },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
