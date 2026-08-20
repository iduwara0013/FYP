import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getNotificationColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const notificationColors = {
  // Primary
  primary: "#0D4B5C",
  primaryHover: "#193642",
  primarySoft: "#BDEEFF",
  primaryContrast: "#FFFFFF",

  // Secondary / accent
  secondary: "#B8FAD8",
  secondarySoft: "#B8FAD8",

  // Background
  background: "#FFFFFF",
  backgroundGradientStart: "#BDEEFF",
  backgroundGradientEnd: "#FFFFFF",

  // Cards
  card: "#FFFFFF",
  cardBorder: "#BDEEFF",
  cardHover: "#BDEEFF",

  // Text
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  textInverted: "#FFFFFF",

  // Borders
  border: "#BDEEFF",
  borderStrong: "#0D4B5C",

  // Category colors
  weather: "#0D4B5C",
  weatherSoft: "#BDEEFF",
  market: "#193642",
  marketSoft: "#BDEEFF",
  prediction: "#0D504D",
  predictionSoft: "#B8FAD8",
  tips: "#0D504D",
  tipsSoft: "#B8FAD8",
  news: "#0D4B5C",
  newsSoft: "#BDEEFF",

  // Status
  unread: "#BDEEFF",
  unreadBorder: "#0D4B5C",
  danger: "#193642",
  dangerSoft: "#BDEEFF",
  warning: "#FFF0BC",
  success: "#0D504D",
  successSoft: "#B8FAD8",

  // Alias for backward compatibility
  white: "#FFFFFF",

  // Overlay
  overlay: "rgba(25, 54, 66, 0.08)",
  overlayStrong: "rgba(13, 75, 92, 0.12)",
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
