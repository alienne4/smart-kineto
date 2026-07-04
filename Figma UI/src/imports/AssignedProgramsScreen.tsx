import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { Badge, Card, EmptyState, IconTile, Ionicons, Loading, Notice, PrimaryButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, gradients, spacing, type as T } from "../../theme";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Not started", color: colors.textMuted },
  IN_PROGRESS: { label: "In progress", color: colors.warning },
  PAUSED: { label: "Paused", color: colors.textMuted },
  COMPLETED: { label: "Completed", color: colors.success },
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
      <View style={{ marginBottom: spacing(2) }}>
        <PrimaryButton title="Browse public programs" icon="globe-outline" variant="ghost" onPress={() => navigation.navigate("BrowsePrograms")} />
      </View>
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="list-outline" title="No programs assigned" subtitle="Link to a trainer and they'll assign a program for you." />
      )}
      {data?.map((a) => (
        <Card key={a.id} style={styles.row} onPress={() => navigation.navigate("ProgramDetail", { program: a.program, assignmentId: a.id, status: a.status })}>
          <IconTile icon="fitness-outline" grad={gradients.primary} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={T.body}>{a.program.name}</Text>
            <Text style={T.muted} numberOfLines={1}>{a.program.exercise_count} exercise(s)</Text>
            <View style={{ marginTop: spacing(0.75) }}>
              <Badge text={STATUS_LABEL[a.status]?.label || a.status} color={STATUS_LABEL[a.status]?.color || colors.textMuted} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
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
