import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../api/client";
import { eventWhen } from "../components/NewsCarousel";
import { Badge, EmptyState, Icon, Loading, Notice, SLabel } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { colors, spacing, type as T } from "../theme";

export default function NewsScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.getFeed());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SLabel n="01" label="Feed" right={data?.length ? `${data.length}` : undefined} />
      <View style={{ height: spacing(1.5) }} />

      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="newspaper-outline" title="Nothing here yet" subtitle="News and events will appear here." />}

      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((item, i) => {
            const isEvent = item.kind === "EVENT";
            return (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate("NewsDetail", { item })}
                style={({ pressed }) => [
                  styles.row,
                  i < data.length - 1 && styles.rowDivider,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Icon name={isEvent ? "calendar-outline" : "newspaper-outline"} size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={T.body} numberOfLines={2}>{item.title}</Text>
                  <Text style={T.muted} numberOfLines={1}>
                    {isEvent
                      ? `${eventWhen(item.event_date)}${item.location ? ` · ${item.location}` : ""}`
                      : item.body}
                  </Text>
                </View>
                <Badge text={isEvent ? "EVENT" : "NEWS"} color={isEvent ? colors.accent : colors.primary} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  list: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), padding: spacing(1.75) },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thumb: { width: 48, height: 48, backgroundColor: colors.surfaceHi },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
