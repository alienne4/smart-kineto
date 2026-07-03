import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { Avatar, EmptyState, Field, Ionicons, Loading, Notice, PrimaryButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, colors, mono, spacing } from "../../theme";

export default function PatientListScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.listPatients());
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter(
      (pt) => (pt.full_name || "").toLowerCase().includes(q) || pt.email.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton title="Find & add patients" icon="search-outline" onPress={() => navigation.navigate("FindPatients")} />
      <View style={{ height: spacing(2) }} />
      {(data?.length ?? 0) > 0 && (
        <Field icon="search-outline" placeholder="Search patients…" value={query} onChangeText={setQuery} />
      )}
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="people-outline" title="No patients yet" subtitle="Use “Find & add patients” to search and add patients to your roster." />
      )}
      {!loading && (data?.length ?? 0) > 0 && filtered.length === 0 && (
        <EmptyState icon="search-outline" title="No matches" subtitle="Try a different name or email." />
      )}
      {filtered.length > 0 && (
        <View style={styles.rowsWrap}>
          {filtered.map((pt) => (
            <Pressable key={pt.id} style={styles.row} onPress={() => navigation.navigate("PatientDetail", { patient: pt })}>
              <Avatar name={pt.full_name || pt.email} />
              <View style={{ flex: 1 }}>
                <Text style={body(14, colors.text, "medium")}>{pt.full_name || pt.email}</Text>
                <Text style={mono(9, colors.textMuted)}>{pt.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6) },
  rowsWrap: { gap: 1, backgroundColor: colors.border, marginTop: spacing(2) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), backgroundColor: colors.bg, padding: spacing(1.75) },
});
