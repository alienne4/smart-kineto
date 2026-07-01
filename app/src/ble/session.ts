import { LiveFeedback } from "../api/client";

export interface SensorFrame {
  t_ms: number;
  q: [number, number, number, number];
}

export interface LiveSessionController {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendFrames: (frames: SensorFrame[]) => void;
}

export function createLiveSessionSocket({
  url,
  onFeedback,
  onStatus
}: {
  url: string;
  onFeedback: (feedback: LiveFeedback) => void;
  onStatus: (status: "connecting" | "connected" | "disconnected" | "error") => void;
}): LiveSessionController {
  let socket: WebSocket | null = null;

  return {
    async connect() {
      onStatus("connecting");
      socket = new WebSocket(url);
      socket.onopen = () => onStatus("connected");
      socket.onclose = () => onStatus("disconnected");
      socket.onerror = () => onStatus("error");
      socket.onmessage = (event) => {
        try {
          onFeedback(JSON.parse(event.data));
        } catch {
          onStatus("error");
        }
      };
    },
    disconnect() {
      socket?.close();
      socket = null;
    },
    sendFrames(frames) {
      if (socket?.readyState !== WebSocket.OPEN || frames.length === 0) return;
      socket.send(
        JSON.stringify({
          type: "frames",
          t0_ms: frames[0].t_ms,
          rate_hz: 50,
          q: frames.map((frame) => frame.q)
        })
      );
    }
  };
}
