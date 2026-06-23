import { useFocusEffect } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, Exercise } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, EmptyState, IconTile, Ionicons, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, DIFFICULTY_META, radius, spacing, type as T } from "../../theme";

export default function ExerciseDetailScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise>(route.params.exercise);
  const meta = BODY_PART_META[exercise.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[exercise.difficulty] || DIFFICULTY_META.EASY;
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const mine = !exercise.is_template && exercise.created_by?.id === user?.id;

  useFocusEffect(
    useCallback(() => {
      api.getExercise(exercise.id).then(setExercise).catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercise.id])
  );

  const player = useVideoPlayer(exercise.video ?? null, (p) => {
    p.loop = true;
  });

  async function clone() {
    setCloning(true);
    try {
      await api.cloneExercise(exercise.id);
      Alert.alert("Saved ✓", "A copy was added to your exercises. You can edit it from there.");
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
      const updated = await api.publishExercise(exercise.id);
      setExercise(updated);
      Alert.alert("Submitted ✓", "Your exercise was sent for admin review. Once approved it appears in the public library.");
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not publish");
    } finally {
      setPublishing(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete exercise", `Delete “${exercise.title}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await api.deleteExercise(exercise.id);
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
      <View style={styles.head}>
        {exercise.thumbnail ? (
          <Image source={{ uri: exercise.thumbnail }} style={styles.thumb} />
        ) : (
          <IconTile icon={meta.icon as any} grad={meta.grad} size={56} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={T.h1}>{exercise.title}</Text>
          <Text style={styles.author}>by {exercise.author}</Text>
          <View style={styles.badges}>
            <Badge text={meta.label} />
            <Badge text={diff.label} color={diff.color} />
            {exercise.is_template ? <Badge text="LIBRARY" color={colors.accent} /> : null}
          </View>
        </View>
      </View>

      {mine ? <PublishRow status={exercise.review_status} isPublic={exercise.is_public} /> : null}

      {exercise.video ? (
        <VideoView player={player} style={styles.video} nativeControls allowsFullscreen contentFit="contain" />
      ) : exercise.thumbnail ? (
        <Image source={{ uri: exercise.thumbnail }} style={styles.video} resizeMode="cover" />
      ) : (
        <EmptyState icon="videocam-off-outline" title="No demo media" subtitle="Add a video or image when editing." />
      )}

      {exercise.description ? (
        <>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.desc}>{exercise.description}</Text>
        </>
      ) : null}

      <View style={{ height: spacing(3) }} />
      {mine ? (
        <>
          <PrimaryButton title="Edit exercise" icon="create-outline" onPress={() => navigation.navigate("CreateExercise", { exercise })} />
          <View style={{ height: spacing(1.25) }} />
          {exercise.review_status !== "PENDING" && !exercise.is_public ? (
            <PrimaryButton title="Publish to public library" variant="ghost" icon="cloud-upload-outline" onPress={publish} loading={publishing} />
          ) : null}
          <View style={{ height: spacing(1.25) }} />
          <PrimaryButton title="Delete exercise" variant="danger" icon="trash-outline" onPress={confirmDelete} loading={deleting} />
        </>
      ) : (
        <PrimaryButton title="Save a copy to my exercises" icon="copy-outline" onPress={clone} loading={cloning} />
      )}
    </ScrollView>
  );
}

function PublishRow({ status, isPublic }: { status?: string; isPublic?: boolean }) {
  if (isPublic) return <View style={styles.notice}><Ionicons name="globe-outline" size={18} color={colors.success} /><Text style={styles.noticeText}>Published in the public library</Text></View>;
  if (status === "PENDING") return <View style={styles.notice}><Ionicons name="time-outline" size={18} color={colors.warning} /><Text style={styles.noticeText}>Pending admin review</Text></View>;
  if (status === "REJECTED") return <View style={styles.notice}><Ionicons name="close-circle-outline" size={18} color={colors.danger} /><Text style={styles.noticeText}>Not approved — you can edit and resubmit</Text></View>;
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  head: { flexDirection: "row", gap: spacing(1.5), alignItems: "center", marginBottom: spacing(2) },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceHi },
  author: { ...T.muted, marginTop: 2, color: colors.primary, fontWeight: "700" },
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1), flexWrap: "wrap" },
  video: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: radius.md },
  label: { ...T.label, marginTop: spacing(3), marginBottom: spacing(0.5) },
  desc: { ...T.body, lineHeight: 22, color: colors.text },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(1.5),
    marginBottom: spacing(2),
  },
  noticeText: { ...T.muted, color: colors.text, flex: 1 },
});
