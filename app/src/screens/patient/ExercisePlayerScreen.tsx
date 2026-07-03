import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Exercise } from "../../api/client";
import { API_BASE_URL } from "../../config";
import { PoseCapture } from "../../components/PoseCapture";
import { Badge, EmptyState, Ionicons, Notice, PrimaryButton, SLabel } from "../../components/ui";
import { BODY_PART_META, colors, DIFFICULTY_META, mono, spacing, type as T } from "../../theme";

interface ExercisePlayerParams {
  exercise: Exercise;
  assignmentId?: string;
  status?: string;
}

export default function ExercisePlayerScreen({ route }: any) {
  const { exercise, assignmentId, status }: ExercisePlayerParams = route.params;
  const meta = BODY_PART_META[exercise.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[exercise.difficulty] || DIFFICULTY_META.EASY;
  const videoUri = useMemo(() => mediaUrl(exercise.video), [exercise.video]);
  const thumbUri = useMemo(() => mediaUrl(exercise.thumbnail), [exercise.thumbnail]);

  const [recordedJobId, setRecordedJobId] = useState<string | null>(null);
  const [recordedOutputUrl, setRecordedOutputUrl] = useState<string | null>(null);

  const player = useVideoPlayer(videoUri ?? null, (playerInstance) => {
    playerInstance.loop = false;
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  const steps = (exercise.description || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.videoWrap}>
        {videoUri ? (
          <VideoView player={player} style={styles.video} nativeControls allowsFullscreen contentFit="contain" />
        ) : thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.video} resizeMode="cover" />
        ) : (
          <View style={styles.video}>
            <EmptyState icon="videocam-off-outline" title="No demo video" subtitle="Follow the written instructions below." />
          </View>
        )}
      </View>

      {videoUri ? (
        <View style={{ marginBottom: spacing(2) }}>
          <PrimaryButton
            title={isPlaying ? "Pause video" : "Play video"}
            icon={isPlaying ? "pause" : "play"}
            onPress={() => (isPlaying ? player.pause() : player.play())}
          />
        </View>
      ) : null}

      <Text style={T.h1}>{exercise.title}</Text>
      <View style={styles.badges}>
        <Badge text={meta.label} />
        <Badge text={diff.label} color={diff.color} />
        {assignmentId ? <Badge text={sessionStatus(status)} color={colors.primary} /> : null}
      </View>

      {steps.length > 0 && (
        <>
          <View style={{ marginTop: spacing(3), marginBottom: spacing(1.5) }}>
            <SLabel n="01" label="Instructions" />
          </View>
          <View style={{ gap: spacing(1.25) }}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepIndex}>
                  <Text style={mono(11, colors.primary, "bold")}>{i + 1}</Text>
                </View>
                <Text style={[T.body, { flex: 1, lineHeight: 20 }]}>{s}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ marginTop: spacing(3), marginBottom: spacing(1.5) }}>
        <SLabel n={steps.length > 0 ? "02" : "01"} label="Record your attempt" />
      </View>
      {recordedOutputUrl ? (
        <Notice text="Recording saved — nice work!" />
      ) : null}
      <PoseCapture
        onUseVideo={(jobId, outputUrl) => {
          setRecordedJobId(jobId);
          setRecordedOutputUrl(outputUrl);
        }}
      />
    </ScrollView>
  );
}

function mediaUrl(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL.replace(/\/api$/, "")}${value.startsWith("/") ? value : `/${value}`}`;
}

function sessionStatus(status?: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  return "Ready";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6) },
  videoWrap: { borderWidth: 1, borderColor: colors.border, marginBottom: spacing(1.5) },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1), marginBottom: spacing(1), flexWrap: "wrap" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(1.25) },
  stepIndex: { width: 22, height: 22, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 2 },
});
