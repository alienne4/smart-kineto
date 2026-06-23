import { useState } from "react";

import { api, Exercise, MEDIA_ORIGIN, TrainingProgram } from "../../api/client";
import { Badge, BODY_PART_META, DIFFICULTY_META, Empty, Modal, Spinner, useApi } from "../../components/ui";

export default function AdminReview() {
  const { data, loading, reload } = useApi(() => api.adminReviewQueue());
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ kind: "exercise"; item: Exercise } | { kind: "program"; item: TrainingProgram } | null>(null);

  async function decideEx(id: string, decision: "approve" | "reject") {
    setBusy(id);
    await api.adminReviewExercise(id, decision);
    setPreview(null);
    await reload();
    setBusy(null);
  }
  async function decidePr(id: string, decision: "approve" | "reject") {
    setBusy(id);
    await api.adminReviewProgram(id, decision);
    setPreview(null);
    await reload();
    setBusy(null);
  }

  if (loading || !data) return <Spinner />;
  const empty = data.exercises.length === 0 && data.programs.length === 0;

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>Review queue</h1>
      {empty && <Empty icon="🎉" title="All caught up" subtitle="No items waiting for review." />}

      {data.exercises.length > 0 && (
        <>
          <h2 className="section-title">Exercises ({data.exercises.length})</h2>
          <div className="grid">
            {data.exercises.map((e) => {
              const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
              return (
                <div key={e.id} className="card click row" onClick={() => setPreview({ kind: "exercise", item: e })}>
                  {e.thumbnail ? <img className="thumb" src={e.thumbnail} alt="" /> : <div className="thumb" style={{ background: meta.grad, display: "grid", placeItems: "center" }}>{meta.icon}</div>}
                  <div className="col" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{e.title}</div>
                    <div className="muted truncate">{e.description}</div>
                    <span className="author">by {e.author}</span>
                  </div>
                  <div className="btn-row" onClick={(ev) => ev.stopPropagation()}>
                    <button className="btn success sm" disabled={busy === e.id} onClick={() => decideEx(e.id, "approve")}>Approve</button>
                    <button className="btn danger sm" disabled={busy === e.id} onClick={() => decideEx(e.id, "reject")}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {data.programs.length > 0 && (
        <>
          <h2 className="section-title">Programs ({data.programs.length})</h2>
          <div className="grid">
            {data.programs.map((p) => (
              <div key={p.id} className="card click row" onClick={() => setPreview({ kind: "program", item: p })}>
                <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📋</div>
                <div className="col" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div className="muted">{p.exercise_count} exercises</div>
                  <span className="author">by {p.author}</span>
                </div>
                <div className="btn-row" onClick={(ev) => ev.stopPropagation()}>
                  <button className="btn success sm" disabled={busy === p.id} onClick={() => decidePr(p.id, "approve")}>Approve</button>
                  <button className="btn danger sm" disabled={busy === p.id} onClick={() => decidePr(p.id, "reject")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {preview?.kind === "exercise" && (
        <ExercisePreview e={preview.item} busy={busy === preview.item.id} onClose={() => setPreview(null)} onDecide={(d) => decideEx(preview.item.id, d)} />
      )}
      {preview?.kind === "program" && (
        <ProgramPreview p={preview.item} busy={busy === preview.item.id} onClose={() => setPreview(null)} onDecide={(d) => decidePr(preview.item.id, d)} />
      )}
    </>
  );
}

function DecisionBar({ busy, onClose, onDecide }: { busy: boolean; onClose: () => void; onDecide: (d: "approve" | "reject") => void }) {
  return (
    <div className="btn-row" style={{ marginTop: 18 }}>
      <button className="btn success" disabled={busy} onClick={() => onDecide("approve")}>✓ Approve & publish</button>
      <button className="btn danger" disabled={busy} onClick={() => onDecide("reject")}>✕ Reject</button>
      <button className="btn ghost" onClick={onClose}>Close</button>
    </div>
  );
}

function ExercisePreview({ e, busy, onClose, onDecide }: { e: Exercise; busy: boolean; onClose: () => void; onDecide: (d: "approve" | "reject") => void }) {
  const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[e.difficulty];
  return (
    <Modal onClose={onClose}>
      {e.video ? (
        <video src={e.video.startsWith("http") ? e.video : MEDIA_ORIGIN + e.video} controls poster={e.thumbnail || undefined} style={{ width: "100%", borderRadius: 12, background: "#000", marginBottom: 14 }} />
      ) : e.thumbnail ? (
        <img src={e.thumbnail} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, maxHeight: 280, objectFit: "cover" }} />
      ) : (
        <div style={{ height: 150, borderRadius: 12, background: meta.grad, display: "grid", placeItems: "center", fontSize: 48, marginBottom: 14 }}>{meta.icon}</div>
      )}
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <Badge text={meta.label} color="var(--primary)" />
        {diff && <Badge text={diff.label} color={diff.color} />}
        {e.video && <Badge text="VIDEO" color="var(--primary)" />}
      </div>
      <h2 style={{ margin: "4px 0" }}>{e.title}</h2>
      <div className="author">by {e.author}</div>
      <p style={{ lineHeight: 1.6 }}>{e.description || "No instructions provided."}</p>
      <DecisionBar busy={busy} onClose={onClose} onDecide={onDecide} />
    </Modal>
  );
}

function ProgramPreview({ p, busy, onClose, onDecide }: { p: TrainingProgram; busy: boolean; onClose: () => void; onDecide: (d: "approve" | "reject") => void }) {
  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>{p.name}</h2>
      <div className="author">by {p.author}</div>
      {p.description && <p style={{ lineHeight: 1.6 }}>{p.description}</p>}
      <div className="faint" style={{ marginBottom: 8 }}>{p.exercise_count} exercises</div>
      <div className="grid" style={{ gap: 8 }}>
        {[...p.program_exercises].sort((a, b) => a.order - b.order).map((pe, i) => {
          const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
          return (
            <div key={pe.id} className="card row" style={{ background: "var(--surface-alt)" }}>
              <div className="avatar" style={{ width: 30, height: 30, background: "var(--surface-hi)" }}>{i + 1}</div>
              {pe.exercise.thumbnail ? <img className="thumb" src={pe.exercise.thumbnail} alt="" /> : <div className="thumb" style={{ background: meta.grad, display: "grid", placeItems: "center" }}>{meta.icon}</div>}
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{pe.exercise.title}</div>
                <div className="faint">{pe.sets} sets · {pe.reps} reps</div>
              </div>
            </div>
          );
        })}
      </div>
      <DecisionBar busy={busy} onClose={onClose} onDecide={onDecide} />
    </Modal>
  );
}
