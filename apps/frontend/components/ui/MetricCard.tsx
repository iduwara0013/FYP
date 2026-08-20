/**
 * MetricCard — Theme-aware statistic tile (label / value / optional hint).
 */
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AppColors } from "../../theme/theme";

export type MetricTone =
  | "default"
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "marketUp"
  | "marketDown";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: MetricTone;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

function valueColor(colors: AppColors, tone: MetricTone) {
  switch (tone) {
    case "primary":
      return colors.primary;
    case "success":
    case "marketUp":
      return colors.success;
    case "danger":
    case "marketDown":
      return colors.danger;
    case "warning":
      return colors.warning;
    case "info":
      return colors.info;
    default:
      return colors.text;
  }
}

export function MetricCard({ label, value, hint, tone = "default", icon, style }: Props) {
  const { theme } = useTheme();
  const { colors, radius, shadows } = theme;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderRadius: radius.md },
        shadows.soft,
        style,
      ]}
    >
      <View style={styles.topRow}>
        {icon}
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, { color: valueColor(colors, tone) }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, minWidth: 110 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  hint: { fontSize: 11, marginTop: 2 },
});

export default MetricCard;
