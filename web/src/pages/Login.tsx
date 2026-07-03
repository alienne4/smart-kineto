import { useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { IconMark, Ticker } from "../components/ui";

const TAGS = ["MOBILE", "WEB", "BLE", "ESP32", "MPU6050"];
const CHIPS = ["BLE 5.0", "ESP32-S3", "MPU6050", "ROM TRACKING", "TRAJECTORY AI"];
const TICKER_ITEMS = [
  "PATIENT ROLE",
  "TRAINER ROLE",
  "ADMIN ROLE",
  "BLE 5.0",
  "ESP32-S3",
  "MPU6050",
  "ROM TRACKING",
  "TRAJECTORY AI",
  "REHABILITATION INTELLIGENCE",
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cover">
      <div className="cover-grid-bg" />

      <div className="cover-topbar">
        <div className="cover-wordmark">
          <IconMark name="activity" size="sm" />
          <span>SMARTKINETOFIT</span>
        </div>
        <div className="cover-tags">
          {TAGS.map((t) => (
            <span key={t} className="cover-tag">{t}</span>
          ))}
        </div>
        <span className="cover-date">REHABILITATION INTELLIGENCE PLATFORM</span>
      </div>

      <Ticker items={TICKER_ITEMS} bg="var(--cov-text)" fg="var(--cov-bg)" />

      <div className="cover-main">
        <div className="cover-main-inner">
          <div className="cover-brand">
            <div className="cover-eyebrow">REHABILITATION INTELLIGENCE PLATFORM</div>
            <h1 className="cover-title">
              SMART<br />
              KINETO<span className="dot" aria-hidden="true" /><br />
              FIT
            </h1>
            <p className="cover-desc">
              A clinical rehabilitation platform powered by ESP32 + MPU6050 smart wand. Tracks ROM, repetitions, BLE
              status, movement trajectory, and recovery progress across patient and physiotherapist roles.
            </p>
            <div className="cover-chips">
              {CHIPS.map((c) => (
                <span key={c} className="cover-chip">{c}</span>
              ))}
            </div>
          </div>

          <form className="cover-panel" onSubmit={submit}>
            <div className="cover-row">
              <label htmlFor="login-email">EMAIL</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="cover-row">
              <label htmlFor="login-password">PASSWORD</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="cover-row cover-row-error">
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="cover-row-action" disabled={loading}>
              <span>{loading ? "AUTHENTICATING…" : "LOG IN"}</span>
              <IconMark name="arrow-right" size="sm" />
            </button>
            <div className="cover-row cover-row-link">
              <span>NO ACCOUNT?</span>
              <Link to="/register">CREATE ONE</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="cover-footer">
        <span>SKF.DESIGN · SECURE SESSION</span>
        <span>REACT NATIVE · REACT · NODE</span>
      </div>
    </div>
  );
}
