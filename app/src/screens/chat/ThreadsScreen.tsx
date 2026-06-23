import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Badge, Card, EmptyState, Loading, Notice, PrimaryButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, spacing, type as T } from "../../theme";

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
        <PrimaryButton
          title={`Message ${user!.trainer!.full_name}`}
          icon="chatbubble-ellipses-outline"
          onPress={() =>
            navigation.navigate("Chat", { userId: user!.trainer!.id, name: user!.trainer!.full_name })
          }
        />
      )}

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

      {data?.map((t) => (
        <Card key={t.user_id} style={styles.row} onPress={() => navigation.navigate("Chat", { userId: t.user_id, name: t.full_name })}>
          <Avatar name={t.full_name || t.email} />
          <View style={{ flex: 1 }}>
            <Text style={T.body} numberOfLines={1}>{t.full_name || t.email}</Text>
            <Text style={T.muted} numberOfLines={1}>{t.last_message}</Text>
          </View>
          {t.unread > 0 && <Badge text={`${t.unread}`} color={colors.primary} />}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginVertical: spacing(0.75) },
});
