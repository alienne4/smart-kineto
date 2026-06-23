import { useState } from "react";

import { api } from "../../api/client";
import { Avatar, Badge, Spinner, useApi } from "../../components/ui";

export default function AdminUsers() {
  const { data, loading } = useApi(() => api.adminUsers());
  const [filter, setFilter] = useState<"ALL" | "TRAINER" | "PATIENT">("ALL");

  const rows = (data || []).filter((u) => filter === "ALL" || u.role === filter);

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>Users</h1>
      <div className="segment">
        {(["ALL", "TRAINER", "PATIENT"] as const).map((f) => (
          <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All" : f === "TRAINER" ? "Trainers" : "Patients"}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <Avatar name={u.full_name || u.email} size={32} />
                      <span>{u.full_name || "—"}</span>
                      {u.is_admin && <Badge text="ADMIN" color="var(--accent)" />}
                    </div>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td><Badge text={u.role} color={u.role === "TRAINER" ? "var(--primary)" : "var(--success)"} /></td>
                  <td className="faint">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
