import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { Field, PrimaryButton, Scale } from "../../components/ui";
import { body, disp, light, mono, spacing } from "../../theme";

export default function AssessmentScreen({ navigation }: any) {
  const [pain, setPain] = useState(3);
  const [mobility, setMobility] = useState(7);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await api.createAssessment({ pain_level: pain, mobility_score: mobility, notes: notes.trim() });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save check-in");
    } finally {
      setSaving(false);
    }
  }

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={disp(38, light.text, { marginBottom: 6 })}>
        NEW{"\n"}
        <Text style={{ color: light.accentText }}>CHECK-IN</Text>
      </Text>
      <Text style={[body(13, light.muted), { marginBottom: spacing(2.5) }]}>{dateStr} · Log pain & mobility</Text>

      <View style={styles.section}>
        <Text style={mono(9, light.muted, "semibold", { letterSpacing: 1, marginBottom: 8 })}>PAIN TODAY (0–10)</Text>
        <Scale value={pain} onChange={setPain} tint={light.danger} palette={light} />
      </View>

      <View style={styles.section}>
        <Text style={mono(9, light.muted, "semibold", { letterSpacing: 1, marginBottom: 8 })}>MOBILITY SCORE (0–10)</Text>
        <Scale value={mobility} onChange={setMobility} tint={light.ok} palette={light} />
      </View>

      <Field
        label="NOTES (OPTIONAL)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything your trainer should know…"
        multiline
        style={{ minHeight: 90, textAlignVertical: "top" }}
        palette={light}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Save check-in" icon="checkmark-outline" onPress={submit} loading={saving} palette={light} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: light.bg },
  content: { padding: spacing(2.5) },
  section: { marginBottom: spacing(2.5) },
  error: { color: light.danger, marginBottom: spacing(1.5) },
});
