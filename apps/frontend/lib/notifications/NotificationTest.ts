/**
 * NotificationTest — Utility functions to send test notifications.
 *
 * Use these to manually verify that each notification category works
 * end-to-end (OS push banner + Firestore persistence + in-app center).
 *
 * You can call these from a debug button or the developer console.
 */

import { sendNotification } from "./NotificationService";
import { DEEP_LINKS } from "./types";

// All test notifications use bypassDedup: true so they always fire,
// even if the same notification was sent before.

/**
 * Send a test weather notification.
 */
export async function testWeatherNotification(userId: string): Promise<void> {
  await sendNotification({
    userId,
    title: "🌧 Heavy Rain Warning",
    body: "Heavy rain expected tomorrow in your region. Delay fertilizer application and protect harvested crops.",
    emoji: "🌧",
    category: "weather",
    priority: "high",
    deepLink: DEEP_LINKS.weather,
    data: { test: true, type: "weather_test" },
    bypassDedup: true,
  });
}

/**
 * Send a test market price notification.
 */
export async function testMarketNotification(userId: string): Promise<void> {
  await sendNotification({
    userId,
    title: "📈 Rice price increased by 8%",
    body: "Current Price\nRs. 235/kg\nGood time to sell.",
    emoji: "📈",
    category: "market",
    priority: "normal",
    deepLink: DEEP_LINKS.market,
    data: { test: true, type: "market_test", crop: "Rice", price: 235 },
    bypassDedup: true,
  });
}

/**
 * Send a test daily tip notification.
 */
export async function testTipNotification(userId: string): Promise<void> {
  await sendNotification({
    userId,
    title: "Daily Farming Tip",
    body: "🌱 Water crops before 9 AM to reduce evaporation.",
    emoji: "🌱",
    category: "tips",
    priority: "low",
    deepLink: DEEP_LINKS.home,
    data: { test: true, type: "tip_test" },
    bypassDedup: true,
  });
}

/**
 * Send a test prediction reminder notification.
 */
export async function testPredictionNotification(
  userId: string,
): Promise<void> {
  await sendNotification({
    userId,
    title: "🤖 Haven't predicted your next crop yet?",
    body: "Get AI recommendations based on today's weather.",
    emoji: "🤖",
    category: "prediction",
    priority: "normal",
    deepLink: DEEP_LINKS.prediction,
    data: { test: true, type: "prediction_test" },
    bypassDedup: true,
  });
}

/**
 * Send a test news notification.
 */
export async function testNewsNotification(userId: string): Promise<void> {
  await sendNotification({
    userId,
    title: "📰 Agricultural News Update",
    body: "New government subsidy available for vegetable farmers. Check your local agriculture office for details.",
    emoji: "📰",
    category: "news",
    priority: "low",
    deepLink: DEEP_LINKS.home,
    data: { test: true, type: "news_test" },
    bypassDedup: true,
  });
}

/**
 * Send all 5 test notifications at once (staggered by 1.5s each).
 */
export async function testAllNotifications(userId: string): Promise<void> {
  await testWeatherNotification(userId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await testMarketNotification(userId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await testTipNotification(userId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await testPredictionNotification(userId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await testNewsNotification(userId);
}
