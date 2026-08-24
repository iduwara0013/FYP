import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/context/ThemeContext";
import {
  getCropPlansForFarmer,
  type SavedCropPlan,
} from "@/lib/spring-api";
import type { ProfileData } from "./profile-types";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  profile: ProfileData | null;
  onBack: () => void;
};

export function GrowingPlansScreen({ profile, onBack }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [plans, setPlans] = useState<SavedCropPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlans = useCallback(async () => {
    if (!profile?.id) {
      setError("Farmer profile not found. Please sign in again.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      setPlans(await getCropPlansForFarmer(profile.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load growing plans.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.page, { backgroundColor: colors.background }]}> 
      <ScreenHeader title="Growing plans" subtitle={`Saved for ${profile?.fullName ?? "this farmer"}`} icon="sprout" onBack={onBack} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlans} tintColor={colors.primary} />}
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!error && plans.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}> 
              <MaterialCommunityIcons name="sprout-outline" size={46} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved plans yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Choose a crop in Crop Recommendation and tap Confirm plan.</Text>
            </View>
          ) : null}

          {plans.map((plan) => (
            <View key={plan.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, theme.shadows.soft]}> 
              <View style={styles.cardHeader}>
                <View style={[styles.cropIcon, { backgroundColor: colors.primary + "18" }]}>
                  <MaterialCommunityIcons name="sprout" size={25} color={colors.primary} />
                </View>
                <View style={styles.cropCopy}>
                  <Text style={[styles.cropName, { color: colors.text }]}>{plan.cropName || plan.cropId}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{plan.season} {plan.year} · {plan.location}</Text>
                </View>
                <View style={[styles.status, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>{plan.status ?? "active"}</Text>
                </View>
              </View>

              <View style={styles.metrics}>
                <Metric label="Cultivated area" value={`${Number(plan.cultivatedArea ?? 0).toFixed(1)} ha`} colors={colors} />
                <Metric label="Expected harvest" value={`${Number(plan.predictedProduction ?? 0).toFixed(1)} t`} colors={colors} />
                <Metric label="Irrigation" value={plan.hasIrrigation ? "Available" : "Not available"} colors={colors} />
                <Metric label="Cloud sync" value={plan.syncStatus ?? "saved"} colors={colors} />
              </View>
              {plan.createdAt ? <Text style={[styles.savedAt, { color: colors.textSecondary }]}>Saved {new Date(plan.createdAt).toLocaleDateString()}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type MetricColors = { background: string; textSecondary: string; text: string };

function Metric({ label, value, colors }: { label: string; value: string; colors: MetricColors }) {
  return <View style={[styles.metric, { backgroundColor: colors.background }]}><Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 6 },
  headerCopy: { flex: 1 }, title: { fontSize: 21, fontWeight: "800" }, subtitle: { fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40, gap: 2 },
  error: { color: "#DC2626", textAlign: "center", marginVertical: 24 },
  emptyCard: { alignItems: "center", padding: 30, borderRadius: 18, marginTop: 30 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 }, emptyText: { textAlign: "center", lineHeight: 20, marginTop: 6 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center" }, cropIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cropCopy: { flex: 1, marginLeft: 11 }, cropName: { fontSize: 18, fontWeight: "800" }, meta: { fontSize: 12, marginTop: 3 },
  status: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }, metric: { width: "48%", borderRadius: 12, padding: 11 },
  metricLabel: { fontSize: 10, textTransform: "uppercase" }, metricValue: { fontSize: 14, fontWeight: "800", marginTop: 3 }, savedAt: { fontSize: 11, marginTop: 12 },
});
