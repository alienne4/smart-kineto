import { useState } from "react";
import { Link } from "react-router-dom";

import { ApiError, Role } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ email: email.trim(), full_name: fullName.trim(), role, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <h1 style={{ marginTop: 0 }}>Create your account</h1>
        <p className="muted" style={{ marginTop: -6 }}>Start your recovery journey today.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>FULL NAME</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="field">
            <label>EMAIL</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>PASSWORD</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>I AM A…</label>
            <div className="chips">
              <button type="button" className={`chip ${role === "PATIENT" ? "active" : ""}`} onClick={() => setRole("PATIENT")}>🏃 Patient</button>
              <button type="button" className={`chip ${role === "TRAINER" ? "active" : ""}`} onClick={() => setRole("TRAINER")}>🏋️ Trainer</button>
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" style={{ width: "100%" }} disabled={loading}>{loading ? "…" : "Sign up"}</button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginBottom: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
