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
import { Language, useI18n } from "../../i18n";

type LanguageOption = {
  lang: Language;
  flag: string;
  label: string;
  description: string;
};

const OPTIONS: LanguageOption[] = [
  {
    lang: "en",
    flag: "🇬🇧",
    label: "English",
    description: "English",
  },
  {
    lang: "si",
    flag: "🇱🇰",
    label: "සිංහල",
    description: "Sinhala",
  },
];

export function LanguageSelector() {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const { language, setLanguage } = useI18n();

  return (
    <View>
      {OPTIONS.map((option) => (
        <LanguageOptionCard
          key={option.lang}
          option={option}
          selected={language === option.lang}
          onSelect={() => setLanguage(option.lang)}
          colors={colors}
          spacing={spacing}
          radius={radius}
        />
      ))}
    </View>
  );
}

type LanguageOptionCardProps = {
  option: LanguageOption;
  selected: boolean;
  onSelect: () => void;
  colors: typeof import("../../theme/theme").lightColors;
  spacing: typeof import("../../theme/theme").spacing;
  radius: typeof import("../../theme/theme").radius;
};

function LanguageOptionCard({
  option,
  selected,
  onSelect,
  colors,
  spacing,
  radius,
}: LanguageOptionCardProps) {
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
      accessibilityLabel={`${option.label} language`}
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
          <Text style={styles.flag}>{option.flag}</Text>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              {option.label}
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
  card: {
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flag: {
    fontSize: 28,
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
