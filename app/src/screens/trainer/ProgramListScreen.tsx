import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Badge, EmptyState, Icon, IconTile, Loading, Notice } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, colors, mono, spacing } from "../../theme";

function SourceTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={mono(10, active ? colors.primary : colors.textMuted, active ? "bold" : "medium")}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

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
          <SourceTab label="My programs" active={source === "MINE"} onPress={() => setSource("MINE")} />
          <SourceTab label="Library" active={source === "LIBRARY"} onPress={() => setSource("LIBRARY")} />
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
        {filtered.length > 0 && (
          <View style={styles.list}>
            {filtered.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate("ProgramDetail", { program: p })}
                style={[styles.row, i < filtered.length - 1 && styles.rowDivider]}
              >
                <IconTile icon="list-outline" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.author}>by {p.author}</Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {p.description || "No description"}
                  </Text>
                  {p.is_template ? (
                    <View style={{ marginTop: 6 }}>
                      <Badge text="Library" />
                    </View>
                  ) : p.is_public ? (
                    <View style={{ marginTop: 6 }}>
                      <Badge text="Public" color={colors.success} />
                    </View>
                  ) : null}
                </View>
                <Badge text={`${p.exercise_count}`} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => navigation.navigate("CreateProgram")}>
        <Icon name="add" size={26} color={colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(12) },
  segment: { flexDirection: "row", gap: 1, backgroundColor: colors.border, marginBottom: spacing(2) },
  tab: { flex: 1, paddingVertical: spacing(1.25), alignItems: "center", backgroundColor: colors.bg },
  tabActive: { backgroundColor: `${colors.primary}15`, borderBottomWidth: 2, borderBottomColor: colors.primary },
  list: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), padding: spacing(1.75) },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  name: body(14, colors.text, "semibold"),
  author: mono(9, colors.primary, "bold", { marginTop: 2, marginBottom: 2 }),
  desc: body(12, colors.textMuted),
  fab: {
    position: "absolute",
    right: spacing(2.5),
    bottom: spacing(3),
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
