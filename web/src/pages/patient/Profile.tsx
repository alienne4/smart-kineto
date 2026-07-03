import { useState } from "react";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Spinner, useApi } from "../../components/ui";

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { data: trainers, loading } = useApi(() => api.listTrainers());
  const [saving, setSaving] = useState<string | null>(null);

  async function pick(trainerId: string) {
    setSaving(trainerId);
    await api.setTrainer(trainerId);
    await refreshUser();
    setSaving(null);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Profile</h1>

      <div className="card row">
        <Avatar name={user?.full_name} size={64} />
        <div className="col">
          <div style={{ fontWeight: 800, fontSize: 20 }}>{user?.full_name}</div>
          <div className="muted">{user?.email}</div>
        </div>
      </div>

      <h2 className="section-title">My trainer</h2>
      {user?.trainer ? (
        <div className="card row">
          <Avatar name={user.trainer.full_name} />
          <div className="col" style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{user.trainer.full_name}</div>
            <div className="muted">{user.trainer.email}</div>
          </div>
        </div>
      ) : loading ? (
        <Spinner />
      ) : (
        <>
          <p className="muted">Choose a trainer to guide your recovery.</p>
          <div className="grid" style={{ gap: 10 }}>
            {(trainers || []).map((t) => (
              <div key={t.id} className="card row">
                <Avatar name={t.full_name || t.email} />
                <div className="col" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{t.full_name || t.email}</div>
                  <div className="muted truncate">{t.email}</div>
                </div>
                <button className="btn sm" disabled={saving === t.id} onClick={() => pick(t.id)}>{saving === t.id ? "…" : "Choose"}</button>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn danger" style={{ marginTop: 24 }} onClick={logout}>Log out</button>
    </div>
  );
}
