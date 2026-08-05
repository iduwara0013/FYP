/**
 * WeatherNotificationService
 *
 * Evaluates current weather data (from Open-Meteo) and generates
 * intelligent, localized weather alerts for farmers.
 *
 * Alert types:
 *  - 🌧 Heavy Rain Expected
 *  - ☀ Extreme Heat
 *  - 🌩 Thunderstorm Warning
 *  - 💨 Strong Winds
 *  - 🌪 Severe Weather Alert
 *  - ❄ Cold Weather
 *  - 🌦 Rain Tomorrow
 *  - ☀ Sunny Farming Day
 *
 * The service caches the last weather reading so it only notifies
 * when conditions *change* (avoids duplicate alerts).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { fetchWeatherForRegion, type WeatherState } from "../weather";
import { sendNotification } from "./NotificationService";
import { DEEP_LINKS } from "./types";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const WEATHER_CACHE_KEY = "last_weather_notification";
const WEATHER_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type WeatherAlertRule = {
  id: string;
  emoji: string;
  title: string;
  bodyTemplate: (region: string, context: WeatherState) => string;
  priority: "low" | "normal" | "high" | "urgent";
  /** Returns true if this alert should fire. */
  matches: (weather: WeatherState) => boolean;
};

/* ------------------------------------------------------------------ */
/* Alert rules                                                         */
/* ------------------------------------------------------------------ */

const ALERT_RULES: WeatherAlertRule[] = [
  {
    id: "thunderstorm",
    emoji: "🌩",
    title: "Thunderstorm Warning",
    bodyTemplate: (region) =>
      `Thunderstorm warning for ${region}. Avoid field work during the afternoon.`,
    priority: "urgent",
    matches: (w) => [95, 96, 99].includes(w.weatherCode),
  },
  {
    id: "heavy_rain",
    emoji: "🌧",
    title: "Heavy Rain Warning",
    bodyTemplate: (region) =>
      `Heavy rain expected tomorrow in ${region}. Delay fertilizer application and protect harvested crops.`,
    priority: "high",
    matches: (w) =>
      [65, 67, 82].includes(w.weatherCode) ||
      (w.weatherCode >= 61 && w.weatherCode <= 67 && (w.humidity ?? 0) > 85),
  },
  {
    id: "rain_tomorrow",
    emoji: "🌦",
    title: "Rain Tomorrow",
    bodyTemplate: (region) =>
      `Rain is expected tomorrow in ${region}. Plan your field activities accordingly.`,
    priority: "normal",
    matches: (w) =>
      [51, 53, 55, 56, 57, 61, 63, 80, 81].includes(w.weatherCode),
  },
  {
    id: "extreme_heat",
    emoji: "☀",
    title: "Extreme Heat Alert",
    bodyTemplate: (region, w) =>
      `High temperature (${Math.round(w.temperature)}°C) expected today in ${region}. Irrigate your crops early in the morning.`,
    priority: "high",
    matches: (w) => w.temperature >= 35,
  },
  {
    id: "strong_winds",
    emoji: "💨",
    title: "Strong Winds Alert",
    bodyTemplate: (region) =>
      `Strong winds expected in ${region}. Secure loose equipment and protect young plants.`,
    priority: "normal",
    matches: (w) => (w.windSpeed ?? 0) >= 40,
  },
  {
    id: "cold_weather",
    emoji: "❄",
    title: "Cold Weather Alert",
    bodyTemplate: (region, w) =>
      `Cold temperature (${Math.round(w.temperature)}°C) in ${region}. Protect sensitive crops from cold stress.`,
    priority: "normal",
    matches: (w) => w.temperature <= 10,
  },
  {
    id: "sunny_farming",
    emoji: "🌤",
    title: "Perfect Farming Weather",
    bodyTemplate: (region) =>
      `Perfect weather for harvesting today in ${region}. Make the most of the clear skies!`,
    priority: "low",
    matches: (w) =>
      w.weatherCode === 0 && w.temperature >= 20 && w.temperature <= 32,
  },
];

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

type WeatherCache = {
  region: string;
  weatherCode: number;
  temperature: number;
  alertId: string;
  timestamp: number;
};

async function loadWeatherCache(): Promise<WeatherCache | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherCache;
  } catch {
    return null;
  }
}

async function saveWeatherCache(cache: WeatherCache): Promise<void> {
  await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Check the current weather for a region and send a notification
 * if a weather alert rule matches AND the condition has changed
 * since the last alert.
 *
 * @param userId   The Firestore user id.
 * @param region   The farmer's region (e.g. "Kandy").
 * @returns        The notification that was sent, or `null` if no
 *                 new alert was triggered.
 */
export async function checkWeatherAndNotify(
  userId: string,
  region: string,
): Promise<void> {
  try {
    const weather = await fetchWeatherForRegion(region);

    // Find the first matching alert rule (priority order: urgent → low).
    const sortedRules = [...ALERT_RULES].sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

    const matchedRule = sortedRules.find((rule) => rule.matches(weather));

    if (!matchedRule) {
      return;
    }

    // Check cache — skip if the same alert was recently sent.
    const cache = await loadWeatherCache();
    const now = Date.now();

    if (
      cache &&
      cache.alertId === matchedRule.id &&
      cache.region === region &&
      now - cache.timestamp < WEATHER_CACHE_TTL_MS
    ) {
      return; // Same alert, still within TTL
    }

    // Send the notification.
    await sendNotification({
      userId,
      title: matchedRule.title,
      body: matchedRule.bodyTemplate(region, weather),
      emoji: matchedRule.emoji,
      category: "weather",
      priority: matchedRule.priority,
      deepLink: DEEP_LINKS.weather,
      data: {
        region,
        weatherCode: weather.weatherCode,
        temperature: weather.temperature,
        alertId: matchedRule.id,
      },
    });

    // Update cache.
    await saveWeatherCache({
      region,
      weatherCode: weather.weatherCode,
      temperature: weather.temperature,
      alertId: matchedRule.id,
      timestamp: now,
    });
  } catch {
    // Weather fetch failed — silently skip.
  }
}

/**
 * Manually trigger a weather notification (e.g. for testing).
 */
export async function sendWeatherAlert(
  userId: string,
  region: string,
  alertId: string,
): Promise<void> {
  const rule = ALERT_RULES.find((r) => r.id === alertId);
  if (!rule) return;

  const weather = await fetchWeatherForRegion(region).catch(() => null);

  await sendNotification({
    userId,
    title: rule.title,
    body: rule.bodyTemplate(
      region,
      weather ?? {
        locationName: region,
        temperature: 25,
        humidity: 70,
        windSpeed: 10,
        weatherCode: 0,
        description: "Clear",
        updatedAt: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
      },
    ),
    emoji: rule.emoji,
    category: "weather",
    priority: rule.priority,
    deepLink: DEEP_LINKS.weather,
  });
}

export { ALERT_RULES as WEATHER_ALERT_RULES };

