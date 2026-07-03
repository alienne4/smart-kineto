import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, ChatMessage } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Ionicons, Loading } from "../../components/ui";
import { colors, mono, spacing, type as T } from "../../theme";

export default function ChatScreen({ route, navigation }: any) {
  const { userId, name } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name || "Chat",
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar name={name} size={30} />
          <Text style={mono(12, colors.text, "semibold")}>{name || "Chat"}</Text>
        </View>
      ),
    });
  }, [navigation, name]);

  async function load(initial = false) {
    try {
      const msgs = await api.listMessages(userId);
      setMessages(msgs);
    } catch {
      // ignore transient errors while polling
    } finally {
      if (initial) setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await api.sendMessage(userId, body);
      setMessages((cur) => [...cur, msg]);
    } catch {
      setText(body);
    } finally {
      setSending(false);
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
          {messages.map((m) => {
            const mine = m.sender === user?.id;
            return (
              <View key={m.id} style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && { color: colors.bg, fontWeight: "600" }]}>{m.body}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]} onPress={send} disabled={!text.trim()}>
          <Ionicons name="chevron-forward" size={20} color={colors.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  messages: { padding: spacing(2), gap: spacing(1) },
  bubbleRow: { flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", paddingVertical: spacing(1.25), paddingHorizontal: spacing(1.75), borderWidth: 1 },
  bubbleMine: { backgroundColor: colors.primary, borderColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  bubbleText: { ...T.body, color: colors.text },
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.25),
    color: colors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
