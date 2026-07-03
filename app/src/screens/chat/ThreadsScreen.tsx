import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Badge, EmptyState, Loading, Notice, PrimaryButton, SLabel } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, mono, spacing, type as T } from "../../theme";

function threadTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ThreadsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.listThreads());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const canMessageTrainer = user?.role === "PATIENT" && user.trainer;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {canMessageTrainer && (
        <View style={{ marginBottom: spacing(2.5) }}>
          <PrimaryButton
            title={`Message ${user!.trainer!.full_name}`}
            icon="chatbubble-ellipses-outline"
            onPress={() =>
              navigation.navigate("Chat", { userId: user!.trainer!.id, name: user!.trainer!.full_name })
            }
          />
        </View>
      )}

      <SLabel n="01" label="Conversations" right={data?.length ? `${data.length}` : undefined} />

      <View style={{ height: spacing(1.5) }} />

      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          subtitle={
            user?.role === "TRAINER"
              ? "Open a patient and tap Message to start a conversation."
              : "Message your trainer to get started."
          }
        />
      )}

      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((t, i) => (
            <Pressable
              key={t.user_id}
              onPress={() => navigation.navigate("Chat", { userId: t.user_id, name: t.full_name })}
              style={({ pressed }) => [
                styles.row,
                i < data.length - 1 && styles.rowDivider,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Avatar name={t.full_name || t.email} />
              <View style={{ flex: 1 }}>
                <Text style={T.body} numberOfLines={1}>{t.full_name || t.email}</Text>
                <Text style={T.muted} numberOfLines={1}>{t.last_message || "No messages yet"}</Text>
              </View>
              <View style={styles.trailing}>
                <Text style={mono(9, colors.textFaint)}>{threadTime(t.last_at)}</Text>
                {t.unread > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Badge text={`${t.unread}`} color={colors.primary} />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
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
  trailing: { alignItems: "flex-end" },
});
