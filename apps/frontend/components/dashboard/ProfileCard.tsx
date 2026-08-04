import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ProfileData } from "../screens/profile-types";
import {
  dashboardColors,
  dashboardRadius,
  dashboardShadow,
  dashboardSpacing,
} from "./theme";

type ProfileCardProps = {
  profile?: ProfileData | null;
  onPress: () => void;
};

type MetaItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

export function ProfileCard({ profile, onPress }: ProfileCardProps) {
  if (!profile) return null;

  const isFarmer = profile.role === "farmer";
  const accentColor = isFarmer ? dashboardColors.primary : "#C47F00";

  const metaItems: MetaItem[] = isFarmer
    ? [
        {
          icon: "badge-account-outline",
          label: "Farmer Code",
          value: profile.farmerCode ?? "—",
        },
        { icon: "tag-outline", label: "Type", value: profile.farmerType },
        {
          icon: "vector-square",
          label: "Land",
          value:
            profile.totalLandArea != null ? `${profile.totalLandArea} ha` : "—",
        },
        {
          icon: "star-outline",
          label: "Experience",
          value:
            profile.experienceYears != null
              ? `${profile.experienceYears} yrs`
              : "—",
        },
        {
          icon: "water-outline",
          label: "Irrigation",
          value: profile.hasIrrigation ? "Irrigated" : "Rainfed",
        },
        { icon: "map-marker-outline", label: "Region", value: profile.region },
      ]
    : [
        {
          icon: "office-building-outline",
          label: "Organization",
          value: profile.organizationName ?? "—",
        },
        { icon: "tag-outline", label: "Type", value: profile.buyerType },
        {
          icon: "sprout-outline",
          label: "Preferred Crop",
          value: profile.preferredCrop ?? "—",
        },
        {
          icon: "scale",
          label: "Required Qty",
          value:
            profile.requiredQuantity != null
              ? `${profile.requiredQuantity} kg`
              : "—",
        },
        {
          icon: "warehouse",
          label: "Storage",
          value: profile.hasStorage ? "Yes" : "No",
        },
        {
          icon: "truck-outline",
          label: "Transport",
          value: profile.hasTransport ? "Yes" : "No",
        },
        { icon: "map-marker-outline", label: "Region", value: profile.region },
      ];

  return (
    <View style={[styles.card, { backgroundColor: accentColor }]}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons
            name={isFarmer ? "account" : "storefront-outline"}
            size={26}
            color={accentColor}
          />
        </View>
        <View style={styles.nameWrap}>
          <Text style={styles.name}>{profile.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {isFarmer ? "Farmer Profile" : "Buyer Profile"}
            </Text>
          </View>
        </View>
        <View style={styles.editButton}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={dashboardColors.white}
          />
        </View>
      </View>

      <View style={styles.grid}>
        {metaItems.map((item) => (
          <View key={item.label} style={styles.tile}>
            <MaterialCommunityIcons
              name={item.icon}
              size={14}
              color="rgba(255,255,255,0.9)"
            />
            <View style={styles.tileText}>
              <Text style={styles.tileLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.tileValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: dashboardRadius.xl,
    padding: dashboardSpacing.xl,
    marginBottom: dashboardSpacing.lg,
    ...dashboardShadow.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: dashboardSpacing.md,
    marginBottom: dashboardSpacing.lg,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: dashboardColors.white,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: dashboardRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  roleText: {
    color: dashboardColors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: dashboardSpacing.sm,
  },
  tile: {
    flexBasis: "31%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: dashboardRadius.md,
    padding: dashboardSpacing.sm,
  },
  tileText: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tileValue: {
    fontSize: 11,
    fontWeight: "800",
    color: dashboardColors.white,
    marginTop: 1,
  },
});
