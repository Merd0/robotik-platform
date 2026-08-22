"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";

interface TerimInlineProps {
  tr: string;
  en: string;
  tanim: string;
  slug: string;
  children: ReactNode;
}

/**
 * `Terim`in (server, sözlük araması yapan kısım) açılıp-kapanma durumunu
 * tutan tek client parçası — yalnız EŞLEŞEN TEK terimin metnini taşır,
 * tüm sözlüğü değil (bkz. Terim.tsx başlığı).
 *
 * Floating/absolute-positioned bir popover DEĞİL, bilinçli olarak: mobilde
 * (docs/05 "mobil ilk sınıf vatandaş") kenar taşması hesaplamadan, her
 * viewport genişliğinde aynı şekilde çalışan tek yol satır-içi (inline)
 * akışa yeni metin eklemek — açıldığında cümlenin geri kalanı normal
 * şekilde bir alt satıra kayar, hiçbir konumlandırma mantığı gerekmez.
 */
export function TerimInline({ tr, en, tanim, slug, children }: TerimInlineProps) {
  const [acik, setAcik] = useState(false);
  const notId = useId();

  return (
    <span className="whitespace-normal">
      <button
        type="button"
        onClick={() => setAcik((deger) => !deger)}
        aria-expanded={acik}
        aria-controls={notId}
        className="cursor-help underline decoration-dotted underline-offset-4"
      >
        {children}
      </button>
      {acik && (
        <span
          id={notId}
          role="note"
          aria-live="polite"
          className="mx-1 inline-block rounded-lg border border-current/15 bg-current/5 px-2 py-1 align-middle text-sm"
        >
          <strong>{tr}</strong> <span className="opacity-70">({en})</span> — {tanim}{" "}
          <Link href={`/sozluk/${slug}`} className="underline underline-offset-2">
            Sözlükte aç
          </Link>
        </span>
      )}
    </span>
  );
}
