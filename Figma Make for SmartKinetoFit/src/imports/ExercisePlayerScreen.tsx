import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Exercise } from "../../api/client";
import { Badge, EmptyState, IconTile, PrimaryButton } from "../../components/ui";
import { BODY_PART_META, colors, DIFFICULTY_META, radius, spacing, type as T } from "../../theme";

export default function ExercisePlayerScreen({ route }: any) {
  const exercise: Exercise = route.params.exercise;
  const meta = BODY_PART_META[exercise.body_part] || BODY_PART_META.OTHER;
  const diff = DIFFICULTY_META[exercise.difficulty] || DIFFICULTY_META.EASY;

  const player = useVideoPlayer(exercise.video ?? null, (p) => {
    p.loop = true;
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {exercise.video ? (
        <VideoView player={player} style={styles.video} nativeControls allowsFullscreen contentFit="contain" />
      ) : exercise.thumbnail ? (
        <Image source={{ uri: exercise.thumbnail }} style={styles.video} resizeMode="cover" />
      ) : (
        <EmptyState icon="videocam-off-outline" title="No demo video" subtitle="Follow the written instructions below." />
      )}

      <View style={styles.head}>
        {exercise.thumbnail ? (
          <Image source={{ uri: exercise.thumbnail }} style={styles.thumbSmall} />
        ) : (
          <IconTile icon={meta.icon as any} grad={meta.grad} size={50} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={T.h1}>{exercise.title}</Text>
          <View style={styles.badges}>
            <Badge text={meta.label} />
            <Badge text={diff.label} color={diff.color} />
          </View>
        </View>
      </View>

      {exercise.video ? (
        <PrimaryButton
          title={isPlaying ? "Pause" : "Play"}
          icon={isPlaying ? "pause" : "play"}
          onPress={() => (isPlaying ? player.pause() : player.play())}
        />
      ) : null}

      {exercise.description ? (
        <>
          <Text style={styles.label}>INSTRUCTIONS</Text>
          <Text style={styles.desc}>{exercise.description}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5) },
  video: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", borderRadius: radius.md, marginBottom: spacing(2) },
  thumbSmall: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.surfaceHi },
  head: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(2) },
  badges: { flexDirection: "row", gap: spacing(0.75), marginTop: spacing(1) },
  label: { ...T.label, marginTop: spacing(3), marginBottom: spacing(0.5) },
  desc: { ...T.body, lineHeight: 22 },
});
