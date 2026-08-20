/**
 * Agent API client — connects the React Native app to the LangGraph agent backend.
 *
 * The agent backend (FastAPI on port 5001) runs the LangGraph pipeline that
 * orchestrates yield prediction, price prediction, demand estimation, supply
 * calculation, competition analysis, and recommendation generation.
 */

export const AGENT_BACKEND_URL =
  process.env.EXPO_PUBLIC_AGENT_BACKEND_URL ?? "http://127.0.0.1:5001";

/**
 * AbortSignal.timeout() is not available in React Native / Hermes, so we
 * implement a manual timeout with an AbortController + setTimeout.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type AgentRecommendationRequest = {
  farmer_id?: string;
  region: string;
  district: string;
  land_area_ha: number;
  has_irrigation: boolean;
  season: "Yala" | "Maha";
  year: number;
  preferred_crops?: string[];
};

export type AgentCropRecommendation = {
  cropName: string;
  recommendationScore: number;
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
  factors: {
    yieldScore: number;
    priceScore: number;
    demandScore: number;
    supplyGapScore: number;
    competitionScore: number;
    weatherScore: number;
    revenueScore: number;
    riskScore: number;
  };
};

export type AgentRecommendationResponse = {
  recommendations: AgentCropRecommendation[];
  top_crops: AgentCropRecommendation[];
  farmerContext: Record<string, unknown>;
  season: string;
  year: number;
  generatedAt: string;
  completed: boolean;
  error?: string;
};

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetchWithTimeout(
    `${AGENT_BACKEND_URL}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    90_000,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Agent request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetchWithTimeout(
    `${AGENT_BACKEND_URL}${path}`,
    {},
    30_000,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Agent request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Run the LangGraph crop recommendation agent.
 */
export async function runAgentRecommendation(
  request: AgentRecommendationRequest,
): Promise<AgentRecommendationResponse> {
  return postJson<AgentRecommendationResponse>("/recommend", request);
}

/**
 * Check agent health.
 */
export async function checkAgentHealth() {
  return getJson<{ status: string; service: string }>("/health");
}

/**
 * List available LangChain tools.
 */
export async function listAgentTools() {
  return getJson<{ tools: string[] }>("/tools");
}
