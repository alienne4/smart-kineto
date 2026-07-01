import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { Button, Field } from "../../components/ui";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <div className="logo">SK</div>
          <h1>SmartKinetoFit</h1>
        </div>
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <div className="error-text">{error}</div> : null}
        <Button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Signing in..." : "Sign in"}
        </Button>
        <p className="muted" style={{ textAlign: "center" }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TRAINER" | "PATIENT">("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ email, password, full_name: fullName, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <div className="logo">SK</div>
          <h1>SmartKinetoFit</h1>
        </div>
        <Field label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label className="field">
          <span>Role</span>
          <select className="input" value={role} onChange={(event) => setRole(event.target.value as "TRAINER" | "PATIENT")}>
            <option value="PATIENT">Patient</option>
            <option value="TRAINER">Trainer</option>
          </select>
        </label>
        {error ? <div className="error-text">{error}</div> : null}
        <Button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Creating account..." : "Create account"}
        </Button>
        <p className="muted" style={{ textAlign: "center" }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
