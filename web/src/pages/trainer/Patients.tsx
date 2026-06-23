import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { Avatar, Empty, Spinner, useApi } from "../../components/ui";

export default function Patients() {
  const navigate = useNavigate();
  const { data, loading } = useApi(() => api.listPatients());

  return (
    <>
      <div className="spread">
        <h1 className="section-title" style={{ margin: 0 }}>Patients</h1>
        <button className="btn" onClick={() => navigate("/patients/find")}>🔍 Find & add</button>
      </div>

      {loading ? (
        <Spinner />
      ) : (data || []).length === 0 ? (
        <Empty icon="👥" title="No patients yet" subtitle="Use “Find & add” to link patients to your roster." />
      ) : (
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          {data!.map((p) => (
            <div key={p.id} className="card click row" onClick={() => navigate(`/patients/${p.id}`)}>
              <Avatar name={p.full_name || p.email} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.full_name || p.email}</div>
                <div className="muted truncate">{p.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
