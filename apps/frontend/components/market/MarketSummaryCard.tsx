import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "./theme";

type MarketSummaryCardProps = {
  marketName: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  averageToday: number | null;
  averagePrevious: number | null;
  change: number | null;
  updatedLabel: string | null;
};

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function MarketSummaryCard({
  marketName,
  rangeLow,
  rangeHigh,
  averageToday,
  averagePrevious,
  change,
  updatedLabel,
}: MarketSummaryCardProps) {
  const hasChange = change !== null && !Number.isNaN(change);
  const isUp = hasChange && change > 0;
  const isDown = hasChange && change < 0;
  const changeColor = isUp
    ? colors.success
    : isDown
      ? colors.danger
      : colors.textMuted;
  const changeBg = isUp
    ? colors.successSoft
    : isDown
      ? colors.dangerSoft
      : "#F3F4F6";
  const changeIcon = isUp ? "trending-up" : isDown ? "trending-down" : "minus";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.marketIcon}>
          <MaterialCommunityIcons
            name="storefront"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.marketNameWrap}>
          <Text style={styles.marketName}>{marketName}</Text>
          <Text style={styles.marketLabel}>Wholesale Market</Text>
        </View>
        <View style={[styles.changeChip, { backgroundColor: changeBg }]}>
          <MaterialCommunityIcons
            name={changeIcon}
            size={14}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {hasChange ? `${change > 0 ? "+" : ""}${change.toFixed(2)}` : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.stat, styles.statLeft]}>
          <Text style={styles.statLabel}>Range</Text>
          <Text style={styles.statValue}>
            {formatNumber(rangeLow)} – {formatNumber(rangeHigh)}
          </Text>
          <Text style={styles.statCaption}>Rs / kg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Average Today</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatNumber(averageToday)}
          </Text>
          <Text style={styles.statCaption}>Rs / kg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.stat, styles.statRight]}>
          <Text style={styles.statLabel}>Previous</Text>
          <Text style={styles.statValue}>{formatNumber(averagePrevious)}</Text>
          <Text style={styles.statCaption}>Rs / kg</Text>
        </View>
      </View>

      <View style={styles.updatedRow}>
        <MaterialCommunityIcons
          name="calendar-check"
          size={13}
          color={colors.textMuted}
        />
        <Text style={styles.updatedText}>
          {updatedLabel ?? "Updated Today"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  marketIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  marketNameWrap: {
    flex: 1,
  },
  marketName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  marketLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  changeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  statLeft: {
    flex: 1.3,
  },
  statRight: {
    flex: 1.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  statCaption: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.lg,
  },
  updatedText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
