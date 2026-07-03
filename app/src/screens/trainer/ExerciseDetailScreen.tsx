import { useFocusEffect } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, Exercise } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, EmptyState, Icon, IconName, IconTile, PrimaryButton, SLabel } from "../../components/ui";
import { BODY_PART_META, body, colors, DIFFICULTY_META, disp, mono, spacing } from "../../theme";

function StatusNotice({ icon, text, color }: { icon: IconName; text: string; color: string }) {
  return (
    <View style={[styles.notice, { borderColor: color, backgroundColor: `${color}12` }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.noticeText, { color }]}>{text}</Text>
    </View>
  );
}

export default function ExerciseDetailScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise>(route.params.exercise);
  const meta = BODY_PART_META[exercise.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[exercise.difficulty] || DIFFICULTY_META.EASY;
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const mine = !exercise.is_template && exercise.created_by?.id === user?.id;
  const isWand = exercise.tracking_method === "HARDWARE_WAND";

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
        {exercise.thumbnail ? <Image source={{ uri: exercise.thumbnail }} style={styles.thumb} /> : <IconTile icon={meta.icon as any} size={56} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{exercise.title}</Text>
          <Text style={styles.author}>by {exercise.author}</Text>
          <View style={styles.badges}>
            <Badge text={meta.label} />
            <Badge text={diff.label} color={diff.color} />
            {exercise.is_template ? <Badge text="Library" /> : null}
          </View>
        </View>
      </View>

      {mine ? <PublishRow status={exercise.review_status} isPublic={exercise.is_public} /> : null}

      {exercise.tracking_method === "HARDWARE_WAND" ? (
        exercise.has_trainer_template ? (
          <StatusNotice icon="checkmark-circle" text="Reference template ready" color={colors.success} />
        ) : (
          <StatusNotice icon="alert-triangle" text="No reference template yet — patients can't use this until you record one" color={colors.warning} />
        )
      ) : exercise.video ? (
        <VideoView player={player} style={styles.video} nativeControls allowsFullscreen contentFit="contain" />
      ) : exercise.thumbnail ? (
        <Image source={{ uri: exercise.thumbnail }} style={styles.video} resizeMode="cover" />
      ) : (
        <EmptyState icon="videocam-off-outline" title="No demo media" subtitle="Add a video or image when editing." />
      )}

      {exercise.description ? (
        <>
          <View style={styles.sectionHead}>
            <SLabel n="01" label="Description" />
          </View>
          <Text style={styles.desc}>{exercise.description}</Text>
        </>
      ) : null}

      <View style={{ height: spacing(3) }} />
      {mine ? (
        <>
          {isWand ? (
            <>
              <PrimaryButton
                title={exercise.has_trainer_template ? "Re-record reference template" : "Record reference template"}
                icon="bluetooth-outline"
                onPress={() => navigation.navigate("RecordWandTemplate", { exercise })}
              />
              <View style={{ height: spacing(1.25) }} />
            </>
          ) : null}
          <PrimaryButton
            title="Edit exercise"
            icon="create-outline"
            onPress={() => navigation.navigate(isWand ? "CreateHardwareExercise" : "CreateExercise", { exercise })}
          />
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
  if (isPublic) return <StatusNotice icon="globe-outline" text="Published in the public library" color={colors.success} />;
  if (status === "PENDING") return <StatusNotice icon="time-outline" text="Pending admin review" color={colors.warning} />;
  if (status === "REJECTED") return <StatusNotice icon="close-circle-outline" text="Not approved — you can edit and resubmit" color={colors.danger} />;
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  head: { flexDirection: "row", gap: spacing(1.5), alignItems: "center", marginBottom: spacing(2) },
  thumb: { width: 56, height: 56, backgroundColor: colors.surfaceHi },
  title: disp(22, colors.text),
  author: mono(9, colors.primary, "bold", { marginTop: 4 }),
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1), flexWrap: "wrap" },
  video: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderWidth: 1, borderColor: colors.border },
  sectionHead: { marginTop: spacing(3), marginBottom: spacing(1) },
  desc: body(14, colors.text, "regular", { lineHeight: 21 }),
  notice: { flexDirection: "row", alignItems: "center", gap: spacing(1), borderWidth: 1, padding: spacing(1.5), marginBottom: spacing(2) },
  noticeText: body(13, colors.text, "medium", { flex: 1 }),
});
