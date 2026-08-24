import AsyncStorage from "@react-native-async-storage/async-storage";

export type OfflineEntity = {
  id: string;
  kind: "calendar" | "expense" | "inventory" | "listing" | "message" | "alert";
  title: string;
  detail: string;
  amount?: number;
  quantity?: number;
  date?: string;
  status?: "local" | "queued" | "synced";
  createdAt: string;
};

const DATA_KEY = "@smart_crop_offline_entities_v1";
const QUEUE_KEY = "@smart_crop_sync_queue_v1";

export async function loadOfflineEntities(): Promise<OfflineEntity[]> {
  try { return JSON.parse((await AsyncStorage.getItem(DATA_KEY)) ?? "[]") as OfflineEntity[]; } catch { return []; }
}

export async function saveOfflineEntity(input: Omit<OfflineEntity, "id" | "createdAt" | "status">) {
  const entity: OfflineEntity = { ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString(), status: "queued" };
  const current = await loadOfflineEntities();
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify([entity, ...current]));
  const queue = await loadSyncQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, entity.id]));
  return entity;
}

export async function removeOfflineEntity(id: string) {
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify((await loadOfflineEntities()).filter((item) => item.id !== id)));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify((await loadSyncQueue()).filter((item) => item !== id)));
}

export async function loadSyncQueue(): Promise<string[]> {
  try { return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? "[]") as string[]; } catch { return []; }
}

export async function markQueueSynced(): Promise<OfflineEntity[]> {
  const queued = new Set(await loadSyncQueue());
  const entities = (await loadOfflineEntities()).map((item) => queued.has(item.id) ? { ...item, status: "synced" as const } : item);
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify(entities));
  await AsyncStorage.setItem(QUEUE_KEY, "[]");
  return entities;
}
