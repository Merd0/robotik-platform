"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { selectSceneDpr } from "@/lib/scenePerformance";

interface SceneRuntimeValue {
  active: boolean;
  dpr: number;
}

const SceneRuntimeContext = createContext<SceneRuntimeValue>({ active: true, dpr: 1 });

function subscribeToViewport(onChange: () => void) {
  window.addEventListener("resize", onChange, { passive: true });
  window.visualViewport?.addEventListener("resize", onChange, { passive: true });
  return () => {
    window.removeEventListener("resize", onChange);
    window.visualViewport?.removeEventListener("resize", onChange);
  };
}

function getDprSnapshot() {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  return selectSceneDpr({
    viewportWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb: navigatorWithMemory.deviceMemory,
  });
}

export function SceneRuntimeProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const dpr = useSyncExternalStore(subscribeToViewport, getDprSnapshot, () => 1);
  return <SceneRuntimeContext.Provider value={{ active, dpr }}>{children}</SceneRuntimeContext.Provider>;
}

export function useSceneRuntime(): SceneRuntimeValue {
  return useContext(SceneRuntimeContext);
}
