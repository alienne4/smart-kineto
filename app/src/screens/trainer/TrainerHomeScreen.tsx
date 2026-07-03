import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Announcement, api, Assessment, AuthUser } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { NewsCarousel } from "../../components/NewsCarousel";
import { NotificationBell } from "../../components/NotificationBell";
import { Screen } from "../../components/Screen";
import {
  Avatar,
  Cross,
  EmptyState,
  Ionicons,
  Loading,
  SectionTitle,
  SLabel,
  StatCard,
} from "../../components/ui";
import { body, colors, disp, mono, spacing } from "../../theme";

export default function TrainerHomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

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
      <LinearGradient
        colors={[colors.surface, colors.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing(2.5) }]}
      >
        <View style={styles.crossMark}>
          <Cross size={12} color={colors.primary} />
        </View>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={mono(9, colors.textMuted, "semibold", { letterSpacing: 1, marginBottom: 6 })}>TRAINER WORKSPACE</Text>
            <Text style={disp(30, colors.text)}>{user?.full_name || "Welcome"}</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell onPress={() => navigation.navigate("Notifications")} />
            <Pressable onPress={confirmLogout} style={styles.logoutBtn} hitSlop={10}>
              <Ionicons name="log-out-outline" size={19} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading && !data ? (
          <Loading />
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Exercises" value={data?.exercises ?? 0} icon="barbell-outline" />
              <StatCard label="Programs" value={data?.programs ?? 0} icon="list-outline" />
              <StatCard label="Patients" value={data?.patients.length ?? 0} icon="people-outline" />
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

            {flagged.length > 0 && (
              <View style={styles.alertBox}>
                <Ionicons name="alert-triangle" size={16} color={colors.warning} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={mono(10, colors.warning, "bold", { letterSpacing: 0.6 })}>
                    {flagged.length} PATIENT{flagged.length > 1 ? "S" : ""} NEED ATTENTION
                  </Text>
                  {flagged.map((a) => (
                    <Text key={a.id} style={body(13, colors.textMuted)}>
                      {a.patient?.full_name || a.patient?.email} — reported high pain ({a.pain_level}/10)
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <SLabel n="01" label="Quick actions" />
            <View style={styles.quickGrid}>
              <QuickAction
                icon="add-circle-outline"
                label="New exercise"
                desc="Create & upload video"
                onPress={() => navigation.navigate("Exercises", { screen: "CreateExercise", initial: false })}
              />
              <QuickAction
                icon="duplicate-outline"
                label="New program"
                desc="Assign exercises"
                onPress={() => navigation.navigate("Programs", { screen: "CreateProgram", initial: false })}
              />
            </View>

            <Pressable onPress={() => navigation.navigate("Patients")}>
              <SLabel n="02" label="Patients" right="SEE ALL" />
            </Pressable>
            {data?.patients.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No patients yet"
                subtitle="Patients link to you from their app, then appear here."
              />
            ) : (
              <View style={styles.rowsWrap}>
                {data?.patients.slice(0, 4).map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.patientRow}
                    onPress={() => navigation.navigate("Patients", { screen: "PatientDetail", params: { patient: p }, initial: false })}
                  >
                    <Avatar name={p.full_name || p.email} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={body(13, colors.text, "medium")}>{p.full_name || p.email}</Text>
                      <Text style={mono(9, colors.textMuted)}>{p.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, desc, onPress }: any) {
  return (
    <Pressable style={styles.quickCell} onPress={onPress}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ marginBottom: 8 }} />
      <Text style={mono(11, colors.text, "bold", { marginBottom: 3 })}>{label.toUpperCase()}</Text>
      <Text style={body(12, colors.textMuted)}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  crossMark: { position: "absolute", top: 12, left: 12 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  logoutBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing(2.5), gap: spacing(1) },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginBottom: spacing(2) },
  alertBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: `${colors.warning}4D`,
    backgroundColor: `${colors.warning}14`,
    padding: spacing(1.75),
    marginBottom: spacing(2),
  },
  quickGrid: { flexDirection: "row", gap: 1, backgroundColor: colors.border, marginTop: spacing(1), marginBottom: spacing(2) },
  quickCell: { flex: 1, backgroundColor: colors.bg, padding: spacing(1.75) },
  rowsWrap: { gap: 1, backgroundColor: colors.border, marginTop: spacing(1) },
  patientRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), backgroundColor: colors.bg, padding: spacing(1.75) },
  link: { color: colors.primary, fontWeight: "700" },
});
