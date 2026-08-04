import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import {
    dashboardColors,
    dashboardRadius,
    dashboardShadow,
    dashboardSpacing,
} from "./theme";

export type PredictionItem = {
  crop: string;
  confidence: string;
  status: string;
  accent: string;
  yieldValue?: string;
};

type PredictionCarouselProps = {
  items: PredictionItem[];
};

function confidencePercent(confidence: string): number {
  const parsed = parseInt(confidence.replace("%", ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function PredictionCarousel({ items }: PredictionCarouselProps) {
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.crop}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const percent = confidencePercent(item.confidence);
        return (
          <View style={styles.card}>
            <View style={styles.header}>
              <View
                style={[
                  styles.cropIcon,
                  { backgroundColor: item.accent + "1A" },
                ]}
              >
                <MaterialCommunityIcons
                  name="sprout"
                  size={18}
                  color={item.accent}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.crop}>{item.crop}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.confidence}>{item.confidence}</Text>
            <Text style={styles.confidenceLabel}>Confidence</Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percent}%`, backgroundColor: item.accent },
                ]}
              />
            </View>

            {item.yieldValue ? (
              <Text style={styles.yieldText}>Expected: {item.yieldValue}</Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: dashboardSpacing.md,
    paddingBottom: dashboardSpacing.sm,
  },
  card: {
    width: 170,
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
    ...dashboardShadow.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
  },
  cropIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  crop: {
    fontSize: 14,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  status: {
    fontSize: 10,
    color: dashboardColors.textMuted,
    fontWeight: "600",
  },
  confidence: {
    fontSize: 26,
    fontWeight: "900",
    color: dashboardColors.text,
    marginTop: dashboardSpacing.md,
  },
  confidenceLabel: {
    fontSize: 10,
    color: dashboardColors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: dashboardColors.border,
    marginTop: dashboardSpacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  yieldText: {
    marginTop: dashboardSpacing.md,
    fontSize: 11,
    color: dashboardColors.textSecondary,
    fontWeight: "600",
  },
});
