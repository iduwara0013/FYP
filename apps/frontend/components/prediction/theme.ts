import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getPredictionColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const predictionColors = {
  primary: "#0D4B5C",
  primaryDark: "#193642",
  accent: "#0D504D",
  accentSoft: "#B8FAD8",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  border: "#BDEEFF",
  danger: "#193642",
  dangerSoft: "#BDEEFF",
  warning: "#FFF0BC",
  warningSoft: "#FFF0BC",
  info: "#0D4B5C",
  infoSoft: "#BDEEFF",
  success: "#0D504D",
  successSoft: "#B8FAD8",
  gold: "#FFF0BC",
  goldSoft: "#FFF0BC",
  white: "#FFFFFF",
  overlay: "rgba(25, 54, 66, 0.2)",
} as const;

export function createPredictionPalette(isDark: boolean) {
  const colors = isDark ? darkColors : lightColors;
  return {
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    accent: colors.primaryLight,
    accentSoft: colors.primarySoft,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    border: colors.border,
    danger: colors.danger,
    dangerSoft: colors.dangerSoft,
    warning: colors.warning,
    warningSoft: colors.warningSoft,
    info: colors.info,
    infoSoft: colors.infoSoft,
    success: colors.success,
    successSoft: colors.successSoft,
    gold: colors.accent,
    goldSoft: colors.accentSoft,
    white: colors.white,
    overlay: colors.overlay,
  } as const;
}

export const predictionSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const predictionRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const predictionShadow = {
  card: {
    shadowColor: "#193642",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: "#193642",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
} as const;
