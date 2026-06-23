import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, Exercise } from "../../api/client";
import { BODY_PART_META, Spinner } from "../../components/ui";

interface Row {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export default function ProgramForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ex = await api.listExercises();
      setLibrary(ex);
      if (editing) {
        const p = await api.getProgram(id!);
        setName(p.name);
        setDescription(p.description);
        setRows(p.program_exercises.sort((a, b) => a.order - b.order).map((pe) => ({ exercise: pe.exercise, sets: pe.sets, reps: pe.reps })));
      }
      setLoading(false);
    })();
  }, [id, editing]);

  function addExercise(e: Exercise) {
    if (rows.find((r) => r.exercise.id === e.id)) return;
    setRows((r) => [...r, { exercise: e, sets: 3, reps: 10 }]);
  }
  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const payload = {
      name,
      description,
      program_exercises: rows.map((r, idx) => ({ exercise_id: r.exercise.id, order: idx, sets: r.sets, reps: r.reps })),
    };
    try {
      const saved = editing ? await api.updateProgram(id!, payload) : await api.createProgram(payload);
      navigate(`/programs/${saved.id}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Could not save");
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>{editing ? "Edit program" : "New program"}</h1>
      <div className="card">
        <div className="field">
          <label>NAME</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>DESCRIPTION</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="spread" style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>EXERCISES ({rows.length})</label>
          <button className="btn ghost sm" onClick={() => setPicker(true)}>➕ Add exercise</button>
        </div>

        {rows.length === 0 && <div className="muted" style={{ marginBottom: 12 }}>No exercises added yet.</div>}
        <div className="grid" style={{ gap: 10 }}>
          {rows.map((r, i) => {
            const meta = BODY_PART_META[r.exercise.body_part] || BODY_PART_META.OTHER;
            return (
              <div key={r.exercise.id} className="card row" style={{ background: "var(--surface-alt)" }}>
                {r.exercise.thumbnail ? (
                  <img className="thumb" src={r.exercise.thumbnail} alt="" />
                ) : (
                  <div className="thumb" style={{ background: meta.grad, display: "grid", placeItems: "center" }}>{meta.icon}</div>
                )}
                <div className="col" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.exercise.title}</div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="faint">Sets</span>
                    <input className="input" style={{ width: 56, padding: 6 }} type="number" value={r.sets} onChange={(e) => update(i, { sets: +e.target.value })} />
                    <span className="faint">Reps</span>
                    <input className="input" style={{ width: 56, padding: 6 }} type="number" value={r.reps} onChange={(e) => update(i, { reps: +e.target.value })} />
                  </div>
                </div>
                <button className="btn danger sm" onClick={() => remove(i)}>✕</button>
              </div>
            );
          })}
        </div>

        {error && <div className="error-text">{error}</div>}
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn" disabled={saving || !name || rows.length === 0} onClick={submit}>{saving ? "Saving…" : editing ? "Save changes" : "Create program"}</button>
          <button className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>

      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="spread"><h2 style={{ margin: 0 }}>Add exercise</h2><button className="btn ghost sm" onClick={() => setPicker(false)}>Done</button></div>
            <div className="grid" style={{ gap: 8, marginTop: 14 }}>
              {library.map((e) => {
                const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
                const added = !!rows.find((r) => r.exercise.id === e.id);
                return (
                  <div key={e.id} className="card row" style={{ background: "var(--surface-alt)" }}>
                    {e.thumbnail ? <img className="thumb" src={e.thumbnail} alt="" /> : <div className="thumb" style={{ background: meta.grad, display: "grid", placeItems: "center" }}>{meta.icon}</div>}
                    <div className="col" style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{e.title}</div>
                      <div className="faint">{e.author ? `by ${e.author}` : meta.label}</div>
                    </div>
                    <button className="btn sm" disabled={added} onClick={() => addExercise(e)}>{added ? "✓" : "Add"}</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
