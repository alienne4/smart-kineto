import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, Assignment, TrainingProgram } from "../../api/client";
import { Badge, Empty, IconTile, Spinner, statusMeta, useApi } from "../../components/ui";

export default function PatientPrograms() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"MINE" | "BROWSE">("MINE");

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>My programs</h1>
      <div className="segment">
        <button className={tab === "MINE" ? "active" : ""} onClick={() => setTab("MINE")}>Assigned to me</button>
        <button className={tab === "BROWSE" ? "active" : ""} onClick={() => setTab("BROWSE")}>Browse public</button>
      </div>
      {tab === "MINE" ? <Mine navigate={navigate} /> : <Browse />}
    </>
  );
}

function Mine({ navigate }: { navigate: (to: string) => void }) {
  const { data, loading } = useApi(() => api.listAssignments());
  if (loading) return <Spinner />;
  if (!data || data.length === 0)
    return <Empty icon="🏃" title="No programs yet" subtitle="Browse public programs or ask your trainer." />;
  return (
    <div className="grid cols-2">
      {data.map((a) => (
        <div key={a.id} className="card click" onClick={() => navigate(`/programs/${a.program.id}`)}>
          <div className="spread">
            <IconTile icon="programs" />
            <Badge text={statusMeta(a.status).label} color={statusMeta(a.status).color} />
          </div>
          <div style={{ fontWeight: 700, marginTop: 12 }}>{a.program.name}</div>
          <div className="muted">{a.program.exercise_count} exercises{a.program.author ? ` · by ${a.program.author}` : ""}</div>
        </div>
      ))}
    </div>
  );
}

function Browse() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listPublicPrograms(), api.listAssignments()])
      .then(([pub, asg]: [TrainingProgram[], Assignment[]]) => {
        setPrograms(pub);
        setAssigned(new Set(asg.map((a) => a.program.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function add(id: string) {
    setBusy(id);
    try {
      await api.selfAssignProgram(id);
      setAssigned((s) => new Set(s).add(id));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner />;
  if (programs.length === 0)
    return <Empty icon="🌍" title="No public programs yet" subtitle="Check back soon for ready-made plans." />;

  return (
    <div className="grid cols-2">
      {programs.map((p) => {
        const has = assigned.has(p.id);
        return (
          <div key={p.id} className="card">
            <div className="spread">
              <IconTile icon="programs" />
              {p.is_template ? <Badge text="LIBRARY" color="var(--accent)" /> : <Badge text="PUBLIC" color="var(--success)" />}
            </div>
            <div style={{ fontWeight: 700, marginTop: 12 }}>{p.name}</div>
            <div className="muted">{p.exercise_count} exercises{p.author ? ` · by ${p.author}` : ""}</div>
            {p.description && <div className="muted truncate" style={{ marginTop: 4 }}>{p.description}</div>}
            <button className="btn sm" style={{ marginTop: 12 }} disabled={has || busy === p.id} onClick={() => add(p.id)}>
              {has ? "✓ In my plan" : busy === p.id ? "Adding…" : "Add to my plan"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
