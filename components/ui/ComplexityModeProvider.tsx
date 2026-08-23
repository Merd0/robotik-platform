"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  COMPLEXITY_MODE_STORAGE_KEY,
  DEFAULT_COMPLEXITY_MODE,
  resolveComplexityMode,
  type ComplexityMode,
} from "@/lib/complexityMode";

interface ComplexityModeContextValue {
  mode: ComplexityMode;
  setMode: (mode: ComplexityMode) => void;
}

const ComplexityModeContext = createContext<ComplexityModeContextValue | null>(null);

function readStoredMode(): string | null {
  try {
    return window.localStorage.getItem(COMPLEXITY_MODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Faz 7 dikey dilim (2026-08-23): Öğren/Mühendislik modu — global tasarım
 * niyetiyle ama şimdilik yalnız IkTarget etrafında YEREL olarak monte
 * edilen bir provider (bkz. docs/durum-denetim.md Faz 7 girişi). Onay
 * sonrası kök `layout.tsx`'e taşınıp `ThemeProvider`la aynı seviyede
 * global hale getirilecek — bu bileşen o taşımayı ZATEN destekleyecek
 * şekilde `ThemeProvider` ile birebir aynı desende yazıldı.
 */
export function ComplexityModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ComplexityMode>(DEFAULT_COMPLEXITY_MODE);

  useEffect(() => {
    function syncFromStorage() {
      setModeState(resolveComplexityMode(readStoredMode()));
    }
    syncFromStorage();
  }, []);

  const setMode = useCallback((next: ComplexityMode) => {
    try {
      window.localStorage.setItem(COMPLEXITY_MODE_STORAGE_KEY, next);
    } catch {
      // Depolama kapalıysa mod yine bu sekmede uygulanır, kalıcı olmaz.
    }
    setModeState(next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ComplexityModeContext.Provider value={value}>{children}</ComplexityModeContext.Provider>;
}

export function useComplexityMode(): ComplexityModeContextValue {
  const context = useContext(ComplexityModeContext);
  if (!context) throw new Error("useComplexityMode yalnızca ComplexityModeProvider içinde kullanılabilir.");
  return context;
}
