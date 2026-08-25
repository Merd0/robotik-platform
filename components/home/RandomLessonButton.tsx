"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickRandomLessonId } from "@/lib/randomLesson";
import type { AramaKaydiHam } from "@/lib/arama";

/**
 * "Rastgele ders" (FAZ 6 — kendi fikir). Arama sayfasıyla aynı
 * `/arama-index.json`'ı (derleme zamanında üretilen, yalnız yayındaki
 * dersleri içeren gerçek liste) tıklanınca tembel yükler — yeni bir veri
 * kaynağı yok. Hiçbir sahte "önerilen ders" algoritması yok, gerçekten
 * rastgele (docs/00'daki "yarım saat oynasın" keşif hissini destekler).
 */
export function RandomLessonButton() {
  const router = useRouter();
  const [state, setState] = useState<"hazir" | "yukleniyor" | "hata">("hazir");

  async function git() {
    setState("yukleniyor");
    try {
      const response = await fetch("/arama-index.json");
      if (!response.ok) throw new Error(String(response.status));
      const entries = (await response.json()) as AramaKaydiHam[];
      const id = pickRandomLessonId(entries.map((entry) => entry.id), undefined);
      if (!id) throw new Error("boş liste");
      router.push(`/ders/${id}`);
    } catch {
      setState("hata");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        onClick={git}
        disabled={state === "yukleniyor"}
        className="inline-flex min-h-13 items-center justify-center rounded-full border-[3px] border-poster-ink px-5 py-3 text-[15px] font-extrabold disabled:opacity-60"
      >
        {state === "yukleniyor" ? "Seçiliyor…" : "🎲 Rastgele bir ders dene"}
      </button>
      {state === "hata" && (
        <p role="alert" className="text-xs text-poster-subtle">
          Ders listesi yüklenemedi, sayfayı yenilemeyi dene.
        </p>
      )}
    </div>
  );
}
