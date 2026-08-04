import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "./theme";

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function EmptyState({
  title,
  message,
  icon = "magnify-close",
}: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={28}
          color={colors.textMuted}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    ...shadow.soft,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
