/**
 * Barrel export for the notification system.
 *
 * Import from this file:
 *   import {
 *     sendNotification,
 *     useNotifications,
 *     NotificationScreen,
 *   } from "@/lib/notifications";
 */

export * from "./DailyTipsService";
export * from "./MarketNotificationService";
export {
    getNotificationPreferences,
    saveNotificationPreferences,
    togglePreference
} from "./NotificationPreferences";
export * from "./NotificationService";
export * from "./types";
export * from "./WeatherNotificationService";

