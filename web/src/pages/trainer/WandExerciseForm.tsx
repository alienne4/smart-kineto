import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, BODY_PARTS } from "../../api/client";
import { BODY_PART_META, IconMark, Spinner } from "../../components/ui";

const MIN_REPS = 3;
const MAX_REPS = 30;

/**
 * Trainer flow for the early-stage/hardware-wand exercise family — no video, no camera,
 * mirrors app/src/screens/trainer/CreateHardwareExerciseScreen.tsx. Saving a new exercise
 * routes straight into recording the trainer reference movement, since a wand exercise
 * isn't usable until one exists.
 */
export default function WandExerciseForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bodyPart, setBodyPart] = useState<string>("WRIST");
  const [targetReps, setTargetReps] = useState(10);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [existingThumb, setExistingThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    api.getExercise(id!).then((e) => {
      setTitle(e.title);
      setDescription(e.description);
      setBodyPart(e.body_part);
      setTargetReps(e.target_reps || 10);
      setExistingThumb(e.thumbnail);
      setLoading(false);
    });
  }, [id, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSaving(true);
    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("body_part", bodyPart);
    form.append("difficulty", "EASY");
    form.append("stage", "EARLY_STAGE");
    form.append("tracking_method", "HARDWARE_WAND");
    form.append("target_reps", String(targetReps));
    if (thumbnail) form.append("thumbnail", thumbnail);
    try {
      const saved = editing ? await api.updateExercise(id!, form) : await api.createExercise(form);
      navigate(editing ? `/exercises/${saved.id}` : `/exercises/${saved.id}/record-wand-template`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Could not save");
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>{editing ? "Edit hardware wand exercise" : "New hardware wand exercise"}</h1>
      <form onSubmit={submit} className="card">
        <div className="field">
          <label>TITLE</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>DESCRIPTION / INSTRUCTIONS</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>BODY PART</label>
          <div className="chips">
            {BODY_PARTS.map((p) => (
              <button
                type="button"
                key={p}
                className={`chip ${bodyPart === p ? "active" : ""}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => setBodyPart(p)}
              >
                <IconMark name={BODY_PART_META[p].icon} size="sm" /> {BODY_PART_META[p].label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>TARGET REPETITIONS</label>
          <div className="row" style={{ gap: 14, alignItems: "center" }}>
            <button type="button" className="btn ghost sm" onClick={() => setTargetReps((n) => Math.max(MIN_REPS, n - 1))}>−</button>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, minWidth: 32, textAlign: "center" }}>{targetReps}</span>
            <button type="button" className="btn ghost sm" onClick={() => setTargetReps((n) => Math.min(MAX_REPS, n + 1))}>+</button>
          </div>
        </div>
        <div className="field">
          <label>THUMBNAIL IMAGE (OPTIONAL)</label>
          {existingThumb && !thumbnail && <img className="thumb" src={existingThumb} alt="" style={{ marginBottom: 8 }} />}
          <input className="input" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="btn-row">
          <button className="btn" disabled={saving || !title}>
            {saving ? "Saving…" : editing ? "Save changes" : "Save & record reference"}
          </button>
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
