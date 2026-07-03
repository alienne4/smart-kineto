import { API_BASE_URL } from "../config";
import { getAccessToken } from "./token";

export type Role = "TRAINER" | "PATIENT";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  date_joined?: string;
  trainer?: { id: string; full_name: string; email: string } | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export type ReviewStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
export type ExerciseStage = "EARLY_STAGE" | "ADVANCED_STAGE";
export type TrackingMethod = "HARDWARE_WAND" | "CAMERA_POSE" | "MANUAL";

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
  stage: ExerciseStage;
  tracking_method: TrackingMethod;
  target_reps: number;
  requires_trainer_template?: boolean;
  has_trainer_template?: boolean;
  video: string | null;
  voiceover: string | null;
  thumbnail: string | null;
  created_at?: string;
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

export interface WandFrame {
  t_ms: number;
  roll: number;
  pitch: number;
  gx: number;
  gy: number;
  gz: number;
}

export interface WandTemplateInfo {
  id: string;
  exercise_id: string;
  sample_count: number;
  rep_count: number;
  duration_ms: number;
  created_at: string;
  updated_at: string;
}

export type RejectionReason =
  | "TOO_SHORT"
  | "TOO_FAST"
  | "TOO_SLOW"
  | "UNSTABLE"
  | "WRONG_DIRECTION"
  | "INCOMPLETE"
  | "LOW_SIMILARITY";

export interface WandRepetitionResult {
  id: string;
  index: number;
  duration_ms: number;
  movement_similarity: number;
  rom_similarity: number;
  tempo_similarity: number;
  smoothness_score: number;
  graph_score: number;
  duration_ratio: number;
  is_valid: boolean;
  rejection_reason: RejectionReason | "";
  preview_points: { t: number; candidate_roll: number; candidate_pitch: number; template_roll: number; template_pitch: number }[];
  created_at: string;
}

export interface WandSession {
  id: string;
  exercise: Exercise;
  assignment_id: string | null;
  target_reps: number;
  valid_reps: number;
  invalid_reps: number;
  status: "IN_PROGRESS" | "COMPLETED";
  started_at: string;
  completed_at: string | null;
  repetitions?: WandRepetitionResult[];
}

export interface ProgramExercise {
  id: number;
  exercise: Exercise;
  order: number;
  sets: number;
  reps: number;
  target_score: number | null;
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
  created_at?: string;
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
  event_date: string | null;
  location: string;
  pinned: boolean;
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

export const BODY_PARTS = [
  "SHOULDER", "ELBOW", "WRIST", "HIP", "KNEE", "ANKLE", "BACK", "NECK", "OTHER",
] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const EXERCISE_STAGES = ["EARLY_STAGE", "ADVANCED_STAGE"] as const;
export const TRACKING_METHODS = ["HARDWARE_WAND", "CAMERA_POSE", "MANUAL"] as const;

export class ApiError extends Error {
  constructor(message: string, public status: number, public detail?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** When true (default for most calls) attaches the stored JWT. */
  auth?: boolean;
  /** When true, body is a FormData and Content-Type is left to fetch. */
  multipart?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, multipart = false } = options;
  const headers: Record<string, string> = {};
  if (!multipart) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: multipart ? (body as any) : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new ApiError(
      aborted
        ? `Can't reach the backend at ${API_BASE_URL}. Check the IP / same Wi-Fi / firewall.`
        : "Network error. Is the backend running and reachable from this device?",
      0,
      e
    );
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      (data &&
        (data.detail ||
          data.email?.[0] ||
          data.password?.[0] ||
          data.non_field_errors?.[0])) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export const api = {
  // --- auth ---
  register: (payload: { email: string; full_name: string; role: Role; password: string }) =>
    request<AuthUser>("/auth/register/", { method: "POST", body: payload, auth: false }),

  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login/", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  me: () => request<AuthUser>("/auth/me/"),

  health: () => request<{ status: string }>("/health/", { auth: false }),

  // --- people / linking ---
  listTrainers: () => request<AuthUser[]>("/trainers/"),
  listPatients: () => request<AuthUser[]>("/patients/"),
  searchPatients: (q: string) =>
    request<AuthUser[]>(`/patients/search/?q=${encodeURIComponent(q)}`),
  addPatient: (patient_id: string) =>
    request<AuthUser>("/me/patients/", { method: "POST", body: { patient_id } }),
  setTrainer: (trainer_id: string) =>
    request<AuthUser>("/me/trainer/", { method: "POST", body: { trainer_id } }),

  // --- pose detection ---
  createPoseJob: (form: FormData) =>
    request<PoseJob>("/pose/jobs/", { method: "POST", body: form, multipart: true }),
  getPoseJob: (id: string) => request<PoseJob>(`/pose/jobs/${id}/`),

  // --- exercises ---
  listExercises: () => request<Exercise[]>("/exercises/"),
  getExercise: (id: string) => request<Exercise>(`/exercises/${id}/`),
  createExercise: (form: FormData) =>
    request<Exercise>("/exercises/", { method: "POST", body: form, multipart: true }),
  updateExercise: (id: string, form: FormData) =>
    request<Exercise>(`/exercises/${id}/`, { method: "PATCH", body: form, multipart: true }),
  deleteExercise: (id: string) =>
    request<null>(`/exercises/${id}/`, { method: "DELETE" }),
  cloneExercise: (id: string) =>
    request<Exercise>(`/exercises/${id}/clone/`, { method: "POST" }),
  publishExercise: (id: string) =>
    request<Exercise>(`/exercises/${id}/publish/`, { method: "POST" }),

  // --- hardware wand ---
  getWandTemplate: (exerciseId: string) =>
    request<WandTemplateInfo>(`/wand/templates/${exerciseId}/`),
  createWandTemplate: (payload: {
    exercise_id: string;
    repetitions: { frames: WandFrame[]; duration_ms: number }[];
  }) => request<WandTemplateInfo>("/wand/templates/", { method: "POST", body: payload }),
  startWandSession: (payload: { exercise_id: string; assignment_id?: string; target_reps?: number }) =>
    request<WandSession>("/wand/sessions/", { method: "POST", body: payload }),
  getWandSession: (id: string) => request<WandSession>(`/wand/sessions/${id}/`),
  submitWandRepetition: (sessionId: string, payload: { frames: WandFrame[]; duration_ms: number }) =>
    request<{ repetition: WandRepetitionResult; session: WandSession }>(
      `/wand/sessions/${sessionId}/repetitions/`,
      { method: "POST", body: payload }
    ),
  completeWandSession: (id: string) =>
    request<WandSession>(`/wand/sessions/${id}/complete/`, { method: "POST" }),

  // --- programs ---
  listPrograms: () => request<TrainingProgram[]>("/programs/"),
  listPublicPrograms: () => request<TrainingProgram[]>("/programs/public/"),
  selfAssignProgram: (id: string) =>
    request<Assignment>(`/programs/${id}/self_assign/`, { method: "POST" }),
  getProgram: (id: string) => request<TrainingProgram>(`/programs/${id}/`),
  createProgram: (payload: {
    name: string;
    description: string;
    program_exercises: { exercise_id: string; order: number; sets: number; reps: number }[];
  }) => request<TrainingProgram>("/programs/", { method: "POST", body: payload }),
  updateProgram: (
    id: string,
    payload: {
      name: string;
      description: string;
      program_exercises: { exercise_id: string; order: number; sets: number; reps: number }[];
    }
  ) => request<TrainingProgram>(`/programs/${id}/`, { method: "PATCH", body: payload }),
  deleteProgram: (id: string) =>
    request<null>(`/programs/${id}/`, { method: "DELETE" }),
  cloneProgram: (id: string) =>
    request<TrainingProgram>(`/programs/${id}/clone/`, { method: "POST" }),
  publishProgram: (id: string) =>
    request<TrainingProgram>(`/programs/${id}/publish/`, { method: "POST" }),

  // --- assignments ---
  listAssignments: () => request<Assignment[]>("/assignments/"),
  createAssignment: (program_id: string, patient_id: string) =>
    request<Assignment>("/assignments/", {
      method: "POST",
      body: { program_id, patient_id },
    }),
  startAssignment: (id: string) =>
    request<Assignment>(`/assignments/${id}/start/`, { method: "POST" }),
  reopenAssignment: (id: string) =>
    request<Assignment>(`/assignments/${id}/reopen/`, { method: "POST" }),
  completeAssignment: (id: string) =>
    request<Assignment>(`/assignments/${id}/complete/`, { method: "POST" }),

  // --- assessments ---
  listAssessments: (patientId?: string) =>
    request<Assessment[]>(`/assessments/${patientId ? `?patient=${patientId}` : ""}`),
  createAssessment: (payload: {
    pain_level: number;
    mobility_score: number;
    notes: string;
  }) => request<Assessment>("/assessments/", { method: "POST", body: payload }),

  // --- notifications / devices ---
  registerDevice: (expo_push_token: string, platform: string) =>
    request<{ id: number }>("/devices/", {
      method: "POST",
      body: { expo_push_token, platform },
    }),
  listNotifications: () => request<AppNotification[]>("/notifications/"),
  markNotificationRead: (id: number) =>
    request<{ updated: number }>(`/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () =>
    request<{ updated: number }>("/notifications/read-all/", { method: "POST" }),

  // --- chat ---
  listThreads: () => request<ChatThread[]>("/chat/threads/"),
  listMessages: (withId: string) =>
    request<ChatMessage[]>(`/chat/messages/?with=${encodeURIComponent(withId)}`),
  sendMessage: (recipient_id: string, body: string) =>
    request<ChatMessage>("/chat/messages/", {
      method: "POST",
      body: { recipient_id, body },
    }),

  // --- content (news & events) ---
  getFeed: () => request<Announcement[]>("/content/feed/"),

  // --- AI assistant ---
  assistantMessages: () => request<AssistantMessage[]>("/assistant/messages/"),
  assistantChat: (content: string) =>
    request<AssistantMessage>("/assistant/chat/", { method: "POST", body: { content } }),
  assistantReset: () => request<null>("/assistant/messages/", { method: "DELETE" }),
  assistantAccept: (name: string, exercises: { id: string; sets: number; reps: number }[]) =>
    request<Assignment>("/assistant/accept/", { method: "POST", body: { name, exercises } }),
};
