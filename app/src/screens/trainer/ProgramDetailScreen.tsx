import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, TrainingProgram } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, EmptyState, Icon, IconName, IconTile, PrimaryButton, SLabel } from "../../components/ui";
import { BODY_PART_META, body, colors, disp, mono, spacing } from "../../theme";

function StatusNotice({ icon, text, color }: { icon: IconName; text: string; color: string }) {
  return (
    <View style={[styles.notice, { borderColor: color, backgroundColor: `${color}12` }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.noticeText, { color }]}>{text}</Text>
    </View>
  );
}

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
      <Text style={styles.title}>{program.name}</Text>
      <Text style={styles.author}>by {program.author}</Text>
      {program.description ? <Text style={styles.desc}>{program.description}</Text> : null}
      <View style={styles.badges}>
        <Badge text={`${items.length} exercises`} />
        {program.is_template ? <Badge text="Library" /> : null}
      </View>

      {mine && program.is_public ? (
        <StatusNotice icon="globe-outline" text="Published in the public library" color={colors.success} />
      ) : mine && program.review_status === "PENDING" ? (
        <StatusNotice icon="time-outline" text="Pending admin review" color={colors.warning} />
      ) : mine && program.review_status === "REJECTED" ? (
        <StatusNotice icon="close-circle-outline" text="Not approved — edit and resubmit" color={colors.danger} />
      ) : null}

      <View style={styles.sectionHead}>
        <SLabel n="01" label="Exercises" right={`${items.length}`} />
      </View>
      {items.length === 0 && <EmptyState icon="barbell-outline" title="No exercises in this program" />}
      {items.length > 0 && (
        <View style={styles.list}>
          {items.map((pe, idx) => {
            const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
            return (
              <View key={pe.id} style={[styles.row, idx < items.length - 1 && styles.rowDivider]}>
                <IconTile icon={meta.icon as any} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>
                    {idx + 1}. {pe.exercise.title}
                  </Text>
                  <Text style={styles.exMeta}>
                    {pe.sets} sets × {pe.reps} reps · {meta.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

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
  title: disp(30, colors.text),
  author: mono(10, colors.primary, "bold", { marginTop: 6 }),
  desc: body(13, colors.textMuted, "regular", { marginTop: 6, lineHeight: 19 }),
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1.5) },
  notice: { flexDirection: "row", alignItems: "center", gap: spacing(1), borderWidth: 1, padding: spacing(1.5), marginTop: spacing(2) },
  noticeText: body(13, colors.text, "medium", { flex: 1 }),
  sectionHead: { marginTop: spacing(3), marginBottom: spacing(1.5) },
  list: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), padding: spacing(1.5) },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  exName: body(14, colors.text, "medium"),
  exMeta: mono(9, colors.textMuted, "medium", { marginTop: 2 }),
});
