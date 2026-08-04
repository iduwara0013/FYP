import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  type BuyerSummary,
  type FarmerSummary,
  getBuyers,
  getFarmers,
} from "../../lib/spring-api";

type PersonCard = {
  id: string;
  type: "buyer" | "farmer";
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  region: string;
  code: string;
  subtitle: string;
  details: string[];
  roleLabel: string;
  roleColor: string;
  roleBg: string;
  icon: string;
};

type BuyersScreenProps = {
  onBackToHome: () => void;
  userRegion?: string;
};

function formatRegion(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Unknown region";
  return normalized;
}

function buildBuyerCard(buyer: BuyerSummary): PersonCard {
  const details: string[] = [];
  if (buyer.region) details.push(buyer.region);
  if (buyer.phone_number) details.push(buyer.phone_number);
  if (buyer.email) details.push(buyer.email);
  if (buyer.organization_name) details.push(buyer.organization_name);
  if (buyer.preferred_crop) details.push(`Prefers: ${buyer.preferred_crop}`);
  if (buyer.required_quantity != null)
    details.push(`Needs: ${buyer.required_quantity} kg`);

  return {
    id: buyer.id,
    type: "buyer",
    full_name: buyer.full_name || "Unnamed buyer",
    phone_number: buyer.phone_number,
    email: buyer.email,
    address: buyer.address,
    region: buyer.region,
    code: buyer.buyer_code,
    subtitle: buyer.buyer_type ? `Buyer type: ${buyer.buyer_type}` : "Buyer",
    details,
    roleLabel: "Buyer",
    roleColor: "#4338CA",
    roleBg: "#E0E7FF",
    icon: "storefront-outline",
  };
}

function buildFarmerCard(farmer: FarmerSummary): PersonCard {
  const details: string[] = [];
  if (farmer.region) details.push(farmer.region);
  if (farmer.phone_number) details.push(farmer.phone_number);
  if (farmer.email) details.push(farmer.email);
  if (farmer.farmer_type) details.push(`Type: ${farmer.farmer_type}`);
  if (farmer.total_land_area != null)
    details.push(`Land: ${farmer.total_land_area} ha`);
  if (farmer.experience_years != null)
    details.push(`Experience: ${farmer.experience_years} yrs`);
  if (farmer.has_irrigation) details.push("Irrigation available");

  return {
    id: farmer.id,
    type: "farmer",
    full_name: farmer.full_name || "Unnamed farmer",
    phone_number: farmer.phone_number,
    email: farmer.email,
    address: farmer.address,
    region: farmer.region,
    code: farmer.farmer_code,
    subtitle: farmer.farmer_type
      ? `Farmer type: ${farmer.farmer_type}`
      : "Farmer",
    details,
    roleLabel: "Farmer",
    roleColor: "#15803D",
    roleBg: "#DCFCE7",
    icon: "sprout",
  };
}

export function BuyersScreen({ onBackToHome, userRegion }: BuyersScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<PersonCard[]>([]);

  const loadPeople = useCallback(async () => {
    try {
      setError("");
      const [buyers, farmers] = await Promise.all([getBuyers(), getFarmers()]);

      const buyerCards = (Array.isArray(buyers) ? buyers : []).map(
        buildBuyerCard,
      );
      const farmerCards = (Array.isArray(farmers) ? farmers : []).map(
        buildFarmerCard,
      );

      setPeople([...buyerCards, ...farmerCards]);
    } catch (requestError) {
      setPeople([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load buyers and farmers right now.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPeople();
  }, [loadPeople]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPeople();
  }, [loadPeople]);

  const regionFilter = useMemo(
    () => formatRegion(userRegion ?? ""),
    [userRegion],
  );

  const filteredPeople = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return people.filter((person) => {
      if (regionFilter && person.region !== regionFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        person.full_name,
        person.email,
        person.phone_number,
        person.region,
        person.subtitle,
        person.code,
        person.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [people, searchQuery, regionFilter]);

  const renderPersonCard = ({ item }: { item: PersonCard }) => {
    return (
      <View style={styles.personCard}>
        <View style={styles.personHeaderRow}>
          <View style={[styles.personAvatar, { backgroundColor: item.roleBg }]}>
            <MaterialCommunityIcons
              name={item.icon as never}
              size={22}
              color={item.roleColor}
            />
          </View>
          <View style={styles.personHeaderInfo}>
            <Text style={styles.personName}>{item.full_name}</Text>
            <View style={styles.codeChipRow}>
              <View style={[styles.codeChip, { backgroundColor: item.roleBg }]}>
                <Text style={[styles.codeChipText, { color: item.roleColor }]}>
                  {item.code || "No code"}
                </Text>
              </View>
              <View style={[styles.typeChip, { backgroundColor: item.roleBg }]}>
                <Text style={[styles.typeChipText, { color: item.roleColor }]}>
                  {item.roleLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={16}
              color="#B45309"
            />
            <Text style={styles.detailText}>
              {item.region || "Region not specified"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="phone" size={16} color="#B45309" />
            <Text style={styles.detailText}>
              {item.phone_number || "No phone"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="email" size={16} color="#B45309" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.email || "No email"}
            </Text>
          </View>
          {item.details.slice(3).map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#B45309"
              />
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBlob} />
      <FlatList
        data={filteredPeople}
        keyExtractor={(item) => item.id}
        renderItem={renderPersonCard}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
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
                  name="account-group-outline"
                  size={22}
                  color="#C47F00"
                />
              </View>
            </View>

            <Text style={styles.title}>People Directory</Text>
            <Text style={styles.subtitle}>
              {regionFilter
                ? `Showing buyers and farmers from ${regionFilter}.`
                : "Browse registered buyers and farmers in your region."}
            </Text>

            <View style={styles.searchCard}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#B45309"
              />
              <TextInput
                placeholder="Search name, region, crop, or code"
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

            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillText}>
                  {filteredPeople.length} result
                  {filteredPeople.length === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                activeOpacity={0.85}
                disabled={loading || refreshing}
              >
                {loading || refreshing ? (
                  <ActivityIndicator color="#C47F00" size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color="#C47F00"
                  />
                )}
              </TouchableOpacity>
            </View>

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
                <Text style={styles.loadingText}>Loading people...</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={28}
                color="#64748B"
              />
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Try a different search term or clear the filter."
                  : regionFilter
                    ? `No buyers or farmers found in ${regionFilter}.`
                    : "Registered people will appear here once they sign up."}
              </Text>
            </View>
          )
        }
      />
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    paddingVertical: 0,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  summaryPillText: {
    color: "#9A3412",
    fontWeight: "700",
    fontSize: 12,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
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
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },
  personCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 14,
  },
  personHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  personHeaderInfo: {
    flex: 1,
    gap: 6,
  },
  personName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  codeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  codeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailGrid: {
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    flex: 1,
    color: "#334155",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 6,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
