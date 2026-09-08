import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type NavItem = { key: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; activeIcon: keyof typeof MaterialCommunityIcons.glyphMap };
type Props = { active: string; onSelect: (key: string) => void; variant?: "farmer" | "buyer" };
const FARMER_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home-variant" },
  { key: "predict", label: "Predict", icon: "chart-line-variant", activeIcon: "chart-areaspline" },
  { key: "alerts", label: "Alerts", icon: "bell-outline", activeIcon: "bell" },
  { key: "profile", label: "Profile", icon: "account-outline", activeIcon: "account" },
];
const BUYER_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home-variant" },
  { key: "trade", label: "Trade", icon: "handshake-outline", activeIcon: "handshake" },
  { key: "alerts", label: "Alerts", icon: "bell-outline", activeIcon: "bell" },
  { key: "profile", label: "Profile", icon: "account-outline", activeIcon: "account" },
];

export function FloatingBottomNav({ active, onSelect, variant = "farmer" }: Props) {
  const { colors, shadows } = useTheme().theme;
  const items = variant === "buyer" ? BUYER_ITEMS : FARMER_ITEMS;
  return <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}><View style={styles.inner}>{items.map((item) => <NavButton key={item.key} item={item} selected={item.key === active} onPress={() => onSelect(item.key)} colors={colors} />)}</View></View>;
}

function NavButton({ item, selected, onPress, colors }: { item: NavItem; selected: boolean; onPress: () => void; colors: any }) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => { Animated.spring(progress, { toValue: selected ? 1 : 0, damping: 15, stiffness: 190, mass: .7, useNativeDriver: true }).start(); }, [selected, progress]);
  return <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={.82} accessibilityLabel={item.label}>
    <Animated.View style={[styles.iconWrap, { backgroundColor: selected ? colors.primary : "transparent", transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}><MaterialCommunityIcons name={selected ? item.activeIcon : item.icon} size={22} color={selected ? colors.primaryContrast : colors.textMuted} /></Animated.View>
    <Text style={[styles.label, { color: selected ? colors.primary : colors.textMuted }, selected && styles.activeLabel]}>{item.label}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 14, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 8, borderWidth: 1 },
  inner: { flexDirection: "row", justifyContent: "space-between" },
  item: { flex: 1, alignItems: "center", gap: 2 },
  iconWrap: { width: 40, height: 38, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  activeLabel: { fontWeight: "900" },
});
