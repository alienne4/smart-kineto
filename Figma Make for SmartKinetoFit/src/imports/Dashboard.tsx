import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCard } from "../../components/NewsCard";
import { Avatar, Empty, Spinner, Stat, useApi } from "../../components/ui";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi(async () => {
    const [ex, pr, pts, asm, news] = await Promise.all([
      api.listExercises(),
      api.listPrograms(),
      api.listPatients(),
      api.listAssessments(),
      api.getFeed().catch(() => []),
    ]);
    return { ex, pr, pts, asm, news };
  });

  if (loading || !data) return <Spinner />;

  const myExercises = data.ex.filter((e) => !e.is_template && e.created_by?.id === user?.id).length;
  const myPrograms = data.pr.filter((p) => !p.is_template && p.created_by?.id === user?.id).length;
  const flagged = data.asm.filter((a) => a.pain_level >= 7).slice(0, 3);

  return (
    <>
      <div className="hero">
        <div className="sub">Trainer workspace</div>
        <h1>{user?.full_name}</h1>
      </div>

      <div className="grid cols-3">
        <Stat label="My exercises" value={myExercises} icon="🏋️" grad="linear-gradient(135deg,#22d3ee,#0891b2)" />
        <Stat label="My programs" value={myPrograms} icon="📋" grad="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
        <Stat label="Patients" value={data.pts.length} icon="👥" grad="linear-gradient(135deg,#34d399,#059669)" />
      </div>

      {data.news.length > 0 && (
        <>
          <div className="spread"><h2 className="section-title">News & events</h2><Link to="/news">See all</Link></div>
          <div className="news-strip">
            {data.news.map((n) => <NewsCard key={n.id} item={n} />)}
          </div>
        </>
      )}

      <h2 className="section-title">Quick actions</h2>
      <div className="grid cols-2">
        <div className="card click row" onClick={() => navigate("/exercises/new")}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#22d3ee,#0891b2)" }}>➕</div>
          <div style={{ fontWeight: 700 }}>New exercise</div>
        </div>
        <div className="card click row" onClick={() => navigate("/programs/new")}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📑</div>
          <div style={{ fontWeight: 700 }}>New program</div>
        </div>
      </div>

      {flagged.length > 0 && (
        <>
          <h2 className="section-title">Needs attention</h2>
          <div className="grid">
            {flagged.map((a) => (
              <div key={a.id} className="card row">
                <div className="tile" style={{ background: "var(--danger)" }}>⚠️</div>
                <div className="col">
                  <div>{a.patient?.full_name || a.patient?.email}</div>
                  <div className="muted">Reported high pain ({a.pain_level}/10)</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="spread"><h2 className="section-title">Patients</h2><Link to="/patients">See all</Link></div>
      {data.pts.length === 0 ? (
        <Empty icon="👥" title="No patients yet" subtitle="Find and add patients from the Patients page." />
      ) : (
        <div className="grid cols-2">
          {data.pts.slice(0, 6).map((p) => (
            <div key={p.id} className="card click row" onClick={() => navigate(`/patients/${p.id}`)}>
              <Avatar name={p.full_name || p.email} size={40} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.full_name || p.email}</div>
                <div className="muted truncate">{p.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
