import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { radius, spacing } from "./theme";

function SkeletonBlock({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

export function LoadingSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock style={styles.hero} />
      <View style={styles.row}>
        <SkeletonBlock style={styles.tile} />
        <SkeletonBlock style={styles.tile} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock style={styles.tile} />
        <SkeletonBlock style={styles.tile} />
      </View>
      <SkeletonBlock style={styles.card} />
      <SkeletonBlock style={styles.card} />
      <SkeletonBlock style={styles.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  block: {
    backgroundColor: "#E5E7EB",
    borderRadius: radius.md,
  },
  hero: {
    height: 120,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    height: 90,
    borderRadius: radius.lg,
  },
  card: {
    height: 72,
    borderRadius: radius.lg,
  },
});
