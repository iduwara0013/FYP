/**
 * CropScoringEngine — Calculates individual factor scores for each crop.
 *
 * Each score is normalized to 0-100.
 * The final recommendation score is a weighted combination of these factors.
 */

import { RECOMMENDATION_WEIGHTS } from "./config";
import type {
    CropMarketData,
    CropScoreFactors,
    CropYieldData,
    FarmerContext,
    FarmerCropSelection,
    Season,
} from "./types";

export type CropScoringInput = {
  cropName: string;
  marketData: CropMarketData | null;
  yieldData: CropYieldData | null;
  farmerContext: FarmerContext;
  season: Season;
  expectedSupplyTonnes: number;
  farmerSelections: FarmerCropSelection[];
  weatherSuitability: number;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp((value / max) * 100);
}

export class CropScoringEngine {
  /**
   * Calculate all factor scores for a single crop.
   */
  scoreCrop(input: CropScoringInput): CropScoreFactors {
    const {
      cropName,
      marketData,
      yieldData,
      expectedSupplyTonnes,
      farmerSelections,
      weatherSuitability,
    } = input;

    const yieldScore = yieldData?.predictedYieldTPerHa
      ? normalize(yieldData.predictedYieldTPerHa, 20)
      : 50;

    const priceScore = marketData?.marketPriceRsPerKg
      ? normalize(marketData.marketPriceRsPerKg, 300)
      : 50;

    const demandScore = marketData?.estimatedDemandTonnes
      ? normalize(marketData.estimatedDemandTonnes, 120)
      : 50;

    const demand = marketData?.estimatedDemandTonnes ?? 0;
    const supplyGap = demand - expectedSupplyTonnes;
    const supplyGapScore =
      demand > 0 ? clamp(50 + (supplyGap / demand) * 50, 0, 100) : 50;

    const farmerCount = farmerSelections.filter(
      (s) => s.cropName === cropName,
    ).length;
    const competitionScore = clamp(100 - farmerCount * 5, 0, 100);

    const weatherScore = clamp(weatherSuitability, 0, 100);

    const yieldPerHa = yieldData?.predictedYieldTPerHa ?? 0;
    const pricePerKg = marketData?.marketPriceRsPerKg ?? 0;
    const revenuePerHa = yieldPerHa * 1000 * pricePerKg;
    const revenueScore = normalize(revenuePerHa, 3_000_000);

    let riskScore = 0;
    if (farmerCount > 10) riskScore += 30;
    if (farmerCount > 30) riskScore += 20;
    if (demand > 0 && supplyGap < 0) riskScore += 30;
    if (weatherSuitability < 50) riskScore += 20;
    if (marketData?.marketPriceRsPerKg == null) riskScore += 10;
    riskScore = clamp(riskScore, 0, 100);

    return {
      yieldScore,
      priceScore,
      demandScore,
      supplyGapScore,
      competitionScore,
      weatherScore,
      revenueScore,
      riskScore,
    };
  }

  /**
   * Calculate the final weighted recommendation score (0-100).
   */
  calculateFinalScore(factors: CropScoreFactors): number {
    const {
      yieldWeight,
      priceWeight,
      demandWeight,
      supplyGapWeight,
      competitionWeight,
      weatherWeight,
      revenueWeight,
      riskWeight,
    } = RECOMMENDATION_WEIGHTS;

    const weighted =
      factors.yieldScore * yieldWeight +
      factors.priceScore * priceWeight +
      factors.demandScore * demandWeight +
      factors.supplyGapScore * supplyGapWeight +
      factors.competitionScore * competitionWeight +
      factors.weatherScore * weatherWeight +
      factors.revenueScore * revenueWeight -
      factors.riskScore * riskWeight;

    return clamp(Math.round(weighted));
  }

  /**
   * Determine competition level based on farmer count and supply/demand.
   */
  getCompetitionLevel(
    farmerCount: number,
    demandTonnes: number,
    supplyTonnes: number,
  ): "Low" | "Medium" | "High" {
    if (demandTonnes <= 0) return "Medium";
    const gapRatio = (demandTonnes - supplyTonnes) / demandTonnes;

    if (farmerCount >= 30 || gapRatio < 0.1) return "High";
    if (farmerCount >= 10 || gapRatio < 0.3) return "Medium";
    return "Low";
  }

  /**
   * Determine risk level.
   */
  getRiskLevel(factors: CropScoreFactors): "Low" | "Medium" | "High" {
    if (factors.riskScore >= 60) return "High";
    if (factors.riskScore >= 30) return "Medium";
    return "Low";
  }
}
