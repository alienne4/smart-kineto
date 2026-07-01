import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Announcement, api, Assessment, Assignment } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
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
  StatCard
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
      const [assignmentList, assessmentList, news] = await Promise.all([
        api.listAssignments(),
        api.listAssessments(),
        api.getFeed().catch(() => [])
      ]);
      setAssignments(assignmentList);
      setAssessments(assessmentList);
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

  const today = assignments.find((assignment) => assignment.status === "ACTIVE") || assignments[0];
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
            {!user?.trainer ? (
              <Card style={styles.linkCard} onPress={() => navigation.getParent()?.navigate("Profile")}>
                <Ionicons name="person-add-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={T.body}>Link to a trainer</Text>
                  <Text style={T.muted}>So they can assign you programs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Card>
            ) : null}

            <View style={styles.statsRow}>
              <StatCard label="Programs" value={assignments.length} icon="list-outline" grad={gradients.primary} />
              <StatCard label="Check-ins" value={assessments.length} icon="clipboard-outline" grad={gradients.emerald} />
              <StatCard label="Pain" value={latest ? `${latest.pain_level}/10` : "-"} icon="pulse-outline" grad={gradients.rose} />
            </View>

            {feed.length > 0 ? (
              <>
                <SectionTitle title="News & events" action={<Text style={styles.link} onPress={() => navigation.navigate("News")}>See all</Text>} />
                <NewsStrip items={feed} onOpen={(item) => navigation.navigate("NewsDetail", { item, title: item.title })} />
              </>
            ) : null}

            <SectionTitle title="Today's focus" />
            {today ? (
              <Card>
                <View style={styles.todayHead}>
                  <IconTile icon="play" grad={gradients.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={T.h2}>{today.program.name}</Text>
                    <Text style={T.muted}>{today.program.exercise_count || today.program.program_exercises?.length || 0} exercise(s)</Text>
                  </View>
                </View>
                <View style={{ height: spacing(1.5) }} />
                <PrimaryButton title="Start session" icon="play" onPress={() => startSession(navigation, today)} />
              </Card>
            ) : (
              <EmptyState icon="list-outline" title="No program yet" subtitle="Once your trainer assigns a program, it shows up here." />
            )}

            <SectionTitle title="How you feel" />
            <Card style={styles.feelCard} onPress={() => navigation.getParent()?.navigate("Progress")}>
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

function startSession(navigation: any, assignment: Assignment) {
  const first = [...(assignment.program.program_exercises || [])].sort((a, b) => a.order - b.order)[0];
  if (first?.exercise) {
    navigation.navigate("ExercisePlayer", {
      exercise: first.exercise,
      assignmentId: assignment.id,
      status: assignment.status
    });
    return;
  }
  navigation.navigate("ProgramDetail", { program: assignment.program, assignmentId: assignment.id, status: assignment.status });
}

function NotificationBell({ onPress }: { onPress: () => void }) {
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .listNotifications()
        .then((items) => {
          if (active) setUnread(items.filter((item) => !item.read_at).length);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Pressable onPress={onPress} style={styles.bell}>
      <Ionicons name="notifications-outline" size={20} color={colors.text} />
      {unread > 0 ? (
        <View style={styles.bellCount}>
          <Text style={styles.bellCountText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function NewsStrip({ items, onOpen }: { items: Announcement[]; onOpen: (item: Announcement) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsStrip}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onOpen(item)} style={styles.newsCard}>
          <Text style={styles.newsKind}>{item.kind}</Text>
          <Text style={styles.newsTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.newsBody} numberOfLines={2}>
            {item.body}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing(2.5), gap: spacing(1) },
  linkCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2), borderColor: colors.primary },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginBottom: spacing(2) },
  todayHead: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  feelCard: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  link: { color: colors.primary, fontWeight: "700" },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center"
  },
  bellCount: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  bellCountText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  newsStrip: { gap: spacing(1.25), paddingBottom: spacing(2) },
  newsCard: {
    width: 230,
    padding: spacing(2),
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  newsKind: { color: colors.primary, fontSize: 11, fontWeight: "900", marginBottom: 8 },
  newsTitle: { ...T.h2, fontSize: 16 },
  newsBody: { ...T.muted, marginTop: 8, lineHeight: 18 }
});
