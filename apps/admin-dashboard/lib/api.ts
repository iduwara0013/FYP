export const SPRING_URL =
  process.env.NEXT_PUBLIC_SPRING_BACKEND_URL ?? "http://127.0.0.1:8080";
export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_BACKEND_URL ?? "http://127.0.0.1:5001";

export type DocumentRecord = Record<string, unknown> & { id?: string };
export type MarketEntry = {
  cropName?: string;
  displayPrice?: string;
  prices?: string[];
  rowNumber?: number;
  rawText?: string;
  [key: string]: unknown;
};
export type MarketBulletin = {
  label?: string;
  date?: string;
  url?: string;
  success?: boolean;
  message?: string;
  error?: string;
  entries?: MarketEntry[];
};
export type MarketResponse = {
  success?: boolean;
  fetchedAt?: string;
  bulletinDate?: string;
  bulletinLabel?: string;
  bulletinUrl?: string;
  sourceUrl?: string;
  pageTitle?: string;
  message?: string;
  error?: string;
  entries?: MarketEntry[];
  bulletins?: MarketBulletin[];
};
export type AgentHealth = {
  status?: string;
  service?: string;
  llm?: { provider?: string; enabled?: boolean };
  neo4j?: { status?: string; connected?: boolean } | string;
  demoMode?: boolean;
};
export type LiveData = {
  farmers: DocumentRecord[];
  buyers: DocumentRecord[];
  cropPlans: DocumentRecord[];
  predictions: DocumentRecord[];
  market: MarketResponse;
  springHealth: Record<string, unknown>;
  agentHealth: AgentHealth;
  loadedAt: string;
  errors: string[];
};

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json() as Promise<T>;
}

export async function loadAdminData(): Promise<LiveData> {
  const errors: string[] = [];
  const safe = async <T,>(label: string, promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise;
    } catch (reason) {
      errors.push(`${label}: ${reason instanceof Error ? reason.message : "request failed"}`);
      return fallback;
    }
  };
  const [farmers, buyers, cropPlans, predictions, market, archive, springHealth, agentHealth] =
    await Promise.all([
      safe("Farmers", request<DocumentRecord[]>(`${SPRING_URL}/api/farmers`), []),
      safe("Buyers", request<DocumentRecord[]>(`${SPRING_URL}/api/buyers`), []),
      safe("Crop plans", request<DocumentRecord[]>(`${SPRING_URL}/api/collections/cropPlans`), []),
      safe("Predictions", request<DocumentRecord[]>(`${SPRING_URL}/api/collections/yield_predictions`), []),
      safe("HARTI", request<MarketResponse>(`${SPRING_URL}/api/market-prices/live`), { success: false, entries: [] }),
      safe("HARTI archive", request<MarketBulletin[]>(`${SPRING_URL}/api/market-prices/history`), []),
      safe("Spring health", request<Record<string, unknown>>(`${SPRING_URL}/health`), {}),
      safe("AI health", request<AgentHealth>(`${AGENT_URL}/api/ai/health`), { status: "unavailable" }),
    ]);
  const bulletinMap = new Map<string, MarketBulletin>();
  for (const item of [...archive, ...(market.bulletins ?? [])]) bulletinMap.set(item.date ?? item.url ?? String(bulletinMap.size), item);
  market.bulletins = [...bulletinMap.values()].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return { farmers, buyers, cropPlans, predictions, market, springHealth, agentHealth, loadedAt: new Date().toISOString(), errors };
}

export function text(record: DocumentRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "—";
}

export function number(record: DocumentRecord, ...keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}
