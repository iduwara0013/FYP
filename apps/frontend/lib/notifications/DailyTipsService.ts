/**
 * DailyTipsService & PredictionReminderService
 *
 * FEATURE 4 — Daily Farming Tips:
 *   Sends one notification every morning with a rotating farming tip.
 *
 * FEATURE 5 — Prediction Reminders:
 *   Notifies users if they haven't used the crop prediction feature
 *   recently (checked via AsyncStorage timestamp).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { sendNotification } from "./NotificationService";
import { DEEP_LINKS } from "./types";

/* ------------------------------------------------------------------ */
/* Daily Tips                                                          */
/* ------------------------------------------------------------------ */

const DAILY_TIP_KEY = "last_daily_tip_date";
const DAILY_TIP_INDEX_KEY = "daily_tip_index";

const DAILY_TIPS: { emoji: string; body: string }[] = [
  { emoji: "🌱", body: "Water crops before 9 AM to reduce evaporation." },
  { emoji: "🌾", body: "Check paddy fields for pests today." },
  { emoji: "🌿", body: "Apply fertilizer after rainfall for best absorption." },
  {
    emoji: "☀",
    body: "Irrigation is recommended today — check soil moisture.",
  },
  { emoji: "🐛", body: "Inspect leaves for signs of pest infestation." },
  {
    emoji: "💧",
    body: "Ensure drainage channels are clear before the next rain.",
  },
  { emoji: "🌱", body: "Rotate crops to maintain soil fertility." },
  { emoji: "🌤", body: "Good day for land preparation and tilling." },
  { emoji: "🌾", body: "Harvest mature crops in the morning for freshness." },
  { emoji: "🌿", body: "Mulch around plants to retain soil moisture." },
  {
    emoji: "🐛",
    body: "Use organic pest control to protect beneficial insects.",
  },
  { emoji: "💧", body: "Check irrigation systems for leaks and blockages." },
  {
    emoji: "🌱",
    body: "Test soil pH before applying the next round of fertilizer.",
  },
  { emoji: "☀", body: "Provide shade for young seedlings during peak heat." },
  {
    emoji: "🌾",
    body: "Monitor weather forecasts and plan field work accordingly.",
  },
];

/**
 * Send a daily farming tip if one hasn't been sent today.
 * Uses the current date (local) to ensure one tip per day.
 */
export async function sendDailyTipIfDue(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const lastSent = await AsyncStorage.getItem(DAILY_TIP_KEY);

    if (lastSent === today) {
      return; // Already sent today
    }

    // Get the tip index (rotates through the list).
    const indexRaw = await AsyncStorage.getItem(DAILY_TIP_INDEX_KEY);
    let index = indexRaw ? parseInt(indexRaw, 10) : 0;
    if (Number.isNaN(index)) index = 0;

    const tip = DAILY_TIPS[index % DAILY_TIPS.length];

    await sendNotification({
      userId,
      title: "Daily Farming Tip",
      body: tip.body,
      emoji: tip.emoji,
      category: "tips",
      priority: "low",
      deepLink: DEEP_LINKS.home,
      data: { tipIndex: index, totalTips: DAILY_TIPS.length },
    });

    // Update state.
    await AsyncStorage.setItem(DAILY_TIP_KEY, today);
    await AsyncStorage.setItem(
      DAILY_TIP_INDEX_KEY,
      String((index + 1) % DAILY_TIPS.length),
    );
  } catch {
    // Non-fatal
  }
}

/* ------------------------------------------------------------------ */
/* Prediction Reminders                                               */
/* ------------------------------------------------------------------ */

const LAST_PREDICTION_KEY = "last_prediction_timestamp";
const PREDICTION_REMINDER_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Record that the user made a prediction (call from YieldPredictionScreen).
 */
export async function recordPredictionMade(): Promise<void> {
  await AsyncStorage.setItem(LAST_PREDICTION_KEY, String(Date.now()));
}

/**
 * Check if the user hasn't made a prediction recently and send a reminder.
 */
export async function checkPredictionReminderAndNotify(
  userId: string,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PREDICTION_KEY);

    // If no prediction has ever been made, remind after 1 day of signup.
    // (For simplicity, we send the reminder if no prediction exists.)
    if (!raw) {
      await sendNotification({
        userId,
        title: "🤖 Haven't predicted your next crop yet?",
        body: "Get AI recommendations based on today's weather.",
        emoji: "🤖",
        category: "prediction",
        priority: "normal",
        deepLink: DEEP_LINKS.prediction,
        data: { type: "prediction_reminder", reason: "no_prediction" },
      });
      return;
    }

    const lastPrediction = parseInt(raw, 10);
    if (Number.isNaN(lastPrediction)) return;

    const elapsed = Date.now() - lastPrediction;

    if (elapsed >= PREDICTION_REMINDER_INTERVAL_MS) {
      const daysAgo = Math.round(elapsed / (24 * 60 * 60 * 1000));
      await sendNotification({
        userId,
        title: "🤖 Haven't predicted your next crop yet?",
        body: `Your last prediction was ${daysAgo} days ago. Get AI recommendations based on today's weather.`,
        emoji: "🤖",
        category: "prediction",
        priority: "normal",
        deepLink: DEEP_LINKS.prediction,
        data: {
          type: "prediction_reminder",
          reason: "stale",
          daysAgo,
        },
      });
    }
  } catch {
    // Non-fatal
  }
}

/* ------------------------------------------------------------------ */
/* News Updates (basic)                                               */
/* ------------------------------------------------------------------ */

const NEWS_CACHE_KEY = "last_news_sent";

const NEWS_UPDATES: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "📰",
    title: "Agricultural News Update",
    body: "New government subsidy available for vegetable farmers. Check your local agriculture office for details.",
  },
  {
    emoji: "📢",
    title: "Market Update",
    body: "HARTI has released the weekly vegetable price bulletin. Check the Market Prices screen for details.",
  },
  {
    emoji: "🔬",
    title: "Research Highlight",
    body: "New study shows drip irrigation can increase vegetable yield by up to 20% in dry zones.",
  },
];

/**
 * Send a news update if one hasn't been sent in the last 7 days.
 */
export async function sendNewsUpdateIfDue(userId: string): Promise<void> {
  const NEWS_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  try {
    const raw = await AsyncStorage.getItem(NEWS_CACHE_KEY);
    const lastSent = raw ? parseInt(raw, 10) : 0;

    if (Date.now() - lastSent < NEWS_INTERVAL_MS) {
      return;
    }

    const newsIndex =
      Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % NEWS_UPDATES.length;
    const news = NEWS_UPDATES[newsIndex];

    await sendNotification({
      userId,
      title: news.title,
      body: news.body,
      emoji: news.emoji,
      category: "news",
      priority: "low",
      deepLink: DEEP_LINKS.home,
      data: { type: "news", index: newsIndex },
    });

    await AsyncStorage.setItem(NEWS_CACHE_KEY, String(Date.now()));
  } catch {
    // Non-fatal
  }
}
