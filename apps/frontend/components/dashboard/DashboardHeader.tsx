import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { useI18n } from "../../i18n";
import { NotificationBadge } from "../notifications/NotificationComponents";
import { dashboardRadius, dashboardShadow, dashboardSpacing } from "./theme";

type DashboardHeaderProps = {
  greeting: string;
  firstName: string;
  now: Date;
  isFarmer: boolean;
  onProfile: () => void;
  onNotifications: () => void;
  onSettings?: () => void;
  unreadCount?: number;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardHeader({
  greeting,
  firstName,
  now,
  isFarmer,
  onProfile,
  onNotifications,
  onSettings,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.infoWrap}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
            {formatDate(now)}
          </Text>
          <Text style={[styles.clock, { color: colors.text }]}>
            {formatClock(now)}
          </Text>
        </View>

        <View style={styles.actions}>
          {onSettings ? (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={onSettings}
              activeOpacity={0.8}
              accessibilityLabel="Settings"
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={onNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color={colors.text}
            />
            {unreadCount > 0 ? (
              <View style={styles.badgeContainer}>
                <NotificationBadge count={unreadCount} size="sm" />
              </View>
            ) : (
              <View
                style={[styles.badgeDot, { borderColor: colors.surface }]}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatar,
              {
                backgroundColor: isFarmer ? colors.primary : "#C47F00",
              },
            ]}
            onPress={onProfile}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
          >
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.greeting, { color: colors.text }]}>
        {greeting}, {firstName}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("todayIsGreat")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: dashboardSpacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dashboardSpacing.md,
  },
  infoWrap: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  clock: {
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: dashboardRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...dashboardShadow.soft,
  },
  badgeDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
  },
  badgeContainer: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: dashboardRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...dashboardShadow.soft,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
});
