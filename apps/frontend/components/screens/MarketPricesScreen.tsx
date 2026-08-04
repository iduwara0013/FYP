import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getLiveMarketPrices,
  type LiveMarketPriceBulletin,
  type LiveMarketPriceEntry,
  type LiveMarketPriceResponse,
} from "../../lib/spring-api";
import { CategoryAccordion } from "../market/CategoryAccordion";
import { EmptyState } from "../market/EmptyState";
import { LoadingSkeleton } from "../market/LoadingSkeleton";
import { MarketHeader } from "../market/MarketHeader";
import { MarketSelector } from "../market/MarketSelector";
import { MarketSummaryCard } from "../market/MarketSummaryCard";
import { ProductBottomSheet } from "../market/ProductBottomSheet";
import { SearchBar } from "../market/SearchBar";
import { buildReportSections } from "../market/reportGroups";
import { colors, radius, shadow, spacing } from "../market/theme";
import type { CategoryKey, ParsedEntry } from "../market/types";

/* ------------------------------------------------------------------ */
/* Markets & categories                                                */
/* ------------------------------------------------------------------ */

const comparisonMarkets = [
  { key: "pettah", name: "Pettah", tint: "#2E7D32", soft: "#E8F5E9" },
  {
    key: "marandagahamula",
    name: "Marandagahamula",
    tint: "#0E7490",
    soft: "#ECFEFF",
  },
] as const;

type MarketMeta = (typeof comparisonMarkets)[number];

const categoryMeta: Record<
  CategoryKey,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  grains: { label: "Rice & grains", icon: "grain" },
  vegetables: { label: "Vegetables", icon: "carrot" },
  fruits: { label: "Fruits", icon: "fruit-cherries" },
  other: { label: "Other items", icon: "basket-outline" },
};

const filterChips = [
  { key: "all", label: "All" },
  { key: "grains", label: "Rice & grains" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
] as const;

type FilterKey = (typeof filterChips)[number]["key"];

const sortChips = [
  { key: "default", label: "Bulletin order", icon: "sort-variant" },
  { key: "priceHigh", label: "Highest price", icon: "cash-multiple" },
  { key: "name", label: "A – Z", icon: "sort-alphabetical-ascending" },
] as const;

type SortKey = (typeof sortChips)[number]["key"];

const FRUIT_PATTERN =
  /(banana|ambula|kolikuttu|seeni|anamalu|papaya|passion|pine\s*apple|pineapple|mango|wood\s*apple|woodapple|avocado|orange|lime|guava|rambutan|mangosteen|melon|grape|apple|beli|anoda|nelli|dates)/i;

const VEGETABLE_PATTERN =
  /(beans|carrot|leek|beet\s*root|raddish|radish|cabbage|tomato|ladies\s*finger|brinjal|capsicum|pumpkin|cucumber|gourd|drum\s*stick|drumstick|luffa|ash\s*plantain|chilli|chillie|sweet\s*potato|manioc|egg\s*plant|eggplant|potato|onion|knol\s*khol|dambala|thibbatu|murunga|kohila|mukunuwenna|kankun|nivithi|gotukola|leaves|spinach|ginger|garlic)/i;

const GRAIN_PATTERN =
  /(rice|paddy|samba|nadu|kekulu|maize|green\s*gram|black\s*gram|cow\s*pea|cowpea|soya|kurakkan|millet|dhal|dal|gram|sesame|ground\s*nut|groundnut|peanut|coconut|flour|sugar|wheat)/i;

function detectCategory(cropName: string): CategoryKey {
  const name = cropName.trim();
  if (GRAIN_PATTERN.test(name)) return "grains";
  if (VEGETABLE_PATTERN.test(name)) return "vegetables";
  if (FRUIT_PATTERN.test(name)) return "fruits";
  return "other";
}

/* ------------------------------------------------------------------ */
/* Price parsing – turns raw PDF text into accurate numbers            */
/* ------------------------------------------------------------------ */

type PriceCell = {
  isRange: boolean;
  signed: boolean;
  min: number | null;
  max: number | null;
  value: number | null;
};

type MarketQuote = {
  market: MarketMeta;
  min: number | null;
  max: number | null;
  average: number | null;
  change: number | null;
  averageIsEstimated: boolean;
  hasData: boolean;
};

const CELL_PATTERN =
  /(\d[\d,]*(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d[\d,]*(?:\.\d+)?)|([+-]?\d[\d,]*(?:\.\d+)?)/g;

function toNumber(raw?: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCells(entry: LiveMarketPriceEntry): PriceCell[] {
  const raw = entry.rawText?.trim();
  const source =
    raw && raw.length > 0
      ? raw
      : `${entry.cropName} ${(entry.prices ?? []).join(" ")}`;

  // Drop the crop name so letters/numbers inside it never count as a price.
  const cropIndex = source.indexOf(entry.cropName);
  const numericPart =
    cropIndex >= 0
      ? source.slice(cropIndex + entry.cropName.length)
      : source.replace(/^[^\d+-]*/, "");

  const cells: PriceCell[] = [];
  const matches = numericPart.matchAll(CELL_PATTERN);

  for (const match of matches) {
    if (match[1] && match[2]) {
      cells.push({
        isRange: true,
        signed: false,
        min: toNumber(match[1]),
        max: toNumber(match[2]),
        value: null,
      });
      continue;
    }

    const single = match[3];
    if (!single) continue;

    cells.push({
      isRange: false,
      signed: /^[+-]/.test(single),
      min: null,
      max: null,
      value: toNumber(single),
    });
  }

  if (cells.length > 0) {
    return cells;
  }

  // Last resort: use the already-extracted price strings from the API.
  return (entry.prices ?? [])
    .map((price) => toNumber(price))
    .filter((value): value is number => value !== null)
    .map((value) => ({
      isRange: false,
      signed: false,
      min: null,
      max: null,
      value,
    }));
}

function buildQuote(cells: PriceCell[], market: MarketMeta): MarketQuote {
  const range = cells.find((cell) => cell.isRange);
  const plain = cells
    .filter((cell) => !cell.isRange && !cell.signed)
    .map((cell) => cell.value)
    .filter((value): value is number => value !== null);
  const signed = cells
    .filter((cell) => !cell.isRange && cell.signed)
    .map((cell) => cell.value)
    .filter((value): value is number => value !== null);

  let min = range?.min ?? null;
  let max = range?.max ?? null;
  let leftover = plain;

  if (!range) {
    if (plain.length >= 3) {
      // e.g. "min max average"
      min = Math.min(plain[0], plain[1]);
      max = Math.max(plain[0], plain[1]);
      leftover = plain.slice(2);
    } else if (plain.length === 2) {
      min = Math.min(plain[0], plain[1]);
      max = Math.max(plain[0], plain[1]);
      leftover = [];
    } else {
      leftover = plain;
    }
  }

  let average = leftover.length > 0 ? leftover[0] : null;
  let averageIsEstimated = false;

  if (average === null && min !== null && max !== null) {
    average = (min + max) / 2;
    averageIsEstimated = true;
  }

  if (average !== null && min === null && max === null) {
    // Only a single figure was published for this market.
    min = average;
    max = average;
    averageIsEstimated = false;
  }

  if (min !== null && max !== null && min > max) {
    const swap = min;
    min = max;
    max = swap;
  }

  return {
    market,
    min,
    max,
    average,
    change: signed.length > 0 ? signed[0] : null,
    averageIsEstimated,
    hasData: average !== null || min !== null,
  };
}

function parseEntry(
  entry: LiveMarketPriceEntry,
  bulletinKey: string,
): ParsedEntry {
  const cells = extractCells(entry);
  const half = cells.length > 1 ? Math.ceil(cells.length / 2) : cells.length;

  const groups: PriceCell[][] = [cells.slice(0, half), cells.slice(half)];

  const quotes = comparisonMarkets.map((market, index) =>
    buildQuote(groups[index] ?? [], market),
  );

  const withData = quotes.filter((quote) => quote.average !== null);
  const bestQuote =
    withData.length > 0
      ? withData.reduce((best, quote) =>
          (quote.average ?? 0) > (best.average ?? 0) ? quote : best,
        )
      : null;

  let gapValue: number | null = null;
  let gapPercent: number | null = null;

  if (withData.length === 2) {
    const [first, second] = withData;
    const high = Math.max(first.average ?? 0, second.average ?? 0);
    const low = Math.min(first.average ?? 0, second.average ?? 0);
    gapValue = high - low;
    gapPercent = low > 0 ? (gapValue / low) * 100 : null;
  }

  return {
    id: `${bulletinKey}-${entry.rowNumber}-${entry.cropName}`,
    rowNumber: entry.rowNumber,
    cropName: entry.cropName.replace(/\s+/g, " ").trim(),
    category: detectCategory(entry.cropName),
    quotes,
    bestQuote,
    gapValue,
    gapPercent,
    topAverage: bestQuote?.average ?? null,
    rawText: entry.rawText ?? "",
    searchText: `${entry.cropName} ${entry.displayPrice ?? ""} ${
      entry.rawText ?? ""
    }`.toLowerCase(),
  };
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

function formatCompactMoney(value: number | null): string {
  if (value === null) return "—";
  const [whole] = value.toFixed(2).split(".");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type MarketPricesScreenProps = {
  onBackToHome: () => void;
};

export function MarketPricesScreen({ onBackToHome }: MarketPricesScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBulletinDate, setSelectedBulletinDate] = useState<
    string | null
  >(null);
  const [marketData, setMarketData] = useState<LiveMarketPriceResponse | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [activeSort, setActiveSort] = useState<SortKey>("default");
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ParsedEntry | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadMarketPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getLiveMarketPrices();
      setMarketData(response);

      const firstBulletin = response.bulletins?.[0];
      setSelectedBulletinDate(
        (current) => current ?? firstBulletin?.date ?? null,
      );

      if (!response.success || response.entries.length === 0) {
        setError(
          response.message ??
            "No structured price rows were found in the latest HARTI bulletin.",
        );
      }
    } catch (requestError) {
      setMarketData(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load market prices.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketPrices();
  }, [loadMarketPrices]);

  const bulletins = useMemo<LiveMarketPriceBulletin[]>(
    () => marketData?.bulletins ?? [],
    [marketData?.bulletins],
  );

  const selectedBulletin = useMemo(() => {
    if (!bulletins.length) {
      return null;
    }

    return (
      bulletins.find((bulletin) => bulletin.date === selectedBulletinDate) ??
      bulletins[0]
    );
  }, [bulletins, selectedBulletinDate]);

  useEffect(() => {
    if (!selectedBulletinDate && bulletins.length > 0) {
      setSelectedBulletinDate(bulletins[0].date);
    }
  }, [bulletins, selectedBulletinDate]);

  const selectedEntries = useMemo(() => {
    return selectedBulletin?.entries ?? marketData?.entries ?? [];
  }, [marketData?.entries, selectedBulletin]);

  const parsedEntries = useMemo(() => {
    const bulletinKey = selectedBulletin?.date ?? "bulletin";
    return selectedEntries.map((entry) => parseEntry(entry, bulletinKey));
  }, [selectedBulletin?.date, selectedEntries]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = parsedEntries.filter((entry) => {
      const matchesQuery =
        !normalizedQuery || entry.searchText.includes(normalizedQuery);
      const matchesCategory =
        activeFilter === "all" || entry.category === activeFilter;
      return matchesQuery && matchesCategory;
    });

    const sorted = [...filtered];

    if (activeSort === "priceHigh") {
      sorted.sort((a, b) => (b.topAverage ?? -1) - (a.topAverage ?? -1));
    } else if (activeSort === "name") {
      sorted.sort((a, b) => a.cropName.localeCompare(b.cropName));
    } else {
      sorted.sort((a, b) => a.rowNumber - b.rowNumber);
    }

    return sorted;
  }, [activeFilter, activeSort, parsedEntries, searchQuery]);

  // Pure UI grouping that reconstructs the report hierarchy:
  // Market -> Category (Rice, Imported Rice, ...) -> Products.
  const reportSections = useMemo(
    () => buildReportSections(visibleEntries),
    [visibleEntries],
  );

  const summary = useMemo(() => {
    const averages = visibleEntries
      .map((entry) => entry.topAverage)
      .filter((value): value is number => value !== null);

    const highest = visibleEntries.reduce<ParsedEntry | null>((best, entry) => {
      if (entry.topAverage === null) return best;
      if (!best || (best.topAverage ?? 0) < entry.topAverage) return entry;
      return best;
    }, null);

    const cheapest = visibleEntries.reduce<ParsedEntry | null>(
      (best, entry) => {
        if (entry.topAverage === null) return best;
        if (!best || (best.topAverage ?? 0) > entry.topAverage) return entry;
        return best;
      },
      null,
    );

    const widestGap = visibleEntries.reduce<ParsedEntry | null>(
      (best, entry) => {
        if (entry.gapPercent === null) return best;
        if (!best || (best.gapPercent ?? 0) < entry.gapPercent) return entry;
        return best;
      },
      null,
    );

    return {
      count: visibleEntries.length,
      averagePrice:
        averages.length > 0
          ? averages.reduce((sum, value) => sum + value, 0) / averages.length
          : null,
      highest,
      cheapest,
      widestGap,
    };
  }, [visibleEntries]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSectionIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }, []);

  const openPdf = useCallback(async (url?: string) => {
    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setError("Unable to open the bulletin PDF right now.");
    }
  }, []);

  const handleSelectEntry = useCallback((entry: ParsedEntry) => {
    setSelectedEntry(entry);
    setSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedEntry(null);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedBulletinDate(date);
    setSelectedEntry(null);
    setSheetVisible(false);
  }, []);

  const bulletinDates = useMemo(
    () =>
      bulletins.map((bulletin) => bulletin.date).filter(Boolean) as string[],
    [bulletins],
  );

  const selectedCategoryMeta = selectedEntry
    ? categoryMeta[selectedEntry.category]
    : null;

  const lastUpdated = marketData?.fetchedAt
    ? new Date(marketData.fetchedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  /* Market summary values are derived from the best quote of the highest-priced product in the visible set. */
  const marketSummary = useMemo(() => {
    const reference = summary.highest;
    if (!reference?.bestQuote) {
      return {
        rangeLow: null,
        rangeHigh: null,
        averageToday: null,
        averagePrevious: null,
        change: null,
      };
    }
    const quote = reference.bestQuote;
    return {
      rangeLow: quote.min ?? null,
      rangeHigh: quote.max ?? null,
      averageToday: quote.average ?? null,
      averagePrevious:
        quote.average !== null && quote.change !== null
          ? quote.average - quote.change
          : null,
      change: quote.change ?? null,
    };
  }, [summary.highest]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MarketHeader
          onBackToHome={onBackToHome}
          lastUpdated={lastUpdated}
          onRefresh={loadMarketPrices}
          refreshing={loading}
        />

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search crops..."
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Markets</Text>
            </View>

            <MarketSelector
              markets={comparisonMarkets.map((market) => market.name)}
              selected={comparisonMarkets[0].name}
              onSelect={() => {}}
            />

            <View style={styles.summarySpacing}>
              <MarketSummaryCard
                marketName={comparisonMarkets[0].name}
                rangeLow={marketSummary.rangeLow}
                rangeHigh={marketSummary.rangeHigh}
                averageToday={marketSummary.averageToday}
                averagePrevious={marketSummary.averagePrevious}
                change={marketSummary.change}
                updatedLabel={selectedBulletin?.date ?? "Latest bulletin"}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filterChips.map((chip) => {
                const active = chip.key === activeFilter;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveFilter(chip.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sortRow}>
              {sortChips.map((chip) => {
                const active = chip.key === activeSort;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setActiveSort(chip.key)}
                  >
                    <MaterialCommunityIcons
                      name={chip.icon}
                      size={13}
                      color={active ? colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sortChipText,
                        active && styles.sortChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {visibleEntries.length === 0 ? (
              <EmptyState
                title="No crops found"
                message="Try a different search or category filter."
              />
            ) : (
              <View style={styles.accordionList}>
                {reportSections.map((section) => (
                  <CategoryAccordion
                    key={section.id}
                    section={section}
                    expanded={expandedSectionIds.includes(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    onSelectProduct={handleSelectEntry}
                  />
                ))}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bulletin Archive</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.archiveRow}
            >
              {bulletinDates.map((date) => {
                const isActive = date === selectedBulletinDate;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.archiveChip,
                      isActive && styles.archiveChipActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectDate(date)}
                  >
                    <Text
                      style={[
                        styles.archiveChipText,
                        isActive && styles.archiveChipTextActive,
                      ]}
                    >
                      {date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.pdfRow}>
              <View style={styles.pdfInfo}>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.pdfText}>
                  {selectedBulletin?.date ?? "Latest bulletin"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() =>
                  openPdf(selectedBulletin?.url ?? marketData?.bulletinUrl)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.pdfButtonText}>Open PDF</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerMeta}>
              Source: {marketData?.sourceUrl ?? "harti.gov.lk"}
            </Text>
          </>
        )}
      </ScrollView>

      <ProductBottomSheet
        visible={sheetVisible}
        entry={selectedEntry}
        categoryIcon={selectedCategoryMeta?.icon ?? "sprout"}
        categoryLabel={selectedCategoryMeta?.label ?? "Crop"}
        bulletinDates={bulletinDates}
        selectedDate={selectedBulletinDate}
        onSelectDate={handleSelectDate}
        onClose={handleCloseSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  summarySpacing: {
    marginTop: spacing.md,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  sortChipTextActive: {
    color: colors.white,
  },
  accordionList: {
    gap: spacing.md,
  },
  archiveRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  archiveChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  archiveChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  archiveChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  archiveChipTextActive: {
    color: colors.white,
  },
  pdfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  pdfInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  pdfText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  pdfButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  pdfButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  footerMeta: {
    marginTop: spacing.lg,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
});
