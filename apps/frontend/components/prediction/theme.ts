import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getPredictionColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const predictionColors = {
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  accent: lightColors.secondary,
  accentSoft: lightColors.secondarySoft,
  background: lightColors.background,
  card: lightColors.surface,
  text: lightColors.text,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  border: lightColors.border,
  danger: lightColors.danger,
  dangerSoft: lightColors.dangerSoft,
  warning: lightColors.warning,
  warningSoft: lightColors.warningSoft,
  info: lightColors.info,
  infoSoft: lightColors.infoSoft,
  success: lightColors.success,
  successSoft: lightColors.successSoft,
  gold: lightColors.accent,
  goldSoft: lightColors.accentSoft,
  white: lightColors.white,
  overlay: lightColors.overlay,
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
