/**
 * Notification system type definitions and constants.
 *
 * Every notification in the app follows the same shape so that the
 * in-app Notification Center, push notifications, and Firestore
 * persistence all stay in sync.
 */

import type { MaterialCommunityIcons } from "@expo/vector-icons";

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export type NotificationCategory =
  | "weather"
  | "market"
  | "prediction"
  | "tips"
  | "news";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/* ------------------------------------------------------------------ */
/* Notification item                                                  */
/* ------------------------------------------------------------------ */

export type AppNotification = {
  /** Firestore document id (or local id for unsaved notifications). */
  id: string;
  title: string;
  body: string;
  emoji: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  /** ISO timestamp string. */
  createdAt: string;
  read: boolean;
  /** Optional deep link, e.g. "smartcrop://market-prices". */
  deepLink?: string;
  /** Optional extra metadata (crop name, price, temperature…). */
  data?: Record<string, unknown>;
};

/* ------------------------------------------------------------------ */
/* User preferences                                                    */
/* ------------------------------------------------------------------ */

export type NotificationPreferences = {
  weatherAlerts: boolean;
  marketPriceAlerts: boolean;
  dailyTips: boolean;
  predictionReminders: boolean;
  newsUpdates: boolean;
  /** Whether the user has granted OS-level push permission. */
  pushEnabled: boolean;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  weatherAlerts: true,
  marketPriceAlerts: true,
  dailyTips: true,
  predictionReminders: true,
  newsUpdates: true,
  pushEnabled: false,
};

/* ------------------------------------------------------------------ */
/* Category metadata (icons, colors, labels)                          */
/* ------------------------------------------------------------------ */

export type CategoryMeta = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  soft: string;
};

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  weather: {
    label: "Weather",
    icon: "weather-partly-cloudy",
    color: "#2563EB",
    soft: "#DBEAFE",
  },
  market: {
    label: "Market",
    icon: "currency-usd",
    color: "#EA580C",
    soft: "#FFEDD5",
  },
  prediction: {
    label: "Prediction",
    icon: "chart-line",
    color: "#7C3AED",
    soft: "#EDE9FE",
  },
  tips: {
    label: "Tips",
    icon: "lightbulb-on",
    color: "#16A34A",
    soft: "#DCFCE7",
  },
  news: {
    label: "News",
    icon: "newspaper",
    color: "#0891B2",
    soft: "#CFFAFE",
  },
};

export const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "#94A3B8" },
  normal: { label: "Normal", color: "#2563EB" },
  high: { label: "High", color: "#F59E0B" },
  urgent: { label: "Urgent", color: "#EF4444" },
};

/* ------------------------------------------------------------------ */
/* Filter chips for the Notification Center                           */
/* ------------------------------------------------------------------ */

export type NotificationFilter = "all" | NotificationCategory;

export const FILTER_CHIPS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "weather", label: "Weather" },
  { key: "market", label: "Market" },
  { key: "prediction", label: "Prediction" },
  { key: "tips", label: "Tips" },
  { key: "news", label: "News" },
];

/* ------------------------------------------------------------------ */
/* Deep links                                                          */
/* ------------------------------------------------------------------ */

export const DEEP_LINKS = {
  weather: "smartcrop://weather",
  market: "smartcrop://market-prices",
  prediction: "smartcrop://yield-prediction",
  home: "smartcrop://home",
} as const;

/* ------------------------------------------------------------------ */
/* Helper: create a local notification object                         */
/* ------------------------------------------------------------------ */

let localIdCounter = 0;

export function createNotification(
  partial: Omit<AppNotification, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): AppNotification {
  localIdCounter += 1;
  return {
    id: partial.id ?? `local-${Date.now()}-${localIdCounter}`,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    read: partial.read ?? false,
    ...partial,
  };
}
