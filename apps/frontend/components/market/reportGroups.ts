import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ParsedEntry } from "./types";

export type ReportSection = {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  products: ParsedEntry[];
};

type SectionRule = {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  patterns: RegExp[];
};

const SECTION_RULES: SectionRule[] = [
  {
    id: "big-onion",
    name: "Big Onion",
    icon: "circle-slice-8",
    patterns: [/big onion/i],
  },
  {
    id: "dried-chillies",
    name: "Dried Chillies",
    icon: "fire",
    patterns: [/dried/i, /chilli/i, /chillies/i],
  },
  {
    id: "onion",
    name: "Onion",
    icon: "circle-slice-8",
    patterns: [/^onion\b/i, /sinnan/i, /vedalan/i],
  },
  {
    id: "potatoes",
    name: "Potatoes",
    icon: "food-variant",
    patterns: [/potato/i, /welimada/i, /nuwara eliya/i, /nuwara/i],
  },
  {
    id: "eggs",
    name: "Eggs",
    icon: "egg",
    patterns: [/egg/i, /^brown$/i, /^white$/i],
  },
  {
    id: "imported-rice",
    name: "Imported Rice",
    icon: "package-variant-closed",
    patterns: [/ponne/i, /imported.*rice/i, /rice.*imported/i, /^nadu$/i],
  },
  {
    id: "rice",
    name: "Rice",
    icon: "grain",
    patterns: [
      /samba/i,
      /keeri/i,
      /^nadu\s*\d/i,
      /raw red/i,
      /raw white/i,
      /paddy/i,
      /rice/i,
    ],
  },
  {
    id: "pulses",
    name: "Pulses",
    icon: "seed",
    patterns: [/gram/i, /cowpea/i, /dhal/i, /mung/i, /pulses/i],
  },
  {
    id: "consumption",
    name: "Consumption Items",
    icon: "basket",
    patterns: [/sugar/i, /flour/i, /wheat/i],
  },
  {
    id: "up-country",
    name: "Up Country Vegetables",
    icon: "tree",
    patterns: [
      /bean/i,
      /carrot/i,
      /leek/i,
      /beet/i,
      /knol/i,
      /radish/i,
      /cabbage/i,
      /tomato/i,
    ],
  },
  {
    id: "low-country",
    name: "Low Country Vegetables",
    icon: "leaf",
    patterns: [
      /ladies/i,
      /brinjal/i,
      /capsicum/i,
      /pumpkin/i,
      /cucumber/i,
      /gourd/i,
      /drumstick/i,
      /luffa/i,
      /long bean/i,
      /ash plantain/i,
      /green chilli/i,
      /lime/i,
      /sweet potato/i,
      /manioc/i,
      /eggplant/i,
    ],
  },
  {
    id: "banana",
    name: "Banana",
    icon: "fruit-cherries",
    patterns: [/banana/i, /ambul/i, /kolikuttu/i, /seeni/i, /anamalu/i],
  },
  {
    id: "fruits",
    name: "Other Fruits",
    icon: "fruit-pineapple",
    patterns: [
      /papaya/i,
      /passion/i,
      /pineapple/i,
      /mango/i,
      /wood/i,
      /orange/i,
      /avocado/i,
    ],
  },
];

const DEFAULT_SECTION: SectionRule = {
  id: "other",
  name: "Other Items",
  icon: "basket-outline",
  patterns: [],
};

export function buildReportSections(entries: ParsedEntry[]): ReportSection[] {
  const sections = new Map<string, ReportSection>();

  const ensureSection = (rule: SectionRule): ReportSection => {
    const existing = sections.get(rule.id);
    if (existing) return existing;
    const created: ReportSection = {
      id: rule.id,
      name: rule.name,
      icon: rule.icon,
      products: [],
    };
    sections.set(rule.id, created);
    return created;
  };

  for (const entry of entries) {
    const rule =
      SECTION_RULES.find((candidate) =>
        candidate.patterns.some((pattern) => pattern.test(entry.cropName)),
      ) ?? DEFAULT_SECTION;

    ensureSection(rule).products.push(entry);
  }

  return Array.from(sections.values()).map((section, index) => ({
    ...section,
    id: `${index}-${section.id}`,
  }));
}

export function derivePreviousAverage(
  average: number | null,
  change: number | null,
): number | null {
  if (average === null || change === null) return null;
  return average - change;
}
