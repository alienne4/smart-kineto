import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, Empty, Spinner, useApi } from "../../components/ui";

export default function Programs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi(() => api.listPrograms());
  const [tab, setTab] = useState<"MINE" | "LIBRARY">("MINE");

  const filtered = (data || []).filter((p) =>
    tab === "MINE" ? !p.is_template && p.created_by?.id === user?.id : p.is_template || p.is_public
  );

  return (
    <>
      <div className="spread">
        <h1 className="section-title" style={{ margin: 0 }}>Programs</h1>
        <button className="btn" onClick={() => navigate("/programs/new")}>➕ New program</button>
      </div>

      <div className="segment" style={{ marginTop: 16 }}>
        <button className={tab === "MINE" ? "active" : ""} onClick={() => setTab("MINE")}>Mine</button>
        <button className={tab === "LIBRARY" ? "active" : ""} onClick={() => setTab("LIBRARY")}>Library</button>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty icon="📋" title={tab === "MINE" ? "No programs yet" : "Library is empty"} subtitle={tab === "MINE" ? "Build a program from your exercises." : "Predefined programs will appear here."} />
      ) : (
        <div className="grid cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="card click row" onClick={() => navigate(`/programs/${p.id}`)}>
              <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📋</div>
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div className="muted truncate">{p.exercise_count} exercises{p.description ? ` · ${p.description}` : ""}</div>
                <div className="row" style={{ gap: 8, marginTop: 4 }}>
                  {p.author && <span className="author">by {p.author}</span>}
                  {p.is_template && <Badge text="LIBRARY" color="var(--accent)" />}
                  {p.is_public && <Badge text="PUBLIC" color="var(--success)" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
