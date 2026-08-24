import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getDashboardColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const dashboardColors = {
  primary: lightColors.primary,
  secondary: lightColors.secondarySoft,
  background: lightColors.background,
  card: lightColors.surface,
  text: lightColors.text,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  border: lightColors.border,
  accentBlue: lightColors.info,
  warning: lightColors.warning,
  danger: lightColors.danger,
  success: lightColors.success,
  white: lightColors.white,
  overlay: lightColors.overlay,
} as const;

export const dashboardSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const dashboardRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const dashboardShadow = {
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
