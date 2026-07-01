import { TextStyle } from "react-native";

export const colors = {
  bg: "#0B1120",
  bgElevated: "#0F172A",
  surface: "#161E2E",
  surfaceAlt: "#1F2A3C",
  surfaceHi: "#26344A",
  primary: "#22D3EE",
  primaryDark: "#0E7490",
  accent: "#A78BFA",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  danger: "#FB7185",
  warning: "#FBBF24",
  success: "#34D399",
  border: "#243049",
  borderHi: "#33415C",
};

export const gradients = {
  header: ["#0E7490", "#1E293B"] as const,
  primary: ["#22D3EE", "#0891B2"] as const,
  violet: ["#8B5CF6", "#6D28D9"] as const,
  emerald: ["#34D399", "#059669"] as const,
  rose: ["#FB7185", "#E11D48"] as const,
  amber: ["#FBBF24", "#D97706"] as const,
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};

export const type: Record<string, TextStyle> = {
  display: { fontSize: 30, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 19, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, fontWeight: "500", color: colors.text },
  muted: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.4 },
};

/** Visuals per body part: gradient + icon (Ionicons name). */
export const BODY_PART_META: Record<string, { label: string; icon: string; grad: readonly [string, string] }> = {
  SHOULDER: { label: "Shoulder", icon: "body-outline", grad: gradients.violet },
  ELBOW: { label: "Elbow", icon: "fitness-outline", grad: gradients.amber },
  WRIST: { label: "Wrist", icon: "hand-left-outline", grad: gradients.emerald },
  HIP: { label: "Hip", icon: "walk-outline", grad: gradients.rose },
  KNEE: { label: "Knee", icon: "walk-outline", grad: gradients.primary },
  ANKLE: { label: "Ankle", icon: "footsteps-outline", grad: gradients.violet },
  BACK: { label: "Back", icon: "body-outline", grad: gradients.emerald },
  NECK: { label: "Neck", icon: "body-outline", grad: gradients.amber },
  OTHER: { label: "Other", icon: "ellipsis-horizontal", grad: gradients.primary },
};

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  EASY: { label: "Easy", color: colors.success },
  MEDIUM: { label: "Medium", color: colors.warning },
  HARD: { label: "Hard", color: colors.danger },
};
