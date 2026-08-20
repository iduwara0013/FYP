/**
 * ScoreIndicator — Clean numeric score with progress bar and semantic color.
 *  80-100 green · 60-79 leaf/yellow-green · 40-59 amber · 0-39 red
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AppColors } from "../../theme/theme";

type Props = {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
};

function scoreColor(colors: AppColors, score: number) {
  if (score >= 80) return colors.success; // green
  if (score >= 60) return colors.secondary; // leaf green
  if (score >= 40) return colors.warning; // amber
  return colors.danger; // red
}

export function ScoreIndicator({ score, label, size = "md" }: Props) {
  const { theme } = useTheme();
  const { colors, radius } = theme;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(colors, clamped);
  const isBig = size === "lg";
  const fontSize = isBig ? 30 : size === "sm" ? 22 : 26;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.score, { color, fontSize }]}>
        {clamped}
        {label ? (
          <Text style={[styles.slash, { color: colors.textMuted }]}>
            {" "}
            /100
          </Text>
        ) : null}
      </Text>
      <View
        style={[
          styles.track,
          { backgroundColor: colors.backgroundAlt, borderRadius: radius.pill },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              borderRadius: radius.pill,
              width: `${clamped}%`,
            },
          ]}
        />
      </View>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 120 },
  score: { fontWeight: "900" },
  slash: { fontSize: 13, fontWeight: "700" },
  track: { height: 8, width: "100%", marginTop: 6, overflow: "hidden" },
  fill: { height: "100%" },
  label: { marginTop: 6, fontSize: 12, fontWeight: "600", textAlign: "center" },
});

export default ScoreIndicator;
