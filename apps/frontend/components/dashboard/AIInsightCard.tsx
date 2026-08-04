import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { ProfileData } from "../screens/profile-types";
import {
  dashboardColors,
  dashboardRadius,
  dashboardShadow,
  dashboardSpacing,
} from "./theme";

type AIInsightCardProps = {
  profile?: ProfileData | null;
  onLearnMore: () => void;
};

function buildInsight(profile?: ProfileData | null): string {
  if (!profile) {
    return "Based on your region, paddy cultivation is well supported this season.";
  }
  if (profile.role === "farmer") {
    const land =
      profile.totalLandArea != null
        ? `${profile.totalLandArea} ha`
        : "your farm";
    const area = profile.region;
    const irrigation = profile.hasIrrigation ? "irrigated" : "rainfed";
    return `🌱 Based on your ${land} ${irrigation} farm in ${area}, paddy cultivation is recommended this week.`;
  }
  const crop = profile.preferredCrop ?? "your preferred crop";
  const area = profile.region;
  return `📈 ${crop} demand is increasing in ${area}. Consider placing purchase requests today.`;
}

export function AIInsightCard({ profile, onLearnMore }: AIInsightCardProps) {
  const message = buildInsight(profile);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={16}
            color={dashboardColors.white}
          />
        </View>
        <Text style={styles.title}>AI Insight</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.learnMore}
        onPress={onLearnMore}
        activeOpacity={0.8}
      >
        <Text style={styles.learnMoreText}>Learn More</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={dashboardColors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
    marginBottom: dashboardSpacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: dashboardColors.primary,
    ...dashboardShadow.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
    marginBottom: dashboardSpacing.sm,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dashboardColors.primary,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: dashboardColors.textSecondary,
  },
  learnMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: dashboardSpacing.md,
    alignSelf: "flex-start",
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: "800",
    color: dashboardColors.primary,
  },
});
