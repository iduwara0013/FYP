/**
 * SupplyModel — Calculates expected future supply for each crop.
 *
 * Expected supply is the sum of predicted production from all
 * participating farmers who have selected that crop.
 */

import { SUPPLY_CONTRIBUTION_FACTOR } from "./config";
import type { FarmerCropSelection, Season } from "./types";

export type SupplyEstimate = {
  cropName: string;
  expectedSupplyTonnes: number;
  farmerCount: number;
  totalPlannedAreaHa: number;
};

export class SupplyModel {
  /**
   * Calculate expected supply for a crop based on farmer selections.
   */
  calculateSupply(
    cropName: string,
    farmerSelections: FarmerCropSelection[],
    season: Season,
  ): SupplyEstimate {
    const matching = farmerSelections.filter(
      (s) => s.cropName === cropName && s.season === season,
    );

    const totalProduction = matching.reduce(
      (sum, s) => sum + s.expectedProductionTonnes,
      0,
    );

    const totalArea = matching.reduce((sum, s) => sum + s.cultivatedAreaHa, 0);

    // Apply contribution factor to account for losses
    const adjustedSupply = totalProduction * SUPPLY_CONTRIBUTION_FACTOR;

    return {
      cropName,
      expectedSupplyTonnes: Math.round(adjustedSupply * 10) / 10,
      farmerCount: matching.length,
      totalPlannedAreaHa: Math.round(totalArea * 10) / 10,
    };
  }

  /**
   * Calculate expected supply for ALL crops.
   */
  calculateAllSupplies(
    farmerSelections: FarmerCropSelection[],
    season: Season,
  ): Map<string, SupplyEstimate> {
    const cropNames = [...new Set(farmerSelections.map((s) => s.cropName))];
    const supplies = new Map<string, SupplyEstimate>();

    for (const cropName of cropNames) {
      supplies.set(
        cropName,
        this.calculateSupply(cropName, farmerSelections, season),
      );
    }

    return supplies;
  }
}
