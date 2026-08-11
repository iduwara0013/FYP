import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

type SettingsSectionProps = {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  icon,
  children,
}: SettingsSectionProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={colors.primary}
          />
        ) : null}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.sm,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
