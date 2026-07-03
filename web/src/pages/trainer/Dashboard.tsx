import { Link, useNavigate } from "react-router-dom";

import { api, type Assessment } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCard } from "../../components/NewsCard";
import {
  Avatar,
  Badge,
  Empty,
  IconTile,
  SLabel,
  Spinner,
  Stat,
  statusMeta,
  Ticker,
  timeAgo,
  useApi,
} from "../../components/ui";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi(async () => {
    const [ex, pr, pts, asg, asm, news] = await Promise.all([
      api.listExercises(),
      api.listPrograms(),
      api.listPatients(),
      api.listAssignments(),
      api.listAssessments(),
      api.getFeed().catch(() => []),
    ]);
    return { ex, pr, pts, asg, asm, news };
  });

  if (loading || !data) return <Spinner />;

  const myExercises = data.ex.filter((e) => !e.is_template && e.created_by?.id === user?.id).length;
  const myPrograms = data.pr.filter((p) => !p.is_template && p.created_by?.id === user?.id).length;
  const flagged = data.asm.filter((a) => a.pain_level >= 7).slice(0, 5);

  // Latest assignment + latest assessment per patient, for the roster table.
  const latestAssignment = new Map<string, (typeof data.asg)[number]>();
  for (const a of data.asg) {
    const pid = a.patient?.id;
    if (!pid) continue;
    const prev = latestAssignment.get(pid);
    if (!prev || (a.created_at || "") > (prev.created_at || "")) latestAssignment.set(pid, a);
  }
  const latestAssessment = new Map<string, Assessment>();
  for (const a of data.asm) {
    const pid = a.patient?.id;
    if (!pid) continue;
    if (!latestAssessment.has(pid)) latestAssessment.set(pid, a); // API returns newest first
  }

  const assignedToday = data.asg.filter((a) => a.created_at && new Date(a.created_at).toDateString() === new Date().toDateString()).length;

  const tickerItems = [
    `${data.pts.length} PATIENT${data.pts.length === 1 ? "" : "S"} ON ROSTER`,
    flagged.length > 0 ? `${flagged.length} FLAGGED CHECK-IN${flagged.length === 1 ? "" : "S"} NEEDING REVIEW` : "NO FLAGGED CHECK-INS",
    `${myPrograms} PROGRAM${myPrograms === 1 ? "" : "S"} · ${myExercises} EXERCISE${myExercises === 1 ? "" : "S"} AUTHORED`,
    ...flagged.slice(0, 2).map((a) => `⚠ ${(a.patient?.full_name || a.patient?.email || "PATIENT").toUpperCase()} — PAIN ${a.pain_level}/10`),
  ];

  return (
    <>
      <div className="hero">
        <div>
          <div className="sub">Trainer workspace</div>
          <h1>{user?.full_name || "Dashboard"}</h1>
        </div>
        <div className="hero-metrics">
          <span className="hero-pill">{data.pts.length} patients</span>
          <span className="hero-pill">{assignedToday} assigned today</span>
        </div>
      </div>

      <Ticker items={tickerItems} />

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <Stat label="Active patients" value={data.pts.length} icon="patients" />
        <Stat label="My programs" value={myPrograms} icon="programs" />
        <Stat label="My exercises" value={myExercises} icon="exercises" />
        <Stat label="Needs attention" value={flagged.length} icon="alert" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: 16, alignItems: "start" }}>
        <div>
          <SLabel n="02" label="Patient roster" right={`${data.pts.length} records`} />
          {data.pts.length === 0 ? (
            <div className="card"><Empty icon="patients" title="No patients yet" subtitle="Find and add patients from the Patients page." /></div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Program</th>
                    <th>Last active</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pts.map((p, i) => {
                    const assignment = latestAssignment.get(p.id);
                    const assessment = latestAssessment.get(p.id);
                    const isFlagged = assessment && assessment.pain_level >= 7;
                    return (
                      <tr
                        key={p.id}
                        className="click"
                        style={{ cursor: "pointer", borderLeft: isFlagged ? "2px solid var(--danger)" : "2px solid transparent" }}
                        onClick={() => navigate(`/patients/${p.id}`)}
                      >
                        <td className="faint">{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <Avatar name={p.full_name || p.email} size={28} />
                            <span style={{ fontWeight: 500 }}>{p.full_name || p.email}</span>
                          </div>
                        </td>
                        <td className="muted">{assignment ? assignment.program.name : "—"}</td>
                        <td className="muted">{assessment?.created_at ? timeAgo(assessment.created_at) : "—"}</td>
                        <td>{assignment ? <Badge text={statusMeta(assignment.status).label} color={statusMeta(assignment.status).color} /> : <Badge text="No program" color="var(--muted)" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <SLabel n="03" label="Needs attention" right={flagged.length ? `${flagged.length} open` : undefined} />
          {flagged.length === 0 ? (
            <div className="card"><Empty icon="alert" title="Nothing flagged" subtitle="High-pain check-ins will show up here." /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
              {flagged.map((a) => (
                <AttentionRow key={a.id} assessment={a} />
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">Quick actions</h2>
      <div className="grid cols-2">
        <button className="card click row" onClick={() => navigate("/exercises/new")} style={{ textAlign: "left", color: "inherit" }}>
          <IconTile icon="plus" />
          <span className="col">
            <strong>New exercise</strong>
            <span className="muted">Record or upload a guided movement</span>
          </span>
        </button>
        <button className="card click row" onClick={() => navigate("/programs/new")} style={{ textAlign: "left", color: "inherit" }}>
          <IconTile icon="programs" />
          <span className="col">
            <strong>New program</strong>
            <span className="muted">Group exercises and assign care</span>
          </span>
        </button>
      </div>

      {data.news.length > 0 && (
        <>
          <div className="spread">
            <h2 className="section-title">News & events</h2>
            <Link to="/news">See all</Link>
          </div>
          <div className="news-strip">
            {data.news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function AttentionRow({ assessment }: { assessment: Assessment }) {
  return (
    <div className="row" style={{ background: "var(--surface)", borderLeft: "2px solid var(--danger)", padding: "10px 14px" }}>
      <div className="col" style={{ flex: 1 }}>
        <strong style={{ fontSize: 13 }}>{assessment.patient?.full_name || assessment.patient?.email || "Patient"}</strong>
        <span className="muted">Reported high pain ({assessment.pain_level}/10)</span>
      </div>
    </div>
  );
}
