/**
 * CropPlanScreen — A synthesized growing plan for the crop the farmer chose
 * in the recommendation chatbot / screen.
 *
 * Built client-side via `buildCropPlan` (see lib/cropPlanBuilder) so there is a
 * real, shareable plan to view and confirm before sending it back to the
 * agent backend with `confirmCropPlan`.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useI18n } from "@/i18n";
import { useTheme } from "@/context/ThemeContext";
import { confirmCropPlan } from "@/lib/aiService";
import type { CropPlanDraft } from "@/lib/plan-types";
import type { ProfileData } from "@/components/screens/profile-types";
import {
  predictionColors,
  createPredictionPalette,
  predictionRadius,
  predictionShadow,
  predictionSpacing,
} from "@/components/prediction/theme";

export type CropPlanScreenProps = {
  profile?: ProfileData | null;
  plan: CropPlanDraft;
  onBack: () => void;
  alreadySaved?: boolean;
};

export function CropPlanScreen({ profile, plan, onBack, alreadySaved = false }: CropPlanScreenProps) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const colors = createPredictionPalette(isDark);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [openStage, setOpenStage] = useState<string | null>(null);

  const edgeSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.moveX < 28 && gestureState.dx > 22 && Math.abs(gestureState.dy) < 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.moveX < 40 && gestureState.dx > 50 && Math.abs(gestureState.dy) < 30) {
        onBack();
      }
    },
  });

  const handleConfirm = useCallback(async () => {
    if (!profile?.id) {
      setConfirmMsg("Please log in to confirm a crop plan.");
      return;
    }
    setConfirming(true);
    setConfirmMsg("");
    try {
      const res = await confirmCropPlan({
        farmerId: profile.id,
        cropId: plan.cropName,
        season: plan.season,
        year: plan.year,
        cultivatedArea: plan.cultivatedAreaHa,
        location: plan.location,
        district: plan.location,
        hasIrrigation: plan.hasIrrigation,
      });
      setConfirmMsg(
        res.success
          ? res.neo4jSynced
            ? "Crop plan saved and synced."
            : "Crop plan saved."
          : res.message,
      );
    } catch (e) {
      setConfirmMsg(e instanceof Error ? e.message : "Confirmation failed.");
    } finally {
      setConfirming(false);
    }
  }, [profile, plan]);

  const money = (n?: number | null) =>
    n == null ? "N/A" : `Rs. ${Math.round(n).toLocaleString("en-US")}`;

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.stat, { backgroundColor: colors.background }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
    return (
    <View style={[styles.page, { backgroundColor: colors.background }]} {...edgeSwipeResponder.panHandlers}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel={t("back")}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("planTitle")}: {plan.cropName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }] }>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("planSummary")}</Text>
          <Text style={[styles.summary, { color: colors.text }]}>{plan.summary || t("planDataEstimated")}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.infoSoft }]}><Text style={[styles.badgeText, { color: colors.info }]}>{plan.dataStatus}</Text></View>
            <View style={[styles.badge, styles.seasonBadge, { backgroundColor: colors.successSoft }]}><Text style={[styles.seasonBadgeText, { color: colors.success }]}>{plan.season} {plan.year}</Text></View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }] }>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Confirm crop plan</Text>
          <Text style={[styles.summary, { color: colors.text }]}>
            Review this plan before saving it. Confirming will store the crop plan in your account and update the shared supply forecast for this season.
          </Text>
          <View style={styles.statsRow}>
            <Stat label="Crop" value={plan.cropName} />
            <Stat label="Area" value={`${plan.cultivatedAreaHa.toFixed(1)} ha`} />
            <Stat label="Expected yield" value={`${Math.round(plan.expectedProductionTonnes ?? 0)} t`} />
            <Stat label="Est. revenue" value={money(plan.expectedRevenueRs)} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, predictionShadow.soft]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("planGrowthStages")}</Text>
          {plan.growthStages.map((stage) => (
            <View key={stage.name} style={styles.stage}>
              <TouchableOpacity
                style={styles.stageHeader}
                onPress={() => setOpenStage(openStage === stage.name ? null : stage.name)}>
                <Text style={styles.stageTitle}>{stage.name}</Text>
                <View style={styles.stageMeta}>
                  <Text style={styles.stageDuration}>{stage.durationWeeks} wks</Text>
                  <MaterialCommunityIcons
                    name={openStage === stage.name ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={predictionColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
              {openStage === stage.name ? (
                <View style={styles.stageBody}>
                  {stage.notes ? <Text style={styles.stageNotes}>{stage.notes}</Text> : null}
                  {stage.keyActivities.map((a) => (
                    <View key={a} style={styles.activity}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={predictionColors.success} />
                      <Text style={styles.activityText}>{a}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, predictionShadow.soft]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("planTimeline")}</Text>
          {plan.timeline.map((item) => (
            <View key={item.month} style={styles.timelineItem}>
              <Text style={styles.timelineMonth}>{item.month}</Text>
              <Text style={styles.timelineActivity}>{item.activity}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, predictionShadow.soft]}>
          <Text style={styles.sectionTitle}>{t("planWater")}</Text>
          <Text style={styles.note}>{plan.waterSchedule}</Text>
          <Text style={styles.sectionTitle}>{t("planFertilizer")}</Text>
          <Text style={styles.note}>{plan.fertilizerSchedule}</Text>
          <Text style={styles.sectionTitle}>{t("planPest")}</Text>
          <Text style={styles.note}>{plan.pestManagement}</Text>
          <Text style={styles.sectionTitle}>{t("planHarvest")}</Text>
          <Text style={styles.note}>{plan.harvestNotes}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, predictionShadow.soft]}>
          <Text style={styles.sectionTitle}>{t("planEconomy")}</Text>
          <View style={styles.statsRow}>
            <Stat label={t("planArea")} value={`${plan.cultivatedAreaHa} ha`} />
            <Stat label={t("planSeason")} value={`${plan.season} ${plan.year}`} />
            <Stat label={t("planLocation")} value={plan.location} />
            <Stat label={t("planIrrigation")} value={plan.hasIrrigation ? "Yes" : "No"} />
            <Stat label={t("planPredictedYield")} value={`${plan.predictedYieldTPerHa ?? "N/A"} T/ha`} />
            <Stat label={t("planProduction")} value={`${plan.expectedProductionTonnes ?? "N/A"} t`} />
            <Stat label={t("planRevenue")} value={money(plan.expectedRevenueRs)} />
            <Stat label={t("planRevenuePerHa")} value={money(plan.revenuePerHaRs)} />
            <Stat label={t("planPrice")} value={plan.marketPriceRsPerKg != null ? `Rs. ${plan.marketPriceRsPerKg}/kg` : "N/A"} />
            <Stat label={t("planScore")} value={`${Math.round(plan.recommendationScore)}/100`} />
            <Stat label={t("planWeather")} value={`${Math.round(plan.weatherSuitability)}/100`} />
            <Stat label={t("planRisk")} value={plan.riskLevel} />
            <Stat label={t("planCompetition")} value={plan.competitionLevel} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {!alreadySaved ? <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.success }]} onPress={handleConfirm} disabled={confirming} activeOpacity={0.85}>
          {confirming ? (
            <ActivityIndicator size="small" color={predictionColors.white} />
          ) : (
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={predictionColors.white} />
          )}
          <Text style={styles.confirmText}>{confirming ? t("cropSaving") : t("cropConfirm")}</Text>
        </TouchableOpacity> : (
          <View style={[styles.confirmBtn, { backgroundColor: colors.success }]}>
            <MaterialCommunityIcons name="cloud-check-outline" size={20} color={predictionColors.white} />
            <Text style={styles.confirmText}>Saved to your growing plans</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={onBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.text} />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back to recommendations</Text>
        </TouchableOpacity>
        {confirmMsg ? <Text style={[styles.confirmMsg, { color: colors.textSecondary }]}>{confirmMsg}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: predictionColors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: predictionSpacing.md,
    paddingVertical: predictionSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: predictionColors.border,
    backgroundColor: predictionColors.card,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: predictionColors.text,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    padding: predictionSpacing.md,
    paddingBottom: predictionSpacing.xxl,
  },
  card: {
    backgroundColor: predictionColors.card,
    borderRadius: predictionRadius.lg,
    padding: predictionSpacing.lg,
    marginBottom: predictionSpacing.lg,
    ...predictionShadow.soft,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: predictionColors.textSecondary,
    marginBottom: predictionSpacing.sm,
  },
  summary: { fontSize: 13, lineHeight: 19, color: predictionColors.text },
  badgeRow: { marginTop: predictionSpacing.sm, flexDirection: "row" },
  badge: {
    backgroundColor: predictionColors.infoSoft,
    borderRadius: predictionRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: predictionColors.info },
  seasonBadge: { backgroundColor: predictionColors.successSoft },
  seasonBadgeText: { fontSize: 11, fontWeight: "800", color: predictionColors.success },
  stage: { borderBottomWidth: 1, borderBottomColor: predictionColors.border },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: predictionSpacing.sm,
  },
  stageTitle: { fontSize: 14, fontWeight: "700", color: predictionColors.text },
  stageMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  stageDuration: { fontSize: 12, color: predictionColors.textMuted },
  stageBody: { paddingVertical: predictionSpacing.sm },
  stageNotes: {
    fontSize: 12,
    lineHeight: 18,
    color: predictionColors.textSecondary,
    marginBottom: 6,
  },
  activity: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  activityText: { fontSize: 12, color: predictionColors.text, flex: 1 },
  timelineItem: { flexDirection: "row", gap: predictionSpacing.sm, marginBottom: 6 },
  timelineMonth: {
    width: 90,
    fontSize: 12,
    fontWeight: "700",
    color: predictionColors.textSecondary,
  },
  timelineActivity: { fontSize: 12, color: predictionColors.text, flex: 1 },
  note: { fontSize: 12, lineHeight: 18, color: predictionColors.text, marginBottom: 6 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: predictionSpacing.sm },
  stat: {
    flexBasis: "48%",
    backgroundColor: predictionColors.background,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: predictionColors.textMuted,
    marginBottom: 2,
  },
  statValue: { fontSize: 13, fontWeight: "800", color: predictionColors.text },
  footer: {
    padding: predictionSpacing.md,
    borderTopWidth: 1,
    borderTopColor: predictionColors.border,
    backgroundColor: predictionColors.card,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: predictionSpacing.sm,
    backgroundColor: predictionColors.success,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
  },
  confirmText: { color: predictionColors.white, fontSize: 14, fontWeight: "800" },
  secondaryBtn: {
    marginTop: predictionSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: predictionSpacing.sm,
    borderWidth: 1,
    borderColor: predictionColors.border,
    borderRadius: predictionRadius.md,
    padding: predictionSpacing.md,
    backgroundColor: predictionColors.background,
  },
  secondaryBtnText: {
    color: predictionColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  confirmMsg: {
    marginTop: predictionSpacing.sm,
    fontSize: 12,
    color: predictionColors.textSecondary,
    textAlign: "center",
  },
});
