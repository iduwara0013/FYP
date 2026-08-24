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
  background: "#F5FAF6",
  backgroundAlt: "#EAF4EC",
  surface: "#FFFFFF",
  surfaceSecondary: "#E5F2E8",
  text: "#17241B",
  textSecondary: "#405849",
  textMuted: "#6B7F71",
  textInverted: "#FFFFFF",
  primary: "#237A45",
  primaryDark: "#15552F",
  primaryLight: "#65B87E",
  primarySoft: "#DDF1E2",
  primaryContrast: "#FFFFFF",
  secondary: "#347A66",
  secondarySoft: "#DDEFE9",
  accent: "#B86A24",
  accentSoft: "#F8E9D8",
  ai: "#5B55A5",
  aiSoft: "#ECEAF8",
  crop: "#237A45",
  cropSoft: "#DDF1E2",
  yield: "#237A45",
  revenue: "#347A66",
  risk: "#B86A24",
  riskSoft: "#F8E9D8",
  competition: "#6D5B8C",
  competitionSoft: "#EEE9F5",
  demand: "#256A9A",
  demandSoft: "#DFEDF7",
  supply: "#347A66",
  supplySoft: "#DDEFE9",
  border: "#D4E2D7",
  borderStrong: "#91AA98",
  success: "#237A45",
  successSoft: "#DDF1E2",
  danger: "#B83C3C",
  dangerSoft: "#F9E2E2",
  warning: "#A86516",
  warningSoft: "#F8E9D8",
  info: "#256A9A",
  infoSoft: "#DFEDF7",
  weather: "#256A9A",
  weatherSoft: "#DFEDF7",
  market: "#B86A24",
  marketSoft: "#F8E9D8",
  prediction: "#237A45",
  predictionSoft: "#DDF1E2",
  tips: "#347A66",
  tipsSoft: "#DDEFE9",
  news: "#5B55A5",
  newsSoft: "#ECEAF8",
  marketUp: "#237A45",
  marketUpSoft: "#DDF1E2",
  marketDown: "#B83C3C",
  marketDownSoft: "#F9E2E2",
  marketFlat: "#6B7F71",
  marketFlatSoft: "#EAF0EB",
  weatherGood: "#237A45",
  weatherGoodSoft: "#DDF1E2",
  weatherWarning: "#A86516",
  weatherDanger: "#B83C3C",
  recommendation: "#237A45",
  recommendationSoft: "#DDF1E2",
  aiBackground: "#F3F1FA",
  positive: "#237A45",
  negative: "#B83C3C",
  neutral: "#6B7F71",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(14, 35, 21, 0.42)",
  overlayStrong: "rgba(21, 85, 47, 0.16)",
  shadow: "#102A19",
  shadowOpacity: 0.08,
  shadowOpacityStrong: 0.14,
};

export const darkColors: AppColors = {
  background: "#0B1510",
  backgroundAlt: "#101D15",
  surface: "#15251B",
  surfaceSecondary: "#1C3023",
  text: "#F2F8F3",
  textSecondary: "#C3D5C7",
  textMuted: "#91A596",
  textInverted: "#FFFFFF",
  primary: "#4FB873",
  primaryDark: "#237A45",
  primaryLight: "#91D5A6",
  primarySoft: "rgba(79, 184, 115, 0.18)",
  primaryContrast: "#FFFFFF",
  secondary: "#69B6A0",
  secondarySoft: "rgba(105, 182, 160, 0.16)",
  accent: "#E1A75C",
  accentSoft: "rgba(225, 167, 92, 0.17)",
  ai: "#AAA3EC",
  aiSoft: "rgba(170, 163, 236, 0.16)",
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
  border: "#294331",
  borderStrong: "#53725C",
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
