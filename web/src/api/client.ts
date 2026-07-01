const API_ROOT = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`).replace(/\/$/, "");
export const MEDIA_ROOT = API_ROOT.replace(/\/api$/, "");

export type Role = "TRAINER" | "PATIENT";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: Role;
  is_admin?: boolean;
  date_joined?: string;
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
  created_by?: User | null;
  is_template?: boolean;
  is_public?: boolean;
  author?: string;
}

export interface ProgramExercise {
  id: string;
  order: number;
  sets: number;
  reps: number;
  exercise: Exercise;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  exercise_count?: number;
  created_by?: User | null;
  is_template?: boolean;
  is_public?: boolean;
  program_exercises?: ProgramExercise[];
}

export interface Assignment {
  id: string;
  status: string;
  patient?: User;
  program: TrainingProgram;
}

export interface Assessment {
  id: string;
  patient?: User;
  pain_level: number;
  mobility_score: number;
  notes?: string;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  read_at?: string | null;
}

export interface Announcement {
  id: string;
  kind: "NEWS" | "EVENT";
  audience?: string;
  title: string;
  body: string;
  image_url?: string;
  event_date?: string | null;
  location?: string;
  pinned?: boolean;
  published?: boolean;
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

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
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

  if (!multipart) headers["Content-Type"] = "application/json";
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

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
  searchPatients: (q: string) => request<User[]>(`/patients/search/?q=${encodeURIComponent(q)}`),
  addPatient: (patientId: string) => request<User>("/me/patients/", { method: "POST", body: { patient_id: patientId } }),
  setTrainer: (trainerId: string) => request<User>("/me/trainer/", { method: "POST", body: { trainer_id: trainerId } }),
  listExercises: () => request<Exercise[]>("/exercises/"),
  getExercise: (id: string) => request<Exercise>(`/exercises/${id}/`),
  createExercise: (body: FormData) => request<Exercise>("/exercises/", { method: "POST", body, multipart: true }),
  updateExercise: (id: string, body: FormData) => request<Exercise>(`/exercises/${id}/`, { method: "PATCH", body, multipart: true }),
  deleteExercise: (id: string) => request<void>(`/exercises/${id}/`, { method: "DELETE" }),
  cloneExercise: (id: string) => request<Exercise>(`/exercises/${id}/clone/`, { method: "POST" }),
  publishExercise: (id: string) => request<Exercise>(`/exercises/${id}/publish/`, { method: "POST" }),
  listPrograms: () => request<TrainingProgram[]>("/programs/"),
  listPublicPrograms: () => request<TrainingProgram[]>("/programs/public/"),
  selfAssignProgram: (id: string) => request<Assignment>(`/programs/${id}/self_assign/`, { method: "POST" }),
  getProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/`),
  createProgram: (body: Partial<TrainingProgram>) => request<TrainingProgram>("/programs/", { method: "POST", body }),
  updateProgram: (id: string, body: Partial<TrainingProgram>) => request<TrainingProgram>(`/programs/${id}/`, { method: "PATCH", body }),
  deleteProgram: (id: string) => request<void>(`/programs/${id}/`, { method: "DELETE" }),
  cloneProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/clone/`, { method: "POST" }),
  publishProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/publish/`, { method: "POST" }),
  listAssignments: () => request<Assignment[]>("/assignments/"),
  createAssignment: (programId: string, patientId: string) =>
    request<Assignment>("/assignments/", { method: "POST", body: { program_id: programId, patient_id: patientId } }),
  startAssignment: (id: string) => request<Assignment>(`/assignments/${id}/start/`, { method: "POST" }),
  reopenAssignment: (id: string) => request<Assignment>(`/assignments/${id}/reopen/`, { method: "POST" }),
  completeAssignment: (id: string) => request<Assignment>(`/assignments/${id}/complete/`, { method: "POST" }),
  listAssessments: (patientId?: string) => request<Assessment[]>(`/assessments/${patientId ? `?patient=${patientId}` : ""}`),
  createAssessment: (body: { pain_level: number; mobility_score: number; notes?: string }) =>
    request<Assessment>("/assessments/", { method: "POST", body }),
  listNotifications: () => request<NotificationItem[]>("/notifications/"),
  markNotificationRead: (id: string) => request<void>(`/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () => request<void>("/notifications/read-all/", { method: "POST" }),
  listThreads: () => request<unknown[]>("/chat/threads/"),
  listMessages: (withUser: string) => request<unknown[]>(`/chat/messages/?with=${encodeURIComponent(withUser)}`),
  sendMessage: (recipientId: string, body: string) =>
    request<unknown>("/chat/messages/", { method: "POST", body: { recipient_id: recipientId, body } }),
  getFeed: () => request<Announcement[]>("/content/feed/"),
  createPoseJob: (body: FormData) => request<unknown>("/pose/jobs/", { method: "POST", body, multipart: true }),
  getPoseJob: (id: string) => request<unknown>(`/pose/jobs/${id}/`),
  assistantMessages: () => request<unknown[]>("/assistant/messages/"),
  assistantChat: (content: string) => request<unknown>("/assistant/chat/", { method: "POST", body: { content } }),
  assistantReset: () => request<void>("/assistant/messages/", { method: "DELETE" }),
  assistantAccept: (name: string, exercises: unknown[]) =>
    request<unknown>("/assistant/accept/", { method: "POST", body: { name, exercises } }),
  adminStats: () => request<Record<string, number>>("/admin/stats/"),
  adminReviewQueue: () => request<{ exercises: Exercise[]; programs: TrainingProgram[] }>("/admin/review/"),
  adminReviewExercise: (id: string, action: "approve" | "reject") => request<Exercise>(`/admin/exercises/${id}/${action}/`, { method: "POST" }),
  adminReviewProgram: (id: string, action: "approve" | "reject") => request<TrainingProgram>(`/admin/programs/${id}/${action}/`, { method: "POST" }),
  adminUsers: () => request<User[]>("/admin/users/"),
  adminListAnnouncements: () => request<Announcement[]>("/admin/announcements/"),
  adminCreateAnnouncement: (body: Partial<Announcement>) => request<Announcement>("/admin/announcements/", { method: "POST", body }),
  adminUpdateAnnouncement: (id: string, body: Partial<Announcement>) => request<Announcement>(`/admin/announcements/${id}/`, { method: "PATCH", body }),
  adminDeleteAnnouncement: (id: string) => request<void>(`/admin/announcements/${id}/`, { method: "DELETE" })
};
