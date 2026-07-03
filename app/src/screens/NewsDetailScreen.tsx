import React, { useLayoutEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Announcement } from "../api/client";
import { eventWhen } from "../components/NewsCarousel";
import { Badge, Icon } from "../components/ui";
import { colors, disp, mono, spacing, type as T } from "../theme";

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
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Icon name={isEvent ? "calendar-outline" : "newspaper-outline"} size={36} color={colors.textFaint} />
        </View>
      )}
      <View style={{ padding: spacing(2.5) }}>
        <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? colors.accent : colors.primary} />
        <Text style={[disp(26, colors.text), { marginTop: spacing(1.25) }]}>{item.title}</Text>

        {isEvent && (item.event_date || item.location) ? (
          <View style={styles.metaRow}>
            {item.event_date ? (
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={mono(11, colors.textMuted)}>{eventWhen(item.event_date)}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metaItem}>
                <Icon name="location-outline" size={16} color={colors.textMuted} />
                <Text style={mono(11, colors.textMuted)}>{item.location}</Text>
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
  imagePlaceholder: { alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border },
  metaRow: { flexDirection: "row", gap: spacing(2), marginTop: spacing(1.5), flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  body: { ...T.body, lineHeight: 23, marginTop: spacing(2) },
});
