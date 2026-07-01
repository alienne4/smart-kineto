import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { RefreshControl, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, gradients, spacing, type as T } from "../theme";
import { Avatar } from "./ui";

export function Screen({
  children,
  onRefresh,
  refreshing,
  contentStyle
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined
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
  grad = gradients.header
}: {
  title: string;
  subtitle?: string;
  name?: string;
  right?: React.ReactNode;
  grad?: readonly [string, string];
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing(2) }]}
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
        {right ?? (name ? <Avatar name={name} /> : null)}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing(6) },
  hero: {
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(3.5),
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  heroSub: { color: "rgba(255,255,255,0.75)", fontWeight: "600", fontSize: 13, marginBottom: 2 },
  heroTitle: { ...T.display, color: "#fff" }
});
