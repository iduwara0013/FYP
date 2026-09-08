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
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  ai: string;
  aiSoft: string;
  crop: string;
  cropSoft: string;
  yield: string;
  revenue: string;
  risk: string;
  riskSoft: string;
  competition: string;
  competitionSoft: string;
  demand: string;
  demandSoft: string;
  supply: string;
  supplySoft: string;
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
  marketUp: string;
  marketUpSoft: string;
  marketDown: string;
  marketDownSoft: string;
  marketFlat: string;
  marketFlatSoft: string;
  weatherGood: string;
  weatherGoodSoft: string;
  weatherWarning: string;
  weatherDanger: string;
  recommendation: string;
  recommendationSoft: string;
  aiBackground: string;
  positive: string;
  negative: string;
  neutral: string;
  white: string;
  black: string;
  overlay: string;
  overlayStrong: string;
  shadow: string;
  shadowOpacity: number;
  shadowOpacityStrong: number;
};

export const lightColors: AppColors = {
  background: "#F7F8FA",
  backgroundAlt: "#EEF2F4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F0F5F4",
  text: "#10211F",
  textSecondary: "#405955",
  textMuted: "#71817E",
  textInverted: "#FFFFFF",
  primary: "#0F766E",
  primaryDark: "#0B514C",
  primaryLight: "#4CB5AA",
  primarySoft: "#DDF4F1",
  primaryContrast: "#FFFFFF",
  secondary: "#4F46E5",
  secondarySoft: "#E9E8FF",
  accent: "#E58A13",
  accentSoft: "#FFF0D5",
  ai: "#7C3AED",
  aiSoft: "#F0E8FF",
  crop: "#16A36A",
  cropSoft: "#DDF7EA",
  yield: "#16A36A",
  revenue: "#0F766E",
  risk: "#E58A13",
  riskSoft: "#FFF0D5",
  competition: "#7C3AED",
  competitionSoft: "#F0E8FF",
  demand: "#2563EB",
  demandSoft: "#E3EDFF",
  supply: "#0891B2",
  supplySoft: "#DDF6FA",
  border: "#DDE5E4",
  borderStrong: "#9AAEAA",
  success: "#16A36A",
  successSoft: "#DDF7EA",
  danger: "#DC4C4C",
  dangerSoft: "#FDE7E7",
  warning: "#D97706",
  warningSoft: "#FFF0D5",
  info: "#2563EB",
  infoSoft: "#E3EDFF",
  weather: "#0284C7",
  weatherSoft: "#E0F3FE",
  market: "#E58A13",
  marketSoft: "#FFF0D5",
  prediction: "#7C3AED",
  predictionSoft: "#F0E8FF",
  tips: "#0F766E",
  tipsSoft: "#DDF4F1",
  news: "#4F46E5",
  newsSoft: "#E9E8FF",
  marketUp: "#16A36A",
  marketUpSoft: "#DDF7EA",
  marketDown: "#DC4C4C",
  marketDownSoft: "#FDE7E7",
  marketFlat: "#71817E",
  marketFlatSoft: "#EEF2F4",
  weatherGood: "#16A36A",
  weatherGoodSoft: "#DDF7EA",
  weatherWarning: "#D97706",
  weatherDanger: "#DC4C4C",
  recommendation: "#0F766E",
  recommendationSoft: "#DDF4F1",
  aiBackground: "#F6F1FF",
  positive: "#16A36A",
  negative: "#DC4C4C",
  neutral: "#71817E",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(8, 27, 25, 0.48)",
  overlayStrong: "rgba(15, 118, 110, 0.16)",
  shadow: "#123D39",
  shadowOpacity: 0.09,
  shadowOpacityStrong: 0.16,
};

export const darkColors: AppColors = {
  background: "#071312",
  backgroundAlt: "#0B1D1B",
  surface: "#102522",
  surfaceSecondary: "#17312D",
  text: "#F2FAF8",
  textSecondary: "#BBD0CC",
  textMuted: "#829B96",
  textInverted: "#FFFFFF",
  primary: "#42D3C5",
  primaryDark: "#0F766E",
  primaryLight: "#86E9DF",
  primarySoft: "rgba(66, 211, 197, 0.16)",
  primaryContrast: "#05201D",
  secondary: "#9B96FF",
  secondarySoft: "rgba(155, 150, 255, 0.16)",
  accent: "#F5B64A",
  accentSoft: "rgba(245, 182, 74, 0.16)",
  ai: "#C09BFF",
  aiSoft: "rgba(192, 155, 255, 0.16)",
  crop: "#65C486",
  cropSoft: "rgba(101, 196, 134, 0.16)",
  yield: "#65C486",
  revenue: "#69B6A0",
  risk: "#E1A75C",
  riskSoft: "rgba(225, 167, 92, 0.17)",
  competition: "#AAA3EC",
  competitionSoft: "rgba(170, 163, 236, 0.16)",
  demand: "#73B8E6",
  demandSoft: "rgba(115, 184, 230, 0.16)",
  supply: "#69B6A0",
  supplySoft: "rgba(105, 182, 160, 0.16)",
  border: "#24423D",
  borderStrong: "#50736D",
  success: "#65C486",
  successSoft: "rgba(101, 196, 134, 0.16)",
  danger: "#F08080",
  dangerSoft: "rgba(240, 128, 128, 0.16)",
  warning: "#E1A75C",
  warningSoft: "rgba(225, 167, 92, 0.17)",
  info: "#73B8E6",
  infoSoft: "rgba(115, 184, 230, 0.16)",
  weather: "#73B8E6",
  weatherSoft: "rgba(115, 184, 230, 0.16)",
  market: "#E1A75C",
  marketSoft: "rgba(225, 167, 92, 0.17)",
  prediction: "#65C486",
  predictionSoft: "rgba(101, 196, 134, 0.16)",
  tips: "#69B6A0",
  tipsSoft: "rgba(105, 182, 160, 0.16)",
  news: "#AAA3EC",
  newsSoft: "rgba(170, 163, 236, 0.16)",
  marketUp: "#65C486",
  marketUpSoft: "rgba(101, 196, 134, 0.16)",
  marketDown: "#F08080",
  marketDownSoft: "rgba(240, 128, 128, 0.16)",
  marketFlat: "#91A596",
  marketFlatSoft: "rgba(145, 165, 150, 0.15)",
  weatherGood: "#65C486",
  weatherGoodSoft: "rgba(101, 196, 134, 0.16)",
  weatherWarning: "#E1A75C",
  weatherDanger: "#F08080",
  recommendation: "#65C486",
  recommendationSoft: "rgba(101, 196, 134, 0.16)",
  aiBackground: "#171C2B",
  positive: "#65C486",
  negative: "#F08080",
  neutral: "#91A596",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.72)",
  overlayStrong: "rgba(0, 0, 0, 0.42)",
  shadow: "#000000",
  shadowOpacity: 0.34,
  shadowOpacityStrong: 0.5,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;
export type Spacing = typeof spacing;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;
export type Radius = typeof radius;

export type FontWeight = "900" | "800" | "700" | "600" | "500" | "400";
export type TextStyle = {
  fontSize: number;
  fontWeight?: FontWeight;
  lineHeight?: number;
};

export type Typography = {
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  caption: TextStyle;
  title: TextStyle;
  heading: TextStyle;
  subheading: TextStyle;
  body: TextStyle;
  small: TextStyle;
};

export function createTypography(_colors: AppColors): Typography {
  return {
    displayLarge: { fontSize: 36, fontWeight: "900", lineHeight: 44 },
    displayMedium: { fontSize: 30, fontWeight: "900", lineHeight: 38 },
    headlineLarge: { fontSize: 25, fontWeight: "800", lineHeight: 32 },
    headlineMedium: { fontSize: 21, fontWeight: "800", lineHeight: 28 },
    titleLarge: { fontSize: 19, fontWeight: "700", lineHeight: 26 },
    titleMedium: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
    bodyLarge: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    bodyMedium: { fontSize: 15, lineHeight: 22 },
    bodySmall: { fontSize: 14, lineHeight: 20 },
    labelLarge: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
    labelMedium: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
    caption: { fontSize: 12, fontWeight: "500", lineHeight: 17 },
    title: { fontSize: 30, fontWeight: "900", lineHeight: 38 },
    heading: { fontSize: 21, fontWeight: "800", lineHeight: 28 },
    subheading: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
    body: { fontSize: 15, lineHeight: 22 },
    small: { fontSize: 12, lineHeight: 17 },
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
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3,
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

/** Shared design tokens reused across feature modules. */
export const tokens = {
  buttonHeight: 48,
  cardPadding: 16,
  iconSize: { sm: 18, md: 22, lg: 28, xl: 36 },
} as const;
