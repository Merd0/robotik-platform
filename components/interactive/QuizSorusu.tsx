"use client";

import { useMemo, useState } from "react";
import { karistir } from "@/lib/quiz";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

interface QuizSorusuProps {
  soru: string;
  secenekler: string[];
  dogru: number;
  aciklama: string;
}

export function QuizSorusu({ soru, secenekler, dogru, aciklama }: QuizSorusuProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const record = useEvidenceRecorder();

  // Şıklar, sorunun metninden türetilen kararlı bir sırayla gösterilir:
  // içerikte doğru cevap ezici çoğunlukla 2. sıradaydı (%89), bu da soruları
  // okumadan çözülebilir hale getiriyordu. Kararlı olması şart — statik
  // dışa aktarımda sunucu ve istemci aynı sırayı üretmeli (bkz. lib/quiz.ts).
  const { secenekler: gosterilenSecenekler, dogru: gosterilenDogru } = useMemo(
    () => karistir(secenekler, dogru, soru),
    [secenekler, dogru, soru],
  );

  const isCorrect = selected === gosterilenDogru;

  function choose(index: number) {
    const nextAttempts = attempts + 1;
    setSelected(index);
    setAttempts(nextAttempts);
    record({ skillId: `quiz:${soru.slice(0, 48)}`, stage: "observed", result: index === gosterilenDogru ? "success" : "retry", attempts: nextAttempts });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{soru}</legend>
      <div className="flex flex-col gap-2">
        {gosterilenSecenekler.map((secenek, index) => {
          const isSelected = selected === index;
          // Kod incelemesi tipi sorularda (docs/15 "İkinci derinlik turu")
          // şıklar çok satırlı kod bloğu olabilir — biçimi korumak için
          // monospace + whitespace-pre-wrap'e geçilir. Tek satırlık düz
          // metin şıklarda bu görsel olarak hiçbir şey değiştirmez.
          const isCodeBlock = secenek.includes("\n");
          return (
            <button
              key={index}
              type="button"
              onClick={() => choose(index)}
              aria-pressed={isSelected}
              className={`min-h-11 whitespace-pre-wrap rounded-md border px-4 py-2 text-left ${
                isCodeBlock ? "font-mono text-xs" : "text-sm"
              } ${
                isSelected
                  ? isCorrect
                    ? "border-ortaokul-accent bg-ortaokul-accent/10"
                    : "border-ortaokul-ink/30 bg-ortaokul-ink/5"
                  : "border-ortaokul-ink/10"
              }`}
            >
              {secenek}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className={`text-sm ${isCorrect ? "text-ortaokul-accent-text" : "text-ortaokul-ink/70"}`}>
          {isCorrect ? `Doğru. ${aciklama}` : attempts === 1 ? "Henüz değil. Sahnedeki değişkenin neyi değiştirdiğine bakıp bir kez daha dene." : `Şuna dikkat et: ${aciklama}`}
        </p>
      )}
    </fieldset>
  );
}
