import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    dashboardColors,
    dashboardRadius,
    dashboardShadow,
    dashboardSpacing,
} from "./theme";

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type FloatingBottomNavProps = {
  active: string;
  onSelect: (key: string) => void;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  {
    key: "predict",
    label: "Predict",
    icon: "chart-line",
    activeIcon: "chart-line",
  },
  { key: "alerts", label: "Alerts", icon: "bell-outline", activeIcon: "bell" },
  {
    key: "profile",
    label: "Profile",
    icon: "account-outline",
    activeIcon: "account",
  },
];

export function FloatingBottomNav({
  active,
  onSelect,
}: FloatingBottomNavProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.8}
              accessibilityLabel={item.label}
            >
              <View
                style={[styles.iconWrap, isActive && styles.iconWrapActive]}
              >
                <MaterialCommunityIcons
                  name={isActive ? item.activeIcon : item.icon}
                  size={22}
                  color={
                    isActive ? dashboardColors.white : dashboardColors.textMuted
                  }
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: dashboardSpacing.lg,
    right: dashboardSpacing.lg,
    bottom: dashboardSpacing.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: dashboardRadius.xl,
    paddingVertical: dashboardSpacing.sm,
    paddingHorizontal: dashboardSpacing.sm,
    ...dashboardShadow.card,
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: dashboardColors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: dashboardColors.textMuted,
  },
  labelActive: {
    color: dashboardColors.primary,
    fontWeight: "800",
  },
});
