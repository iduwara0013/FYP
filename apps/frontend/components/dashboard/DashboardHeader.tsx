import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    dashboardColors,
    dashboardRadius,
    dashboardShadow,
    dashboardSpacing,
} from "./theme";

type DashboardHeaderProps = {
  greeting: string;
  firstName: string;
  now: Date;
  isFarmer: boolean;
  onProfile: () => void;
  onNotifications: () => void;
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
}: DashboardHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.infoWrap}>
          <Text style={styles.eyebrow}>{formatDate(now)}</Text>
          <Text style={styles.clock}>{formatClock(now)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color={dashboardColors.text}
            />
            <View style={styles.badgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatar,
              {
                backgroundColor: isFarmer ? dashboardColors.primary : "#C47F00",
              },
            ]}
            onPress={onProfile}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
          >
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={dashboardColors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.greeting}>
        {greeting}, {firstName}
      </Text>
      <Text style={styles.subtitle}>Today is a great day for farming.</Text>
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
    color: dashboardColors.textSecondary,
    textTransform: "capitalize",
  },
  clock: {
    fontSize: 22,
    fontWeight: "800",
    color: dashboardColors.text,
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
    backgroundColor: dashboardColors.card,
    ...dashboardShadow.soft,
  },
  badgeDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardColors.danger,
    borderWidth: 1.5,
    borderColor: dashboardColors.white,
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
    color: dashboardColors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: dashboardColors.textSecondary,
  },
});
