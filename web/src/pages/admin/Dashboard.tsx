import { Link } from "react-router-dom";

import { api } from "../../api/client";
import { Spinner, Stat, useApi } from "../../components/ui";

export default function AdminDashboard() {
  const { data, loading } = useApi(() => api.adminStats());
  if (loading || !data) return <Spinner />;

  const pending = data.pending_exercises + data.pending_programs;

  return (
    <>
      <div className="hero" style={{ background: "linear-gradient(135deg,#6d28d9,#1e293b)" }}>
        <div className="sub">Admin console</div>
        <h1>Platform overview</h1>
      </div>

      <div className="grid cols-4">
        <Stat label="Trainers" value={data.trainers} icon="🏋️" grad="linear-gradient(135deg,#22d3ee,#0891b2)" />
        <Stat label="Patients" value={data.patients} icon="🏃" grad="linear-gradient(135deg,#34d399,#059669)" />
        <Stat label="Exercises" value={data.exercises} icon="🏋️" grad="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
        <Stat label="Programs" value={data.programs} icon="📋" grad="linear-gradient(135deg,#fbbf24,#d97706)" />
      </div>

      <h2 className="section-title">Moderation</h2>
      <div className="grid cols-3">
        <Link to="/admin/review" className="card click" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat">
            <div className="tile" style={{ background: pending > 0 ? "var(--warning)" : "var(--success)" }}>✅</div>
            <div className="val">{pending}</div>
            <div className="lbl">Pending review{pending !== 1 ? "s" : ""}</div>
          </div>
        </Link>
        <Stat label="Public exercises" value={data.public_exercises} icon="🌍" grad="linear-gradient(135deg,#22d3ee,#0891b2)" />
        <Stat label="Public programs" value={data.public_programs} icon="🌍" grad="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
      </div>

      <h2 className="section-title">Content</h2>
      <div className="grid cols-2">
        <Link to="/admin/announcements" className="card click row" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#22d3ee,#0891b2)" }}>📰</div>
          <div className="col"><div style={{ fontWeight: 700 }}>News & events</div><div className="muted">{data.announcements} published</div></div>
        </Link>
        <Link to="/admin/users" className="card click row" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#34d399,#059669)" }}>🗂️</div>
          <div className="col"><div style={{ fontWeight: 700 }}>Manage users</div><div className="muted">{data.trainers + data.patients} accounts</div></div>
        </Link>
      </div>
    </>
  );
}
