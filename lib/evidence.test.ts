import { describe, expect, it } from "vitest";
import { migrateLegacyEvidence, summarizeEvidence, type EvidenceEvent } from "./evidence";

const event = (
  stage: EvidenceEvent["stage"],
  result: EvidenceEvent["result"] = "neutral",
  overrides: Partial<EvidenceEvent> = {},
): EvidenceEvent => ({
  schemaVersion: 2,
  id: `${stage}-${Math.random()}`,
  lessonId: "ders-1",
  skillId: "beceri-1",
  kind: stage === "passed" ? "achievement" : stage === "assessed" ? "assessment" : "observation",
  stage,
  result,
  verification: stage === "passed" ? "registry-predicate" : "component-observed",
  predicateId: stage === "passed" ? "predicate-v1" : undefined,
  contentVersion: "artifact-2",
  createdAt: "2026-08-07T00:00:00.000Z",
  ...overrides,
});

describe("Evidence v2 özeti", () => {
  it("okuma ve denemeyi başarıdan türetmez", () => {
    expect(summarizeEvidence([event("passed", "success")], "ders-1")).toMatchObject({ read: false, tried: false, passed: true });
    expect(summarizeEvidence([event("read")], "ders-1")).toMatchObject({ read: true, tried: false, passed: false });
    expect(summarizeEvidence([event("observed")], "ders-1")).toMatchObject({ read: false, tried: true, passed: false });
  });

  it("çoktan seçmeli değerlendirmeyi tek başına beceri kanıtı saymaz", () => {
    expect(summarizeEvidence([event("assessed", "success")], "ders-1")).toMatchObject({ passed: false, assessmentCount: 1 });
  });

  it("yalnız registry predicate tarafından doğrulanmış güncel başarıyı sayar", () => {
    const unverified = event("passed", "success", { verification: "legacy-unverified", predicateId: undefined });
    const verified = event("passed", "success");
    expect(summarizeEvidence([unverified], "ders-1").passed).toBe(false);
    expect(summarizeEvidence([verified], "ders-1", "artifact-2").passed).toBe(true);
    expect(summarizeEvidence([verified], "ders-1", "artifact-3").passed).toBe(false);
  });
});

describe("v1 ve manuel ilerleme göçü", () => {
  it("eski passed olayını doğrulanmamış assessment'a indirger", () => {
    const migrated = migrateLegacyEvidence([
      { id: "old", lessonId: "ders-1", skillId: "beceri-1", stage: "passed", result: "success", contentVersion: "v1" },
    ], [], "2026-08-09T00:00:00.000Z");
    expect(migrated[0]).toMatchObject({ schemaVersion: 2, stage: "assessed", kind: "legacy", verification: "legacy-unverified" });
    expect(summarizeEvidence(migrated, "ders-1").passed).toBe(false);
  });

  it("eski manuel tamamlamayı yalnız okunmuş olarak korur ve çoğaltmaz", () => {
    const migrated = migrateLegacyEvidence(
      [{ id: "old", lessonId: "ders-1", skillId: "beceri-1", stage: "read", result: "success" }],
      ["ders-1", "ders-2"],
      "2026-08-09T00:00:00.000Z",
    );
    expect(migrated.filter((item) => item.lessonId === "ders-1")).toHaveLength(1);
    expect(migrated.find((item) => item.lessonId === "ders-2")).toMatchObject({ stage: "read", verification: "legacy-unverified" });
  });
});
