"use client";

import { useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

interface PredictionPromptProps {
  skillId: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

export function PredictionPrompt({ skillId, prompt, options, correct, explanation }: PredictionPromptProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const record = useEvidenceRecorder();

  function lockPrediction() {
    if (selected === null) return;
    setLocked(true);
    record({ skillId, stage: "predicted", result: selected === correct ? "success" : "neutral", metrics: { selected, correct } });
  }

  return (
    <fieldset className="my-2 rounded-2xl border border-warning-border bg-warning-surface p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-warning-ink">1 · Tahminini kilitle</legend>
      <p className="text-sm font-semibold text-site-ink">{prompt}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => <button key={option} type="button" disabled={locked} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${selected === index ? "border-warning-ink bg-site-surface text-site-ink" : "border-warning-border bg-site-surface/60 text-site-muted"} disabled:opacity-80`}>{option}</button>)}
      </div>
      {!locked ? <button type="button" disabled={selected === null} onClick={lockPrediction} className="mt-3 min-h-11 rounded-xl bg-warning-ink px-4 py-2 text-sm font-semibold text-warning-surface disabled:opacity-40">Tahmini kilitle</button> : <p className="mt-3 text-sm text-warning-ink" role="status">Tahmin kaydedildi. Şimdi deneyi çalıştır; sonuçtan sonra karşılaştır. <span className="sr-only">{explanation}</span></p>}
    </fieldset>
  );
}
