import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { derivePreviousAverage, type ReportSection } from "./reportGroups";
import { colors, radius, shadow, spacing } from "./theme";
import {
    formatCompactMoney,
    getChangeColor,
    getChangeIcon,
    type MarketQuote,
    type ParsedEntry,
} from "./types";

type CategoryAccordionProps = {
  section: ReportSection;
  expanded: boolean;
  onToggle: () => void;
  onSelectProduct: (entry: ParsedEntry) => void;
};

export function CategoryAccordion({
  section,
  expanded,
  onToggle,
  onSelectProduct,
}: CategoryAccordionProps) {
  const heightAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [expanded, heightAnim]);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={onToggle}
      >
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name={section.icon}
            size={18}
            color={colors.primary}
          />
        </View>
        <Text style={styles.headerTitle}>{section.name}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{section.products.length}</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.body,
          {
            maxHeight: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10000],
            }),
            opacity: heightAnim,
          },
        ]}
      >
        {section.products.map((entry) => (
          <ProductRow
            key={entry.id}
            entry={entry}
            onPress={() => onSelectProduct(entry)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

type ProductRowProps = {
  entry: ParsedEntry;
  onPress: () => void;
};

function ProductRow({ entry, onPress }: ProductRowProps) {
  const quote: MarketQuote | null = entry.bestQuote;
  const average = quote?.average ?? null;
  const change = quote?.change ?? null;
  const previous = derivePreviousAverage(average, change);
  const rangeLow = quote?.min ?? null;
  const rangeHigh = quote?.max ?? null;
  const changeColor = getChangeColor(change);
  const changeIcon = getChangeIcon(change);

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.cropName}
        </Text>
        <Text style={styles.rowRange}>
          Range {formatCompactMoney(rangeLow)} - {formatCompactMoney(rangeHigh)}
        </Text>
      </View>

      <View style={styles.rowStats}>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatLabel}>Today</Text>
          <Text style={[styles.rowStatValue, { color: colors.primary }]}>
            {formatCompactMoney(average)}
          </Text>
        </View>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatLabel}>Previous</Text>
          <Text style={styles.rowStatValue}>
            {formatCompactMoney(previous)}
          </Text>
        </View>
        <View style={styles.rowStat}>
          <MaterialCommunityIcons
            name={changeIcon}
            size={13}
            color={changeColor}
          />
          <Text style={[styles.rowStatChange, { color: changeColor }]}>
            {change === null
              ? "—"
              : `${change > 0 ? "+" : ""}${change.toFixed(2)}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  countPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  body: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLeft: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  rowRange: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textMuted,
  },
  rowStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowStat: {
    alignItems: "center",
    minWidth: 48,
  },
  rowStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  rowStatValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  rowStatChange: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
});
