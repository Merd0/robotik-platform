"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { computeChallengeRevision, karistir, karistirmaSirasi } from "@/lib/quiz";

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
  const seedKey = `transfer:${skillId}:${prompt}`;
  const { secenekler: displayedOptions, dogru: displayedCorrect } = useMemo(
    () => karistir(options, correct, seedKey),
    [correct, options, seedKey],
  );
  // Kaydedilen kimlik GÖRÜNTÜLENEN (karıştırılmış) index değil, orijinal
  // sıradaki index olmalı — predicate bunu dersteki sabit `correct` değeriyle
  // karşılaştırabilsin diye (bkz. lib/evidence.ts'teki hardening notu).
  const originalIndexOrder = useMemo(() => karistirmaSirasi(seedKey, options.length), [options.length, seedKey]);
  const challengeRevision = useMemo(
    () => computeChallengeRevision({ prompt, options, correct, hint, explanation }),
    [correct, explanation, hint, options, prompt],
  );

  function choose(index: number) {
    if (passed) return;
    const nextAttempts = attempts + 1;
    const success = index === displayedCorrect;
    setAttempts(nextAttempts);
    setSelected(index);
    setPassed(success);
    record({
      skillId,
      stage: "assessed",
      result: success ? "success" : "retry",
      attempts: nextAttempts,
      metrics: {
        challengeRevision,
        selectedOriginalIndex: originalIndexOrder[index],
        correctOriginalIndex: correct,
      },
    });
  }

  return (
    <fieldset className="my-2 rounded-2xl border border-site-accent bg-site-soft p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">7 · Transfer görevi · Kavram kontrolü</legend>
      <p className="text-sm font-semibold text-site-ink">{prompt}</p>
      <div className="mt-3 grid gap-2">
        {displayedOptions.map((option, index) => <button key={option} type="button" disabled={passed} onClick={() => choose(index)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${passed && index === displayedCorrect ? "border-success-border bg-success-surface" : selected === index ? "border-site-accent-text bg-site-surface" : "border-site-border bg-site-surface/70"}`}>{option}</button>)}
      </div>
      {selected !== null && <p aria-live="polite" className={`mt-3 text-sm ${passed ? "text-success-ink" : "text-site-muted"}`}>{passed ? `Kavram kontrolü tamamlandı. ${explanation} Beceri kanıtı için dersin ölçülebilir deney koşulu da tamamlanmalı.` : `Henüz değil. İpucu: ${hint}`}</p>}
    </fieldset>
  );
}
