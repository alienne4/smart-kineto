import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const configuredApi = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
const API_ROOT = (configuredApi || "http://10.0.2.2:8000/api").replace(/\/$/, "");

export const MEDIA_ROOT = API_ROOT.replace(/\/api$/, "");

export type Role = "TRAINER" | "PATIENT";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: Role;
  is_admin?: boolean;
  trainer?: Pick<User, "id" | "email" | "full_name"> | null;
}

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  body_part?: string;
  difficulty?: string;
  video?: string | null;
  thumbnail?: string | null;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  exercise_count?: number;
  program_exercises?: Array<{
    id: string;
    order: number;
    sets: number;
    reps: number;
    exercise: Exercise;
  }>;
}

export interface Assignment {
  id: string;
  status: string;
  program: TrainingProgram;
  patient?: User;
}

export interface Assessment {
  id: string;
  pain_level: number;
  mobility_score: number;
  notes?: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  kind: "NEWS" | "EVENT";
  title: string;
  body: string;
  image_url?: string;
  event_date?: string | null;
  location?: string;
}

export interface NotificationItem {
  id: string;
  title?: string;
  body?: string;
  read_at?: string | null;
}

export interface LiveSession {
  id: string;
  status?: string;
  started_at?: string;
}

export interface LiveFeedback {
  type: "feedback" | "final" | string;
  running_score?: number;
  match_pct?: number;
  cue?: string;
  score?: number;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

const ACCESS_KEY = "skf_access";
const REFRESH_KEY = "skf_refresh";

export const tokenStore = {
  access: () => SecureStore.getItemAsync(ACCESS_KEY),
  async set(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  multipart?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, multipart = false } = options;
  const headers: Record<string, string> = {};
  const access = await tokenStore.access();

  if (!multipart) headers["Content-Type"] = "application/json";
  if (auth && access) headers.Authorization = `Bearer ${access}`;

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: multipart ? (body as BodyInit) : body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new ApiError("Network error. Is the backend running?", 0, error);
  }

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.non_field_errors?.[0] ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  register: (payload: { email: string; password: string; full_name?: string; role: Role }) =>
    request<User>("/auth/register/", { method: "POST", body: payload, auth: false }),
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string; user: User }>("/auth/login/", {
      method: "POST",
      body: { email, password },
      auth: false
    }),
  me: () => request<User>("/auth/me/"),
  listTrainers: () => request<User[]>("/trainers/"),
  listPatients: () => request<User[]>("/patients/"),
  listExercises: () => request<Exercise[]>("/exercises/"),
  listAssignments: () => request<Assignment[]>("/assignments/"),
  startAssignment: (id: string) => request<Assignment>(`/assignments/${id}/start/`, { method: "POST" }),
  completeAssignment: (id: string) => request<Assignment>(`/assignments/${id}/complete/`, { method: "POST" }),
  listAssessments: (patientId?: string) => request<Assessment[]>(`/assessments/${patientId ? `?patient=${patientId}` : ""}`),
  createAssessment: (body: { pain_level: number; mobility_score: number; notes?: string }) =>
    request<Assessment>("/assessments/", { method: "POST", body }),
  listNotifications: () => request<NotificationItem[]>("/notifications/"),
  markNotificationRead: (id: string) => request<void>(`/notifications/${id}/read/`, { method: "POST" }),
  getFeed: () => request<Announcement[]>("/content/feed/"),
  getProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/`),
  listPrograms: () => request<TrainingProgram[]>("/programs/"),
  getExercise: (id: string) => request<Exercise>(`/exercises/${id}/`),
  createSession: (assignmentId?: string) => request<LiveSession>("/sessions/", { method: "POST", body: { assignment_id: assignmentId } }),
  finishSession: (sessionId: string) => request<LiveSession>(`/sessions/${sessionId}/finish/`, { method: "POST" }),
  socketUrl: async (sessionId: string) => {
    const access = await tokenStore.access();
    const wsRoot = API_ROOT.replace(/^http/, "ws").replace(/\/api$/, "");
    const token = access ? `?token=${encodeURIComponent(access)}` : "";
    return `${wsRoot}/ws/session/${sessionId}/${token}`;
  }
};
