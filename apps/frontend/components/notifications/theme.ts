import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getNotificationColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const notificationColors = {
  // Primary
  primary: lightColors.primary,
  primaryHover: lightColors.primaryDark,
  primarySoft: lightColors.primarySoft,
  primaryContrast: lightColors.primaryContrast,

  // Secondary / accent
  secondary: lightColors.secondary,
  secondarySoft: lightColors.secondarySoft,

  // Background
  background: lightColors.background,
  backgroundGradientStart: lightColors.backgroundAlt,
  backgroundGradientEnd: lightColors.background,

  // Cards
  card: lightColors.surface,
  cardBorder: lightColors.border,
  cardHover: lightColors.surfaceSecondary,

  // Text
  text: lightColors.text,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  textInverted: lightColors.textInverted,

  // Borders
  border: lightColors.border,
  borderStrong: lightColors.borderStrong,

  // Category colors
  weather: lightColors.weather,
  weatherSoft: lightColors.weatherSoft,
  market: lightColors.market,
  marketSoft: lightColors.marketSoft,
  prediction: lightColors.prediction,
  predictionSoft: lightColors.predictionSoft,
  tips: lightColors.tips,
  tipsSoft: lightColors.tipsSoft,
  news: lightColors.news,
  newsSoft: lightColors.newsSoft,

  // Status
  unread: lightColors.primarySoft,
  unreadBorder: lightColors.primary,
  danger: lightColors.danger,
  dangerSoft: lightColors.dangerSoft,
  warning: lightColors.warning,
  success: lightColors.success,
  successSoft: lightColors.successSoft,

  // Alias for backward compatibility
  white: lightColors.white,

  // Overlay
  overlay: lightColors.overlay,
  overlayStrong: lightColors.overlayStrong,
} as const;

export const notificationSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const notificationRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const notificationShadow = {
  card: {
    shadowColor: "#193642",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#193642",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
