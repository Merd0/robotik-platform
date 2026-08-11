import { describe, expect, it } from "vitest";
import { EVIDENCE_PREDICATES, migrateLegacyEvidence, summarizeEvidence, type EvidenceEvent } from "./evidence";

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
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "four-lens-fk-trace-v1")!;
    const passedEvent = event("passed", "success", { lessonId: predicate.lessonId, skillId: predicate.skillId, predicateId: predicate.id });
    expect(summarizeEvidence([passedEvent], predicate.lessonId)).toMatchObject({ read: false, tried: false, passed: true });
    expect(summarizeEvidence([event("read")], "ders-1")).toMatchObject({ read: true, tried: false, passed: false });
    expect(summarizeEvidence([event("observed")], "ders-1")).toMatchObject({ read: false, tried: true, passed: false });
  });

  it("çoktan seçmeli değerlendirmeyi tek başına beceri kanıtı saymaz", () => {
    expect(summarizeEvidence([event("assessed", "success")], "ders-1")).toMatchObject({ passed: false, assessmentCount: 1 });
  });

  it("yalnız registry predicate tarafından doğrulanmış güncel başarıyı sayar", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "four-lens-fk-trace-v1")!;
    const overrides = { lessonId: predicate.lessonId, skillId: predicate.skillId, predicateId: predicate.id };
    const unverified = event("passed", "success", { ...overrides, verification: "legacy-unverified", predicateId: undefined });
    const verified = event("passed", "success", overrides);
    expect(summarizeEvidence([unverified], predicate.lessonId).passed).toBe(false);
    expect(summarizeEvidence([verified], predicate.lessonId, "artifact-2").passed).toBe(true);
    expect(summarizeEvidence([verified], predicate.lessonId, "artifact-3").passed).toBe(false);
  });

  it("predicate id sürüm atlayınca eski koşuldan üretilmiş passed kaydı sessizce geçerli kalmaz", () => {
    const planner = EVIDENCE_PREDICATES.find((item) => item.id === "planner-three-way-comparison-v2")!;
    const staleV1Achievement = event("passed", "success", {
      lessonId: planner.lessonId,
      skillId: planner.skillId,
      predicateId: "planner-three-way-comparison-v1",
      verification: "registry-predicate",
    });
    expect(summarizeEvidence([staleV1Achievement], planner.lessonId).passed).toBe(false);

    const currentAchievement = { ...staleV1Achievement, predicateId: "planner-three-way-comparison-v2" };
    expect(summarizeEvidence([currentAchievement], planner.lessonId).passed).toBe(true);
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

describe("controlled pilot predicates", () => {
  const pilotEvent = (
    lessonId: string,
    skillId: string,
    stage: "observed" | "assessed",
    metrics: Record<string, string>,
  ) => event(stage, "success", { lessonId, skillId, metrics, contentVersion: "pilot-v1" });

  it("requires both transform orders plus the executable code assessment", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "transform-order-comparison-v1")!;
    const observations = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { order: "translation-then-rotation" }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { order: "rotation-then-translation" }),
    ];
    expect(predicate.evaluate(observations).passed).toBe(false);
    expect(predicate.evaluate([...observations, pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {})]).passed).toBe(true);
  });

  it("requires low and damped DLS runs plus transfer", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "dls-damping-comparison-v1")!;
    const events = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { dampingBand: "dusuk" }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { dampingBand: "sonumlu" }),
      pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {}),
    ];
    expect(predicate.evaluate(events).passed).toBe(true);
  });

  it("requires a safe and colliding configuration plus transfer", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "configuration-space-boundary-v1")!;
    const events = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { configuration: "safe" }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", { configuration: "collision" }),
      pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {}),
    ];
    expect(predicate.evaluate(events).passed).toBe(true);
  });

  it("requires a matching observation and four-criterion robot decision", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "robot-selection-four-criteria-v1")!;
    const observation = event("observed", "neutral", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { taskId: "electronics", candidateId: "epson-gx4-350" },
      contentVersion: "pilot-v1",
    });
    const assessment = event("assessed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { taskId: "electronics", candidateId: "epson-gx4-350", decisionStatus: "fit", numericCriteria: 4, rationaleLength: 45 },
      contentVersion: "pilot-v1",
    });
    expect(predicate.evaluate([assessment]).passed).toBe(false);
    expect(predicate.evaluate([observation, assessment]).passed).toBe(true);
  });

  it("never derives passed from failed/timeout planner runs, only genuine successes", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "planner-three-way-comparison-v2")!;
    const failedRun = (algorithm: string) => event("observed", "retry", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { algorithm, seed: 1, error: "timeout" },
      contentVersion: "pilot-v1",
    });
    const assessment = event("assessed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      contentVersion: "pilot-v1",
    });
    const threeFailedRuns = [failedRun("astar"), failedRun("rrt"), failedRun("rrt_star"), assessment];
    expect(predicate.evaluate(threeFailedRuns).passed).toBe(false);

    const successfulRun = (algorithm: string) => event("observed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { algorithm, seed: 1 },
      contentVersion: "pilot-v1",
    });
    const threeSuccessfulRuns = [successfulRun("astar"), successfulRun("rrt"), successfulRun("rrt_star"), assessment];
    expect(predicate.evaluate(threeSuccessfulRuns).passed).toBe(true);
  });

  it("requires the first and final synchronized FK samples", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "four-lens-fk-trace-v1")!;
    const sample = (sampleIndex: number) => event("observed", "neutral", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { sampleIndex },
      contentVersion: "pilot-v1",
    });
    const assessment = event("assessed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { finalSample: 3 },
      contentVersion: "pilot-v1",
    });
    expect(predicate.evaluate([sample(0), assessment]).passed).toBe(false);
    expect(predicate.evaluate([sample(0), sample(3), assessment]).passed).toBe(true);
  });
});
