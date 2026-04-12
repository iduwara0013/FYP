export type Role = "farmer" | "buyer";

export type SignupDetails = {
  fullName: string;
  email: string;
  region: string;
};

export type ProfileBase = {
  id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  region: string;
};

export type FarmerProfileData = ProfileBase & {
  role: "farmer";
  farmerCode?: string;
  nationalId?: string;
  farmerType: string;
  totalLandArea?: number;
  experienceYears?: number;
  hasIrrigation: boolean;
};

export type BuyerProfileData = ProfileBase & {
  role: "buyer";
  buyerCode?: string;
  buyerType: string;
  organizationName?: string;
  preferredCrop?: string;
  requiredQuantity?: number;
  notes?: string;
  hasStorage: boolean;
  hasTransport: boolean;
};

export type ProfileData = FarmerProfileData | BuyerProfileData;
