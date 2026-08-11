"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import {
  analyzeThreshold,
  buildThresholdGrid,
  THRESHOLD_COLUMNS,
  THRESHOLD_ROWS,
} from "@/lib/threshold";

interface ThresholdViewerProps {
  theme?: "lise" | "universite";
  pilot?: "threshold-regimes";
}

const THEME = {
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    accent: "bg-lise-accent",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    accent: "bg-universite-accent",
  },
} as const;

const CELL_PX = 28;

/**
 * Ders içine gömülen etkileşimli sahne: bir eşik (threshold) kaydırıcısı
 * ile parlaklık ızgarasındaki hangi hücrelerin "nesne" sayılacağını
 * belirle. Doğru eşik nesneyi net ortaya çıkarır; çok düşük eşik gürültüyü
 * de nesne sayar, çok yüksek eşik nesneyi de gürültüyle birlikte siler.
 */
export function ThresholdViewer({ theme = "lise", pilot }: ThresholdViewerProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const [threshold, setThreshold] = useState(128);

  useSharedLabState("threshold-viewer", (shared) => {
    if (shared.theme !== theme) return;
    setThreshold(shared.threshold);
  });

  const brightness = useMemo(() => buildThresholdGrid(), []);

  const analysis = analyzeThreshold(threshold);

  function commitThreshold() {
    if (pilot !== "threshold-regimes") return;
    record({
      skillId: "threshold-regimes",
      stage: "observed",
      result: analysis.regime === "mixed" ? "retry" : "success",
      metrics: analysis,
    });
  }

  return (
    <div className={`flex min-w-0 flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {/* Salt görsel ızgara; bilgi içeriği aşağıdaki sayısal özette metin olarak var. */}
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-2">
        <div
          aria-hidden="true"
          className={`grid w-fit gap-0.5 rounded-lg ${t.bg} p-2`}
          style={{ gridTemplateColumns: `repeat(${THRESHOLD_COLUMNS}, ${CELL_PX}px)` }}
        >
          {brightness.flatMap((rowValues, row) =>
            rowValues.map((value, col) => {
              const on = value >= threshold;
              return (
                <div
                  key={`${row}-${col}`}
                  className={on ? t.accent : "bg-black/70"}
                  style={{ width: CELL_PX, height: CELL_PX }}
                />
              );
            }),
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className={t.inkMuted}>Eşik değeri: {threshold} (0–255)</span>
        <input
          type="range"
          min={0}
          max={255}
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
          onPointerUp={commitThreshold}
          onBlur={commitThreshold}
          onKeyUp={commitThreshold}
          className="h-11 touch-pan-y"
        />
      </label>

      <div role="status" className={`text-sm ${t.ink}`}>
        Eşiğin üstünde kalan hücre sayısı: {analysis.detectedCount} / {THRESHOLD_ROWS * THRESHOLD_COLUMNS}
      </div>

      <ExperimentShareButton
        seviye={theme}
        createShareUrl={() => createLabShareUrl({
          kind: "threshold-viewer",
          version: 1,
          theme,
          threshold,
        })}
      />
    </div>
  );
}
