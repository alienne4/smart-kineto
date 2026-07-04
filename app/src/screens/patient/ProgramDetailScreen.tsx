import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, TrainingProgram } from "../../api/client";
import { Badge, Card, EmptyState, IconTile, Ionicons, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, disp, mono, spacing, type as T } from "../../theme";

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Not started", color: colors.textMuted },
  IN_PROGRESS: { label: "In progress", color: colors.warning },
  PAUSED: { label: "Paused", color: colors.textMuted },
  COMPLETED: { label: "Completed", color: colors.success },
};

export default function ProgramDetailScreen({ route, navigation }: any) {
  const program: TrainingProgram = route.params.program;
  const assignmentId: string | undefined = route.params.assignmentId;
  const [status, setStatus] = useState<string | undefined>(route.params.status);
  const [completing, setCompleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const items = [...(program.program_exercises || [])].sort((a, b) => a.order - b.order);

  async function ensureStarted() {
    if (!assignmentId || status === "IN_PROGRESS" || status === "COMPLETED") return;
    try {
      const a = await api.startAssignment(assignmentId);
      setStatus(a.status);
    } catch {
      /* non-blocking */
    }
  }

  function openExercise(exercise: TrainingProgram["program_exercises"][number]["exercise"]) {
    ensureStarted();
    const screen = exercise.tracking_method === "HARDWARE_WAND" ? "HardwareExercisePlayer" : "ExercisePlayer";
    navigation.navigate(screen, {
      exercise,
      assignmentId,
      status: status === "COMPLETED" ? status : "IN_PROGRESS",
    });
  }

  async function start() {
    if (!assignmentId) return;
    setBusy(true);
    try {
      const a = await api.startAssignment(assignmentId);
      setStatus(a.status);
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    if (!assignmentId) return;
    setBusy(true);
    try {
      const a = await api.reopenAssignment(assignmentId);
      setStatus(a.status);
      Alert.alert("Session reopened", "You can do this program again.");
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!assignmentId) return;
    setCompleting(true);
    try {
      await api.completeAssignment(assignmentId);
      setStatus("COMPLETED");
      Alert.alert("Nice work! 🎉", "Program marked complete. Your trainer has been notified.");
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not update");
    } finally {
      setCompleting(false);
    }
  }

  const sm = status ? STATUS_META[status] : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={disp(34, colors.text, { marginBottom: 6 })}>{program.name}</Text>
      {program.author ? <Text style={mono(12, colors.primary, "bold", { marginBottom: 6 })}>{`by ${program.author}`}</Text> : null}
      {program.description ? <Text style={[T.muted, { marginBottom: spacing(1) }]}>{program.description}</Text> : null}

      <View style={{ flexDirection: "row", gap: spacing(0.75), marginTop: spacing(0.5), marginBottom: spacing(2.5) }}>
        <Badge text={`${items.length} exercises`} color={colors.primary} />
        {sm ? <Badge text={sm.label} color={sm.color} /> : null}
      </View>

      {assignmentId ? (
        <View style={{ marginBottom: spacing(3) }}>
          {status === "COMPLETED" ? (
            <PrimaryButton title="Reopen session" icon="refresh-outline" variant="ghost" onPress={reopen} loading={busy} />
          ) : status === "IN_PROGRESS" ? (
            <PrimaryButton title="Mark program complete" icon="checkmark-done-outline" onPress={complete} loading={completing} />
          ) : (
            <PrimaryButton title="Start session" icon="play-outline" onPress={start} loading={busy} />
          )}
        </View>
      ) : null}

      <Text style={mono(10, colors.textMuted, "semibold", { letterSpacing: 1, marginBottom: spacing(1.25) })}>
        TAP AN EXERCISE TO START
      </Text>
      {items.length === 0 && <EmptyState icon="barbell-outline" title="No exercises in this program" />}
      {items.map((pe, idx) => {
        const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
        return (
          <Card key={pe.id} style={styles.row} onPress={() => openExercise(pe.exercise)}>
            <View style={styles.index}>
              <Text style={mono(11, colors.textMuted, "bold")}>{idx + 1}</Text>
            </View>
            {pe.exercise.thumbnail ? (
              <Image source={{ uri: pe.exercise.thumbnail }} style={styles.thumb} />
            ) : (
              <IconTile icon={meta.icon as any} size={44} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{pe.exercise.title}</Text>
              <Text style={T.muted}>
                {pe.sets} sets × {pe.reps} reps
                {pe.exercise.tracking_method === "HARDWARE_WAND" ? " · wand" : pe.exercise.video ? " · video" : ""}
              </Text>
            </View>
            <Ionicons name="play" size={20} color={colors.primary} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.25) },
  index: { width: 26, height: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  thumb: { width: 44, height: 44, backgroundColor: colors.surfaceHi },
});
