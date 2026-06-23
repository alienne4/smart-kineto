import { useState } from "react";

import { api } from "../../api/client";
import { BarChart, Empty, Spinner, timeAgo, useApi } from "../../components/ui";

function Scale({ value, onChange, color }: { value: number; onChange: (n: number) => void; color: string }) {
  return (
    <div className="scale">
      {Array.from({ length: 11 }, (_, i) => (
        <button key={i} type="button" className={value === i ? "on" : ""} style={value === i ? { background: color, borderColor: color, color: "#06121a" } : undefined} onClick={() => onChange(i)}>
          {i}
        </button>
      ))}
    </div>
  );
}

export default function Progress() {
  const { data, loading, reload } = useApi(() => api.listAssessments());
  const [pain, setPain] = useState(3);
  const [mobility, setMobility] = useState(6);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api.createAssessment({ pain_level: pain, mobility_score: mobility, notes });
    setNotes("");
    await reload();
    setSaving(false);
  }

  const recent = (data || []).slice(0, 10).reverse();

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>Progress & check-in</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>New check-in</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>PAIN LEVEL · {pain}/10</label>
            <Scale value={pain} onChange={setPain} color="var(--danger)" />
          </div>
          <div className="field">
            <label>MOBILITY · {mobility}/10</label>
            <Scale value={mobility} onChange={setMobility} color="var(--success)" />
          </div>
          <div className="field">
            <label>NOTES (OPTIONAL)</label>
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did the session feel?" />
          </div>
          <button className="btn" disabled={saving}>{saving ? "Saving…" : "Submit check-in"}</button>
        </form>
      </div>

      {recent.length > 0 && (
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="muted">Pain trend</div>
            <BarChart data={recent.map((a, i) => ({ label: `${i + 1}`, value: a.pain_level }))} color="var(--danger)" />
          </div>
          <div className="card">
            <div className="muted">Mobility trend</div>
            <BarChart data={recent.map((a, i) => ({ label: `${i + 1}`, value: a.mobility_score }))} color="var(--success)" />
          </div>
        </div>
      )}

      <h2 className="section-title">History</h2>
      {loading ? (
        <Spinner />
      ) : (data || []).length === 0 ? (
        <Empty icon="📈" title="No check-ins yet" subtitle="Log your first check-in above." />
      ) : (
        <div className="grid">
          {data!.map((a) => (
            <div key={a.id} className="card">
              <div className="spread">
                <div className="row" style={{ gap: 16 }}>
                  <span>Pain <b style={{ color: "var(--danger)" }}>{a.pain_level}</b></span>
                  <span>Mobility <b style={{ color: "var(--success)" }}>{a.mobility_score}</b></span>
                </div>
                <span className="faint">{timeAgo(a.created_at!)}</span>
              </div>
              {a.notes && <div className="muted" style={{ marginTop: 6 }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
