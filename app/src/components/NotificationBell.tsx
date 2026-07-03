import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api/client";
import { colors, mono } from "../theme";
import { Icon } from "./ui";

export function NotificationBell({ onPress }: { onPress: () => void }) {
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .listNotifications()
        .then((list) => {
          if (active) setUnread(list.filter((n) => !n.read_at).length);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Pressable onPress={onPress} style={styles.bell} hitSlop={10}>
      <Icon name="notifications" size={20} color={colors.text} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={mono(9, colors.bg, "bold")}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.bg,
  },
});
