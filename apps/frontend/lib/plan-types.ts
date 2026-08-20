/**
 * plan-types — Shared types for the crop recommendation chat flow.
 *
 * The chatbot talks to the FastAPI /api/ai/chat endpoint (aiService types)
 * while the agent recommendation screen uses the LangGraph /recommend types.
 * `CropOption` is the normalized union shape both flows convert into so the
 * rest of the UI (chat tiles, plan builder, plan screen) can work with a
 * single, consistent model.
 */

export type CompetitionLevel = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Medium" | "High";

export type CropScoreFactors = {
  yieldScore: number;
  priceScore: number;
  demandScore: number;
  supplyGapScore: number;
  competitionScore: number;
  weatherScore: number;
  revenueScore: number;
  riskScore: number;
};

/** A single crop the farmer can discuss and select in the chat. */
export type CropOption = {
  cropId: string;
  cropName: string;
  score: number; // 0-100 recommendation score
  predictedYieldTPerHa: number | null;
  marketPriceRsPerKg: number | null;
  estimatedDemandTonnes: number | null;
  expectedSupplyTonnes: number | null;
  demandGapTonnes: number | null;
  expectedGrossRevenueRs: number | null;
  competitionLevel: CompetitionLevel | null;
  riskLevel: RiskLevel | null;
  /** Weather suitability 0-100 (may be unknown/0 when not provided). */
  weatherSuitability: number | null;
  explanation: string;
  factors: CropScoreFactors | null;
  /** e.g. "REAL", "ESTIMATED", "DEMO", "UNAVAILABLE". */
  dataStatus: string;
};

export type GrowthStage = {
  name: string;
  durationWeeks: number;
  keyActivities: string[];
  notes?: string;
};

export type PlanTimelineItem = { month: string; activity: string };

/** A full, displayable growing plan synthesized for a selected crop. */
export type CropPlanDraft = {
  id: string;
  farmerId?: string | null;
  cropName: string;
  season: "Yala" | "Maha";
  year: number;
  location: string;
  cultivatedAreaHa: number;
  hasIrrigation: boolean;
  predictedYieldTPerHa: number | null;
  expectedProductionTonnes: number | null;
  expectedRevenueRs: number | null;
  revenuePerHaRs: number | null;
  marketPriceRsPerKg: number | null;
  weatherSuitability: number;
  riskLevel: RiskLevel;
  competitionLevel: CompetitionLevel;
  recommendationScore: number;
  summary: string;
  growthStages: GrowthStage[];
  timeline: PlanTimelineItem[];
  waterSchedule: string;
  fertilizerSchedule: string;
  pestManagement: string;
  harvestNotes: string;
  dataStatus: string;
  sources: string[];
  createdAt: string;
};
