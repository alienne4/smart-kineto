import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { colors, radius, shadow, spacing, type as T } from "../theme";

type IconName = keyof typeof Ionicons.glyphMap;

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconName;
}) {
  const isDisabled = disabled || loading;
  const ghost = variant === "ghost";
  const danger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        ghost && styles.btnGhost,
        danger && styles.btnDanger,
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ghost ? colors.primary : colors.bg} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={ghost ? colors.primary : danger ? "#fff" : colors.bg}
            />
          ) : null}
          <Text style={[styles.btnText, ghost && { color: colors.primary }, danger && { color: "#fff" }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string; icon?: IconName }) {
  const { label, style, icon, ...rest } = props;
  return (
    <View style={{ marginBottom: spacing(2) }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} /> : null}
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconTile({
  icon,
  grad,
  size = 46,
}: {
  icon: IconName;
  grad: readonly [string, string];
  size?: number;
}) {
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name={icon} size={size * 0.5} color="#fff" />
    </LinearGradient>
  );
}

export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surfaceHi,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderHi,
      }}
    >
      <Text style={{ color: colors.primary, fontWeight: "800", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function Badge({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { borderColor: color + "66", backgroundColor: color + "1A" }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  grad,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  grad: readonly [string, string];
}) {
  return (
    <View style={styles.stat}>
      <IconTile icon={icon} grad={grad} size={38} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: spacing(4), alignItems: "center" }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function EmptyState({
  icon = "albums-outline",
  title,
  subtitle,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Notice({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <Text
      style={{
        color: tone === "error" ? colors.danger : colors.textMuted,
        textAlign: "center",
        paddingVertical: spacing(2),
      }}
    >
      {text}
    </Text>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? colors.primary : colors.textMuted} style={{ marginRight: 5 }} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Scale({
  value,
  onChange,
  max = 10,
  tint = colors.primary,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  tint?: string;
}) {
  return (
    <View style={styles.scaleRow}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => {
        const active = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.scaleCell,
              active && { borderColor: tint, backgroundColor: tint + "22" },
            ]}
          >
            <Text style={[styles.scaleText, active && { color: tint }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Simple dependency-free vertical bar chart. */
export function BarChart({
  data,
  color = colors.primary,
  max = 10,
  height = 90,
}: {
  data: { label: string; value: number }[];
  color?: string;
  max?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: height + 18, gap: 6 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" }}>
          <View style={{ height, justifyContent: "flex-end", width: "100%" }}>
            <View
              style={{
                height: Math.max(4, (d.value / max) * height),
                backgroundColor: color,
                borderRadius: 6,
                width: "100%",
                opacity: 0.85,
              }}
            />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export { Ionicons };

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing(1.85),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: colors.bg, fontWeight: "800", fontSize: 16 },
  fieldLabel: { ...T.label, marginBottom: spacing(0.75) },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
  },
  input: { flex: 1, paddingVertical: spacing(1.6), color: colors.text, fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  badge: {
    paddingHorizontal: spacing(1),
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.75),
    gap: 6,
    ...shadow.card,
  },
  statValue: { ...T.h1, marginTop: 2 },
  statLabel: { ...T.muted, fontSize: 12 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(1.5),
  },
  sectionTitle: { ...T.h2 },
  empty: { alignItems: "center", paddingVertical: spacing(5), gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { ...T.h2, fontSize: 16 },
  emptySub: { ...T.muted, textAlign: "center", paddingHorizontal: spacing(4) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.85),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: colors.primary },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceHi, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(0.75) },
  scaleCell: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleText: { color: colors.textMuted, fontWeight: "700" },
  barLabel: { color: colors.textFaint, fontSize: 10, marginTop: 4 },
});
