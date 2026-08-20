/**
 * cropConverters — Normalizes the two different backend crop-recommendation
 * shapes into the UI's unified `CropOption`.
 *
 *  - AgentCropRecommendation comes from LangGraph `/recommend` (used by the
 *    recommendation screen's existing flow).
 *  - CropRecommendation comes from `/api/ai/chat` (the chatbot endpoint).
 */
import type { AgentCropRecommendation } from "./agent-api";
import type { CropRecommendation as ChatCropRecommendation } from "./aiService";
import type { CropOption, CropScoreFactors, CompetitionLevel, RiskLevel } from "./plan-types";

export function toCropOptionFromAgent(rec: AgentCropRecommendation): CropOption {
  const factors: CropScoreFactors | null = rec.factors
    ? {
        yieldScore: rec.factors.yieldScore,
        priceScore: rec.factors.priceScore,
        demandScore: rec.factors.demandScore,
        supplyGapScore: rec.factors.supplyGapScore,
        competitionScore: rec.factors.competitionScore,
        weatherScore: rec.factors.weatherScore,
        revenueScore: rec.factors.revenueScore,
        riskScore: rec.factors.riskScore,
      }
    : null;

  return {
    cropId: rec.cropName,
    cropName: rec.cropName,
    score: rec.recommendationScore,
    predictedYieldTPerHa: rec.predictedYieldTPerHa ?? null,
    marketPriceRsPerKg: rec.marketPriceRsPerKg ?? null,
    estimatedDemandTonnes: rec.estimatedDemandTonnes ?? null,
    expectedSupplyTonnes: rec.expectedSupplyTonnes ?? 0,
    demandGapTonnes: rec.demandGapTonnes ?? null,
    expectedGrossRevenueRs: rec.expectedGrossRevenueRs ?? null,
    competitionLevel: (rec.competitionLevel ?? null) as CompetitionLevel | null,
    riskLevel: (rec.riskLevel ?? null) as RiskLevel | null,
    weatherSuitability: rec.weatherSuitability ?? 0,
    explanation: rec.explanation ?? "",
    factors,
    dataStatus: "ESTIMATED",
  };
}

export function toCropOptionFromChat(rec: ChatCropRecommendation): CropOption {
  const factors: CropScoreFactors | null = rec.factors
    ? {
        yieldScore: rec.factors.yieldScore,
        priceScore: rec.factors.priceScore,
        demandScore: rec.factors.demandScore,
        supplyGapScore: rec.factors.supplyGapScore,
        competitionScore: rec.factors.competitionScore,
        weatherScore: rec.factors.weatherScore,
        revenueScore: rec.factors.revenueScore,
        riskScore: rec.factors.riskScore,
      }
    : null;

  return {
    cropId: rec.cropId ?? rec.cropName,
    cropName: rec.cropName,
    score: rec.score,
    predictedYieldTPerHa: rec.predictedYield ?? null,
    marketPriceRsPerKg: rec.marketPrice ?? null,
    estimatedDemandTonnes: rec.expectedDemand ?? null,
    expectedSupplyTonnes: rec.expectedSupply ?? null,
    demandGapTonnes: rec.demandGap ?? null,
    expectedGrossRevenueRs: rec.expectedGrossRevenue ?? null,
    competitionLevel: (rec.competitionLevel ?? null) as CompetitionLevel | null,
    riskLevel: (rec.riskLevel ?? null) as RiskLevel | null,
    // The chat schema doesn't expose weather suitability directly; fall back
    // to the weather factor from the scoring engine, then 0.
    weatherSuitability: factors?.weatherScore ?? 0,
    explanation: rec.reason ?? "",
    factors,
    dataStatus: rec.dataStatus ?? "ESTIMATED",
  };
}
