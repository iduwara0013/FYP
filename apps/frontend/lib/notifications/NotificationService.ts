/**
 * NotificationService
 *
 * The central hub for the notification system. Responsibilities:
 *
 *  1. Request & manage OS-level push permission (expo-notifications).
 *  2. Register a push token (stored locally for now; can be sent to
 *     a server later for FCM topic subscription).
 *  3. Show local push notifications (works in foreground, background,
 *     and when the app is closed).
 *  4. Persist every notification to Firestore via the Spring backend
 *     so the in-app Notification Center can list them.
 *  5. Fetch, mark-as-read, and delete notifications from Firestore.
 *  6. De-duplicate notifications so users never see the same alert
 *     twice (based on a content hash).
 *
 * This service is framework-agnostic — it does not import React.
 * UI components subscribe to it via the `subscribe()` method.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  type AppNotification,
  type NotificationCategory,
  createNotification,
} from "./types";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const SPRING_BACKEND_URL =
  process.env.EXPO_PUBLIC_SPRING_BACKEND_URL ?? "http://127.0.0.1:8080";

const NOTIFICATIONS_COLLECTION = "app_notifications";
const DEDUP_CACHE_KEY = "notification_dedup_cache";
const TOKEN_KEY = "expo_push_token";
const MAX_DEDUP_ENTRIES = 200;

/* ------------------------------------------------------------------ */
/* Foreground notification handler                                     */
/* ------------------------------------------------------------------ */

// Configure how notifications appear when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Listener = (notifications: AppNotification[]) => void;

type FirestoreNotification = {
  id?: string;
  user_id?: string;
  title?: string;
  body?: string;
  emoji?: string;
  category?: string;
  priority?: string;
  created_at?: string;
  created_at_text?: string;
  read_status?: string;
  deep_link?: string;
  data?: string;
};

/* ------------------------------------------------------------------ */
/* Singleton state                                                     */
/* ------------------------------------------------------------------ */

let cachedNotifications: AppNotification[] = [];
let listeners: Set<Listener> = new Set();
let permissionRequested = false;

/* ------------------------------------------------------------------ */
/* Permission & token                                                  */
/* ------------------------------------------------------------------ */

/**
 * Request OS-level permission to show push notifications.
 * Returns `true` if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (permissionRequested) {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  }

  permissionRequested = true;

  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Get the Expo push token (registers the device with FCM/APNs).
 * Returns `null` on web or if permission is not granted.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return null;
  }

  // Check if we already have a token cached.
  const cached = await AsyncStorage.getItem(TOKEN_KEY);
  if (cached) {
    return cached;
  }

  try {
    const projectId =
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "smartcrop-fyp";
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    await AsyncStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* De-duplication                                                      */
/* ------------------------------------------------------------------ */

/**
 * Build a short hash from the notification content to detect duplicates.
 */
function dedupKey(notification: AppNotification): string {
  return `${notification.category}:${notification.title}:${notification.body}`;
}

async function loadDedupCache(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DEDUP_CACHE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveDedupCache(cache: Set<string>): Promise<void> {
  const arr = Array.from(cache).slice(-MAX_DEDUP_ENTRIES);
  await AsyncStorage.setItem(DEDUP_CACHE_KEY, JSON.stringify(arr));
}

/**
 * Clear the de-duplication cache so all notifications can fire again.
 * Useful for testing or when automatic notifications seem stuck.
 */
export async function clearDedupCache(): Promise<void> {
  await AsyncStorage.removeItem(DEDUP_CACHE_KEY);
}

/* ------------------------------------------------------------------ */
/* Firestore persistence                                               */
/* ------------------------------------------------------------------ */

function toFirestore(n: AppNotification, userId: string) {
  return {
    user_id: userId,
    title: n.title,
    body: n.body,
    emoji: n.emoji,
    category: n.category,
    priority: n.priority,
    read_status: n.read ? "read" : "unread",
    deep_link: n.deepLink ?? "",
    data: n.data ? JSON.stringify(n.data) : "",
    created_at_text: n.createdAt,
  };
}

function fromFirestore(doc: FirestoreNotification): AppNotification {
  let parsedData: Record<string, unknown> | undefined;
  if (doc.data) {
    try {
      parsedData = JSON.parse(doc.data);
    } catch {
      parsedData = undefined;
    }
  }

  return {
    id: doc.id ?? `fs-${Date.now()}`,
    title: doc.title ?? "",
    body: doc.body ?? "",
    emoji: doc.emoji ?? "🔔",
    category: (doc.category as NotificationCategory) ?? "news",
    priority: (doc.priority as AppNotification["priority"]) ?? "normal",
    createdAt:
      doc.created_at ?? doc.created_at_text ?? new Date().toISOString(),
    read: doc.read_status === "read",
    deepLink: doc.deep_link || undefined,
    data: parsedData,
  };
}

/**
 * Persist a notification to Firestore via the Spring backend.
 */
async function persistToFirestore(
  notification: AppNotification,
  userId: string,
): Promise<void> {
  try {
    await fetch(
      `${SPRING_BACKEND_URL}/api/collections/${NOTIFICATIONS_COLLECTION}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFirestore(notification, userId)),
      },
    );
  } catch {
    // Non-fatal: the notification is still shown locally.
  }
}

/* ------------------------------------------------------------------ */
/* Core: send a notification                                           */
/* ------------------------------------------------------------------ */

export type SendNotificationInput = {
  userId: string;
  title: string;
  body: string;
  emoji?: string;
  category: NotificationCategory;
  priority?: AppNotification["priority"];
  deepLink?: string;
  data?: Record<string, unknown>;
  /** Skip the OS push banner (only store in-app). */
  silent?: boolean;
  /** Bypass the de-duplication cache (for test notifications). */
  bypassDedup?: boolean;
};

/**
 * Send a notification:
 *  - De-duplicates (skips if an identical notification was recently sent).
 *  - Shows an OS-level push notification (unless `silent`).
 *  - Persists to Firestore for the in-app Notification Center.
 *  - Updates the in-memory cache and notifies subscribers.
 */
export async function sendNotification(
  input: SendNotificationInput,
): Promise<AppNotification | null> {
  const notification = createNotification({
    title: input.title,
    body: input.body,
    emoji: input.emoji ?? "🔔",
    category: input.category,
    priority: input.priority ?? "normal",
    deepLink: input.deepLink,
    data: input.data,
  });

  // --- De-duplication -----------------------------------------------
  if (!input.bypassDedup) {
    const dedup = await loadDedupCache();
    const key = dedupKey(notification);
    if (dedup.has(key)) {
      return null; // Already sent recently
    }
    dedup.add(key);
    await saveDedupCache(dedup);
  }

  // --- OS push notification -----------------------------------------
  if (!input.silent) {
    try {
      // Ensure we have permission before scheduling.
      const granted = await requestNotificationPermission();
      if (granted) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${notification.emoji} ${notification.title}`,
            body: notification.body,
            data: {
              category: notification.category,
              deepLink: notification.deepLink,
              ...notification.data,
            },
            sound: true,
            priority:
              notification.priority === "urgent"
                ? "max"
                : notification.priority === "high"
                  ? "high"
                  : "default",
          },
          // Use a 1-second delay trigger for iOS compatibility
          // (trigger: null can be unreliable on iOS Expo Go).
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
          },
        });
      }
    } catch {
      // Non-fatal
    }
  }

  // --- Firestore persistence ----------------------------------------
  await persistToFirestore(notification, input.userId);

  // --- In-memory cache ----------------------------------------------
  cachedNotifications = [notification, ...cachedNotifications].slice(0, 100);
  notifyListeners();

  return notification;
}

/* ------------------------------------------------------------------ */
/* Fetch from Firestore                                                */
/* ------------------------------------------------------------------ */

/**
 * Fetch all notifications for a user from Firestore and update the cache.
 */
export async function fetchNotifications(
  userId: string,
  showNewAlerts = false,
): Promise<AppNotification[]> {
  try {
    const response = await fetch(
      `${SPRING_BACKEND_URL}/api/collections/${NOTIFICATIONS_COLLECTION}`,
    );

    if (!response.ok) {
      return cachedNotifications;
    }

    const docs = (await response.json()) as FirestoreNotification[];
    const mine = docs.filter((doc) => doc.user_id === userId);

    const previousIds = new Set(cachedNotifications.map((item) => item.id));
    const uniqueDocs = [...new Map(mine.map((doc) => [doc.id, doc])).values()];
    const mapped = uniqueDocs
      .map(fromFirestore)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    if (showNewAlerts) {
      const newNotifications = mapped.filter((item) => !previousIds.has(item.id));
      for (const notification of newNotifications.slice(0, 3)) {
        try {
          const granted = await requestNotificationPermission();
          if (granted) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${notification.emoji} ${notification.title}`,
                body: notification.body,
                data: { deepLink: notification.deepLink, ...notification.data },
                sound: true,
                priority: notification.priority === "high" || notification.priority === "urgent" ? "high" : "default",
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 1,
              },
            });
          }
        } catch {
          // The in-app notification remains available if OS banners are unavailable.
        }
      }
    }

    cachedNotifications = mapped;
    notifyListeners();
    return mapped;
  } catch {
    return cachedNotifications;
  }
}

/* ------------------------------------------------------------------ */
/* Mark as read / delete                                               */
/* ------------------------------------------------------------------ */

/**
 * Mark a notification as read locally. (Firestore update would require
 * a dedicated endpoint; for now we track read state in-memory + AsyncStorage.)
 */
export async function markAsRead(id: string): Promise<void> {
  cachedNotifications = cachedNotifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  notifyListeners();

  // Persist read state locally so it survives reloads.
  try {
    const readIds = cachedNotifications.filter((n) => n.read).map((n) => n.id);
    await AsyncStorage.setItem(
      "read_notification_ids",
      JSON.stringify(readIds),
    );
  } catch {
    // Non-fatal
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead(): Promise<void> {
  cachedNotifications = cachedNotifications.map((n) => ({ ...n, read: true }));
  notifyListeners();

  try {
    const readIds = cachedNotifications.map((n) => n.id);
    await AsyncStorage.setItem(
      "read_notification_ids",
      JSON.stringify(readIds),
    );
  } catch {
    // Non-fatal
  }
}

/**
 * Delete a notification from the local cache.
 */
export async function deleteNotification(id: string): Promise<void> {
  cachedNotifications = cachedNotifications.filter((n) => n.id !== id);
  notifyListeners();
}

/* ------------------------------------------------------------------ */
/* Subscriptions (observer pattern)                                    */
/* ------------------------------------------------------------------ */

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(cachedNotifications);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(cachedNotifications);
  }
}

/**
 * Get the current unread count.
 */
export function getUnreadCount(): number {
  return cachedNotifications.filter((n) => !n.read).length;
}

/**
 * Get the current cached notifications (without fetching).
 */
export function getCachedNotifications(): AppNotification[] {
  return cachedNotifications;
}

/* ------------------------------------------------------------------ */
/* Deep-link response handler                                          */
/* ------------------------------------------------------------------ */

/**
 * Set up a listener for when the user taps a push notification.
 * Returns the initial notification (if the app was opened by one)
 * and a subscription for subsequent taps.
 */
export function setupNotificationResponseListener(
  onReceive: (deepLink?: string) => void,
): {
  initial: Promise<void>;
  subscription: Notifications.EventSubscription;
} {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const deepLink =
        (response.notification.request.content.data as { deepLink?: string })
          ?.deepLink ?? undefined;
      onReceive(deepLink);
    },
  );

  const initial = (async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const deepLink =
        (response.notification.request.content.data as { deepLink?: string })
          ?.deepLink ?? undefined;
      onReceive(deepLink);
    }
  })();

  return { initial, subscription };
}
