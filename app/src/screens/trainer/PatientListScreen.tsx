import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../../api/client";
import { Avatar, Card, EmptyState, Ionicons, Loading, Notice, PrimaryButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { colors, spacing, type as T } from "../../theme";

export default function PatientListScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.listPatients());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton title="Find & add patients" icon="search-outline" onPress={() => navigation.navigate("FindPatients")} />
      <View style={{ height: spacing(2) }} />
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && (
        <EmptyState icon="people-outline" title="No patients yet" subtitle="Use “Find & add patients” to search and add patients to your roster." />
      )}
      {data?.map((pt) => (
        <Card key={pt.id} style={styles.row} onPress={() => navigation.navigate("PatientDetail", { patient: pt })}>
          <Avatar name={pt.full_name || pt.email} />
          <View style={{ flex: 1 }}>
            <Text style={T.body}>{pt.full_name || pt.email}</Text>
            <Text style={T.muted}>{pt.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
});
