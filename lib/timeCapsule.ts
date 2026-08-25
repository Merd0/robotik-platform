import type { EvidenceEvent, EvidenceStage } from "./evidence";

/**
 * "Zaman Kapsülü" laboratuvarının saf motoru (docs/16 FAZ 5). Sunucusuz,
 * hesapsız: yalnız kullanıcının kendi tarayıcısındaki gerçek `EvidenceEvent`
 * listesini (`lib/evidence.ts`) sabit zaman çapalarıyla (1 hafta/1 ay/3 ay/1
 * yıl önce + ilk kayıt) karşılaştırır. Fake istatistik veya uydurma tarih
 * YOK — her girdi gerçek `createdAt` damgasına dayanır.
 */

export type TimeCapsuleAnchorId = "hafta" | "ay" | "uc-ay" | "yil" | "ilk-kayit";

export interface TimeCapsuleEntry {
  anchorId: TimeCapsuleAnchorId;
  anchorLabel: string;
  event: EvidenceEvent;
  /** `event.createdAt`den `now`a gerçek gün farkı (yuvarlanmış). */
  daysAgoActual: number;
}

interface Anchor {
  id: Exclude<TimeCapsuleAnchorId, "ilk-kayit">;
  label: string;
  daysAgo: number;
  toleranceDays: number;
}

const ANCHORS: readonly Anchor[] = [
  { id: "hafta", label: "Tam bir hafta önce", daysAgo: 7, toleranceDays: 1 },
  { id: "ay", label: "Tam bir ay önce", daysAgo: 30, toleranceDays: 3 },
  { id: "uc-ay", label: "Üç ay önce", daysAgo: 90, toleranceDays: 5 },
  { id: "yil", label: "Tam bir yıl önce", daysAgo: 365, toleranceDays: 7 },
];

/**
 * Bir olay "ilk kayıt" kapsülü sayılabilmesi için en az bu kadar eski olmalı.
 * "hafta" çapasının toleransından (7±1 = en çok 8 gün) belirgin şekilde
 * uzak tutulur — aksi halde "hafta" çapasını 1 gün farkla kaçıran bir olay
 * hem hiçbir çapaya girmez hem de yanıltıcı biçimde "ilk kayıt" sayılırdı.
 */
const MIN_FIRST_RECORD_AGE_DAYS = 14;

const MS_PER_DAY = 86_400_000;

function daysBetween(now: Date, past: Date): number {
  return Math.round((now.getTime() - past.getTime()) / MS_PER_DAY);
}

const STAGE_ORDER: readonly EvidenceStage[] = ["read", "predicted", "tried", "observed", "assessed", "passed"];

function stageWeight(stage: EvidenceStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Aynı çapa aralığındaki birden fazla olaydan en ileri aşamada olanı seçer. */
function mostSubstantive(events: readonly EvidenceEvent[]): EvidenceEvent {
  return events.reduce((best, event) => (stageWeight(event.stage) > stageWeight(best.stage) ? event : best));
}

export function buildTimeCapsule(events: readonly EvidenceEvent[], now: Date): TimeCapsuleEntry[] {
  if (events.length === 0) return [];

  const entries: TimeCapsuleEntry[] = [];

  for (const anchor of ANCHORS) {
    const candidates = events.filter(
      (event) => Math.abs(daysBetween(now, new Date(event.createdAt)) - anchor.daysAgo) <= anchor.toleranceDays,
    );
    if (candidates.length === 0) continue;
    const chosen = mostSubstantive(candidates);
    entries.push({
      anchorId: anchor.id,
      anchorLabel: anchor.label,
      event: chosen,
      daysAgoActual: daysBetween(now, new Date(chosen.createdAt)),
    });
  }

  const first = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )[0];
  const firstDaysAgo = daysBetween(now, new Date(first.createdAt));
  const alreadyIncluded = entries.some((entry) => entry.event.id === first.id);
  if (firstDaysAgo >= MIN_FIRST_RECORD_AGE_DAYS && !alreadyIncluded) {
    entries.push({
      anchorId: "ilk-kayit",
      anchorLabel: "İlk kaydın",
      event: first,
      daysAgoActual: firstDaysAgo,
    });
  }

  return entries;
}

const STAGE_VERB: Record<EvidenceStage, string> = {
  read: "okudun",
  predicted: "tahmin ettin",
  tried: "denedin",
  observed: "gözlemledin",
  assessed: "değerlendirildin",
  passed: "başardın",
};

export function describeEvidenceStage(stage: EvidenceStage): string {
  return STAGE_VERB[stage];
}
