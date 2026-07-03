import React, { useLayoutEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, TrainingProgram } from "../../api/client";
import { EmptyState, Field, Icon, IconTile, Loading, PrimaryButton, SLabel } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { BODY_PART_META, body, colors, mono, spacing } from "../../theme";

export default function CreateProgramScreen({ navigation, route }: any) {
  const editing: TrainingProgram | undefined = route?.params?.program;
  const { data: exercises, loading } = useApi(() => api.listExercises());
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selected, setSelected] = useState<string[]>(
    editing ? [...(editing.program_exercises || [])].sort((a, b) => a.order - b.order).map((pe) => pe.exercise.id) : []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Edit program" : "New program" });
  }, [navigation, editing]);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit() {
    if (!name.trim()) return setError("Program name is required.");
    if (selected.length === 0) return setError("Pick at least one exercise.");
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        program_exercises: selected.map((id, idx) => ({ exercise_id: id, order: idx, sets: 3, reps: 10 })),
      };
      if (editing) {
        await api.updateProgram(editing.id, payload);
      } else {
        await api.createProgram(payload);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save program");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field label="Program name" value={name} onChangeText={setName} placeholder="Knee rehab — week 1" />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Goals, frequency…"
        multiline
        style={{ minHeight: 70, textAlignVertical: "top" }}
      />

      <View style={styles.sectionHead}>
        <SLabel n="01" label="Exercises" right={`${selected.length} selected`} />
      </View>
      {loading && <Loading />}
      {!loading && exercises?.length === 0 && (
        <EmptyState icon="barbell-outline" title="No exercises yet" subtitle="Create exercises first, then build a program." />
      )}
      {exercises && exercises.length > 0 && (
        <View style={styles.list}>
          {exercises.map((ex, i) => {
            const on = selected.includes(ex.id);
            const meta = BODY_PART_META[ex.body_part] || BODY_PART_META.OTHER;
            return (
              <Pressable
                key={ex.id}
                onPress={() => toggle(ex.id)}
                style={[styles.row, i < exercises.length - 1 && styles.rowDivider, on && styles.rowActive]}
              >
                {ex.thumbnail ? <Image source={{ uri: ex.thumbnail }} style={styles.thumb} /> : <IconTile icon={meta.icon as any} size={40} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{ex.title}</Text>
                  <Text style={styles.meta}>
                    {meta.label} · by {ex.author}
                  </Text>
                </View>
                <Icon name={on ? "checkmark-circle" : "add-circle-outline"} size={22} color={on ? colors.primary : colors.textFaint} />
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing(3) }} />
      <PrimaryButton title={editing ? "Save changes" : "Save program"} icon="save-outline" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  sectionHead: { marginTop: spacing(1), marginBottom: spacing(1.5) },
  list: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.25), padding: spacing(1.5), borderLeftWidth: 2, borderLeftColor: "transparent" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowActive: { backgroundColor: `${colors.primary}10`, borderLeftColor: colors.primary },
  thumb: { width: 40, height: 40, backgroundColor: colors.surfaceHi },
  name: body(13, colors.text, "semibold"),
  meta: mono(9, colors.textMuted, "medium", { marginTop: 2 }),
  error: { ...body(13, colors.danger, "medium"), marginTop: spacing(2) },
});
