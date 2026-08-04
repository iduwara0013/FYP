import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type MarketMeta = {
  key: string;
  name: string;
  tint: string;
  soft: string;
};

export type CategoryKey = "grains" | "vegetables" | "fruits" | "other";

export type MarketQuote = {
  market: MarketMeta;
  min: number | null;
  max: number | null;
  average: number | null;
  change: number | null;
  averageIsEstimated: boolean;
  hasData: boolean;
};

export type ParsedEntry = {
  id: string;
  rowNumber: number;
  cropName: string;
  category: CategoryKey;
  quotes: MarketQuote[];
  bestQuote: MarketQuote | null;
  gapValue: number | null;
  gapPercent: number | null;
  topAverage: number | null;
  rawText: string;
  searchText: string;
};

export type CategoryMeta = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function formatMoney(value: number | null): string {
  if (value === null) return "—";
  const [whole, decimals] = value.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs ${grouped}.${decimals}`;
}

export function formatCompactMoney(value: number | null): string {
  if (value === null) return "—";
  const [whole] = value.toFixed(2).split(".");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

export function getChangeColor(change: number | null): string {
  if (change === null) return "#9CA3AF";
  if (change > 0) return "#16A34A";
  if (change < 0) return "#DC2626";
  return "#9CA3AF";
}

export function getChangeIcon(
  change: number | null,
): keyof typeof MaterialCommunityIcons.glyphMap {
  if (change === null) return "minus";
  if (change > 0) return "trending-up";
  if (change < 0) return "trending-down";
  return "minus";
}
