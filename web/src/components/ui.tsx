import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../api/client";

export function Spinner() {
  return <div className="spinner" />;
}

export function Empty({ icon = "📭", title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
      {subtitle && <div className="muted" style={{ marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

export function Badge({ text, color = "var(--primary)" }: { text: string; color?: string }) {
  return (
    <span className="badge" style={{ color, borderColor: color + "66", background: color + "1a" }}>
      {text}
    </span>
  );
}

export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export function Stat({ label, value, icon, grad }: { label: string; value: string | number; icon: string; grad: string }) {
  return (
    <div className="card stat">
      <div className="tile" style={{ background: grad }}>{icon}</div>
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export function BarChart({ data, color, max = 10 }: { data: { label: string; value: number }[]; color: string; max?: number }) {
  if (!data.length) return null;
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="bar-wrap" key={i}>
          <div className="bar-col">
            <div className="bar" style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, background: color }} />
          </div>
          <div className="faint">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function useApi<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export const BODY_PART_META: Record<string, { label: string; icon: string; grad: string }> = {
  SHOULDER: { label: "Shoulder", icon: "💪", grad: "linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  ELBOW: { label: "Elbow", icon: "🦾", grad: "linear-gradient(135deg,#fbbf24,#d97706)" },
  WRIST: { label: "Wrist", icon: "✋", grad: "linear-gradient(135deg,#34d399,#059669)" },
  HIP: { label: "Hip", icon: "🦵", grad: "linear-gradient(135deg,#fb7185,#e11d48)" },
  KNEE: { label: "Knee", icon: "🦵", grad: "linear-gradient(135deg,#22d3ee,#0891b2)" },
  ANKLE: { label: "Ankle", icon: "🦶", grad: "linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  BACK: { label: "Back", icon: "🧍", grad: "linear-gradient(135deg,#34d399,#059669)" },
  NECK: { label: "Neck", icon: "🧎", grad: "linear-gradient(135deg,#fbbf24,#d97706)" },
  OTHER: { label: "Other", icon: "⚙️", grad: "linear-gradient(135deg,#22d3ee,#0891b2)" },
};

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  EASY: { label: "Easy", color: "var(--success)" },
  MEDIUM: { label: "Medium", color: "var(--warning)" },
  HARD: { label: "Hard", color: "var(--danger)" },
};

export const ASSIGNMENT_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Not started", color: "var(--muted)" },
  IN_PROGRESS: { label: "In progress", color: "var(--warning)" },
  PAUSED: { label: "Paused", color: "var(--muted)" },
  COMPLETED: { label: "Completed", color: "var(--success)" },
};

export function statusMeta(status?: string) {
  return (status && ASSIGNMENT_STATUS[status]) || { label: status || "—", color: "var(--muted)" };
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}
