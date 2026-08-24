"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { analyzeHandshake, describeSignalGap, type HandshakeAnalysis } from "@/lib/signalTimeline";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";

interface SignalTimelineProps {
  /** Her satırın adı, ör. ["Sinyal"] veya ["Robot: Hazır", "PLC: Başla"]. */
  signals: string[];
  /** Zaman ekseni kaç adımdan oluşsun. */
  steps?: number;
  theme?: "ortaokul" | "lise" | "universite";
  /** Sürümlü, ölçülebilir görev; yalnız ilgili ders bunu etkinleştirir. */
  pilot?: "handshake-order";
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/70",
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
    inkMuted: "text-lise-ink/70",
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
    inkMuted: "text-universite-ink/70",
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
 * sinyallerin AÇIK olduğunu gösterir. Genel kullanımda düzeni yorumlamaz;
 * sürümlü `handshake-order` görevi açıldığında iki satırın ilk AÇIK adımlarını
 * yalnız "Oynat" commit'inde ölçer.
 */
export function SignalTimeline({ signals, steps = 8, theme = "ortaokul", pilot }: SignalTimelineProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const [pattern, setPattern] = useState<boolean[][]>(() => signals.map(() => new Array(steps).fill(false)));
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<HandshakeAnalysis | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useSharedLabState("signal-timeline", (shared) => {
    if (shared.steps !== steps || shared.signals.length !== signals.length) return;
    if (shared.signals.some((signal, index) => signal !== signals[index])) return;
    stopPlayback();
    setPattern(shared.pattern);
  });

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

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
    setGapAnalysis(null);
    const analysis = signals.length === 2 ? analyzeHandshake(pattern) : null;
    if (pilot === "handshake-order" && analysis) {
      record({
        skillId: "handshake-order",
        stage: "assessed",
        result: analysis.correctOrder ? "success" : "retry",
        metrics: {
          requestStep: analysis.requestStep ?? -1,
          acknowledgementStep: analysis.acknowledgementStep ?? -1,
          complete: analysis.complete,
          correctOrder: analysis.correctOrder,
        },
      });
    }
    for (let i = 0; i < steps; i++) {
      const timeoutId = setTimeout(() => {
        setPlayhead(i);
        if (i === steps - 1) {
          const finalTimeout = setTimeout(() => {
            setPlayhead(null);
            setGapAnalysis(analysis);
          }, STEP_MS);
          timeoutsRef.current.push(finalTimeout);
        }
      }, i * STEP_MS);
      timeoutsRef.current.push(timeoutId);
    }
  }

  function handleReset() {
    stopPlayback();
    setGapAnalysis(null);
    setPattern(signals.map(() => new Array(steps).fill(false)));
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      <div className="overflow-x-auto overscroll-x-contain pb-2">
        <div
          className="grid w-max min-w-full items-center gap-1"
          style={{ gridTemplateColumns: `minmax(8rem, 1fr) repeat(${steps}, 2.75rem)` }}
        >
          <span className={`text-xs ${t.inkMuted}`}>Sinyal</span>
          {Array.from({ length: steps }, (_, stepIndex) => (
            <span key={stepIndex} aria-hidden="true" className={`text-center text-xs ${t.inkMuted}`}>
              {stepIndex + 1}
            </span>
          ))}

          {signals.map((name, signalIndex) => (
            <Fragment key={signalIndex}>
              <span className={`pr-2 text-sm ${t.inkMuted}`}>{name}</span>
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
            </Fragment>
          ))}
        </div>
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

      {gapAnalysis && signals.length === 2 && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-md border ${t.outline} ${t.bg} p-3 text-sm ${t.ink}`}
        >
          {describeSignalGap(
            gapAnalysis,
            [signals[0], signals[1]],
            STEP_MS,
            pilot === "handshake-order",
          )}
        </p>
      )}

      <ExperimentShareButton
        seviye={theme}
        createShareUrl={() => createLabShareUrl({
          kind: "signal-timeline",
          version: 1,
          signals,
          steps,
          pattern,
        })}
      />
    </div>
  );
}
