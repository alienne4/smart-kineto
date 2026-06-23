import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api, ApiError, PoseJob } from "../api/client";
import { colors, radius, spacing, type as T } from "../theme";
import { Card, Ionicons, Notice, PrimaryButton, ProgressBar } from "./ui";

interface Recorded {
  uri: string;
  name: string;
  type: string;
}

type Mode = "choose" | "wand" | "capture";

export function PoseCapture({ onUseVideo }: { onUseVideo: (jobId: string, outputUrl: string) => void }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [recorded, setRecorded] = useState<Recorded | null>(null);
  const [job, setJob] = useState<PoseJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = job?.status === "DONE" && !!job.output_video;
  const processing = !!job && (job.status === "PENDING" || job.status === "PROCESSING");
  const playerUri = done ? (job!.output_video as string) : !job && recorded ? recorded.uri : null;

  const player = useVideoPlayer(playerUri, (p) => {
    p.loop = true;
    if (playerUri) p.play();
  });

  // Poll the job until it finishes.
  useEffect(() => {
    if (!job || job.status === "DONE" || job.status === "FAILED") return;
    const t = setInterval(async () => {
      try {
        setJob(await api.getPoseJob(job.id));
      } catch {
        /* keep polling */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.status]);

  async function record() {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission is needed to record.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 30, quality: 1 });
    if (res.canceled) return;
    const a = res.assets[0];
    setRecorded({ uri: a.uri, name: a.fileName || "recording.mp4", type: a.mimeType || "video/mp4" });
  }

  async function runDetection() {
    if (!recorded) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("video", recorded as any);
      setJob(await api.createPoseJob(form));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setJob(null);
    setRecorded(null);
    setError(null);
  }

  if (mode === "choose") {
    return (
      <View style={styles.row}>
        <Pressable style={[styles.option, { borderColor: colors.primary }]} onPress={() => setMode("capture")}>
          <Ionicons name="body-outline" size={26} color={colors.primary} />
          <Text style={styles.optionTitle}>Pose detection</Text>
          <Text style={T.muted}>Record & detect your skeleton</Text>
        </Pressable>
        <Pressable style={[styles.option, { borderColor: colors.accent }]} onPress={() => setMode("wand")}>
          <Ionicons name="bluetooth-outline" size={26} color={colors.accent} />
          <Text style={styles.optionTitle}>SmartKineto wand</Text>
          <Text style={T.muted}>Pair the motion wand</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === "wand") {
    return (
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(1.5) }}>
          <Ionicons name="bluetooth-outline" size={24} color={colors.accent} />
          <Text style={[T.body, { flex: 1 }]}>Bluetooth wand pairing is coming soon — it will stream live motion while you record.</Text>
        </View>
        <View style={{ height: spacing(1.5) }} />
        <PrimaryButton title="Back" variant="ghost" icon="arrow-back-outline" onPress={() => setMode("choose")} />
      </Card>
    );
  }

  // capture mode
  return (
    <Card>
      {error ? <Notice text={error} tone="error" /> : null}

      {done ? (
        <>
          <Text style={styles.heading}>Detected pose playback</Text>
          <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />
          <Text style={[T.muted, { marginTop: spacing(1) }]}>Skeleton detected in {job!.detected_frames} frame(s).</Text>
          <View style={{ height: spacing(1.5) }} />
          <PrimaryButton title="Use this video" icon="checkmark-outline" onPress={() => onUseVideo(job!.id, job!.output_video as string)} />
          <View style={{ height: spacing(1) }} />
          <PrimaryButton title="Record again" variant="ghost" icon="refresh-outline" onPress={reset} />
        </>
      ) : processing ? (
        <>
          <Text style={styles.heading}>Analyzing movement…</Text>
          <ProgressBar value={Math.max(5, job!.progress)} />
          <Text style={[T.muted, { marginTop: spacing(1) }]}>{job!.progress}% · running pose detection on the server</Text>
        </>
      ) : recorded ? (
        <>
          <Text style={styles.heading}>Review your recording</Text>
          <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />
          <View style={{ height: spacing(1.5) }} />
          <PrimaryButton title="Run pose detection" icon="body-outline" loading={uploading} onPress={runDetection} />
          <View style={{ height: spacing(1) }} />
          <PrimaryButton title="Record again" variant="ghost" icon="refresh-outline" onPress={() => setRecorded(null)} />
        </>
      ) : (
        <>
          <Text style={styles.heading}>Record a demonstration</Text>
          <Text style={T.muted}>Film yourself performing the exercise. Keep your whole body in frame.</Text>
          <View style={{ height: spacing(1.5) }} />
          <PrimaryButton title="Open camera" icon="videocam-outline" onPress={record} />
          <View style={{ height: spacing(1) }} />
          <PrimaryButton title="Back" variant="ghost" icon="arrow-back-outline" onPress={() => setMode("choose")} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(1.5) },
  option: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing(2),
    gap: 4,
  },
  optionTitle: { ...T.body, fontWeight: "800", marginTop: spacing(1) },
  heading: { ...T.body, fontWeight: "800", marginBottom: spacing(1) },
  video: { width: "100%", height: 220, borderRadius: radius.sm, backgroundColor: "#000" },
});
