"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { resolveThemePreference, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function syncFromDocument() {
      setThemeState(root.dataset.theme === "dark" ? "dark" : "light");
    }

    function syncSystemPreference() {
      const stored = readStoredTheme();
      if (stored === "light" || stored === "dark") return;
      const next = resolveThemePreference(null, media.matches);
      root.dataset.theme = next;
      setThemeState(next);
    }

    syncFromDocument();
    media.addEventListener("change", syncSystemPreference);
    const observer = new MutationObserver(syncFromDocument);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      media.removeEventListener("change", syncSystemPreference);
      observer.disconnect();
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Depolama kapalıysa tema bu sekmede yine uygulanır.
    }
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme yalnızca ThemeProvider içinde kullanılabilir.");
  return context;
}
