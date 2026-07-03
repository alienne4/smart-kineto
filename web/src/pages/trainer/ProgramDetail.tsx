import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Badge, BODY_PART_META, IconMark, Modal, Spinner, useApi } from "../../components/ui";

const REVIEW_COLOR: Record<string, string> = { PENDING: "var(--warning)", APPROVED: "var(--success)", REJECTED: "var(--danger)" };

export default function ProgramDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: p, loading, reload } = useApi(() => api.getProgram(id!), [id]);
  const [busy, setBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (loading || !p) return <Spinner />;
  const mine = !p.is_template && p.created_by?.id === user?.id;

  async function clone() {
    setBusy(true);
    const c = await api.cloneProgram(p!.id);
    navigate(`/programs/${c.id}`, { replace: true });
  }
  async function publish() {
    setBusy(true);
    await api.publishProgram(p!.id);
    await reload();
    setBusy(false);
  }
  async function remove() {
    if (!confirm("Delete this program?")) return;
    setBusy(true);
    await api.deleteProgram(p!.id);
    navigate("/programs", { replace: true });
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          {p.is_template && <Badge text="LIBRARY" color="var(--accent)" />}
          {p.is_public && <Badge text="PUBLIC" color="var(--success)" />}
          {p.review_status && p.review_status !== "NONE" && <Badge text={p.review_status} color={REVIEW_COLOR[p.review_status]} />}
        </div>
        <h1 style={{ margin: "4px 0" }}>{p.name}</h1>
        {p.author && <div className="author">by {p.author}</div>}
        {p.description && <p style={{ lineHeight: 1.6 }}>{p.description}</p>}

        <div className="btn-row">
          {mine ? (
            <>
              <button className="btn" onClick={() => setAssignOpen(true)}>Assign to patient</button>
              <button className="btn ghost" onClick={() => navigate(`/programs/${p.id}/edit`)}>Edit</button>
              {(p.review_status === "NONE" || p.review_status === "REJECTED") && (
                <button className="btn ghost" disabled={busy} onClick={publish}>Publish</button>
              )}
              <button className="btn danger" disabled={busy} onClick={remove}>Delete</button>
            </>
          ) : (
            <button className="btn" disabled={busy} onClick={clone}>Save a copy to my programs</button>
          )}
        </div>
      </div>

      <h2 className="section-title">Exercises ({p.exercise_count})</h2>
      <div className="grid">
        {p.program_exercises.sort((a, b) => a.order - b.order).map((pe) => {
          const meta = BODY_PART_META[pe.exercise.body_part] || BODY_PART_META.OTHER;
          return (
            <div key={pe.id} className="card click row" onClick={() => navigate(`/exercises/${pe.exercise.id}`)}>
              {pe.exercise.thumbnail ? <img className="thumb" src={pe.exercise.thumbnail} alt="" /> : <div className="thumb" style={{ display: "grid", placeItems: "center" }}><IconMark name={meta.icon} /></div>}
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{pe.exercise.title}</div>
                <div className="muted">{pe.sets} sets · {pe.reps} reps</div>
              </div>
            </div>
          );
        })}
      </div>

      {assignOpen && <AssignModal programId={p.id} onClose={() => setAssignOpen(false)} />}
    </div>
  );
}

function AssignModal({ programId, onClose }: { programId: string; onClose: () => void }) {
  const { data, loading } = useApi(() => api.listPatients());
  const [done, setDone] = useState<string | null>(null);

  async function assign(patientId: string) {
    await api.createAssignment(programId, patientId);
    setDone(patientId);
  }

  return (
    <Modal onClose={onClose}>
      <div className="spread"><h2 style={{ margin: 0 }}>Assign program</h2><button className="btn ghost sm" onClick={onClose}>Close</button></div>
      {loading ? (
        <Spinner />
      ) : (data || []).length === 0 ? (
        <p className="muted">No patients yet. Add patients first.</p>
      ) : (
        <div className="grid" style={{ gap: 8, marginTop: 14 }}>
          {data!.map((pt) => (
            <div key={pt.id} className="card row" style={{ background: "var(--surface-alt)" }}>
              <Avatar name={pt.full_name || pt.email} size={36} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{pt.full_name || pt.email}</div>
                <div className="faint">{pt.email}</div>
              </div>
              <button className="btn sm" disabled={done === pt.id} onClick={() => assign(pt.id)}>{done === pt.id ? "✓ Assigned" : "Assign"}</button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
