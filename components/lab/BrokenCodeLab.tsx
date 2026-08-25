"use client";

import { useState, useSyncExternalStore } from "react";
import { BROKEN_CODE_CARDS, type BrokenCodeCard } from "@/lib/brokenCodeGallery";
import { EMPTY_EVIDENCE, getEvidenceEvents, subscribeEvidence } from "@/lib/evidence";
import { CodeRunner } from "@/components/interactive/CodeRunner";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";

/**
 * "Kırık Kod Laboratuvarı" — bağımsız bir arıza galerisi. Her kart
 * `CodeRunner`ın (Pyodide worker, `movej`/`eklem_ac` köprüsü,
 * `expectedFinalDegrees` doğrulaması) ZATEN çalışan motorunu kullanır;
 * bu bileşen yalnız galeri/seçim durumunu yönetir. "Çözüldü" rozeti, o
 * kartın `skillId`siyle gerçekten kaydedilmiş bir `assessed/success`
 * Evidence olayı varsa görünür — uydurma bir işaretleme değil.
 */
export function BrokenCodeLab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = useSyncExternalStore(subscribeEvidence, getEvidenceEvents, () => EMPTY_EVIDENCE);
  const solvedSkillIds = new Set(
    events.filter((event) => event.stage === "assessed" && event.result === "success").map((event) => event.skillId),
  );

  const selected = BROKEN_CODE_CARDS.find((card) => card.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="min-h-11 w-fit rounded-lg border border-site-border px-4 text-sm font-semibold text-site-ink hover:bg-site-soft"
        >
          ← Galeriye dön
        </button>
        <BrokenCodeCardRunner card={selected} />
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {BROKEN_CODE_CARDS.map((card) => {
        const solved = solvedSkillIds.has(card.skillId);
        return (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => setSelectedId(card.id)}
              className="flex min-h-24 w-full flex-col gap-1 rounded-xl border border-site-border bg-site-surface p-4 text-left hover:bg-site-soft"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-site-ink">{card.title}</span>
                {solved && (
                  <span className="rounded-full border border-success-border bg-success-surface px-2 py-0.5 text-xs font-bold text-success-ink">
                    Çözüldü ✓
                  </span>
                )}
              </span>
              <span className="text-sm text-site-muted">{card.scenario}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function BrokenCodeCardRunner({ card }: { card: BrokenCodeCard }) {
  return (
    <LessonEvidenceProvider lessonId={`kirik-kod-${card.id}`} contentVersion={card.contentVersion}>
      <CodeRunner
        key={card.id}
        initialCode={card.initialCode}
        robot={card.robot}
        theme="universite"
        taskTitle={card.scenario}
        expectedFinalDegrees={card.expectedFinalDegrees}
        toleranceDegrees={card.toleranceDegrees}
        skillId={card.skillId}
      />
    </LessonEvidenceProvider>
  );
}
