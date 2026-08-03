"use client";

import { useRef, useState } from "react";

interface SignalTimelineProps {
  /** Her satırın adı, ör. ["Sinyal"] veya ["Robot: Hazır", "PLC: Başla"]. */
  signals: string[];
  /** Zaman ekseni kaç adımdan oluşsun. */
  steps?: number;
  theme?: "ortaokul" | "lise" | "universite";
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/60",
    button: "bg-ortaokul-ink text-ortaokul-surface",
    outline: "border-ortaokul-ink/20",
    on: "bg-ortaokul-accent",
    playhead: "border-ortaokul-accent",
  },
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/60",
    button: "bg-lise-ink text-lise-surface",
    outline: "border-lise-ink/20",
    on: "bg-lise-accent",
    playhead: "border-lise-accent",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/60",
    button: "bg-universite-ink text-universite-surface",
    outline: "border-universite-ink/20",
    on: "bg-universite-accent",
    playhead: "border-universite-accent",
  },
} as const;

const STEP_MS = 500;

/**
 * Ders içine gömülen etkileşimli sahne: bir veya birden fazla sinyalin
 * zaman içindeki AÇIK/KAPALI durumunu tıklayarak kur, "Oynat" ile bir
 * "okuma başı" (playhead) zaman ekseninde ilerleyip her adımda hangi
 * sinyallerin AÇIK olduğunu gösterir. Hangi düzenin "doğru" bir el
 * sıkışma/protokol olduğuna bileşen karar vermez — bu, dersin metninde
 * ve Quiz'inde ele alınır (bkz. docs/07-tasarim-sistemi.md "etkileşimli
 * sahne bileşenleri seviyeden bağımsızdır").
 */
export function SignalTimeline({ signals, steps = 8, theme = "ortaokul" }: SignalTimelineProps) {
  const t = THEME[theme];
  const [pattern, setPattern] = useState<boolean[][]>(() => signals.map(() => new Array(steps).fill(false)));
  const [playhead, setPlayhead] = useState<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function toggleCell(signalIndex: number, stepIndex: number) {
    setPattern((prev) =>
      prev.map((row, i) => (i === signalIndex ? row.map((v, j) => (j === stepIndex ? !v : v)) : row)),
    );
  }

  function stopPlayback() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setPlayhead(null);
  }

  function handlePlay() {
    stopPlayback();
    for (let i = 0; i < steps; i++) {
      const timeoutId = setTimeout(() => {
        setPlayhead(i);
        if (i === steps - 1) {
          const finalTimeout = setTimeout(() => setPlayhead(null), STEP_MS);
          timeoutsRef.current.push(finalTimeout);
        }
      }, i * STEP_MS);
      timeoutsRef.current.push(timeoutId);
    }
  }

  function handleReset() {
    stopPlayback();
    setPattern(signals.map(() => new Array(steps).fill(false)));
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      <div className="flex flex-col gap-3">
        {signals.map((name, signalIndex) => (
          <div key={signalIndex} className="flex flex-col gap-1">
            <span className={`text-sm ${t.inkMuted}`}>{name}</span>
            <div className="flex flex-wrap gap-1">
              {pattern[signalIndex].map((on, stepIndex) => (
                <button
                  key={stepIndex}
                  type="button"
                  aria-label={`${name} — adım ${stepIndex + 1}: ${on ? "AÇIK" : "KAPALI"}`}
                  aria-pressed={on}
                  onClick={() => toggleCell(signalIndex, stepIndex)}
                  className={`h-11 w-11 rounded-md border-2 ${
                    playhead === stepIndex ? t.playhead : "border-transparent"
                  } ${on ? t.on : t.bg} ${on ? "" : `border ${t.outline}`}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          disabled={playhead !== null}
          className={`h-11 rounded-md px-4 ${t.button} disabled:opacity-50`}
        >
          Oynat
        </button>
        <button type="button" onClick={handleReset} className={`h-11 rounded-md border ${t.outline} px-4`}>
          Sıfırla
        </button>
      </div>
    </div>
  );
}
