/**
 * MarketNotificationService
 *
 * Monitors crop prices and sends notifications when prices change
 * significantly. Uses the live HARTI market prices fetched via the
 * Spring backend.
 *
 * Alert types:
 *  - 📈 Price increased significantly (good time to sell)
 *  - 📉 Price dropped significantly (consider waiting)
 *  - 🔥 Price reached monthly high
 *
 * The service caches the last known prices so it only notifies
 * when a price *change* exceeds the threshold.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getLiveMarketPrices, type LiveMarketPriceEntry } from "../spring-api";
import { sendNotification } from "./NotificationService";
import { DEEP_LINKS } from "./types";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const PRICE_CACHE_KEY = "last_market_prices";
const PRICE_CHANGE_THRESHOLD = 0.05; // 5% change triggers alert
const SIGNIFICANT_CHANGE_THRESHOLD = 0.08; // 8% for "significant" alerts
const MONTHLY_HIGH_THRESHOLD = 1.15; // 15% above cached average

/* ------------------------------------------------------------------ */
/* Supported crops                                                     */
/* ------------------------------------------------------------------ */

export const SUPPORTED_CROPS = [
  "Rice",
  "Paddy",
  "Maize",
  "Corn",
  "Tomato",
  "Onion",
  "Potato",
  "Carrot",
  "Beans",
  "Cabbage",
  "Pumpkin",
  "Banana",
  "Coconut",
  "Tea",
  "Rubber",
] as const;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type PriceCache = {
  [cropName: string]: {
    price: number;
    timestamp: number;
  };
};

type PriceAlert = {
  crop: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  direction: "up" | "down";
  isMonthlyHigh: boolean;
};

/* ------------------------------------------------------------------ */
/* Price parsing                                                       */
/* ------------------------------------------------------------------ */

/**
 * Extract a numeric price from a HARTI entry's raw text or prices array.
 * Returns the first valid number found (typically the low or average).
 */
function extractPrice(entry: LiveMarketPriceEntry): number | null {
  // Try the prices array first.
  if (entry.prices && entry.prices.length > 0) {
    for (const priceStr of entry.prices) {
      const cleaned = priceStr.replace(/[, ]/g, "");
      const num = parseFloat(cleaned);
      if (!Number.isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  // Fallback: parse from rawText.
  if (entry.rawText) {
    const matches = entry.rawText.match(/(\d[\d,]*(?:\.\d+)?)/g);
    if (matches) {
      for (const match of matches) {
        const num = parseFloat(match.replace(/,/g, ""));
        if (!Number.isNaN(num) && num > 0) {
          return num;
        }
      }
    }
  }

  return null;
}

/**
 * Normalize a crop name for matching against the supported list.
 */
function normalizeCropName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (
    lower.includes("rice") ||
    lower.includes("samba") ||
    lower.includes("nadu")
  )
    return "Rice";
  if (lower.includes("paddy")) return "Paddy";
  if (lower.includes("maize") || lower.includes("corn")) return "Corn";
  if (lower.includes("tomato")) return "Tomato";
  if (lower.includes("onion")) return "Onion";
  if (lower.includes("potato")) return "Potato";
  if (lower.includes("carrot")) return "Carrot";
  if (lower.includes("bean")) return "Beans";
  if (lower.includes("cabbage")) return "Cabbage";
  if (lower.includes("pumpkin")) return "Pumpkin";
  if (lower.includes("banana")) return "Banana";
  if (lower.includes("coconut")) return "Coconut";
  if (lower.includes("tea")) return "Tea";
  if (lower.includes("rubber")) return "Rubber";
  return name.trim();
}

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

async function loadPriceCache(): Promise<PriceCache> {
  try {
    const raw = await AsyncStorage.getItem(PRICE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PriceCache;
  } catch {
    return {};
  }
}

async function savePriceCache(cache: PriceCache): Promise<void> {
  await AsyncStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache));
}

/* ------------------------------------------------------------------ */
/* Core logic                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch live market prices, compare with cached prices, and send
 * notifications for significant changes.
 */
export async function checkMarketPricesAndNotify(
  userId: string,
): Promise<void> {
  try {
    const response = await getLiveMarketPrices();

    if (
      !response.success ||
      !response.entries ||
      response.entries.length === 0
    ) {
      return;
    }

    const cache = await loadPriceCache();
    const alerts: PriceAlert[] = [];

    // Compute monthly average for "monthly high" detection.
    const allPrices: number[] = [];
    for (const entry of response.entries) {
      const price = extractPrice(entry);
      if (price !== null) {
        allPrices.push(price);
      }
    }
    const monthlyAverage =
      allPrices.length > 0
        ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
        : 0;

    for (const entry of response.entries) {
      const price = extractPrice(entry);
      if (price === null) continue;

      const cropName = normalizeCropName(entry.cropName);
      const cached = cache[cropName];

      if (cached) {
        const changePercent = (price - cached.price) / cached.price;

        if (Math.abs(changePercent) >= PRICE_CHANGE_THRESHOLD) {
          alerts.push({
            crop: cropName,
            oldPrice: cached.price,
            newPrice: price,
            changePercent,
            direction: changePercent > 0 ? "up" : "down",
            isMonthlyHigh:
              monthlyAverage > 0 &&
              price >= monthlyAverage * MONTHLY_HIGH_THRESHOLD,
          });
        }
      }

      // Update cache with the latest price.
      cache[cropName] = {
        price,
        timestamp: Date.now(),
      };
    }

    // Send notifications for the most significant alerts (max 3 per check).
    const significantAlerts = alerts
      .filter(
        (a) =>
          Math.abs(a.changePercent) >= SIGNIFICANT_CHANGE_THRESHOLD ||
          a.isMonthlyHigh,
      )
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3);

    for (const alert of significantAlerts) {
      if (alert.isMonthlyHigh) {
        await sendNotification({
          userId,
          title: `🔥 ${alert.crop} price reached this month's highest value`,
          body: `Current Price\nRs. ${Math.round(alert.newPrice)}/kg`,
          emoji: "🔥",
          category: "market",
          priority: "high",
          deepLink: DEEP_LINKS.market,
          data: {
            crop: alert.crop,
            price: alert.newPrice,
            type: "monthly_high",
          },
        });
      } else if (alert.direction === "up") {
        const percentStr = Math.round(alert.changePercent * 100);
        await sendNotification({
          userId,
          title: `📈 ${alert.crop} price increased by ${percentStr}%`,
          body: `Current Price\nRs. ${Math.round(alert.newPrice)}/kg\nGood time to sell.`,
          emoji: "📈",
          category: "market",
          priority: "normal",
          deepLink: DEEP_LINKS.market,
          data: {
            crop: alert.crop,
            oldPrice: alert.oldPrice,
            newPrice: alert.newPrice,
            changePercent: alert.changePercent,
            type: "price_up",
          },
        });
      } else {
        const percentStr = Math.round(Math.abs(alert.changePercent) * 100);
        await sendNotification({
          userId,
          title: `📉 ${alert.crop} price dropped by ${percentStr}%`,
          body: `Current Price\nRs. ${Math.round(alert.newPrice)}/kg\nConsider waiting before selling.`,
          emoji: "📉",
          category: "market",
          priority: "normal",
          deepLink: DEEP_LINKS.market,
          data: {
            crop: alert.crop,
            oldPrice: alert.oldPrice,
            newPrice: alert.newPrice,
            changePercent: alert.changePercent,
            type: "price_down",
          },
        });
      }
    }

    // Save updated cache.
    await savePriceCache(cache);
  } catch {
    // Market price fetch failed — silently skip.
  }
}

/**
 * Manually send a price alert for a specific crop (e.g. for testing).
 */
export async function sendPriceAlert(
  userId: string,
  crop: string,
  price: number,
  changePercent: number,
): Promise<void> {
  const direction = changePercent > 0 ? "up" : "down";
  const percentStr = Math.round(Math.abs(changePercent) * 100);

  if (direction === "up") {
    await sendNotification({
      userId,
      title: `📈 ${crop} price increased by ${percentStr}%`,
      body: `Current Price\nRs. ${Math.round(price)}/kg\nGood time to sell.`,
      emoji: "📈",
      category: "market",
      priority: "normal",
      deepLink: DEEP_LINKS.market,
      data: { crop, price, changePercent, type: "price_up" },
    });
  } else {
    await sendNotification({
      userId,
      title: `📉 ${crop} price dropped by ${percentStr}%`,
      body: `Current Price\nRs. ${Math.round(price)}/kg\nConsider waiting before selling.`,
      emoji: "📉",
      category: "market",
      priority: "normal",
      deepLink: DEEP_LINKS.market,
      data: { crop, price, changePercent, type: "price_down" },
    });
  }
}
