import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../auth/AuthContext";

export function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[segStyles.btn, active && segStyles.btnActive]}>
      <Text style={[segStyles.text, active && segStyles.textActive]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

import { api } from "../../api/client";
import {
  Badge,
  Chip,
  EmptyState,
  Field,
  IconTile,
  Ionicons,
  Loading,
  Notice,
} from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, BODY_PART_META, colors, DIFFICULTY_META, mono, spacing } from "../../theme";

const FILTERS = ["ALL", "SHOULDER", "KNEE", "HIP", "BACK", "ELBOW", "NECK"];

export default function ExerciseListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.listExercises());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [source, setSource] = useState<"MINE" | "LIBRARY">("MINE");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate("CreateExercise")} hitSlop={8}>
          <Ionicons name="add" size={18} color={colors.bg} />
        </Pressable>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filtered = useMemo(() => {
    return (data || []).filter((ex) => {
      const isMine = !ex.is_template && ex.created_by?.id === user?.id;
      const matchSource = source === "LIBRARY" ? !isMine : isMine;
      const matchFilter = filter === "ALL" || ex.body_part === filter;
      const matchQuery = ex.title.toLowerCase().includes(query.toLowerCase());
      return matchSource && matchFilter && matchQuery;
    });
  }, [data, filter, query, source, user?.id]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segment}>
          <SegBtn label="My exercises" active={source === "MINE"} onPress={() => setSource("MINE")} />
          <SegBtn label="Library" active={source === "LIBRARY"} onPress={() => setSource("LIBRARY")} />
        </View>
        <Field icon="search-outline" placeholder="Search exercises" value={query} onChangeText={setQuery} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing(2) }}>
          <View style={{ flexDirection: "row", gap: spacing(1) }}>
            {FILTERS.map((f) => (
              <Chip key={f} label={f === "ALL" ? "All" : BODY_PART_META[f]?.label || f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </View>
        </ScrollView>

        {loading && <Loading />}
        {error && <Notice text={error} tone="error" />}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon="barbell-outline"
            title={source === "LIBRARY" ? "No library matches" : "No exercises"}
            subtitle={source === "LIBRARY" ? "Try clearing the filters." : "Tap + to create your own, or browse the Library."}
          />
        )}

        {filtered.length > 0 && (
          <View style={styles.rowsWrap}>
            {filtered.map((ex) => {
              const meta = BODY_PART_META[ex.body_part] || BODY_PART_META.OTHER;
              const diff = DIFFICULTY_META[ex.difficulty] || DIFFICULTY_META.EASY;
              return (
                <Pressable key={ex.id} style={styles.row} onPress={() => navigation.navigate("ExerciseDetail", { exercise: ex })}>
                  {ex.thumbnail ? (
                    <Image source={{ uri: ex.thumbnail }} style={styles.thumb} />
                  ) : (
                    <IconTile icon={meta.icon as any} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={body(13, colors.text, "medium")} numberOfLines={1}>{ex.title}</Text>
                    <Text style={styles.author}>by {ex.author}</Text>
                    {ex.description ? (
                      <Text style={styles.caption} numberOfLines={2}>{ex.description}</Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Badge text={meta.label} />
                      <Badge text={diff.label} color={diff.color} />
                      {ex.is_template ? <Badge text="LIBRARY" color={colors.primary} /> : ex.is_public ? <Badge text="PUBLIC" color={colors.success} /> : null}
                      {ex.video ? <Badge text="VIDEO" color={colors.primary} /> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6) },
  segment: { flexDirection: "row", gap: 1, backgroundColor: colors.border, marginBottom: spacing(2) },
  addBtn: {
    width: 32,
    height: 32,
    marginRight: spacing(1),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: 46, height: 46, backgroundColor: colors.surfaceHi },
  author: { ...mono(9, colors.primary, "bold"), marginTop: 1, marginBottom: 2 },
  caption: { ...body(12, colors.textMuted), marginBottom: 2 },
  rowsWrap: { gap: 1, backgroundColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), backgroundColor: colors.bg, padding: spacing(1.5) },
  metaRow: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(0.75), flexWrap: "wrap" },
});

const segStyles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: spacing(1.25),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  btnActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt, borderBottomWidth: 2, borderBottomColor: colors.primary },
  text: { ...mono(10, colors.textMuted, "bold") },
  textActive: { color: colors.primary },
});
