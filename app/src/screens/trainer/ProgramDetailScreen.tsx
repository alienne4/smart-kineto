import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, TrainingProgram } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, Card, EmptyState, IconTile, Ionicons, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, radius, spacing, type as T } from "../../theme";

export default function ProgramDetailScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const [program, setProgram] = useState<TrainingProgram>(route.params.program);
  const items = [...(program.program_exercises || [])].sort((a, b) => a.order - b.order);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const mine = !program.is_template && program.created_by?.id === user?.id;

  useFocusEffect(
    useCallback(() => {
      api.getProgram(program.id).then(setProgram).catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [program.id])
  );

  async function clone() {
    setCloning(true);
    try {
      await api.cloneProgram(program.id);
      Alert.alert("Saved ✓", "A copy was added to your programs. You can edit and assign it.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not copy");
    } finally {
      setCloning(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const updated = await api.publishProgram(program.id);
      setProgram(updated);
      Alert.alert("Submitted ✓", "Your program was sent for admin review. Once approved it appears in the public library.");
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not publish");
    } finally {
      setPublishing(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete program", `Delete “${program.name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await api.deleteProgram(program.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", e instanceof ApiError ? e.message : "Could not delete");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={T.h1}>{program.name}</Text>
      <Text style={styles.author}>by {program.author}</Text>
      {program.description ? <Text style={[T.muted, { marginTop: spacing(0.5) }]}>{program.description}</Text> : null}
      <View style={{ flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1.5) }}>
        <Badge text={`${items.length} exercises`} color={colors.primary} />
        {program.is_template ? <Badge text="LIBRARY" color={colors.accent} /> : null}
      </View>

      {mine && (program.is_public || program.review_status === "PENDING" || program.review_status === "REJECTED") ? (
        <View style={styles.notice}>
          {program.is_public ? (
            <><Ionicons name="globe-outline" size={18} color={colors.success} /><Text style={styles.noticeText}>Published in the public library</Text></>
          ) : program.review_status === "PENDING" ? (
            <><Ionicons name="time-outline" size={18} color={colors.warning} /><Text style={styles.noticeText}>Pending admin review</Text></>
          ) : (
            <><Ionicons name="close-circle-outline" size={18} color={colors.danger} /><Text style={styles.noticeText}>Not approved — edit and resubmit</Text></>
          )}
        </View>
      ) : null}

      <Text style={styles.label}>EXERCISES</Text>
      {items.length === 0 && <EmptyState icon="barbell-outline" title="No exercises in this program" />}
      {items.map((pe, idx) => {
        const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
        return (
          <Card key={pe.id} style={styles.row}>
            <IconTile icon={meta.icon as any} grad={meta.grad} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{idx + 1}. {pe.exercise.title}</Text>
              <Text style={T.muted}>{pe.sets} sets × {pe.reps} reps · {meta.label}</Text>
            </View>
          </Card>
        );
      })}

      <View style={{ height: spacing(3) }} />
      {mine ? (
        <>
          <PrimaryButton title="Edit program" icon="create-outline" onPress={() => navigation.navigate("CreateProgram", { program })} />
          <View style={{ height: spacing(1.25) }} />
          {!program.is_public && program.review_status !== "PENDING" ? (
            <PrimaryButton title="Publish to public library" variant="ghost" icon="cloud-upload-outline" onPress={publish} loading={publishing} />
          ) : null}
          <View style={{ height: spacing(1.25) }} />
          <PrimaryButton title="Delete program" variant="danger" icon="trash-outline" onPress={confirmDelete} loading={deleting} />
        </>
      ) : (
        <PrimaryButton title="Save a copy to my programs" icon="copy-outline" onPress={clone} loading={cloning} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  author: { ...T.muted, marginTop: 2, color: colors.primary, fontWeight: "700" },
  label: { ...T.label, marginTop: spacing(3), marginBottom: spacing(1) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.25) },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(1.5),
    marginTop: spacing(2),
  },
  noticeText: { ...T.muted, color: colors.text, flex: 1 },
});
