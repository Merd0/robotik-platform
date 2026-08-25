"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Karmaşık bir sahneyi (bilgi haritası, arıza kliniği vb.) hiçbir açıklama
 * olmadan doğrudan sunmak kafa karıştırıyor. Bu bileşen yalnız İLK
 * ziyarette görünen, kapatılınca `localStorage`a (hesap/çerez değil,
 * docs/05 "kişisel veri toplanmaz" ilkesiyle uyumlu) yazılan kısa bir not
 * gösterir. `storageKey` her kullanım yerinde tekil olmalı — aynı anahtar
 * paylaşılırsa bir sahnede kapatmak diğerini de gizler.
 */
export function FirstVisitNote({
  storageKey,
  ariaLabel,
  children,
}: {
  storageKey: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. components/interactive/CodeRunner.tsx'teki aynı desen).
    const zamanlayici = setTimeout(() => {
      try {
        setVisible(window.localStorage.getItem(storageKey) !== "gorundu");
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(zamanlayici);
  }, [storageKey]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(storageKey, "gorundu");
    } catch {
      // localStorage engellenmişse sessizce yut — bir sonraki ziyarette tekrar görünür, o kadar.
    }
  }

  if (!visible) return null;

  return (
    <div role="note" aria-label={ariaLabel} className="mb-6 flex flex-col gap-3 rounded-2xl border border-site-strong bg-site-soft p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl text-sm leading-6 text-site-ink">{children}</div>
      <button type="button" onClick={dismiss} className="min-h-11 shrink-0 rounded-xl border border-site-border bg-site-bg px-4 text-sm font-semibold text-site-ink hover:bg-site-surface">
        Anladım, kapat
      </button>
    </div>
  );
}
