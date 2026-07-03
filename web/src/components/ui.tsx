import {
  Activity,
  AlertTriangle,
  Bell,
  BellOff,
  Brain,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Footprints,
  Globe,
  Hand,
  HelpCircle,
  Home,
  Inbox,
  Layers,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
  PartyPopper,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ApiError } from "../api/client";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  exercises: Dumbbell,
  programs: Layers,
  patients: Users,
  messages: MessageCircle,
  assistant: Brain,
  progress: TrendingUp,
  profile: User,
  admin: ShieldCheck,
  review: ClipboardList,
  news: Newspaper,
  logout: LogOut,
  bell: Bell,
  plus: Plus,
  alert: AlertTriangle,
  empty: Inbox,
  search: Search,
  // body-part / difficulty semantic names
  activity: Activity,
  dumbbell: Dumbbell,
  hand: Hand,
  footprints: Footprints,
  "more-horizontal": MoreHorizontal,
  // legacy emoji literals still passed by a few Empty-state call sites
  "📰": Newspaper,
  "🎉": PartyPopper,
  "💬": MessageCircle,
  "✉️": Mail,
  "🔕": BellOff,
  "🏃": Footprints,
  "🌍": Globe,
  "📈": TrendingUp,
  "🏋️": Dumbbell,
  "🔍": Search,
  "🤷": HelpCircle,
  "📋": ClipboardList,
  "👥": Users,
};

export function Spinner() {
  return <div className="spinner" />;
}

export function IconMark({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const Cmp = ICONS[name] || HelpCircle;
  const px = size === "sm" ? 14 : size === "lg" ? 40 : 18;
  return <Cmp size={px} strokeWidth={1.8} aria-hidden="true" />;
}

export function Empty({ icon = "empty", title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="empty">
      <IconMark name={icon} size="lg" />
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10 }}>{title}</div>
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
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

export function IconTile({ icon }: { icon: string; /** Kept for call-site compatibility; unused in the flat design. */ grad?: string }) {
  return (
    <div className="tile">
      <IconMark name={icon} />
    </div>
  );
}

export function Stat({ label, value, icon, grad }: { label: string; value: string | number; icon: string; grad?: string }) {
  return (
    <div className="card stat">
      <IconTile icon={icon} grad={grad} />
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

/** Numbered section header with a rule line — mirrors the mobile `SLabel` atom. */
export function SLabel({ n, label, right }: { n: string; label: string; right?: string }) {
  return (
    <div className="slabel">
      <span className="n">{n}</span>
      <span className="rule" />
      <span className="lbl">{label}</span>
      {right && <span className="right">{right}</span>}
    </div>
  );
}

/** Scrolling marquee status strip. */
export function Ticker({ items }: { items: string[] }) {
  const text = items.join("   ◆   ");
  return (
    <div className="ticker">
      <div className="ticker-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
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

const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
};
const chartTick = { fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" };

/** Gradient-filled area trend chart (e.g. ROM / check-in scores over time). */
export function TrendAreaChart({
  data,
  dataKey,
  color = "var(--primary)",
  height = 160,
  gradientId,
  showTooltip = true,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color?: string;
  height?: number;
  gradientId: string;
  showTooltip?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" tick={chartTick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis tick={chartTick} axisLine={false} tickLine={false} />
        {showTooltip && <Tooltip contentStyle={chartTooltipStyle} />}
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Two-line comparison chart (e.g. patient vs. reference trajectory). */
export function TrendLineChart({
  data,
  lines,
  height = 140,
}: {
  data: Record<string, unknown>[];
  lines: { dataKey: string; color: string; dashed?: boolean }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={chartTick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis tick={chartTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={chartTooltipStyle} />
        {lines.map((l) => (
          <Line
            key={l.dataKey}
            type="monotone"
            dataKey={l.dataKey}
            stroke={l.color}
            strokeWidth={l.dashed ? 1.5 : 2}
            strokeDasharray={l.dashed ? "5 3" : undefined}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Something went wrong");
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

/** ≥80 → success, ≥70 → warning, else danger — the app-wide quality/ROM threshold convention. */
export function quality(value: number): string {
  if (value >= 80) return "var(--success)";
  if (value >= 70) return "var(--warning)";
  return "var(--danger)";
}

export const BODY_PART_META: Record<string, { label: string; icon: string }> = {
  SHOULDER: { label: "Shoulder", icon: "activity" },
  ELBOW: { label: "Elbow", icon: "dumbbell" },
  WRIST: { label: "Wrist", icon: "hand" },
  HIP: { label: "Hip", icon: "footprints" },
  KNEE: { label: "Knee", icon: "footprints" },
  ANKLE: { label: "Ankle", icon: "footprints" },
  BACK: { label: "Back", icon: "activity" },
  NECK: { label: "Neck", icon: "activity" },
  OTHER: { label: "Other", icon: "more-horizontal" },
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
  return (status && ASSIGNMENT_STATUS[status]) || { label: status || "-", color: "var(--muted)" };
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export { CheckCircle2 };
