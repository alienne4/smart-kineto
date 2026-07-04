import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { Avatar, BarChart, Card, EmptyState, Ionicons, Loading, Notice, PrimaryButton, SectionTitle } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, spacing, type as T } from "../../theme";

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
          <Text style={T.h1}>{patient.full_name || patient.email}</Text>
          <Text style={T.muted}>{patient.email}</Text>
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
          <Card style={styles.miniStat}>
            <Text style={[T.h1, { color: colors.danger }]}>{latest.pain_level}</Text>
            <Text style={T.muted}>Latest pain</Text>
          </Card>
          <Card style={styles.miniStat}>
            <Text style={[T.h1, { color: colors.success }]}>{latest.mobility_score}</Text>
            <Text style={T.muted}>Latest mobility</Text>
          </Card>
        </View>
      )}

      {recent.length > 1 && (
        <Card style={{ marginTop: spacing(2) }}>
          <Text style={styles.chartTitle}>Pain trend</Text>
          <BarChart data={painSeries} color={colors.danger} />
          <Text style={[styles.chartTitle, { marginTop: spacing(2) }]}>Mobility trend</Text>
          <BarChart data={mobilitySeries} color={colors.success} />
        </Card>
      )}

      <SectionTitle title="Self-assessments" />
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="clipboard-outline" title="No assessments yet" />}
      {data?.map((a) => (
        <Card key={a.id} style={{ marginBottom: spacing(1.25) }}>
          <View style={styles.assessRow}>
            <Text style={T.body}>Pain {a.pain_level} · Mobility {a.mobility_score}</Text>
            <Text style={T.muted}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</Text>
          </View>
          {a.notes ? <Text style={[T.muted, { marginTop: spacing(0.5), color: colors.text }]}>{a.notes}</Text> : null}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  head: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2) },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginTop: spacing(2) },
  miniStat: { flex: 1, alignItems: "center", gap: 4 },
  chartTitle: { ...T.label, marginBottom: spacing(1) },
  assessRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
