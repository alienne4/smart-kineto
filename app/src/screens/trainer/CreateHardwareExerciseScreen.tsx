import * as ImagePicker from "expo-image-picker";
import React, { useLayoutEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, BODY_PARTS, Exercise } from "../../api/client";
import { Card, Chip, Field, Ionicons, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, mono, spacing, type as T } from "../../theme";

interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

function toFormFile(asset: ImagePicker.ImagePickerAsset, fallbackType: string): PickedFile {
  const uri = asset.uri;
  const name = asset.fileName || uri.split("/").pop() || "upload";
  const type = asset.mimeType || fallbackType;
  return { uri, name, type };
}

const MIN_REPS = 3;
const MAX_REPS = 30;

/**
 * Trainer flow for the early-stage/hardware-wand exercise family — no video, no camera,
 * no difficulty picker (always basic/easy). Saving routes straight into recording the
 * trainer reference movement, since a wand exercise isn't usable until one exists.
 */
export default function CreateHardwareExerciseScreen({ navigation, route }: any) {
  const editing: Exercise | undefined = route?.params?.exercise;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [bodyPart, setBodyPart] = useState<string>(editing?.body_part ?? "WRIST");
  const [targetReps, setTargetReps] = useState<number>(editing?.target_reps ?? 10);
  const [thumbnail, setThumbnail] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Edit hardware exercise" : "New hardware exercise" });
  }, [navigation, editing]);

  async function pickThumbnail() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled) setThumbnail(toFormFile(res.assets[0], "image/jpeg"));
  }

  async function submit() {
    if (!title.trim()) return setError("Title is required.");
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("body_part", bodyPart);
      form.append("difficulty", "EASY");
      form.append("stage", "EARLY_STAGE");
      form.append("tracking_method", "HARDWARE_WAND");
      form.append("target_reps", String(targetReps));
      if (thumbnail) form.append("thumbnail", thumbnail as any);

      const saved = editing ? await api.updateExercise(editing.id, form) : await api.createExercise(form);

      if (editing) {
        navigation.goBack();
      } else {
        navigation.replace("RecordWandTemplate", { exercise: saved });
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field label="TITLE" value={title} onChangeText={setTitle} placeholder="Wrist flexion / extension" />
      <Field
        label="DESCRIPTION"
        value={description}
        onChangeText={setDescription}
        placeholder="Cues for the patient…"
        multiline
        style={{ minHeight: 84, textAlignVertical: "top" }}
      />

      <Text style={styles.label}>BODY PART</Text>
      <View style={styles.chips}>
        {BODY_PARTS.map((b) => (
          <Chip key={b} label={BODY_PART_META[b]?.label || b} icon={BODY_PART_META[b]?.icon as any} active={bodyPart === b} onPress={() => setBodyPart(b)} />
        ))}
      </View>

      <Text style={styles.label}>TARGET REPETITIONS</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => setTargetReps((n) => Math.max(MIN_REPS, n - 1))}
        >
          <Ionicons name="add" size={18} color={colors.text} style={{ transform: [{ rotate: "45deg" }] }} />
        </Pressable>
        <Text style={styles.stepperValue}>{targetReps}</Text>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => setTargetReps((n) => Math.min(MAX_REPS, n + 1))}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.label}>THUMBNAIL</Text>
      <Card style={styles.mediaCard} onPress={pickThumbnail}>
        {thumbnail || editing?.thumbnail ? (
          <Image source={{ uri: thumbnail?.uri || editing?.thumbnail || undefined }} style={styles.thumb} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={T.body}>{thumbnail ? "New thumbnail selected" : editing?.thumbnail ? "Change thumbnail" : "Pick thumbnail (optional)"}</Text>
          <Text style={T.muted}>Shown on exercise cards</Text>
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing(3) }} />
      <PrimaryButton
        title={editing ? "Save changes" : "Save & record reference"}
        icon={editing ? "save-outline" : "bluetooth-outline"}
        onPress={submit}
        loading={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  label: { ...T.label, marginBottom: spacing(1), marginTop: spacing(1.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginBottom: spacing(1) },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(1) },
  stepperBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { ...mono(20, colors.text, "bold"), minWidth: 40, textAlign: "center" },
  mediaCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  thumb: { width: 48, height: 48, backgroundColor: colors.surfaceHi },
  error: { color: colors.danger, marginTop: spacing(2) },
});
