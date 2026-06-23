import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../../api/client";
import { Card, Field, PrimaryButton, Scale } from "../../components/ui";
import { colors, spacing, type as T } from "../../theme";

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.q}>How much pain today?</Text>
        <Text style={[T.muted, { marginBottom: spacing(1.5) }]}>0 = none · 10 = severe</Text>
        <Scale value={pain} onChange={setPain} tint={colors.danger} />
      </Card>

      <Card style={{ marginTop: spacing(2) }}>
        <Text style={styles.q}>How mobile do you feel?</Text>
        <Text style={[T.muted, { marginBottom: spacing(1.5) }]}>0 = stiff · 10 = full range</Text>
        <Scale value={mobility} onChange={setMobility} tint={colors.success} />
      </Card>

      <View style={{ height: spacing(2) }} />
      <Field
        label="NOTES (OPTIONAL)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything your trainer should know…"
        multiline
        style={{ minHeight: 90, textAlignVertical: "top" }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Save check-in" icon="checkmark-outline" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  q: { ...T.h2 },
  error: { color: colors.danger, marginBottom: spacing(1.5) },
});
