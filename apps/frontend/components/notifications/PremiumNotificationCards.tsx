/**
 * PremiumNotificationCards — Category-specific notification cards
 * with premium styling, animations, and data-aware content.
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";

import {
    CATEGORY_META,
    PRIORITY_META,
    type AppNotification,
} from "../../lib/notifications/types";
import {
    notificationColors,
    getNotificationColors,
    notificationRadius,
    notificationShadow,
    notificationSpacing,
} from "./theme";

/* ------------------------------------------------------------------ */
/* Time formatter                                                      */
/* ------------------------------------------------------------------ */

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
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
/* Priority badge                                                      */
/* ------------------------------------------------------------------ */

function PriorityBadge({
  priority,
}: {
  priority: AppNotification["priority"];
}) {
  const meta = PRIORITY_META[priority];
  const colors: Record<string, string> = {
    low: notificationColors.textMuted,
    normal: notificationColors.primary,
    high: notificationColors.warning,
    urgent: notificationColors.danger,
  };
  const color = colors[priority] ?? notificationColors.primary;
  return (
    <View
      style={[
        styles.priorityBadge,
        { backgroundColor: color + "1A", borderColor: color + "40" },
      ]}
    >
      <View style={[styles.priorityDot, { backgroundColor: color }]} />
      <Text style={[styles.priorityText, { color }]}>{meta.label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Animated base card                                                  */
/* ------------------------------------------------------------------ */

function PremiumCardBase({
  notification,
  index,
  leftColor,
  children,
}: {
  notification: AppNotification;
  index?: number;
  leftColor: string;
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min((index ?? 0) * 50, 300),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: Math.min((index ?? 0) * 50, 300),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View
        style={[
          styles.premiumCard,
          {
            backgroundColor: notification.read ? colors.surface : colors.primarySoft,
            borderColor: colors.border,
            borderLeftColor: leftColor,
          },
        ]}
      >
        {children}
        {!notification.read ? <View style={styles.unreadIndicator} /> : null}
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Premium Skeleton Loader                                             */
/* ------------------------------------------------------------------ */

export function PremiumNotificationSkeleton() {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: -1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surfaceSecondary, opacity: 0.55, transform: [{ translateX: shimmerAnim }] },
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Premium Empty State                                                 */
/* ------------------------------------------------------------------ */

export function PremiumEmptyState() {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getNotificationColors(isDark);
  return (
    <View style={styles.premiumEmptyContainer}>
      <View style={[styles.premiumEmptyIcon, { backgroundColor: colors.successSoft }]}>
        <MaterialCommunityIcons
          name="bell-check-outline"
          size={64}
          color={notificationColors.success}
        />
      </View>
      <Text style={[styles.premiumEmptyTitle, { color: colors.text }]}>{t("allCaughtUp")}</Text>
      <Text style={[styles.premiumEmptyText, { color: colors.textSecondary }]}>
        {t("notificationEmptyText")}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Weather Card                                                        */
/* ------------------------------------------------------------------ */

export function PremiumWeatherCard({
  notification,
  index,
}: {
  notification: AppNotification;
  index?: number;
}) {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  const data = notification.data ?? {};
  const temp =
    typeof data.temperature === "number"
      ? `${Math.round(data.temperature)}\u00B0C`
      : null;
  const humidity =
    typeof data.humidity === "number" ? `${data.humidity}%` : null;
  const wind =
    typeof data.windSpeed === "number" ? `${data.windSpeed} km/h` : null;

  return (
    <PremiumCardBase
      notification={notification}
      index={index}
      leftColor={notificationColors.weather}
    >
      <View
        style={[
          styles.premiumIconWrap,
          { backgroundColor: notificationColors.weatherSoft },
        ]}
      >
        <Text style={{ fontSize: 22 }}>{notification.emoji}</Text>
      </View>
      <View style={styles.premiumCardContent}>
        <View style={styles.premiumCardHeader}>
          <Text style={[styles.premiumCardTitle, { color: colors.text }]}>{notification.title}</Text>
          <PriorityBadge priority={notification.priority} />
        </View>
        <Text style={[styles.premiumCardBody, { color: colors.textSecondary }]}>{notification.body}</Text>
        {temp || humidity || wind ? (
          <View style={styles.weatherMetrics}>
            {temp ? <WeatherMetric icon="thermometer" label={temp} /> : null}
            {humidity ? (
              <WeatherMetric icon="water-percent" label={humidity} />
            ) : null}
            {wind ? <WeatherMetric icon="weather-windy" label={wind} /> : null}
          </View>
        ) : null}
        <View style={styles.premiumCardFooter}>
          <Text style={[styles.premiumCardTime, { color: colors.textMuted }]}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.textMuted}
          />
        </View>
      </View>
    </PremiumCardBase>
  );
}

function WeatherMetric({ icon, label }: { icon: string; label: string }) {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  return (
    <View style={styles.weatherMetricItem}>
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={14}
        color={notificationColors.weather}
      />
      <Text style={[styles.weatherMetricText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Market Card                                                         */
/* ------------------------------------------------------------------ */

export function PremiumMarketCard({
  notification,
  index,
}: {
  notification: AppNotification;
  index?: number;
}) {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  const data = notification.data ?? {};
  const price =
    typeof data.price === "number" ? `Rs. ${Math.round(data.price)}/kg` : null;
  const crop = typeof data.crop === "string" ? data.crop : null;

  return (
    <PremiumCardBase
      notification={notification}
      index={index}
      leftColor={notificationColors.market}
    >
      <View
        style={[
          styles.premiumIconWrap,
          { backgroundColor: notificationColors.marketSoft },
        ]}
      >
        <Text style={{ fontSize: 22 }}>{notification.emoji}</Text>
      </View>
      <View style={styles.premiumCardContent}>
        <View style={styles.premiumCardHeader}>
          <Text style={[styles.premiumCardTitle, { color: colors.text }]}>{notification.title}</Text>
          <PriorityBadge priority={notification.priority} />
        </View>
        <Text style={[styles.premiumCardBody, { color: colors.textSecondary }]}>{notification.body}</Text>
        {crop ? (
          <View style={styles.marketCropRow}>
            <View
              style={[
                styles.cropDot,
                { backgroundColor: notificationColors.market },
              ]}
            />
            <Text style={[styles.cropName, { color: colors.text }]}>{crop}</Text>
            {price ? <Text style={styles.cropPrice}>{price}</Text> : null}
          </View>
        ) : null}
        <View style={styles.premiumCardFooter}>
          <Text style={[styles.premiumCardTime, { color: colors.textMuted }]}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.textMuted}
          />
        </View>
      </View>
    </PremiumCardBase>
  );
}

/* ------------------------------------------------------------------ */
/* Standard Card (Tips, Prediction, News)                              */
/* ------------------------------------------------------------------ */

export function PremiumStandardCard({
  notification,
  index,
}: {
  notification: AppNotification;
  index?: number;
}) {
  const { isDark } = useTheme();
  const colors = getNotificationColors(isDark);
  const meta = CATEGORY_META[notification.category];

  return (
    <PremiumCardBase
      notification={notification}
      index={index}
      leftColor={meta.color}
    >
      <View style={[styles.premiumIconWrap, { backgroundColor: meta.soft }]}>
        <MaterialCommunityIcons
          name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={meta.color}
        />
      </View>
      <View style={styles.premiumCardContent}>
        <View style={styles.premiumCardHeader}>
          <Text style={[styles.premiumCardTitle, { color: colors.text }]}>
            {notification.emoji} {notification.title}
          </Text>
          <PriorityBadge priority={notification.priority} />
        </View>
        <Text style={[styles.premiumCardBody, { color: colors.textSecondary }]}>{notification.body}</Text>
        <View style={styles.premiumCardFooter}>
          <View
            style={[styles.categoryPillSmall, { backgroundColor: meta.soft }]}
          >
            <Text style={[styles.categoryPillTextSmall, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
          <Text style={[styles.premiumCardTime, { color: colors.textMuted }]}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.textMuted}
          />
        </View>
      </View>
    </PremiumCardBase>
  );
}

/* ------------------------------------------------------------------ */
/* Statistics Dashboard                                                */
/* ------------------------------------------------------------------ */

export function StatisticsDashboard({
  unreadCount,
  totalCount,
  weatherCount,
  marketCount,
  predictionCount,
}: {
  unreadCount: number;
  totalCount: number;
  weatherCount: number;
  marketCount: number;
  predictionCount: number;
}) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const colors = getNotificationColors(isDark);
  const items = [
    {
      label: t("unread"),
      value: unreadCount,
      color: notificationColors.danger,
      icon: "alert" as const,
    },
    {
      label: t("filterWeather"),
      value: weatherCount,
      color: notificationColors.weather,
      icon: "weather-partly-cloudy" as const,
    },
    {
      label: t("filterMarket"),
      value: marketCount,
      color: notificationColors.market,
      icon: "currency-usd" as const,
    },
  ];

  return (
    <View style={styles.statsContainer}>
      {items.map((item) => (
        <View key={item.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons
              name={item.icon}
              size={16}
              color={item.color}
            />
            <Text style={[styles.statLabel, { color: item.color }]}>
              {item.label}
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  // Cards
  premiumCard: {
    backgroundColor: notificationColors.card,
    borderRadius: notificationRadius.xl,
    padding: notificationSpacing.md,
    marginBottom: notificationSpacing.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: notificationColors.cardBorder,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: notificationSpacing.md,
    ...notificationShadow.card,
  },
  premiumCardUnread: {
    backgroundColor: notificationColors.unread,
  },
  premiumIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  premiumCardContent: {
    flex: 1,
    gap: 4,
  },
  premiumCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: notificationSpacing.sm,
  },
  premiumCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: notificationColors.text,
    flex: 1,
  },
  premiumCardBody: {
    fontSize: 13,
    color: notificationColors.textSecondary,
    lineHeight: 18,
  },
  premiumCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: notificationSpacing.sm,
  },
  premiumCardTime: {
    fontSize: 11,
    color: notificationColors.textMuted,
    fontWeight: "600",
  },
  unreadIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: notificationColors.primary,
  },
  // Priority
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: notificationRadius.pill,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  // Weather
  weatherMetrics: {
    flexDirection: "row",
    gap: notificationSpacing.md,
    marginTop: 4,
  },
  weatherMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weatherMetricText: {
    fontSize: 11,
    color: notificationColors.textSecondary,
  },
  // Market
  marketCropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: notificationSpacing.sm,
    marginTop: 2,
  },
  cropDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cropName: {
    fontSize: 12,
    fontWeight: "700",
    color: notificationColors.text,
  },
  cropPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: notificationColors.market,
    marginLeft: "auto",
  },
  // Category
  categoryPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: notificationRadius.pill,
  },
  categoryPillTextSmall: {
    fontSize: 10,
    fontWeight: "700",
  },
  // Skeleton
  skeletonContainer: {
    gap: notificationSpacing.sm,
    padding: notificationSpacing.lg,
  },
  skeletonCard: {
    backgroundColor: "#E2E8F0",
    borderRadius: notificationRadius.xl,
    height: 100,
    width: "100%",
  },
  // Empty
  premiumEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: notificationSpacing.lg,
    padding: notificationSpacing.xxl,
  },
  premiumEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: notificationColors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumEmptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: notificationColors.text,
  },
  premiumEmptyText: {
    fontSize: 14,
    color: notificationColors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: notificationSpacing.sm,
    padding: notificationSpacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: notificationColors.card,
    borderRadius: notificationRadius.lg,
    padding: notificationSpacing.md,
    alignItems: "center",
    gap: notificationSpacing.xs,
    borderWidth: 1,
    ...notificationShadow.soft,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: notificationColors.text,
  },
});
