import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, MEDIA_ORIGIN } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, BODY_PART_META, DIFFICULTY_META, Spinner, useApi } from "../../components/ui";

const REVIEW_COLOR: Record<string, string> = {
  PENDING: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

export default function ExerciseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: e, loading, reload } = useApi(() => api.getExercise(id!), [id]);
  const [busy, setBusy] = useState(false);

  if (loading || !e) return <Spinner />;

  const mine = !e.is_template && e.created_by?.id === user?.id;
  const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[e.difficulty];

  async function clone() {
    setBusy(true);
    const c = await api.cloneExercise(e!.id);
    navigate(`/exercises/${c.id}`, { replace: true });
  }
  async function publish() {
    setBusy(true);
    await api.publishExercise(e!.id);
    await reload();
    setBusy(false);
  }
  async function remove() {
    if (!confirm("Delete this exercise?")) return;
    setBusy(true);
    await api.deleteExercise(e!.id);
    navigate("/exercises", { replace: true });
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {e.video ? (
          <video src={e.video.startsWith("http") ? e.video : MEDIA_ORIGIN + e.video} controls poster={e.thumbnail || undefined} style={{ width: "100%", maxHeight: 360, background: "#000" }} />
        ) : e.thumbnail ? (
          <img src={e.thumbnail} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
        ) : (
          <div style={{ height: 180, background: meta.grad, display: "grid", placeItems: "center", fontSize: 56 }}>{meta.icon}</div>
        )}
        <div style={{ padding: 22 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <Badge text={meta.label} color="var(--primary)" />
            {diff && <Badge text={diff.label} color={diff.color} />}
            {e.is_template && <Badge text="LIBRARY" color="var(--accent)" />}
            {e.is_public && <Badge text="PUBLIC" color="var(--success)" />}
            {e.review_status && e.review_status !== "NONE" && <Badge text={e.review_status} color={REVIEW_COLOR[e.review_status]} />}
          </div>
          <h1 style={{ margin: "4px 0" }}>{e.title}</h1>
          {e.author && <div className="author">by {e.author}</div>}
          <p style={{ lineHeight: 1.6, marginTop: 14 }}>{e.description || "No instructions provided."}</p>

          <div className="btn-row" style={{ marginTop: 8 }}>
            {mine ? (
              <>
                <button className="btn" onClick={() => navigate(`/exercises/${e.id}/edit`)}>Edit</button>
                {(e.review_status === "NONE" || e.review_status === "REJECTED") && (
                  <button className="btn ghost" disabled={busy} onClick={publish}>Publish to library</button>
                )}
                <button className="btn danger" disabled={busy} onClick={remove}>Delete</button>
              </>
            ) : (
              <button className="btn" disabled={busy} onClick={clone}>Save a copy to my exercises</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
