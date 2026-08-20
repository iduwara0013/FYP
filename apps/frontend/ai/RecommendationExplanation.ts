/**
 * RecommendationExplanation — Generates farmer-friendly explanations
 * for why a crop is recommended.
 *
 * The explanation is based on the calculated factor scores.
 * It never invents data — it only explains what the scores show.
 */

import type { CropRecommendation, CropScoreFactors } from "./types";

export class RecommendationExplanation {
  /**
   * Generate an explanation for a crop recommendation.
   */
  explain(rec: CropRecommendation): string {
    const parts: string[] = [];
    const { factors } = rec;

    // Demand vs supply
    if (rec.demandGapTonnes != null && rec.demandGapTonnes > 0) {
      parts.push(
        `expected demand is higher than projected supply by approximately ${rec.demandGapTonnes} tonnes`,
      );
    } else if (rec.demandGapTonnes != null && rec.demandGapTonnes < 0) {
      parts.push(
        `expected supply may exceed demand by approximately ${Math.abs(rec.demandGapTonnes)} tonnes`,
      );
    }

    // Market price
    if (rec.marketPriceRsPerKg != null && rec.marketPriceRsPerKg >= 150) {
      parts.push(
        `the current market price is favorable at Rs.${rec.marketPriceRsPerKg}/kg`,
      );
    } else if (rec.marketPriceRsPerKg != null) {
      parts.push(`the current market price is Rs.${rec.marketPriceRsPerKg}/kg`);
    }

    // Yield
    if (rec.predictedYieldTPerHa != null && rec.predictedYieldTPerHa >= 10) {
      parts.push(
        `the predicted yield of ${rec.predictedYieldTPerHa} T/ha is good for your area`,
      );
    } else if (rec.predictedYieldTPerHa != null) {
      parts.push(`the predicted yield is ${rec.predictedYieldTPerHa} T/ha`);
    }

    // Competition
    if (rec.competitionLevel === "Low") {
      parts.push("competition from other farmers is currently low");
    } else if (rec.competitionLevel === "High") {
      parts.push("competition from other farmers is currently high");
    }

    // Weather
    if (rec.weatherSuitability >= 75) {
      parts.push("weather conditions are suitable for this crop");
    } else if (rec.weatherSuitability < 50) {
      parts.push("weather conditions may not be ideal for this crop");
    }

    if (parts.length === 0) {
      return "This crop is recommended based on available agricultural data.";
    }

    return `${rec.cropName} is recommended because ${parts.join(", ")}.`;
  }

  /**
   * Generate a risk explanation.
   */
  explainRisk(rec: CropRecommendation): string {
    const risks: string[] = [];

    if (rec.riskLevel === "High") {
      risks.push("high competition or oversupply risk");
    }
    if (rec.weatherSuitability < 50) {
      risks.push("weather conditions may not be ideal");
    }
    if (rec.marketPriceRsPerKg == null) {
      risks.push("current market price data is unavailable");
    }
    if (rec.demandGapTonnes != null && rec.demandGapTonnes < 0) {
      risks.push("expected supply may exceed demand");
    }

    if (risks.length === 0) {
      return "No significant risks identified based on current data.";
    }

    return `Potential risks: ${risks.join(", ")}.`;
  }

  /**
   * Generate a "why it's good" summary.
   */
  explainStrengths(factors: CropScoreFactors): string[] {
    const strengths: string[] = [];

    if (factors.demandScore >= 70) strengths.push("Strong demand");
    if (factors.supplyGapScore >= 70) strengths.push("Demand exceeds supply");
    if (factors.competitionScore >= 70)
      strengths.push("Low expected competition");
    if (factors.priceScore >= 70) strengths.push("Favorable market price");
    if (factors.yieldScore >= 70) strengths.push("Good predicted yield");
    if (factors.weatherScore >= 70)
      strengths.push("Suitable weather conditions");

    return strengths;
  }
}
