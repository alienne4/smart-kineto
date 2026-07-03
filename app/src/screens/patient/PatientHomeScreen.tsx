import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Announcement, api, Assessment, Assignment } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCarousel } from "../../components/NewsCarousel";
import { NotificationBell } from "../../components/NotificationBell";
import { Hero, Screen } from "../../components/Screen";
import {
  Card,
  Corners,
  EmptyState,
  Ionicons,
  Loading,
  PrimaryButton,
  ProgressBar,
  SectionTitle,
  SLabel,
  StatCard,
  Ticker,
} from "../../components/ui";
import { colors, disp, mono, spacing, type as T } from "../../theme";

export default function PatientHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [feed, setFeed] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [asg, asm, news] = await Promise.all([
        api.listAssignments(),
        api.listAssessments(),
        api.getFeed().catch(() => []),
      ]);
      setAssignments(asg);
      setAssessments(asm);
      setFeed(news);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = assignments.find((a) => a.status === "ACTIVE") || assignments[0];
  const latest = assessments[0];
  const queue = today ? [...(today.program.program_exercises || [])].sort((a, b) => a.order - b.order) : [];

  const goToToday = () =>
    today &&
    navigation.navigate("Programs", {
      screen: "ProgramDetail",
      params: { program: today.program, assignmentId: today.id, status: today.status },
    });

  const tickerItems = [
    today ? `${today.program.name.toUpperCase()} · ${today.status.replace("_", " ")}` : "NO ACTIVE PROGRAM",
    `PROGRAMS · ${assignments.length}`,
    latest ? `LAST PAIN · ${latest.pain_level}/10` : "NO CHECK-INS LOGGED",
  ];

  return (
    <Screen
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      refreshing={refreshing}
    >
      <Hero
        subtitle="Let's get moving"
        title={`Hi, ${(user?.full_name || "there").split(" ")[0]}`}
        right={<NotificationBell onPress={() => navigation.navigate("Notifications")} />}
      />
      <Ticker items={tickerItems} />

      <View style={styles.body}>
        {loading ? (
          <Loading />
        ) : (
          <>
            {!user?.trainer && (
              <Card style={styles.linkCard} onPress={() => navigation.navigate("Profile", { screen: "PickTrainer", initial: false })}>
                <Ionicons name="person-add-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={T.body}>Link to a trainer</Text>
                  <Text style={T.muted}>So they can assign you programs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Card>
            )}

            <View style={styles.statsRow}>
              <StatCard label="Programs" value={assignments.length} icon="list-outline" />
              <StatCard label="Check-ins" value={assessments.length} icon="clipboard-outline" />
              <StatCard label="Pain" value={latest ? `${latest.pain_level}/10` : "-"} icon="pulse-outline" />
            </View>

            {feed.length > 0 && (
              <>
                <SectionTitle
                  title="News & events"
                  action={<Text style={styles.link} onPress={() => navigation.navigate("News")}>See all</Text>}
                />
                <View style={{ marginHorizontal: -spacing(2.5), paddingLeft: spacing(2.5), marginBottom: spacing(2) }}>
                  <NewsCarousel items={feed} onOpen={(item) => navigation.navigate("NewsDetail", { item })} />
                </View>
              </>
            )}

            <View style={{ marginBottom: spacing(1) }}>
              <SLabel n="01" label="Next up" />
            </View>
            {today ? (
              <View style={styles.nextUp}>
                <Corners color={colors.primary} sz={9} />
                <Text style={mono(9, colors.textMuted, "semibold", { marginBottom: 6 })}>
                  {`NEXT UP · ${today.program.exercise_count} EXERCISE(S)`}
                </Text>
                <Text style={disp(24, colors.text, { marginBottom: 10 })}>{today.program.name}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
                  <Text style={mono(9, colors.textMuted)}>{today.status.replace("_", " ")}</Text>
                  {today.program.author ? <Text style={mono(9, colors.textMuted)}>{today.program.author}</Text> : null}
                </View>
                <PrimaryButton title="Start session" icon="play" onPress={goToToday} />
              </View>
            ) : (
              <EmptyState icon="list-outline" title="No program yet" subtitle="Once your trainer assigns a program, it shows up here." />
            )}

            {queue.length > 0 && (
              <>
                <View style={{ marginTop: spacing(2.5), marginBottom: spacing(1) }}>
                  <SLabel n="02" label="Exercise queue" />
                </View>
                <View style={styles.queue}>
                  {queue.map((pe, i) => (
                    <View key={pe.id} style={[styles.queueRow, i < queue.length - 1 && styles.queueRowDivider]}>
                      <Text style={mono(9, colors.textMuted, "bold", { width: 20 })}>{String(i + 1).padStart(2, "0")}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={T.body}>{pe.exercise.title}</Text>
                        <Text style={T.muted}>{pe.sets} sets × {pe.reps} reps</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ marginTop: spacing(2.5), marginBottom: spacing(1) }}>
              <SLabel n="03" label="How you feel" />
            </View>
            <Card style={styles.feelCard} onPress={() => navigation.navigate("Progress", { screen: "Assessment", initial: false })}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={T.body}>Daily check-in</Text>
                {latest ? (
                  <>
                    <Text style={T.muted}>Last: pain {latest.pain_level}, mobility {latest.mobility_score}</Text>
                    <ProgressBar value={latest.mobility_score * 10} color={colors.success} />
                  </>
                ) : (
                  <Text style={T.muted}>Log today's pain and mobility</Text>
                )}
              </View>
              <Ionicons name="add-circle" size={30} color={colors.primary} />
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing(2.5), gap: spacing(1) },
  linkCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2), borderColor: colors.primary },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginBottom: spacing(2) },
  nextUp: { borderWidth: 1, borderColor: colors.border, padding: spacing(2), position: "relative" },
  queue: { borderWidth: 1, borderColor: colors.border },
  queueRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.25), paddingHorizontal: spacing(1.75), paddingVertical: spacing(1.25) },
  queueRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  feelCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  link: { color: colors.primary, fontWeight: "700" },
});
