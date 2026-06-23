import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, BODY_PARTS, DIFFICULTIES } from "../../api/client";
import { PoseRecorder } from "../../components/PoseRecorder";
import { BODY_PART_META, DIFFICULTY_META, Spinner } from "../../components/ui";

export default function ExerciseForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bodyPart, setBodyPart] = useState<string>("KNEE");
  const [difficulty, setDifficulty] = useState<string>("EASY");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [poseJobId, setPoseJobId] = useState<string | null>(null);
  const [poseOutputUrl, setPoseOutputUrl] = useState<string | null>(null);
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
      setDifficulty(e.difficulty);
      setExistingThumb(e.thumbnail);
      setLoading(false);
    });
  }, [id, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("body_part", bodyPart);
    form.append("difficulty", difficulty);
    if (thumbnail) form.append("thumbnail", thumbnail);
    if (poseJobId) form.append("pose_job_id", poseJobId);
    else if (video) form.append("video", video);
    try {
      const saved = editing ? await api.updateExercise(id!, form) : await api.createExercise(form);
      navigate(`/exercises/${saved.id}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Could not save");
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>{editing ? "Edit exercise" : "New exercise"}</h1>
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
              <button type="button" key={p} className={`chip ${bodyPart === p ? "active" : ""}`} onClick={() => setBodyPart(p)}>
                {BODY_PART_META[p].icon} {BODY_PART_META[p].label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>DIFFICULTY</label>
          <div className="chips">
            {DIFFICULTIES.map((d) => (
              <button type="button" key={d} className={`chip ${difficulty === d ? "active" : ""}`} onClick={() => setDifficulty(d)}>
                {DIFFICULTY_META[d].label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>THUMBNAIL IMAGE</label>
          {existingThumb && !thumbnail && <img className="thumb" src={existingThumb} alt="" style={{ marginBottom: 8 }} />}
          <input className="input" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
        </div>
        <div className="field">
          <label>DEMONSTRATION VIDEO</label>
          {poseOutputUrl ? (
            <div className="card" style={{ background: "var(--surface-alt)" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Pose-detected video attached ✓</div>
              <video src={poseOutputUrl} controls loop style={{ width: "100%", borderRadius: 12, background: "#000" }} />
              <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => { setPoseJobId(null); setPoseOutputUrl(null); }}>
                Remove & choose again
              </button>
            </div>
          ) : (
            <>
              <PoseRecorder
                onUseVideo={(jobId, outputUrl) => {
                  setPoseJobId(jobId);
                  setPoseOutputUrl(outputUrl);
                  setVideo(null);
                }}
              />
              <div className="muted" style={{ margin: "10px 0 4px" }}>…or upload an existing video file</div>
              <input className="input" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
            </>
          )}
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="btn-row">
          <button className="btn" disabled={saving || !title}>{saving ? "Saving…" : editing ? "Save changes" : "Create exercise"}</button>
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
