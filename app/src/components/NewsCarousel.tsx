import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Announcement } from "../api/client";
import { colors, mono, spacing, type as T } from "../theme";
import { Badge, Icon } from "./ui";

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
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Icon name={isEvent ? "calendar-outline" : "newspaper-outline"} size={22} color={colors.textFaint} />
        </View>
      )}
      <View style={styles.body}>
        <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? colors.accent : colors.primary} />
        <Text style={[T.body, { marginTop: 4 }]} numberOfLines={2}>{item.title}</Text>
        {isEvent && item.event_date ? (
          <Text style={mono(9, colors.textMuted)} numberOfLines={1}>
            {eventWhen(item.event_date)}{item.location ? ` · ${item.location}` : ""}
          </Text>
        ) : (
          <Text style={mono(9, colors.textMuted)} numberOfLines={2}>{item.body}</Text>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 110, backgroundColor: colors.surfaceHi },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border },
  body: { padding: spacing(1.5), gap: 6 },
});
