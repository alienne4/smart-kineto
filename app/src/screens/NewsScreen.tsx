import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { api } from "../api/client";
import { NewsCard } from "../components/NewsCarousel";
import { EmptyState, Loading, Notice } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { colors, spacing } from "../theme";

export default function NewsScreen({ navigation }: any) {
  const { data, loading, error, reload } = useApi(() => api.getFeed());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {loading && <Loading />}
      {error && <Notice text={error} tone="error" />}
      {!loading && data?.length === 0 && <EmptyState icon="newspaper-outline" title="Nothing here yet" subtitle="News and events will appear here." />}
      {data?.map((item) => (
        <View key={item.id} style={{ marginBottom: spacing(2) }}>
          <NewsCard item={item} width={undefined as any} onPress={() => navigation.navigate("NewsDetail", { item })} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
});
