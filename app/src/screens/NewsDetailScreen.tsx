import { LinearGradient } from "expo-linear-gradient";
import React, { useLayoutEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Announcement } from "../api/client";
import { eventWhen } from "../components/NewsCarousel";
import { Badge, Ionicons } from "../components/ui";
import { colors, gradients, radius, spacing, type as T } from "../theme";

export default function NewsDetailScreen({ route, navigation }: any) {
  const item: Announcement = route.params.item;
  const isEvent = item.kind === "EVENT";

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEvent ? "Event" : "News" });
  }, [navigation, isEvent]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <LinearGradient colors={isEvent ? gradients.violet : gradients.primary} style={styles.image} />
      )}
      <View style={{ padding: spacing(2.5) }}>
        <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? colors.accent : colors.primary} />
        <Text style={[T.h1, { marginTop: spacing(1) }]}>{item.title}</Text>

        {isEvent && (item.event_date || item.location) ? (
          <View style={styles.metaRow}>
            {item.event_date ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={T.muted}>{eventWhen(item.event_date)}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={T.muted}>{item.location}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing(4) },
  image: { width: "100%", height: 200, backgroundColor: colors.surfaceHi },
  metaRow: { flexDirection: "row", gap: spacing(2), marginTop: spacing(1.5), flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  body: { ...T.body, lineHeight: 23, marginTop: spacing(2) },
});
