import { Link, useNavigate } from "react-router-dom";

import { api, type Assessment, type AuthUser } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCard } from "../../components/NewsCard";
import { Avatar, Empty, IconTile, Spinner, Stat, useApi } from "../../components/ui";

const cyan = "linear-gradient(135deg,#22d3ee,#0891b2)";
const violet = "linear-gradient(135deg,#8b5cf6,#6d28d9)";
const emerald = "linear-gradient(135deg,#34d399,#059669)";
const rose = "linear-gradient(135deg,#fb7185,#e11d48)";

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
      <section className="hero">
        <div>
          <div className="sub">Trainer workspace</div>
          <h1>{user?.full_name || "Dashboard"}</h1>
        </div>
        <div className="hero-metrics" aria-label="Trainer dashboard summary">
          <span className="hero-pill">{data.pts.length} patients</span>
          <span className="hero-pill">{myExercises + myPrograms} assets</span>
        </div>
      </section>

      <section className="grid cols-3">
        <Stat label="My exercises" value={myExercises} icon="exercises" grad={cyan} />
        <Stat label="My programs" value={myPrograms} icon="programs" grad={violet} />
        <Stat label="Patients" value={data.pts.length} icon="patients" grad={emerald} />
      </section>

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

      <h2 className="section-title">Quick actions</h2>
      <section className="grid cols-2">
        <ActionCard
          title="New exercise"
          subtitle="Record or upload a guided movement"
          icon="plus"
          grad={cyan}
          onClick={() => navigate("/exercises/new")}
        />
        <ActionCard
          title="New program"
          subtitle="Group exercises and assign care"
          icon="programs"
          grad={violet}
          onClick={() => navigate("/programs/new")}
        />
      </section>

      {flagged.length > 0 && (
        <>
          <div className="spread">
            <h2 className="section-title">Needs attention</h2>
            <Link to="/patients">Review patients</Link>
          </div>
          <section className="grid">
            {flagged.map((assessment) => (
              <AttentionCard key={assessment.id} assessment={assessment} />
            ))}
          </section>
        </>
      )}

      <div className="spread">
        <h2 className="section-title">Patients</h2>
        <Link to="/patients">See all</Link>
      </div>
      {data.pts.length === 0 ? (
        <Empty icon="patients" title="No patients yet" subtitle="Find and add patients from the Patients page." />
      ) : (
        <section className="grid cols-2">
          {data.pts.slice(0, 6).map((patient) => (
            <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/patients/${patient.id}`)} />
          ))}
        </section>
      )}
    </>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  grad,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  grad: string;
  onClick: () => void;
}) {
  return (
    <button className="card click row" onClick={onClick} style={{ textAlign: "left", color: "inherit" }}>
      <IconTile icon={icon} grad={grad} />
      <span className="col">
        <strong>{title}</strong>
        <span className="muted">{subtitle}</span>
      </span>
    </button>
  );
}

function AttentionCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="card row">
      <IconTile icon="alert" grad={rose} />
      <div className="col">
        <strong>{assessment.patient?.full_name || assessment.patient?.email || "Patient"}</strong>
        <span className="muted">Reported high pain ({assessment.pain_level}/10)</span>
      </div>
    </div>
  );
}

function PatientCard({ patient, onClick }: { patient: AuthUser; onClick: () => void }) {
  return (
    <button className="card click row" onClick={onClick} style={{ textAlign: "left", color: "inherit" }}>
      <Avatar name={patient.full_name || patient.email} size={40} />
      <span className="col" style={{ flex: 1 }}>
        <strong>{patient.full_name || patient.email}</strong>
        <span className="muted truncate">{patient.email}</span>
      </span>
    </button>
  );
}
