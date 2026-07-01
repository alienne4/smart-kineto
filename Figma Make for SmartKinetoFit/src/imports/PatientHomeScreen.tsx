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
  EmptyState,
  IconTile,
  Ionicons,
  Loading,
  PrimaryButton,
  ProgressBar,
  SectionTitle,
  StatCard,
} from "../../components/ui";
import { colors, gradients, spacing, type as T } from "../../theme";

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
              <StatCard label="Programs" value={assignments.length} icon="list-outline" grad={gradients.primary} />
              <StatCard label="Check-ins" value={assessments.length} icon="clipboard-outline" grad={gradients.emerald} />
              <StatCard label="Pain" value={latest ? `${latest.pain_level}/10` : "—"} icon="pulse-outline" grad={gradients.rose} />
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

            <SectionTitle title="Today's focus" />
            {today ? (
              <Card>
                <View style={styles.todayHead}>
                  <IconTile icon="play" grad={gradients.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={T.h2}>{today.program.name}</Text>
                    <Text style={T.muted}>{today.program.exercise_count} exercise(s)</Text>
                  </View>
                </View>
                <View style={{ height: spacing(1.5) }} />
                <PrimaryButton
                  title="Start session"
                  icon="play"
                  onPress={() =>
                    navigation.navigate("Programs", {
                      screen: "ProgramDetail",
                      params: { program: today.program, assignmentId: today.id, status: today.status },
                    })
                  }
                />
              </Card>
            ) : (
              <EmptyState icon="list-outline" title="No program yet" subtitle="Once your trainer assigns a program, it shows up here." />
            )}

            <SectionTitle title="How you feel" />
            <Card style={styles.feelCard} onPress={() => navigation.navigate("Progress", { screen: "Assessment", initial: false })}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={T.body}>Daily check-in</Text>
                {latest ? (
                  <>
                    <Text style={T.muted}>Last: pain {latest.pain_level}, mobility {latest.mobility_score}</Text>
                    <ProgressBar value={latest.mobility_score * 10} color={colors.success} />
                  </>
                ) : (
                  <Text style={T.muted}>Log today's pain & mobility</Text>
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
  todayHead: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  feelCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  link: { color: colors.primary, fontWeight: "700" },
});
