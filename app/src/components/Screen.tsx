import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dark, disp, mono, Palette, spacing } from "../theme";
import { Avatar, Cross } from "./ui";

export function Screen({
  children,
  onRefresh,
  refreshing,
  contentStyle,
  palette = dark,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: any;
  palette?: Palette;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={[{ paddingBottom: spacing(6) }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={palette.accentText} colors={[palette.accentText]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Hero({
  title,
  subtitle,
  name,
  right,
  palette = dark,
}: {
  title: string;
  subtitle?: string;
  name?: string;
  right?: React.ReactNode;
  /** Kept for call-site compatibility with the old gradient hero; unused in the flat design. */
  grad?: unknown;
  palette?: Palette;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + spacing(2),
        paddingHorizontal: spacing(3),
        paddingBottom: spacing(2.5),
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: palette.bg,
        position: "relative",
      }}
    >
      <View style={{ position: "absolute", top: 10, left: 10 }}>
        <Cross size={10} color={palette.accentText} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(1.5) }}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={mono(9, palette.muted, "semibold", { letterSpacing: 1, marginBottom: 4 })}>{subtitle.toUpperCase()}</Text> : null}
          <Text style={disp(28, palette.text)}>{title}</Text>
        </View>
        {right ?? (name ? <Avatar name={name} palette={palette} /> : null)}
      </View>
    </View>
  );
}
