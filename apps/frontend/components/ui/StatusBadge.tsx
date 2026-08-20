/**
 * StatusBadge — Reusable semantic status pill (success/danger/warning/info/
 * neutral). Theme-aware via useTheme().
 */
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AppColors } from "../../theme/theme";

export type BadgeTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "recommendation"
  | "marketUp"
  | "marketDown";

type Props = {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

function toneFor(colors: AppColors, tone: BadgeTone) {
  switch (tone) {
    case "danger":
      return { bg: colors.dangerSoft, fg: colors.danger };
    case "warning":
      return { bg: colors.warningSoft, fg: colors.warning };
    case "info":
      return { bg: colors.infoSoft, fg: colors.info };
    case "recommendation":
      return { bg: colors.recommendationSoft, fg: colors.recommendation };
    case "marketUp":
      return { bg: colors.marketUpSoft, fg: colors.marketUp };
    case "marketDown":
      return { bg: colors.marketDownSoft, fg: colors.marketDown };
    case "neutral":
      return { bg: colors.backgroundAlt, fg: colors.textSecondary };
    case "success":
    default:
      return { bg: colors.successSoft, fg: colors.success };
  }
}

export function StatusBadge({ label, tone = "success", icon, style }: Props) {
  const { theme } = useTheme();
  const { colors, radius } = theme;
  const t = toneFor(colors, tone);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: t.bg, borderRadius: radius.pill },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  label: { fontSize: 12, fontWeight: "700" },
});

export default StatusBadge;
