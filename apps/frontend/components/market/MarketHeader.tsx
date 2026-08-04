import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, radius, shadow, spacing } from "./theme";

type MarketHeaderProps = {
  onBackToHome: () => void;
  lastUpdated: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function MarketHeader({
  onBackToHome,
  lastUpdated,
  refreshing,
  onRefresh,
}: MarketHeaderProps) {
  return (
    <View>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHome}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.greetingWrap}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.title}>Today’s Market Prices</Text>
          {lastUpdated ? (
            <View style={styles.updatedRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={11}
                color={colors.textMuted}
              />
              <Text style={styles.updatedText}>Last updated {lastUpdated}</Text>
            </View>
          ) : null}
        </View>

        {onRefresh ? (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
            disabled={refreshing}
          >
            <MaterialCommunityIcons
              name={refreshing ? "loading" : "refresh"}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.refreshButton}>
            <MaterialCommunityIcons
              name="sprout"
              size={18}
              color={colors.primary}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    ...shadow.soft,
  },
  greetingWrap: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  updatedText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    ...shadow.soft,
  },
});
