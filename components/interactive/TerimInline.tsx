"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { InlineNot } from "@/components/interactive/InlineNot";

interface TerimInlineProps {
  tr: string;
  en: string;
  tanim: string;
  slug: string;
  children: ReactNode;
}

/**
 * `Terim`in (server, sözlük araması yapan kısım) açılıp-kapanma UI'ını
 * `InlineNot`e (Faz 4'te `Neden` ile paylaşılan ortak birincil) devreder —
 * yalnız EŞLEŞEN TEK terimin metnini taşır, tüm sözlüğü değil (bkz.
 * Terim.tsx başlığı).
 */
export function TerimInline({ tr, en, tanim, slug, children }: TerimInlineProps) {
  return (
    <InlineNot tetikleyici={children}>
      <strong>{tr}</strong> <span className="opacity-70">({en})</span> — {tanim}{" "}
      <Link href={`/sozluk/${slug}`} className="underline underline-offset-2">
        Sözlükte aç
      </Link>
    </InlineNot>
  );
}
