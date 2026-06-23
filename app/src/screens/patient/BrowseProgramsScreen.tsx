import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, Assignment, TrainingProgram } from "../../api/client";
import { Badge, Card, EmptyState, IconTile, Loading, Notice, PrimaryButton } from "../../components/ui";
import { colors, gradients, spacing, type as T } from "../../theme";

export default function BrowseProgramsScreen({ navigation }: any) {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listPublicPrograms(), api.listAssignments()])
      .then(([pub, asg]: [TrainingProgram[], Assignment[]]) => {
        setPrograms(pub);
        setAssigned(new Set(asg.map((a) => a.program.id)));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load"))
      .finally(() => setLoading(false));
  }, []);

  async function add(p: TrainingProgram) {
    setBusy(p.id);
    try {
      const assignment = await api.selfAssignProgram(p.id);
      setAssigned((s) => new Set(s).add(p.id));
      Alert.alert("Added to your plan", `“${p.name}” is now in your programs.`, [
        { text: "View", onPress: () => navigation.navigate("ProgramDetail", { program: assignment.program, assignmentId: assignment.id, status: assignment.status }) },
        { text: "OK" },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not add");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && programs.length === 0 && (
        <EmptyState icon="globe-outline" title="No public programs yet" subtitle="Check back soon for ready-made plans." />
      )}
      {programs.map((p) => {
        const has = assigned.has(p.id);
        return (
          <Card key={p.id} style={styles.row}>
            <IconTile icon="fitness-outline" grad={gradients.primary} size={50} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{p.name}</Text>
              <Text style={T.muted} numberOfLines={1}>
                {p.exercise_count} exercise(s){p.author ? ` · by ${p.author}` : ""}
              </Text>
              <View style={{ marginTop: spacing(0.75) }}>
                <Badge text={p.is_template ? "LIBRARY" : "PUBLIC"} color={p.is_template ? colors.accent : colors.success} />
              </View>
            </View>
            <View style={{ width: 110 }}>
              <PrimaryButton
                title={has ? "Added" : "Add"}
                variant={has ? "ghost" : "primary"}
                disabled={has}
                loading={busy === p.id}
                onPress={() => add(p)}
              />
            </View>
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
