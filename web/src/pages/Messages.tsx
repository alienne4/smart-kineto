import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, ChatMessage, ChatThread } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar, Badge, Empty, IconMark, SLabel, Spinner } from "../components/ui";

export default function Messages() {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const loadThreads = () =>
    api.listThreads().then((t) => setThreads(t)).catch(() => {}).finally(() => setLoadingThreads(false));

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 10000);
    return () => clearInterval(id);
  }, []);

  const activeName =
    threads.find((t) => t.user_id === userId)?.full_name ||
    (user?.trainer && user.trainer.id === userId ? user.trainer.full_name : "");

  return (
    <div className="chat-wrap">
      <div className="thread-list">
        {user?.role === "PATIENT" && user.trainer && (
          <button className="btn sm" onClick={() => navigate(`/messages/${user.trainer!.id}`)}>
            <IconMark name="messages" size="sm" /> Message {user.trainer.full_name}
          </button>
        )}
        <SLabel n="01" label="Conversations" right={loadingThreads ? undefined : String(threads.length)} />
        {loadingThreads ? (
          <Spinner />
        ) : threads.length === 0 ? (
          <Empty icon="messages" title="No conversations" subtitle={user?.role === "TRAINER" ? "Open a patient to start a chat." : "Message your trainer."} />
        ) : (
          threads.map((t) => (
            <div
              key={t.user_id}
              className="card click row"
              style={t.user_id === userId ? { borderColor: "var(--primary)" } : undefined}
              onClick={() => navigate(`/messages/${t.user_id}`)}
            >
              <Avatar name={t.full_name} size={40} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }} className="truncate">{t.full_name}</div>
                <div className="muted truncate">{t.last_message}</div>
              </div>
              {t.unread > 0 && <Badge text={`${t.unread}`} />}
            </div>
          ))
        )}
      </div>

      {userId ? (
        <Conversation key={userId} userId={userId} name={activeName} onSent={loadThreads} meId={user!.id} />
      ) : (
        <div className="chat-panel"><Empty icon="messages" title="Select a conversation" /></div>
      )}
    </div>
  );
}

function Conversation({ userId, name, onSent, meId }: { userId: string; name: string; onSent: () => void; meId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const load = (initial = false) =>
    api.listMessages(userId).then((m) => {
      setMessages(m);
      if (initial) setLoading(false);
    }).catch(() => initial && setLoading(false));

  useEffect(() => {
    setLoading(true);
    load(true);
    const id = setInterval(() => load(), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      const msg = await api.sendMessage(userId, body);
      setMessages((cur) => [...cur, msg]);
      onSent();
    } catch {
      setText(body);
    }
  }

  return (
    <div className="chat-panel">
      <div className="row" style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
        <Avatar name={name} size={36} />
        <div style={{ fontWeight: 700 }}>{name || "Chat"}</div>
      </div>
      <div className="chat-msgs">
        {loading ? (
          <Spinner />
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`bubble ${m.sender === meId ? "mine" : "theirs"}`}>{m.body}</div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input className="input" placeholder="Message…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
