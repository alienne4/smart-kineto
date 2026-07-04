import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, MEDIA_ORIGIN, PoseJob } from "../api/client";

type Mode = "choose" | "record";

export function PoseRecorder({ onUseVideo }: { onUseVideo: (jobId: string, outputUrl: string) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "choose") {
    return (
      <div className="grid cols-2">
        <button type="button" className="card click" style={{ textAlign: "left", border: "none" }} onClick={() => setMode("record")}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#22d3ee,#0891b2)" }}>🧍</div>
          <div style={{ fontWeight: 800, marginTop: 10 }}>Pose detection</div>
          <div className="muted">Record yourself; we detect your skeleton from the video.</div>
        </button>
        <button type="button" className="card click" style={{ textAlign: "left", border: "none" }} onClick={() => navigate("/exercises/new-wand")}>
          <div className="tile" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>📡</div>
          <div style={{ fontWeight: 800, marginTop: 10 }}>Use the SmartKineto wand instead</div>
          <div className="muted">Hardware-wand exercises are a separate flow — no video needed.</div>
        </button>
      </div>
    );
  }

  return <Recorder onUseVideo={onUseVideo} onBack={() => setMode("choose")} />;
}

function Recorder({ onUseVideo, onBack }: { onUseVideo: (jobId: string, outputUrl: string) => void; onBack: () => void }) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<number | null>(null);

  const [camError, setCamError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const [job, setJob] = useState<PoseJob | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (liveRef.current) liveRef.current.srcObject = stream;
      } catch {
        setCamError("Couldn't access the camera. Allow camera permission, and use http://localhost (camera is blocked on plain-http LAN addresses).");
      }
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedUrl(null);
    recordedBlobRef.current = null;
    const mr = new MediaRecorder(streamRef.current, { mimeType: pickMime() });
    mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "video/webm" });
      recordedBlobRef.current = blob;
      setRecordedUrl(URL.createObjectURL(blob));
    };
    recorderRef.current = mr;
    mr.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function runDetection() {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    setUploading(true);
    const form = new FormData();
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    form.append("video", blob, `recording.${ext}`);
    try {
      const created = await api.createPoseJob(form);
      setJob(created);
      pollRef.current = window.setInterval(async () => {
        try {
          const j = await api.getPoseJob(created.id);
          setJob(j);
          if (j.status === "DONE" || j.status === "FAILED") {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          /* keep polling */
        }
      }, 1500);
    } catch (e: any) {
      setCamError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function retake() {
    if (pollRef.current) clearInterval(pollRef.current);
    setJob(null);
    setRecordedUrl(null);
    recordedBlobRef.current = null;
  }

  // Processing / result view
  if (job) {
    const out = job.output_video && (job.output_video.startsWith("http") ? job.output_video : MEDIA_ORIGIN + job.output_video);
    return (
      <div className="card">
        {job.status === "DONE" && out ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Detected pose playback</div>
            <video src={out} controls autoPlay loop style={{ width: "100%", borderRadius: 12, background: "#000" }} />
            <div className="muted" style={{ marginTop: 8 }}>Skeleton detected in {job.detected_frames} frame(s).</div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => onUseVideo(job.id, out)}>✓ Use this video</button>
              <button type="button" className="btn ghost" onClick={retake}>Record again</button>
            </div>
          </>
        ) : job.status === "FAILED" ? (
          <>
            <div className="error-text">Pose detection failed. Try a shorter, well-lit clip.</div>
            <button type="button" className="btn ghost" onClick={retake}>Try again</button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Analyzing movement…</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(5, job.progress)}%`, background: "var(--primary)" }} /></div>
            <div className="muted" style={{ marginTop: 8 }}>{job.progress}% · running pose detection on the server</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      {camError && <div className="error-text">{camError}</div>}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
        {recordedUrl ? (
          <video src={recordedUrl} controls style={{ width: "100%", display: "block" }} />
        ) : (
          <video ref={liveRef} autoPlay muted playsInline style={{ width: "100%", display: "block" }} />
        )}
        {recording && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.55)", padding: "4px 10px", borderRadius: 999 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--danger)" }} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>REC</span>
          </div>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 12 }}>
        {!recordedUrl ? (
          recording ? (
            <button type="button" className="btn danger" onClick={stopRecording}>■ Stop recording</button>
          ) : (
            <button type="button" className="btn" disabled={!!camError} onClick={startRecording}>● Start recording</button>
          )
        ) : (
          <>
            <button type="button" className="btn" disabled={uploading} onClick={runDetection}>{uploading ? "Uploading…" : "🧍 Run pose detection"}</button>
            <button type="button" className="btn ghost" onClick={retake}>Record again</button>
          </>
        )}
        <button type="button" className="btn ghost" onClick={onBack}>← Options</button>
      </div>
    </div>
  );
}

function pickMime() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}
