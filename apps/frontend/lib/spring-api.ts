type Role = "farmer" | "buyer";

type HttpError = Error & {
  status?: number;
};

type SpringProfileResponse = {
  id: string;
  role: Role;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  region: string;
  farmer_code?: string;
  buyer_code?: string;
  national_id?: string;
  farmer_type?: string;
  total_land_area?: number;
  experience_years?: number;
  has_irrigation?: boolean;
  buyer_type?: string;
  organization_name?: string;
  preferred_crop?: string;
  required_quantity?: number;
  notes?: string;
  has_storage?: boolean;
  has_transport?: boolean;
};

type FarmerPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  region: string;
  nationalId?: string;
  farmerType?: string;
  totalLandArea?: number;
  experienceYears?: number;
};

type BuyerPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  region: string;
  buyerType: string;
  organizationName?: string;
  preferredCrop?: string;
  requiredQuantity?: number;
  notes?: string;
};

const SPRING_BACKEND_URL =
  process.env.EXPO_PUBLIC_SPRING_BACKEND_URL ?? "http://127.0.0.1:8080";

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${SPRING_BACKEND_URL}${path}`, {
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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${SPRING_BACKEND_URL}${path}`);

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(
      errorText || `Request failed with status ${response.status}`,
    ) as HttpError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

async function putJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${SPRING_BACKEND_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export type SavedCropPlan = {
  id: string;
  farmerId: string;
  cropId?: string;
  cropName: string;
  season: "Yala" | "Maha";
  year: number;
  cultivatedArea: number;
  predictedProduction?: number;
  location: string;
  district?: string;
  hasIrrigation?: boolean;
  status?: string;
  syncStatus?: string;
  createdAt?: string;
};

/** Return only plans belonging to the signed-in farmer. */
export async function getCropPlansForFarmer(
  farmerId: string,
): Promise<SavedCropPlan[]> {
  if (!farmerId.trim()) return [];
  const plans = await getJson<SavedCropPlan[]>(
    `/api/collections/cropPlans/farmer/${encodeURIComponent(farmerId)}`,
  );
  return plans
    .filter((plan) => String(plan.farmerId) === farmerId)
    .sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    );
}

export async function uploadBuyerOfflineRecord(payload: {
  id: string;
  buyerId: string;
  kind: "purchase_request" | "order" | "message" | "saved_listing";
  title: string;
  detail: string;
  amount?: number;
  quantity?: number;
  date?: string;
  createdAt: string;
}) {
  const collection = payload.kind === "message"
    ? "messages"
    : payload.kind === "purchase_request"
      ? "demand_records"
      : payload.kind === "order"
        ? "buyer_orders"
        : "saved_listings";
  return postJson<{ id: string; message: string }>(
    `/api/collections/${collection}`,
    payload,
  );
}

type FarmerProfileResponse = {
  id: string;
  farmerCode: string;
  message: string;
};

type BuyerProfileResponse = {
  id: string;
  buyerCode: string;
  message: string;
};

export async function createProfile(
  role: "farmer",
  payload: FarmerPayload,
): Promise<FarmerProfileResponse>;
export async function createProfile(
  role: "buyer",
  payload: BuyerPayload,
): Promise<BuyerProfileResponse>;
export async function createProfile(
  role: Role,
  payload: FarmerPayload | BuyerPayload,
) {
  if (role === "farmer") {
    return postJson<FarmerProfileResponse>("/api/farmers", payload);
  }

  return postJson<BuyerProfileResponse>("/api/buyers", payload);
}

function mapSpringProfile(profile: SpringProfileResponse) {
  if (profile.role === "farmer") {
    return {
      id: profile.id,
      role: "farmer" as const,
      farmerCode: profile.farmer_code,
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      email: profile.email,
      address: profile.address,
      region: profile.region,
      nationalId: profile.national_id,
      farmerType: profile.farmer_type ?? "general",
      totalLandArea: profile.total_land_area,
      experienceYears: profile.experience_years,
      hasIrrigation: profile.has_irrigation ?? false,
    };
  }

  return {
    id: profile.id,
    role: "buyer" as const,
    buyerCode: profile.buyer_code,
    fullName: profile.full_name,
    phoneNumber: profile.phone_number,
    email: profile.email,
    address: profile.address,
    region: profile.region,
    buyerType: profile.buyer_type ?? "general",
    organizationName: profile.organization_name,
    preferredCrop: profile.preferred_crop,
    requiredQuantity: profile.required_quantity,
    notes: profile.notes,
    hasStorage: profile.has_storage ?? false,
    hasTransport: profile.has_transport ?? false,
  };
}

export async function getProfileByEmail(email: string) {
  const encodedEmail = encodeURIComponent(email.trim());

  try {
    const farmerProfile = await getJson<SpringProfileResponse>(
      `/api/farmers/by-email?email=${encodedEmail}`,
    );

    return mapSpringProfile(farmerProfile);
  } catch (farmerError) {
    try {
      const buyerProfile = await getJson<SpringProfileResponse>(
        `/api/buyers/by-email?email=${encodedEmail}`,
      );

      return mapSpringProfile(buyerProfile);
    } catch (buyerError) {
      const farmerStatus =
        typeof farmerError === "object" &&
        farmerError &&
        "status" in farmerError
          ? Number((farmerError as HttpError).status)
          : undefined;
      const buyerStatus =
        typeof buyerError === "object" && buyerError && "status" in buyerError
          ? Number((buyerError as HttpError).status)
          : undefined;

      if (farmerStatus && farmerStatus !== 404) {
        throw farmerError;
      }

      if (buyerStatus && buyerStatus !== 404) {
        throw buyerError;
      }

      throw new Error("No saved profile found for this email.");
    }
  }
}

export async function updateProfile(profile: import("@/components/screens/profile-types").ProfileData) {
  if (!profile.id) throw new Error("Profile ID is missing.");
  const common = { fullName: profile.fullName, phoneNumber: profile.phoneNumber, email: profile.email, address: profile.address, region: profile.region };
  const path = profile.role === "farmer" ? `/api/farmers/${encodeURIComponent(profile.id)}` : `/api/buyers/${encodeURIComponent(profile.id)}`;
  const payload = profile.role === "farmer"
    ? { ...common, nationalId: profile.nationalId, farmerType: profile.farmerType, totalLandArea: profile.totalLandArea, experienceYears: profile.experienceYears, hasIrrigation: profile.hasIrrigation }
    : { ...common, buyerType: profile.buyerType, organizationName: profile.organizationName, preferredCrop: profile.preferredCrop, requiredQuantity: profile.requiredQuantity, notes: profile.notes, hasStorage: profile.hasStorage, hasTransport: profile.hasTransport };
  const response = await putJson<SpringProfileResponse>(path, payload);
  return mapSpringProfile({ ...response, role: profile.role });
}

export type LiveMarketPriceEntry = {
  rowNumber: number;
  cropName: string;
  prices: string[];
  displayPrice: string;
  rawText: string;
  [key: string]: unknown;
};

export type LiveMarketPriceBulletin = {
  label: string;
  date: string;
  url: string;
  success?: boolean;
  message?: string;
  error?: string;
  lineCount?: number;
  entries?: LiveMarketPriceEntry[];
};

export type LiveMarketPriceResponse = {
  sourceUrl: string;
  pageTitle: string;
  fetchedAt: string;
  bulletinUrl?: string;
  bulletinDate?: string | null;
  bulletinLabel?: string;
  bulletins?: LiveMarketPriceBulletin[];
  lineCount: number;
  success: boolean;
  message?: string;
  error?: string;
  entries: LiveMarketPriceEntry[];
};

export async function getLiveMarketPrices() {
  return getJson<LiveMarketPriceResponse>("/api/market-prices/live");
}

export type BuyerSummary = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  region: string;
  buyer_type: string;
  organization_name?: string;
  preferred_crop?: string;
  required_quantity?: number;
  notes?: string;
  buyer_code: string;
  created_at?: string;
  [key: string]: unknown;
};

export async function getBuyers() {
  return getJson<BuyerSummary[]>("/api/buyers");
}

export async function getBuyerById(buyerId: string) {
  return getJson<BuyerSummary>(`/api/buyers/${encodeURIComponent(buyerId)}`);
}

export type FarmerSummary = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  region: string;
  national_id?: string;
  farmer_type?: string;
  total_land_area?: number;
  experience_years?: number;
  has_irrigation?: boolean;
  farmer_code: string;
  created_at?: string;
  [key: string]: unknown;
};

export async function getFarmers() {
  return getJson<FarmerSummary[]>("/api/farmers");
}

export async function getFarmerById(farmerId: string) {
  return getJson<FarmerSummary>(`/api/farmers/${encodeURIComponent(farmerId)}`);
}
