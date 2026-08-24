"use client";

import { useMemo, useState } from "react";
import {
  ChallengeHeader,
  ChallengeResult,
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { PlanningGrid, SahneAlani } from "@/components/scene/LazyScene";
import type { PlannerPathDisplay } from "@/components/scene/PlanningGrid";
import { isPointFree, type Obstacle } from "@/lib/robotics/collision";
import { PLANNER_IDS, pathLength, type PlanResult, type PlannerId } from "@/lib/robotics/planners";
import type { Vec3 } from "@/lib/robotics/transform";
import type { PlannerWorkerRequest } from "@/lib/workers/plannerWorker";
import { runPlannerInWorker } from "@/lib/workers/runPlannerWorker";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { useTheme } from "@/components/ui/ThemeProvider";
import { SCENE_PALETTES } from "@/lib/theme";
import { NasilHesaplandi } from "@/components/interactive/NasilHesaplandi";
import { Neden } from "@/components/interactive/Neden";
import { useComplexityMode, useDeclareComplexityModeSupport } from "@/components/ui/ComplexityModeProvider";

interface PlannerRaceProps {
  /** Yarışa girecek algoritmalar; tek algoritma verilirse "yarış" değil tek sahne olur. */
  algorithms?: PlannerId[];
  /** Kullanıcı sahneye dokunarak engel ekleyip kaldırabilsin mi. */
  allowObstacleEdit?: boolean;
  initialObstacles?: Obstacle[];
  /** Sahnenin kenar uzunluğu (metre). */
  extent?: number;
  theme?: "ortaokul" | "lise" | "universite";
  pilot?: "planner-comparison";
}

const ALGORITHM_LABELS: Record<PlannerId, string> = {
  astar: "A*",
  rrt: "RRT",
  rrt_star: "RRT*",
};

/** Madde 33 — "Neden bu farklar?": her algoritmanın bilinen arama stratejisi, sonucu situasyonel açıklamak için. */
const ALGORITHM_REASON: Record<PlannerId, string> = {
  astar: "A* grid'i sistematik tarar — en kısa yolu garanti eder ama düğüm sayısı engel yoğunluğuyla hızla artar.",
  rrt: "RRT rastgele örnekleme yapar — genelde hızlı ama yol garanti en kısa değildir, zikzaklı olabilir.",
  rrt_star: "RRT*, RRT gibi rastgele örnekler ama sürekli iyileştirir (rewiring) — RRT'den yavaştır ama yol optimale daha yakındır.",
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

/**
 * `theme` diğer ikisinde (ortaokul/lise) sayfa boyunca sabit bir prop — hook
 * kurallarını (koşulsuz çağrı) ihlal etmeden yalnız üniversite temasında
 * desteği kaydettirmek için bu, ayrı, koşullu monte edilen bir bileşene
 * taşındı (bkz. docs/durum-denetim.md "Faz 7 yayılma — PlannerRace").
 */
function PlannerRaceComplexitySupport() {
  useDeclareComplexityModeSupport();
  return null;
}

const DEFAULT_OBSTACLE_RADIUS = 0.18;
const round = (value: number) => Math.round(value * 1000) / 1000;
const CHALLENGE_SEED = 240807;
const CHALLENGE_INITIAL_OBSTACLES: Obstacle[] = [
  { kind: "sphere", center: { x: -0.3, y: 0.35, z: 0 }, size: [DEFAULT_OBSTACLE_RADIUS] },
  { kind: "sphere", center: { x: 0.35, y: -0.25, z: 0 }, size: [DEFAULT_OBSTACLE_RADIUS] },
];

interface PlannerChallengeResult {
  shortest: PlannerId;
  shortestLength: number;
  fewestNodes: PlannerId;
  nodeCount: number;
}

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
  pilot,
}: PlannerRaceProps) {
  const record = useEvidenceRecorder();
  const { mode } = useComplexityMode();
  const { theme: colorMode } = useTheme();
  const palette = SCENE_PALETTES[colorMode];
  const algorithmColors: Record<PlannerId, string> = {
    astar: palette.astar,
    rrt: palette.rrt,
    rrt_star: palette.rrtStar,
  };
  const t = THEME[theme];
  const half = extent / 2;
  const start: Vec3 = useMemo(() => ({ x: -half + 0.35, y: -half + 0.35, z: 0 }), [half]);
  const goal: Vec3 = useMemo(() => ({ x: half - 0.35, y: half - 0.35, z: 0 }), [half]);

  const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles);
  const [results, setResults] = useState<Partial<Record<PlannerId, PlanResult>>>({});
  const [errors, setErrors] = useState<Partial<Record<PlannerId, string>>>({});
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(240807);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeAttempts, setChallengeAttempts] = useState(0);
  // Klavye ile engel koymak için imleç konumu (sahneye dokunmanın alternatifi).
  const [cursor, setCursor] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const challengeAvailable = pilot === "planner-comparison"
    && theme === "universite"
    && ["astar", "rrt", "rrt_star"].every((id) => algorithms.includes(id as PlannerId));
  const challengeResult = useMemo<PlannerChallengeResult | null>(() => {
    if (!challengeActive || obstacles.length !== 3) return null;
    const successful = algorithms
      .map((algorithm) => ({ algorithm, result: results[algorithm] }))
      .filter((entry): entry is { algorithm: PlannerId; result: PlanResult } => Boolean(entry.result?.success));
    if (successful.length !== 3) return null;

    const byPath = [...successful].sort((a, b) => pathLength(a.result.path) - pathLength(b.result.path));
    const byNodes = [...successful].sort((a, b) => a.result.nodesExpanded - b.result.nodesExpanded);
    return {
      shortest: byPath[0].algorithm,
      shortestLength: pathLength(byPath[0].result.path),
      fewestNodes: byNodes[0].algorithm,
      nodeCount: byNodes[0].result.nodesExpanded,
    };
  }, [algorithms, challengeActive, obstacles.length, results]);
  useSharedLabState("planner-race", (state) => {
    if (state.extent !== extent) return;
    const sameAlgorithms = state.algorithms.length === algorithms.length
      && state.algorithms.every((algorithm, index) => algorithm === algorithms[index]);
    if (!sameAlgorithms) return;
    setObstacles(state.obstacles);
    setSeed(state.seed);
    setResults({});
    setErrors({});
    setChallengeActive(false);
    setChallengeAttempts(0);
  });

  function handlePlaneClick(point: Vec3) {
    if (!allowObstacleEdit) return;
    setObstacles((prev) => {
      const hitIndex = prev.findIndex((obstacle) => !isPointFree(point, [obstacle]));
      if (hitIndex >= 0) return prev.filter((_, i) => i !== hitIndex);
      if (challengeActive && prev.length >= 3) return prev;
      return [...prev, { kind: "sphere", center: point, size: [DEFAULT_OBSTACLE_RADIUS] }];
    });
    setResults({});
    setErrors({});
  }

  function handleClear() {
    setObstacles(challengeActive ? CHALLENGE_INITIAL_OBSTACLES : []);
    setResults({});
    setErrors({});
  }

  function resetChallenge() {
    setObstacles(CHALLENGE_INITIAL_OBSTACLES);
    setResults({});
    setErrors({});
    setSeed(CHALLENGE_SEED);
    setCursor({ x: 0, y: 0, z: 0 });
    setChallengeAttempts(0);
  }

  function toggleChallenge() {
    const next = !challengeActive;
    setChallengeActive(next);
    if (next) resetChallenge();
    else {
      setObstacles(initialObstacles);
      setResults({});
      setErrors({});
    }
  }

  async function handleRace() {
    if (running) return;
    setRunning(true);
    if (challengeActive) setChallengeAttempts((current) => current + 1);
    setResults({});
    setErrors({});
    record({ skillId: "planner-comparison", stage: "tried", result: "neutral", metrics: { obstacles: obstacles.length, algorithms: algorithms.length, seed } });

    await Promise.all(
      algorithms.map(async (algorithm) => {
            const requestId = `${algorithm}-${Date.now()}-${seed}`;
            // Sahne üstten görünen 2B bir çalışma alanı; planlayıcı 3B
            // arayınca yol z ekseninden dolaşıp engeli delmiş gibi
            // görünüyordu. Düzlemsel mod bunu kapatır.
            const request: PlannerWorkerRequest = {
              requestId,
              algorithm,
              seed,
              start,
              goal,
              obstacles,
              options: {
                astar: { planar: true },
                rrt: { planar: true },
                rrt_star: { planar: true },
              },
            };
            const response = await runPlannerInWorker(request);
            if (response.status === "error") {
              setErrors((prev) => ({ ...prev, [algorithm]: response.error.message }));
              record({ skillId: "planner-comparison", stage: "observed", result: "retry", metrics: { algorithm, seed, error: response.error.code } });
              return;
            }
            setResults((prev) => ({ ...prev, [algorithm]: response.result }));
            record({ skillId: "planner-comparison", stage: "observed", result: response.result.success ? "success" : "retry", metrics: { algorithm, seed, nodes: response.result.nodesExpanded, elapsedMs: round(response.result.elapsedMs) } });
      }),
    );

    setRunning(false);
  }

  const paths: PlannerPathDisplay[] = algorithms
    .filter((id) => results[id]?.success)
    .map((id) => ({ algorithm: id, color: algorithmColors[id], points: results[id]!.path }));

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {theme === "universite" && <PlannerRaceComplexitySupport />}
      {challengeAvailable && (
        <ChallengeHeader
          seviye="universite"
          active={challengeActive}
          eyebrow="Kısıtlı optimizasyon problemi"
          title="Üç planlayıcıyı aynı deney koşulunda karşılaştır"
          description="Seed sabitlenir ve düzenek iki engelle başlar. Üçüncü engeli sen yerleştir; üç algoritmanın da yol bulduğu koşulda maliyetleri karşılaştır."
          constraints={[
            "Düzeneği tam üç engelle sınırla.",
            "A*, RRT ve RRT* aynı seed ile başarılı olsun; en kısa yolu ve en az düğümü raporla.",
          ]}
          onToggle={toggleChallenge}
        />
      )}

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
                  className="h-11 touch-pan-y"
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

      <label className={`flex max-w-56 flex-col gap-1 text-sm ${t.ink}`}>
        <span>Deney seed’i</span>
        <input
          type="number"
          inputMode="numeric"
          value={seed}
          disabled={challengeActive}
          onChange={(event) => {
            const nextSeed = Number(event.target.value);
            if (Number.isSafeInteger(nextSeed)) setSeed(nextSeed);
            setResults({});
            setErrors({});
          }}
          className={`h-11 rounded-md border ${t.outline} ${t.bg} px-3 font-mono ${t.ink} disabled:opacity-50`}
        />
        <span className={t.inkMuted}>Aynı sahne ve seed aynı rastlantısal deneyi üretir.</span>
      </label>

      <div className={`flex flex-wrap items-center justify-between gap-2 text-sm ${t.ink}`}>
        <span role="status" className={t.inkMuted}>
          {allowObstacleEdit
            ? `Sahneye dokunarak da engel ekleyebilirsin. Şu an ${obstacles.length} engel var.`
            : "Bu sahnede engel düzeni sabit."}
        </span>
        <div className="flex gap-2">
          {allowObstacleEdit && (
            <button type="button" onClick={handleClear} className={`h-11 rounded-md border ${t.outline} px-4`}>
              {challengeActive ? "Düzeneği başa al" : "Engelleri temizle"}
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
                          style={{ backgroundColor: algorithmColors[id] }}
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

      {theme === "universite" && (() => {
        const successful = algorithms
          .map((id) => ({ id, result: results[id] }))
          .filter((entry): entry is { id: PlannerId; result: PlanResult } => Boolean(entry.result?.success));
        if (successful.length < 2) return null;
        const fastest = [...successful].sort((a, b) => a.result.elapsedMs - b.result.elapsedMs)[0];
        const fewestNodes = [...successful].sort((a, b) => a.result.nodesExpanded - b.result.nodesExpanded)[0];
        const shortest = [...successful].sort((a, b) => pathLength(a.result.path) - pathLength(b.result.path))[0];
        return (
          <p className={`text-sm ${t.ink}`}>
            <Neden etiket="Neden bu farklar?" varsayilanAcik={mode === "engineering"}>
              Bu koşuda {ALGORITHM_LABELS[fastest.id]} en hızlısıydı ({round(fastest.result.elapsedMs)} ms),{" "}
              {ALGORITHM_LABELS[fewestNodes.id]} en az düğüm genişletti ({fewestNodes.result.nodesExpanded}),{" "}
              {ALGORITHM_LABELS[shortest.id]} en kısa yolu buldu ({round(pathLength(shortest.result.path))} m).{" "}
              {ALGORITHM_REASON[fastest.id]}
            </Neden>
          </p>
        );
      })()}

      {theme === "universite" && (
        <NasilHesaplandi
          ozet="Tablodaki yol uzunluğu, ham (x, y) nokta dizisinin toplam mesafesidir — dizinin kendisi burada."
          className={`border ${t.outline} ${t.bg} ${t.ink}`}
          varsayilanAcik={mode === "engineering"}
        >
          <p>
            Her algoritmanın döndürdüğü <code>PlanResult.path</code>, ardışık (x, y) noktalarından
            oluşur; yukarıdaki tablonun &ldquo;Yol uzunluğu&rdquo; sütunu bu dizideki ardışık
            noktalar arası mesafelerin toplamıdır (<code>pathLength</code>, <code>lib/robotics/planners</code>).
          </p>
          {mode === "engineering" && (
            <div className="mt-2 flex flex-col gap-2" data-testid="engineering-detail">
              {algorithms.filter((id) => results[id]?.success).length === 0 && (
                <p className="font-mono text-xs">Henüz başarılı bir yol yok — önce yarıştır.</p>
              )}
              {algorithms.filter((id) => results[id]?.success).map((id) => {
                const path = results[id]!.path;
                return (
                  <div key={id}>
                    <p className="font-mono text-xs font-semibold">
                      {ALGORITHM_LABELS[id]} · {path.length} nokta
                    </p>
                    <p className={`mt-1 max-h-24 overflow-y-auto rounded border ${t.outline} p-2 font-mono text-[11px] leading-relaxed`}>
                      {path.map((p) => `(${round(p.x)}, ${round(p.y)})`).join(" → ")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </NasilHesaplandi>
      )}

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
          {algorithms.filter((id) => errors[id]).map((id) => (
            <p key={id}>{ALGORITHM_LABELS[id]}: {errors[id]}</p>
          ))}
        </div>
      )}
      {challengeActive && !challengeResult && (
        <p className={`rounded-lg border ${t.outline} ${t.bg} p-3 text-sm ${t.ink}`} role="status">
          Deney koşulu · engel {obstacles.length} / 3 · başarılı planlayıcı {algorithms.filter((id) => results[id]?.success).length} / 3 · koşu {challengeAttempts}
        </p>
      )}
      {challengeActive && challengeResult && (
        <ChallengeResult
          seviye="universite"
          title="Karşılaştırma veriyle tamamlandı"
          summary="Üç planlayıcı aynı engel düzeni ve seed altında yol buldu; seçim artık yol ve arama maliyeti üzerinden savunulabilir."
          metrics={[
            { label: "En kısa yol", value: `${ALGORITHM_LABELS[challengeResult.shortest]} · ${round(challengeResult.shortestLength)} m` },
            { label: "En az düğüm", value: `${ALGORITHM_LABELS[challengeResult.fewestNodes]} · ${challengeResult.nodeCount}` },
            { label: "Koşu", value: `${challengeAttempts}` },
          ]}
          onRetry={resetChallenge}
        />
      )}
      {challengeAvailable && (
        <ExperimentShareButton
          seviye="universite"
          createShareUrl={() => createLabShareUrl({
            kind: "planner-race",
            version: 1,
            extent,
            obstacles,
            seed,
            algorithms,
          })}
        />
      )}
    </div>
  );
}
