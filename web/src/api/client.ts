export type Role = "TRAINER" | "PATIENT";
export type ReviewStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api`;

export const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  date_joined?: string;
  is_admin?: boolean;
  trainer?: { id: string; full_name: string; email: string } | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface Exercise {
  id: string;
  created_by?: AuthUser | null;
  author?: string;
  is_template?: boolean;
  is_public?: boolean;
  review_status?: ReviewStatus;
  title: string;
  description: string;
  body_part: string;
  difficulty: string;
  video: string | null;
  thumbnail: string | null;
  created_at?: string;
}

export interface ProgramExercise {
  id: number;
  exercise: Exercise;
  order: number;
  sets: number;
  reps: number;
}

export interface TrainingProgram {
  id: string;
  created_by?: AuthUser | null;
  author?: string;
  is_template?: boolean;
  is_public?: boolean;
  review_status?: ReviewStatus;
  name: string;
  description: string;
  program_exercises: ProgramExercise[];
  exercise_count: number;
}

export interface Assignment {
  id: string;
  program: TrainingProgram;
  patient: AuthUser;
  status: string;
  created_at?: string;
}

export interface Assessment {
  id: string;
  patient?: AuthUser;
  pain_level: number;
  mobility_score: number;
  notes: string;
  created_at?: string;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface Announcement {
  id: number;
  kind: "NEWS" | "EVENT";
  audience: string;
  title: string;
  body: string;
  image: string | null;
  image_url?: string;
  event_date: string | null;
  location: string;
  pinned: boolean;
  published?: boolean;
  created_at: string;
}

export interface ChatThread {
  user_id: string;
  full_name: string;
  email: string;
  role: Role;
  last_message: string;
  last_at: string;
  unread: number;
}

export interface ChatMessage {
  id: number;
  sender: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface PlanExercise {
  id: string;
  title: string;
  body_part: string;
  difficulty: string;
  sets: number;
  reps: number;
  thumbnail: string | null;
}

export interface AssistantProposal {
  name: string;
  body_part: string;
  pain: number | null;
  goal: string | null;
  exercises: PlanExercise[];
}

export interface AssistantMessage {
  id: number;
  sender: "user" | "assistant";
  content: string;
  proposal: AssistantProposal | null;
  created_at: string;
}

export interface PoseJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  progress: number;
  detected_frames: number;
  total_frames: number;
  source_video: string | null;
  output_video: string | null;
  error: string;
  created_at: string;
}

export interface AdminStats {
  trainers: number;
  patients: number;
  exercises: number;
  programs: number;
  pending_exercises: number;
  pending_programs: number;
  announcements: number;
  public_exercises: number;
  public_programs: number;
}

export const BODY_PARTS = ["SHOULDER", "ELBOW", "WRIST", "HIP", "KNEE", "ANKLE", "BACK", "NECK", "OTHER"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export class ApiError extends Error {
  status: number;
  detail?: unknown;
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
  },
};

interface Opt {
  method?: string;
  body?: unknown;
  auth?: boolean;
  multipart?: boolean;
}

async function request<T>(path: string, opt: Opt = {}): Promise<T> {
  const { method = "GET", body, auth = true, multipart = false } = opt;
  const headers: Record<string, string> = {};
  if (!multipart) headers["Content-Type"] = "application/json";
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: multipart ? (body as any) : body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError("Network error. Is the backend running?", 0, e);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.email?.[0] || data.password?.[0] || data.non_field_errors?.[0])) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export const api = {
  register: (p: { email: string; full_name: string; role: Role; password: string }) =>
    request<AuthUser>("/auth/register/", { method: "POST", body: p, auth: false }),
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login/", { method: "POST", body: { email, password }, auth: false }),
  me: () => request<AuthUser>("/auth/me/"),

  listTrainers: () => request<AuthUser[]>("/trainers/"),
  listPatients: () => request<AuthUser[]>("/patients/"),
  searchPatients: (q: string) => request<AuthUser[]>(`/patients/search/?q=${encodeURIComponent(q)}`),
  addPatient: (patient_id: string) => request<AuthUser>("/me/patients/", { method: "POST", body: { patient_id } }),
  setTrainer: (trainer_id: string) => request<AuthUser>("/me/trainer/", { method: "POST", body: { trainer_id } }),

  listExercises: () => request<Exercise[]>("/exercises/"),
  getExercise: (id: string) => request<Exercise>(`/exercises/${id}/`),
  createExercise: (form: FormData) => request<Exercise>("/exercises/", { method: "POST", body: form, multipart: true }),
  updateExercise: (id: string, form: FormData) =>
    request<Exercise>(`/exercises/${id}/`, { method: "PATCH", body: form, multipart: true }),
  deleteExercise: (id: string) => request<null>(`/exercises/${id}/`, { method: "DELETE" }),
  cloneExercise: (id: string) => request<Exercise>(`/exercises/${id}/clone/`, { method: "POST" }),
  publishExercise: (id: string) => request<Exercise>(`/exercises/${id}/publish/`, { method: "POST" }),

  listPrograms: () => request<TrainingProgram[]>("/programs/"),
  listPublicPrograms: () => request<TrainingProgram[]>("/programs/public/"),
  selfAssignProgram: (id: string) => request<Assignment>(`/programs/${id}/self_assign/`, { method: "POST" }),
  getProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/`),
  createProgram: (p: { name: string; description: string; program_exercises: any[] }) =>
    request<TrainingProgram>("/programs/", { method: "POST", body: p }),
  updateProgram: (id: string, p: { name: string; description: string; program_exercises: any[] }) =>
    request<TrainingProgram>(`/programs/${id}/`, { method: "PATCH", body: p }),
  deleteProgram: (id: string) => request<null>(`/programs/${id}/`, { method: "DELETE" }),
  cloneProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/clone/`, { method: "POST" }),
  publishProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/publish/`, { method: "POST" }),

  listAssignments: () => request<Assignment[]>("/assignments/"),
  createAssignment: (program_id: string, patient_id: string) =>
    request<Assignment>("/assignments/", { method: "POST", body: { program_id, patient_id } }),
  startAssignment: (id: string) => request<Assignment>(`/assignments/${id}/start/`, { method: "POST" }),
  reopenAssignment: (id: string) => request<Assignment>(`/assignments/${id}/reopen/`, { method: "POST" }),
  completeAssignment: (id: string) => request<Assignment>(`/assignments/${id}/complete/`, { method: "POST" }),

  listAssessments: (patientId?: string) =>
    request<Assessment[]>(`/assessments/${patientId ? `?patient=${patientId}` : ""}`),
  createAssessment: (p: { pain_level: number; mobility_score: number; notes: string }) =>
    request<Assessment>("/assessments/", { method: "POST", body: p }),

  listNotifications: () => request<AppNotification[]>("/notifications/"),
  markNotificationRead: (id: number) => request(`/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all/", { method: "POST" }),

  listThreads: () => request<ChatThread[]>("/chat/threads/"),
  listMessages: (withId: string) => request<ChatMessage[]>(`/chat/messages/?with=${encodeURIComponent(withId)}`),
  sendMessage: (recipient_id: string, body: string) =>
    request<ChatMessage>("/chat/messages/", { method: "POST", body: { recipient_id, body } }),

  getFeed: () => request<Announcement[]>("/content/feed/"),

  // --- pose detection ---
  createPoseJob: (form: FormData) => request<PoseJob>("/pose/jobs/", { method: "POST", body: form, multipart: true }),
  getPoseJob: (id: string) => request<PoseJob>(`/pose/jobs/${id}/`),

  // --- AI assistant ---
  assistantMessages: () => request<AssistantMessage[]>("/assistant/messages/"),
  assistantChat: (content: string) =>
    request<AssistantMessage>("/assistant/chat/", { method: "POST", body: { content } }),
  assistantReset: () => request<null>("/assistant/messages/", { method: "DELETE" }),
  assistantAccept: (name: string, exercises: { id: string; sets: number; reps: number }[]) =>
    request<Assignment>("/assistant/accept/", { method: "POST", body: { name, exercises } }),

  // --- admin ---
  adminStats: () => request<AdminStats>("/admin/stats/"),
  adminReviewQueue: () => request<{ exercises: Exercise[]; programs: TrainingProgram[] }>("/admin/review/"),
  adminReviewExercise: (id: string, decision: "approve" | "reject") =>
    request<Exercise>(`/admin/exercises/${id}/${decision}/`, { method: "POST" }),
  adminReviewProgram: (id: string, decision: "approve" | "reject") =>
    request<TrainingProgram>(`/admin/programs/${id}/${decision}/`, { method: "POST" }),
  adminUsers: () => request<AuthUser[]>("/admin/users/"),
  adminListAnnouncements: () => request<Announcement[]>("/admin/announcements/"),
  adminCreateAnnouncement: (p: Partial<Announcement>) =>
    request<Announcement>("/admin/announcements/", { method: "POST", body: p }),
  adminUpdateAnnouncement: (id: number, p: Partial<Announcement>) =>
    request<Announcement>(`/admin/announcements/${id}/`, { method: "PATCH", body: p }),
  adminDeleteAnnouncement: (id: number) => request<null>(`/admin/announcements/${id}/`, { method: "DELETE" }),
};
