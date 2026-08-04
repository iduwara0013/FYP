import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { derivePreviousAverage } from "./reportGroups";
import { colors, radius, shadow, spacing } from "./theme";
import {
  formatCompactMoney,
  getChangeColor,
  getChangeIcon,
  type ParsedEntry,
} from "./types";

type TabKey = "overview" | "markets" | "history" | "insights";

const TAB_LABELS: {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: "overview", label: "Overview", icon: "chart-timeline-variant" },
  { key: "markets", label: "Markets", icon: "storefront" },
  { key: "history", label: "History", icon: "calendar-clock" },
  { key: "insights", label: "Insights", icon: "lightbulb-on-outline" },
];

type ProductBottomSheetProps = {
  visible: boolean;
  entry: ParsedEntry | null;
  categoryIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  categoryLabel: string;
  bulletinDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onClose: () => void;
};

export function ProductBottomSheet({
  visible,
  entry,
  categoryIcon,
  categoryLabel,
  bulletinDates,
  selectedDate,
  onSelectDate,
  onClose,
}: ProductBottomSheetProps) {
  const translateY = useRef(new Animated.Value(900)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (visible) {
      setActiveTab("overview");
      translateY.setValue(900);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 900,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={categoryIcon}
                size={26}
                color={colors.primary}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.categoryLabel}>{categoryLabel}</Text>
              <Text style={styles.cropName} numberOfLines={1}>
                {entry.cropName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={close}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            {TAB_LABELS.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {activeTab === "overview" ? <OverviewTab entry={entry} /> : null}
            {activeTab === "markets" ? <MarketsTab entry={entry} /> : null}
            {activeTab === "history" ? (
              <HistoryTab
                bulletinDates={bulletinDates}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
              />
            ) : null}
            {activeTab === "insights" ? <InsightsTab entry={entry} /> : null}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function OverviewTab({ entry }: { entry: ParsedEntry }) {
  const quote = entry.bestQuote;
  const average = quote?.average ?? null;
  const change = quote?.change ?? null;
  const previous = derivePreviousAverage(average, change);
  const changeColor = getChangeColor(change);
  const changeIcon = getChangeIcon(change);

  return (
    <View style={styles.gapWrap}>
      <View style={styles.priceHero}>
        <Text style={styles.priceLabel}>Current Price</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>
            Rs {formatCompactMoney(average)}
          </Text>
          <Text style={styles.priceUnit}>/kg</Text>
        </View>
        <View
          style={[styles.changeChip, { backgroundColor: changeColor + "1A" }]}
        >
          <MaterialCommunityIcons
            name={changeIcon}
            size={14}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {change === null
              ? "No price reported"
              : `${change > 0 ? "+" : ""}${change.toFixed(2)} vs previous`}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatTile
          label="Previous"
          value={`Rs ${formatCompactMoney(previous)}`}
        />
        <StatTile
          label="Lowest"
          value={`Rs ${formatCompactMoney(quote?.min ?? null)}`}
        />
        <StatTile
          label="Highest"
          value={`Rs ${formatCompactMoney(quote?.max ?? null)}`}
        />
        <StatTile
          label="Range"
          value={`${formatCompactMoney(quote?.min ?? null)} - ${formatCompactMoney(quote?.max ?? null)}`}
        />
      </View>

      <View style={styles.metaCard}>
        <MetaRow
          icon="storefront"
          label="Market"
          value={quote?.market.name ?? "Unavailable"}
        />
        <MetaRow icon="shape-outline" label="Category" value={entry.category} />
        <MetaRow
          icon="calendar-today"
          label="Bulletin"
          value={entry.rawText ? "Latest report" : "Unavailable"}
        />
      </View>

      {entry.rawText ? (
        <View style={styles.rawBox}>
          <Text style={styles.rawTitle}>Original bulletin line</Text>
          <Text style={styles.rawText}>{entry.rawText.trim()}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MarketsTab({ entry }: { entry: ParsedEntry }) {
  return (
    <View style={styles.gapWrap}>
      <Text style={styles.sectionLabel}>Swipe to compare markets</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.marketCarousel}
      >
        {entry.quotes.map((quote) => {
          const change = quote.change ?? null;
          const changeColor = getChangeColor(change);
          const changeIcon = getChangeIcon(change);
          const isBest = entry.bestQuote?.market.key === quote.market.key;
          return (
            <View
              key={quote.market.key}
              style={[styles.marketCard, isBest && styles.marketCardBest]}
            >
              <View style={styles.marketCardHeader}>
                <Text style={styles.marketCardName}>{quote.market.name}</Text>
                {isBest ? (
                  <View style={styles.bestBadge}>
                    <MaterialCommunityIcons
                      name="star"
                      size={10}
                      color={colors.white}
                    />
                    <Text style={styles.bestBadgeText}>Best</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.marketStatBlock}>
                <Text style={styles.marketStatLabel}>Range</Text>
                <Text style={styles.marketStatValue}>
                  {formatCompactMoney(quote.min)} -{" "}
                  {formatCompactMoney(quote.max)}
                </Text>
              </View>
              <View style={styles.marketStatBlock}>
                <Text style={styles.marketStatLabel}>Today</Text>
                <Text
                  style={[styles.marketStatValue, { color: colors.primary }]}
                >
                  {formatCompactMoney(quote.average)}
                </Text>
              </View>
              <View style={styles.marketStatBlock}>
                <Text style={styles.marketStatLabel}>Previous</Text>
                <Text style={styles.marketStatValue}>
                  {formatCompactMoney(
                    derivePreviousAverage(quote.average, quote.change),
                  )}
                </Text>
              </View>
              <View
                style={[
                  styles.changeChip,
                  { backgroundColor: changeColor + "1A" },
                ]}
              >
                <MaterialCommunityIcons
                  name={changeIcon}
                  size={12}
                  color={changeColor}
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {change === null
                    ? "No change data"
                    : `${change > 0 ? "+" : ""}${change.toFixed(2)}`}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function HistoryTab({
  bulletinDates,
  selectedDate,
  onSelectDate,
}: {
  bulletinDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  return (
    <View style={styles.gapWrap}>
      <Text style={styles.sectionLabel}>Select a bulletin date</Text>
      <View style={styles.dateChips}>
        {bulletinDates.map((date) => {
          const active = date === selectedDate;
          return (
            <TouchableOpacity
              key={date}
              style={[styles.dateChip, active && styles.dateChipActive]}
              activeOpacity={0.8}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  active && styles.dateChipTextActive,
                ]}
              >
                {date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.historyNote}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={colors.textMuted}
        />
        <Text style={styles.historyNoteText}>
          Selecting a date reloads this product’s price values from that
          bulletin.
        </Text>
      </View>
    </View>
  );
}

function InsightsTab({ entry }: { entry: ParsedEntry }) {
  const insights: string[] = [];
  const withData = entry.quotes.filter((q) => q.average !== null);

  if (entry.bestQuote) {
    insights.push(
      `${entry.bestQuote.market.name} currently has the highest average price for ${entry.cropName}.`,
    );
  }
  if (entry.gapValue !== null && entry.gapPercent !== null) {
    insights.push(
      `${entry.gapValue.toFixed(2)} gap between markets (${entry.gapPercent.toFixed(1)}% difference).`,
    );
  }
  for (const quote of entry.quotes) {
    if (quote.average === null) {
      insights.push(
        `No prices were reported for ${entry.cropName} in ${quote.market.name}.`,
      );
    } else if (quote.change !== null && quote.change < 0) {
      insights.push(
        `${entry.cropName} dropped by ${Math.abs(quote.change).toFixed(2)} in ${quote.market.name} compared to the previous report.`,
      );
    } else if (quote.change !== null && quote.change > 0) {
      insights.push(
        `${entry.cropName} rose by ${quote.change.toFixed(2)} in ${quote.market.name} compared to the previous report.`,
      );
    }
  }
  if (insights.length === 0 && withData.length === 0) {
    insights.push(
      `No price data is available for ${entry.cropName} in the selected bulletin.`,
    );
  }

  return (
    <View style={styles.gapWrap}>
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightRow}>
          <View style={styles.insightIcon}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={16}
              color={colors.primary}
            />
          </View>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileLabel}>{label}</Text>
      <Text style={styles.statTileValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    ...shadow.card,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  headerTextWrap: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cropName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  gapWrap: {
    gap: spacing.lg,
  },
  priceHero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.soft,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: spacing.sm,
  },
  priceValue: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.text,
  },
  priceUnit: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  changeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statTile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statTileValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  metaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  rawBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rawTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rawText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  marketCarousel: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  marketCard: {
    width: 210,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  marketCardBest: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  marketCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  marketCardName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  bestBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  marketStatBlock: {
    marginBottom: spacing.md,
  },
  marketStatLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  marketStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  dateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: colors.white,
  },
  historyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  historyNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    fontWeight: "500",
  },
});
