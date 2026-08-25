"use client";

import { useMemo, useState } from "react";
import {
  evaluateBoundaryTestGuess,
  generateBoundaryTestRounds,
  type BoundaryTestOutcome,
} from "@/lib/robotics/boundaryTest";
import { genericTwoDofRobot } from "@/lib/robotics/robots";
import { ReachabilityMap } from "@/components/scene/LazyScene";

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * "Sınır Testi" — kullanıcı `lib/robotics/reachability.ts`teki gerçek
 * analitik sınıflandırıcının cevabını GÖRMEDEN önce tahmin eder ("Ulaşılabilir
 * mi?"), sonra gerçek sonuç `ReachabilityMap` ile açılır. Önceden yazılmış
 * cevap yok — her round'un doğru cevabı o an hesaplanır.
 */
export function BoundaryTest() {
  const rounds = useMemo(() => generateBoundaryTestRounds(genericTwoDofRobot), []);
  const [roundIndex, setRoundIndex] = useState(0);
  const [outcome, setOutcome] = useState<BoundaryTestOutcome | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const round_ = rounds[roundIndex];
  const finished = roundIndex >= rounds.length;

  function guess(reachable: boolean) {
    if (!round_) return;
    const result = evaluateBoundaryTestGuess(genericTwoDofRobot, round_, reachable);
    setOutcome(result);
    setScore((current) => ({ correct: current.correct + (result.correct ? 1 : 0), total: current.total + 1 }));
  }

  function nextRound() {
    setOutcome(null);
    setRoundIndex((index) => index + 1);
  }

  function restart() {
    setOutcome(null);
    setRoundIndex(0);
    setScore({ correct: 0, total: 0 });
  }

  if (rounds.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-site-border bg-site-soft p-6 text-sm text-site-muted">
        Bu deney yalnız düzlemsel, iki döner eklemli robotlarda çalışır.
      </p>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-site-border bg-site-surface p-6">
        <p className="text-lg font-semibold text-site-ink">
          Bitti — {score.correct} / {score.total} doğru tahmin.
        </p>
        <button
          type="button"
          onClick={restart}
          className="min-h-11 w-fit rounded-lg bg-site-strong px-4 text-sm font-bold text-site-on-strong"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text" role="status">
        Round {roundIndex + 1} / {rounds.length} · Skor {score.correct}/{score.total}
      </p>

      <div className="rounded-xl border border-site-border bg-site-soft p-4">
        <p className="text-sm text-site-ink">{round_.label}</p>
        <p className="mt-1 font-mono text-sm text-site-muted">
          Hedef: ({round(round_.target.x)}, {round(round_.target.y)}) m
        </p>
      </div>

      {outcome === null ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tahminin">
          <button
            type="button"
            onClick={() => guess(true)}
            className="min-h-11 rounded-lg border border-site-border bg-site-surface px-5 text-sm font-bold text-site-ink hover:bg-site-soft"
          >
            Ulaşılabilir
          </button>
          <button
            type="button"
            onClick={() => guess(false)}
            className="min-h-11 rounded-lg border border-site-border bg-site-surface px-5 text-sm font-bold text-site-ink hover:bg-site-soft"
          >
            Ulaşılamaz
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            data-testid="sinir-testi-sonuc"
            className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold ${
              outcome.correct
                ? "border-success-border bg-success-surface text-success-ink"
                : "border-danger-border bg-danger-surface text-danger-ink"
            }`}
          >
            {outcome.correct ? "Doğru tahmin." : "Yanlış tahmin."} Gerçek sonuç aşağıda.
          </p>
          <ReachabilityMap robot={genericTwoDofRobot} target={round_.target} elbow={round_.elbow} />
          <button
            type="button"
            onClick={nextRound}
            className="min-h-11 w-fit rounded-lg bg-site-strong px-4 text-sm font-bold text-site-on-strong"
          >
            {roundIndex + 1 < rounds.length ? "Sıradaki round" : "Bitir"}
          </button>
        </div>
      )}
    </div>
  );
}
