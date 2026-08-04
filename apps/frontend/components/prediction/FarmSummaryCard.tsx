import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProfileData } from "../screens/profile-types";
import {
    predictionColors,
    predictionRadius,
    predictionShadow,
    predictionSpacing,
} from "./theme";

type FarmSummaryCardProps = {
  profile?: ProfileData | null;
  farmerRegion: string;
  farmerDistrict: string;
  farmerLandArea: string;
  farmerIrrigation: string;
  farmerExperience: string;
};

type SummaryItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

export function FarmSummaryCard({
  profile,
  farmerRegion,
  farmerDistrict,
  farmerLandArea,
  farmerIrrigation,
  farmerExperience,
}: FarmSummaryCardProps) {
  if (!profile) return null;

  const items: SummaryItem[] = [
    {
      icon: "account-circle-outline",
      label: "Farmer",
      value: profile.fullName,
    },
    {
      icon: "map-marker-outline",
      label: "Location",
      value: farmerDistrict || farmerRegion,
    },
    {
      icon: "vector-square",
      label: "Farm Size",
      value: `${farmerLandArea} ha`,
    },
    {
      icon: "water-outline",
      label: "Irrigation",
      value: farmerIrrigation,
    },
    {
      icon: "star-outline",
      label: "Experience",
      value: `${farmerExperience} yrs`,
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={18}
          color={predictionColors.primary}
        />
        <Text style={styles.title}>Farm Summary</Text>
      </View>
      <View style={styles.grid}>
        {items.slice(0, 2).map((item) => (
          <SummaryTile key={item.label} item={item} />
        ))}
      </View>
      <View style={styles.grid}>
        {items.slice(2).map((item) => (
          <SummaryTile key={item.label} item={item} />
        ))}
      </View>
    </View>
  );
}

function SummaryTile({ item }: { item: SummaryItem }) {
  return (
    <View style={styles.tile}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={item.icon}
          size={16}
          color={predictionColors.primary}
        />
      </View>
      <View style={styles.tileTextWrap}>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.tileValue} numberOfLines={1}>
          {item.value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    ...predictionShadow.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    marginBottom: predictionSpacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: predictionColors.text,
  },
  grid: {
    flexDirection: "row",
    gap: predictionSpacing.md,
    marginBottom: predictionSpacing.md,
  },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.accentSoft,
  },
  tileTextWrap: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: predictionColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tileValue: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.text,
    marginTop: 1,
  },
});
