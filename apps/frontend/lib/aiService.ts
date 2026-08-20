/**
 * aiService — React Native client for the FastAPI agentic backend.
 *
 * NEVER calls an LLM directly from the app. It only talks to the FastAPI
 * endpoints, which own the LangGraph/LangChain/LLM/Neo4j/Firebase pipeline.
 */
import { AGENT_BACKEND_URL, fetchWithTimeout } from "./agent-api";

export type AIChatRequest = {
  message: string;
  language: "en" | "si";
  location: string;
  cultivatedArea: number;
};

export type AIChatResponse = {
  requestId: string;
  message: string;
  type:
    | "general_question"
    | "crop_recommendation"
    | "crop_information"
    | "market_price"
    | "weather"
    | "what_if"
    | "crop_plan_confirmation"
    | "error";
  recommendations: CropRecommendation[];
  dataSources: DataSource[];
  warnings: string[];
  timestamp: string;
};

export type DataSource = {
  source: string;
  timestamp: string;
  status: "REAL" | "ESTIMATED" | "DEMO" | "UNAVAILABLE";
};

export type CropRecommendation = {
  cropId: string;
  cropName: string;
  score: number;
  predictedYield: number | null;
  marketPrice: number | null;
  expectedDemand: number | null;
  expectedSupply: number | null;
  demandGap: number | null;
  expectedGrossRevenue: number | null;
  competitionLevel: "Low" | "Medium" | "High" | null;
  riskLevel: "Low" | "Medium" | "High" | null;
  reason: string;
  dataStatus: DataSource["status"];
  factors: {
    yieldScore: number;
    priceScore: number;
    demandScore: number;
    supplyGapScore: number;
    competitionScore: number;
    weatherScore: number;
    revenueScore: number;
    riskScore: number;
  } | null;
};

export type RecommendationsRequest = {
  farmerId?: string;
  region: string;
  district: string;
  landAreaHa: number;
  hasIrrigation: boolean;
  season: "Yala" | "Maha";
  year: number;
  preferredCrops?: string[];
  language: "en" | "si";
};

export type RecommendationsResponse = {
  requestId: string;
  farmerId: string | null;
  season: string;
  year: number;
  topRecommendations: CropRecommendation[];
  allRecommendations: CropRecommendation[];
  dataSources: DataSource[];
  warnings: string[];
  timestamp: string;
};

export type WhatIfRequest = {
  cropId: string;
  cultivatedArea: number;
  season: "Yala" | "Maha";
  location: string;
  district: string;
  hasIrrigation: boolean;
  farmerId?: string;
  language: "en" | "si";
};

export type WhatIfResult = {
  cropId: string;
  cropName: string;
  before: { supply: number; gap: number; score: number; competition: string };
  after: { supply: number; gap: number; score: number; competition: string };
  expectedProductionTonnes: number;
  expectedGrossRevenue: number;
  message: string;
  simulation: boolean;
};

export type ConfirmCropPlanRequest = {
  farmerId: string;
  cropId: string;
  season: "Yala" | "Maha";
  year: number;
  cultivatedArea: number;
  location: string;
  district: string;
  hasIrrigation: boolean;
};

export type ConfirmCropPlanResponse = {
  success: boolean;
  cropPlanId: string | null;
  firestoreSaved: boolean;
  neo4jSynced: boolean;
  supplyAfter: number;
  competitionAfter: string | null;
  message: string;
};

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetchWithTimeout(
    `${AGENT_BACKEND_URL}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    90_000,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function sendAIMessage(request: AIChatRequest): Promise<AIChatResponse> {
  return postJson<AIChatResponse>("/api/ai/chat", request);
}

export function getCropRecommendations(
  request: RecommendationsRequest,
): Promise<RecommendationsResponse> {
  return postJson<RecommendationsResponse>("/api/ai/recommendations", request);
}

export function simulateCropChoice(
  request: WhatIfRequest,
): Promise<WhatIfResult> {
  return postJson<WhatIfResult>("/api/ai/what-if", request);
}

export function confirmCropPlan(
  request: ConfirmCropPlanRequest,
): Promise<ConfirmCropPlanResponse> {
  return postJson<ConfirmCropPlanResponse>("/api/ai/crop-plan/confirm", request);
}
