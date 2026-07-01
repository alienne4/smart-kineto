import { useEffect, useState } from "react";

export type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "muted";

const toneColors: Record<Tone, string> = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  muted: "var(--muted)"
};

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function Empty({ icon = "inbox", title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="empty">
      <IconMark name={icon} size="lg" />
      <strong>{title}</strong>
      {subtitle ? <span>{subtitle}</span> : null}
    </div>
  );
}

export function Badge({ text, tone = "primary", color }: { text: string; tone?: Tone; color?: string }) {
  const tint = color || toneColors[tone];
  return (
    <span className="badge" style={{ color: tint, borderColor: `${tint}66`, background: `${tint}1a` }}>
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
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export function IconMark({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`icon-mark ${size}`} data-icon={name} aria-hidden="true" />;
}

export function IconTile({
  icon,
  grad = "linear-gradient(135deg, var(--primary), var(--primary-dark))"
}: {
  icon: string;
  grad?: string;
}) {
  return (
    <div className="tile" style={{ background: grad }}>
      <IconMark name={icon} />
    </div>
  );
}

export function Stat({
  label,
  value,
  icon,
  grad
}: {
  label: string;
  value: string | number;
  icon: string;
  grad?: string;
}) {
  return (
    <div className="card stat">
      <IconTile icon={icon} grad={grad} />
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
}) {
  return (
    <button {...props} type={type} className={`btn ${variant !== "primary" ? variant : ""} ${size === "sm" ? "sm" : ""} ${props.className || ""}`}>
      {children}
    </button>
  );
}

export function Field({
  label,
  textarea,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  textarea?: false;
  error?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} className={`input ${props.className || ""}`} />
      {error ? <em>{error}</em> : null}
    </label>
  );
}

export function ProgressBar({ value, tone = "success" }: { value: number; tone?: Tone }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: toneColors[tone] }} />
    </div>
  );
}

export function useApi<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...deps, version]);

  return { data, loading, error, reload: () => setVersion((next) => next + 1) };
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}
