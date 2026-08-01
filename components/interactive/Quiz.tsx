import { QuizSorusu } from "./QuizSorusu";

interface QuizSoru {
  soru: string;
  secenekler: string[];
  /** Doğru seçeneğin secenekler dizisindeki index'i. */
  dogru: number;
  /** Yanlış seçimde gösterilen ipucu — doğru cevabı vermez, düşünmeye yönlendirir. */
  aciklama: string;
}

interface QuizProps {
  sorular: QuizSoru[];
}

/** Ders sonu alıştırması. Yanlış seçimde doğru cevap söylenmez, ipucu verilir. */
export function Quiz({ sorular }: QuizProps) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-ortaokul-ink/10 bg-ortaokul-surface p-4">
      {sorular.map((soru, index) => (
        <QuizSorusu key={index} {...soru} />
      ))}
    </div>
  );
}
