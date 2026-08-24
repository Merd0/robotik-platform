"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_EVIDENCE, getEvidenceEvents, subscribeEvidence, summarizeEvidence } from "@/lib/evidence";
import type { Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface HatProgressSummaryProps {
  lessons: readonly { slug: string; contentVersion: string }[];
  seviye: Seviye;
}

/**
 * Hat sayfasındaki numaralı listenin üstünde "nerede olduğunu" tek bakışta
 * özetler — FAZ 2 (docs/durum-denetim.md): liste kendisi zaten bir yol
 * haritasıydı ama toplam ilerleme hiçbir yerde görünmüyordu. Her satırın
 * kendi `LessonProgressBadge`'i zaten aynı `summarizeEvidence` mantığını
 * kullanıyor; burada yeni bir hesap YOK, sadece aynı özetin toplamı.
 * Rekabet/sıralama yok (docs/00), sadece kendi ilerlemesi.
 */
export function HatProgressSummary({ lessons, seviye }: HatProgressSummaryProps) {
  const events = useSyncExternalStore(subscribeEvidence, getEvidenceEvents, () => EMPTY_EVIDENCE);
  const theme = SEVIYE_THEME[seviye];
  const durumlar = lessons.map((lesson) => summarizeEvidence(events, lesson.slug, lesson.contentVersion));
  const kanitlanan = durumlar.filter((durum) => durum.passed).length;
  const denenen = durumlar.filter((durum) => !durum.passed && durum.tried).length;
  const okunan = durumlar.filter((durum) => !durum.passed && !durum.tried && durum.read).length;

  const parcalar = [`${kanitlanan}/${lessons.length} ders kanıtlandı`];
  if (denenen > 0) parcalar.push(`${denenen} denendi`);
  if (okunan > 0) parcalar.push(`${okunan} okundu`);

  return (
    <p role="status" className={`mt-4 text-sm font-semibold ${theme.accentText}`}>
      {parcalar.join(" · ")}
    </p>
  );
}
