import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoadingScreenProps = {
  onLoadComplete: () => void;
};

const LOADING_MESSAGES = [
  "Preparing AI Models...",
  "Loading Weather Data...",
  "Analyzing Soil Conditions...",
  "Connecting to Market Prices...",
  "Optimizing Crop Predictions...",
  "Almost Ready...",
];

const FEATURES = [
  { icon: "brain" as const, label: "Powered by AI" },
  { icon: "weather-partly-cloudy" as const, label: "Real-Time Weather" },
  { icon: "chart-line" as const, label: "Market Intelligence" },
  { icon: "sprout" as const, label: "Crop Prediction" },
];

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const messageFade = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    });

    pulseAnimation.start();
    floatAnimation.start();
    rotateAnimation.start();
    progressAnimation.start();

    const messageTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(messageFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1000);

    const timer = setTimeout(onLoadComplete, 2200);

    return () => {
      pulseAnimation.stop();
      floatAnimation.stop();
      rotateAnimation.stop();
      progressAnimation.stop();
      clearInterval(messageTimer);
      clearTimeout(timer);
    };
  }, [onLoadComplete, pulse, float, rotate, progress, messageFade]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.06],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  const floatTranslate = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const rotateDeg = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-4deg", "4deg"],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const blobOneY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const blobTwoY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#0F7A3A", "#0F172A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated glowing blobs */}
      <Animated.View
        style={[styles.blobOne, { transform: [{ translateY: blobOneY }] }]}
      />
      <Animated.View
        style={[styles.blobTwo, { transform: [{ translateY: blobTwoY }] }]}
      />
      <View style={styles.blobThree} />

      {/* Floating particles */}
      <View style={[styles.particle, styles.particleOne]} />
      <View style={[styles.particle, styles.particleTwo]} />
      <View style={[styles.particle, styles.particleThree]} />
      <View style={[styles.particle, styles.particleFour]} />

      <View style={styles.content}>
        {/* Logo section */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              transform: [
                { translateY: floatTranslate },
                { scale },
                { rotate: rotateDeg },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
          <View style={styles.logoCard}><Image source={require("../../assets/images/agrilanka-logo.png")} style={styles.brandLogo} resizeMode="contain" accessibilityLabel="AgriLanka logo" /></View>
        </Animated.View>

        {/* App name */}
        <Text style={styles.title}>AgriLanka</Text>
        <Text style={styles.subtitle}>Smart farming · Stronger harvests</Text>

        {/* Loading message */}
        <Animated.View style={[styles.messageWrap, { opacity: messageFade }]}>
          <Text style={styles.messageText}>
            {LOADING_MESSAGES[messageIndex]}
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>

      {/* Bottom features */}
      <View style={styles.featuresRow}>
        {FEATURES.map((feature) => (
          <View key={feature.label} style={styles.featureChip}>
            <MaterialCommunityIcons
              name={feature.icon}
              size={13}
              color="#FBBF24"
            />
            <Text style={styles.featureText}>{feature.label}</Text>
          </View>
        ))}
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
  blobOne: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#16A34A",
    opacity: 0.16,
    top: -80,
    left: -90,
  },
  blobTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#22C55E",
    opacity: 0.14,
    bottom: -100,
    right: -80,
  },
  blobThree: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FBBF24",
    opacity: 0.08,
    top: 140,
    right: 20,
  },
  particle: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  particleOne: {
    width: 5,
    height: 5,
    top: "22%",
    left: "18%",
  },
  particleTwo: {
    width: 3,
    height: 3,
    top: "30%",
    right: "22%",
  },
  particleThree: {
    width: 4,
    height: 4,
    bottom: "28%",
    left: "26%",
  },
  particleFour: {
    width: 3,
    height: 3,
    bottom: "20%",
    right: "30%",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#22C55E",
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brandLogo: { width: 110, height: 110 },
  leafBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  messageWrap: {
    marginTop: 28,
    minHeight: 22,
  },
  messageText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  progressTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FBBF24",
  },
  featuresRow: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700",
  },
});
