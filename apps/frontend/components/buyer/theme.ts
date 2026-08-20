import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getBuyerColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const buyerColors = {
  primary: "#0D4B5C",
  secondary: "#B8FAD8",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  border: "#BDEEFF",
  blue: "#0D4B5C",
  blueSoft: "#BDEEFF",
  green: "#0D504D",
  greenSoft: "#B8FAD8",
  red: "#193642",
  redSoft: "#BDEEFF",
  amber: "#FFF0BC",
  amberSoft: "#FFF0BC",
  white: "#FFFFFF",
} as const;

export const buyerSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const buyerRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const buyerShadow = {
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
