import * as Speech from "expo-speech";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError, Exercise, RejectionReason, WandFrame, WandRepetitionResult, WandSession } from "../../api/client";
import { Badge, BarChart, Card, EmptyState, Loading, Notice, PrimaryButton, RepDot } from "../../components/ui";
import { colors, quality, spacing, type as T } from "../../theme";
import { getWandClient, WandConnectionState } from "../../wand";

interface Params {
  exercise: Exercise;
  assignmentId?: string;
}

type Phase = "connecting" | "checking_template" | "no_template" | "ready" | "active" | "summary";

const REASON_FEEDBACK: Record<RejectionReason, string> = {
  TOO_SHORT: "That was too short. Try a fuller movement.",
  TOO_FAST: "Slow down a little.",
  TOO_SLOW: "Try to move a bit faster.",
  UNSTABLE: "Keep the movement steady and controlled.",
  WRONG_DIRECTION: "That went the wrong direction. Follow the trainer's movement.",
  INCOMPLETE: "Try to move through the full range of motion.",
  LOW_SIMILARITY: "Not quite matching the reference movement. Let's try again.",
};

function feedbackFor(result: WandRepetitionResult): string {
  if (result.is_valid) return "Nice rep!";
  return REASON_FEEDBACK[result.rejection_reason as RejectionReason] || "Let's try that one again.";
}

export default function HardwareExercisePlayerScreen({ route, navigation }: any) {
  const { exercise, assignmentId }: Params = route.params;
  const [phase, setPhase] = useState<Phase>("connecting");
  const [connection, setConnection] = useState<WandConnectionState>("disconnected");
  const [session, setSession] = useState<WandSession | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [lastResult, setLastResult] = useState<WandRepetitionResult | null>(null);
  const [history, setHistory] = useState<WandRepetitionResult[]>([]);
  const [starting, setStarting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Live session" });
  }, [navigation]);

  useEffect(() => {
    const client = getWandClient();
    setConnection(client.getState());
    const unsubscribe = client.onStateChange(setConnection);

    (async () => {
      try {
        await client.connect();
        setPhase("checking_template");
        await api.getWandTemplate(exercise.id);
        setPhase("ready");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setPhase("no_template");
        } else {
          setError("Could not connect to the wand.");
          setPhase("no_template");
        }
      }
    })();

    return () => {
      unsubscribe();
      client.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  async function startSession() {
    setStarting(true);
    setError(null);
    try {
      const created = await api.startWandSession({ exercise_id: exercise.id, assignment_id: assignmentId });
      setSession(created);
      setHistory([]);
      setPhase("active");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setPhase("no_template");
      } else {
        setError(e instanceof ApiError ? e.message : "Could not start the session.");
      }
    } finally {
      setStarting(false);
    }
  }

  function toggleCapture() {
    const client = getWandClient();
    if (capturing) {
      const capture = client.stopCapture();
      setCapturing(false);
      submitRepetition(capture.frames as WandFrame[], capture.duration_ms);
    } else {
      setError(null);
      setLastResult(null);
      client.startCapture();
      setCapturing(true);
    }
  }

  async function submitRepetition(frames: WandFrame[], duration_ms: number) {
    if (!session) return;
    setScoring(true);
    try {
      const { repetition, session: updated } = await api.submitWandRepetition(session.id, { frames, duration_ms });
      setSession(updated);
      setLastResult(repetition);
      setHistory((prev) => [...prev, repetition]);
      Speech.speak(feedbackFor(repetition));
      if (updated.status === "COMPLETED") {
        setPhase("summary");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not score that repetition.");
    } finally {
      setScoring(false);
    }
  }

  if (phase === "connecting" || phase === "checking_template") {
    return (
      <View style={styles.screen}>
        <Loading />
        <Text style={[T.muted, { textAlign: "center" }]}>
          {phase === "connecting" ? "Connecting to the wand…" : "Checking for a trainer reference…"}
        </Text>
      </View>
    );
  }

  if (phase === "no_template") {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="bluetooth-outline"
          title="No reference movement yet"
          subtitle={error || "Your trainer needs to record a reference movement for this exercise before you can use it."}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={T.h1}>{exercise.title}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: connection === "connected" ? colors.success : colors.warning }]} />
        <Text style={T.muted}>{connection === "connected" ? "Wand connected" : "Wand disconnected"}</Text>
      </View>

      {error ? <Notice text={error} tone="error" /> : null}

      {phase === "ready" && (
        <>
          <Text style={[T.body, { marginBottom: spacing(2) }]}>
            Perform {exercise.target_reps} correct repetitions. Each one is compared against your trainer's reference movement.
          </Text>
          <PrimaryButton title="Start session" icon="play-outline" onPress={startSession} loading={starting} />
        </>
      )}

      {(phase === "active" || phase === "summary") && session && (
        <>
          <Text style={[T.muted, { marginTop: spacing(1) }]}>
            {session.valid_reps}/{session.target_reps} valid reps
            {session.invalid_reps > 0 ? ` · ${session.invalid_reps} rejected` : ""}
          </Text>
          <View style={styles.repRow}>
            {history.map((r, i) => (
              <RepDot key={i} ok={r.is_valid} />
            ))}
            {Array.from({ length: Math.max(0, session.target_reps - history.length) }, (_, i) => (
              <RepDot key={`empty-${i}`} ok={false} />
            ))}
          </View>

          {lastResult && (
            <Card style={{ marginTop: spacing(1.5) }}>
              <Text style={[T.body, { fontWeight: "700", marginBottom: spacing(1) }]}>
                Rep {lastResult.index + 1}: {lastResult.is_valid ? "Valid" : "Rejected"}
              </Text>
              <ScoreRow label="Movement similarity" value={lastResult.movement_similarity} />
              <ScoreRow label="Graph score" value={lastResult.graph_score} />
              {!lastResult.is_valid && lastResult.rejection_reason ? (
                <Notice text={feedbackFor(lastResult)} tone="error" />
              ) : null}
            </Card>
          )}

          {phase === "active" ? (
            <View style={{ marginTop: spacing(2) }}>
              <PrimaryButton
                title={capturing ? "Stop repetition" : "Start repetition"}
                icon={capturing ? "checkmark-outline" : "play-outline"}
                onPress={toggleCapture}
                loading={scoring}
                disabled={scoring}
              />
            </View>
          ) : (
            <View style={{ marginTop: spacing(3) }}>
              <Text style={[T.h2, { marginBottom: spacing(1.5) }]}>Session summary</Text>
              <BarChart
                data={history.map((r, i) => ({ label: `${i + 1}`, value: r.movement_similarity }))}
                max={100}
              />
              <View style={{ height: spacing(2) }} />
              <PrimaryButton title="Done" icon="checkmark-outline" onPress={() => navigation.goBack()} />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={T.muted}>{label}</Text>
      <Badge text={`${Math.round(value)}%`} color={quality(value)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6) },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(0.5), marginBottom: spacing(2) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  repRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginTop: spacing(1) },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing(0.75) },
});
