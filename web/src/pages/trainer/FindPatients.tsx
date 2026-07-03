import { useEffect, useState } from "react";

import { api, AuthUser } from "../../api/client";
import { Avatar, Empty, Spinner } from "../../components/ui";

export default function FindPatients() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api.searchPatients(q.trim()).then(setResults).catch(() => setResults([])).finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  async function add(p: AuthUser) {
    await api.addPatient(p.id);
    setAdded((s) => new Set(s).add(p.id));
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Find & add patients</h1>
      <input className="input" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 18 }} />
      {loading ? (
        <Spinner />
      ) : q.trim().length < 2 ? (
        <Empty icon="search" title="Search patients" subtitle="Type at least 2 characters to search." />
      ) : results.length === 0 ? (
        <Empty icon="empty" title="No matches" subtitle="No patients found for that search." />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {results.map((p) => (
            <div key={p.id} className="card row">
              <Avatar name={p.full_name || p.email} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.full_name || p.email}</div>
                <div className="muted truncate">{p.email}</div>
              </div>
              <button className="btn sm" disabled={added.has(p.id)} onClick={() => add(p)}>{added.has(p.id) ? "✓ Added" : "Add"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
