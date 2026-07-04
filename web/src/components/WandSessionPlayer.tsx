import { useEffect, useState } from "react";

import { api, ApiError, Exercise, RejectionReason, WandFrame, WandRepetitionResult, WandSession } from "../api/client";
import { getWandClient, isWebBluetoothSupported, WandConnectionState } from "../wand";
import { BarChart, Spinner, quality } from "./ui";

type Phase = "checking_template" | "no_template" | "ready" | "active" | "summary";

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

/**
 * Patient-facing live hardware-wand session — mirrors
 * app/src/screens/patient/HardwareExercisePlayerScreen.tsx. Connection is a
 * manual button (Web Bluetooth's `requestDevice()` needs a user gesture).
 */
export default function WandSessionPlayer({
  exercise,
  assignmentId,
  onDone,
}: {
  exercise: Exercise;
  assignmentId?: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("checking_template");
  const [connection, setConnection] = useState<WandConnectionState>("disconnected");
  const [connecting, setConnecting] = useState(false);
  const [session, setSession] = useState<WandSession | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [lastResult, setLastResult] = useState<WandRepetitionResult | null>(null);
  const [history, setHistory] = useState<WandRepetitionResult[]>([]);
  const [starting, setStarting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getWandClient();
    setConnection(client.getState());
    const unsubscribe = client.onStateChange(setConnection);

    api
      .getWandTemplate(exercise.id)
      .then(() => setPhase("ready"))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setPhase("no_template");
        else {
          setError("Could not check the reference template.");
          setPhase("no_template");
        }
      });

    return () => {
      unsubscribe();
      client.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  async function connectWand() {
    setError(null);
    setConnecting(true);
    try {
      await getWandClient().connect();
    } catch (e: any) {
      setError(e?.message || "Could not connect to the wand.");
    } finally {
      setConnecting(false);
    }
  }

  async function startSession() {
    setStarting(true);
    setError(null);
    try {
      const created = await api.startWandSession({ exercise_id: exercise.id, assignment_id: assignmentId });
      setSession(created);
      setHistory([]);
      setPhase("active");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setPhase("no_template");
      else setError(e instanceof ApiError ? e.message : "Could not start the session.");
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
      if (updated.status === "COMPLETED") setPhase("summary");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not score that repetition.");
    } finally {
      setScoring(false);
    }
  }

  const connected = connection === "connected";

  if (phase === "checking_template") return <Spinner />;

  if (phase === "no_template") {
    return (
      <div className="card" style={{ background: "var(--surface-alt)" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>No reference movement yet</div>
        <div className="muted">{error || "Your trainer needs to record a reference movement for this exercise before you can use it."}</div>
      </div>
    );
  }

  if (!isWebBluetoothSupported()) {
    return <div className="error-text">This browser doesn't support Web Bluetooth. Use Chrome or Edge (desktop or Android).</div>;
  }

  return (
    <div>
      <div className="row" style={{ gap: 10, alignItems: "center", marginBottom: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: connected ? "var(--success)" : "var(--warning)", display: "inline-block" }} />
        <span className="muted">{connecting ? "Connecting…" : connected ? "Wand connected" : "Wand disconnected"}</span>
        {!connected && (
          <button type="button" className="btn ghost sm" disabled={connecting} onClick={connectWand} style={{ marginLeft: "auto" }}>
            Connect wand
          </button>
        )}
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      {phase === "ready" && (
        <>
          <p style={{ marginBottom: 14 }}>
            Perform {exercise.target_reps} correct repetitions. Each one is compared against your trainer's reference movement.
          </p>
          <button className="btn" disabled={starting || !connected} onClick={startSession}>
            {starting ? "Starting…" : !connected ? "Connect the wand first" : "Start session"}
          </button>
        </>
      )}

      {(phase === "active" || phase === "summary") && session && (
        <>
          <div className="muted" style={{ marginBottom: 10 }}>
            {session.valid_reps}/{session.target_reps} valid reps
            {session.invalid_reps > 0 ? ` · ${session.invalid_reps} rejected` : ""}
          </div>
          <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {history.map((r, i) => (
              <span
                key={i}
                style={{
                  width: 14, height: 14, borderRadius: 999,
                  background: r.is_valid ? "var(--success)" : "var(--danger)",
                }}
              />
            ))}
            {Array.from({ length: Math.max(0, session.target_reps - history.length) }, (_, i) => (
              <span key={`empty-${i}`} style={{ width: 14, height: 14, borderRadius: 999, background: "var(--surface-hi)", border: "1px solid var(--border)" }} />
            ))}
          </div>

          {lastResult && (
            <div className="card" style={{ background: "var(--surface-alt)", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Rep {lastResult.index + 1}: {lastResult.is_valid ? "Valid" : "Rejected"}
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="muted">Movement similarity</span>
                <strong style={{ color: quality(lastResult.movement_similarity) }}>{Math.round(lastResult.movement_similarity)}%</strong>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="muted">Graph score</span>
                <strong style={{ color: quality(lastResult.graph_score) }}>{Math.round(lastResult.graph_score)}%</strong>
              </div>
              <div className={lastResult.is_valid ? "muted" : "error-text"}>{feedbackFor(lastResult)}</div>
            </div>
          )}

          {phase === "active" ? (
            <button className="btn" disabled={scoring || !connected} onClick={toggleCapture}>
              {scoring ? "Scoring…" : capturing ? "■ Stop repetition" : "● Start repetition"}
            </button>
          ) : (
            <>
              <h3 style={{ marginBottom: 10 }}>Session summary</h3>
              <BarChart data={history.map((r, i) => ({ label: `${i + 1}`, value: r.movement_similarity }))} color="var(--primary)" max={100} />
              <button className="btn" style={{ marginTop: 18 }} onClick={onDone}>Done</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
