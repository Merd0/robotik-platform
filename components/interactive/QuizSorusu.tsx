"use client";

import { useState } from "react";

interface QuizSorusuProps {
  soru: string;
  secenekler: string[];
  dogru: number;
  aciklama: string;
}

export function QuizSorusu({ soru, secenekler, dogru, aciklama }: QuizSorusuProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const isCorrect = selected === dogru;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{soru}</legend>
      <div className="flex flex-col gap-2">
        {secenekler.map((secenek, index) => {
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
