import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getDashboardColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const dashboardColors = {
  primary: "#0D4B5C",
  secondary: "#B8FAD8",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  border: "#BDEEFF",
  accentBlue: "#0D4B5C",
  warning: "#FFF0BC",
  danger: "#193642",
  success: "#0D504D",
  white: "#FFFFFF",
  overlay: "rgba(25, 54, 66, 0.2)",
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
