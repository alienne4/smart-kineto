import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCard } from "../../components/NewsCard";
import { Badge, Spinner, Stat, statusMeta, useApi } from "../../components/ui";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi(async () => {
    const [assignments, assessments, news] = await Promise.all([
      api.listAssignments(),
      api.listAssessments(),
      api.getFeed().catch(() => []),
    ]);
    return { assignments, assessments, news };
  });

  if (loading || !data) return <Spinner />;

  const active = data.assignments.filter((a) => a.status !== "COMPLETED");
  const next = active[0];
  const latest = data.assessments[0];

  return (
    <>
      <div className="hero">
        <div className="sub">Your recovery journey</div>
        <h1>{user?.full_name}</h1>
      </div>

      <div className="card" style={{ background: "linear-gradient(135deg,#0e7490,#1e293b)", border: "none" }}>
        <div className="muted" style={{ color: "rgba(255,255,255,0.8)" }}>Today's focus</div>
        {next ? (
          <>
            <h2 style={{ margin: "6px 0 12px" }}>{next.program.name}</h2>
            <button className="btn" onClick={() => navigate(`/programs/${next.program.id}`)}>Start session →</button>
          </>
        ) : (
          <>
            <h2 style={{ margin: "6px 0 12px" }}>No active program</h2>
            <div className="muted" style={{ color: "rgba(255,255,255,0.8)" }}>Your trainer will assign one soon.</div>
          </>
        )}
      </div>

      {!user?.trainer && (
        <div className="notice" style={{ marginTop: 16 }}>
          <span>🔗</span>
          <div style={{ flex: 1 }}>You haven't linked a trainer yet.</div>
          <button className="btn sm" onClick={() => navigate("/profile")}>Pick trainer</button>
        </div>
      )}

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <Stat label="Active programs" value={active.length} icon="🏃" grad="linear-gradient(135deg,#22d3ee,#0891b2)" />
        <Stat label="Last pain" value={latest ? `${latest.pain_level}/10` : "—"} icon="🩹" grad="linear-gradient(135deg,#fb7185,#e11d48)" />
        <Stat label="Last mobility" value={latest ? `${latest.mobility_score}/10` : "—"} icon="📈" grad="linear-gradient(135deg,#34d399,#059669)" />
      </div>

      <div className="card row" style={{ marginTop: 16 }}>
        <div className="tile" style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)" }}>📝</div>
        <div className="col" style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>How are you feeling today?</div>
          <div className="muted">Log a quick check-in for your trainer.</div>
        </div>
        <button className="btn ghost sm" onClick={() => navigate("/progress")}>Check in</button>
      </div>

      <div className="card row" style={{ marginTop: 16 }}>
        <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>🤖</div>
        <div className="col" style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Ask the AI assistant</div>
          <div className="muted">Describe your symptoms and get a tailored program.</div>
        </div>
        <button className="btn sm" onClick={() => navigate("/assistant")}>Chat</button>
      </div>

      {data.news.length > 0 && (
        <>
          <div className="spread"><h2 className="section-title">News & events</h2><Link to="/news">See all</Link></div>
          <div className="news-strip">{data.news.map((n) => <NewsCard key={n.id} item={n} />)}</div>
        </>
      )}

      <h2 className="section-title">My programs</h2>
      <div className="grid">
        {data.assignments.map((a) => (
          <div key={a.id} className="card click row" onClick={() => navigate(`/programs/${a.program.id}`)}>
            <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📋</div>
            <div className="col" style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{a.program.name}</div>
              <div className="muted">{a.program.exercise_count} exercises</div>
            </div>
            <Badge text={statusMeta(a.status).label} color={statusMeta(a.status).color} />
          </div>
        ))}
      </div>
    </>
  );
}
