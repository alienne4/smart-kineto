import { api } from "../api/client";
import { Empty, Spinner, timeAgo, useApi } from "../components/ui";

const META: Record<string, { icon: string; color: string }> = {
  assignment: { icon: "📋", color: "var(--accent)" },
  message: { icon: "💬", color: "var(--primary)" },
  progress: { icon: "🏆", color: "var(--success)" },
  assessment: { icon: "📈", color: "var(--danger)" },
  reminder: { icon: "🔔", color: "var(--warning)" },
};

export default function Notifications() {
  const { data, loading, reload } = useApi(() => api.listNotifications());

  async function markAll() {
    await api.markAllNotificationsRead();
    reload();
  }

  const hasUnread = (data || []).some((n) => !n.read_at);

  return (
    <>
      <div className="spread" style={{ marginBottom: 16 }}>
        <h1 className="section-title" style={{ margin: 0 }}>Notifications</h1>
        {hasUnread && <button className="btn ghost sm" onClick={markAll}>Mark all read</button>}
      </div>
      {loading ? (
        <Spinner />
      ) : data && data.length ? (
        <div className="grid">
          {data.map((n) => {
            const m = META[n.type] || META.reminder;
            return (
              <div key={n.id} className="card row" style={!n.read_at ? { borderColor: "var(--primary)" } : undefined}>
                <div className="tile" style={{ background: m.color }}>{m.icon}</div>
                <div className="col" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  {n.body && <div className="muted">{n.body}</div>}
                  <div className="faint">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read_at && <div className="dot" />}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon="🔕" title="No notifications" subtitle="Assignments, messages and progress updates show up here." />
      )}
    </>
  );
}
