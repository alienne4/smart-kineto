import { useState } from "react";

import { Announcement, api } from "../../api/client";
import { Badge, Empty, IconTile, Modal, Spinner, useApi } from "../../components/ui";

type Draft = Partial<Announcement>;

const BLANK: Draft = { kind: "NEWS", audience: "ALL", title: "", body: "", image_url: "", location: "", pinned: false, published: true };

export default function AdminAnnouncements() {
  const { data, loading, reload } = useApi(() => api.adminListAnnouncements());
  const [editing, setEditing] = useState<Draft | null>(null);

  async function remove(id: number) {
    if (!confirm("Delete this item?")) return;
    await api.adminDeleteAnnouncement(id);
    reload();
  }

  return (
    <>
      <div className="spread">
        <h1 className="section-title" style={{ margin: 0 }}>News & events</h1>
        <button className="btn" onClick={() => setEditing({ ...BLANK })}>New post</button>
      </div>

      {loading ? (
        <Spinner />
      ) : (data || []).length === 0 ? (
        <Empty icon="news" title="No posts yet" subtitle="Create news or an event to show in the apps." />
      ) : (
        <div className="grid" style={{ marginTop: 16 }}>
          {data!.map((a) => (
            <div key={a.id} className="card row">
              <IconTile icon="news" />
              <div className="col" style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{a.title}</span>
                  {a.pinned && <Badge text="PINNED" color="var(--warning)" />}
                  {a.published === false && <Badge text="DRAFT" color="var(--faint)" />}
                </div>
                <div className="muted truncate">{a.body}</div>
                <div className="faint">{a.audience} · {a.kind}</div>
              </div>
              <div className="btn-row">
                <button className="btn ghost sm" onClick={() => setEditing(a)}>Edit</button>
                <button className="btn danger sm" onClick={() => remove(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <Editor draft={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function Editor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Draft) => setD((cur) => ({ ...cur, ...patch }));

  function toLocalInput(iso?: string | null) {
    if (!iso) return "";
    const dt = new Date(iso);
    const off = dt.getTimezoneOffset();
    return new Date(dt.getTime() - off * 60000).toISOString().slice(0, 16);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload: Draft = {
      kind: d.kind,
      audience: d.audience,
      title: d.title,
      body: d.body,
      image_url: d.image_url || "",
      location: d.location || "",
      pinned: !!d.pinned,
      published: d.published !== false,
      event_date: d.kind === "EVENT" && d.event_date ? d.event_date : null,
    };
    try {
      if (d.id) await api.adminUpdateAnnouncement(d.id, payload);
      else await api.adminCreateAnnouncement(payload);
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Could not save");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>{d.id ? "Edit post" : "New post"}</h2>
      <div className="field">
        <label>TYPE</label>
        <div className="chips">
          <button className={`chip ${d.kind === "NEWS" ? "active" : ""}`} onClick={() => set({ kind: "NEWS" })}>News</button>
          <button className={`chip ${d.kind === "EVENT" ? "active" : ""}`} onClick={() => set({ kind: "EVENT" })}>Event</button>
        </div>
      </div>
      <div className="field">
        <label>AUDIENCE</label>
        <select className="input" value={d.audience} onChange={(e) => set({ audience: e.target.value })}>
          <option value="ALL">Everyone</option>
          <option value="TRAINERS">Trainers</option>
          <option value="PATIENTS">Patients</option>
        </select>
      </div>
      <div className="field">
        <label>TITLE</label>
        <input className="input" value={d.title || ""} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="field">
        <label>BODY</label>
        <textarea className="textarea" value={d.body || ""} onChange={(e) => set({ body: e.target.value })} />
      </div>
      <div className="field">
        <label>IMAGE URL (OPTIONAL)</label>
        <input className="input" value={d.image_url || ""} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" />
      </div>
      {d.kind === "EVENT" && (
        <>
          <div className="field">
            <label>EVENT DATE</label>
            <input className="input" type="datetime-local" value={toLocalInput(d.event_date)} onChange={(e) => set({ event_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </div>
          <div className="field">
            <label>LOCATION</label>
            <input className="input" value={d.location || ""} onChange={(e) => set({ location: e.target.value })} />
          </div>
        </>
      )}
      <div className="row" style={{ gap: 20, marginBottom: 14 }}>
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={!!d.pinned} onChange={(e) => set({ pinned: e.target.checked })} /> Pinned</label>
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={d.published !== false} onChange={(e) => set({ published: e.target.checked })} /> Published</label>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="btn-row">
        <button className="btn" disabled={saving || !d.title} onClick={save}>{saving ? "Saving…" : "Save"}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
