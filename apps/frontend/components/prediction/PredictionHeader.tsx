import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";

type PredictionHeaderProps = {
  onBackToHome: () => void;
};

export function PredictionHeader({ onBackToHome }: PredictionHeaderProps) {
  return (
    <LinearGradient
      colors={["#16A34A", "#22C55E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHome}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={predictionColors.white}
          />
        </TouchableOpacity>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons
            name="sprout"
            size={26}
            color={predictionColors.primaryDark}
          />
        </View>
      </View>

      <Text style={styles.title}>AI Yield Prediction</Text>
      <Text style={styles.subtitle}>
        Predict your harvest and expected revenue using AI and weather data.
      </Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="weather-partly-cloudy"
            size={13}
            color={predictionColors.white}
          />
          <Text style={styles.badgeText}>Weather Powered</Text>
        </View>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="brain"
            size={13}
            color={predictionColors.white}
          />
          <Text style={styles.badgeText}>AI Trained Model</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: predictionRadius.xl,
    padding: predictionSpacing.xl,
    marginBottom: predictionSpacing.lg,
    ...predictionShadow.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: predictionSpacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: predictionColors.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.92)",
  },
  badgeRow: {
    flexDirection: "row",
    gap: predictionSpacing.sm,
    marginTop: predictionSpacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: predictionRadius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    color: predictionColors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
