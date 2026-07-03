import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { EmptyState, Loading, Notice, PrimaryButton, ProgressBar } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, disp, light, mono, spacing } from "../../theme";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Not started", color: light.muted },
  IN_PROGRESS: { label: "In progress", color: light.warn },
  PAUSED: { label: "Paused", color: light.muted },
  COMPLETED: { label: "Completed", color: light.ok },
};

const PROGRESS_PCT: Record<string, number> = {
  ACTIVE: 0,
  IN_PROGRESS: 50,
  PAUSED: 0,
  COMPLETED: 100,
};

export default function AssignedProgramsScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.listAssignments());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={disp(22, light.text)}>MY PROGRAMS</Text>
        <PrimaryButton title="Browse" icon="globe-outline" variant="ghost" onPress={() => navigation.navigate("BrowsePrograms")} />
      </View>

      {loading && <Loading palette={light} />}
      {error && <Notice text={error} tone="error" palette={light} />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="list-outline" title="No programs assigned" subtitle="Link to a trainer and they'll assign a program for you." palette={light} />
      )}

      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((a) => {
            const sm = STATUS_LABEL[a.status] || { label: a.status, color: light.muted };
            const pct = PROGRESS_PCT[a.status] ?? 0;
            const active = a.status === "IN_PROGRESS";
            return (
              <Pressable
                key={a.id}
                onPress={() => navigation.navigate("ProgramDetail", { program: a.program, assignmentId: a.id, status: a.status })}
                style={[styles.row, { backgroundColor: active ? `${light.accent}0F` : light.bg, borderLeftColor: active ? light.accentText : "transparent" }]}
              >
                <View style={styles.rowHead}>
                  <Text style={disp(20, light.text, { flex: 1 })} numberOfLines={1}>{a.program.name}</Text>
                  <View style={[styles.badge, { borderColor: sm.color }]}>
                    <Text style={mono(8, sm.color, "bold")}>{sm.label.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[mono(9, light.muted), { marginBottom: 10 }]}>{a.program.exercise_count} EXERCISE(S)</Text>
                <ProgressBar value={pct} color={sm.color} palette={light} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: light.bg },
  content: { padding: spacing(2.5) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing(2) },
  list: { flexDirection: "column", gap: 1, backgroundColor: light.border },
  row: { borderLeftWidth: 2, padding: spacing(1.75) },
  rowHead: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  badge: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
});
