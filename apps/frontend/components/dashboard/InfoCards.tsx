import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  dashboardColors,
  dashboardRadius,
  dashboardShadow,
  dashboardSpacing,
} from "./theme";

/* ------------------------------------------------------------------ */
/* MarketPreviewCard                                                   */
/* ------------------------------------------------------------------ */

export type MarketPreviewItem = {
  crop: string;
  price: string;
};

type MarketPreviewCardProps = {
  items: MarketPreviewItem[];
  onViewReport: () => void;
};

export function MarketPreviewCard({
  items,
  onViewReport,
}: MarketPreviewCardProps) {
  return (
    <View style={styles.marketCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <MaterialCommunityIcons
            name="currency-usd"
            size={18}
            color={dashboardColors.primary}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Today’s Top Prices</Text>
          <Text style={styles.cardSubtitle}>Live from HARTI bulletin</Text>
        </View>
      </View>

      <View style={styles.marketList}>
        {items.map((item) => (
          <View key={item.crop} style={styles.marketRow}>
            <View style={styles.marketCropWrap}>
              <View style={styles.cropDot} />
              <Text style={styles.marketCrop}>{item.crop}</Text>
            </View>
            <Text style={styles.marketPrice}>{item.price}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewReportButton}
        onPress={onViewReport}
        activeOpacity={0.85}
      >
        <Text style={styles.viewReportText}>View Full Market Report</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={dashboardColors.white}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* AlertCard — severity: green / yellow / red                          */
/* ------------------------------------------------------------------ */

type AlertCardProps = {
  title: string;
  message: string;
  severity: "success" | "warning" | "danger";
};

const severityStyles = {
  success: {
    bg: dashboardColors.primary,
    icon: "check-decagram" as const,
  },
  warning: {
    bg: dashboardColors.warning,
    icon: "alert" as const,
  },
  danger: {
    bg: dashboardColors.danger,
    icon: "alert-octagon" as const,
  },
};

export function AlertCard({ title, message, severity }: AlertCardProps) {
  const tone = severityStyles[severity];
  return (
    <View style={[styles.alertCard, { backgroundColor: tone.bg }]}>
      <MaterialCommunityIcons
        name={tone.icon}
        size={24}
        color={dashboardColors.white}
      />
      <View style={styles.alertTextWrap}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertText}>{message}</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* SectionTitle                                                        */
/* ------------------------------------------------------------------ */

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: SectionTitleProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* FarmSummaryCard (dashboard)                                         */
/* ------------------------------------------------------------------ */

type FarmSummaryTile = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

type FarmSummaryCardProps = {
  tiles: FarmSummaryTile[];
};

export function DashboardFarmSummaryCard({ tiles }: FarmSummaryCardProps) {
  return (
    <View style={styles.farmSummaryCard}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.farmTile}>
          <View style={styles.farmIconWrap}>
            <MaterialCommunityIcons
              name={tile.icon}
              size={16}
              color={dashboardColors.primary}
            />
          </View>
          <View style={styles.farmTileText}>
            <Text style={styles.farmTileValue} numberOfLines={1}>
              {tile.value}
            </Text>
            <Text style={styles.farmTileLabel}>{tile.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  marketCard: {
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
    marginBottom: dashboardSpacing.lg,
    ...dashboardShadow.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.md,
    marginBottom: dashboardSpacing.md,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dashboardColors.primary,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: dashboardColors.textMuted,
    marginTop: 1,
  },
  marketList: {
    gap: dashboardSpacing.sm,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: dashboardColors.background,
    borderRadius: dashboardRadius.md,
    paddingHorizontal: dashboardSpacing.md,
    paddingVertical: dashboardSpacing.md,
  },
  marketCropWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
  },
  cropDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardColors.primary,
  },
  marketCrop: {
    fontSize: 14,
    fontWeight: "700",
    color: dashboardColors.text,
  },
  marketPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: dashboardColors.primary,
  },
  viewReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: dashboardSpacing.md,
    backgroundColor: dashboardColors.primary,
    borderRadius: dashboardRadius.md,
    paddingVertical: dashboardSpacing.md,
  },
  viewReportText: {
    color: dashboardColors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: dashboardSpacing.md,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
    marginBottom: dashboardSpacing.lg,
    ...dashboardShadow.card,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: dashboardColors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  alertText: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 4,
    lineHeight: 19,
    fontSize: 13,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dashboardSpacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "800",
    color: dashboardColors.primary,
  },
  farmSummaryCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: dashboardSpacing.sm,
    marginBottom: dashboardSpacing.lg,
  },
  farmTile: {
    flexBasis: "31%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.md,
    padding: dashboardSpacing.md,
    ...dashboardShadow.soft,
  },
  farmIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dashboardColors.primary,
  },
  farmTileText: {
    flex: 1,
  },
  farmTileValue: {
    fontSize: 13,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  farmTileLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: dashboardColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
