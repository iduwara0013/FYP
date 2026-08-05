export const notificationColors = {
  // Primary
  primary: "#16A34A",
  primaryHover: "#15803D",
  primarySoft: "#DCFCE7",
  primaryContrast: "#FFFFFF",

  // Secondary / accent
  secondary: "#22C55E",
  secondarySoft: "#DCFCE7",

  // Background
  background: "#F8FAFC",
  backgroundGradientStart: "#F0FDF4",
  backgroundGradientEnd: "#F8FAFC",

  // Cards
  card: "#FFFFFF",
  cardBorder: "#E2E8F0",
  cardHover: "#F1F5F9",

  // Text
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverted: "#FFFFFF",

  // Borders
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",

  // Category colors
  weather: "#3B82F6",
  weatherSoft: "#DBEAFE",
  market: "#F59E0B",
  marketSoft: "#FEF3C7",
  prediction: "#8B5CF6",
  predictionSoft: "#EDE9FE",
  tips: "#22C55E",
  tipsSoft: "#DCFCE7",
  news: "#06B6D4",
  newsSoft: "#CFFAFE",

  // Status
  unread: "#EFF6FF",
  unreadBorder: "#BFDBFE",
  danger: "#EF4444",
  dangerSoft: "#FEE2E2",
  warning: "#F59E0B",
  success: "#16A34A",
  successSoft: "#DCFCE7",

  // Alias for backward compatibility
  white: "#FFFFFF",

  // Overlay
  overlay: "rgba(15, 23, 42, 0.04)",
  overlayStrong: "rgba(15, 23, 42, 0.08)",
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
