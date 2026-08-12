import { describe, expect, it } from "vitest";
import { EVIDENCE_PREDICATES, serializeEvidence, type EvidenceEvent } from "./evidence";
import { analyzeEvidenceExport, EVIDENCE_EXPORT_SCHEMA } from "./evidenceImport";

const fourLens = EVIDENCE_PREDICATES.find((item) => item.id === "four-lens-fk-trace-v2")!;

function makeEvent(overrides: Partial<EvidenceEvent> = {}): EvidenceEvent {
  return {
    schemaVersion: 2,
    id: `evt-${Math.random()}`,
    lessonId: fourLens.lessonId,
    skillId: fourLens.skillId,
    kind: "observation",
    stage: "observed",
    result: "success",
    verification: "component-observed",
    contentVersion: "sha256:current",
    createdAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("analyzeEvidenceExport — biçim doğruluğu", () => {
  it("gerçek serializeEvidence çıktısını geçerli sayar", () => {
    const raw = serializeEvidence([makeEvent({ stage: "read" })]);
    const report = analyzeEvidenceExport(raw);
    expect(report.valid).toBe(true);
    expect(report.schema).toBe(EVIDENCE_EXPORT_SCHEMA);
    expect(report.eventCount).toBe(1);
    expect(report.validEventCount).toBe(1);
  });

  it("bozuk JSON'u açık bir hatayla reddeder", () => {
    const report = analyzeEvidenceExport("{ bu json degil");
    expect(report.valid).toBe(false);
    expect(report.issues[0].severity).toBe("error");
  });

  it("obje olmayan kökü reddeder", () => {
    const report = analyzeEvidenceExport("[1, 2, 3]");
    expect(report.valid).toBe(false);
  });

  it("yanlış/eksik şemayı reddeder — robotik-platform'un kendi dışa aktarımı olmayabilir", () => {
    const report = analyzeEvidenceExport(JSON.stringify({ schema: "baska-bir-uygulama/v1", events: [] }));
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.message.includes("Beklenmeyen şema"))).toBe(true);
  });

  it("events dizi değilse reddeder", () => {
    const report = analyzeEvidenceExport(JSON.stringify({ schema: EVIDENCE_EXPORT_SCHEMA, events: "olmamalı" }));
    expect(report.valid).toBe(false);
  });

  it("geçersiz tekil olayı raporlar ama geçerli olanları saymaya devam eder", () => {
    const raw = JSON.stringify({
      schema: EVIDENCE_EXPORT_SCHEMA,
      exportedAt: "2026-08-10T00:00:00.000Z",
      events: [makeEvent(), { id: "eksik-alanlar" }],
    });
    const report = analyzeEvidenceExport(raw);
    expect(report.eventCount).toBe(2);
    expect(report.validEventCount).toBe(1);
    expect(report.issues.some((issue) => issue.message.includes("olay #1"))).toBe(true);
  });

  it("bilinmeyen stage/result/kind/verification değerini reddeder", () => {
    const raw = JSON.stringify({
      schema: EVIDENCE_EXPORT_SCHEMA,
      events: [{ ...makeEvent(), stage: "uydurma-asama" }],
    });
    const report = analyzeEvidenceExport(raw);
    expect(report.validEventCount).toBe(0);
  });
});

describe("analyzeEvidenceExport — predicate kontrolü (Sprint 0 stale-guard'ının içe aktarma karşılığı)", () => {
  it("güncel predicate kümesindeki bir passed kaydını 'geçerli' sayar", () => {
    const passed = makeEvent({ stage: "passed", kind: "achievement", verification: "registry-predicate", predicateId: fourLens.id });
    const report = analyzeEvidenceExport(serializeEvidence([passed]));
    const lesson = report.lessons.find((item) => item.lessonId === fourLens.lessonId)!;
    expect(lesson.passedPredicateIds).toEqual([fourLens.id]);
    expect(lesson.stalePredicateIds).toEqual([]);
  });

  it("artık kayıtlı olmayan (eski sürüm) bir predicateId'yi 'eski' olarak ayırır, 'geçerli' saymaz", () => {
    const stale = makeEvent({ stage: "passed", kind: "achievement", verification: "registry-predicate", predicateId: "artik-yok-v1" });
    const report = analyzeEvidenceExport(serializeEvidence([stale]));
    const lesson = report.lessons.find((item) => item.lessonId === fourLens.lessonId)!;
    expect(lesson.passedPredicateIds).toEqual([]);
    expect(lesson.stalePredicateIds).toEqual(["artik-yok-v1"]);
  });

  it("legacy-unverified bir passed kaydını ne geçerli ne eski predicate listesine sokar", () => {
    const legacy = makeEvent({ stage: "passed", kind: "legacy", verification: "legacy-unverified", predicateId: undefined });
    const report = analyzeEvidenceExport(serializeEvidence([legacy]));
    const lesson = report.lessons.find((item) => item.lessonId === fourLens.lessonId)!;
    expect(lesson.passedPredicateIds).toEqual([]);
    expect(lesson.stalePredicateIds).toEqual([]);
  });
});

describe("analyzeEvidenceExport — sürüm tazeliği (güncel / eski sürüm / bilinmiyor)", () => {
  it("manifest verilmezse 'bilinmiyor' der, asla yanlış 'güncel' söylemez", () => {
    const report = analyzeEvidenceExport(serializeEvidence([makeEvent({ contentVersion: "sha256:current" })]));
    expect(report.lessons[0].freshness).toBe("unknown");
  });

  it("kayıt manifestteki güncel hash'le eşleşiyorsa 'güncel' der", () => {
    const report = analyzeEvidenceExport(
      serializeEvidence([makeEvent({ contentVersion: "sha256:current" })]),
      { [fourLens.lessonId]: "sha256:current" },
    );
    expect(report.lessons[0].freshness).toBe("current");
  });

  it("kayıt manifestteki güncel hash'le eşleşmiyorsa 'eski sürüm' der", () => {
    const report = analyzeEvidenceExport(
      serializeEvidence([makeEvent({ contentVersion: "sha256:eski" })]),
      { [fourLens.lessonId]: "sha256:current" },
    );
    expect(report.lessons[0].freshness).toBe("stale");
  });

  it("aynı ders için karışık (eski+yeni) contentVersion'lar da 'eski sürüm' sayılır", () => {
    const report = analyzeEvidenceExport(
      serializeEvidence([makeEvent({ contentVersion: "sha256:current" }), makeEvent({ contentVersion: "sha256:eski" })]),
      { [fourLens.lessonId]: "sha256:current" },
    );
    expect(report.lessons[0].freshness).toBe("stale");
  });
});
