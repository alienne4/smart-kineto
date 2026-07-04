import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, ApiError, WandFrame } from "../../api/client";
import { Spinner, useApi } from "../../components/ui";
import { getWandClient, isWebBluetoothSupported, WandCaptureResult, WandConnectionState } from "../../wand";

const TEMPLATE_REPS = 3;

/**
 * Trainer records TEMPLATE_REPS clean repetitions of the correct movement; the
 * backend averages them into the exercise's reference template. Mirrors
 * app/src/screens/trainer/RecordWandTemplateScreen.tsx, but the "connect"
 * step is an explicit button (Web Bluetooth's `requestDevice()` requires a
 * user gesture, so it can't be triggered automatically on mount).
 */
export default function RecordWandTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: exercise, loading } = useApi(() => api.getExercise(id!), [id]);

  const [connection, setConnection] = useState<WandConnectionState>("disconnected");
  const [connecting, setConnecting] = useState(false);
  const [recordings, setRecordings] = useState<WandCaptureResult[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getWandClient();
    setConnection(client.getState());
    const unsubscribe = client.onStateChange(setConnection);
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

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
    if (!exercise) return;
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

  if (loading || !exercise) return <Spinner />;

  const connected = connection === "connected";
  const collected = recordings.length;
  const readyToSave = collected >= TEMPLATE_REPS;

  if (done) {
    return (
      <div style={{ maxWidth: 620 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Reference template saved. Patients can now use this exercise.</div>
          <button className="btn" onClick={() => navigate(`/exercises/${exercise.id}`)}>Done</button>
        </div>
      </div>
    );
  }

  if (!isWebBluetoothSupported()) {
    return (
      <div style={{ maxWidth: 620 }}>
        <div className="card">
          <div className="error-text">This browser doesn't support Web Bluetooth. Use Chrome or Edge (desktop or Android) to record a wand reference.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>{exercise.title}</h1>
      <div className="muted" style={{ marginBottom: 16 }}>
        Connect the wand, then perform {TEMPLATE_REPS} clean, correct repetitions of the movement.
      </div>

      <div className="card">
        <div className="row" style={{ gap: 10, alignItems: "center", marginBottom: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: connected ? "var(--success)" : "var(--warning)", display: "inline-block" }} />
          <span>{connecting ? "Connecting to wand…" : connected ? "Wand connected" : "Wand disconnected"}</span>
          {!connected && (
            <button type="button" className="btn ghost sm" disabled={connecting} onClick={connectWand} style={{ marginLeft: "auto" }}>
              Connect wand
            </button>
          )}
        </div>

        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          {Array.from({ length: TEMPLATE_REPS }, (_, i) => (
            <span
              key={i}
              style={{
                width: 14, height: 14, borderRadius: 999,
                background: i < collected ? "var(--success)" : "var(--surface-hi)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
        <div className="muted" style={{ marginBottom: 14 }}>{collected}/{TEMPLATE_REPS} repetitions recorded</div>

        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

        {!readyToSave ? (
          <button className="btn" disabled={!connected} onClick={toggleCapture}>
            {capturing ? "■ Stop repetition" : "● Start repetition"}
          </button>
        ) : (
          <button className="btn" disabled={saving} onClick={saveTemplate}>{saving ? "Saving…" : "Save reference template"}</button>
        )}
      </div>
    </div>
  );
}
