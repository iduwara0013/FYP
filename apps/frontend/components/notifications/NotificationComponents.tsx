/**
 * Notification UI components
 *
 * - NotificationBadge: animated unread count badge
 * - NotificationItem: single notification card with category color,
 *   icon, unread indicator, swipe-to-delete, and tap-to-read
 * - NotificationBellButton: reusable bell icon with badge for headers
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    CATEGORY_META,
    PRIORITY_META,
    type AppNotification,
} from "../../lib/notifications/types";
import {
    notificationColors,
    notificationRadius,
    notificationShadow,
    notificationSpacing,
} from "./theme";

/* ------------------------------------------------------------------ */
/* Time formatting                                                     */
/* ------------------------------------------------------------------ */

export function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* NotificationBadge                                                   */
/* ------------------------------------------------------------------ */

type NotificationBadgeProps = {
  count: number;
  size?: "sm" | "md";
};

export function NotificationBadge({
  count,
  size = "sm",
}: NotificationBadgeProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(0);

  useEffect(() => {
    if (count > 0) {
      // Pop-in animation when count increases
      if (count > prevCount.current) {
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start();
      }
    } else {
      Animated.timing(scale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
    prevCount.current = count;
  }, [count, scale]);

  if (count <= 0) return null;

  const dimensions = size === "sm" ? 18 : 22;
  const fontSize = size === "sm" ? 10 : 12;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          width: dimensions,
          height: dimensions,
          borderRadius: dimensions / 2,
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize }]}>
        {count > 9 ? "9+" : count}
      </Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* NotificationBellButton                                              */
/* ------------------------------------------------------------------ */

type NotificationBellButtonProps = {
  unreadCount: number;
  onPress: () => void;
};

export function NotificationBellButton({
  unreadCount,
  onPress,
}: NotificationBellButtonProps) {
  return (
    <TouchableOpacity
      style={styles.bellButton}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Notifications"
    >
      <MaterialCommunityIcons
        name="bell-outline"
        size={20}
        color={notificationColors.text}
      />
      {unreadCount > 0 ? (
        <View style={styles.bellBadgeContainer}>
          <NotificationBadge count={unreadCount} size="sm" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* NotificationItem                                                    */
/* ------------------------------------------------------------------ */

type NotificationItemProps = {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete?: (id: string) => void;
  index?: number;
};

export function NotificationItem({
  notification,
  onPress,
  onDelete,
  index = 0,
}: NotificationItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const meta = CATEGORY_META[notification.category];
  const priorityMeta = PRIORITY_META[notification.priority];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 50, 300),
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: Math.min(index * 50, 300),
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.itemCard, !notification.read && styles.itemCardUnread]}
        onPress={() => onPress(notification)}
        activeOpacity={0.85}
      >
        {/* Category icon */}
        <View style={[styles.itemIcon, { backgroundColor: meta.soft }]}>
          <MaterialCommunityIcons
            name={meta.icon}
            size={22}
            color={meta.color}
          />
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {notification.emoji} {notification.title}
            </Text>
            {!notification.read ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text style={styles.itemBody} numberOfLines={3}>
            {notification.body}
          </Text>

          <View style={styles.itemFooter}>
            <View style={[styles.categoryChip, { backgroundColor: meta.soft }]}>
              <Text style={[styles.categoryChipText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>

            {notification.priority === "urgent" ||
            notification.priority === "high" ? (
              <View
                style={[
                  styles.priorityChip,
                  { backgroundColor: priorityMeta.color + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    { color: priorityMeta.color },
                  ]}
                >
                  {priorityMeta.label}
                </Text>
              </View>
            ) : null}

            <Text style={styles.itemTime}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(notification.id)}
            activeOpacity={0.7}
            accessibilityLabel="Delete notification"
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={notificationColors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* NotificationEmptyState                                              */
/* ------------------------------------------------------------------ */

export function NotificationEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="bell-off-outline"
        size={48}
        color={notificationColors.textMuted}
      />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>
        Weather alerts, market price changes, and farming tips will appear here.
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  badge: {
    backgroundColor: notificationColors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: notificationColors.white,
  },
  badgeText: {
    color: notificationColors.white,
    fontWeight: "800",
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: notificationRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: notificationColors.card,
    ...notificationShadow.soft,
  },
  bellBadgeContainer: {
    position: "absolute",
    top: 6,
    right: 8,
  },
  itemContainer: {
    marginBottom: notificationSpacing.sm,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: notificationColors.card,
    borderRadius: notificationRadius.lg,
    padding: notificationSpacing.md,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.card,
  },
  itemCardUnread: {
    backgroundColor: notificationColors.unread,
    borderColor: "#BFDBFE",
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: notificationRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: notificationSpacing.md,
  },
  itemContent: {
    flex: 1,
    gap: notificationSpacing.xs,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: notificationSpacing.sm,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: notificationColors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: notificationColors.primary,
  },
  itemBody: {
    fontSize: 13,
    color: notificationColors.textSecondary,
    lineHeight: 19,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: notificationSpacing.sm,
    marginTop: notificationSpacing.xs,
    flexWrap: "wrap",
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: notificationRadius.pill,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: notificationRadius.pill,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  itemTime: {
    fontSize: 11,
    color: notificationColors.textMuted,
    marginLeft: "auto",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: notificationRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: notificationSpacing.md,
    fontSize: 18,
    fontWeight: "800",
    color: notificationColors.text,
  },
  emptyText: {
    marginTop: notificationSpacing.sm,
    fontSize: 14,
    color: notificationColors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
