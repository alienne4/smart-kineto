import * as ImagePicker from "expo-image-picker";
import React, { useLayoutEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, BODY_PARTS, DIFFICULTIES, Exercise } from "../../api/client";
import { PoseCapture } from "../../components/PoseCapture";
import { Card, Chip, Field, Ionicons, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, DIFFICULTY_META, mono, spacing, type as T } from "../../theme";

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

export default function CreateExerciseScreen({ navigation, route }: any) {
  const editing: Exercise | undefined = route?.params?.exercise;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [bodyPart, setBodyPart] = useState<string>(editing?.body_part ?? "SHOULDER");
  const [difficulty, setDifficulty] = useState<string>(editing?.difficulty ?? "EASY");
  const [video, setVideo] = useState<PickedFile | null>(null);
  const [poseJobId, setPoseJobId] = useState<string | null>(null);
  const [poseOutputUrl, setPoseOutputUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Edit exercise" : "New exercise" });
  }, [navigation, editing]);

  async function pickVideo() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1 });
    if (!res.canceled) setVideo(toFormFile(res.assets[0], "video/mp4"));
  }
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
      form.append("difficulty", difficulty);
      if (poseJobId) form.append("pose_job_id", poseJobId);
      else if (video) form.append("video", video as any);
      if (thumbnail) form.append("thumbnail", thumbnail as any);
      if (editing) {
        await api.updateExercise(editing.id, form);
      } else {
        await api.createExercise(form);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field label="TITLE" value={title} onChangeText={setTitle} placeholder="Shoulder external rotation" />
      <Field
        label="DESCRIPTION"
        value={description}
        onChangeText={setDescription}
        placeholder="Cues, tempo, notes…"
        multiline
        style={{ minHeight: 84, textAlignVertical: "top" }}
      />

      <Text style={styles.label}>BODY PART</Text>
      <View style={styles.chips}>
        {BODY_PARTS.map((b) => (
          <Chip key={b} label={BODY_PART_META[b]?.label || b} icon={BODY_PART_META[b]?.icon as any} active={bodyPart === b} onPress={() => setBodyPart(b)} />
        ))}
      </View>

      <Text style={styles.label}>DIFFICULTY</Text>
      <View style={styles.segRow}>
        {DIFFICULTIES.map((d) => {
          const meta = DIFFICULTY_META[d];
          const active = difficulty === d;
          const c = meta?.color || colors.textMuted;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.segCell, { borderColor: active ? c : colors.border, backgroundColor: active ? `${c}26` : colors.surfaceAlt }]}
            >
              <Text style={mono(10, active ? c : colors.textMuted, "bold")}>{(meta?.label || d).toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>DEMONSTRATION VIDEO</Text>
      {poseOutputUrl ? (
        <Card style={styles.mediaCard}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={T.body}>Pose-detected video attached</Text>
            <Text style={T.muted}>The processed playback will be used.</Text>
          </View>
          <Pressable onPress={() => { setPoseJobId(null); setPoseOutputUrl(null); }} hitSlop={10}>
            <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </Card>
      ) : (
        <>
          <PoseCapture
            onUseVideo={(jobId, outputUrl) => {
              setPoseJobId(jobId);
              setPoseOutputUrl(outputUrl);
              setVideo(null);
            }}
          />
          <Card style={[styles.mediaCard, { marginTop: spacing(1.5) }]} onPress={pickVideo}>
            <Ionicons name={video ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={video ? colors.success : colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{video ? "Video file selected" : "…or upload an existing video"}</Text>
              <Text style={T.muted} numberOfLines={1}>{video ? video.name : "Pick a file from your library"}</Text>
            </View>
          </Card>
        </>
      )}
      <Card style={[styles.mediaCard, { marginTop: spacing(1) }]} onPress={pickThumbnail}>
        {thumbnail || editing?.thumbnail ? (
          <Image source={{ uri: thumbnail?.uri || editing?.thumbnail || undefined }} style={styles.thumb} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={T.body}>{thumbnail ? "New thumbnail selected" : editing?.thumbnail ? "Change thumbnail" : "Pick thumbnail"}</Text>
          <Text style={T.muted}>Shown on exercise cards</Text>
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing(3) }} />
      <PrimaryButton title={editing ? "Save changes" : "Save exercise"} icon="save-outline" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  label: { ...T.label, marginBottom: spacing(1), marginTop: spacing(1.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginBottom: spacing(1) },
  segRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(1) },
  segCell: { flex: 1, borderWidth: 1, paddingVertical: spacing(1.25), alignItems: "center" },
  mediaCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  thumb: { width: 48, height: 48, backgroundColor: colors.surfaceHi },
  error: { color: colors.danger, marginTop: spacing(2) },
});
