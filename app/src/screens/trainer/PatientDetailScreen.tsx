import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { Avatar, BarChart, EmptyState, Loading, Notice, PrimaryButton, SLabel, StatCard } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { body, colors, disp, mono, spacing } from "../../theme";

export default function PatientDetailScreen({ route, navigation }: any) {
  const patient = route.params.patient;
  const { data, loading, error, reload } = useApi(() => api.listAssessments(patient.id));

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const recent = [...(data || [])].slice(0, 7).reverse();
  const painSeries = recent.map((a) => ({ label: "", value: a.pain_level }));
  const mobilitySeries = recent.map((a) => ({ label: "", value: a.mobility_score }));
  const latest = data?.[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Avatar name={patient.full_name || patient.email} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{patient.full_name || patient.email}</Text>
          <Text style={styles.email}>{patient.email}</Text>
        </View>
      </View>

      <PrimaryButton title="Assign a program" icon="add-outline" onPress={() => navigation.navigate("AssignProgram", { patient })} />
      <View style={{ height: spacing(1.25) }} />
      <PrimaryButton
        title="Message patient"
        variant="ghost"
        icon="chatbubble-ellipses-outline"
        onPress={() =>
          navigation.navigate("Messages", { screen: "Chat", params: { userId: patient.id, name: patient.full_name || patient.email }, initial: false })
        }
      />

      {latest && (
        <View style={styles.statsRow}>
          <StatCard label="Latest pain" value={latest.pain_level} icon="alert-circle" />
          <StatCard label="Latest mobility" value={latest.mobility_score} icon="trending-up" />
        </View>
      )}

      {recent.length > 1 && (
        <View style={{ marginTop: spacing(2.5) }}>
          <SLabel n="01" label="Trend" right={`Last ${recent.length}`} />
          <View style={styles.trendCard}>
            <Text style={styles.chartLabel}>Pain</Text>
            <BarChart data={painSeries} color={colors.danger} height={64} />
            <Text style={[styles.chartLabel, { marginTop: spacing(1.5) }]}>Mobility</Text>
            <BarChart data={mobilitySeries} color={colors.success} height={64} />
          </View>
        </View>
      )}

      <View style={styles.sectionHead}>
        <SLabel n={recent.length > 1 ? "02" : "01"} label="Self-assessments" right={data ? `${data.length}` : undefined} />
      </View>
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="clipboard-outline" title="No assessments yet" />}
      {data && data.length > 0 && (
        <View style={styles.list}>
          {data.map((a, i) => (
            <View key={a.id} style={[styles.assessRow, i < data.length - 1 && styles.rowDivider]}>
              <View style={styles.assessHead}>
                <Text style={styles.assessValue}>
                  Pain <Text style={{ color: colors.danger }}>{a.pain_level}</Text> · Mobility <Text style={{ color: colors.success }}>{a.mobility_score}</Text>
                </Text>
                <Text style={styles.date}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</Text>
              </View>
              {a.notes ? <Text style={styles.notes}>{a.notes}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  head: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2.5) },
  name: disp(20, colors.text),
  email: mono(10, colors.textMuted, "medium", { marginTop: 4 }),
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginTop: spacing(2.5) },
  trendCard: { borderWidth: 1, borderColor: colors.border, padding: spacing(1.75), marginTop: spacing(1) },
  chartLabel: mono(9, colors.textMuted, "semibold", { letterSpacing: 1 }),
  sectionHead: { marginTop: spacing(2.5), marginBottom: spacing(1.5) },
  list: { borderWidth: 1, borderColor: colors.border },
  assessRow: { padding: spacing(1.75) },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  assessHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  assessValue: body(13, colors.text, "medium"),
  date: mono(9, colors.textMuted, "medium"),
  notes: body(12, colors.textMuted, "regular", { marginTop: 6 }),
});
