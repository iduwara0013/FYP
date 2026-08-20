/**
 * WhatIfSimulator — Simulates the effect of a farmer choosing a crop.
 *
 * Shows how the farmer's selection affects expected supply, demand gap,
 * competition, and recommendation score.
 */

import { SUPPLY_CONTRIBUTION_FACTOR } from "./config";
import { CropScoringEngine } from "./CropScoringEngine";
import type {
    CropRecommendation,
    FarmerCropSelection,
    Season,
    WhatIfResult,
} from "./types";

export class WhatIfSimulator {
  private scoringEngine: CropScoringEngine;

  constructor() {
    this.scoringEngine = new CropScoringEngine();
  }

  /**
   * Simulate what happens if the farmer selects a crop.
   */
  simulate(
    cropName: string,
    cultivatedAreaHa: number,
    predictedYieldTPerHa: number,
    currentRecommendation: CropRecommendation,
    farmerSelections: FarmerCropSelection[],
    season: Season,
    farmerId: string,
  ): WhatIfResult {
    const expectedProductionTonnes =
      predictedYieldTPerHa * cultivatedAreaHa * SUPPLY_CONTRIBUTION_FACTOR;

    // Current supply
    const currentSupply = farmerSelections
      .filter((s) => s.cropName === cropName && s.season === season)
      .reduce((sum, s) => sum + s.expectedProductionTonnes, 0);

    // New supply after this farmer's selection
    const newSupply = currentSupply + expectedProductionTonnes;

    // Current demand gap
    const demand = currentRecommendation.estimatedDemandTonnes ?? 0;
    const currentGap = demand > 0 ? demand - currentSupply : null;
    const newGap = demand > 0 ? demand - newSupply : null;

    // Competition levels
    const currentFarmerCount = farmerSelections.filter(
      (s) => s.cropName === cropName && s.season === season,
    ).length;
    const newFarmerCount = currentFarmerCount + 1;

    const currentCompetition = this.scoringEngine.getCompetitionLevel(
      currentFarmerCount,
      demand,
      currentSupply,
    );
    const newCompetition = this.scoringEngine.getCompetitionLevel(
      newFarmerCount,
      demand,
      newSupply,
    );

    // New recommendation score (recalculate with updated supply)
    const newSelections: FarmerCropSelection[] = [
      ...farmerSelections,
      {
        farmerId,
        cropName,
        season,
        cultivatedAreaHa,
        predictedYieldTPerHa,
        expectedProductionTonnes,
        timestamp: new Date().toISOString(),
      },
    ];

    const newFarmerCountForCrop = newSelections.filter(
      (s) => s.cropName === cropName,
    ).length;

    // Recalculate competition score with new farmer count
    const newCompetitionScore = Math.max(
      0,
      Math.min(100, 100 - newFarmerCountForCrop * 5),
    );

    // Adjust supply gap score
    const newSupplyGapScore =
      demand > 0
        ? Math.max(0, Math.min(100, 50 + ((demand - newSupply) / demand) * 50))
        : 50;

    // Recalculate final score
    const newFactors = {
      ...currentRecommendation.factors,
      supplyGapScore: newSupplyGapScore,
      competitionScore: newCompetitionScore,
    };
    const newScore = this.scoringEngine.calculateFinalScore(newFactors);

    const marketPressureNote =
      newGap != null && newGap < 0
        ? `Your decision may increase expected supply beyond demand, creating potential market pressure.`
        : `Your decision will increase expected ${cropName} supply by approximately ${Math.round(expectedProductionTonnes)} tonnes.`;

    return {
      cropName,
      currentExpectedSupplyTonnes: Math.round(currentSupply * 10) / 10,
      newExpectedSupplyTonnes: Math.round(newSupply * 10) / 10,
      currentDemandGapTonnes:
        currentGap != null ? Math.round(currentGap * 10) / 10 : null,
      newDemandGapTonnes: newGap != null ? Math.round(newGap * 10) / 10 : null,
      currentCompetitionLevel: currentCompetition,
      newCompetitionLevel: newCompetition,
      currentRecommendationScore: currentRecommendation.recommendationScore,
      newRecommendationScore: newScore,
      expectedProductionTonnes: Math.round(expectedProductionTonnes * 10) / 10,
      expectedGrossRevenueRs:
        currentRecommendation.marketPriceRsPerKg != null
          ? Math.round(
              predictedYieldTPerHa *
                1000 *
                cultivatedAreaHa *
                currentRecommendation.marketPriceRsPerKg,
            )
          : null,
      marketPressureNote,
    };
  }
}
