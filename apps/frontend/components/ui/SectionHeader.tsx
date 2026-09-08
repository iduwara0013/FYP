/**
 * SectionHeader — Reusable section title row with optional action label.
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.action, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 20, lineHeight: 27, fontWeight: "800", letterSpacing: -0.2 },
  action: { fontSize: 14, lineHeight: 20, fontWeight: "800" },
});

export default SectionHeader;
