import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { Badge, Card, EmptyState, IconTile, Ionicons, Loading, Notice } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, gradients, spacing, type as T } from "../../theme";

export default function AssignProgramScreen({ route, navigation }: any) {
  const patient = route.params.patient;
  const { data, loading, error } = useApi(() => api.listPrograms());
  const [busy, setBusy] = useState<string | null>(null);

  async function assign(programId: string, programName: string) {
    setBusy(programId);
    try {
      await api.createAssignment(programId, patient.id);
      Alert.alert("Assigned ✓", `“${programName}” assigned to ${patient.full_name || patient.email}. They'll get a notification.`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not assign", e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={[T.muted, { marginBottom: spacing(2) }]}>
        Choose a program for {patient.full_name || patient.email}
      </Text>
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="list-outline" title="No programs to assign" subtitle="Create a program first." />}
      {data?.map((p) => (
        <Card key={p.id} style={[styles.row, { opacity: busy && busy !== p.id ? 0.5 : 1 }]} onPress={() => assign(p.id, p.name)}>
          <IconTile icon="list-outline" grad={gradients.violet} />
          <View style={{ flex: 1 }}>
            <Text style={T.body}>{p.name}</Text>
            <Text style={T.muted}>{busy === p.id ? "Assigning…" : `${p.exercise_count} exercise(s)`}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={26} color={colors.primary} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
});
