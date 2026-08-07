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
    <fieldset className="my-2 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-teal-900">7 · Transfer görevi · Kanıt</legend>
      <p className="text-sm font-semibold text-slate-900">{prompt}</p>
      <div className="mt-3 grid gap-2">
        {options.map((option, index) => <button key={option} type="button" disabled={passed} onClick={() => choose(index)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${passed && index === correct ? "border-emerald-600 bg-emerald-50" : selected === index ? "border-teal-700 bg-white" : "border-teal-200 bg-white/70"}`}>{option}</button>)}
      </div>
      {selected !== null && <p aria-live="polite" className={`mt-3 text-sm ${passed ? "text-emerald-900" : "text-slate-700"}`}>{passed ? `Kanıtlandı. ${explanation}` : attempts === 1 ? `Henüz değil. İpucu: ${hint}` : `Bir kez daha gözleme dön. ${explanation}`}</p>}
    </fieldset>
  );
}
