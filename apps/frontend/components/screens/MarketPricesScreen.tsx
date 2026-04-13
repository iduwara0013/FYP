import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getLiveMarketPrices,
    type LiveMarketPriceBulletin,
    type LiveMarketPriceEntry,
    type LiveMarketPriceResponse,
} from "../../lib/spring-api";

const comparisonMarkets = [
  {
    key: "pettah",
    name: "Pettah",
  },
  {
    key: "marandagahamula",
    name: "Marandagahamula",
  },
] as const;

function isBeansRow(entry: LiveMarketPriceEntry) {
  return /beans|peliyagoda/i.test(`${entry.cropName} ${entry.rawText}`);
}

function isOrangeRow(entry: LiveMarketPriceEntry) {
  return /^orange\b/i.test(entry.cropName.trim());
}

function isSecondTableStartRow(entry: LiveMarketPriceEntry) {
  return /^(beans?|carrot|leeks?|beet\s*root|raddish|cabbage|tomato|ladies\s*fingers|brinjals|capsicum|pumpkin|cucumber|bitter\s*gourd|snake\s*gourd|drumstick|luffa|long\s*beans|ash\s*plantains|green\s*chillies|lime|sweet\s*potato|manioc|eggplant|potato|banana|ambula|kolikuttu|seeni|anamalu|papaya|passion\s*fruits?|pineapple|mango|woodapple|avocado|orange)\b/i.test(
    entry.cropName.trim(),
  );
}

function splitEntriesByWordLayout(entries: LiveMarketPriceEntry[]) {
  const secondTableStartIndex = entries.findIndex(isSecondTableStartRow);

  if (secondTableStartIndex === -1) {
    return {
      firstTableEntries: entries,
      secondTableEntries: [],
    };
  }

  return {
    firstTableEntries: entries.slice(0, secondTableStartIndex),
    secondTableEntries: entries.slice(secondTableStartIndex),
  };
}

function splitEntryValues(entry: LiveMarketPriceEntry) {
  const range = entry.prices[0] ?? entry.displayPrice ?? "-";
  const average = entry.prices[1] ?? entry.prices[0] ?? "-";
  const change = entry.prices[2] ?? "-";

  return { range, average, change };
}

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

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return selectedEntries;
    }

    return selectedEntries.filter((entry) => {
      const haystack = [
        entry.cropName,
        entry.displayPrice,
        entry.rawText,
        ...(entry.prices ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedEntries]);

  const { firstTableEntries, secondTableEntries } = useMemo(
    () => splitEntriesByWordLayout(filteredEntries),
    [filteredEntries],
  );

  const spotlightEntry = useMemo(() => {
    return firstTableEntries[0] ?? null;
  }, [firstTableEntries]);

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

  const renderTableRow = (item: LiveMarketPriceEntry, keyPrefix: string) => {
    const highlighted = isBeansRow(item);
    const values = splitEntryValues(item);

    return (
      <View
        key={`${selectedBulletin?.date ?? "bulletin"}-${keyPrefix}-${item.rowNumber}`}
        style={[styles.tableRow, highlighted && styles.tableRowHighlighted]}
      >
        <View style={styles.itemCell}>
          <Text style={styles.itemName}>{item.cropName}</Text>
        </View>

        {comparisonMarkets.map((market) => (
          <View
            key={`${selectedBulletin?.date ?? "bulletin"}-${keyPrefix}-${item.rowNumber}-${market.key}`}
            style={styles.marketGroup}
          >
            <View style={styles.marketColumn}>
              <Text style={styles.marketCellText}>{values.range}</Text>
            </View>
            <View style={styles.marketColumn}>
              <Text style={styles.marketCellText}>{values.average}</Text>
            </View>
            <View style={styles.marketColumn}>
              <Text style={styles.marketCellText}>{values.change}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBlob} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHome}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#0F172A"
            />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={22}
              color="#B45309"
            />
          </View>
        </View>

        <Text style={styles.title}>Market Prices</Text>
        <Text style={styles.subtitle}>
          A cleaner HARTI bulletin view with the first report table up front and
          a complete crop list below.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroLabel}>Selected bulletin</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {selectedBulletin?.date ??
                  marketData?.bulletinDate ??
                  "Latest available PDF"}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color="#C47F00" />
            ) : (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadMarketPrices}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color="#C47F00"
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {marketData?.bulletins?.length ?? 0} days
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {selectedBulletin?.success
                  ? "Read successfully"
                  : "Unread or empty"}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryMeta}>
            Source: {marketData?.sourceUrl ?? "harti.gov.lk"}
          </Text>
          {marketData?.fetchedAt ? (
            <Text style={styles.summaryMeta}>
              Updated:{" "}
              {new Date(marketData.fetchedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.pdfButton}
            onPress={() =>
              openPdf(selectedBulletin?.url ?? marketData?.bulletinUrl)
            }
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.pdfButtonText}>Open selected PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchCard}>
          <MaterialCommunityIcons name="magnify" size={20} color="#B45309" />
          <TextInput
            placeholder="Search crop name"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#B45309"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.archiveHeader}>
          <View>
            <Text style={styles.sectionTitle}>10-day PDF archive</Text>
            <Text style={styles.sectionSubTitle}>
              Tap a day to switch the bulletin and view its extracted prices.
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.archiveRow}
        >
          {bulletins.map((bulletin) => {
            const isSelected = bulletin.date === selectedBulletin?.date;
            return (
              <TouchableOpacity
                key={`${bulletin.date}-${bulletin.url}`}
                style={[
                  styles.archiveCard,
                  isSelected && styles.archiveCardSelected,
                ]}
                activeOpacity={0.86}
                onPress={() => setSelectedBulletinDate(bulletin.date)}
              >
                <View style={styles.archiveCardTopRow}>
                  <Text
                    style={[
                      styles.archiveDate,
                      isSelected && styles.archiveDateSelected,
                    ]}
                  >
                    {bulletin.date}
                  </Text>
                  <View
                    style={[
                      styles.archiveDot,
                      bulletin.success
                        ? styles.archiveDotSuccess
                        : styles.archiveDotMuted,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.archiveLabel,
                    isSelected && styles.archiveLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {bulletin.label}
                </Text>
                <Text style={styles.archiveCount}>
                  {bulletin.lineCount ?? 0} rows
                </Text>
                <Text style={styles.archiveMeta} numberOfLines={2}>
                  {bulletin.message ??
                    (bulletin.success ? "Readable PDF" : "Not readable")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={22}
              color="#B45309"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#C47F00" />
            <Text style={styles.loadingText}>
              Reading the latest bulletin PDF...
            </Text>
          </View>
        ) : firstTableEntries.length ? (
          <View style={styles.entriesWrap}>
            <View style={styles.entriesHeader}>
              <View>
                <Text style={styles.sectionTitle}>First table</Text>
                <Text style={styles.sectionSubTitle}>
                  {firstTableEntries.length} rows shown for the rice and staple
                  price section.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.smallPdfButton}
                onPress={() => openPdf(selectedBulletin?.url)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="open-in-new"
                  size={16}
                  color="#B45309"
                />
              </TouchableOpacity>
            </View>

            {spotlightEntry ? (
              <View style={styles.spotlightCard}>
                <View style={styles.spotlightTopRow}>
                  <View>
                    <Text style={styles.spotlightLabel}>Spotlight row</Text>
                    <Text style={styles.spotlightTitle}>
                      {spotlightEntry.cropName}
                    </Text>
                  </View>
                  <View style={styles.spotlightChip}>
                    <Text style={styles.spotlightChipText}>Beans</Text>
                  </View>
                </View>
                <Text style={styles.spotlightMeta} numberOfLines={2}>
                  Table-style view matching the first bulletin screenshot, with
                  the original row order preserved.
                </Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View style={styles.reportTable}>
                <View style={styles.tableHeaderRow}>
                  <View style={styles.itemHeaderCell}>
                    <Text style={styles.tableHeaderText}>Item</Text>
                  </View>
                  {comparisonMarkets.map((market) => (
                    <View
                      key={`${selectedBulletin?.date ?? "bulletin"}-${market.key}`}
                      style={styles.marketHeaderGroup}
                    >
                      <Text style={styles.marketHeaderTitle}>
                        {market.name}
                      </Text>
                      <View style={styles.marketHeaderSubRow}>
                        <Text style={styles.marketHeaderSubText}>Range</Text>
                        <Text style={styles.marketHeaderSubText}>Average</Text>
                        <Text style={styles.marketHeaderSubText}>Change *</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.tableBody}>
                  {firstTableEntries.map((item) =>
                    renderTableRow(item, "table-1"),
                  )}
                </View>
              </View>
            </ScrollView>

            {secondTableEntries.length ? (
              <View style={styles.entriesHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Second table</Text>
                  <Text style={styles.sectionSubTitle}>
                    Vegetable and fruit prices shown as the second table in the
                    document.
                  </Text>
                </View>
              </View>
            ) : null}

            {secondTableEntries.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tableScrollContent}
              >
                <View style={styles.reportTable}>
                  <View style={styles.tableHeaderRow}>
                    <View style={styles.itemHeaderCell}>
                      <Text style={styles.tableHeaderText}>Variety</Text>
                    </View>
                    {comparisonMarkets.map((market) => (
                      <View
                        key={`${selectedBulletin?.date ?? "bulletin"}-second-${market.key}`}
                        style={styles.marketHeaderGroup}
                      >
                        <Text style={styles.marketHeaderTitle}>
                          {market.name}
                        </Text>
                        <View style={styles.marketHeaderSubRow}>
                          <Text style={styles.marketHeaderSubText}>Range</Text>
                          <Text style={styles.marketHeaderSubText}>
                            Average
                          </Text>
                          <Text style={styles.marketHeaderSubText}>
                            Change *
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.tableBody}>
                    {secondTableEntries.map((item) =>
                      renderTableRow(item, "table-2"),
                    )}
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={28}
              color="#64748B"
            />
            <Text style={styles.emptyTitle}>No matching crop found</Text>
            <Text style={styles.emptyText}>
              Try a different crop name or select another bulletin from the
              archive above.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8EF",
  },
  topBlob: {
    position: "absolute",
    top: -90,
    left: -55,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.14)",
  },
  backButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    lineHeight: 22,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#B45309",
    marginBottom: 6,
    fontWeight: "800",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  metaPillText: {
    color: "#9A3412",
    fontWeight: "700",
    fontSize: 12,
  },
  summaryMeta: {
    color: "#64748B",
    marginBottom: 4,
  },
  pdfButton: {
    marginTop: 16,
    backgroundColor: "#C47F00",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pdfButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    paddingVertical: 0,
  },
  archiveHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  sectionSubTitle: {
    color: "#64748B",
    lineHeight: 20,
  },
  archiveRow: {
    gap: 12,
    paddingVertical: 8,
    paddingBottom: 2,
  },
  archiveCard: {
    width: 165,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  archiveCardSelected: {
    borderColor: "rgba(196, 127, 0, 0.6)",
    backgroundColor: "#FFF8E8",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  archiveCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  archiveDate: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  archiveDateSelected: {
    color: "#9A3412",
  },
  archiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  archiveDotSuccess: {
    backgroundColor: "#16A34A",
  },
  archiveDotMuted: {
    backgroundColor: "#94A3B8",
  },
  archiveLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  archiveLabelSelected: {
    color: "#7C2D12",
  },
  archiveCount: {
    marginTop: 6,
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "700",
  },
  archiveMeta: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },
  errorCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.18)",
    marginTop: 14,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: "#9A3412",
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },
  entriesWrap: {
    marginTop: 18,
    gap: 12,
  },
  entriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  smallPdfButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  spotlightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(196, 127, 0, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  spotlightTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  spotlightLabel: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  spotlightTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  spotlightChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  spotlightChipText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
  },
  spotlightMeta: {
    marginTop: 10,
    color: "#64748B",
    lineHeight: 20,
  },
  tableScrollContent: {
    paddingBottom: 2,
  },
  reportTable: {
    minWidth: 840,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  varietyHeaderCell: {
    width: 180,
  },
  tableHeaderCell: {
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.18)",
  },
  tableHeaderText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  tableHeaderGroup: {
    width: 104,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.18)",
    gap: 3,
  },
  tableHeaderDate: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
  },
  tableHeaderMarket: {
    color: "#334155",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  tableBody: {
    backgroundColor: "#FFFFFF",
  },
  itemHeaderCell: {
    width: 160,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(15, 23, 42, 0.14)",
  },
  marketHeaderGroup: {
    flex: 1,
    minWidth: 320,
    borderRightWidth: 1,
    borderRightColor: "rgba(15, 23, 42, 0.14)",
  },
  marketHeaderTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.14)",
  },
  marketHeaderSubRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.14)",
  },
  marketHeaderSubText: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    borderRightWidth: 1,
    borderRightColor: "rgba(15, 23, 42, 0.14)",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  tableRowHighlighted: {
    backgroundColor: "rgba(196, 127, 0, 0.08)",
  },
  itemCell: {
    width: 160,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.14)",
    justifyContent: "center",
  },
  itemName: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  marketGroup: {
    flex: 1,
    minWidth: 320,
    flexDirection: "row",
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.14)",
  },
  marketColumn: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.14)",
  },
  marketCellText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  fullListCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  simpleTable: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  simpleTableHeader: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
  },
  simpleHeaderText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  simpleTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  simpleCropCol: {
    width: 220,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.14)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  simpleCropTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  simpleCropMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  simpleValuesWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  simpleValuesText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  simpleRawText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  entryHeaderTextWrap: {
    flex: 1,
    gap: 4,
  },
  entryIndex: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },
  entryCrop: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  priceBadgeText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  priceChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  priceChipText: {
    color: "#C2410C",
    fontWeight: "800",
  },
  rawText: {
    color: "#64748B",
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.12)",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 21,
  },
});
