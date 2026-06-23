import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Announcement, api, Assessment, AuthUser } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCarousel } from "../../components/NewsCarousel";
import { NotificationBell } from "../../components/NotificationBell";
import { Hero, Screen } from "../../components/Screen";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  IconTile,
  Ionicons,
  Loading,
  SectionTitle,
  StatCard,
} from "../../components/ui";
import { colors, gradients, spacing, type as T } from "../../theme";

export default function TrainerHomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }
  const [data, setData] = useState<{
    exercises: number;
    programs: number;
    patients: AuthUser[];
    assessments: Assessment[];
  } | null>(null);
  const [feed, setFeed] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ex, pr, pts, asm, news] = await Promise.all([
        api.listExercises(),
        api.listPrograms(),
        api.listPatients(),
        api.listAssessments(),
        api.getFeed().catch(() => []),
      ]);
      setData({ exercises: ex.length, programs: pr.length, patients: pts, assessments: asm });
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

  const flagged = (data?.assessments || []).filter((a) => a.pain_level >= 7).slice(0, 3);

  return (
    <Screen
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      refreshing={refreshing}
    >
      <Hero
        subtitle="Trainer workspace"
        title={user?.full_name || "Welcome"}
        right={
          <View style={styles.headerActions}>
            <NotificationBell onPress={() => navigation.navigate("Notifications")} />
            <Pressable onPress={confirmLogout} style={styles.logoutBtn} hitSlop={10}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        }
      />

      <View style={styles.body}>
        {loading && !data ? (
          <Loading />
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Exercises" value={data?.exercises ?? 0} icon="barbell-outline" grad={gradients.primary} />
              <StatCard label="Programs" value={data?.programs ?? 0} icon="list-outline" grad={gradients.violet} />
              <StatCard label="Patients" value={data?.patients.length ?? 0} icon="people-outline" grad={gradients.emerald} />
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

            <SectionTitle title="Quick actions" />
            <View style={styles.quickRow}>
              <QuickAction
                icon="add-circle-outline"
                label="New exercise"
                grad={gradients.primary}
                onPress={() => navigation.navigate("Exercises", { screen: "CreateExercise", initial: false })}
              />
              <QuickAction
                icon="duplicate-outline"
                label="New program"
                grad={gradients.violet}
                onPress={() => navigation.navigate("Programs", { screen: "CreateProgram", initial: false })}
              />
            </View>

            {flagged.length > 0 && (
              <>
                <SectionTitle title="Needs attention" />
                {flagged.map((a) => (
                  <Card key={a.id} style={styles.alert}>
                    <Ionicons name="alert-circle" size={22} color={colors.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={T.body}>{a.patient?.full_name || a.patient?.email}</Text>
                      <Text style={T.muted}>
                        Reported high pain ({a.pain_level}/10)
                      </Text>
                    </View>
                  </Card>
                ))}
              </>
            )}

            <SectionTitle
              title="Patients"
              action={
                <Text style={styles.link} onPress={() => navigation.navigate("Patients")}>
                  See all
                </Text>
              }
            />
            {data?.patients.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No patients yet"
                subtitle="Patients link to you from their app, then appear here."
              />
            ) : (
              data?.patients.slice(0, 4).map((p) => (
                <Card
                  key={p.id}
                  style={styles.patientRow}
                  onPress={() => navigation.navigate("Patients", { screen: "PatientDetail", params: { patient: p }, initial: false })}
                >
                  <Avatar name={p.full_name || p.email} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={T.body}>{p.full_name || p.email}</Text>
                    <Text style={T.muted}>{p.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Card>
              ))
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, grad, onPress }: any) {
  return (
    <Card style={styles.quick} onPress={onPress}>
      <IconTile icon={icon} grad={grad} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing(2.5), gap: spacing(1) },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginBottom: spacing(2) },
  quickRow: { flexDirection: "row", gap: spacing(1.5), marginBottom: spacing(1) },
  quick: { flex: 1, alignItems: "flex-start", gap: spacing(1) },
  quickLabel: { ...T.body, fontWeight: "700" },
  alert: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.25) },
  patientRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.25) },
  link: { color: colors.primary, fontWeight: "700" },
});
