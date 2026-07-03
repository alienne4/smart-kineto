import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { BarChart, Card, Chip, EmptyState, Loading, Notice, PrimaryButton, SLabel } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, disp, mono, spacing, type as T } from "../../theme";

export default function ProgressScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.listAssessments());
  const [range, setRange] = useState<7 | 30>(7);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const recent = [...(data || [])].slice(0, range).reverse();
  const painSeries = recent.map((a) => ({ label: a.created_at ? new Date(a.created_at).getDate().toString() : "", value: a.pain_level }));
  const mobilitySeries = recent.map((a) => ({ label: a.created_at ? new Date(a.created_at).getDate().toString() : "", value: a.mobility_score }));

  const avgPain = data && data.length ? (data.reduce((s, a) => s + a.pain_level, 0) / data.length).toFixed(1) : "—";
  const avgMob = data && data.length ? (data.reduce((s, a) => s + a.mobility_score, 0) / data.length).toFixed(1) : "—";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headRow}>
        <View style={{ flex: 1, marginRight: spacing(1.5) }}>
          <PrimaryButton title="New check-in" icon="add-outline" onPress={() => navigation.navigate("Assessment")} />
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip label="7 days" active={range === 7} onPress={() => setRange(7)} />
          <Chip label="30 days" active={range === 30} onPress={() => setRange(30)} />
        </View>
      </View>

      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="trending-up-outline" title="No check-ins yet" subtitle="Log your first pain & mobility check-in to track progress." />
      )}

      {data && data.length > 0 && (
        <>
          {recent.length > 1 && (
            <>
              <View style={styles.sectionHead}>
                <SLabel n="01" label={`Pain & mobility · ${range} days`} />
              </View>
              <Card>
                <Text style={styles.chartTitle}>Pain</Text>
                <BarChart data={painSeries} color={colors.danger} />
                <Text style={[styles.chartTitle, { marginTop: spacing(2) }]}>Mobility</Text>
                <BarChart data={mobilitySeries} color={colors.success} />
              </Card>
            </>
          )}

          <View style={styles.sectionHead}>
            <SLabel n="02" label="Averages" />
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCell, styles.statCellDivider]}>
              <Text style={mono(9, colors.textMuted)}>AVG PAIN</Text>
              <Text style={disp(26, colors.danger)}>{avgPain}/10</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={mono(9, colors.textMuted)}>AVG MOBILITY</Text>
              <Text style={disp(26, colors.success)}>{avgMob}/10</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <SLabel n="03" label="Recent check-ins" />
          </View>
          <View style={styles.list}>
            {data.map((a, i) => (
              <View key={a.id} style={[styles.histRow, i < data.length - 1 && styles.histRowDivider]}>
                <View style={styles.histTop}>
                  <View style={{ flexDirection: "row", gap: 14 }}>
                    <Text style={mono(11, colors.text)}>
                      Pain <Text style={{ color: colors.danger, fontWeight: "700" }}>{a.pain_level}</Text>
                    </Text>
                    <Text style={mono(11, colors.text)}>
                      Mobility <Text style={{ color: colors.success, fontWeight: "700" }}>{a.mobility_score}</Text>
                    </Text>
                  </View>
                  <Text style={mono(9, colors.textMuted)}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</Text>
                </View>
                {a.notes ? <Text style={[T.muted, { marginTop: 4, color: colors.text }]}>{a.notes}</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  headRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing(2) },
  sectionHead: { marginTop: spacing(2.5), marginBottom: spacing(1.25) },
  chartTitle: { ...mono(9, colors.textMuted, "semibold"), letterSpacing: 1, marginBottom: spacing(1) },
  statsRow: { flexDirection: "row", borderWidth: 1, borderColor: colors.border },
  statCell: { flex: 1, padding: spacing(1.75), gap: 6 },
  statCellDivider: { borderRightWidth: 1, borderRightColor: colors.border },
  list: { borderWidth: 1, borderColor: colors.border },
  histRow: { padding: spacing(1.5) },
  histRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  histTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
