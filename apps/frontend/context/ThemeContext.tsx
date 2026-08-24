/**
 * ThemeContext — Provides app-wide theme state with persistence.
 *
 * Supports "light", "dark", and "system" modes.
 * - "system" follows the device's color scheme via useColorScheme().
 * - The selected mode is persisted in AsyncStorage.
 * - On app start, the saved mode is loaded; if none, "system" is used.
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

import {
    AppTheme,
    darkTheme,
    lightTheme,
    THEME_STORAGE_KEY,
    ThemeMode,
} from "../theme/theme";

type ThemeContextValue = {
  theme: AppTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Load saved theme mode on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          mounted &&
          saved &&
          (saved === "light" || saved === "dark" || saved === "system")
        ) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch {
        // Fall back to system
      } finally {
        // The default system theme remains usable while storage is loading.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // Non-fatal
    });
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const value = useMemo(
    () => ({ theme, themeMode, setThemeMode, isDark }),
    [theme, themeMode, setThemeMode, isDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
