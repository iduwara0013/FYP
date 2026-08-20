/**
 * cropPlanBuilder — Synthesizes a displayable growing plan for a selected crop.
 *
 * There is no dedicated "growing plan" endpoint on the backend, so the plan is
 * built client-side from the selected recommendation + the crop catalog +
 * agronomy guidelines. It reuses the existing deterministic engines
 * (RevenueCalculator, CropScoringEngine, RecommendationExplanation) so the
 * numbers stay consistent with what was recommended.
 *
 * All agronomy timings below are ESTIMATED, crop-specific guidelines.
 */
import { CROP_CATALOG, ESTIMATED_DEMAND_TONNES } from "@/ai/config";
import { CropScoringEngine } from "@/ai/CropScoringEngine";
import { RecommendationExplanation } from "@/ai/RecommendationExplanation";
import { RevenueCalculator } from "@/ai/RevenueCalculator";
import type { CropRecommendation, CropScoreFactors, Season } from "@/ai/types";
import type { ProfileData } from "@/components/screens/profile-types";
import type { CropOption, CropPlanDraft, GrowthStage, PlanTimelineItem } from "./plan-types";

const scoring = new CropScoringEngine();
const revenue = new RevenueCalculator();
const explanation = new RecommendationExplanation();

export const SEASON_MONTHS: Record<string, string[]> = {
  Maha: ["October", "November", "December", "January", "February", "March"],
  Yala: ["May", "June", "July", "August", "September", "October"],
};

export function buildSeasonTimeline(season: Season): PlanTimelineItem[] {
  if (season === "Maha") {
    return [
      { month: "October", activity: "Land preparation and seedbed preparation" },
      { month: "November", activity: "Planting / transplanting and early care" },
      { month: "December", activity: "Fertilizer application and weeding" },
      { month: "January", activity: "Pest & disease monitoring, irrigation" },
      { month: "February", activity: "Growth / flowering and fruit development" },
      { month: "March", activity: "Harvest, drying and storage" },
    ];
  }
  return [
    { month: "May", activity: "Land preparation and field clearing" },
    { month: "June", activity: "Planting / transplanting" },
    { month: "July", activity: "Irrigation and weeding" },
    { month: "August", activity: "Fertilizer application" },
    { month: "September", activity: "Pest & disease monitoring" },
    { month: "October", activity: "Growth and harvest preparation" },
  ];
}

export type Guideline = {
  stages: GrowthStage[];
  waterSchedule: string;
  fertilizerSchedule: string;
  pestManagement: string;
  harvestNotes: string;
  durationWeeks: number;
};

export const GENERIC_GUIDELINE: Guideline = {
  durationWeeks: 16,
  stages: [
    { name: "Land Preparation", durationWeeks: 2, keyActivities: ["Clear field", "Plough and harrow", "Level and form ridges/furrows"] },
    { name: "Planting", durationWeeks: 1, keyActivities: ["Sow seeds or transplant", "Apply basal fertilizer", "Mulch"] },
    { name: "Vegetative Growth", durationWeeks: 5, keyActivities: ["Weeding", "Irrigation", "Top-dressing fertilizer"] },
    { name: "Flowering / Fruiting", durationWeeks: 5, keyActivities: ["Support/stake", "Regular irrigation", "Pest scouting"] },
    { name: "Maturation", durationWeeks: 3, keyActivities: ["Reduce irrigation", "Final fertilizer", "Pest/disease control"] },
    { name: "Harvest", durationWeeks: 1, keyActivities: ["Harvest at maturity", "Field drying"] },
  ],
  waterSchedule: "Maintain even soil moisture; irrigate 1-1.5 inches per week; avoid waterlogging.",
  fertilizerSchedule: "Basal compost at planting; NPK 10-10-10 side-dressed every 4 weeks during growth.",
  pestManagement: "Scout weekly; remove infected plant parts; practice crop rotation; use neem/IPM.",
  harvestNotes: "Harvest at physiological maturity; dry to recommended moisture before storage.",
};

const GROWING_GUIDELINES: Record<string, Guideline> = {
  Cabbage: {
    durationWeeks: 11,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Rich, well-drained soil", "Add compost + lime if acidic"] },
      { name: "Nursery", durationWeeks: 2, keyActivities: ["Raise transplants 3-4 weeks"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Transplant 4-week seedlings", "Spacing 45x45 cm"] },
      { name: "Head Formation", durationWeeks: 5, keyActivities: ["Consistent moisture", "Side-dress N", "Control weeds"] },
      { name: "Head Firmness", durationWeeks: 2, keyActivities: ["Reduce nitrogen", "Watch for split heads"] },
      { name: "Harvest", durationWeeks: 1, keyActivities: ["Harvest heads at 2.5-4 kg", "Store at 0-4C"] },
    ],
    waterSchedule: "Consistent moisture (2-3 inches/week); avoid wetting heads to prevent rot.",
    fertilizerSchedule: "Basemap compost + NPK 10-10-10; side-dress N during head formation; supply calcium.",
    pestManagement: "Watch cabbage moth, aphids and clubroot; use resistant varieties; rotate brassicas.",
    harvestNotes: "Harvest when heads are firm; stores 2-6 weeks in cool, humid conditions.",
  },
  Leeks: {
    durationWeeks: 12,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Deep, fertile, well-drained soil", "Add compost"] },
      { name: "Sowing", durationWeeks: 1, keyActivities: ["Sow thinly in seedbed", "Keep warm for germination"] },
      { name: "Seedling", durationWeeks: 2, keyActivities: ["Thin and sow progressively for blanching"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Plant in blocks", "Spacing 15x20 cm"] },
      { name: "Vegetative/Bulking", durationWeeks: 6, keyActivities: ["Keep soil moist", "Feed with N-rich fertilizer every 4 weeks", "Mound/bunch"] },
      { name: "Blanching", durationWeeks: 2, keyActivities: ["Blanch by tying leaves", "Reduce watering"] },
      { name: "Harvest", durationWeeks: 1, keyActivities: ["Harvest at 2-3 cm diameter", "120-150 days"] },
    ],
    waterSchedule: "Keep soil evenly moist; mulch to retain moisture.",
    fertilizerSchedule: "Basemap compost + 24-8-8 every 4 weeks; side-dress N during bulking.",
    pestManagement: "Watch leek mining moth and thrips; blanch by tying leaves for pale stems.",
    harvestNotes: "Best flavour after light frost; can be stored in-ground in cool climates.",
  },
  Brinjal: {
    durationWeeks: 14,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Well-drained soil with organic matter", "Raised beds"] },
      { name: "Nursery", durationWeeks: 2, keyActivities: ["Raise transplants 4-5 weeks"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Transplant 4-week seedlings", "Spacing 45x50 cm", "Stake"] },
      { name: "Vegetative", durationWeeks: 3, keyActivities: ["Regular deep watering", "First NPK application"] },
      { name: "Flowering & Set", durationWeeks: 2, keyActivities: ["Maintain moisture", "Watch for flower drop"] },
      { name: "Fruiting", durationWeeks: 5, keyActivities: ["Harvest every 2-3 days", "Balanced NPK side-dress"] },
      { name: "Late Season", durationWeeks: 2, keyActivities: ["Continue harvesting", "Reduce nitrogen"] },
    ],
    waterSchedule: "Regular deep watering 2-3x/week; avoid waterloading.",
    fertilizerSchedule: "Basemap compost + NPK 10-10-10; side-dress N-K every 4 weeks; stake fruits.",
    pestManagement: "Watch shoot borer, jassid and fruit rot; hand-pick pests; neem-based sprays.",
    harvestNotes: "Harvest glossy purple fruits at 50-70 days after transplant; frequent picking.",
  },
  Maize: {
    durationWeeks: 18,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Well-drained field", "Apply compost"] },
      { name: "Planting", durationWeeks: 1, keyActivities: ["Plant 5-7cm deep", "Spacing 75x25 cm"] },
      { name: "Germination", durationWeeks: 1, keyActivities: ["Keep soil moist", "Thin to one plant per station"] },
      { name: "Vegetative (V6-V16)", durationWeeks: 8, keyActivities: ["Weeding", "1st top-dress N at knee-high stage"] },
      { name: "Tasseling & Silking", durationWeeks: 2, keyActivities: ["Critical irrigation window", "2nd N application"] },
      { name: "Grain Filling", durationWeeks: 6, keyActivities: ["Maintain moisture", "Protect from pests"] },
      { name: "Maturity & Harvest", durationWeeks: 2, keyActivities: ["Harvest at 30-32% moisture", "Dry to 14-15%"] },
    ],
    waterSchedule: "Regular irrigation, critical at tasseling/silking; ~500 mm seasonal requirement.",
    fertilizerSchedule: "Basemap compost + NPK 16-16-16; 1/2 N at knee-high; remainder at tasseling.",
    pestManagement: "Control fall armyworm, stalk borer and maize streak; early planting reduces risk.",
    harvestNotes: "Shell within 24h of harvest; dry promptly to prevent aflatoxin.",
  },
  Carrot: {
    durationWeeks: 12,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Deep, stone-free seedbed", "Add sand/compost if heavy soil"] },
      { name: "Sowing", durationWeeks: 1, keyActivities: ["Sow thin 0.5-1cm deep", "Keep soil moist for germination"] },
      { name: "Germination", durationWeeks: 2, keyActivities: ["Keep soil consistently moist", "Cover with mulch"] },
      { name: "Thinning", durationWeeks: 2, keyActivities: ["Thin to 2-3 cm spacing", "Hoe carefully"] },
      { name: "Root Development", durationWeeks: 8, keyActivities: ["Weeding", "Side-dress lightly", "Avoid excess N (forked roots)"] },
      { name: "Top Killing", durationWeeks: 1, keyActivities: ["Blanch-pull or frost-kill tops"] },
      { name: "Harvest", durationWeeks: 1, keyActivities: ["Pull roots at 1.5-2.5 cm diameter", "70-120 days"] },
    ],
    waterSchedule: "Keep soil evenly moist (not waterlogged); 1 inch/week.",
    fertilizerSchedule: "Basemap compost + 5-10-10; light N side-dress; avoid high nitrogen.",
    pestManagement: "Watch carrot fly and wireworm; use fine seedbed; rotate with cereals.",
    harvestNotes: "Harvest fresh or store in sand at 0-4C; wash and top before storage.",
  },
  Beans: {
    durationWeeks: 10,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Well-drained field", "Add compost"] },
      { name: "Sowing", durationWeeks: 1, keyActivities: ["Sow 3-5cm deep", "Support stakes at planting"] },
      { name: "Germination", durationWeeks: 1, keyActivities: ["Keep soil moist"] },
      { name: "Vegetative", durationWeeks: 3, keyActivities: ["Weeding", "Light irrigation"] },
      { name: "Flowering & Pod Set", durationWeeks: 2, keyActivities: ["Adequate phosphorus", "Pest scouting"] },
      { name: "Pod Development", durationWeeks: 3, keyActivities: ["Regular picking", "Reduce N"] },
      { name: "Harvest", durationWeeks: 1, keyActivities: ["Pick pods at 10-12 cm long", "60-80 days"] },
    ],
    waterSchedule: "Moderate watering; avoid waterlogging; reduce 1 week before harvest.",
    fertilizerSchedule: "Basemap compost + 4-14-8 at planting; beans fix N - limit additional nitrogen.",
    pestManagement: "Watch aphids, bruchids and bacterial blight; harvest frequently to extend production.",
    harvestNotes: "Snap beans: harvest every 2-3 days; dried beans: harvest when 70% pods brown.",
  },
  Tomato: {
    durationWeeks: 14,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Raised beds", "Add compost + well-rotted manure"] },
      { name: "Sowing", durationWeeks: 2, keyActivities: ["Sow seeds in nursery 6-8 weeks before transplant"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Transplant 4-week seedlings", "Spacing 60x45 cm", "Stake/cage at planting"] },
      { name: "Vegetative", durationWeeks: 3, keyActivities: ["Mulch", "Drip irrigation", "Remove suckers"] },
      { name: "Flowering & Set", durationWeeks: 2, keyActivities: ["Maintain even moisture", "Watch for blossom end rot (Ca)"] },
      { name: "Fruiting", durationWeeks: 5, keyActivities: ["Side-dress N every 3 weeks", "Prune leaves below first fruit", "Harvest regularly"] },
      { name: "Maturation", durationWeeks: 2, keyActivities: ["Reduce watering slightly", "Final harvest"] },
    ],
    waterSchedule: "Consistent mulched irrigation; avoid wetting foliage; 1-1.5 inches/week.",
    fertilizerSchedule: "Basemap compost + NPK 10-10-10; calcium nitrate every 3 weeks; high-potash at fruit set.",
    pestManagement: "Control leafminer, whitefly and early/late blight; rotate crops; remove infected leaves weekly.",
    harvestNotes: "Harvest when fully colored; every 2-3 days for peak production (70-85 days).",
  },
  Onion: {
    durationWeeks: 16,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Fine, weed-free seedbed", "Add compost"] },
      { name: "Nursery/Sowing", durationWeeks: 2, keyActivities: ["Sow seeds in nursery or direct sow thinly"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Transplant 21-day seedlings", "Spacing 10x15 cm"] },
      { name: "Bulb Development", durationWeeks: 9, keyActivities: ["Light, frequent watering", "Weed control", "2nd N top-dress"] },
      { name: "Bulb Maturation", durationWeeks: 3, keyActivities: ["Reduce irrigation to prevent rot"] },
      { name: "Harvest & Curing", durationWeeks: 2, keyActivities: ["Harvest when leaves yellow and fall", "Cure 7-10 days in shade"] },
    ],
    waterSchedule: "Moderate, even watering; reduce irrigation 3-4 weeks before harvest.",
    fertilizerSchedule: "Basemap compost + 10-30-20 at planting; top-dress urea during bulb formation.",
    pestManagement: "Watch thrips, purple blotch and nematodes; practice 2-3 year rotation.",
    harvestNotes: "Cure bulbs to 14-16% moisture; store in cool, dry, ventilated conditions.",
  },
  Rice: {
    durationWeeks: 20,
    stages: [
      { name: "Land Preparation", durationWeeks: 2, keyActivities: ["Puddle and level the field", "Set bunds", "Apply farmyard manure"] },
      { name: "Nursery & Sowing", durationWeeks: 1, keyActivities: ["Raise seedlings in nursery", "Soak seeds 8-12h before sowing"] },
      { name: "Transplanting", durationWeeks: 1, keyActivities: ["Transplant seedlings 20-25 days old", "Spacing 20x15 cm"] },
      { name: "Tillering", durationWeeks: 4, keyActivities: ["Continuous flooding irrigation", "First top-dress N", "Weed control"] },
      { name: "Panicle Initiation", durationWeeks: 5, keyActivities: ["Maintain 5-10 cm standing water", "2nd and 3rd N splits", "Drain 1 week before flowering"] },
      { name: "Flowering & Grain Filling", durationWeeks: 4, keyActivities: ["Maintain moisture", "Protect from lodging", "Apply plant growth regulators if needed"] },
      { name: "Maturation & Harvest", durationWeeks: 3, keyActivities: ["Drain field 10-14 days before harvest", "Harvest at 25% moisture"] },
    ],
    waterSchedule: "Continuous flooded paddock irrigation for ~120 days; drain 10-14 days before harvest.",
    fertilizerSchedule: "Basemap: 1/2 N + full P2O5 + K2O + ZnSO4 at planting; tillering: 1/4 N; panicle initiation: 1/4 N; flowering: balance N.",
    pestManagement: "Watch for brown planthopper, gall midge and false smut; early planting avoids peak pest pressure; maintain shallow flood.",
    harvestNotes: "Harvest at ~25% grain moisture; thresh within 24h; dry to 14% for storage.",
  },
  Pumpkin: {
    durationWeeks: 12,
    stages: [
      { name: "Land Preparation", durationWeeks: 1, keyActivities: ["Well-drained sandy loam", "Raised beds", "Compost + rock phosphate"] },
      { name: "Sowing", durationWeeks: 1, keyActivities: ["Seeds 2-3cm deep", "Spacing 2x2 m"] },
      { name: "Trellising", durationWeeks: 1, keyActivities: ["Install trellis/netting to save space"] },
      { name: "Vegetative Growth", durationWeeks: 4, keyActivities: ["Water 2-3x/week", "Side-dress NPK 10-10-10"] },
      { name: "Flowering & Fruit Set", durationWeeks: 3, keyActivities: ["Pollinator support", "Hand pollination if needed"] },
      { name: "Fruit Development", durationWeeks: 4, keyActivities: ["Consistent watering", "Reduce water 1 week before harvest"] },
      { name: "Harvest", durationWeeks: 1, keyActivities: ["Pick when rind is hard and orange-yellow"] },
    ],
    waterSchedule: "Water 2-3 times per week (1 inch/week); reduce irrigation 1 week before harvest.",
    fertilizerSchedule: "Basemap compost + rock phosphate; NPK 10-10-10 every 4 weeks during vegetative growth.",
    pestManagement: "Watch for aphids, cucumber beetles and powdery mildew; trellis to improve air flow.",
    harvestNotes: "Harvest fruits at 80-120 days; store in cool, dry conditions.",
  },
};
const zeroFactors = (): CropScoreFactors => ({
  yieldScore: 0,
  priceScore: 0,
  demandScore: 0,
  supplyGapScore: 0,
  competitionScore: 0,
  weatherScore: 0,
  revenueScore: 0,
  riskScore: 0,
});

/** Estimate weather suitability, falling back to the catalog value. */
function resolveWeatherSuitability(option: CropOption, season: Season): number {
  if (option.weatherSuitability && option.weatherSuitability > 0) {
    return option.weatherSuitability;
  }
  const catalog = CROP_CATALOG[option.cropName];
  if (catalog?.weatherSuitability?.[season] != null) {
    return catalog.weatherSuitability[season];
  }
  return 50;
}

/**
 * Build a complete, displayable growing plan for a selected crop.
 */
export function buildCropPlan(
  option: CropOption,
  profile: ProfileData | null | undefined,
  season: Season,
  year: number,
  landAreaHa: number,
  hasIrrigation: boolean,
): CropPlanDraft {
  const catalog = CROP_CATALOG[option.cropName] ?? CROP_CATALOG["Beans"];
  const yieldPerHa = option.predictedYieldTPerHa ?? catalog.baseYieldTPerHa;
  const pricePerKg = option.marketPriceRsPerKg ?? catalog.typicalPriceRsPerKg;
  const weatherSuitability = resolveWeatherSuitability(option, season);

  const demand =
    option.estimatedDemandTonnes ??
    ESTIMATED_DEMAND_TONNES[option.cropName] ??
    0;

  let riskLevel = option.riskLevel;
  if (!riskLevel) {
    riskLevel = scoring.getRiskLevel(option.factors ?? zeroFactors());
  }

  let competition = option.competitionLevel;
  if (!competition) {
    competition = scoring.getCompetitionLevel(
      0,
      demand,
      option.expectedSupplyTonnes ?? 0,
    );
  }

    const expectedProductionTonnes =
    Math.round(yieldPerHa * landAreaHa * 10) / 10;
  const rev = revenue.calculate(yieldPerHa, landAreaHa, pricePerKg);
  const revenuePerHaRs = Math.round(yieldPerHa * 1000 * pricePerKg);

  const explainableRec: CropRecommendation = {
    cropName: option.cropName,
    recommendationScore: option.score,
    factors: option.factors ?? zeroFactors(),
    predictedYieldTPerHa: option.predictedYieldTPerHa,
    marketPriceRsPerKg: option.marketPriceRsPerKg,
    estimatedDemandTonnes: option.estimatedDemandTonnes,
    expectedSupplyTonnes: option.expectedSupplyTonnes ?? 0,
    demandGapTonnes: option.demandGapTonnes,
    competitionLevel: (competition ?? "Medium") as "Low" | "Medium" | "High",
    expectedGrossRevenueRs: option.expectedGrossRevenueRs,
    weatherSuitability,
    riskLevel: (riskLevel ?? "Medium") as "Low" | "Medium" | "High",
    explanation: option.explanation ?? "",
    dataSources: {
      yield: "estimated",
      price: "estimated",
      demand: "estimated",
    },
  };
  const summary = explanation.explain(explainableRec);

  const guideline = GROWING_GUIDELINES[option.cropName] ?? GENERIC_GUIDELINE;
  const region = profile?.region?.trim() || "Kandy";

  return {
    id: `plan_${option.cropName}_${Date.now()}`,
    farmerId: profile?.id ?? profile?.email,
    cropName: option.cropName,
    season,
    year,
    location: region,
    cultivatedAreaHa: landAreaHa,
    hasIrrigation,
    predictedYieldTPerHa: yieldPerHa,
    expectedProductionTonnes,
    expectedRevenueRs: rev.expectedGrossRevenueRs,
    revenuePerHaRs,
    marketPriceRsPerKg: pricePerKg,
    weatherSuitability,
    riskLevel: riskLevel ?? "Medium",
    competitionLevel: competition ?? "Medium",
    recommendationScore: option.score,
    summary,
    growthStages: guideline.stages,
    timeline: buildSeasonTimeline(season),
    waterSchedule: guideline.waterSchedule,
    fertilizerSchedule: guideline.fertilizerSchedule,
    pestManagement: guideline.pestManagement,
    harvestNotes: guideline.harvestNotes,
    dataStatus: option.dataStatus || "ESTIMATED",
    sources: option.dataStatus ? [option.dataStatus] : ["ESTIMATED"],
    createdAt: new Date().toISOString(),
  };
}

export function estimatePlanDurationWeeks(option: CropOption): number {
  const guideline = GROWING_GUIDELINES[option.cropName] ?? GENERIC_GUIDELINE;
  return guideline.durationWeeks;
}
