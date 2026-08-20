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
  background: "#FFFFFF",
  backgroundAlt: "#FFF0BC",
  surface: "#FFFFFF",
  surfaceSecondary: "#BDEEFF",
  text: "#193642",
  textSecondary: "#0D4B5C",
  textMuted: "#5A7480",
  textInverted: "#FFFFFF",
  primary: "#0D4B5C",
  primaryDark: "#193642",
  primaryLight: "#BDEEFF",
  primarySoft: "#BDEEFF",
  primaryContrast: "#FFFFFF",
  secondary: "#B8FAD8",
  secondarySoft: "#B8FAD8",
  accent: "#FFF0BC",
  accentSoft: "#FFF0BC",
  ai: "#0D4B5C",
  aiSoft: "#BDEEFF",
  crop: "#0D504D",
  cropSoft: "#B8FAD8",
  yield: "#0D504D",
  revenue: "#0D4B5C",
  risk: "#FFF0BC",
  riskSoft: "#FFF0BC",
  competition: "#0D4B5C",
  competitionSoft: "#BDEEFF",
  demand: "#0D4B5C",
  demandSoft: "#BDEEFF",
  supply: "#0D504D",
  supplySoft: "#B8FAD8",
  border: "#BDEEFF",
  borderStrong: "#0D4B5C",
  success: "#0D504D",
  successSoft: "#B8FAD8",
  danger: "#193642",
  dangerSoft: "#BDEEFF",
  warning: "#FFF0BC",
  warningSoft: "#FFF0BC",
  info: "#0D4B5C",
  infoSoft: "#BDEEFF",
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
  marketUp: "#0D504D",
  marketUpSoft: "#B8FAD8",
  marketDown: "#193642",
  marketDownSoft: "#BDEEFF",
  marketFlat: "#0D4B5C",
  marketFlatSoft: "#BDEEFF",
  weatherGood: "#0D504D",
  weatherGoodSoft: "#B8FAD8",
  weatherWarning: "#FFF0BC",
  weatherDanger: "#193642",
  recommendation: "#0D504D",
  recommendationSoft: "#B8FAD8",
  aiBackground: "#BDEEFF",
  positive: "#0D504D",
  negative: "#193642",
  neutral: "#0D4B5C",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(25, 54, 66, 0.2)",
  overlayStrong: "rgba(13, 75, 92, 0.12)",
  shadow: "#193642",
  shadowOpacity: 0.08,
  shadowOpacityStrong: 0.14,
};

export const darkColors: AppColors = {
  background: "#193642",
  backgroundAlt: "#071F2A",
  surface: "#0D4B5C",
  surfaceSecondary: "#071F2A",
  text: "#FFFFFF",
  textSecondary: "#BDEEFF",
  textMuted: "#8ECBDD",
  textInverted: "#FFFFFF",
  primary: "#0D504D",
  primaryDark: "#071F2A",
  primaryLight: "#BDEEFF",
  primarySoft: "rgba(13, 80, 77, 0.25)",
  primaryContrast: "#FFFFFF",
  secondary: "#0D4B5C",
  secondarySoft: "rgba(13, 75, 92, 0.24)",
  accent: "#0D504D",
  accentSoft: "rgba(13, 80, 77, 0.25)",
  ai: "#0D4B5C",
  aiSoft: "rgba(13, 75, 92, 0.24)",
  crop: "#0D504D",
  cropSoft: "rgba(13, 80, 77, 0.25)",
  yield: "#0D504D",
  revenue: "#0D4B5C",
  risk: "#193642",
  riskSoft: "rgba(25, 54, 66, 0.3)",
  competition: "#0D4B5C",
  competitionSoft: "rgba(13, 75, 92, 0.24)",
  demand: "#0D4B5C",
  demandSoft: "rgba(13, 75, 92, 0.24)",
  supply: "#0D504D",
  supplySoft: "rgba(13, 80, 77, 0.25)",
  border: "#0D4B5C",
  borderStrong: "#BDEEFF",
  success: "#0D504D",
  successSoft: "rgba(13, 80, 77, 0.25)",
  danger: "#193642",
  dangerSoft: "rgba(25, 54, 66, 0.3)",
  warning: "#0D4B5C",
  warningSoft: "rgba(13, 75, 92, 0.24)",
  info: "#BDEEFF",
  infoSoft: "rgba(189, 238, 255, 0.16)",
  weather: "#BDEEFF",
  weatherSoft: "rgba(189, 238, 255, 0.16)",
  market: "#0D4B5C",
  marketSoft: "rgba(13, 75, 92, 0.24)",
  prediction: "#0D504D",
  predictionSoft: "rgba(13, 80, 77, 0.25)",
  tips: "#0D504D",
  tipsSoft: "rgba(13, 80, 77, 0.25)",
  news: "#BDEEFF",
  newsSoft: "rgba(189, 238, 255, 0.16)",
  marketUp: "#0D504D",
  marketUpSoft: "rgba(13, 80, 77, 0.25)",
  marketDown: "#193642",
  marketDownSoft: "rgba(25, 54, 66, 0.3)",
  marketFlat: "#BDEEFF",
  marketFlatSoft: "rgba(189, 238, 255, 0.16)",
  weatherGood: "#0D504D",
  weatherGoodSoft: "rgba(13, 80, 77, 0.25)",
  weatherWarning: "#0D4B5C",
  weatherDanger: "#193642",
  recommendation: "#0D504D",
  recommendationSoft: "rgba(13, 80, 77, 0.25)",
  aiBackground: "#071F2A",
  positive: "#0D504D",
  negative: "#193642",
  neutral: "#BDEEFF",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(7, 31, 42, 0.65)",
  overlayStrong: "rgba(7, 31, 42, 0.35)",
  shadow: "#000000",
  shadowOpacity: 0.3,
  shadowOpacityStrong: 0.45,
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

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
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
    displayLarge: { fontSize: 34, fontWeight: "900", lineHeight: 40 },
    displayMedium: { fontSize: 28, fontWeight: "900", lineHeight: 34 },
    headlineLarge: { fontSize: 24, fontWeight: "800", lineHeight: 30 },
    headlineMedium: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
    titleLarge: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
    titleMedium: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
    bodyLarge: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
    bodyMedium: { fontSize: 14, lineHeight: 20 },
    bodySmall: { fontSize: 13, lineHeight: 18 },
    labelLarge: { fontSize: 14, fontWeight: "600" },
    labelMedium: { fontSize: 12, fontWeight: "600" },
    caption: { fontSize: 12, fontWeight: "400" },
    title: { fontSize: 28, fontWeight: "900" },
    heading: { fontSize: 20, fontWeight: "800" },
    subheading: { fontSize: 16, fontWeight: "700" },
    body: { fontSize: 14, lineHeight: 20 },
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

/** Shared design tokens reused across feature modules. */
export const tokens = {
  buttonHeight: 48,
  cardPadding: 16,
  iconSize: { sm: 18, md: 22, lg: 28, xl: 36 },
} as const;
