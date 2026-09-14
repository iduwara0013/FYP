import { useCallback } from "react";
import { useI18n } from "./index";
import { formSinhala } from "./translations/forms";

const normalized = Object.fromEntries(Object.entries(formSinhala).map(([key, value]) => [key.toLowerCase(), value]));

/** Translate display labels without changing stored values or form submissions. */
export function useFormI18n() {
  const { language } = useI18n();
  const tx = useCallback((text: string, values: Record<string, string | number> = {}) => {
    const translated = language === "si" ? formSinhala[text] ?? normalized[text.toLowerCase()] ?? text : text;
    return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  }, [language]);
  const errorText = useCallback((error: unknown, fallback: string) => language === "si" ? tx(fallback) : error instanceof Error ? error.message : fallback, [language, tx]);
  // Older offline records contain these generated English task titles.
  const recordText = useCallback((text: string) => {
    const water = text.match(/^Water and inspect (.+)$/);
    if (water) return tx("Water and inspect {crop}", { crop: tx(water[1]) });
    const fertilizer = text.match(/^Fertilizer review: (.+)$/);
    if (fertilizer) return tx("Fertilizer review: {crop}", { crop: tx(fertilizer[1]) });
    return tx(text);
  }, [tx]);
  return { tx, language, errorText, recordText };
}
