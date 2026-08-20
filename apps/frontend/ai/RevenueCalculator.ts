/**
 * RevenueCalculator — Calculates expected gross revenue for a crop.
 *
 * IMPORTANT: This calculates GROSS revenue, not profit.
 * Production cost data is not available, so we never claim profit.
 */

export type RevenueResult = {
  expectedProductionKg: number;
  expectedGrossRevenueRs: number | null;
  revenuePerHectareRs: number | null;
};

export class RevenueCalculator {
  /**
   * Calculate expected gross revenue.
   * Returns null if price or yield data is unavailable.
   */
  calculate(
    predictedYieldTPerHa: number | null,
    cultivatedAreaHa: number,
    marketPriceRsPerKg: number | null,
  ): RevenueResult {
    if (predictedYieldTPerHa == null || marketPriceRsPerKg == null) {
      return {
        expectedProductionKg: 0,
        expectedGrossRevenueRs: null,
        revenuePerHectareRs: null,
      };
    }

    const expectedProductionKg = predictedYieldTPerHa * 1000 * cultivatedAreaHa;
    const expectedGrossRevenueRs = expectedProductionKg * marketPriceRsPerKg;
    const revenuePerHectareRs =
      predictedYieldTPerHa * 1000 * marketPriceRsPerKg;

    return {
      expectedProductionKg: Math.round(expectedProductionKg),
      expectedGrossRevenueRs: Math.round(expectedGrossRevenueRs),
      revenuePerHectareRs: Math.round(revenuePerHectareRs),
    };
  }
}
