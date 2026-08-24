import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import type { FarmPrediction } from "../../lib/prediction-api";
import {
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";

type ResultCardProps = {
  result: FarmPrediction;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function buildInsights(result: FarmPrediction): {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
  tone: "success" | "warning" | "info";
}[] {
  const insights: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    message: string;
    tone: "success" | "warning" | "info";
  }[] = [];

  if (result.production_kg > 1000) {
    insights.push({
      icon: "check-circle",
      message: "High expected yield for your land area.",
      tone: "success",
    });
  }
  if (result.input.rainfall_mm < 150) {
    insights.push({
      icon: "alert",
      message: "Rainfall slightly low — consider supplemental irrigation.",
      tone: "warning",
    });
  } else if (result.input.rainfall_mm > 300) {
    insights.push({
      icon: "alert",
      message: "High rainfall expected — monitor drainage.",
      tone: "warning",
    });
  }
  if (result.input.fertilizer_kg === 0) {
    insights.push({
      icon: "lightbulb-on-outline",
      message: "Consider applying fertilizer to increase yield potential.",
      tone: "info",
    });
  }
  if (result.relative_supply < 1) {
    insights.push({
      icon: "chart-line",
      message: "Market supply is below the median — favorable selling window.",
      tone: "success",
    });
  }

  return insights;
}

export function ResultCard({ result }: ResultCardProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(30);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const insights = buildInsights(result);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      <View style={styles.successBanner}>
        <MaterialCommunityIcons
          name="check-decagram"
          size={18}
          color={predictionColors.white}
        />
        <Text style={styles.successText}>Prediction Complete</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cropBadge}>
          <MaterialCommunityIcons
            name="sprout"
            size={14}
            color={predictionColors.primaryDark}
          />
          <Text style={styles.cropText}>{result.input.crop}</Text>
        </View>

        <Text style={styles.heroLabel}>Estimated Yield</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroValue}>
            {formatNumber(result.production_kg)}
          </Text>
          <Text style={styles.heroUnit}>kg</Text>
        </View>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Estimated Revenue</Text>
          <Text style={styles.revenueValue}>
            Rs {formatNumber(result.revenue_rs)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Price / kg</Text>
            <Text style={styles.metricValue}>
              Rs {formatNumber(result.price_rs_per_kg)}
            </Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Relative Supply</Text>
            <Text style={styles.metricValue}>
              {result.relative_supply.toFixed(3)}×
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {result.input.district} · {result.input.season} ·{" "}
            {result.input.irrigation}
          </Text>
          {result.price_source ? (
            <Text style={styles.modelText}>
              Price source: {result.price_source}
              {result.price_model?.trainedAt
                ? ` · updated ${new Date(result.price_model.trainedAt).toLocaleDateString()}`
                : ""}
            </Text>
          ) : null}
        </View>
      </View>

      {insights.length > 0 ? (
        <View style={styles.insightWrap}>
          <Text style={styles.insightTitle}>Insights</Text>
          {insights.map((insight, index) => {
            const toneColor =
              insight.tone === "success"
                ? predictionColors.success
                : insight.tone === "warning"
                  ? predictionColors.warning
                  : predictionColors.info;
            const toneBg =
              insight.tone === "success"
                ? predictionColors.successSoft
                : insight.tone === "warning"
                  ? predictionColors.warningSoft
                  : predictionColors.infoSoft;
            return (
              <View
                key={index}
                style={[styles.insightRow, { backgroundColor: toneBg }]}
              >
                <MaterialCommunityIcons
                  name={insight.icon}
                  size={16}
                  color={toneColor}
                />
                <Text style={[styles.insightText, { color: toneColor }]}>
                  {insight.message}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: predictionColors.primary,
    borderRadius: predictionRadius.pill,
    paddingVertical: predictionSpacing.sm + 2,
    marginBottom: predictionSpacing.md,
    ...predictionShadow.soft,
  },
  successText: {
    color: predictionColors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  card: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.xl,
    padding: predictionSpacing.xl,
    ...predictionShadow.card,
  },
  cropBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: predictionColors.goldSoft,
    borderRadius: predictionRadius.pill,
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: 5,
    marginBottom: predictionSpacing.md,
  },
  cropText: {
    color: predictionColors.gold,
    fontSize: 13,
    fontWeight: "800",
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 4,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: "900",
    color: predictionColors.primaryDark,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: predictionColors.textMuted,
  },
  revenueCard: {
    backgroundColor: predictionColors.goldSoft,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    marginTop: predictionSpacing.lg,
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: predictionColors.gold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: "900",
    color: predictionColors.gold,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: "row",
    gap: predictionSpacing.md,
    marginTop: predictionSpacing.md,
  },
  metricTile: {
    flex: 1,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: predictionColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "800",
    color: predictionColors.text,
    marginTop: 3,
  },
  metaRow: {
    marginTop: predictionSpacing.md,
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    color: predictionColors.textMuted,
    fontWeight: "600",
  },
  modelText: {
    fontSize: 10,
    color: predictionColors.primaryDark,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  insightWrap: {
    marginTop: predictionSpacing.lg,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: predictionColors.text,
    marginBottom: predictionSpacing.md,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: predictionSpacing.sm,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    marginBottom: predictionSpacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
});
