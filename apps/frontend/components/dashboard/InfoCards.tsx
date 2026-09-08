import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

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
  updatedLabel?: string | null;
};

export function MarketPreviewCard({
  items,
  onViewReport,
  updatedLabel,
}: MarketPreviewCardProps) {
  const { theme } = useTheme(); const { colors } = theme;
  return (
    <View style={[styles.marketCard,{backgroundColor:colors.surface,borderColor:colors.border},theme.shadows.soft]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardHeaderIcon,{backgroundColor:colors.marketSoft}]}>
          <MaterialCommunityIcons
            name="chart-line"
            size={20}
            color={colors.market}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle,{color:colors.text}]}>Today’s top prices</Text>
          <Text style={[styles.cardSubtitle,{color:colors.textMuted}]}>{updatedLabel ? `HARTI bulletin · ${updatedLabel}` : "Live HARTI bulletin"}</Text>
        </View>
        <View style={[styles.liveChip,{backgroundColor:colors.successSoft}]}><View style={[styles.liveDot,{backgroundColor:colors.success}]}/><Text style={[styles.liveText,{color:colors.success}]}>LIVE</Text></View>
      </View>

      <View style={styles.marketList}>
        {items.map((item,index) => (
          <View key={item.crop} style={[styles.marketRow,{backgroundColor:colors.background,borderColor:colors.border}]}>
            <View style={styles.marketCropWrap}>
              <View style={[styles.rank,{backgroundColor:index===0?colors.marketSoft:colors.primarySoft}]}><Text style={[styles.rankText,{color:index===0?colors.market:colors.primary}]}>#{index+1}</Text></View>
              <Text numberOfLines={2} style={[styles.marketCrop,{color:colors.text}]}>{item.crop}</Text>
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.marketPrice,{color:colors.primary}]}>{item.price}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.viewReportButton,{backgroundColor:colors.primary}]}
        onPress={onViewReport}
        activeOpacity={0.85}
      >
        <Text style={styles.viewReportText}>View Full Market Report</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={colors.primaryContrast}
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
  const { colors } = useTheme().theme;
  const tone = { ...severityStyles[severity], bg: severity === "success" ? colors.success : severity === "warning" ? colors.warning : colors.danger };
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
  const { colors } = useTheme().theme;
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{actionLabel}</Text>
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
  const { theme } = useTheme(); const { colors } = theme;
  return (
    <View style={styles.farmSummaryCard}>
      {tiles.map((tile) => (
        <View key={tile.label} style={[styles.farmTile,{backgroundColor:colors.surface,borderColor:colors.border},theme.shadows.soft]}>
          <View style={[styles.farmIconWrap,{backgroundColor:colors.primarySoft}]}>
            <MaterialCommunityIcons
              name={tile.icon}
              size={16}
              color={colors.primary}
            />
          </View>
          <View style={styles.farmTileText}>
            <Text style={[styles.farmTileValue,{color:colors.text}]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {tile.value}
            </Text>
            <Text style={[styles.farmTileLabel,{color:colors.textMuted}]} numberOfLines={2}>{tile.label}</Text>
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
    borderWidth: 1,
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
  },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 }, liveText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
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
    borderWidth: 1,
  },
  marketCropWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
    flex: 1,
    minWidth: 0,
  },
  cropDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardColors.primary,
  },
  rank: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, fontWeight: "900" },
  marketCrop: {
    fontSize: 14,
    fontWeight: "700",
    color: dashboardColors.text,
    flex: 1,
  },
  marketPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: dashboardColors.primary,
    marginLeft: dashboardSpacing.sm,
    textAlign: "right",
    maxWidth: "48%",
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
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.md,
    padding: dashboardSpacing.md,
    minHeight: 78,
    borderWidth: 1,
    ...dashboardShadow.soft,
  },
  farmIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  farmTileText: {
    flex: 1,
  },
  farmTileValue: {
    fontSize: 15,
    fontWeight: "800",
    color: dashboardColors.text,
  },
  farmTileLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: dashboardColors.textMuted,
    textTransform: "uppercase",
    lineHeight: 13,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
