import { describe, expect, it } from "vitest";
import { buildTimeCapsule, describeEvidenceStage } from "./timeCapsule";
import type { EvidenceEvent } from "./evidence";

const NOW = new Date("2026-08-25T12:00:00.000Z");

function makeEvent(overrides: Partial<EvidenceEvent> & { createdAt: string }): EvidenceEvent {
  return {
    schemaVersion: 2,
    id: overrides.id ?? `event-${overrides.createdAt}`,
    lessonId: overrides.lessonId ?? "b-lise-ileri-kinematik",
    skillId: overrides.skillId ?? "forward-kinematics",
    kind: overrides.kind ?? "observation",
    stage: overrides.stage ?? "observed",
    result: overrides.result ?? "success",
    verification: overrides.verification ?? "component-observed",
    contentVersion: overrides.contentVersion ?? "v1",
    createdAt: overrides.createdAt,
  };
}

function daysAgoIso(days: number): string {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

describe("buildTimeCapsule", () => {
  it("hiç olay yoksa boş dizi döner", () => {
    expect(buildTimeCapsule([], NOW)).toEqual([]);
  });

  it("hiçbir olay hiçbir çapaya (7/30/90/365 gün) yakın değilse ve ilk kayıt henüz yeteri kadar eski değilse boş dizi döner", () => {
    const events = [makeEvent({ createdAt: daysAgoIso(2) }), makeEvent({ createdAt: daysAgoIso(4) })];
    expect(buildTimeCapsule(events, NOW)).toEqual([]);
  });

  it("tam bir hafta önceki bir olayı 'hafta' çapasıyla bulur", () => {
    const events = [makeEvent({ createdAt: daysAgoIso(7), id: "hafta-once" })];
    const result = buildTimeCapsule(events, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].anchorId).toBe("hafta");
    expect(result[0].event.id).toBe("hafta-once");
  });

  it("çapa toleransı içindeki (ör. 6 veya 8 gün) bir olayı da bulur", () => {
    expect(buildTimeCapsule([makeEvent({ createdAt: daysAgoIso(6) })], NOW)[0].anchorId).toBe("hafta");
    expect(buildTimeCapsule([makeEvent({ createdAt: daysAgoIso(8) })], NOW)[0].anchorId).toBe("hafta");
  });

  it("tolerans dışındaki (ör. 5 veya 9 gün) bir olayı 'hafta' çapasına bağlamaz", () => {
    expect(buildTimeCapsule([makeEvent({ createdAt: daysAgoIso(5) })], NOW)).toEqual([]);
    expect(buildTimeCapsule([makeEvent({ createdAt: daysAgoIso(9) })], NOW)).toEqual([]);
  });

  it("birden fazla çapa aynı anda doldurulabilir (hafta + ay + üç ay + yıl)", () => {
    const events = [
      makeEvent({ createdAt: daysAgoIso(7), id: "e-hafta" }),
      makeEvent({ createdAt: daysAgoIso(30), id: "e-ay" }),
      makeEvent({ createdAt: daysAgoIso(90), id: "e-uc-ay" }),
      makeEvent({ createdAt: daysAgoIso(365), id: "e-yil" }),
    ];
    const result = buildTimeCapsule(events, NOW);
    const anchorIds = result.map((entry) => entry.anchorId).sort();
    expect(anchorIds).toEqual(["ay", "hafta", "uc-ay", "yil"]);
  });

  it("bir çapa aralığında birden fazla olay varsa en ANLAMLI (en ileri aşama) olanı seçer", () => {
    const events = [
      makeEvent({ createdAt: daysAgoIso(7), id: "sadece-okundu", stage: "read" }),
      makeEvent({ createdAt: daysAgoIso(7), id: "gecti", stage: "passed", kind: "achievement", verification: "registry-predicate" }),
    ];
    const result = buildTimeCapsule(events, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].event.id).toBe("gecti");
  });

  it("14 günden eski en ilk olayı 'ilk-kayit' olarak ayrıca ekler, bir çapayla çakışmıyorsa", () => {
    const events = [
      makeEvent({ createdAt: daysAgoIso(400), id: "cok-eski-ilk" }),
      makeEvent({ createdAt: daysAgoIso(2), id: "yeni" }),
    ];
    const result = buildTimeCapsule(events, NOW);
    expect(result.some((entry) => entry.anchorId === "ilk-kayit" && entry.event.id === "cok-eski-ilk")).toBe(true);
  });

  it("ilk kayıt zaten bir çapayla eşleşmişse tekrar ayrı bir 'ilk-kayit' girdisi eklemez", () => {
    const events = [makeEvent({ createdAt: daysAgoIso(365), id: "tek-olay" })];
    const result = buildTimeCapsule(events, NOW);
    const idsForEvent = result.filter((entry) => entry.event.id === "tek-olay");
    expect(idsForEvent).toHaveLength(1);
  });

  it("ilk kayıt 14 günden yakınsa 'ilk-kayit' olarak eklenmez (henüz bir 'kapsül' değil)", () => {
    const events = [makeEvent({ createdAt: daysAgoIso(3), id: "cok-yeni" })];
    expect(buildTimeCapsule(events, NOW)).toEqual([]);
  });

  it("her girdinin daysAgoActual'ı createdAt'ten NOW'a gerçek gün farkıdır", () => {
    const events = [makeEvent({ createdAt: daysAgoIso(30), id: "e" })];
    const result = buildTimeCapsule(events, NOW);
    expect(result[0].daysAgoActual).toBe(30);
  });
});

describe("describeEvidenceStage", () => {
  it("her aşama için boş olmayan, ayrı bir Türkçe fiil döner", () => {
    const stages: EvidenceEvent["stage"][] = ["read", "predicted", "tried", "observed", "assessed", "passed"];
    const verbs = stages.map((stage) => describeEvidenceStage(stage));
    expect(verbs.every((verb) => verb.length > 0)).toBe(true);
    expect(new Set(verbs).size).toBe(stages.length);
  });
});
