import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type LoadingScreenProps = {
  onLoadComplete: () => void;
};

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    const timer = setTimeout(onLoadComplete, 2200);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [onLoadComplete, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />

      <View style={styles.content}>
        <Animated.View
          style={[styles.logoRing, { transform: [{ scale }], opacity }]}
        >
          <MaterialCommunityIcons name="sprout" size={64} color="#F9FAFB" />
        </Animated.View>

        <Text style={styles.title}>Smart Crop Forecasting</Text>
        <Text style={styles.subtitle}>
          Loading your farm intelligence dashboard...
        </Text>

        <View style={styles.loaderRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "#22C55E",
    opacity: 0.18,
    top: -70,
    left: -60,
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#F59E0B",
    opacity: 0.16,
    bottom: -80,
    right: -70,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  loaderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#FBBF24",
  },
});
