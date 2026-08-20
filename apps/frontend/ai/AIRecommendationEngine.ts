/**
 * AIRecommendationEngine — Orchestrates the full recommendation pipeline.
 *
 * Pipeline:
 * 1. Understand farmer context
 * 2. Collect weather suitability
 * 3. Collect yield predictions
 * 4. Collect market prices
 * 5. Estimate demand
 * 6. Calculate expected supply
 * 7. Analyze farmer selections
 * 8. Calculate competition
 * 9. Calculate revenue
 * 10. Calculate risk
 * 11. Rank crops
 * 12. Explain recommendations
 */

import { CROP_CATALOG, DATA_SOURCE } from "./config";
import { CropScoringEngine } from "./CropScoringEngine";
import { DemandModel } from "./DemandModel";
import { SupplyModel } from "./SupplyModel";
import { RevenueCalculator } from "./RevenueCalculator";
import { RecommendationExplanation } from "./RecommendationExplanation";
import type {
  CropMarketData,
  CropRecommendation,
  CropYieldData,
  FarmerContext,
  FarmerCropSelection,
  RecommendationResult,
  Season,
} from "./types";

export type RecommendationInput = {
  farmerContext: FarmerContext;
  season: Season;
  year: number;
  marketData: Map<string, CropMarketData>;
  yieldData: Map<string, CropYieldData>;
  farmerSelections: FarmerCropSelection[];
  weatherSuitability: Map<string, number>;
};

export class AIRecommendationEngine {
  private scoringEngine: CropScoringEngine;
  private demandModel: DemandModel;
  private supplyModel: SupplyModel;
  private revenueCalculator: RevenueCalculator;
  private explanation: RecommendationExplanation;

  constructor() {
    this.scoringEngine = new CropScoringEngine();
    this.demandModel = new DemandModel();
    this.supplyModel = new SupplyModel();
    this.revenueCalculator = new RevenueCalculator();
    this.explanation = new RecommendationExplanation();
  }

  /**
   * Generate recommendations for the next growing season.
   */
  generateRecommendations(input: RecommendationInput): RecommendationResult {
    const { farmerContext, season, year, farmerSelections } = input;

    // Get all candidate crops from catalog
    const candidateCrops = Object.keys(CROP_CATALOG);

    const recommendations: CropRecommendation[] = [];

    for (const cropName of candidateCrops) {
      const catalog = CROP_CATALOG[cropName];

      // Skip crops not suitable for this season
      if (!catalog.seasons.includes(season)) continue;

      // Get market data (or use estimated)
      const marketData = input.marketData.get(cropName) ?? null;
      const demandEstimate = this.demandModel.estimateDemand(cropName, season);

      // Get yield data (or use catalog base)
      const yieldData = input.yieldData.get(cropName) ?? null;
      const effectiveYield =
        yieldData?.predictedYieldTPerHa ?? catalog.baseYieldTPerHa;

      // Get weather suitability
      const weatherSuitability =
        input.weatherSuitability.get(cropName) ??
        catalog.weatherSuitability[season] ??
        50;

      // Calculate expected supply
      const supply = this.supplyModel.calculateSupply(
        cropName,
        farmerSelections,
        season,
      );

      // Effective demand (use real if available, else estimated)
      const effectiveDemand =
        marketData?.estimatedDemandTonnes ?? demandEstimate.estimatedDemandTonnes;

            // Calculate demand gap
      const demandGap = (effectiveDemand ?? 0) - supply.expectedSupplyTonnes;

      const farmerCount = farmerSelections.filter(
        (s) => s.cropName === cropName,
      ).length;

      const factors = this.scoringEngine.scoreCrop({
        cropName,
        marketData,
        yieldData,
        farmerContext,
        season,
        expectedSupplyTonnes: supply.expectedSupplyTonnes,
        farmerSelections,
        weatherSuitability,
      });

      const recommendationScore = this.scoringEngine.calculateFinalScore(factors);
      const competitionLevel = this.scoringEngine.getCompetitionLevel(
        farmerCount,
        effectiveDemand ?? 0,
        supply.expectedSupplyTonnes,
      );
      const riskLevel = this.scoringEngine.getRiskLevel(factors);

      const revenue = this.revenueCalculator.calculate(
        effectiveYield,
        farmerContext.availableLandHa,
        marketData?.marketPriceRsPerKg ?? catalog.typicalPriceRsPerKg,
      );

      const rec: CropRecommendation = {
        cropName,
        recommendationScore,
        factors,
        predictedYieldTPerHa: effectiveYield,
        marketPriceRsPerKg:
          marketData?.marketPriceRsPerKg ?? catalog.typicalPriceRsPerKg,
        estimatedDemandTonnes: effectiveDemand,
        expectedSupplyTonnes: supply.expectedSupplyTonnes,
        demandGapTonnes: demandGap,
        competitionLevel,
        expectedGrossRevenueRs: revenue.expectedGrossRevenueRs,
        weatherSuitability,
        riskLevel,
        explanation: "",
        dataSources: {
          yield: DATA_SOURCE.ESTIMATED,
          price: DATA_SOURCE.ESTIMATED,
          demand: demandEstimate.source,
        },
      };

      rec.explanation = this.explanation.explain(rec);

      recommendations.push(rec);
    }

    recommendations.sort(
      (a, b) => b.recommendationScore - a.recommendationScore,
    );

    return {
      recommendations,
      farmerContext,
      season,
      year,
      generatedAt: new Date().toISOString(),
      dataDisclaimer: "Values are estimated for development.",
    };
  }
}
