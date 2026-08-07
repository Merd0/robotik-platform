"use client";

import { useMemo, useState } from "react";
import { karistir } from "@/lib/quiz";

interface QuizSorusuProps {
  soru: string;
  secenekler: string[];
  dogru: number;
  aciklama: string;
}

export function QuizSorusu({ soru, secenekler, dogru, aciklama }: QuizSorusuProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // Şıklar, sorunun metninden türetilen kararlı bir sırayla gösterilir:
  // içerikte doğru cevap ezici çoğunlukla 2. sıradaydı (%89), bu da soruları
  // okumadan çözülebilir hale getiriyordu. Kararlı olması şart — statik
  // dışa aktarımda sunucu ve istemci aynı sırayı üretmeli (bkz. lib/quiz.ts).
  const { secenekler: gosterilenSecenekler, dogru: gosterilenDogru } = useMemo(
    () => karistir(secenekler, dogru, soru),
    [secenekler, dogru, soru],
  );

  const isCorrect = selected === gosterilenDogru;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{soru}</legend>
      <div className="flex flex-col gap-2">
        {gosterilenSecenekler.map((secenek, index) => {
          const isSelected = selected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={isSelected}
              className={`min-h-11 rounded-md border px-4 py-2 text-left text-sm ${
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
          {isCorrect ? "Doğru." : `Şuna dikkat et: ${aciklama}`}
        </p>
      )}
    </fieldset>
  );
}
