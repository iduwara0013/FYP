/**
 * AI Recommendation Engine — Configuration
 *
 * All weights and sensitivity parameters are configurable here.
 * These control how each factor contributes to the final recommendation score.
 */

export const RECOMMENDATION_WEIGHTS = {
  yieldWeight: 0.15,
  priceWeight: 0.15,
  demandWeight: 0.2,
  supplyGapWeight: 0.2,
  competitionWeight: 0.1,
  weatherWeight: 0.1,
  revenueWeight: 0.05,
  riskWeight: 0.05,
} as const;

/**
 * Competition sensitivity — controls how quickly farmer adoption affects scores.
 * Higher = more aggressive response to farmer selections.
 * Lower = more gradual response.
 */
export const COMPETITION_SENSITIVITY = 0.15;

/**
 * When a farmer selects a crop, their expected production is added to supply.
 * This multiplier controls how much of their production counts toward
 * the expected supply estimate (accounts for losses, etc).
 */
export const SUPPLY_CONTRIBUTION_FACTOR = 0.9;

/**
 * Default crop catalog with base yield estimates (T/ha) and
 * weather suitability per season. These are ESTIMATED values
 * used when real prediction data is unavailable.
 */
export const CROP_CATALOG: Record<
  string,
  {
    baseYieldTPerHa: number;
    seasons: string[];
    weatherSuitability: Record<string, number>; // 0-100
    typicalPriceRsPerKg: number;
  }
> = {
  Rice: {
    baseYieldTPerHa: 4.5,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 80, Maha: 90 },
    typicalPriceRsPerKg: 185,
  },
  Pumpkin: {
    baseYieldTPerHa: 12,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 85, Maha: 75 },
    typicalPriceRsPerKg: 180,
  },
  Tomato: {
    baseYieldTPerHa: 15,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 70, Maha: 85 },
    typicalPriceRsPerKg: 150,
  },
  Onion: {
    baseYieldTPerHa: 10,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 60, Maha: 80 },
    typicalPriceRsPerKg: 220,
  },
  Maize: {
    baseYieldTPerHa: 5.5,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 75, Maha: 85 },
    typicalPriceRsPerKg: 95,
  },
  Carrot: {
    baseYieldTPerHa: 18,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 55, Maha: 75 },
    typicalPriceRsPerKg: 220,
  },
  Beans: {
    baseYieldTPerHa: 8,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 80, Maha: 70 },
    typicalPriceRsPerKg: 195,
  },
  Cabbage: {
    baseYieldTPerHa: 20,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 50, Maha: 70 },
    typicalPriceRsPerKg: 120,
  },
  Leeks: {
    baseYieldTPerHa: 12,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 65, Maha: 80 },
    typicalPriceRsPerKg: 250,
  },
  Brinjal: {
    baseYieldTPerHa: 14,
    seasons: ["Yala", "Maha"],
    weatherSuitability: { Yala: 75, Maha: 80 },
    typicalPriceRsPerKg: 160,
  },
};

/**
 * Estimated next-season demand (tonnes) per crop.
 * These are ESTIMATED values for development.
 * In production, these should come from a real demand model.
 */
export const ESTIMATED_DEMAND_TONNES: Record<string, number> = {
  Rice: 120,
  Pumpkin: 50,
  Tomato: 45,
  Onion: 40,
  Maize: 60,
  Carrot: 35,
  Beans: 30,
  Cabbage: 25,
  Leeks: 20,
  Brinjal: 28,
};

/**
 * Data source labels — used to clearly distinguish data types.
 */
export const DATA_SOURCE = {
  REAL: "real",
  ESTIMATED: "estimated",
  DEMO: "demo",
} as const;

export type DataSource = (typeof DATA_SOURCE)[keyof typeof DATA_SOURCE];
