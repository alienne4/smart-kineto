import { useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

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
    <div className="center-screen">
      <div className="card auth-card">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          <div className="logo">SK</div>
          <h1 style={{ fontSize: 22 }}>SmartKinetoFit</h1>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>Guided kinesiotherapy, scored in real time.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>EMAIL</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>PASSWORD</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" style={{ width: "100%" }} disabled={loading}>{loading ? "…" : "Log in"}</button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginBottom: 0 }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
