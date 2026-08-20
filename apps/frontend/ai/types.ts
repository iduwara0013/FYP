/**
 * AI Recommendation Engine — Shared Types
 */

import type { DataSource } from "./config";

export type Season = "Yala" | "Maha";

export type FarmerContext = {
  farmerId: string;
  region: string;
  district?: string;
  availableLandHa: number;
  hasIrrigation: boolean;
  experienceYears?: number;
  preferredCrops?: string[];
};

export type CropMarketData = {
  cropName: string;
  marketPriceRsPerKg: number | null;
  priceSource: DataSource;
  priceChangePercent?: number | null;
  estimatedDemandTonnes: number | null;
  demandSource: DataSource;
};

export type CropYieldData = {
  cropName: string;
  predictedYieldTPerHa: number | null;
  yieldSource: DataSource;
};

export type FarmerCropSelection = {
  farmerId: string;
  cropName: string;
  season: Season;
  cultivatedAreaHa: number;
  predictedYieldTPerHa: number;
  expectedProductionTonnes: number;
  timestamp: string;
};

export type CropSeasonStats = {
  cropName: string;
  season: Season;
  year: number;
  location: string;
  farmerCount: number;
  totalPlannedAreaHa: number;
  expectedProductionTonnes: number;
  estimatedDemandTonnes: number;
  demandGapTonnes: number;
  averageYieldTPerHa: number;
  averageMarketPriceRsPerKg: number;
  recommendationScore: number;
  updatedAt: string;
};

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

export type CropRecommendation = {
  cropName: string;
  recommendationScore: number; // 0-100
  factors: CropScoreFactors;
  predictedYieldTPerHa: number | null;
  marketPriceRsPerKg: number | null;
  estimatedDemandTonnes: number | null;
  expectedSupplyTonnes: number;
  demandGapTonnes: number | null;
  competitionLevel: "Low" | "Medium" | "High";
  expectedGrossRevenueRs: number | null;
  weatherSuitability: number;
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  dataSources: {
    yield: DataSource;
    price: DataSource;
    demand: DataSource;
  };
};

export type RecommendationResult = {
  recommendations: CropRecommendation[];
  farmerContext: FarmerContext;
  season: Season;
  year: number;
  generatedAt: string;
  dataDisclaimer: string;
};

export type WhatIfResult = {
  cropName: string;
  currentExpectedSupplyTonnes: number;
  newExpectedSupplyTonnes: number;
  currentDemandGapTonnes: number | null;
  newDemandGapTonnes: number | null;
  currentCompetitionLevel: "Low" | "Medium" | "High";
  newCompetitionLevel: "Low" | "Medium" | "High";
  currentRecommendationScore: number;
  newRecommendationScore: number;
  expectedProductionTonnes: number;
  expectedGrossRevenueRs: number | null;
  marketPressureNote: string;
};

export type CropPlan = {
  id?: string;
  farmerId: string;
  cropName: string;
  season: Season;
  year: number;
  location: string;
  cultivatedAreaHa: number;
  predictedYieldTPerHa: number;
  expectedProductionTonnes: number;
  marketPriceAtRecommendation: number | null;
  expectedDemandTonnes: number | null;
  expectedSupplyTonnes: number;
  recommendationScore: number;
  createdAt: string;
  status: "planned" | "confirmed" | "cancelled";
};
