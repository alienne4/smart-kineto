import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../auth/AuthContext";
import { Avatar, Card, Ionicons, PrimaryButton } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Avatar name={user?.full_name || user?.email} size={72} />
        <Text style={[T.h1, { marginTop: spacing(1.5) }]}>{user?.full_name}</Text>
        <Text style={T.muted}>{user?.email}</Text>
      </View>

      <Card style={styles.row} onPress={() => navigation.navigate("PickTrainer")}>
        <Ionicons name="person-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={T.body}>My trainer</Text>
          <Text style={T.muted}>{user?.trainer ? user.trainer.full_name : "Not linked — tap to choose"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Card>

      <Card style={styles.row}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={T.body}>Role</Text>
          <Text style={T.muted}>Patient</Text>
        </View>
      </Card>

      <View style={{ height: spacing(3) }} />
      <PrimaryButton title="Log out" variant="danger" icon="log-out-outline" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  head: { alignItems: "center", marginBottom: spacing(3) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
});
