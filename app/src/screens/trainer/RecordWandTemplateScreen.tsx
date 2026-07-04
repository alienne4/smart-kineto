import React, { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, Exercise, WandFrame } from "../../api/client";
import { Card, Notice, PrimaryButton, RepDot } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";
import { getWandClient, WandCaptureResult, WandConnectionState } from "../../wand";

const TEMPLATE_REPS = 3;

/** Trainer records TEMPLATE_REPS clean repetitions of the correct movement; the
 * backend averages them into the exercise's reference template. */
export default function RecordWandTemplateScreen({ navigation, route }: any) {
  const exercise: Exercise = route.params.exercise;
  const [connection, setConnection] = useState<WandConnectionState>("disconnected");
  const [recordings, setRecordings] = useState<WandCaptureResult[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Record reference" });
  }, [navigation]);

  useEffect(() => {
    const client = getWandClient();
    setConnection(client.getState());
    const unsubscribe = client.onStateChange(setConnection);
    client.connect().catch(() => setError("Could not connect to the wand."));
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  function toggleCapture() {
    const client = getWandClient();
    if (capturing) {
      const result = client.stopCapture();
      setCapturing(false);
      if (result.frames.length < 5) {
        setError("That repetition was too short — try again.");
        return;
      }
      setError(null);
      setRecordings((prev) => [...prev, result]);
    } else {
      setError(null);
      client.startCapture();
      setCapturing(true);
    }
  }

  async function saveTemplate() {
    setSaving(true);
    setError(null);
    try {
      await api.createWandTemplate({
        exercise_id: exercise.id,
        repetitions: recordings.map((r) => ({ frames: r.frames as WandFrame[], duration_ms: r.duration_ms })),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the reference template.");
    } finally {
      setSaving(false);
    }
  }

  const connected = connection === "connected";
  const collected = recordings.length;
  const readyToSave = collected >= TEMPLATE_REPS;

  if (done) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Notice text="Reference template saved. Patients can now use this exercise." />
        <PrimaryButton title="Done" icon="checkmark-outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={T.h2}>{exercise.title}</Text>
      <Text style={[T.muted, { marginTop: 4, marginBottom: spacing(2) }]}>
        Connect the wand, then perform {TEMPLATE_REPS} clean, correct repetitions of the movement.
      </Text>

      <Card style={styles.statusCard}>
        <View style={[styles.dot, { backgroundColor: connected ? colors.success : colors.warning }]} />
        <Text style={T.body}>
          {connection === "connecting" ? "Connecting to wand…" : connected ? "Wand connected" : "Wand disconnected"}
        </Text>
      </Card>

      <View style={styles.repRow}>
        {Array.from({ length: TEMPLATE_REPS }, (_, i) => (
          <RepDot key={i} ok={i < collected} />
        ))}
      </View>
      <Text style={[T.muted, { marginBottom: spacing(2) }]}>{collected}/{TEMPLATE_REPS} repetitions recorded</Text>

      {error ? <Notice text={error} tone="error" /> : null}

      {!readyToSave ? (
        <PrimaryButton
          title={capturing ? "Stop repetition" : "Start repetition"}
          icon={capturing ? "checkmark-outline" : "play-outline"}
          onPress={toggleCapture}
          disabled={!connected}
        />
      ) : (
        <PrimaryButton title="Save reference template" icon="save-outline" onPress={saveTemplate} loading={saving} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  statusCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2.5) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  repRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(1) },
});
