import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { ThemeMode } from "../../theme/theme";

type ThemeOption = {
  mode: ThemeMode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
};

const OPTIONS: ThemeOption[] = [
  {
    mode: "light",
    icon: "white-balance-sunny",
    title: "Light",
    description: "Use a bright theme",
  },
  {
    mode: "dark",
    icon: "weather-night",
    title: "Dark",
    description: "Better for low-light environments",
  },
  {
    mode: "system",
    icon: "cellphone",
    title: "System",
    description: "Follow device settings",
  },
];

export function ThemeSelector() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => (
        <ThemeOptionCard
          key={option.mode}
          option={option}
          selected={themeMode === option.mode}
          onSelect={() => setThemeMode(option.mode)}
          colors={colors}
          spacing={spacing}
          radius={radius}
        />
      ))}
    </View>
  );
}

type ThemeOptionCardProps = {
  option: ThemeOption;
  selected: boolean;
  onSelect: () => void;
  colors: typeof import("../../theme/theme").lightColors;
  spacing: typeof import("../../theme/theme").spacing;
  radius: typeof import("../../theme/theme").radius;
};

function ThemeOptionCard({
  option,
  selected,
  onSelect,
  colors,
  spacing,
  radius,
}: ThemeOptionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 0.98 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.spring(checkAnim, {
      toValue: selected ? 1 : 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [selected, scaleAnim, checkAnim]);

  const isDark = colors.background === "#0F172A";

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.85}
      accessible
      accessibilityLabel={`${option.title} theme`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{ marginBottom: spacing.sm }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: selected
              ? isDark
                ? "rgba(34, 197, 94, 0.15)"
                : colors.primarySoft
              : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
            borderRadius: radius.lg,
            padding: spacing.md,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: selected
                  ? colors.primary
                  : colors.surfaceSecondary,
                borderRadius: radius.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={option.icon}
              size={22}
              color={selected ? colors.primaryContrast : colors.textSecondary}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              {option.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {option.description}
            </Text>
          </View>
          <Animated.View
            style={[
              styles.checkWrap,
              {
                backgroundColor: selected ? colors.primary : "transparent",
                borderColor: selected ? colors.primary : colors.border,
                opacity: checkAnim,
                transform: [
                  {
                    scale: checkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={colors.primaryContrast}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
