import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    dashboardColors,
    dashboardRadius,
    dashboardShadow,
    dashboardSpacing,
} from "./theme";

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
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => onPress(action.id)}
          accessibilityLabel={action.title}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: action.background }]}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={26}
              color={action.iconColor}
            />
          </View>
          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.description}>{action.description}</Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: dashboardColors.card,
    borderRadius: dashboardRadius.lg,
    padding: dashboardSpacing.lg,
    ...dashboardShadow.soft,
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
    fontSize: 15,
    fontWeight: "800",
    color: dashboardColors.text,
    lineHeight: 20,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: dashboardColors.textSecondary,
    lineHeight: 17,
  },
});
