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
  /** Bu sayfada en az bir laboratuvar Öğren/Mühendislik ayrımını gerçekten
   * destekliyorsa true — bkz. `useDeclareComplexityModeSupport`. */
  supported: boolean;
  registerSupport: () => void;
  unregisterSupport: () => void;
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
 * Faz 7 (2026-08-23) — global provider, kök `layout.tsx`de `ThemeProvider`
 * ile aynı seviyede monteli (bkz. docs/durum-denetim.md "Faz 7 global
 * rollout"). İki senkron sorunu ayrı ayrı çözülür:
 *
 * 1. Aynı sayfada birden fazla bileşen — TEK context örneği paylaşıldığı
 *    için otomatik senkron, ekstra kod gerekmez.
 * 2. Farklı sekme/pencereler — `storage` olayı yalnız BAŞKA bir dokümanda
 *    yazıldığında tetiklenir (aynı sekme kendi `localStorage.setItem`
 *    çağrısından olay almaz, bu yüzden `setMode` ayrıca kendi state'ini
 *    günceller); bu sekme dinleyip anında senkronlanır.
 */
export function ComplexityModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ComplexityMode>(DEFAULT_COMPLEXITY_MODE);
  const [supportCount, setSupportCount] = useState(0);

  useEffect(() => {
    function syncFromStorage() {
      setModeState(resolveComplexityMode(readStoredMode()));
    }
    syncFromStorage();
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== COMPLEXITY_MODE_STORAGE_KEY) return;
      setModeState(resolveComplexityMode(event.newValue));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setMode = useCallback((next: ComplexityMode) => {
    try {
      window.localStorage.setItem(COMPLEXITY_MODE_STORAGE_KEY, next);
    } catch {
      // Depolama kapalıysa mod yine bu sekmede uygulanır, kalıcı olmaz.
    }
    setModeState(next);
  }, []);

  const registerSupport = useCallback(() => setSupportCount((count) => count + 1), []);
  const unregisterSupport = useCallback(() => setSupportCount((count) => count - 1), []);

  const value = useMemo(
    () => ({ mode, setMode, supported: supportCount > 0, registerSupport, unregisterSupport }),
    [mode, setMode, supportCount, registerSupport, unregisterSupport],
  );
  return <ComplexityModeContext.Provider value={value}>{children}</ComplexityModeContext.Provider>;
}

export function useComplexityMode(): Pick<ComplexityModeContextValue, "mode" | "setMode" | "supported"> {
  const context = useContext(ComplexityModeContext);
  if (!context) throw new Error("useComplexityMode yalnızca ComplexityModeProvider içinde kullanılabilir.");
  return context;
}

/**
 * Öğren/Mühendislik ayrımını GERÇEKTEN destekleyen bir laboratuvar (IkTarget,
 * JacobianViz, DlsTraceLab) bunu monte olduğu sürece çağırır. `SiteHeader`
 * daki global toggle, `supported` false olduğunda kendini gizler — kullanıcı
 * hiçbir şeyi değiştirmeyen bir toggle görüp kafası karışmaz.
 */
export function useDeclareComplexityModeSupport(): void {
  const context = useContext(ComplexityModeContext);
  if (!context) throw new Error("useDeclareComplexityModeSupport yalnızca ComplexityModeProvider içinde kullanılabilir.");
  const { registerSupport, unregisterSupport } = context;
  useEffect(() => {
    registerSupport();
    return () => unregisterSupport();
  }, [registerSupport, unregisterSupport]);
}
