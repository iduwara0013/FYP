import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useI18n } from "../../i18n";
import { useTheme } from "@/context/ThemeContext";
import {
  AgentCropRecommendation,
  AgentRecommendationResponse,
  runAgentRecommendation,
} from "../../lib/agent-api";
import {
  confirmCropPlan,
  simulateCropChoice,
  WhatIfResult,
} from "../../lib/aiService";
import { ChatBot } from "../chat/ChatBot";
import { toCropOptionFromAgent } from "../../lib/cropConverters";
import type { CropOption } from "../../lib/plan-types";
import {
  predictionColors,
  createPredictionPalette,
  predictionRadius,
  predictionShadow,
  predictionSpacing,
} from "../prediction/theme";
import { ProfileData } from "./profile-types";

type AgenticRecommendationScreenProps = {
  profile?: ProfileData | null;
  onBackToHome: () => void;
  onViewPlan?: (option: CropOption) => void;
};

function seasonFromDate(): "Yala" | "Maha" {
  const month = new Date().getMonth() + 1; // 1-12
  return [10, 11, 12, 1, 2, 3].includes(month) ? "Maha" : "Yala";
}

function resolveDistrict(profile?: ProfileData | null): string {
  const raw = profile?.region?.trim();
  if (!raw) return "Kandy";
  const known = [
    "Nuwara Eliya",
    "Badulla",
    "Kandy",
    "Gampaha",
    "Kalutara",
    "Ratnapura",
    "Kurunegala",
  ];
  return known.find((d) => d.toLowerCase() === raw.toLowerCase()) ?? "Kandy";
}

function resolveLandArea(profile?: ProfileData | null): number {
  if (profile?.role === "farmer" && profile.totalLandArea) {
    return profile.totalLandArea;
  }
  return 1.0;
}

function resolveIrrigation(profile?: ProfileData | null): boolean {
  if (profile?.role === "farmer") {
    return profile.hasIrrigation ?? true;
  }
  return true;
}
function CropRecommendationCard({
  rec,
  rank,
  onRefresh,
}: {
  rec: AgentCropRecommendation;
  rank: number;
  onRefresh: () => void;
}) {
  const renderFactorBar = (label: string, value: number, color: string) => (
    <View style={styles.factorRow}>
      <Text style={styles.factorLabel}>{label}</Text>
      <View style={styles.factorTrack}>
        <View
          style={[
            styles.factorFill,
            {
              width: `${Math.max(0, Math.min(100, value))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.factorValue}>{Math.round(value)}</Text>
    </View>
  );

  const factorColor = (level: string) =>
    level === "High"
      ? predictionColors.danger
      : level === "Medium"
        ? predictionColors.warning
        : predictionColors.success;

  return (
    <View style={styles.cropCard}>
      <View style={styles.cropCardHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.cropTitleWrap}>
          <Text style={styles.cropName}>{rec.cropName}</Text>
          <Text style={styles.cropScore}>
            Score: {rec.recommendationScore}/100
          </Text>
        </View>
        <MaterialCommunityIcons
          name="leaf"
          size={26}
          color={predictionColors.primary}
        />
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="scale-balance" size={18} color={predictionColors.primary} />
          <Text style={styles.metricLabel}>Expected Yield</Text>
          <Text style={styles.metricValue}>
            {rec.predictedYieldTPerHa != null ? `${rec.predictedYieldTPerHa} T/ha` : "N/A"}
          </Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="cash" size={18} color={predictionColors.primary} />
          <Text style={styles.metricLabel}>Expected Revenue</Text>
          <Text style={styles.metricValue}>
            {rec.expectedGrossRevenueRs != null
              ? `Rs. ${rec.expectedGrossRevenueRs.toLocaleString("en-US")}`
              : "N/A"}
          </Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="swap-horizontal" size={18} color={predictionColors.primary} />
          <Text style={styles.metricLabel}>Demand/Supply Gap</Text>
          <Text style={styles.metricValue}>
            {rec.demandGapTonnes != null
              ? `${rec.demandGapTonnes > 0 ? "+" : ""}${rec.demandGapTonnes} t`
              : "N/A"}
          </Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="account-group" size={18} color={factorColor(rec.competitionLevel)} />
          <Text style={styles.metricLabel}>Competition</Text>
          <Text style={[styles.metricValue, { color: factorColor(rec.competitionLevel) }]}>
            {rec.competitionLevel}
          </Text>
        </View>
      </View>

      <View style={styles.factorSection}>
        <Text style={styles.factorTitle}>Factor Breakdown</Text>
        {renderFactorBar("Yield", rec.factors?.yieldScore ?? 0, predictionColors.success)}
        {renderFactorBar("Price", rec.factors?.priceScore ?? 0, predictionColors.primary)}
        {renderFactorBar("Demand", rec.factors?.demandScore ?? 0, predictionColors.info)}
        {renderFactorBar("Supply Gap", rec.factors?.supplyGapScore ?? 0, predictionColors.accent)}
        {renderFactorBar("Competition", rec.factors?.competitionScore ?? 0, predictionColors.warning)}
        {renderFactorBar("Weather", rec.factors?.weatherScore ?? 0, predictionColors.gold)}
      </View>

      <View style={styles.riskRow}>
        <View style={[styles.riskChip, { backgroundColor: factorColor(rec.riskLevel) + "1A" }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color={factorColor(rec.riskLevel)} />
          <Text style={[styles.riskChipText, { color: factorColor(rec.riskLevel) }]}>
            Risk: {rec.riskLevel}
          </Text>
        </View>
        <View style={styles.weatherChip}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={15} color={predictionColors.info} />
          <Text style={styles.weatherChipText}>Weather: {rec.weatherSuitability}%</Text>
        </View>
      </View>

      {rec.explanation ? (
        <View style={styles.explanationBox}>
          <MaterialCommunityIcons name="brain" size={18} color={predictionColors.primaryDark} />
          <Text style={styles.explanationText}>{rec.explanation}</Text>
        </View>
      ) : null}

      {onRefresh ? (
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={18} color={predictionColors.white} />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function AgenticRecommendationScreen({
  profile,
  onBackToHome,
  onViewPlan,
}: AgenticRecommendationScreenProps) {
  const { t, language } = useI18n();
  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentRecommendationResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await runAgentRecommendation({
        farmer_id: profile?.id,
        region: resolveDistrict(profile),
        district: resolveDistrict(profile),
        land_area_ha: resolveLandArea(profile),
        has_irrigation: resolveIrrigation(profile),
        season: seasonFromDate(),
        year: new Date().getFullYear(),
      });
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load recommendations. Ensure the agent server is running on port 5001.",
      );
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");

  const district = resolveDistrict(profile);
  const season = seasonFromDate();
  const year = new Date().getFullYear();
    const top = result?.top_crops?.[0] ?? null;
  const landArea = resolveLandArea(profile);
  const hasIrrigation = resolveIrrigation(profile);
  const seedCrops = useMemo(
    () => (result?.top_crops ?? []).map(toCropOptionFromAgent),
    [result],
  );

  const edgeSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.moveX < 28 && gestureState.dx > 22 && Math.abs(gestureState.dy) < 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.moveX < 40 && gestureState.dx > 50 && Math.abs(gestureState.dy) < 30) {
        onBackToHome();
      }
    },
  });

  const runWhatIf = useCallback(async () => {
    if (!top) return;
    setConfirmMsg("");
    try {
      const sim = await simulateCropChoice({
        cropId: top.cropName,
        cultivatedArea: landArea,
        season,
        location: district,
        district,
        hasIrrigation,
        farmerId: profile?.id,
        language: language === "si" ? "si" : "en",
      });
      setWhatIf(sim);
    } catch (e) {
      setConfirmMsg(e instanceof Error ? e.message : "Simulation failed.");
    }
  }, [top, profile, landArea, hasIrrigation, district, season, language]);

  const runConfirm = useCallback(async () => {
    if (!top) return;
    if (!profile?.id) {
      setConfirmMsg("Please log in to confirm a crop plan.");
      return;
    }
    setConfirming(true);
    setConfirmMsg("");
    try {
      const res = await confirmCropPlan({
        farmerId: profile.id,
        cropId: top.cropName,
        season,
        year,
        cultivatedArea: landArea,
        location: district,
        district,
        hasIrrigation,
      });
      setConfirmMsg(
        res.firestoreSaved
          ? res.neo4jSynced
            ? "Crop plan saved and synced."
            : "Crop plan saved."
          : res.message,
      );
    } catch (e) {
      // Best-effort: if the backend save fails (timeout, abort, etc.) we
      // still navigate to the CropPlanScreen so the farmer can view the plan.
      console.warn("confirmCropPlan failed:", e);
    } finally {
      setConfirming(false);
      onViewPlan?.(toCropOptionFromAgent(top));
    }
  }, [top, profile, landArea, hasIrrigation, district, season, year, onViewPlan]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} {...edgeSwipeResponder.panHandlers}>
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
          <>
        <LinearGradient
          colors={["#16A34A", "#22C55E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToHome}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color={predictionColors.white}
              />
            </TouchableOpacity>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name="robot"
                size={26}
                color={predictionColors.primaryDark}
              />
            </View>
          </View>

          <Text style={styles.title}>AI Crop Recommendations</Text>
          <Text style={styles.subtitle}>
            Top 3 crops ranked by yield, revenue, demand-supply gap, competition,
            and risk — powered by a LangGraph agent.
          </Text>
                </LinearGradient>

        <View style={styles.chatSection}>
          <Text style={styles.chatSectionTitle}>{t("chatHeader")}</Text>
          <ChatBot
            profile={profile}
            seedOptions={seedCrops}
            onSelectCrop={(opt) => onViewPlan?.(opt)}
          />
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={predictionColors.primary} />
            <Text style={styles.stateText}>
              Analyzing yield, market, weather, demand and supply...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={22}
              color={predictionColors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : result && result.top_crops && result.top_crops.length > 0 ? (
          <>
            {result.top_crops.map((rec, index) => (
              <CropRecommendationCard
                key={rec.cropName}
                rec={rec}
                rank={index + 1}
                onRefresh={load}
              />
            ))}

            {top ? (
              <View style={styles.actionCard}>
                <Text style={styles.sectionTitle}>{t("cropDecisionTools")}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={runWhatIf}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="chart-line"
                      size={18}
                      color={predictionColors.white}
                    />
                    <Text style={styles.actionButtonText}>{t("cropWhatIf")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={runConfirm}
                    disabled={confirming}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={18}
                      color={predictionColors.white}
                    />
                    <Text style={styles.actionButtonText}>
                      {confirming ? t("cropSaving") : t("cropConfirm")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {whatIf ? (
                  <View style={styles.simulationBox}>
                    <Text style={styles.simulationTitle}>
                      {t("cropSimulation")} — {whatIf.cropName}
                    </Text>
                    <Text style={styles.simulationLine}>
                      {t("cropDemand")}:{" "}
                      {Math.max(0, whatIf.before.gap + whatIf.before.supply).toFixed(
                        0,
                      )}{" "}
                      t · {t("cropSupply")}: {whatIf.before.supply.toFixed(1)} →{" "}
                      {whatIf.after.supply.toFixed(1)} t · {t("cropGap")}:{" "}
                      {whatIf.before.gap > 0 ? "+" : ""}
                      {whatIf.before.gap.toFixed(1)} →{" "}
                      {whatIf.after.gap > 0 ? "+" : ""}
                      {whatIf.after.gap.toFixed(1)} t
                    </Text>
                    <Text style={styles.simulationLine}>
                      Score: {whatIf.before.score} → {whatIf.after.score} ·{" "}
                      {t("cropCompetition")}: {whatIf.before.competition} →{" "}
                      {whatIf.after.competition}
                    </Text>
                    <Text style={styles.simulationMessage}>{whatIf.message}</Text>
                  </View>
                ) : null}

                {confirmMsg ? (
                  <Text style={styles.confirmText}>{confirmMsg}</Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.stateBox}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={40}
              color={predictionColors.textMuted}
            />
            <Text style={styles.stateText}>No recommendations available.</Text>
          </View>
        )}
                      </>
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: predictionColors.background,
  },
  chatSection: {
    marginTop: predictionSpacing.md,
    marginBottom: predictionSpacing.lg,
  },
  chatSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: predictionColors.textSecondary,
    marginBottom: predictionSpacing.sm,
  },
  scrollContent: {
    paddingHorizontal: predictionSpacing.lg,
    paddingTop: predictionSpacing.lg,
    paddingBottom: predictionSpacing.xxl,
  },
  hero: {
    borderRadius: predictionRadius.xl,
    padding: predictionSpacing.xl,
    marginBottom: predictionSpacing.lg,
    ...predictionShadow.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: predictionSpacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: predictionColors.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.92)",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.xxl,
    ...predictionShadow.soft,
  },
  stateText: {
    marginTop: predictionSpacing.lg,
    fontSize: 15,
    fontWeight: "700",
    color: predictionColors.text,
    textAlign: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.dangerSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: predictionSpacing.sm,
    borderRadius: predictionRadius.sm,
    backgroundColor: predictionColors.danger,
  },
  retryButtonText: {
    color: predictionColors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cropCard: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    marginBottom: predictionSpacing.lg,
    ...predictionShadow.soft,
  },
  cropCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: predictionSpacing.md,
  },
  rankBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: predictionColors.primary,
    marginRight: predictionSpacing.md,
  },
  rankText: {
    color: predictionColors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  cropTitleWrap: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: "800",
    color: predictionColors.text,
  },
  cropScore: {
    marginTop: 2,
    fontSize: 12,
    color: predictionColors.textSecondary,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: predictionSpacing.sm,
  },
  metric: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 11,
    color: predictionColors.textMuted,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
    color: predictionColors.text,
  },
  factorSection: {
    marginTop: predictionSpacing.lg,
  },
  factorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: predictionColors.textSecondary,
    marginBottom: predictionSpacing.sm,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: predictionSpacing.sm,
    marginBottom: predictionSpacing.xs,
  },
  factorLabel: {
    width: 82,
    fontSize: 11,
    color: predictionColors.textSecondary,
  },
  factorTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: predictionColors.border,
    overflow: "hidden",
  },
  factorFill: {
    height: 8,
    borderRadius: 4,
  },
  factorValue: {
    width: 28,
    fontSize: 11,
    fontWeight: "700",
    color: predictionColors.text,
    textAlign: "right",
  },
  riskRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: predictionSpacing.sm,
    marginTop: predictionSpacing.lg,
  },
  riskChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: predictionRadius.pill,
  },
  riskChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: predictionRadius.pill,
    backgroundColor: predictionColors.infoSoft,
  },
  weatherChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.info,
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.accentSoft,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    marginTop: predictionSpacing.lg,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: predictionColors.textSecondary,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.primary,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    marginTop: predictionSpacing.lg,
  },
  refreshButtonText: {
    color: predictionColors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  actionCard: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    marginTop: predictionSpacing.md,
    ...predictionShadow.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: predictionColors.text,
    marginBottom: predictionSpacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: predictionSpacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: predictionColors.info,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  saveButton: {
    backgroundColor: predictionColors.success,
  },
  actionButtonText: {
    color: predictionColors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  simulationBox: {
    marginTop: predictionSpacing.md,
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  simulationTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: predictionColors.text,
    marginBottom: 4,
  },
  simulationLine: {
    fontSize: 12,
    color: predictionColors.textSecondary,
    lineHeight: 18,
  },
  simulationMessage: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: predictionColors.info,
  },
  confirmText: {
    marginTop: predictionSpacing.md,
    fontSize: 13,
    fontWeight: "700",
    color: predictionColors.success,
  },
});

