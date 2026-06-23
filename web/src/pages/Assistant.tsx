import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, AssistantMessage, AssistantProposal } from "../api/client";
import { Badge, BODY_PART_META, DIFFICULTY_META, Spinner } from "../components/ui";

const STARTERS = [
  "My right knee hurts, about 6/10",
  "Lower back stiffness, want more mobility",
  "Shoulder pain after the gym",
];

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [accepting, setAccepting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.assistantMessages().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(body: string) {
    const content = body.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const optimistic: AssistantMessage = { id: Date.now(), sender: "user", content, proposal: null, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try {
      const reply = await api.assistantChat(content);
      setMessages((m) => [...m, reply]);
    } catch {
      setMessages((m) => [...m, { id: Date.now() + 1, sender: "assistant", content: "Sorry, I couldn't respond. Please try again.", proposal: null, created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  async function reset() {
    await api.assistantReset();
    setMessages([]);
  }

  async function accept(p: AssistantProposal) {
    setAccepting(true);
    try {
      const assignment = await api.assistantAccept(p.name, p.exercises.map((e) => ({ id: e.id, sets: e.sets, reps: e.reps })));
      navigate(`/programs/${assignment.program.id}`);
    } catch {
      setAccepting(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="spread">
        <h1 className="section-title" style={{ margin: 0 }}>AI assistant</h1>
        {messages.length > 0 && <button className="btn ghost sm" onClick={reset}>Clear chat</button>}
      </div>
      <p className="muted" style={{ marginTop: 4 }}>Describe your condition and I'll suggest a tailored program. Not a substitute for medical advice.</p>

      <div className="chat-panel" style={{ height: "calc(100vh - 64px - 200px)", marginTop: 12 }}>
        <div className="chat-msgs">
          {loading ? (
            <Spinner />
          ) : (
            <>
              {messages.length === 0 && (
                <div className="bubble theirs">
                  Hi! I'm your SmartKineto assistant. Tell me what's bothering you — e.g. “My right knee hurts, about 6/10, I want to improve mobility.”
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                  <div className={`bubble ${m.sender === "user" ? "mine" : "theirs"}`}>{m.content}</div>
                  {m.proposal && <ProposalCard p={m.proposal} accepting={accepting} onAccept={() => accept(m.proposal!)} />}
                </div>
              ))}
              {sending && <div className="bubble theirs">…</div>}
            </>
          )}
          <div ref={endRef} />
        </div>

        {messages.length === 0 && !loading && (
          <div className="chips" style={{ padding: "0 12px 8px" }}>
            {STARTERS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input className="input" placeholder="Describe your symptoms…" value={text} onChange={(e) => setText(e.target.value)} disabled={sending} />
          <button className="btn" disabled={!text.trim() || sending}>Send</button>
        </form>
      </div>
    </div>
  );
}

function ProposalCard({ p, accepting, onAccept }: { p: AssistantProposal; accepting: boolean; onAccept: () => void }) {
  return (
    <div className="card" style={{ width: "100%", maxWidth: 520, background: "var(--surface-alt)" }}>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <Badge text="SUGGESTED PLAN" color="var(--accent)" />
        {p.pain != null && <Badge text={`pain ${p.pain}/10`} color="var(--danger)" />}
      </div>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>{p.name}</div>
      <div className="grid" style={{ gap: 8 }}>
        {p.exercises.map((e) => {
          const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
          const diff = DIFFICULTY_META[e.difficulty];
          return (
            <div key={e.id} className="row">
              {e.thumbnail ? <img className="thumb" src={e.thumbnail} alt="" /> : <div className="thumb" style={{ background: meta.grad, display: "grid", placeItems: "center" }}>{meta.icon}</div>}
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div className="faint">{e.sets} sets · {e.reps} reps{diff ? ` · ${diff.label}` : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn success" style={{ width: "100%", marginTop: 14 }} disabled={accepting} onClick={onAccept}>
        {accepting ? "Adding…" : "✓ Save & start this plan"}
      </button>
    </div>
  );
}
