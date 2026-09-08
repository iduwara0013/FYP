/**
 * NotificationScreen — Premium Notification Center
 *
 * Features preserved:
 *  - Unread badge count
 *  - Mark as Read / Mark All as Read
 *  - Delete individual notifications
 *  - Filter by category (Weather, Market, Prediction, Tips, News)
 *  - Notification preferences toggle panel
 *  - Test notification panel with Reset Cache
 *  - Pull to refresh
 *  - Deep link navigation on tap
 *  - Animated notification cards
 *
 * Premium UI additions:
 *  - Soft green gradient background
 *  - Greeting header with date
 *  - Statistics dashboard
 *  - Category-specific premium cards
 *  - Skeleton loading state
 *  - Premium empty state
 *  - Redesigned filter pills with icons
 *  - Premium preference cards
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../../lib/notifications/NotificationPreferences";
import {
  clearDedupCache,
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  subscribe,
} from "../../lib/notifications/NotificationService";
import {
  testAllNotifications,
  testMarketNotification,
  testNewsNotification,
  testPredictionNotification,
  testTipNotification,
  testWeatherNotification,
} from "../../lib/notifications/NotificationTest";
import {
  type AppNotification,
  type NotificationFilter,
  type NotificationPreferences,
  FILTER_CHIPS,
} from "../../lib/notifications/types";
import {
  PremiumEmptyState,
  PremiumMarketCard,
  PremiumNotificationSkeleton,
  PremiumStandardCard,
  PremiumWeatherCard,
  StatisticsDashboard,
} from "../notifications/PremiumNotificationCards";
import {
  notificationColors,
  notificationRadius,
  notificationShadow,
  notificationSpacing,
} from "../notifications/theme";
import type { ProfileData } from "./profile-types";

/* ------------------------------------------------------------------ */
/* Premium Filter Chip                                                 */
/* ------------------------------------------------------------------ */

type FilterChipProps = {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
};

const PremiumFilterChip = React.memo(function PremiumFilterChip({
  label,
  icon,
  active,
  onPress,
}: FilterChipProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      accessibilityLabel={`Filter by ${label}`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.filterChip,
          {
            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
            borderColor: active ? theme.colors.primary : theme.colors.border,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={16}
          color={
            active
              ? theme.colors.primaryContrast
              : theme.colors.textSecondary
          }
        />
        <Text
          style={[styles.filterChipText, { color: active ? theme.colors.primaryContrast : theme.colors.textSecondary }]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

/* ------------------------------------------------------------------ */
/* Premium Preference Card                                             */
/* ------------------------------------------------------------------ */

type PreferenceCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  color: string;
};

const PremiumPreferenceCard = React.memo(function PremiumPreferenceCard({
  icon,
  label,
  description,
  value,
  onToggle,
  color,
}: PreferenceCardProps) {
  const { theme } = useTheme();
  const knobPos = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(knobPos, {
      toValue: value ? 1 : 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [value, knobPos]);

  return (
    <View style={[styles.prefCard, { borderBottomColor: theme.colors.border }]}> 
      <View style={[styles.prefIconWrap, { backgroundColor: color + "1A" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.prefTextWrap}>
        <Text style={[styles.prefLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.prefDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggle, { backgroundColor: value ? theme.colors.primary : theme.colors.surfaceSecondary }]}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityLabel={`Toggle ${label}`}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      >
        <Animated.View
          style={[
            styles.toggleKnob,
            { backgroundColor: theme.colors.primaryContrast },
            {
              transform: [
                {
                  translateX: knobPos.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* NotificationScreen                                                  */
/* ------------------------------------------------------------------ */

type NotificationScreenProps = {
  profile: ProfileData;
  onBackToHome: () => void;
  onDeepLink?: (deepLink: string) => void;
};

export function NotificationScreen({
  profile,
  onBackToHome,
  onDeepLink,
}: NotificationScreenProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);

  const userId = profile.id ?? profile.email;
  const headerAnim = React.useRef(new Animated.Value(0)).current;

  // Animate header on mount
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  /* --- Subscribe to notification updates ---------------------------- */
  useEffect(() => {
    const unsubscribe = subscribe((updated) => {
      setNotifications(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  /* --- Fetch notifications on mount --------------------------------- */
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      await fetchNotifications(userId);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  /* --- Fetch preferences -------------------------------------------- */
  const loadPreferences = useCallback(async () => {
    try {
      setPrefLoading(true);
      const prefs = await getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch {
      // Non-fatal
    } finally {
      setPrefLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  /* --- Handlers ------------------------------------------------------ */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadPreferences()]);
    setRefreshing(false);
  }, [loadNotifications, loadPreferences]);

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      if (!notification.read) {
        void markAsRead(notification.id);
      }
      if (notification.deepLink && onDeepLink) {
        onDeepLink(notification.deepLink);
      }
    },
    [onDeepLink],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, []);

  const handleTestNotification = useCallback(
    async (
      type: "weather" | "market" | "tips" | "prediction" | "news" | "all",
    ) => {
      setTesting(true);
      try {
        switch (type) {
          case "weather":
            await testWeatherNotification(userId);
            break;
          case "market":
            await testMarketNotification(userId);
            break;
          case "tips":
            await testTipNotification(userId);
            break;
          case "prediction":
            await testPredictionNotification(userId);
            break;
          case "news":
            await testNewsNotification(userId);
            break;
          case "all":
            await testAllNotifications(userId);
            break;
        }
      } catch {
        // Non-fatal
      } finally {
        setTesting(false);
      }
    },
    [userId],
  );

  const handleClearCache = useCallback(async () => {
    await clearDedupCache();
  }, []);

  const handleTogglePreference = useCallback(
    async (key: keyof NotificationPreferences) => {
      if (!preferences) return;
      const updated = { ...preferences, [key]: !preferences[key] };
      setPreferences(updated);
      await saveNotificationPreferences(userId, updated);
    },
    [preferences, userId],
  );

  /* --- Filtered notifications --------------------------------------- */
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const weatherCount = useMemo(
    () => notifications.filter((n) => n.category === "weather").length,
    [notifications],
  );
  const marketCount = useMemo(
    () => notifications.filter((n) => n.category === "market").length,
    [notifications],
  );
  const predictionCount = useMemo(
    () => notifications.filter((n) => n.category === "prediction").length,
    [notifications],
  );

  /* --- Greeting ------------------------------------------------------ */
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  /* --- Render notification card ------------------------------------- */
  const renderItem = useCallback(
    ({ item, index }: { item: AppNotification; index: number }) => {
      const onPress = () => handleNotificationPress(item);

      if (item.category === "weather") {
        return (
          <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <PremiumWeatherCard notification={item} index={index} />
          </TouchableOpacity>
        );
      }
      if (item.category === "market") {
        return (
          <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <PremiumMarketCard notification={item} index={index} />
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <PremiumStandardCard notification={item} index={index} />
        </TouchableOpacity>
      );
    },
    [handleNotificationPress],
  );

  const keyExtractor = useCallback((item: AppNotification) => item.id, []);

  /* --- Filter chip icons -------------------------------------------- */
  const filterIcons: Record<NotificationFilter, string> = {
    all: "bell",
    weather: "weather-partly-cloudy",
    market: "currency-usd",
    prediction: "chart-line",
    tips: "lightbulb-on",
    news: "newspaper",
  };
  const filterLabels: Record<NotificationFilter, string> = {
    all: t("filterAll"),
    weather: t("filterWeather"),
    market: t("filterMarket"),
    prediction: t("filterPrediction"),
    tips: t("filterTips"),
    news: t("filterNews"),
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      />

      {/* Header */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        }}
      >
        <ScreenHeader
          title={t("notifications")}
          subtitle={todayDate}
          icon="bell-outline"
          onBack={onBackToHome}
          action={<View style={styles.headerRight}>
            {unreadCount > 0 ? (
              <TouchableOpacity
                style={[styles.markAllButton, { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border }]}
                onPress={handleMarkAllRead}
                activeOpacity={0.8}
                accessibilityLabel="Mark all notifications as read"
              >
                <MaterialCommunityIcons
                  name="check-all"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={[styles.markAllText, { color: theme.colors.primary }]}>{t("markAllRead")}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.prefButton, { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border }]}
              onPress={() => setShowPreferences((v) => !v)}
              activeOpacity={0.8}
              accessibilityLabel="Notification preferences"
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>

          </View>}
        />

        <View style={[styles.greetingWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.soft]}>
          <View style={[styles.summaryIcon, { backgroundColor: unreadCount > 0 ? theme.colors.primarySoft : theme.colors.successSoft }]}>
            <MaterialCommunityIcons name={unreadCount > 0 ? "bell-badge-outline" : "check-circle-outline"} size={27} color={unreadCount > 0 ? theme.colors.primary : theme.colors.success}/>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>{t("stayInformed")}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}> 
            {unreadCount > 0
              ? `${unreadCount} ${t("newUpdatesWaiting")}`
              : t("reviewedEveryUpdate")}
            </Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: theme.colors.backgroundAlt }]}> 
            <Text style={[styles.totalBadgeValue, { color: theme.colors.text }]}>{notifications.length}</Text>
            <Text style={[styles.totalBadgeLabel, { color: theme.colors.textMuted }]}>{t("total").toUpperCase()}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Statistics Dashboard */}
      {!loading && notifications.length > 0 ? (
        <StatisticsDashboard
          unreadCount={unreadCount}
          totalCount={notifications.length}
          weatherCount={weatherCount}
          marketCount={marketCount}
          predictionCount={predictionCount}
        />
      ) : null}

      {/* Preferences panel (collapsible) */}
      {showPreferences ? (
        <View style={[styles.preferencesPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.soft]}>
          <Text style={[styles.preferencesTitle, { color: theme.colors.text }]}>{t("notificationPreferences")}</Text>
          {prefLoading ? (
            <ActivityIndicator
              size="small"
              color={notificationColors.primary}
              style={styles.prefLoading}
            />
          ) : preferences ? (
            <>
              <PremiumPreferenceCard
                icon="weather-partly-cloudy"
                label={t("weatherAlerts")}
                description={t("heavyWeatherDesc")}
                value={preferences.weatherAlerts}
                onToggle={() => handleTogglePreference("weatherAlerts")}
                color={notificationColors.weather}
              />
              <PremiumPreferenceCard
                icon="currency-usd"
                label={t("marketPriceAlerts")}
                description={t("marketAlertDesc")}
                value={preferences.marketPriceAlerts}
                onToggle={() => handleTogglePreference("marketPriceAlerts")}
                color={notificationColors.market}
              />
              <PremiumPreferenceCard
                icon="lightbulb-on"
                label={t("dailyTips")}
                description={t("dailyTipsDesc")}
                value={preferences.dailyTips}
                onToggle={() => handleTogglePreference("dailyTips")}
                color={notificationColors.tips}
              />
              <PremiumPreferenceCard
                icon="chart-line"
                label={t("predictionReminders")}
                description={t("predictionReminderDesc")}
                value={preferences.predictionReminders}
                onToggle={() => handleTogglePreference("predictionReminders")}
                color={notificationColors.prediction}
              />
              <PremiumPreferenceCard
                icon="newspaper"
                label={t("newsUpdates")}
                description={t("newsUpdateDesc")}
                value={preferences.newsUpdates}
                onToggle={() => handleTogglePreference("newsUpdates")}
                color={notificationColors.news}
              />
            </>
          ) : (
            <Text style={styles.prefError}>Unable to load preferences.</Text>
          )}
        </View>
      ) : null}

      {/* Test notification panel (collapsible) */}
      {showTestPanel ? (
        <View style={[styles.testPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.soft]}>
          <Text style={[styles.testPanelTitle, { color: theme.colors.text }]}> 
            Test notifications
          </Text>
          <Text style={[styles.testPanelSubtitle, { color: theme.colors.textMuted }]}>
            {
              "Tap a button below to send a test notification of that category. If automatic notifications seem stuck, tap Reset Cache."
            }
          </Text>
          <View style={styles.testButtonRow}>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.weatherSoft },
              ]}
              onPress={() => handleTestNotification("weather")}
              disabled={testing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="weather-partly-cloudy"
                size={18}
                color={notificationColors.weather}
              />
              <Text
                style={[
                  styles.testBtnText,
                  { color: notificationColors.weather },
                ]}
              >
                Weather
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.marketSoft },
              ]}
              onPress={() => handleTestNotification("market")}
              disabled={testing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="currency-usd"
                size={18}
                color={notificationColors.market}
              />
              <Text
                style={[
                  styles.testBtnText,
                  { color: notificationColors.market },
                ]}
              >
                Market
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.tipsSoft },
              ]}
              onPress={() => handleTestNotification("tips")}
              disabled={testing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={18}
                color={notificationColors.tips}
              />
              <Text
                style={[styles.testBtnText, { color: notificationColors.tips }]}
              >
                Tips
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testButtonRow}>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.predictionSoft },
              ]}
              onPress={() => handleTestNotification("prediction")}
              disabled={testing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={18}
                color={notificationColors.prediction}
              />
              <Text
                style={[
                  styles.testBtnText,
                  { color: notificationColors.prediction },
                ]}
              >
                Prediction
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.newsSoft },
              ]}
              onPress={() => handleTestNotification("news")}
              disabled={testing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="newspaper"
                size={18}
                color={notificationColors.news}
              />
              <Text
                style={[styles.testBtnText, { color: notificationColors.news }]}
              >
                News
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testBtn,
                { backgroundColor: notificationColors.primary },
              ]}
              onPress={() => handleTestNotification("all")}
              disabled={testing}
              activeOpacity={0.8}
            >
              {testing ? (
                <ActivityIndicator
                  size="small"
                  color={notificationColors.primaryContrast}
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="bell-ring-outline"
                    size={18}
                    color={notificationColors.primaryContrast}
                  />
                  <Text
                    style={[
                      styles.testBtnText,
                      { color: notificationColors.primaryContrast },
                    ]}
                  >
                    Send All
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.clearCacheButton}
            onPress={handleClearCache}
            activeOpacity={0.8}
            accessibilityLabel="Reset notification cache"
          >
            <MaterialCommunityIcons
              name="broom"
              size={16}
              color={notificationColors.textSecondary}
            />
            <Text style={styles.clearCacheText}>Reset Notification Cache</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Filter chips */}
      <View style={styles.listHeadingRow}>
        <View>
          <Text style={[styles.listHeading, { color: theme.colors.text }]}>{t("recentUpdates")}</Text>
          <Text style={[styles.listSubheading, { color: theme.colors.textMuted }]}>{t("tapUpdateDetails")}</Text>
        </View>
        <View style={[styles.resultCount, { backgroundColor: theme.colors.primarySoft }]}> 
          <Text style={[styles.resultCountText, { color: theme.colors.primary }]}>{filteredNotifications.length}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_CHIPS.map((chip) => (
          <PremiumFilterChip
            key={chip.key}
            label={filterLabels[chip.key]}
            icon={filterIcons[chip.key]}
            active={chip.key === activeFilter}
            onPress={() => setActiveFilter(chip.key)}
          />
        ))}
      </ScrollView>

      {/* Notification list */}
      {loading ? (
        <PremiumNotificationSkeleton />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={notificationColors.primary}
              colors={[notificationColors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<PremiumEmptyState />}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={8}
        />
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: notificationColors.background,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: notificationSpacing.lg,
    paddingTop: notificationSpacing.lg,
    marginBottom: notificationSpacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: notificationSpacing.sm,
    paddingHorizontal: notificationSpacing.md,
    paddingVertical: notificationSpacing.sm,
    borderRadius: notificationRadius.pill,
    backgroundColor: notificationColors.card,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.soft,
  },
  backButtonText: {
    color: notificationColors.text,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: notificationSpacing.sm,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: notificationSpacing.md,
    paddingVertical: notificationSpacing.sm,
    borderRadius: notificationRadius.pill,
    backgroundColor: notificationColors.card,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.soft,
  },
  markAllText: {
    color: notificationColors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  prefButton: {
    width: 40,
    height: 40,
    borderRadius: notificationRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: notificationColors.card,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.soft,
  },
  testButton: {
    backgroundColor: notificationColors.primary,
    borderColor: notificationColors.primary,
  },
  // Greeting
  greetingWrap: {
    marginHorizontal: notificationSpacing.lg,
    marginTop: notificationSpacing.lg,
    marginBottom: notificationSpacing.md,
    padding: 18,
    borderWidth: 1,
    borderRadius: notificationRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: notificationSpacing.md,
  },
  summaryIcon: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1 },
  totalBadge: { minWidth: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  totalBadgeValue: { fontSize: 18, fontWeight: "900", lineHeight: 21 },
  totalBadgeLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  greeting: {
    fontSize: 18,
    fontWeight: "900",
    color: notificationColors.text,
  },
  dateText: {
    fontSize: 13,
    color: notificationColors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: notificationColors.textSecondary,
    marginTop: 2,
  },
  // Preferences
  preferencesPanel: {
    marginHorizontal: notificationSpacing.lg,
    marginBottom: notificationSpacing.md,
    backgroundColor: notificationColors.card,
    borderRadius: notificationRadius.xl,
    padding: notificationSpacing.lg,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.card,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: notificationColors.text,
    marginBottom: notificationSpacing.md,
  },
  prefLoading: {
    marginVertical: notificationSpacing.md,
  },
  prefError: {
    color: notificationColors.danger,
    fontSize: 13,
  },
  prefCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: notificationSpacing.sm,
    gap: notificationSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prefIconWrap: {
    width: 40,
    height: 40,
    borderRadius: notificationRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  prefTextWrap: {
    flex: 1,
    gap: 2,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: notificationColors.text,
  },
  prefDescription: {
    fontSize: 12,
    color: notificationColors.textMuted,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: notificationColors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: notificationColors.primaryContrast,
    ...notificationShadow.soft,
  },
  // Test panel
  testPanel: {
    marginHorizontal: notificationSpacing.lg,
    marginBottom: notificationSpacing.md,
    backgroundColor: notificationColors.card,
    borderRadius: notificationRadius.xl,
    padding: notificationSpacing.lg,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.card,
  },
  testPanelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: notificationColors.text,
    marginBottom: 4,
  },
  testPanelSubtitle: {
    fontSize: 12,
    color: notificationColors.textMuted,
    marginBottom: notificationSpacing.md,
  },
  testButtonRow: {
    flexDirection: "row",
    gap: notificationSpacing.sm,
    marginBottom: notificationSpacing.sm,
  },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: notificationSpacing.md,
    borderRadius: notificationRadius.md,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  clearCacheButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: notificationSpacing.sm,
    marginTop: notificationSpacing.xs,
    borderRadius: notificationRadius.md,
    backgroundColor: "#F1F5F9",
  },
  clearCacheText: {
    fontSize: 12,
    fontWeight: "600",
    color: notificationColors.textSecondary,
  },
  // Filters
  filterRow: {
    gap: notificationSpacing.sm,
    paddingHorizontal: notificationSpacing.lg,
    paddingTop: notificationSpacing.sm,
    paddingBottom: notificationSpacing.md,
    marginBottom: notificationSpacing.sm,
  },
  listHeadingRow: {
    paddingHorizontal: notificationSpacing.lg,
    marginTop: notificationSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeading: { fontSize: 17, fontWeight: "900" },
  listSubheading: { marginTop: 2, fontSize: 11.5 },
  resultCount: { minWidth: 34, height: 28, paddingHorizontal: 10, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  resultCountText: { fontSize: 12, fontWeight: "900" },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: notificationRadius.pill,
    backgroundColor: notificationColors.card,
    borderWidth: 1,
    borderColor: notificationColors.border,
    ...notificationShadow.soft,
  },
  filterChipActive: {
    backgroundColor: notificationColors.primary,
    borderColor: notificationColors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: notificationColors.textSecondary,
  },
  filterChipTextActive: {
    color: notificationColors.primaryContrast,
  },
  // List
  listContent: {
    paddingHorizontal: notificationSpacing.lg,
    paddingTop: notificationSpacing.xs,
    paddingBottom: 48,
  },
});
