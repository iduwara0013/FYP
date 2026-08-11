/**
 * Smart Crop Forecasting — Centralized Theme System
 * Light/dark palettes, spacing, radius, typography, shadows.
 */

export type ThemeMode = "light" | "dark" | "system";

export type AppColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  primaryContrast: string;
  border: string;
  borderStrong: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  weather: string;
  weatherSoft: string;
  market: string;
  marketSoft: string;
  prediction: string;
  predictionSoft: string;
  tips: string;
  tipsSoft: string;
  news: string;
  newsSoft: string;
  white: string;
  black: string;
  overlay: string;
  overlayStrong: string;
  shadow: string;
  shadowOpacity: number;
  shadowOpacityStrong: number;
};

export const lightColors: AppColors = {
  background: "#F8FAFC",
  backgroundAlt: "#F0FDF4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverted: "#FFFFFF",
  primary: "#16A34A",
  primaryDark: "#15803D",
  primaryLight: "#22C55E",
  primarySoft: "#DCFCE7",
  primaryContrast: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#0E7490",
  infoSoft: "#CFFAFE",
  weather: "#2563EB",
  weatherSoft: "#DBEAFE",
  market: "#EA580C",
  marketSoft: "#FFEDD5",
  prediction: "#8B5CF6",
  predictionSoft: "#EDE9FE",
  tips: "#16A34A",
  tipsSoft: "#DCFCE7",
  news: "#0891B2",
  newsSoft: "#CFFAFE",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(15, 23, 42, 0.45)",
  overlayStrong: "rgba(15, 23, 42, 0.08)",
  shadow: "#0F172A",
  shadowOpacity: 0.07,
  shadowOpacityStrong: 0.12,
};

export const darkColors: AppColors = {
  background: "#0F172A",
  backgroundAlt: "#172033",
  surface: "#1E293B",
  surfaceSecondary: "#334155",
  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textInverted: "#FFFFFF",
  primary: "#22C55E",
  primaryDark: "#15803D",
  primaryLight: "#4ADE80",
  primarySoft: "rgba(34, 197, 94, 0.18)",
  primaryContrast: "#FFFFFF",
  border: "#475569",
  borderStrong: "#64748B",
  success: "#22C55E",
  successSoft: "rgba(34, 197, 94, 0.15)",
  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.15)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.15)",
  info: "#38BDF8",
  infoSoft: "rgba(56, 189, 248, 0.15)",
  weather: "#60A5FA",
  weatherSoft: "rgba(96, 165, 250, 0.15)",
  market: "#FB923C",
  marketSoft: "rgba(251, 146, 60, 0.15)",
  prediction: "#A78BFA",
  predictionSoft: "rgba(167, 139, 250, 0.15)",
  tips: "#4ADE80",
  tipsSoft: "rgba(74, 222, 128, 0.15)",
  news: "#22D3EE",
  newsSoft: "rgba(34, 211, 238, 0.15)",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.6)",
  overlayStrong: "rgba(0, 0, 0, 0.25)",
  shadow: "#000000",
  shadowOpacity: 0.3,
  shadowOpacityStrong: 0.4,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;
export type Spacing = typeof spacing;

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;
export type Radius = typeof radius;

export type Typography = {
  title: { fontSize: number; fontWeight: "900" | "800" | "700" | "600" };
  heading: { fontSize: number; fontWeight: "900" | "800" | "700" | "600" };
  subheading: { fontSize: number; fontWeight: "900" | "800" | "700" | "600" };
  body: { fontSize: number; lineHeight: number };
  caption: { fontSize: number };
  small: { fontSize: number };
};

export function createTypography(colors: AppColors): Typography {
  return {
    title: { fontSize: 28, fontWeight: "900" },
    heading: { fontSize: 20, fontWeight: "800" },
    subheading: { fontSize: 16, fontWeight: "700" },
    body: { fontSize: 14, lineHeight: 20 },
    caption: { fontSize: 12 },
    small: { fontSize: 11 },
  };
}

export type Shadows = {
  card: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  soft: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
};

export function createShadows(colors: AppColors): Shadows {
  return {
    card: {
      shadowColor: colors.shadow,
      shadowOpacity: colors.shadowOpacity,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    soft: {
      shadowColor: colors.shadow,
      shadowOpacity: colors.shadowOpacity * 0.7,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
  };
}

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  spacing: Spacing;
  radius: Radius;
  typography: Typography;
  shadows: Shadows;
};

export function createTheme(
  mode: ThemeMode,
  isDark: boolean,
  colors: AppColors,
): AppTheme {
  return {
    mode,
    isDark,
    colors,
    spacing,
    radius,
    typography: createTypography(colors),
    shadows: createShadows(colors),
  };
}

export const lightTheme = createTheme("light", false, lightColors);
export const darkTheme = createTheme("dark", true, darkColors);

export const THEME_STORAGE_KEY = "@smart_crop_theme_mode";
