import { useParams } from "react-router-dom";

import { api } from "../api/client";
import { eventWhen } from "../components/NewsCard";
import { Badge, Empty, IconMark, Spinner, useApi } from "../components/ui";

export default function NewsDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.getFeed(), []);
  if (loading) return <Spinner />;
  const item = data?.find((a) => String(a.id) === id);
  if (!item) return <Empty icon="news" title="Not found" subtitle="This post may have been removed." />;
  const isEvent = item.kind === "EVENT";

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {item.image ? (
          <img src={item.image} alt="" style={{ width: "100%", height: 260, objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: 200, display: "grid", placeItems: "center", color: isEvent ? "var(--accent)" : "var(--primary)" }}>
            <IconMark name={isEvent ? "🎉" : "news"} size="lg" />
          </div>
        )}
        <div style={{ padding: 24 }}>
          <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? "var(--accent)" : "var(--primary)"} />
          <h1 style={{ margin: "12px 0 8px" }}>{item.title}</h1>
          {isEvent && (item.event_date || item.location) && (
            <div className="muted" style={{ marginBottom: 12 }}>
              {item.event_date ? eventWhen(item.event_date) : ""}
              {item.event_date && item.location ? " · " : ""}
              {item.location || ""}
            </div>
          )}
          <p style={{ lineHeight: 1.6 }}>{item.body}</p>
        </div>
      </div>
    </div>
  );
}
