import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../auth/AuthContext";
import { Avatar, Card, Icon, PrimaryButton, SLabel } from "../../components/ui";
import { body, disp, light, mono, spacing } from "../../theme";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={disp(22, light.text, { marginBottom: spacing(2.5) })}>PROFILE</Text>

      <View style={styles.head}>
        <Avatar name={user?.full_name || user?.email} size={72} palette={light} />
        <Text style={disp(22, light.text, { marginTop: spacing(1.5) })}>{user?.full_name}</Text>
        <Text style={body(14, light.muted)}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={mono(9, light.ok, "bold")}>{(user?.role || "PATIENT").toUpperCase()}</Text>
        </View>
      </View>

      <SLabel n="01" label="My trainer" palette={light} />
      <Card style={styles.row} onPress={() => navigation.navigate("PickTrainer")} palette={light}>
        <Icon name="person-outline" size={22} color={light.accentText} />
        <View style={{ flex: 1 }}>
          <Text style={body(14, light.text, "semibold")}>{user?.trainer ? user.trainer.full_name : "Not linked"}</Text>
          <Text style={mono(9, light.muted)}>{user?.trainer ? "PHYSIOTHERAPIST · LINKED" : "TAP TO CHOOSE"}</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={light.muted} />
      </Card>

      <View style={{ height: spacing(1.5) }} />
      <SLabel n="02" label="Account settings" palette={light} />
      <Card style={styles.row} palette={light}>
        <Icon name="shield-checkmark-outline" size={22} color={light.accentText} />
        <View style={{ flex: 1 }}>
          <Text style={body(14, light.text)}>Role</Text>
          <Text style={mono(11, light.accentText, "bold")}>{user?.role === "TRAINER" ? "Trainer" : "Patient"}</Text>
        </View>
      </Card>

      <View style={{ height: spacing(3) }} />
      <PrimaryButton title="Log out" variant="danger" icon="log-out-outline" onPress={logout} palette={light} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: light.bg },
  content: { padding: spacing(2.5) },
  head: { alignItems: "center", marginBottom: spacing(3) },
  roleBadge: { borderWidth: 1, borderColor: light.ok, paddingHorizontal: 10, paddingVertical: 3, marginTop: spacing(1) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
});
