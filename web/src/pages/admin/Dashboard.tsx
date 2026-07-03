import { Link } from "react-router-dom";

import { api } from "../../api/client";
import { Avatar, Badge, Empty, IconTile, SLabel, Spinner, Stat, Ticker, useApi } from "../../components/ui";

export default function AdminDashboard() {
  const { data, loading } = useApi(async () => {
    const [stats, review, users] = await Promise.all([
      api.adminStats(),
      api.adminReviewQueue(),
      api.adminUsers(),
    ]);
    return { stats, review, users };
  });

  if (loading || !data) return <Spinner />;
  const { stats, review, users } = data;

  const pending = stats.pending_exercises + stats.pending_programs;
  const totalUsers = stats.trainers + stats.patients;
  const publicContent = stats.public_exercises + stats.public_programs;
  const recentUsers = [...users]
    .sort((a, b) => (b.date_joined || "").localeCompare(a.date_joined || ""))
    .slice(0, 8);

  const reviewItems = [
    ...review.exercises.map((e) => ({ id: e.id, name: e.title, type: "Exercise", author: e.author })),
    ...review.programs.map((p) => ({ id: p.id, name: p.name, type: "Program", author: p.author })),
  ].slice(0, 6);

  const tickerItems = [
    `${totalUsers} ACTIVE USERS`,
    `${pending} PENDING REVIEW`,
    `${stats.announcements} PUBLISHED ANNOUNCEMENTS`,
    `${publicContent} PUBLIC ITEMS`,
  ];

  return (
    <>
      <div className="hero">
        <div className="sub">Admin console</div>
        <h1>Platform overview</h1>
      </div>

      <Ticker items={tickerItems} />

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <Stat label="Total users" value={totalUsers} icon="patients" />
        <Stat label="Pending review" value={pending} icon="review" />
        <Stat label="Public content" value={publicContent} icon="🌍" />
        <Stat label="Announcements" value={stats.announcements} icon="news" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: 16, alignItems: "start" }}>
        <div>
          <SLabel n="01" label="Review queue" right={`${pending} pending`} />
          {reviewItems.length === 0 ? (
            <div className="card"><Empty icon="review" title="All caught up" subtitle="No items waiting for review." /></div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                {reviewItems.map((r) => (
                  <div key={`${r.type}-${r.id}`} className="row" style={{ background: "var(--surface)", borderLeft: "2px solid var(--warning)", padding: "10px 14px" }}>
                    <div className="col" style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13 }}>{r.name}</strong>
                      <span className="muted">by {r.author || "unknown"}</span>
                    </div>
                    <Badge text={r.type} color="var(--warning)" />
                  </div>
                ))}
              </div>
              <Link to="/admin/review" className="btn sm" style={{ marginTop: 12, display: "inline-flex" }}>View all {pending}</Link>
            </>
          )}
        </div>

        <div>
          <SLabel n="02" label="Platform breakdown" />
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Trainers", value: stats.trainers },
              { label: "Patients", value: stats.patients },
              { label: "Exercises", value: stats.exercises },
              { label: "Programs", value: stats.programs },
              { label: "Public exercises", value: stats.public_exercises },
              { label: "Public programs", value: stats.public_programs },
            ].map((row) => (
              <div key={row.label} className="spread">
                <span className="muted">{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SLabel n="03" label="Recent users" right={`${users.length} total`} />
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="row">
                    <Avatar name={u.full_name || u.email} size={32} />
                    <span className="col" style={{ gap: 0 }}>
                      <span style={{ fontWeight: 500 }}>{u.full_name || "—"}</span>
                      <span className="faint">{u.email}</span>
                    </span>
                  </div>
                </td>
                <td><Badge text={u.role} color={u.role === "TRAINER" ? "var(--primary)" : "var(--success)"} /></td>
                <td className="muted">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}</td>
                <td>{u.is_admin && <Badge text="ADMIN" color="var(--accent)" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Content</h2>
      <div className="grid cols-2">
        <Link to="/admin/announcements" className="card click row" style={{ textDecoration: "none", color: "inherit" }}>
          <IconTile icon="news" />
          <div className="col"><div style={{ fontWeight: 700 }}>News & events</div><div className="muted">{stats.announcements} published</div></div>
        </Link>
        <Link to="/admin/users" className="card click row" style={{ textDecoration: "none", color: "inherit" }}>
          <IconTile icon="patients" />
          <div className="col"><div style={{ fontWeight: 700 }}>Manage users</div><div className="muted">{totalUsers} accounts</div></div>
        </Link>
      </div>
    </>
  );
}
