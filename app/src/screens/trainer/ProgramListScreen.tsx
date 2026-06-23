import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, Card, EmptyState, IconTile, Ionicons, Loading, Notice } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, gradients, spacing, type as T } from "../../theme";
import { SegBtn } from "./ExerciseListScreen";

export default function ProgramListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.listPrograms());
  const [source, setSource] = useState<"MINE" | "LIBRARY">("MINE");

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filtered = useMemo(
    () =>
      (data || []).filter((p) => {
        const isMine = !p.is_template && p.created_by?.id === user?.id;
        return source === "LIBRARY" ? !isMine : isMine;
      }),
    [data, source, user?.id]
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segment}>
          <SegBtn label="My programs" active={source === "MINE"} onPress={() => setSource("MINE")} />
          <SegBtn label="Library" active={source === "LIBRARY"} onPress={() => setSource("LIBRARY")} />
        </View>
        {loading && <Loading />}
        {error && <Notice text={error} tone="error" />}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon="list-outline"
            title={source === "LIBRARY" ? "No library programs" : "No programs yet"}
            subtitle={source === "LIBRARY" ? "Check back later." : "Build your own or copy one from the Library."}
          />
        )}
        {filtered.map((p) => (
          <Card key={p.id} style={styles.row} onPress={() => navigation.navigate("ProgramDetail", { program: p })}>
            <IconTile icon="list-outline" grad={gradients.violet} />
            <View style={{ flex: 1 }}>
              <Text style={T.body} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.author}>by {p.author}</Text>
              <Text style={T.muted} numberOfLines={2}>
                {p.description || "No description"}
              </Text>
              {p.is_template ? (
                <View style={{ marginTop: 4 }}><Badge text="LIBRARY" color={colors.accent} /></View>
              ) : p.is_public ? (
                <View style={{ marginTop: 4 }}><Badge text="PUBLIC" color={colors.success} /></View>
              ) : null}
            </View>
            <Badge text={`${p.exercise_count}`} color={colors.primary} />
          </Card>
        ))}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => navigation.navigate("CreateProgram")}>
        <Ionicons name="add" size={28} color={colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(12) },
  segment: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(2) },
  author: { ...T.muted, fontSize: 11, color: colors.primary, fontWeight: "700", marginTop: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
  fab: {
    position: "absolute",
    right: spacing(2.5),
    bottom: spacing(3),
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
