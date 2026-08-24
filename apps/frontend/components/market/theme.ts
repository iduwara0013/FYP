import { AppColors, darkColors, lightColors } from "../../theme/theme";

export function getMarketColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const colors = {
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  primaryLight: lightColors.primaryLight,
  primarySoft: lightColors.primarySoft,
  background: lightColors.background,
  card: lightColors.surface,
  text: lightColors.text,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  border: lightColors.border,
  success: lightColors.success,
  successSoft: lightColors.successSoft,
  danger: lightColors.danger,
  dangerSoft: lightColors.dangerSoft,
  warning: lightColors.warning,
  warningSoft: lightColors.warningSoft,
  info: lightColors.info,
  infoSoft: lightColors.infoSoft,
  white: lightColors.white,
  black: lightColors.black,
  overlay: lightColors.overlay,
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
