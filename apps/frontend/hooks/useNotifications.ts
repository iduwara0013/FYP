/**
 * useNotifications — React hook that wires up the entire notification system.
 *
 * Responsibilities:
 *  1. Request push permission on mount.
 *  2. Subscribe to the NotificationService for live notification updates.
 *  3. Fetch notifications from Firestore on mount.
 *  4. Run background checks (weather, market, daily tips, prediction reminder).
 *  5. Set up deep-link response listener.
 *  6. Expose unread count, notifications list, and helper functions.
 *
 * Usage:
 *   const {
 *     notifications,
 *     unreadCount,
 *     refresh,
 *     markAllRead,
 *   } = useNotifications({ profile, onDeepLink });
 */

import { useCallback, useEffect, useState } from "react";

import type { ProfileData } from "../components/screens/profile-types";
import {
    checkPredictionReminderAndNotify,
    sendDailyTipIfDue,
    sendNewsUpdateIfDue,
} from "../lib/notifications/DailyTipsService";
import { checkMarketPricesAndNotify } from "../lib/notifications/MarketNotificationService";
import {
    fetchNotifications,
    getExpoPushToken,
    getUnreadCount,
    markAllAsRead,
    requestNotificationPermission,
    setupNotificationResponseListener,
    subscribe,
} from "../lib/notifications/NotificationService";
import { checkWeatherAndNotify } from "../lib/notifications/WeatherNotificationService";
import type { AppNotification } from "../lib/notifications/types";

type UseNotificationsOptions = {
  profile: ProfileData | null;
  onDeepLink?: (deepLink: string) => void;
  /** Disable background checks (e.g. on the login screen). */
  enabled?: boolean;
};

export function useNotifications({
  profile,
  onDeepLink,
  enabled = true,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = profile?.id ?? profile?.email ?? "";

  /* --- Subscribe to notification updates ---------------------------- */
  useEffect(() => {
    if (!enabled || !userId) return;

    const unsubscribe = subscribe((updated) => {
      setNotifications(updated);
      setUnreadCount(getUnreadCount());
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, userId]);

  /* --- Request permission & register token -------------------------- */
  useEffect(() => {
    if (!enabled || !userId) return;

    void requestNotificationPermission().then((granted) => {
      if (granted) {
        void getExpoPushToken();
      }
    });
  }, [enabled, userId]);

  /* --- Fetch notifications from Firestore --------------------------- */
  const refresh = useCallback(async () => {
    if (!userId) return;
    await fetchNotifications(userId);
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId) return;
    void refresh();
  }, [enabled, userId, refresh]);

  /* --- Poll for user-to-user messages while the app is running ------ */
  useEffect(() => {
    if (!enabled || !userId) return;
    const timer = setInterval(() => {
      void fetchNotifications(userId, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [enabled, userId]);

  /* --- Deep-link response listener ---------------------------------- */
  useEffect(() => {
    if (!enabled || !onDeepLink) return;

    const { initial, subscription } = setupNotificationResponseListener(
      (deepLink) => {
        if (deepLink) {
          onDeepLink(deepLink);
        }
      },
    );

    void initial;

    return () => {
      subscription.remove();
    };
  }, [enabled, onDeepLink]);

  /* --- Background notification checks -------------------------------- */
  useEffect(() => {
    if (!enabled || !userId || !profile) return;

    const region = profile.region?.trim() || "Kandy";

    // Run all checks shortly after mount (staggered to avoid spikes).
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Weather check — 3s after mount
    timers.push(
      setTimeout(() => {
        void checkWeatherAndNotify(userId, region);
      }, 3000),
    );

    // Market price check — 6s after mount
    timers.push(
      setTimeout(() => {
        void checkMarketPricesAndNotify(userId);
      }, 6000),
    );

    // Daily tip — 9s after mount
    timers.push(
      setTimeout(() => {
        void sendDailyTipIfDue(userId);
      }, 9000),
    );

    // Prediction reminder — 12s after mount
    timers.push(
      setTimeout(() => {
        void checkPredictionReminderAndNotify(userId);
      }, 12000),
    );

    // News update — 15s after mount
    timers.push(
      setTimeout(() => {
        void sendNewsUpdateIfDue(userId);
      }, 15000),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [enabled, userId, profile]);

  /* --- Mark all as read --------------------------------------------- */
  const markAllRead = useCallback(async () => {
    await markAllAsRead();
  }, []);

  return {
    notifications,
    unreadCount,
    refresh,
    markAllRead,
  };
}
