/**
 * AppCard — Reusable theme-aware card surface with consistent padding,
 * background, border and shadow adapted for light/dark mode.
 */
import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

type Props = ViewProps & {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function AppCard({ children, elevated = true, style, ...rest }: Props) {
  const { theme } = useTheme();
  const { colors, radius, shadows } = theme;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        elevated ? shadows.card : shadows.soft,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
});

export default AppCard;
