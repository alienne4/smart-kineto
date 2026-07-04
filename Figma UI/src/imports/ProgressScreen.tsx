import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { BarChart, Card, EmptyState, Ionicons, Loading, Notice, PrimaryButton, SectionTitle } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, spacing, type as T } from "../../theme";

export default function ProgressScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.listAssessments());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const recent = [...(data || [])].slice(0, 7).reverse();
  const painSeries = recent.map((a) => ({ label: a.created_at ? new Date(a.created_at).getDate().toString() : "", value: a.pain_level }));
  const mobilitySeries = recent.map((a) => ({ label: a.created_at ? new Date(a.created_at).getDate().toString() : "", value: a.mobility_score }));

  const avgPain = data && data.length ? (data.reduce((s, a) => s + a.pain_level, 0) / data.length).toFixed(1) : "—";
  const avgMob = data && data.length ? (data.reduce((s, a) => s + a.mobility_score, 0) / data.length).toFixed(1) : "—";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton title="New check-in" icon="add-outline" onPress={() => navigation.navigate("Assessment")} />

      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="trending-up-outline" title="No check-ins yet" subtitle="Log your first pain & mobility check-in to track progress." />
      )}

      {data && data.length > 0 && (
        <>
          <View style={styles.statsRow}>
            <Card style={styles.miniStat}>
              <Text style={[T.h1, { color: colors.danger }]}>{avgPain}</Text>
              <Text style={T.muted}>Avg pain</Text>
            </Card>
            <Card style={styles.miniStat}>
              <Text style={[T.h1, { color: colors.success }]}>{avgMob}</Text>
              <Text style={T.muted}>Avg mobility</Text>
            </Card>
          </View>

          {recent.length > 1 && (
            <Card style={{ marginTop: spacing(2) }}>
              <Text style={styles.chartTitle}>Pain (last {recent.length})</Text>
              <BarChart data={painSeries} color={colors.danger} />
              <Text style={[styles.chartTitle, { marginTop: spacing(2) }]}>Mobility (last {recent.length})</Text>
              <BarChart data={mobilitySeries} color={colors.success} />
            </Card>
          )}

          <SectionTitle title="History" />
          {data.map((a) => (
            <Card key={a.id} style={{ marginBottom: spacing(1.25) }}>
              <View style={styles.histRow}>
                <Text style={T.body}>Pain {a.pain_level} · Mobility {a.mobility_score}</Text>
                <Text style={T.muted}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</Text>
              </View>
              {a.notes ? <Text style={[T.muted, { marginTop: 4, color: colors.text }]}>{a.notes}</Text> : null}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginTop: spacing(2) },
  miniStat: { flex: 1, alignItems: "center", gap: 4 },
  chartTitle: { ...T.label, marginBottom: spacing(1) },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
