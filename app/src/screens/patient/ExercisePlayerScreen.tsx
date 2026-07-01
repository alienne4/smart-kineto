import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, Exercise, LiveFeedback, MEDIA_ROOT } from "../../api/client";
import { createLiveSessionSocket, LiveSessionController } from "../../ble/session";
import { Badge, Card, EmptyState, IconTile, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, DIFFICULTY_META, gradients, radius, spacing, type as T } from "../../theme";

type RouteParams = {
  exercise: Exercise;
  assignmentId?: string;
  sessionId?: string;
};

export default function ExercisePlayerScreen({ route }: any) {
  const params = route.params as RouteParams;
  const exercise = params.exercise;
  const meta = BODY_PART_META[exercise.body_part || "OTHER"] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[exercise.difficulty || "EASY"] || DIFFICULTY_META.EASY;
  const videoUri = useMemo(() => mediaUrl(exercise.video), [exercise.video]);
  const thumbUri = useMemo(() => mediaUrl(exercise.thumbnail), [exercise.thumbnail]);
  const [sessionId, setSessionId] = useState(params.sessionId || "");
  const [socketStatus, setSocketStatus] = useState<"idle" | "connecting" | "connected" | "disconnected" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [cue, setCue] = useState("Waiting for movement data");
  const controllerRef = useRef<LiveSessionController | null>(null);

  const player = useVideoPlayer(videoUri, (instance) => {
    instance.loop = false;
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  useEffect(() => {
    return () => {
      controllerRef.current?.disconnect();
    };
  }, []);

  async function startLiveSession() {
    setBusy(true);
    try {
      const session = sessionId ? { id: sessionId } : await api.createSession(params.assignmentId);
      setSessionId(session.id);
      const url = await api.socketUrl(session.id);
      const controller = createLiveSessionSocket({
        url,
        onStatus: (status) => setSocketStatus(status),
        onFeedback: handleFeedback
      });
      controllerRef.current = controller;
      await controller.connect();
      player.play();
    } catch (error) {
      setSocketStatus("error");
      setCue(error instanceof Error ? error.message : "Could not start live scoring");
    } finally {
      setBusy(false);
    }
  }

  async function stopLiveSession() {
    controllerRef.current?.disconnect();
    controllerRef.current = null;
    setSocketStatus("disconnected");
    player.pause();
    if (sessionId) {
      api.finishSession(sessionId).catch(() => {});
    }
  }

  function handleFeedback(feedback: LiveFeedback) {
    if (typeof feedback.running_score === "number") setScore(Math.round(feedback.running_score));
    if (typeof feedback.score === "number") setScore(Math.round(feedback.score));
    if (feedback.cue) setCue(formatCue(feedback.cue));
    if (feedback.type === "final") setCue("Session complete");
  }

  const connected = socketStatus === "connected";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {videoUri ? (
        <VideoView player={player} style={styles.video} nativeControls allowsFullscreen contentFit="contain" />
      ) : thumbUri ? (
        <Image source={{ uri: thumbUri }} style={styles.video} resizeMode="cover" />
      ) : (
        <EmptyState icon="videocam-off-outline" title="No demo video" subtitle="Follow the written instructions below." />
      )}

      <View style={styles.head}>
        {thumbUri ? <Image source={{ uri: thumbUri }} style={styles.thumbSmall} /> : <IconTile icon={meta.icon} grad={meta.grad} size={50} />}
        <View style={{ flex: 1 }}>
          <Text style={T.h1}>{exercise.title}</Text>
          <View style={styles.badges}>
            <Badge text={meta.label} />
            <Badge text={diff.label} color={diff.color} />
          </View>
        </View>
      </View>

      <Card style={styles.hud}>
        <View style={styles.scoreCircle}>
          <Text style={styles.score}>{score ?? "--"}</Text>
          <Text style={styles.scoreLabel}>score</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.liveLabel}>LIVE SESSION</Text>
          <Text style={T.h2}>{statusLabel(socketStatus)}</Text>
          <Text style={[T.muted, { marginTop: 4 }]}>{cue}</Text>
        </View>
      </Card>

      <View style={styles.controls}>
        <PrimaryButton
          title={connected ? "End session" : "Start live"}
          icon={connected ? "stop" : "radio"}
          loading={busy}
          variant={connected ? "danger" : "primary"}
          onPress={connected ? stopLiveSession : startLiveSession}
        />
        {videoUri ? (
          <PrimaryButton
            title={isPlaying ? "Pause video" : "Play video"}
            icon={isPlaying ? "pause" : "play"}
            variant="ghost"
            onPress={() => (isPlaying ? player.pause() : player.play())}
          />
        ) : null}
      </View>

      <Card style={styles.sensorCard}>
        <View style={styles.sensorRow}>
          <IconTile icon="bluetooth" grad={gradients.violet} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={T.body}>Sensor stream</Text>
            <Text style={T.muted}>BLE frames are forwarded through the live session socket.</Text>
          </View>
          <View style={[styles.dot, connected && { backgroundColor: colors.success }]} />
        </View>
      </Card>

      {exercise.description ? (
        <>
          <Text style={styles.label}>INSTRUCTIONS</Text>
          <Text style={styles.desc}>{exercise.description}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function mediaUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${MEDIA_ROOT}${value.startsWith("/") ? value : `/${value}`}`;
}

function statusLabel(status: string) {
  switch (status) {
    case "connecting":
      return "Connecting to scorer";
    case "connected":
      return "Scoring in progress";
    case "disconnected":
      return "Session paused";
    case "error":
      return "Connection issue";
    default:
      return "Ready to start";
  }
}

function formatCue(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (first) => first.toUpperCase());
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6) },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: radius.md,
    marginBottom: spacing(2),
    overflow: "hidden"
  },
  thumbSmall: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.surfaceHi },
  head: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2) },
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1), flexWrap: "wrap" },
  hud: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(2) },
  scoreCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: colors.borderHi,
    backgroundColor: colors.surfaceHi,
    alignItems: "center",
    justifyContent: "center"
  },
  score: { color: colors.primary, fontSize: 28, fontWeight: "900" },
  scoreLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  liveLabel: { ...T.label, color: colors.primary },
  controls: { gap: spacing(1.25), marginBottom: spacing(2) },
  sensorCard: { marginBottom: spacing(2) },
  sensorRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.warning },
  label: { ...T.label, marginTop: spacing(3), marginBottom: spacing(0.5) },
  desc: { ...T.body, lineHeight: 22 }
});
