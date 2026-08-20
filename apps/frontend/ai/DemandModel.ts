/**
 * DemandModel — Estimates next-season demand for each crop.
 *
 * Uses estimated demand values from config when real demand data
 * is not available. Clearly labels data as estimated.
 */

import type { DataSource } from "./config";
import { DATA_SOURCE, ESTIMATED_DEMAND_TONNES } from "./config";
import type { Season } from "./types";

export type DemandEstimate = {
  cropName: string;
  estimatedDemandTonnes: number | null;
  source: DataSource;
  season: Season;
};

export class DemandModel {
  /**
   * Estimate demand for a crop in a given season.
   * Uses estimated values from config when real data is unavailable.
   */
  estimateDemand(cropName: string, season: Season): DemandEstimate {
    const baseDemand = ESTIMATED_DEMAND_TONNES[cropName];

    if (baseDemand == null) {
      return {
        cropName,
        estimatedDemandTonnes: null,
        source: DATA_SOURCE.DEMO,
        season,
      };
    }

    // Seasonal adjustment: Maha season typically has higher demand
    const seasonalFactor = season === "Maha" ? 1.1 : 0.95;
    const adjustedDemand = Math.round(baseDemand * seasonalFactor);

    return {
      cropName,
      estimatedDemandTonnes: adjustedDemand,
      source: DATA_SOURCE.ESTIMATED,
      season,
    };
  }
}
