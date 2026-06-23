import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, AssistantMessage, AssistantProposal } from "../../api/client";
import { Badge, IconTile, Ionicons, Loading, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, radius, spacing, type as T } from "../../theme";

const STARTERS = [
  "My right knee hurts, about 6/10",
  "Lower back stiffness, want more mobility",
  "Shoulder pain after the gym",
];

export default function AssistantScreen({ navigation }: any) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [accepting, setAccepting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "AI assistant",
      headerRight: () =>
        messages.length > 0 ? (
          <Pressable onPress={reset} hitSlop={10}>
            <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, messages.length]);

  useEffect(() => {
    api.assistantMessages().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function reset() {
    try {
      await api.assistantReset();
    } catch {}
    setMessages([]);
  }

  async function send(body: string) {
    const content = body.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const optimistic: AssistantMessage = {
      id: Date.now(),
      sender: "user",
      content,
      proposal: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const reply = await api.assistantChat(content);
      setMessages((m) => [...m, reply]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, sender: "assistant", content: "Sorry, I couldn't respond. Please try again.", proposal: null, created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function accept(p: AssistantProposal) {
    setAccepting(true);
    try {
      const assignment = await api.assistantAccept(
        p.name,
        p.exercises.map((e) => ({ id: e.id, sets: e.sets, reps: e.reps }))
      );
      navigation.navigate("Programs", {
        screen: "ProgramDetail",
        params: { program: assignment.program, assignmentId: assignment.id, status: assignment.status },
      });
    } catch {
    } finally {
      setAccepting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={[styles.bubbleRow, styles.left]}>
            <View style={[styles.bubble, styles.bubbleTheirs]}>
              <Text style={styles.bubbleText}>
                Hi! I'm your SmartKineto assistant. Tell me what's bothering you — e.g. “My right knee hurts, about 6/10, I want to improve mobility.” This isn't a substitute for medical advice.
              </Text>
            </View>
          </View>

          {messages.map((m) => {
            const mine = m.sender === "user";
            return (
              <View key={m.id}>
                <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && { color: colors.bg }]}>{m.content}</Text>
                  </View>
                </View>
                {m.proposal ? (
                  <ProposalCard p={m.proposal} accepting={accepting} onAccept={() => accept(m.proposal!)} />
                ) : null}
              </View>
            );
          })}

          {sending ? (
            <View style={[styles.bubbleRow, styles.left]}>
              <View style={[styles.bubble, styles.bubbleTheirs]}>
                <Text style={styles.bubbleText}>…</Text>
              </View>
            </View>
          ) : null}

          {messages.length === 0 ? (
            <View style={styles.starters}>
              {STARTERS.map((s) => (
                <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Describe your symptoms…"
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} onPress={() => send(text)} disabled={!text.trim() || sending}>
          <Ionicons name="send" size={18} color={colors.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ProposalCard({ p, accepting, onAccept }: { p: AssistantProposal; accepting: boolean; onAccept: () => void }) {
  return (
    <View style={styles.proposal}>
      <View style={{ flexDirection: "row", gap: spacing(0.75), marginBottom: spacing(1) }}>
        <Badge text="SUGGESTED PLAN" color={colors.accent} />
        {p.pain != null ? <Badge text={`pain ${p.pain}/10`} color={colors.danger} /> : null}
      </View>
      <Text style={[T.h2, { marginBottom: spacing(1) }]}>{p.name}</Text>
      {p.exercises.map((e) => {
        const meta = BODY_PART_META[e.body_part] || BODY_PART_META.OTHER;
        return (
          <View key={e.id} style={styles.exRow}>
            {e.thumbnail ? (
              <Image source={{ uri: e.thumbnail }} style={styles.thumb} />
            ) : (
              <IconTile icon={meta.icon as any} grad={meta.grad} size={42} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={T.body}>{e.title}</Text>
              <Text style={T.muted}>{e.sets} sets × {e.reps} reps</Text>
            </View>
          </View>
        );
      })}
      <View style={{ marginTop: spacing(1.5) }}>
        <PrimaryButton title="Save & start this plan" icon="checkmark-done-outline" onPress={onAccept} loading={accepting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  messages: { padding: spacing(2), gap: spacing(1) },
  bubbleRow: { flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: { maxWidth: "84%", paddingVertical: spacing(1.25), paddingHorizontal: spacing(1.75), borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surfaceHi, borderBottomLeftRadius: 4 },
  bubbleText: { ...T.body, color: colors.text },
  proposal: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(2),
    marginTop: spacing(1),
  },
  exRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.25), marginBottom: spacing(1) },
  thumb: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surfaceHi },
  starters: { gap: spacing(1), marginTop: spacing(2) },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.25),
  },
  chipText: { color: colors.textMuted, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing(1),
    padding: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.25),
    color: colors.text,
    fontSize: 15,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
