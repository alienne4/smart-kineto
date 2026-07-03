import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, AppNotification } from "../api/client";
import { EmptyState, Loading, Notice } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { body, disp, light, mono, spacing } from "../theme";

const META: Record<string, { color: string }> = {
  assignment: { color: light.accentText },
  message: { color: light.accentText },
  progress: { color: light.ok },
  assessment: { color: light.warn },
  reminder: { color: light.warn },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationCenterScreen() {
  const { data, loading, error, reload } = useApi(() => api.listNotifications());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function markAll() {
    await api.markAllNotificationsRead();
    reload();
  }

  const hasUnread = (data || []).some((n) => !n.read_at);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={disp(20, light.text)}>NOTIFICATIONS</Text>
        {hasUnread && (
          <Pressable onPress={markAll}>
            <Text style={mono(9, light.accentText, "bold", { letterSpacing: 0.6 })}>MARK ALL READ</Text>
          </Pressable>
        )}
      </View>

      {loading && <Loading palette={light} />}
      {error && <Notice text={error} tone="error" palette={light} />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="Assignments, messages and progress updates show up here." palette={light} />
      )}

      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((n: AppNotification) => {
            const meta = META[n.type] || META.reminder;
            const unread = !n.read_at;
            return (
              <View key={n.id} style={[styles.row, { backgroundColor: unread ? `${light.accent}0F` : light.bg, borderLeftColor: unread ? light.accentText : "transparent" }]}>
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={body(14, light.text, unread ? "semibold" : "regular")}>{n.title}</Text>
                  {n.body ? <Text style={[body(13, light.muted), { marginTop: 2 }]}>{n.body}</Text> : null}
                  <Text style={mono(9, light.faint, "medium", { marginTop: 4 })}>{timeAgo(n.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: light.bg },
  content: { padding: spacing(2.5) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing(2) },
  list: { flexDirection: "column", gap: 1, backgroundColor: light.border },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing(1.5), padding: spacing(1.75), borderLeftWidth: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
});
