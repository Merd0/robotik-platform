"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlanningGrid, SahneAlani } from "@/components/scene/LazyScene";
import type { PlannerPathDisplay } from "@/components/scene/PlanningGrid";
import { isPointFree, type Obstacle } from "@/lib/robotics/collision";
import { PLANNER_IDS, pathLength, type PlanResult, type PlannerId } from "@/lib/robotics/planners";
import type { Vec3 } from "@/lib/robotics/transform";
import type { PlannerWorkerRequest, PlannerWorkerResponse } from "@/lib/workers/plannerWorker";

interface PlannerRaceProps {
  /** Yarışa girecek algoritmalar; tek algoritma verilirse "yarış" değil tek sahne olur. */
  algorithms?: PlannerId[];
  /** Kullanıcı sahneye dokunarak engel ekleyip kaldırabilsin mi. */
  allowObstacleEdit?: boolean;
  initialObstacles?: Obstacle[];
  /** Sahnenin kenar uzunluğu (metre). */
  extent?: number;
  theme?: "ortaokul" | "lise" | "universite";
}

const ALGORITHM_LABELS: Record<PlannerId, string> = {
  astar: "A*",
  rrt: "RRT",
  rrt_star: "RRT*",
};

const ALGORITHM_COLORS: Record<PlannerId, string> = {
  astar: "#0ea5a0",
  rrt: "#f59e0b",
  rrt_star: "#7c3aed",
};

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/70",
    divide: "border-ortaokul-ink/10",
    button: "bg-ortaokul-ink text-ortaokul-surface",
    outline: "border-ortaokul-ink/20",
  },
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    divide: "border-lise-ink/10",
    button: "bg-lise-ink text-lise-surface",
    outline: "border-lise-ink/20",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    divide: "border-universite-ink/10",
    button: "bg-universite-ink text-universite-surface",
    outline: "border-universite-ink/20",
  },
} as const;

const DEFAULT_OBSTACLE_RADIUS = 0.18;
const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Ders içine gömülen etkileşimli sahne: A*, RRT, RRT*'yi aynı engel
 * düzeninde yarıştırır. Kullanıcı sahneye dokunarak kendi engel düzenini
 * kurabilir (bkz. docs/03-yol-haritasi.md Faz 2). Hesaplama Web Worker
 * içinde çalışır, ana thread'i kilitlemez (bkz. docs/02-mimari.md).
 */
export function PlannerRace({
  algorithms = PLANNER_IDS,
  allowObstacleEdit = true,
  initialObstacles = [],
  extent = 3,
  theme = "universite",
}: PlannerRaceProps) {
  const t = THEME[theme];
  const half = extent / 2;
  const start: Vec3 = useMemo(() => ({ x: -half + 0.35, y: -half + 0.35, z: 0 }), [half]);
  const goal: Vec3 = useMemo(() => ({ x: half - 0.35, y: half - 0.35, z: 0 }), [half]);

  const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles);
  const [results, setResults] = useState<Partial<Record<PlannerId, PlanResult>>>({});
  const [running, setRunning] = useState(false);
  // Klavye ile engel koymak için imleç konumu (sahneye dokunmanın alternatifi).
  const [cursor, setCursor] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // /workers/planner-worker.js, scripts/build-worker.mjs tarafından
    // lib/workers/plannerWorker.ts'ten önceden derlenir (bkz. o script'in
    // başındaki not — Next'in kendi worker bundling'i bu projede güvenilmez
    // çıktı, bu yüzden esbuild ile elle derliyoruz).
    const worker = new Worker("/workers/planner-worker.js");
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  function handlePlaneClick(point: Vec3) {
    if (!allowObstacleEdit) return;
    setObstacles((prev) => {
      const hitIndex = prev.findIndex((obstacle) => !isPointFree(point, [obstacle]));
      if (hitIndex >= 0) return prev.filter((_, i) => i !== hitIndex);
      return [...prev, { kind: "sphere", center: point, size: [DEFAULT_OBSTACLE_RADIUS] }];
    });
    setResults({});
  }

  function handleClear() {
    setObstacles([]);
    setResults({});
  }

  async function handleRace() {
    const worker = workerRef.current;
    if (!worker || running) return;
    setRunning(true);
    setResults({});

    await Promise.all(
      algorithms.map(
        (algorithm) =>
          new Promise<void>((resolve) => {
            const requestId = `${algorithm}-${Date.now()}-${Math.random()}`;
            function onMessage(event: MessageEvent<PlannerWorkerResponse>) {
              if (event.data.requestId !== requestId) return;
              worker!.removeEventListener("message", onMessage);
              setResults((prev) => ({ ...prev, [algorithm]: event.data.result }));
              resolve();
            }
            worker!.addEventListener("message", onMessage);
            // Sahne üstten görünen 2B bir çalışma alanı; planlayıcı 3B
            // arayınca yol z ekseninden dolaşıp engeli delmiş gibi
            // görünüyordu. Düzlemsel mod bunu kapatır.
            const request: PlannerWorkerRequest = {
              requestId,
              algorithm,
              start,
              goal,
              obstacles,
              options: {
                astar: { planar: true },
                rrt: { planar: true },
                rrt_star: { planar: true },
              },
            };
            worker!.postMessage(request);
          }),
      ),
    );

    setRunning(false);
  }

  const paths: PlannerPathDisplay[] = algorithms
    .filter((id) => results[id]?.success)
    .map((id) => ({ algorithm: id, color: ALGORITHM_COLORS[id], points: results[id]!.path }));

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      <SahneAlani className={`aspect-square w-full overflow-hidden rounded-lg ${t.bg} sm:aspect-video`}>
        <PlanningGrid
          extent={extent}
          obstacles={obstacles}
          start={start}
          goal={goal}
          paths={paths}
          onPlaneClick={allowObstacleEdit ? handlePlaneClick : undefined}
        />
      </SahneAlani>

      {/*
        Sahneye dokunmak engel eklemenin doğal yolu ama klavyeyle yapılamıyor.
        docs/02 "her etkileşimli sahnenin klavyeyle kullanılabilir bir
        alternatifi olmalı" gereği aynı işlem X/Y kaydırıcıları + bir düğmeyle
        de yapılabiliyor; ikisi de handlePlaneClick'e gidiyor, davranış aynı.
      */}
      {allowObstacleEdit && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["x", "y"] as const).map((eksen) => (
              <label key={eksen} className={`flex flex-col gap-1 text-sm ${t.ink}`}>
                <span>
                  Engel {eksen.toUpperCase()}: {round(cursor[eksen])}
                </span>
                <input
                  type="range"
                  className="h-11 touch-none"
                  min={-half}
                  max={half}
                  step={0.05}
                  value={cursor[eksen]}
                  onChange={(event) =>
                    setCursor((prev) => ({ ...prev, [eksen]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handlePlaneClick(cursor)}
            className={`h-11 self-start rounded-md border ${t.outline} px-4 text-sm ${t.ink}`}
          >
            Bu noktaya engel ekle / kaldır
          </button>
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 text-sm ${t.ink}`}>
        <span role="status" className={t.inkMuted}>
          {allowObstacleEdit
            ? `Sahneye dokunarak da engel ekleyebilirsin. Şu an ${obstacles.length} engel var.`
            : "Bu sahnede engel düzeni sabit."}
        </span>
        <div className="flex gap-2">
          {allowObstacleEdit && (
            <button type="button" onClick={handleClear} className={`h-11 rounded-md border ${t.outline} px-4`}>
              Engelleri temizle
            </button>
          )}
          <button
            type="button"
            onClick={handleRace}
            disabled={running}
            className={`h-11 rounded-md px-4 ${t.button} disabled:opacity-50`}
          >
            {running ? "Çalışıyor…" : algorithms.length > 1 ? "Yarıştır" : "Çalıştır"}
          </button>
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${t.ink}`}>
            <thead>
              <tr className={t.inkMuted}>
                <th className="py-1 pr-4">Algoritma</th>
                <th className="py-1 pr-4">Sonuç</th>
                <th className="py-1 pr-4">Süre</th>
                <th className="py-1 pr-4">Genişletilen düğüm</th>
                <th className="py-1 pr-4">Yol uzunluğu</th>
              </tr>
            </thead>
            <tbody>
              {algorithms.map((id) => {
                const result = results[id];
                return (
                  <tr key={id} className={`border-t ${t.divide}`}>
                    {/*
                      Algoritma adı, sahnedeki yol rengiyle eşleşsin diye
                      renkli bir kare taşır — ama metnin kendisi ink renginde
                      kalır (renkli metin WCAG AA kontrastını karşılamıyordu).
                    */}
                    <td className="py-1 pr-4 font-medium">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block size-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: ALGORITHM_COLORS[id] }}
                        />
                        {ALGORITHM_LABELS[id]}
                      </span>
                    </td>
                    <td className="py-1 pr-4">{result ? (result.success ? "başarılı" : "başarısız") : "—"}</td>
                    <td className="py-1 pr-4">{result ? `${round(result.elapsedMs)} ms` : "—"}</td>
                    <td className="py-1 pr-4">{result ? result.nodesExpanded : "—"}</td>
                    <td className="py-1 pr-4">{result && result.success ? round(pathLength(result.path)) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
