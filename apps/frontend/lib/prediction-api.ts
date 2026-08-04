const PYTHON_BACKEND_URL =
  process.env.EXPO_PUBLIC_PYTHON_BACKEND_URL ?? "http://127.0.0.1:5000";

export type PredictionOptions = {
  crops: string[];
  regions: string[];
  districts: string[];
  seasons: string[];
  irrigation: string[];
};

export type FarmPrediction = {
  production_kg: number;
  price_rs_per_kg: number;
  revenue_rs: number;
  relative_supply: number;
  input: {
    land_area_ha: number;
    crop: string;
    season: string;
    region: string;
    district: string;
    irrigation: string;
    fertilizer_kg: number;
    rainfall_mm: number;
    farmer_experience_yrs: number;
    year: number;
  };
};

export type FarmPredictionRequest = {
  land_area_ha: number;
  crop: string;
  season: string;
  region: string;
  district: string;
  irrigation: string;
  fertilizer_kg?: number;
  rainfall_mm?: number;
  farmer_experience_yrs?: number;
  year?: number;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${PYTHON_BACKEND_URL}${path}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${PYTHON_BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getPredictionOptions() {
  return getJson<PredictionOptions>("/prediction-options");
}

export async function predictFarm(request: FarmPredictionRequest) {
  return postJson<FarmPrediction>("/predict-farm", request);
}
