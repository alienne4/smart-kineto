import { TextStyle } from "react-native";

/**
 * SmartKinetoFit — dark editorial design system (Barlow Condensed / Inter / JetBrains Mono,
 * lime accent, sharp corners, hairline borders). Mirrors `Figma UI/src/app/App.tsx`.
 *
 * Most screens use the dark palette. A handful (Login, Register, Assigned Programs, Assessment/
 * Check-in, Profile, Notifications) use `light` — the design intentionally mixes both. Screens
 * needing the light palette import `light`/`Palette` directly; everything else keeps using the
 * flat `colors` export below (kept dark, with its original key names, so existing screens don't
 * need to change their imports).
 */

export type Palette = {
  bg: string;
  card: string;
  lift: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  /** Raw brand lime — used as a fill (button/avatar backgrounds), never as text on light. */
  accent: string;
  /** Color to use for lime-ish text/icons — raw lime on dark, olive-shifted on light for legibility. */
  accentText: string;
  /** Text/icon color to place on top of an `accent`-filled surface. */
  accentOn: string;
  ok: string;
  warn: string;
  danger: string;
};

export const dark: Palette = {
  bg: "#0C0C18",
  card: "#111120",
  lift: "#18182A",
  border: "rgba(200,200,255,0.14)",
  text: "#E0E0EE",
  muted: "#6C6C88",
  faint: "#3A3A52",
  accent: "#D4FF00",
  accentText: "#D4FF00",
  accentOn: "#0C0C18",
  ok: "#00E87A",
  warn: "#FF9000",
  danger: "#FF3535",
};

export const light: Palette = {
  bg: "#EDE8DF",
  card: "#E4DFDA",
  lift: "#D9D3C9",
  border: "rgba(0,0,0,0.12)",
  text: "#0A0A0A",
  muted: "#5C5C5C",
  faint: "#AAAAAA",
  accent: "#D4FF00",
  accentText: "#5A8A00",
  accentOn: "#0A0A0A",
  ok: "#1A7A30",
  warn: "#8A6000",
  danger: "#CC1A1A",
};

/**
 * Legacy flat palette — same key names as the old cyan/violet theme, repointed to the new dark
 * design tokens above, so the majority of screens (which stay dark) don't need import changes.
 */
export const colors = {
  bg: dark.bg,
  bgElevated: dark.card,
  surface: dark.card,
  surfaceAlt: dark.lift,
  surfaceHi: "#22223A",
  primary: dark.accent,
  primaryDark: "#A8CC00",
  accent: dark.ok,
  text: dark.text,
  textMuted: dark.muted,
  textFaint: dark.faint,
  danger: dark.danger,
  warning: dark.warn,
  success: dark.ok,
  border: dark.border,
  borderHi: "rgba(200,200,255,0.24)",
};

/** Legacy gradient pairs, repointed to subdued dark-palette tuples (no more per-category rainbow). */
export const gradients = {
  header: [dark.card, dark.bg] as const,
  primary: [dark.accent, dark.accent] as const,
  violet: [dark.lift, dark.card] as const,
  emerald: [dark.ok, dark.ok] as const,
  rose: [dark.danger, dark.danger] as const,
  amber: [dark.warn, dark.warn] as const,
};

export const fonts = {
  display: "BarlowCondensed_900Black",
  monoRegular: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
  monoSemiBold: "JetBrainsMono_600SemiBold",
  monoBold: "JetBrainsMono_700Bold",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

/** Map passed straight into `useFonts()` in App.tsx. */
export const fontMap = {
  BarlowCondensed_900Black: require("@expo-google-fonts/barlow-condensed/900Black/BarlowCondensed_900Black.ttf"),
  JetBrainsMono_400Regular: require("@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf"),
  JetBrainsMono_500Medium: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
  JetBrainsMono_600SemiBold: require("@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf"),
  JetBrainsMono_700Bold: require("@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf"),
  Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
  Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
  Inter_700Bold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
};

/** Display headline style — Barlow Condensed 900, uppercase, tight leading, 2nd line usually lime. */
export function disp(size: number, color: string = dark.text, extra?: TextStyle): TextStyle {
  return {
    fontFamily: fonts.display,
    fontSize: size,
    lineHeight: size * 0.9,
    color,
    textTransform: "uppercase",
    letterSpacing: -0.3,
    ...extra,
  };
}

/** Mono label/data style — JetBrains Mono, wide tracking. */
export function mono(
  size: number,
  color: string = dark.muted,
  weight: "regular" | "medium" | "semibold" | "bold" = "medium",
  extra?: TextStyle
): TextStyle {
  const family =
    weight === "bold" ? fonts.monoBold : weight === "semibold" ? fonts.monoSemiBold : weight === "regular" ? fonts.monoRegular : fonts.monoMedium;
  return { fontFamily: family, fontSize: size, color, letterSpacing: Math.max(0.4, size * 0.07), ...extra };
}

/** Body copy style — Inter. */
export function body(
  size: number,
  color: string = dark.text,
  weight: "regular" | "medium" | "semibold" | "bold" = "regular",
  extra?: TextStyle
): TextStyle {
  const family =
    weight === "bold" ? fonts.bodyBold : weight === "semibold" ? fonts.bodySemiBold : weight === "medium" ? fonts.bodyMedium : fonts.bodyRegular;
  return { fontFamily: family, fontSize: size, color, ...extra };
}

export const spacing = (n: number) => n * 8;

/** The design system uses sharp corners everywhere. */
export const radius = { sm: 0, md: 0, lg: 0, xl: 0, pill: 0 };

export const shadow = { card: {} as TextStyle };

/** Legacy text-style bundle kept for existing screens (`type as T`), backed by the new type scale. */
export const type: Record<string, TextStyle> = {
  display: disp(30),
  h1: disp(24),
  h2: body(19, dark.text, "bold"),
  body: body(15, dark.text, "medium"),
  muted: body(13, dark.muted, "medium"),
  label: mono(11, dark.muted, "semibold", { letterSpacing: 0.8 }),
};

/** ≥80 → ok, ≥70 → warn, else danger — the mockup's quality/ROM threshold convention. */
export function quality(value: number, p: Palette = dark): string {
  if (value >= 80) return p.ok;
  if (value >= 70) return p.warn;
  return p.danger;
}

/** Visuals per body part: label + lucide icon name (no per-part color-coding in this design). */
export const BODY_PART_META: Record<string, { label: string; icon: string }> = {
  SHOULDER: { label: "Shoulder", icon: "activity" },
  ELBOW: { label: "Elbow", icon: "dumbbell" },
  WRIST: { label: "Wrist", icon: "hand" },
  HIP: { label: "Hip", icon: "footprints" },
  KNEE: { label: "Knee", icon: "footprints" },
  ANKLE: { label: "Ankle", icon: "footprints" },
  BACK: { label: "Back", icon: "activity" },
  NECK: { label: "Neck", icon: "activity" },
  OTHER: { label: "Other", icon: "more-horizontal" },
};

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  EASY: { label: "Easy", color: dark.ok },
  MEDIUM: { label: "Medium", color: dark.warn },
  HARD: { label: "Hard", color: dark.danger },
};
