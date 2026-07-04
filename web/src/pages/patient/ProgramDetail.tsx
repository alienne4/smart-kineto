import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api, Exercise, MEDIA_ORIGIN } from "../../api/client";
import { Badge, BODY_PART_META, IconMark, Modal, Spinner, statusMeta, useApi } from "../../components/ui";
import WandSessionPlayer from "../../components/WandSessionPlayer";

export default function PatientProgramDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(async () => {
    const [program, assignments] = await Promise.all([api.getProgram(id!), api.listAssignments()]);
    return { program, assignment: assignments.find((a) => a.program.id === id) || null };
  }, [id]);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [assignmentId, setAssignmentId] = useState<string | undefined>();

  useEffect(() => {
    if (data?.assignment) {
      setStatus(data.assignment.status);
      setAssignmentId(data.assignment.id);
    }
  }, [data]);

  if (loading || !data) return <Spinner />;
  const { program } = data;
  const sm = status ? statusMeta(status) : null;

  async function ensureStarted() {
    if (!assignmentId || status === "IN_PROGRESS" || status === "COMPLETED") return;
    try {
      const a = await api.startAssignment(assignmentId);
      setStatus(a.status);
    } catch {
      /* non-blocking */
    }
  }
  function openExercise(ex: Exercise) {
    ensureStarted();
    setPlaying(ex);
  }
  async function act(fn: () => Promise<{ status: string }>) {
    setBusy(true);
    try {
      const a = await fn();
      setStatus(a.status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="spread">
          <h1 style={{ margin: 0 }}>{program.name}</h1>
          {sm && <Badge text={sm.label} color={sm.color} />}
        </div>
        {program.author && <div className="author" style={{ marginTop: 6 }}>by {program.author}</div>}
        {program.description && <p className="muted">{program.description}</p>}

        {assignmentId && (
          <div className="btn-row" style={{ marginTop: 8 }}>
            {status === "COMPLETED" ? (
              <button className="btn" disabled={busy} onClick={() => act(() => api.reopenAssignment(assignmentId!))}>
                ↺ Reopen session
              </button>
            ) : status === "IN_PROGRESS" ? (
              <button className="btn success" disabled={busy} onClick={() => act(() => api.completeAssignment(assignmentId!))}>
                ✓ Mark complete
              </button>
            ) : (
              <button className="btn" disabled={busy} onClick={() => act(() => api.startAssignment(assignmentId!))}>
                ▶ Start session
              </button>
            )}
          </div>
        )}
      </div>

      <h2 className="section-title">Exercises ({program.exercise_count})</h2>
      <div className="grid">
        {program.program_exercises.sort((a, b) => a.order - b.order).map((pe, i) => {
          const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
          return (
            <div key={pe.id} className="card click row" onClick={() => openExercise(pe.exercise)}>
              <div className="avatar" style={{ background: "var(--surface-hi)" }}>{i + 1}</div>
              {pe.exercise.thumbnail ? <img className="thumb" src={pe.exercise.thumbnail} alt="" /> : <div className="thumb" style={{ display: "grid", placeItems: "center" }}><IconMark name={meta.icon} /></div>}
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{pe.exercise.title}</div>
                <div className="muted">{pe.sets} sets · {pe.reps} reps</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontSize: 16 }}>&#9654;</span>
            </div>
          );
        })}
      </div>

      {status === "IN_PROGRESS" && assignmentId && (
        <button className="btn success" style={{ width: "100%", marginTop: 18 }} disabled={busy} onClick={() => act(() => api.completeAssignment(assignmentId!))}>
          {busy ? "…" : "✓ Mark program complete"}
        </button>
      )}

      {playing && (
        <Modal onClose={() => setPlaying(null)}>
          <div className="spread"><h2 style={{ margin: 0 }}>{playing.title}</h2><button className="btn ghost sm" onClick={() => setPlaying(null)}>Close</button></div>
          <div style={{ marginTop: 14 }}>
            {playing.tracking_method === "HARDWARE_WAND" ? (
              <WandSessionPlayer exercise={playing} assignmentId={assignmentId} onDone={() => setPlaying(null)} />
            ) : (
              <>
                {playing.video ? (
                  <video src={playing.video.startsWith("http") ? playing.video : MEDIA_ORIGIN + playing.video} controls autoPlay poster={playing.thumbnail || undefined} style={{ width: "100%", background: "#000" }} />
                ) : playing.thumbnail ? (
                  <img src={playing.thumbnail} alt="" style={{ width: "100%" }} />
                ) : (
                  <div style={{ height: 160, border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
                    <IconMark name={(BODY_PART_META[playing.body_part] || BODY_PART_META.OTHER).icon} size="lg" />
                  </div>
                )}
                <p style={{ lineHeight: 1.6 }}>{playing.description || "Follow the movement carefully and breathe steadily."}</p>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
