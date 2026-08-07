"use client";

import { useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

interface TransferChallengeProps {
  skillId: string;
  prompt: string;
  options: string[];
  correct: number;
  hint: string;
  explanation: string;
}

export function TransferChallenge({ skillId, prompt, options, correct, hint, explanation }: TransferChallengeProps) {
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const record = useEvidenceRecorder();

  function choose(index: number) {
    if (passed) return;
    const nextAttempts = attempts + 1;
    const success = index === correct;
    setAttempts(nextAttempts);
    setSelected(index);
    setPassed(success);
    record({ skillId, stage: success ? "passed" : "transferred", result: success ? "success" : "retry", attempts: nextAttempts, metrics: { selected: index } });
  }

  return (
    <fieldset className="my-2 rounded-2xl border border-site-accent bg-site-soft p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">7 · Transfer görevi · Kanıt</legend>
      <p className="text-sm font-semibold text-site-ink">{prompt}</p>
      <div className="mt-3 grid gap-2">
        {options.map((option, index) => <button key={option} type="button" disabled={passed} onClick={() => choose(index)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${passed && index === correct ? "border-success-border bg-success-surface" : selected === index ? "border-site-accent-text bg-site-surface" : "border-site-border bg-site-surface/70"}`}>{option}</button>)}
      </div>
      {selected !== null && <p aria-live="polite" className={`mt-3 text-sm ${passed ? "text-success-ink" : "text-site-muted"}`}>{passed ? `Kanıtlandı. ${explanation}` : attempts === 1 ? `Henüz değil. İpucu: ${hint}` : `Bir kez daha gözleme dön. ${explanation}`}</p>}
    </fieldset>
  );
}
