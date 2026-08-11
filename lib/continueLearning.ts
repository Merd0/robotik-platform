import type { EvidenceEvent } from "./evidence";
import type { Seviye } from "./content";

export interface ContinueLesson {
  slug: string;
  baslik: string;
  seviye: Seviye;
  seviyeEtiketi: string;
}
export interface ContinueRoute {
  seviye: Seviye;
  steps: readonly ContinueLesson[];
}

export interface ContinueState {
  lastLesson: ContinueLesson;
  lastEventLabel: string;
  recommendation: {
    href: string;
    baslik: string;
    detail: string;
  };
}

function eventLabel(event: EvidenceEvent): string {
  if (event.stage === "passed") return "Ölçüt doğrulandı";
  if (event.stage === "assessed") return "Kavram kontrolü kaydedildi";
  if (event.stage === "observed") return "Deney gözlemi kaydedildi";
  if (event.stage === "tried") return "Deneme kaydedildi";
  if (event.stage === "predicted") return "Tahmin kaydedildi";
  return "Okuma kaydedildi";
}

/**
 * Son yer, yerel kayıt dizisindeki en son yayımlı ders olayıdır. Sonraki adım
 * yalnız o seviyenin elle seçilmiş üç derslik rotasından gelir; puanlama,
 * benzerlik veya otomatik müfredat çıkarımı yapılmaz.
 */
export function getContinueState(
  events: readonly EvidenceEvent[],
  lessons: readonly ContinueLesson[],
  routes: readonly ContinueRoute[],
): ContinueState | null {
  const lessonsBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  let lastEvent: EvidenceEvent | undefined;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (lessonsBySlug.has(events[index].lessonId)) {
      lastEvent = events[index];
      break;
    }
  }

  if (!lastEvent) return null;
  const lastLesson = lessonsBySlug.get(lastEvent.lessonId)!;
  const route = routes.find((candidate) => candidate.seviye === lastLesson.seviye);
  if (!route) return null;

  const visited = new Set(events.map((event) => event.lessonId));
  const lastRouteIndex = route.steps.findIndex((step) => step.slug === lastLesson.slug);
  const laterUnvisited = route.steps
    .slice(Math.max(0, lastRouteIndex + 1))
    .find((step) => !visited.has(step.slug));
  const nextStep = laterUnvisited ?? route.steps.find((step) => !visited.has(step.slug));

  return {
    lastLesson,
    lastEventLabel: eventLabel(lastEvent),
    recommendation: nextStep
      ? {
          href: `/ders/${nextStep.slug}`,
          baslik: nextStep.baslik,
          detail: `${nextStep.seviyeEtiketi} · elle seçilmiş başlangıç rotasının sonraki adımı`,
        }
      : {
          href: `/seviye/${lastLesson.seviye}`,
          baslik: `${lastLesson.seviyeEtiketi} derslerini aç`,
          detail: "Üç derslik başlangıç rotandaki tüm duraklarda yerel kaydın var",
        },
  };
}
