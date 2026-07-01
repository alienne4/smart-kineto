import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api, Assessment, Exercise, TrainingProgram, User } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Hero, Screen } from "../../components/Screen";
import { Avatar, Card, EmptyState, IconTile, Loading, PrimaryButton, SectionTitle, StatCard } from "../../components/ui";
import { gradients, spacing, type as T } from "../../theme";

export default function TrainerHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const load = useCallback(async () => {
    try {
      const [exerciseList, programList, patientList, assessmentList] = await Promise.all([
        api.listExercises().catch(() => [] as Exercise[]),
        api.listPrograms().catch(() => [] as TrainingProgram[]),
        api.listPatients().catch(() => [] as User[]),
        api.listAssessments().catch(() => [] as Assessment[])
      ]);
      setExercises(exerciseList);
      setPrograms(programList);
      setPatients(patientList);
      setAssessments(assessmentList);
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

  const flagged = assessments.filter((assessment) => assessment.pain_level >= 7).slice(0, 3);

  return (
    <Screen
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      refreshing={refreshing}
    >
      <Hero subtitle="Trainer workspace" title={user?.full_name || "Dashboard"} name={user?.full_name || user?.email} />
      <View style={styles.body}>
        {loading ? (
          <Loading />
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Exercises" value={exercises.length} icon="barbell-outline" grad={gradients.primary} />
              <StatCard label="Programs" value={programs.length} icon="list-outline" grad={gradients.violet} />
              <StatCard label="Patients" value={patients.length} icon="people-outline" grad={gradients.emerald} />
            </View>

            <SectionTitle title="Quick actions" />
            <View style={styles.actions}>
              <PrimaryButton title="New exercise" icon="add" onPress={() => navigation.navigate("Exercises")} />
              <PrimaryButton title="New program" icon="add-circle-outline" variant="ghost" onPress={() => navigation.navigate("Programs")} />
            </View>

            {flagged.length > 0 ? (
              <>
                <SectionTitle title="Needs attention" />
                {flagged.map((assessment) => (
                  <Card key={assessment.id} style={styles.attention}>
                    <IconTile icon="alert-circle-outline" grad={gradients.rose} />
                    <View style={{ flex: 1 }}>
                      <Text style={T.body}>High pain reported</Text>
                      <Text style={T.muted}>Pain {assessment.pain_level}/10</Text>
                    </View>
                  </Card>
                ))}
              </>
            ) : null}

            <SectionTitle title="Patients" />
            {patients.length === 0 ? (
              <EmptyState icon="people-outline" title="No patients yet" subtitle="Add patients from the Patients tab." />
            ) : (
              patients.slice(0, 5).map((patient) => (
                <Card key={patient.id} style={styles.patient} onPress={() => navigation.navigate("Patients")}>
                  <Avatar name={patient.full_name || patient.email} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={T.body}>{patient.full_name || patient.email}</Text>
                    <Text style={T.muted}>{patient.email}</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing(2.5), gap: spacing(1) },
  statsRow: { flexDirection: "row", gap: spacing(1.25), marginBottom: spacing(2) },
  actions: { gap: spacing(1.25), marginBottom: spacing(2) },
  attention: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1) },
  patient: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1) }
});
