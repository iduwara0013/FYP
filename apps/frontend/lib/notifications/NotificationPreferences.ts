/**
 * NotificationPreferences
 *
 * Stores per-user notification preferences in Firestore via the Spring
 * backend's generic collection API (`/api/collections/notification_preferences`).
 *
 * The shape stored in Firestore:
 * {
 *   user_id: string,
 *   weather_alerts: boolean,
 *   market_price_alerts: boolean,
 *   daily_tips: boolean,
 *   prediction_reminders: boolean,
 *   news_updates: boolean,
 *   push_enabled: boolean,
 *   created_at: timestamp
 * }
 */

import { DEFAULT_PREFERENCES, type NotificationPreferences } from "./types";

const SPRING_BACKEND_URL =
  process.env.EXPO_PUBLIC_SPRING_BACKEND_URL ?? "http://127.0.0.1:8080";

const COLLECTION = "notification_preferences";

/* ------------------------------------------------------------------ */
/* Mapping helpers                                                     */
/* ------------------------------------------------------------------ */

type FirestorePreferences = {
  id?: string;
  user_id: string;
  weather_alerts?: boolean;
  market_price_alerts?: boolean;
  daily_tips?: boolean;
  prediction_reminders?: boolean;
  news_updates?: boolean;
  push_enabled?: boolean;
};

function fromFirestore(doc: FirestorePreferences): NotificationPreferences {
  return {
    weatherAlerts: doc.weather_alerts ?? true,
    marketPriceAlerts: doc.market_price_alerts ?? true,
    dailyTips: doc.daily_tips ?? true,
    predictionReminders: doc.prediction_reminders ?? true,
    newsUpdates: doc.news_updates ?? true,
    pushEnabled: doc.push_enabled ?? false,
  };
}

function toFirestore(
  userId: string,
  prefs: NotificationPreferences,
): Record<string, unknown> {
  return {
    user_id: userId,
    weather_alerts: prefs.weatherAlerts,
    market_price_alerts: prefs.marketPriceAlerts,
    daily_tips: prefs.dailyTips,
    prediction_reminders: prefs.predictionReminders,
    news_updates: prefs.newsUpdates,
    push_enabled: prefs.pushEnabled,
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch the current user's notification preferences.
 * Falls back to defaults if no document exists yet.
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  try {
    const response = await fetch(
      `${SPRING_BACKEND_URL}/api/collections/${COLLECTION}`,
    );

    if (!response.ok) {
      return { ...DEFAULT_PREFERENCES };
    }

    const docs = (await response.json()) as FirestorePreferences[];
    const mine = docs.find((doc) => doc.user_id === userId);

    if (!mine) {
      return { ...DEFAULT_PREFERENCES };
    }

    return fromFirestore(mine);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Save (create or update) the user's notification preferences.
 * Because Firestore collection API is append-only via POST, we store
 * a fresh document each time. The most recent document (by created_at)
 * is treated as the current preference set.
 */
export async function saveNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const payload = toFirestore(userId, prefs);

  await fetch(`${SPRING_BACKEND_URL}/api/collections/${COLLECTION}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Convenience: toggle a single preference key and persist.
 */
export async function togglePreference(
  userId: string,
  current: NotificationPreferences,
  key: keyof NotificationPreferences,
): Promise<NotificationPreferences> {
  const updated = { ...current, [key]: !current[key] };
  await saveNotificationPreferences(userId, updated);
  return updated;
}

export { DEFAULT_PREFERENCES };

