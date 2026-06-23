import React, { useLayoutEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, TrainingProgram } from "../../api/client";
import { Badge, Card, EmptyState, Field, IconTile, Ionicons, Loading, PrimaryButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { BODY_PART_META, colors, spacing, type as T } from "../../theme";

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
      <Field label="PROGRAM NAME" value={name} onChangeText={setName} placeholder="Knee rehab — week 1" />
      <Field
        label="DESCRIPTION"
        value={description}
        onChangeText={setDescription}
        placeholder="Goals, frequency…"
        multiline
        style={{ minHeight: 70, textAlignVertical: "top" }}
      />

      <Text style={styles.label}>EXERCISES · {selected.length} selected</Text>
      {loading && <Loading />}
      {!loading && exercises?.length === 0 && (
        <EmptyState icon="barbell-outline" title="No exercises yet" subtitle="Create exercises first, then build a program." />
      )}
      {exercises?.map((ex) => {
        const on = selected.includes(ex.id);
        const meta = BODY_PART_META[ex.body_part] || BODY_PART_META.OTHER;
        return (
          <Card key={ex.id} onPress={() => toggle(ex.id)} style={[styles.row, on && { borderColor: colors.primary }]}>
            {ex.thumbnail ? (
              <Image source={{ uri: ex.thumbnail }} style={styles.thumb} />
            ) : (
              <IconTile icon={meta.icon as any} grad={meta.grad} size={40} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{ex.title}</Text>
              <Text style={T.muted}>{meta.label} · by {ex.author}</Text>
            </View>
            <Ionicons name={on ? "checkmark-circle" : "add-circle-outline"} size={26} color={on ? colors.primary : colors.textFaint} />
          </Card>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing(3) }} />
      <PrimaryButton title={editing ? "Save changes" : "Save program"} icon="save-outline" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  label: { ...T.label, marginVertical: spacing(1) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.25), marginBottom: spacing(1.25) },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceHi },
  error: { color: colors.danger, marginTop: spacing(2) },
});
