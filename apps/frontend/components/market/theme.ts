import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getMarketColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const colors = {
  primary: "#0D4B5C",
  primaryDark: "#193642",
  primaryLight: "#BDEEFF",
  primarySoft: "#BDEEFF",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  border: "#BDEEFF",
  success: "#0D504D",
  successSoft: "#B8FAD8",
  danger: "#193642",
  dangerSoft: "#BDEEFF",
  warning: "#FFF0BC",
  warningSoft: "#FFF0BC",
  info: "#0D4B5C",
  infoSoft: "#BDEEFF",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(25, 54, 66, 0.2)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: "800" as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: "800" as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary },
  small: { fontSize: 11, color: colors.textMuted },
} as const;
