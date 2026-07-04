import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, BODY_PARTS, Exercise } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, BODY_PART_META, DIFFICULTY_META, Empty, IconMark, Spinner, useApi } from "../../components/ui";

export default function Exercises() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi(() => api.listExercises());
  const [tab, setTab] = useState<"MINE" | "LIBRARY">("MINE");
  const [q, setQ] = useState("");
  const [part, setPart] = useState<string | null>(null);

  const filtered = (data || [])
    .filter((e) => (tab === "MINE" ? !e.is_template && e.created_by?.id === user?.id : e.is_template || e.is_public))
    .filter((e) => !part || e.body_part === part)
    .filter((e) => !q || e.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="spread">
        <h1 className="section-title" style={{ margin: 0 }}>Exercises</h1>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn ghost" onClick={() => navigate("/exercises/new-wand")}>+ Hardware wand</button>
          <button className="btn" onClick={() => navigate("/exercises/new")}>+ Camera pose</button>
        </div>
      </div>

      <div className="segment" style={{ marginTop: 16 }}>
        <button className={tab === "MINE" ? "active" : ""} onClick={() => setTab("MINE")}>Mine</button>
        <button className={tab === "LIBRARY" ? "active" : ""} onClick={() => setTab("LIBRARY")}>Library</button>
      </div>

      <input className="input" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14 }} />
      <div className="chips" style={{ marginBottom: 18 }}>
        <button className={`chip ${!part ? "active" : ""}`} onClick={() => setPart(null)}>All</button>
        {BODY_PARTS.map((p) => (
          <button
            key={p}
            className={`chip ${part === p ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setPart(p)}
          >
            <IconMark name={BODY_PART_META[p]?.icon} size="sm" /> {BODY_PART_META[p]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty icon="dumbbell" title={tab === "MINE" ? "No exercises yet" : "Library is empty"} subtitle={tab === "MINE" ? "Create your first exercise." : "Predefined exercises will appear here."} />
      ) : (
        <div className="grid cols-2">
          {filtered.map((e) => (
            <ExerciseRow key={e.id} e={e} onClick={() => navigate(`/exercises/${e.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}

function ExerciseRow({ e, onClick }: { e: Exercise; onClick: () => void }) {
  const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[e.difficulty];
  return (
    <div className="card click row" onClick={onClick}>
      {e.thumbnail ? (
        <img className="thumb" src={e.thumbnail} alt="" />
      ) : (
        <div className="thumb" style={{ display: "grid", placeItems: "center" }}><IconMark name={meta.icon} /></div>
      )}
      <div className="col" style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{e.title}</div>
        <div className="muted truncate">{e.description || meta.label}</div>
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          {e.author && <span className="author">by {e.author}</span>}
          {diff && <Badge text={diff.label} color={diff.color} />}
          {e.is_template && <Badge text="LIBRARY" color="var(--accent)" />}
          {e.is_public && <Badge text="PUBLIC" color="var(--success)" />}
          {e.video && <Badge text="VIDEO" color="var(--primary)" />}
        </div>
      </div>
    </div>
  );
}
