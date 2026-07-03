import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCard } from "../../components/NewsCard";
import {
  Badge,
  Empty,
  IconTile,
  SLabel,
  Spinner,
  Stat,
  statusMeta,
  Ticker,
  TrendLineChart,
  useApi,
} from "../../components/ui";

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
  const queue = next
    ? [...next.program.program_exercises].sort((a, b) => a.order - b.order)
    : [];

  // Chronological check-in trend (oldest first) reshaped for the chart.
  const trend = [...data.assessments]
    .reverse()
    .map((a) => ({
      label: a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
      pain: a.pain_level,
      mobility: a.mobility_score,
    }));

  const tickerItems = [
    next ? `${next.program.name.toUpperCase()} · ${statusMeta(next.status).label.toUpperCase()}` : "NO ACTIVE PROGRAM",
    `${active.length} ACTIVE PROGRAM${active.length === 1 ? "" : "S"}`,
    latest ? `LAST CHECK-IN · PAIN ${latest.pain_level}/10 · MOBILITY ${latest.mobility_score}/10` : "NO CHECK-INS YET",
    user?.trainer ? `TRAINER · ${user.trainer.full_name.toUpperCase()}` : "NO TRAINER LINKED",
  ];

  return (
    <>
      <div className="hero">
        <div>
          <div className="sub">Your recovery journey</div>
          <h1>{user?.full_name}</h1>
        </div>
        <div className="hero-metrics">
          {next && <span className="hero-pill">{next.program.exercise_count} exercises</span>}
          <span className="hero-pill">{data.assessments.length} check-ins</span>
        </div>
      </div>

      <Ticker items={tickerItems} />

      {!user?.trainer && (
        <div className="notice" style={{ marginTop: 16 }}>
          <span>🔗</span>
          <div style={{ flex: 1 }}>You haven't linked a trainer yet.</div>
          <button className="btn sm" onClick={() => navigate("/profile")}>Pick trainer</button>
        </div>
      )}

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <Stat label="Active programs" value={active.length} icon="programs" />
        <Stat label="Today's focus" value={next ? next.program.exercise_count : "—"} icon="exercises" />
        <Stat label="Last pain" value={latest ? `${latest.pain_level}/10` : "—"} icon="alert" />
        <Stat label="Last mobility" value={latest ? `${latest.mobility_score}/10` : "—"} icon="progress" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: 16, alignItems: "stretch" }}>
        <div className="card">
          <SLabel n="01" label="Check-in trend" right={data.assessments.length ? `${data.assessments.length} logged` : undefined} />
          {trend.length > 1 ? (
            <TrendLineChart
              data={trend}
              lines={[
                { dataKey: "pain", color: "var(--danger)" },
                { dataKey: "mobility", color: "var(--success)" },
              ]}
            />
          ) : (
            <div className="muted" style={{ padding: "24px 0" }}>Log a couple of check-ins to see your trend here.</div>
          )}
          <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => navigate("/progress")}>Check in</button>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <SLabel n="02" label="Today's queue" />
          {next ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", flex: 1 }}>
                {queue.map((pe, i) => (
                  <div
                    key={pe.id}
                    className="row"
                    style={{
                      background: i === 0 ? "rgba(212,255,0,0.08)" : "var(--surface)",
                      borderLeft: i === 0 ? "2px solid var(--primary)" : "2px solid transparent",
                      padding: "9px 12px",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: i === 0 ? "var(--primary)" : "var(--muted)", width: 20 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="col" style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{pe.exercise.title}</div>
                      <div className="faint">{pe.sets}×{pe.reps}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn" style={{ marginTop: 12 }} onClick={() => navigate(`/programs/${next.program.id}`)}>Continue session</button>
            </>
          ) : (
            <Empty icon="empty" title="No active program" subtitle="Your trainer will assign one soon." />
          )}
        </div>
      </div>

      <div className="card row" style={{ marginTop: 16 }}>
        <IconTile icon="progress" />
        <div className="col" style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>How are you feeling today?</div>
          <div className="muted">Log a quick check-in for your trainer.</div>
        </div>
        <button className="btn ghost sm" onClick={() => navigate("/progress")}>Check in</button>
      </div>

      <div className="card row" style={{ marginTop: 16 }}>
        <IconTile icon="assistant" />
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
            <IconTile icon="programs" />
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
