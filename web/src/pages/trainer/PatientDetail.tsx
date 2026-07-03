import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { Avatar, BarChart, Badge, Empty, IconTile, Spinner, statusMeta, timeAgo, useApi } from "../../components/ui";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useApi(async () => {
    const [patients, assessments, assignments] = await Promise.all([
      api.listPatients(),
      api.listAssessments(id),
      api.listAssignments(),
    ]);
    return {
      patient: patients.find((p) => p.id === id) || null,
      assessments,
      assignments: assignments.filter((a) => a.patient?.id === id),
    };
  }, [id]);

  if (loading || !data) return <Spinner />;
  if (!data.patient) return <Empty icon="empty" title="Patient not found" />;

  const recent = data.assessments.slice(0, 7).reverse();
  const latest = data.assessments[0];

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="card row">
        <Avatar name={data.patient.full_name || data.patient.email} size={56} />
        <div className="col" style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>{data.patient.full_name || data.patient.email}</h1>
          <div className="muted">{data.patient.email}</div>
        </div>
        <button className="btn" onClick={() => navigate(`/messages/${data.patient!.id}`)}>Message</button>
      </div>

      {latest && (
        <>
          <h2 className="section-title">Latest check-in · {timeAgo(latest.created_at!)}</h2>
          <div className="grid cols-2">
            <div className="card">
              <div className="muted">Pain level</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1, color: latest.pain_level >= 7 ? "var(--danger)" : "var(--text)" }}>{latest.pain_level}/10</div>
              <BarChart data={recent.map((a, i) => ({ label: `${i + 1}`, value: a.pain_level }))} color="var(--danger)" />
            </div>
            <div className="card">
              <div className="muted">Mobility</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1, color: "var(--success)" }}>{latest.mobility_score}/10</div>
              <BarChart data={recent.map((a, i) => ({ label: `${i + 1}`, value: a.mobility_score }))} color="var(--success)" />
            </div>
          </div>
        </>
      )}

      <h2 className="section-title">Assigned programs</h2>
      {data.assignments.length === 0 ? (
        <Empty icon="programs" title="No programs assigned" subtitle="Assign a program from the Programs page." />
      ) : (
        <div className="grid">
          {data.assignments.map((a) => (
            <div key={a.id} className="card row click" onClick={() => navigate(`/programs/${a.program.id}`)}>
              <IconTile icon="programs" />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.program.name}</div>
                <div className="muted">{a.program.exercise_count} exercises</div>
              </div>
              <Badge text={statusMeta(a.status).label} color={statusMeta(a.status).color} />
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Assessment history</h2>
      {data.assessments.length === 0 ? (
        <Empty icon="progress" title="No assessments yet" />
      ) : (
        <div className="grid">
          {data.assessments.map((a) => (
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
    </div>
  );
}
