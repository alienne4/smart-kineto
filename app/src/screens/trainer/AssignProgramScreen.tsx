import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { Avatar, EmptyState, Ionicons, Loading, Notice, PrimaryButton, SLabel } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, colors, mono, spacing } from "../../theme";

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
      <SLabel n="01" label="Patient" />
      <View style={styles.patientCard}>
        <Avatar name={patient.full_name || patient.email} size={36} />
        <View>
          <Text style={body(14, colors.text, "medium")}>{patient.full_name || patient.email}</Text>
          <Text style={mono(9, colors.success, "bold")}>SELECTED</Text>
        </View>
      </View>

      <SLabel n="02" label="Select program" />
      <View style={{ marginTop: spacing(1), marginBottom: spacing(2) }}>
        {loading && <Loading />}
        {error && <Notice text={error} tone="error" />}
        {!loading && data?.length === 0 && <EmptyState icon="list-outline" title="No programs to assign" subtitle="Create a program first." />}
        {(data?.length ?? 0) > 0 && (
          <View style={styles.rowsWrap}>
            {data?.map((p) => {
              const isBusy = busy === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.row, isBusy && styles.rowBusy, !!busy && !isBusy && { opacity: 0.4 }]}
                  disabled={!!busy}
                  onPress={() => assign(p.id, p.name)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={body(13, colors.text, "medium")}>{p.name}</Text>
                    <Text style={mono(9, colors.textMuted)}>{isBusy ? "ASSIGNING…" : `${p.exercise_count} EXERCISE(S)`}</Text>
                  </View>
                  {isBusy ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
    padding: spacing(1.75),
    marginTop: spacing(1),
    marginBottom: spacing(2),
  },
  rowsWrap: { gap: 1, backgroundColor: colors.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.bg,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
    padding: spacing(1.75),
  },
  rowBusy: { backgroundColor: `${colors.primary}14`, borderLeftColor: colors.primary },
});
