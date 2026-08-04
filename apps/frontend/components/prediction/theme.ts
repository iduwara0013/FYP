export const predictionColors = {
  primary: "#16A34A",
  primaryDark: "#15803D",
  accent: "#22C55E",
  accentSoft: "#DCFCE7",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#0E7490",
  infoSoft: "#CFFAFE",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  gold: "#B45309",
  goldSoft: "#FEF3C7",
  white: "#FFFFFF",
  overlay: "rgba(15, 23, 42, 0.45)",
} as const;

export const predictionSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const predictionRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const predictionShadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
} as const;
