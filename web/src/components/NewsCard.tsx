import { useNavigate } from "react-router-dom";

import { Announcement } from "../api/client";
import { Badge } from "./ui";

export function eventWhen(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function NewsCard({ item }: { item: Announcement }) {
  const navigate = useNavigate();
  const isEvent = item.kind === "EVENT";
  return (
    <div className="card click news-card" onClick={() => navigate(`/news/${item.id}`)}>
      {item.image ? (
        <img className="img" src={item.image} alt="" />
      ) : (
        <div className="img" style={{ background: isEvent ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "linear-gradient(135deg,#22d3ee,#0891b2)" }} />
      )}
      <div className="nbody">
        <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? "var(--accent)" : "var(--primary)"} />
        <div style={{ fontWeight: 700, margin: "8px 0 4px" }}>{item.title}</div>
        <div className="muted truncate">
          {isEvent && item.event_date ? `${eventWhen(item.event_date)}${item.location ? ` · ${item.location}` : ""}` : item.body}
        </div>
      </div>
    </div>
  );
}
