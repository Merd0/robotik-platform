"use client";

import { useEffect, useRef, useState } from "react";

type ReadState = "idle" | "playing" | "paused";

/**
 * "Sesli Anlatım" (FAZ 6 — kendi fikir). Tarayıcının kendi
 * `speechSynthesis` API'sini kullanır: yeni bağımlılık yok, sunucuya
 * hiçbir şey gönderilmez, ses tamamen cihazda üretilir (docs/05 "Kişisel
 * veri toplanmaz" ilkesiyle tam uyumlu). Metin, ders sayfasında zaten
 * sunucu tarafında `lib/lessonPlainText.ts` ile MDX'ten çıkarılmış düz
 * metindir — bu bileşen yalnız oynatma/duraklatma durumunu yönetir.
 *
 * Tarayıcı desteklemiyorsa veya metin boşsa hiçbir şey render etmez —
 * sessiz bozulma yerine sessiz yokluk.
 */
export function ReadAloud({ text }: { text: string }) {
  const [state, setState] = useState<ReadState>("idle");
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. components/interactive/CodeRunner.tsx'teki aynı desen). SSR'da
    // `window` yok, bu yüzden destek durumu yalnız mount sonrası belirlenir
    // — hydration uyuşmazlığı olmasın diye.
    const zamanlayici = setTimeout(() => {
      setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    }, 0);
    return () => {
      clearTimeout(zamanlayici);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || text.trim().length === 0) return null;

  function play() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setState("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setState("playing");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-site-border bg-site-soft px-3 py-2 text-sm">
      <span className="font-semibold text-site-ink">Sesli anlatım</span>
      {state === "idle" && (
        <button type="button" onClick={play} className="min-h-11 rounded-lg border border-site-border bg-site-surface px-3 font-semibold text-site-ink hover:bg-site-bg">
          ▶ Oku
        </button>
      )}
      {state === "playing" && (
        <>
          <button type="button" onClick={pause} className="min-h-11 rounded-lg border border-site-border bg-site-surface px-3 font-semibold text-site-ink hover:bg-site-bg">
            ⏸ Duraklat
          </button>
          <button type="button" onClick={stop} className="min-h-11 rounded-lg border border-site-border bg-site-surface px-3 font-semibold text-site-ink hover:bg-site-bg">
            ⏹ Durdur
          </button>
        </>
      )}
      {state === "paused" && (
        <>
          <button type="button" onClick={resume} className="min-h-11 rounded-lg border border-site-border bg-site-surface px-3 font-semibold text-site-ink hover:bg-site-bg">
            ▶ Devam et
          </button>
          <button type="button" onClick={stop} className="min-h-11 rounded-lg border border-site-border bg-site-surface px-3 font-semibold text-site-ink hover:bg-site-bg">
            ⏹ Durdur
          </button>
        </>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "playing" ? "Sesli anlatım çalıyor." : state === "paused" ? "Sesli anlatım duraklatıldı." : ""}
      </span>
    </div>
  );
}
