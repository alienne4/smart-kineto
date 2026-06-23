import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Card, EmptyState, Ionicons, Loading, Notice } from "../../components/ui";
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
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="people-outline" title="No trainers available yet" />}
      {data?.map((tr) => {
        const current = user?.trainer?.id === tr.id;
        return (
          <Card key={tr.id} style={[styles.row, current && { borderColor: colors.success }]} onPress={() => choose(tr.id, tr.full_name || tr.email)}>
            <Avatar name={tr.full_name || tr.email} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{tr.full_name || tr.email}</Text>
              <Text style={T.muted}>{busy === tr.id ? "Linking…" : current ? "Current trainer" : tr.email}</Text>
            </View>
            <Ionicons name={current ? "checkmark-circle" : "arrow-forward-circle"} size={26} color={current ? colors.success : colors.primary} />
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
