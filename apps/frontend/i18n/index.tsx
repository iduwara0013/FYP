/**
 * i18n — Application-wide internationalization system.
 *
 * Supports English and Sinhala. The language is persisted in AsyncStorage
 * and defaults to the device language when available.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import { en } from "./translations/en";
import { si } from "./translations/si";

export type Language = "en" | "si";

type TranslationKey = keyof typeof en.common;

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations: Record<Language, typeof en> = {
  en,
  si,
};

const LANGUAGE_STORAGE_KEY = "@smart_crop_language";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [language, setLanguageState] = useState<Language>("en");
  const [isReady, setIsReady] = useState(false);

  // Detect device language and load saved preference
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (mounted && saved && (saved === "en" || saved === "si")) {
          setLanguageState(saved as Language);
        } else {
          // Detect device language - default to Sinhala if device is Sinhala
          const deviceLang =
            typeof navigator !== "undefined"
              ? navigator.language?.toLowerCase() ?? ""
              : "";
          if (deviceLang.startsWith("si")) {
            setLanguageState("si");
          }
        }
      } catch {
        // Fall back to English
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {
      // Non-fatal
    });
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = translations[language]?.common as Record<string, string>;
      return dict?.[key] ?? (en.common as Record<string, string>)[key] ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}