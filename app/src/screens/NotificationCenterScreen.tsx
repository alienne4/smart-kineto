import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, AppNotification } from "../api/client";
import { Card, EmptyState, IconTile, Ionicons, Loading, Notice } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { colors, gradients, spacing, type as T } from "../theme";

const META: Record<string, { icon: string; grad: readonly [string, string] }> = {
  assignment: { icon: "clipboard", grad: gradients.violet },
  message: { icon: "chatbubble-ellipses", grad: gradients.primary },
  progress: { icon: "trophy", grad: gradients.emerald },
  assessment: { icon: "pulse", grad: gradients.rose },
  reminder: { icon: "notifications", grad: gradients.amber },
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
      {hasUnread && (
        <Text style={styles.markAll} onPress={markAll}>
          Mark all as read
        </Text>
      )}
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="Assignments, messages and progress updates show up here." />
      )}
      {data?.map((n: AppNotification) => {
        const meta = META[n.type] || META.reminder;
        return (
          <Card key={n.id} style={[styles.row, !n.read_at && styles.unread]}>
            <IconTile icon={meta.icon as any} grad={meta.grad} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{n.title}</Text>
              {n.body ? <Text style={[T.muted, { marginTop: 2 }]}>{n.body}</Text> : null}
              <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
            </View>
            {!n.read_at && <View style={styles.dot} />}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  markAll: { color: colors.primary, fontWeight: "700", textAlign: "right", marginBottom: spacing(1.5) },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing(1.5), marginBottom: spacing(1.25) },
  unread: { borderColor: colors.primary + "66", backgroundColor: colors.surfaceAlt },
  time: { ...T.muted, fontSize: 11, marginTop: 4, color: colors.textFaint },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
});
