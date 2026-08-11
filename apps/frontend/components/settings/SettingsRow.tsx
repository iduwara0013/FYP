import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

type SettingsRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  iconColor?: string;
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  last = false,
  iconColor,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: iconColor ? iconColor + "1A" : colors.primarySoft,
            borderRadius: radius.md,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={iconColor ?? colors.primary}
        />
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {value ? (
        <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text>
      ) : null}
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textMuted}
      />
    </>
  );

  const rowStyle = [
    styles.row,
    {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.border,
      minHeight: 56,
    },
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={rowStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessible
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
  },
});
