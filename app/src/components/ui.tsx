import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightCircle,
  Battery,
  Bell,
  BellOff,
  Bluetooth,
  Brain,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Dumbbell,
  FileText,
  Footprints,
  Globe,
  Hand,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layers,
  List,
  Lock,
  LogIn,
  LogOut,
  LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  PlusCircle,
  Radio,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UploadCloud,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
  XCircle,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { body, colors, dark, disp, mono, Palette, spacing } from "../theme";

/**
 * Icon system — every icon in the app renders through this lookup, so the whole app can be
 * swapped from Ionicons name strings to lucide icons without touching call sites. `Ionicons` is
 * kept as an alias export because ~24 screens still import it directly from this module.
 */
const ICONS: Record<string, LucideIcon> = {
  // navigation / chrome
  home: Home,
  person: User,
  "person-outline": User,
  "person-add-outline": UserPlus,
  people: Users,
  "people-outline": Users,
  barbell: Dumbbell,
  "barbell-outline": Dumbbell,
  fitness: Dumbbell,
  "fitness-outline": Dumbbell,
  list: List,
  "list-outline": List,
  chatbubbles: MessageCircle,
  "chatbubbles-outline": MessageCircle,
  "chatbubble-ellipses": MessageCircle,
  "chatbubble-ellipses-outline": MessageCircle,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  "trending-up-outline": TrendingUp,
  "log-out-outline": LogOut,
  "log-in-outline": LogIn,
  "arrow-back-outline": ArrowLeft,
  "arrow-forward-outline": ArrowRight,
  "arrow-forward-circle": ArrowRightCircle,
  "chevron-forward": ChevronRight,
  "chevron-down": ChevronDown,
  // actions
  add: Plus,
  "add-outline": Plus,
  "add-circle": PlusCircle,
  "add-circle-outline": PlusCircle,
  "checkmark-outline": Check,
  "checkmark-circle": CheckCircle,
  "checkmark-done-outline": CheckCheck,
  "close-circle-outline": XCircle,
  "create-outline": Pencil,
  "copy-outline": Copy,
  "duplicate-outline": Copy,
  "trash-outline": Trash2,
  "refresh-outline": RefreshCw,
  "save-outline": Save,
  "search-outline": Search,
  send: Send,
  "cloud-upload-outline": UploadCloud,
  // domain / content
  "body-outline": Activity,
  activity: Activity,
  dumbbell: Dumbbell,
  hand: Hand,
  footprints: Footprints,
  "walk-outline": Footprints,
  "more-horizontal": MoreHorizontal,
  "clipboard-outline": FileText,
  "newspaper-outline": Newspaper,
  "image-outline": ImageIcon,
  "globe-outline": Globe,
  "location-outline": MapPin,
  "calendar-outline": Calendar,
  "time-outline": Clock,
  "mail-outline": Mail,
  "lock-closed-outline": Lock,
  "shield-checkmark-outline": ShieldCheck,
  "bluetooth-outline": Bluetooth,
  "radio-outline": Radio,
  "videocam-outline": Video,
  "videocam-off-outline": VideoOff,
  "notifications-off-outline": BellOff,
  notifications: Bell,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  pulse: Activity,
  "pulse-outline": Activity,
  play: Play,
  "play-outline": Play,
  "play-circle": PlayCircle,
  brain: Brain,
  mic: Mic,
  cpu: Cpu,
  battery: Battery,
  layers: Layers,
  close: X,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
};

export type IconName = keyof typeof ICONS | (string & {});

export function Icon({
  name,
  size = 18,
  color = colors.text,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const Cmp = ICONS[name as string] || HelpCircle;
  return <Cmp size={size} color={color} strokeWidth={1.8} style={style as any} />;
}

/** Backwards-compatible alias — most screens still `import { Ionicons } from "./ui"`. */
export const Ionicons = Icon;

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon,
  palette = dark,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconName;
  palette?: Palette;
}) {
  const isDisabled = disabled || loading;
  const ghost = variant === "ghost";
  const danger = variant === "danger";
  const bg = danger || ghost ? "transparent" : palette.accent;
  const borderColor = danger ? palette.danger : ghost ? palette.border : palette.accent;
  const textColor = danger ? palette.danger : ghost ? palette.text : palette.accentOn;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor },
        isDisabled && { opacity: 0.4 },
        pressed && !isDisabled && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Icon name={icon} size={16} color={textColor} /> : null}
          <Text style={mono(12, textColor, "bold", { letterSpacing: 1.2 })}>{`[ ${title.toUpperCase()} ]`}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string; icon?: IconName; palette?: Palette }) {
  const { label, style, icon, palette = dark, ...rest } = props;
  return (
    <View style={{ marginBottom: spacing(2) }}>
      {label ? <Text style={mono(9, palette.muted, "semibold", { letterSpacing: 0.9, marginBottom: 6 })}>{label.toUpperCase()}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: palette.lift, borderColor: palette.border }]}>
        {icon ? <Icon name={icon} size={17} color={palette.muted} style={{ marginRight: 8 }} /> : null}
        <TextInput placeholderTextColor={palette.muted} style={[styles.input, { color: palette.text }, style]} {...rest} />
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  palette = dark,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  palette?: Palette;
}) {
  const base = [styles.card, { backgroundColor: palette.card, borderColor: palette.border }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

export function IconTile({
  icon,
  size = 44,
  palette = dark,
}: {
  icon: IconName;
  /** Kept for call-site compatibility; the design no longer uses per-tile gradients. */
  grad?: unknown;
  size?: number;
  palette?: Palette;
}) {
  return (
    <View style={{ width: size, height: size, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={size * 0.45} color={palette.accentText} />
    </View>
  );
}

export function Avatar({ name, size = 44, palette = dark }: { name?: string; size?: number; palette?: Palette }) {
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
        backgroundColor: `${palette.accent}22`,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: palette.accent,
      }}
    >
      <Text style={mono(size * 0.34, palette.accentText, "bold")}>{initials}</Text>
    </View>
  );
}

export function Badge({ text, color, palette = dark }: { text: string; color?: string; palette?: Palette }) {
  const c = color || palette.accentText;
  return (
    <View style={{ borderWidth: 1, borderColor: c, backgroundColor: `${c}18`, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={mono(9, c, "bold", { letterSpacing: 0.8 })}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  palette = dark,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  /** Kept for call-site compatibility; unused in the flat design. */
  grad?: unknown;
  palette?: Palette;
}) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, padding: spacing(1.75), gap: 6 }}>
      <Icon name={icon} size={16} color={palette.accentText} />
      <Text style={disp(24, palette.text)}>{value}</Text>
      <Text style={mono(9, palette.muted)}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function SectionTitle({ title, action, palette = dark }: { title: string; action?: React.ReactNode; palette?: Palette }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={mono(10, palette.muted, "semibold", { letterSpacing: 1 })}>{title.toUpperCase()}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: palette.border, marginHorizontal: 10 }} />
      {action}
    </View>
  );
}

/** Numbered section header — the mockup's `SLabel` atom. */
export function SLabel({ n, label, right, palette = dark }: { n: string; label: string; right?: string; palette?: Palette }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={mono(9, palette.accentText, "bold")}>{n}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
      <Text style={mono(9, palette.muted)}>{label.toUpperCase()}</Text>
      {right ? (
        <>
          <View style={{ width: 1, height: 10, backgroundColor: palette.border }} />
          <Text style={mono(9, palette.muted)}>{right}</Text>
        </>
      ) : null}
    </View>
  );
}

/** Small crosshair corner mark used to punctuate hero panels. */
export function Cross({ size = 10, color = dark.muted }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, opacity: 0.7 }}>
      <View style={{ position: "absolute", left: size / 2 - 0.5, top: 0, width: 1, height: size, backgroundColor: color }} />
      <View style={{ position: "absolute", top: size / 2 - 0.5, left: 0, height: 1, width: size, backgroundColor: color }} />
    </View>
  );
}

/** Four crosshair marks pinned to the corners of a `position:"relative"` parent. */
export function Corners({ color, sz = 9 }: { color?: string; sz?: number }) {
  const h = sz / 2;
  const c = color || dark.accent;
  return (
    <>
      <View style={{ position: "absolute", top: -h, left: -h }}>
        <Cross size={sz} color={c} />
      </View>
      <View style={{ position: "absolute", top: -h, right: -h }}>
        <Cross size={sz} color={c} />
      </View>
      <View style={{ position: "absolute", bottom: -h, left: -h }}>
        <Cross size={sz} color={c} />
      </View>
      <View style={{ position: "absolute", bottom: -h, right: -h }}>
        <Cross size={sz} color={c} />
      </View>
    </>
  );
}

/** Scrolling marquee strip (status/context ticker). */
export function Ticker({ items, palette = dark }: { items: string[]; palette?: Palette }) {
  const [blockWidth, setBlockWidth] = useState(0);
  const translate = useRef(new Animated.Value(0)).current;
  const text = items.join("   ◆   ");

  useEffect(() => {
    if (!blockWidth) return;
    translate.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translate, { toValue: -blockWidth, duration: blockWidth * 22, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [blockWidth, text, translate]);

  return (
    <View style={{ height: 24, backgroundColor: palette.accent, overflow: "hidden", justifyContent: "center" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: translate }] }}>
        <Text
          onLayout={(e) => setBlockWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
          style={mono(9, palette.accentOn, "bold", { paddingRight: 48 })}
        >
          {text}
        </Text>
        <Text numberOfLines={1} style={mono(9, palette.accentOn, "bold", { paddingRight: 48 })}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Rep validation indicator — a square ok/✗ mark. */
export function RepDot({ ok, palette = dark }: { ok: boolean; palette?: Palette }) {
  const c = ok ? palette.ok : palette.danger;
  return (
    <View style={{ width: 26, height: 26, borderWidth: 1, borderColor: c, backgroundColor: `${c}18`, alignItems: "center", justifyContent: "center" }}>
      <Icon name={ok ? "check-circle" : "x-circle"} size={12} color={c} />
    </View>
  );
}

/** Back-row header used in place of the native stack header on most screens. */
export function BackHeader({
  title,
  onBack,
  right,
  palette = dark,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
  palette?: Palette;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: spacing(2.25),
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: palette.bg,
      }}
    >
      <Pressable onPress={onBack} hitSlop={10}>
        <Icon name="arrow-back-outline" size={18} color={palette.muted} />
      </Pressable>
      <Text style={mono(10, palette.muted, "semibold", { letterSpacing: 1 })}>{title.toUpperCase()}</Text>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

export function Loading({ palette = dark }: { palette?: Palette } = {}) {
  return (
    <View style={{ paddingVertical: spacing(4), alignItems: "center" }}>
      <ActivityIndicator color={palette.accentText} />
    </View>
  );
}

export function EmptyState({
  icon = "list-outline",
  title,
  subtitle,
  palette = dark,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  palette?: Palette;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing(5), gap: 8 }}>
      <View style={{ width: 60, height: 60, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={26} color={palette.muted} />
      </View>
      <Text style={body(16, palette.text, "bold")}>{title}</Text>
      {subtitle ? <Text style={[body(13, palette.muted), { textAlign: "center", paddingHorizontal: spacing(4) }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Notice({ text, tone = "muted", palette = dark }: { text: string; tone?: "muted" | "error"; palette?: Palette }) {
  return (
    <Text style={[body(14, tone === "error" ? palette.danger : palette.muted, "medium"), { textAlign: "center", paddingVertical: spacing(2) }]}>
      {text}
    </Text>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  palette = dark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
  palette?: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing(1.5),
        paddingVertical: spacing(0.85),
        borderWidth: 1,
        borderColor: active ? palette.accent : palette.border,
        backgroundColor: active ? `${palette.accent}15` : palette.lift,
      }}
    >
      {icon ? <Icon name={icon} size={13} color={active ? palette.accentText : palette.muted} style={{ marginRight: 5 }} /> : null}
      <Text style={mono(9, active ? palette.accentText : palette.muted, "bold")}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color, palette = dark }: { value: number; color?: string; palette?: Palette }) {
  return (
    <View style={{ height: 3, backgroundColor: palette.faint, width: "100%" }}>
      <View style={{ height: 3, width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color || palette.accent }} />
    </View>
  );
}

export function Scale({
  value,
  onChange,
  max = 10,
  tint,
  palette = dark,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  tint?: string;
  palette?: Palette;
}) {
  const c = tint || palette.accentText;
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => {
        const active = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{ flex: 1, height: 32, borderWidth: 1, borderColor: active ? c : palette.border, backgroundColor: active ? `${c}22` : palette.lift, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={mono(10, active ? c : palette.muted, "bold")}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Simple dependency-free vertical bar chart — flat rectangles, no rounded corners. */
export function BarChart({
  data,
  color,
  max = 10,
  height = 90,
  palette = dark,
}: {
  data: { label: string; value: number }[];
  color?: string;
  max?: number;
  height?: number;
  palette?: Palette;
}) {
  if (data.length === 0) return null;
  const c = color || palette.accent;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: height + 18, gap: 6 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" }}>
          <View style={{ height, justifyContent: "flex-end", width: "100%" }}>
            <View style={{ height: Math.max(3, (d.value / max) * height), backgroundColor: c, width: "100%" }} />
          </View>
          <Text style={mono(8, palette.faint)} numberOfLines={1}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: spacing(1.7), borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: spacing(1.75) },
  input: { flex: 1, paddingVertical: spacing(1.5), fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { borderWidth: 1, padding: spacing(2) },
  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing(1.5) },
});
