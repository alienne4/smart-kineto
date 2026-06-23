import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Announcement } from "../api/client";
import { colors, gradients, radius, spacing, type as T } from "../theme";
import { Ionicons } from "./ui";

export function eventWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function NewsCard({ item, onPress, width = 260 }: { item: Announcement; onPress: () => void; width?: number }) {
  const isEvent = item.kind === "EVENT";
  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <LinearGradient colors={isEvent ? gradients.violet : gradients.primary} style={styles.image} />
      )}
      <View style={styles.body}>
        <View style={[styles.kind, { backgroundColor: (isEvent ? colors.accent : colors.primary) + "22" }]}>
          <Ionicons name={isEvent ? "calendar" : "newspaper"} size={12} color={isEvent ? colors.accent : colors.primary} />
          <Text style={[styles.kindText, { color: isEvent ? colors.accent : colors.primary }]}>
            {isEvent ? "EVENT" : "NEWS"}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {isEvent && item.event_date ? (
          <Text style={styles.meta} numberOfLines={1}>
            {eventWhen(item.event_date)}{item.location ? ` · ${item.location}` : ""}
          </Text>
        ) : (
          <Text style={styles.meta} numberOfLines={2}>{item.body}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function NewsCarousel({ items, onOpen }: { items: Announcement[]; onOpen: (a: Announcement) => void }) {
  if (items.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <NewsCard key={item.id} item={item} onPress={() => onOpen(item)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing(1.5), paddingRight: spacing(2.5) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  image: { width: "100%", height: 110, backgroundColor: colors.surfaceHi },
  body: { padding: spacing(1.5), gap: 6 },
  kind: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  kindText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  title: { ...T.body, fontWeight: "700" },
  meta: { ...T.muted, fontSize: 12 },
});
