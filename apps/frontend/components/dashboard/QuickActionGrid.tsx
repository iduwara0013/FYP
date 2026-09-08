import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

import { dashboardRadius, dashboardSpacing } from "./theme";

export type QuickAction = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  background: string;
  iconColor: string;
};

type QuickActionGridProps = {
  actions: QuickAction[];
  onPress: (id: string) => void;
};

export function QuickActionGrid({ actions, onPress }: QuickActionGridProps) {
  const { colors, shadows } = useTheme().theme;
  return (
    <View style={styles.grid}>
      {actions.map((action, index) => {
        const tones = [
          [colors.weatherSoft, colors.weather],
          [colors.marketSoft, colors.market],
          [colors.aiSoft, colors.ai],
          [colors.primarySoft, colors.primary],
          [colors.warningSoft, colors.warning],
          [colors.infoSoft, colors.info],
          [colors.secondarySoft, colors.secondary],
        ];
        const [background, iconColor] = tones[index % tones.length];
        return (
        <TouchableOpacity
          key={action.id}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
          activeOpacity={0.85}
          onPress={() => onPress(action.id)}
          accessibilityLabel={action.title}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: background }]}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={26}
              color={iconColor}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{action.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{action.description}</Text>
        </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: dashboardSpacing.md,
    marginBottom: dashboardSpacing.lg,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dashboardSpacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
});
