"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EMPTY_EVIDENCE, getEvidenceEvents, subscribeEvidence } from "@/lib/evidence";
import { buildTimeCapsule, describeEvidenceStage, type TimeCapsuleEntry } from "@/lib/timeCapsule";
import type { ContinueLesson } from "@/lib/continueLearning";

function formatMetrics(metrics: Record<string, number | string | boolean> | undefined): string | null {
  if (!metrics) return null;
  const entries = Object.entries(metrics).slice(0, 3);
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

/**
 * "Zaman Kapsülü" — hesapsız, sunucusuz: tamamen tarayıcıdaki gerçek
 * `EvidenceEvent` geçmişinden (bkz. lib/timeCapsule.ts) üretilir. Fake
 * istatistik yok — bir çapaya (1 hafta/1 ay/3 ay/1 yıl önce) yakın gerçek
 * bir olay yoksa o çapa hiç gösterilmez.
 */
export function TimeCapsule() {
  const events = useSyncExternalStore(subscribeEvidence, getEvidenceEvents, () => EMPTY_EVIDENCE);
  const [lessons, setLessons] = useState<readonly ContinueLesson[] | null>(null);
  const istendi = useRef(false);

  useEffect(() => {
    if (events.length === 0 || istendi.current) return;
    istendi.current = true;
    fetch("/devam-index.json")
      .then((yanit) => (yanit.ok ? (yanit.json() as Promise<ContinueLesson[]>) : Promise.reject(yanit.status)))
      .then((data) => setLessons(data))
      .catch(() => setLessons([]));
  }, [events.length]);

  const entries = buildTimeCapsule(events, new Date());
  const lessonBySlug = new Map((lessons ?? []).map((lesson) => [lesson.slug, lesson]));

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-site-border bg-site-soft p-6 text-sm leading-6 text-site-muted">
        Henüz bir kaydın yok. Bir ders veya laboratuvarda bir deney dene — birkaç hafta sonra buraya döndüğünde
        o anı burada bulacaksın.
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-site-border bg-site-soft p-6 text-sm leading-6 text-site-muted">
        Kaydın var ama henüz hiçbir olay 1 hafta/1 ay/3 ay/1 yıl önce çapalarından birine yakın değil. Zaman
        geçtikçe burası dolacak.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <TimeCapsuleCard key={`${entry.anchorId}-${entry.event.id}`} entry={entry} lesson={lessonBySlug.get(entry.event.lessonId)} />
      ))}
    </ol>
  );
}

function TimeCapsuleCard({ entry, lesson }: { entry: TimeCapsuleEntry; lesson: ContinueLesson | undefined }) {
  const metricsText = formatMetrics(entry.event.metrics);
  const label = lesson?.baslik ?? entry.event.lessonId;

  return (
    <li className="rounded-xl border border-site-border bg-site-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">
        {entry.anchorLabel} · {entry.daysAgoActual} gün önce
      </p>
      <p className="mt-2 text-sm leading-6 text-site-ink">
        {lesson ? (
          <Link href={`/ders/${lesson.slug}`} className="font-semibold underline decoration-2 underline-offset-4">
            {label}
          </Link>
        ) : (
          <span className="font-semibold">{label}</span>
        )}{" "}
        dersinde/deneyinde bir görevi {describeEvidenceStage(entry.event.stage)}
        {entry.event.result === "success" ? " ve başardın." : "."}
      </p>
      {metricsText && <p className="mt-1 font-mono text-xs text-site-muted">{metricsText}</p>}
    </li>
  );
}
