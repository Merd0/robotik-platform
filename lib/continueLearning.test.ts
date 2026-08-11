import { describe, expect, it } from "vitest";
import type { EvidenceEvent } from "./evidence";
import { getContinueState, type ContinueLesson, type ContinueRoute } from "./continueLearning";

const lessons: ContinueLesson[] = [
  { slug: "m-1", baslik: "Birinci", seviye: "ortaokul", seviyeEtiketi: "Ortaokul" },
  { slug: "m-2", baslik: "İkinci", seviye: "ortaokul", seviyeEtiketi: "Ortaokul" },
  { slug: "m-3", baslik: "Üçüncü", seviye: "ortaokul", seviyeEtiketi: "Ortaokul" },
];
const routes: ContinueRoute[] = [{ seviye: "ortaokul", steps: lessons }];

function evidence(lessonId: string, stage: EvidenceEvent["stage"] = "read"): EvidenceEvent {
  return {
    schemaVersion: 2,
    id: `${lessonId}-${stage}`,
    lessonId,
    skillId: "test",
    kind: stage === "passed" ? "achievement" : "observation",
    stage,
    result: "neutral",
    verification: stage === "passed" ? "registry-predicate" : "component-observed",
    contentVersion: "v1",
    createdAt: "2026-08-11T10:00:00.000Z",
  };
}

describe("kaldığın yerden devam durumu", () => {
  it("kayıt yoksa kartı gizlemek için null döndürür", () => {
    expect(getContinueState([], lessons, routes)).toBeNull();
  });

  it("son yayımlı ders kaydını ve rotadaki tek sonraki adımı seçer", () => {
    const state = getContinueState([evidence("m-1"), evidence("bilinmeyen"), evidence("m-2", "observed")], lessons, routes);
    expect(state?.lastLesson.slug).toBe("m-2");
    expect(state?.lastEventLabel).toBe("Deney gözlemi kaydedildi");
    expect(state?.recommendation.href).toBe("/ders/m-3");
  });

  it("rota tamamlandıysa aynı seviyenin ders sayfasını tek adım olarak verir", () => {
    const state = getContinueState(lessons.map((lesson) => evidence(lesson.slug)), lessons, routes);
    expect(state?.recommendation.href).toBe("/seviye/ortaokul");
  });
});
