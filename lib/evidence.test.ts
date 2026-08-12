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
    metrics: Record<string, number | string | boolean>,
  ) => event(stage, "success", { lessonId, skillId, metrics, contentVersion: "pilot-v1" });

  it("requires both transform orders plus the executable code assessment", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "transform-order-comparison-v2")!;
    const observations = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        order: "translation-then-rotation", angleDegrees: 90, outputX: 0, outputY: 1,
        comparisonDistance: 1.414, correctPrediction: true,
      }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        order: "rotation-then-translation", angleDegrees: 90, outputX: 1, outputY: 0,
        comparisonDistance: 1.414, correctPrediction: true,
      }),
    ];
    expect(predicate.evaluate(observations).passed).toBe(false);
    expect(predicate.evaluate([...observations, pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {})]).passed).toBe(true);
  });

  it("requires low and damped DLS runs plus transfer", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "dls-damping-comparison-v2")!;
    const events = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        dampingBand: "dusuk", damping: 0.02, targetX: 1.15, targetY: 0.65,
        converged: true, iterations: 12, traceLength: 13, initialError: 0.8, finalError: 0.0005,
      }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        dampingBand: "sonumlu", damping: 0.08, targetX: 1.15, targetY: 0.65,
        converged: true, iterations: 20, traceLength: 21, initialError: 0.8, finalError: 0.0007,
      }),
      pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {}),
    ];
    expect(predicate.evaluate(events).passed).toBe(true);
  });

  it("requires a safe and colliding configuration plus transfer", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "configuration-space-boundary-v2")!;
    const events = [
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        configuration: "safe", collides: false, q1: 0, q2: 0, robotId: "generic-2dof",
        obstacleX: 0.72, obstacleY: 0.28, obstacleRadius: 0.24,
      }),
      pilotEvent(predicate.lessonId, predicate.skillId, "observed", {
        configuration: "collision", collides: true, q1: 20, q2: 0, robotId: "generic-2dof",
        obstacleX: 0.72, obstacleY: 0.28, obstacleRadius: 0.24,
      }),
      pilotEvent(predicate.lessonId, predicate.skillId, "assessed", {}),
    ];
    expect(predicate.evaluate(events).passed).toBe(true);
  });

  it("requires a matching observation and four-criterion robot decision", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "robot-selection-four-criteria-v2")!;
    const observation = event("observed", "neutral", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { taskId: "electronics", candidateId: "epson-gx4-350", decisionStatus: "fit", failedConstraints: 0 },
      contentVersion: "pilot-v1",
    });
    const assessment = event("assessed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: {
        taskId: "electronics", candidateId: "epson-gx4-350", decisionStatus: "fit", failedConstraints: 0,
        numericCriteria: 4, eligibleNumericCriteria: 4, distinctCriteria: true, rationaleLength: 45,
      },
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

  it("planner comparison: partial success (2/3 algorithms) never passes", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "planner-three-way-comparison-v2")!;
    const run = (algorithm: string, result: EvidenceEvent["result"]) => event("observed", result, {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { algorithm, seed: 1 },
      contentVersion: "pilot-v1",
    });
    const assessment = event("assessed", "success", { lessonId: predicate.lessonId, skillId: predicate.skillId, contentVersion: "pilot-v1" });
    expect(predicate.evaluate([run("astar", "success"), run("rrt", "success"), run("rrt_star", "retry"), assessment]).passed).toBe(false);
  });

  it("planner comparison: three successes without the concept-check assessment never passes", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "planner-three-way-comparison-v2")!;
    const run = (algorithm: string) => event("observed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { algorithm, seed: 1 },
      contentVersion: "pilot-v1",
    });
    expect(predicate.evaluate([run("astar"), run("rrt"), run("rrt_star")]).passed).toBe(false);
  });
});

describe("Sprint 2 pilot laboratuvarları: golden + negative predicate testleri", () => {
  describe("forward-kinematics-dual-joint-v2 (JointSliders)", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "forward-kinematics-dual-joint-v2")!;
    const observedJoint = (joint: number) => event("observed", "success", {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: { joint },
      contentVersion: "pilot-v1",
    });
    const assessment = (result: EvidenceEvent["result"]) => event("assessed", result, {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      contentVersion: "pilot-v1",
    });

    it("golden: her iki eklem commit edilmiş ve kavram kontrolü geçilmişse passed olur", () => {
      expect(predicate.evaluate([observedJoint(1), observedJoint(2), assessment("success")]).passed).toBe(true);
    });

    it("negatif: yalnız bir eklem commit edilmişse passed olmaz", () => {
      expect(predicate.evaluate([observedJoint(1), assessment("success")]).passed).toBe(false);
    });

    it("negatif: iki eklem de commit edilmiş ama kavram kontrolü hiç yapılmamışsa passed olmaz", () => {
      expect(predicate.evaluate([observedJoint(1), observedJoint(2)]).passed).toBe(false);
    });

    it("negatif: iki eklem commit edilmiş ama kavram kontrolü yanlış cevaplanmışsa passed olmaz", () => {
      expect(predicate.evaluate([observedJoint(1), observedJoint(2), assessment("retry")]).passed).toBe(false);
    });
  });

  describe("multiple-ik-solutions-v2 (IkTarget — dirsek değiştirme)", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "multiple-ik-solutions-v2")!;
    const elbowToggle = (elbow: string, result: EvidenceEvent["result"]) => event("observed", result, {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      metrics: result === "success" ? { elbow } : { elbow, unreachable: true },
      contentVersion: "pilot-v1",
    });
    const assessment = (result: EvidenceEvent["result"]) => event("assessed", result, {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      contentVersion: "pilot-v1",
    });

    it("golden: iki dirsek de gerçekten çözülebilir konumda denenmiş ve kavram kontrolü geçilmişse passed olur", () => {
      expect(predicate.evaluate([elbowToggle("up", "success"), elbowToggle("down", "success"), assessment("success")]).passed).toBe(true);
    });

    it("negatif (component düzeltmesinin kanıtı): dirsek değişimi ÇÖZÜMSÜZ bir konuma düşerse o gözlem sayılmaz", () => {
      // Düzeltmeden önce IkTarget bu durumda bile result: "success" yazıyordu
      // (bkz. components/interactive/IkTarget.tsx handleElbowToggle yorumu);
      // predicate artık result === "success" şartı arıyor.
      const passed = predicate.evaluate([elbowToggle("up", "success"), elbowToggle("down", "retry"), assessment("success")]).passed;
      expect(passed).toBe(false);
    });

    it("negatif: yalnız bir dirsek denenmişse passed olmaz", () => {
      expect(predicate.evaluate([elbowToggle("up", "success"), assessment("success")]).passed).toBe(false);
    });

    it("negatif: iki dirsek de denenmiş ama kavram kontrolü yoksa passed olmaz", () => {
      expect(predicate.evaluate([elbowToggle("up", "success"), elbowToggle("down", "success")]).passed).toBe(false);
    });
  });

  describe("geometric-ik-boundary-v2 (IkTarget — erişilebilir/erişilemez sınır)", () => {
    const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "geometric-ik-boundary-v2")!;
    const reachable = () => event("tried", "success", {
      lessonId: predicate.lessonId,
      skillId: "inverse-kinematics",
      metrics: { x: 0.5, y: 0.2 },
      contentVersion: "pilot-v1",
    });
    const unreachable = () => event("observed", "retry", {
      lessonId: predicate.lessonId,
      skillId: "inverse-kinematics",
      metrics: { unreachable: true },
      contentVersion: "pilot-v1",
    });
    const assessment = (result: EvidenceEvent["result"]) => event("assessed", result, {
      lessonId: predicate.lessonId,
      skillId: predicate.skillId,
      contentVersion: "pilot-v1",
    });

    it("golden: hem erişilebilir hem erişilemez bir hedef commit edilmiş ve kavram kontrolü geçilmişse passed olur", () => {
      expect(predicate.evaluate([reachable(), unreachable(), assessment("success")]).passed).toBe(true);
    });

    it("negatif: yalnız erişilebilir hedefler denenmişse (sınır hiç gözlenmemiş) passed olmaz", () => {
      expect(predicate.evaluate([reachable(), reachable(), assessment("success")]).passed).toBe(false);
    });

    it("negatif: yalnız erişilemez hedefler denenmişse passed olmaz", () => {
      expect(predicate.evaluate([unreachable(), unreachable(), assessment("success")]).passed).toBe(false);
    });

    it("negatif: sınırın iki tarafı da gözlenmiş ama kavram kontrolü yoksa passed olmaz", () => {
      expect(predicate.evaluate([reachable(), unreachable()]).passed).toBe(false);
    });
  });
});

describe("TransformOrderLab rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "transform-order-comparison-v2")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "transform-order-v2",
  });
  const assessment = () => event("assessed", "success", {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    contentVersion: "transform-order-v2",
  });
  const translated = {
    order: "translation-then-rotation", angleDegrees: 90, outputX: 0, outputY: 1,
    comparisonDistance: 1.414, correctPrediction: true,
  };
  const rotated = {
    order: "rotation-then-translation", angleDegrees: 90, outputX: 1, outputY: 0,
    comparisonDistance: 1.414, correctPrediction: true,
  };

  it("golden: aynı açıdaki iki başarılı ve gerçekten ayrışan ölçüm + kod değerlendirmesi geçer", () => {
    expect(predicate.evaluate([
      observation("success", translated),
      observation("success", rotated),
      assessment(),
    ]).passed).toBe(true);
  });

  it("negatif: yanlış tahminlerin retry olayları iki order etiketi taşısa da geçmez", () => {
    expect(predicate.evaluate([
      observation("retry", { ...translated, correctPrediction: false }),
      observation("retry", { ...rotated, correctPrediction: false }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: iki sıra aynı sayısal çıktıyı veriyorsa karşılaştırma sayılmaz", () => {
    expect(predicate.evaluate([
      observation("success", translated),
      observation("success", { ...rotated, outputX: 0, outputY: 1, comparisonDistance: 1.414 }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: iki ölçüm farklı açılardaysa veya kod değerlendirmesi yoksa geçmez", () => {
    expect(predicate.evaluate([
      observation("success", translated),
      observation("success", { ...rotated, angleDegrees: 105 }),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", translated),
      observation("success", rotated),
    ]).passed).toBe(false);
  });
});

describe("DlsTraceLab rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "dls-damping-comparison-v2")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "dls-trace-v2",
  });
  const assessment = () => event("assessed", "success", {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    contentVersion: "dls-trace-v2",
  });
  const low = {
    dampingBand: "dusuk", damping: 0.02, targetX: 1.15, targetY: 0.65,
    converged: true, iterations: 12, traceLength: 13, initialError: 0.8, finalError: 0.0005,
  };
  const damped = {
    dampingBand: "sonumlu", damping: 0.08, targetX: 1.15, targetY: 0.65,
    converged: true, iterations: 20, traceLength: 21, initialError: 0.8, finalError: 0.0007,
  };

  it("golden: aynı hedefte iki tutarlı, tamamlanmış bant koşusu ve transfer geçer", () => {
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", damped),
      assessment(),
    ]).passed).toBe(true);
  });

  it("golden: yakınsamayan koşu retry ve 80 adımlık tam izle dürüstçe kaydedilmişse karşılaştırılabilir", () => {
    expect(predicate.evaluate([
      observation("retry", { ...low, converged: false, iterations: 80, traceLength: 80, finalError: 0.2 }),
      observation("success", damped),
      assessment(),
    ]).passed).toBe(true);
  });

  it("negatif: converged=false koşu success diye işaretlenirse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", { ...low, converged: false, iterations: 80, traceLength: 80, finalError: 0.2 }),
      observation("success", damped),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: etiket damping değeriyle uyuşmazsa veya iz uzunluğu eksikse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", { ...low, damping: 0.08 }),
      observation("success", damped),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", { ...damped, traceLength: 20 }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: farklı hedeflerdeki koşular veya transfersiz çift geçmez", () => {
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", { ...damped, targetX: 1.1 }),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", damped),
    ]).passed).toBe(false);
  });
});

describe("CspaceLab rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "configuration-space-boundary-v2")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "cspace-v2",
  });
  const assessment = () => event("assessed", "success", {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    contentVersion: "cspace-v2",
  });
  const safe = {
    configuration: "safe", collides: false, q1: 0, q2: 0, robotId: "generic-2dof",
    obstacleX: 0.72, obstacleY: 0.28, obstacleRadius: 0.24,
  };
  const collision = {
    configuration: "collision", collides: true, q1: 20, q2: 0, robotId: "generic-2dof",
    obstacleX: 0.72, obstacleY: 0.28, obstacleRadius: 0.24,
  };

  it("golden: aynı deneyde motorla tutarlı serbest/çarpışan çift ve transfer geçer", () => {
    expect(predicate.evaluate([
      observation("success", safe),
      observation("success", collision),
      assessment(),
    ]).passed).toBe(true);
  });

  it("negatif: configuration etiketi collides sonucuyla çelişirse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", { ...safe, collides: true }),
      observation("success", collision),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: başarısız olay, yanlış robot/engel veya grid dışı açı geçmez", () => {
    expect(predicate.evaluate([
      observation("retry", safe),
      observation("success", collision),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", safe),
      observation("success", { ...collision, robotId: "başka-robot" }),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", safe),
      observation("success", { ...collision, q1: 21 }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: iki sınıf aynı açıda veya transfer olmadan kaydedilirse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", safe),
      observation("success", { ...collision, q1: 0, q2: 0 }),
      assessment(),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("success", safe),
      observation("success", collision),
    ]).passed).toBe(false);
  });
});

describe("RobotSelectionTable rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "robot-selection-four-criteria-v2")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "robot-selection-v2",
  });
  const decision = (metrics: Record<string, number | string | boolean>) => event("assessed", "success", {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "robot-selection-v2",
  });
  const observed = { taskId: "electronics", candidateId: "epson-gx4-350", decisionStatus: "fit", failedConstraints: 0 };
  const assessed = {
    ...observed,
    numericCriteria: 4,
    eligibleNumericCriteria: 4,
    distinctCriteria: true,
    rationaleLength: 80,
  };

  it("golden: aynı uygun adayın nötr gözlemi ve dört ayrı ölçülü kararı geçer", () => {
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision(assessed),
    ]).passed).toBe(true);
  });

  it("negatif: fail/retry gözlemi sonraki assessment ile eşleşmez", () => {
    expect(predicate.evaluate([
      observation("retry", { ...observed, decisionStatus: "fail", failedConstraints: 1 }),
      decision(assessed),
    ]).passed).toBe(false);
  });

  it("negatif: yinelenen veya uygun havuzu aşan kriter sayısı geçmez", () => {
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision({ ...assessed, distinctCriteria: false }),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision({ ...assessed, numericCriteria: 5, eligibleNumericCriteria: 4 }),
    ]).passed).toBe(false);
  });

  it("negatif: gözlem ve kararın adayı/status'u farklıysa veya hard fail varsa geçmez", () => {
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision({ ...assessed, candidateId: "epson-gx8-450" }),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision({ ...assessed, decisionStatus: "review" }),
    ]).passed).toBe(false);
    expect(predicate.evaluate([
      observation("neutral", observed),
      decision({ ...assessed, failedConstraints: 1 }),
    ]).passed).toBe(false);
  });
});

describe("CodeRunner rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "python-command-trace-v1")!;
  const run = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
    stage: EvidenceEvent["stage"] = "assessed",
  ) => event(stage, result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "code-runner-v1",
  });

  it("golden: otomatik poz testi geçen ve iki komutluk izi olan koşu geçer", () => {
    expect(predicate.evaluate([run("success", { poseMatches: true, traceSteps: 2 })]).passed).toBe(true);
  });

  it("negatif: doğru poza ulaşmayan koşu geçmez", () => {
    expect(predicate.evaluate([run("retry", { poseMatches: false, traceSteps: 2 })]).passed).toBe(false);
  });

  it("negatif: başarılı işaretlense bile eksik komut izi geçmez", () => {
    expect(predicate.evaluate([run("success", { poseMatches: true, traceSteps: 1 })]).passed).toBe(false);
  });

  it("negatif: assessed olmayan gözlem olayı başarı üretmez", () => {
    expect(predicate.evaluate([run("success", { poseMatches: true, traceSteps: 2 }, "observed")]).passed).toBe(false);
  });
});

describe("SignalTimeline rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "handshake-signal-order-v1")!;
  const run = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
    stage: EvidenceEvent["stage"] = "assessed",
  ) => event(stage, result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "signal-timeline-v1",
  });

  it("golden: istekten sonra gelen onay değerlendirmesi geçer", () => {
    expect(predicate.evaluate([run("success", {
      requestStep: 2,
      acknowledgementStep: 4,
      complete: true,
      correctOrder: true,
    })]).passed).toBe(true);
  });

  it("negatif: onay istekten önceyse başarısız kalır", () => {
    expect(predicate.evaluate([run("retry", {
      requestStep: 4,
      acknowledgementStep: 2,
      complete: true,
      correctOrder: false,
    })]).passed).toBe(false);
  });

  it("negatif: sinyallerden biri eksikse başarı üretmez", () => {
    expect(predicate.evaluate([run("retry", {
      requestStep: 2,
      acknowledgementStep: -1,
      complete: false,
      correctOrder: false,
    })]).passed).toBe(false);
  });

  it("negatif: metrikleri doğru görünse bile assessed olmayan olay geçmez", () => {
    expect(predicate.evaluate([run("success", {
      requestStep: 2,
      acknowledgementStep: 4,
      complete: true,
      correctOrder: true,
    }, "observed")]).passed).toBe(false);
  });
});

describe("SafetyZone rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "safety-braking-distance-v1")!;
  const measurement = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "safety-zone-v1",
  });
  const baseline = () => measurement("success", {
    robotSpeed: 1_000,
    brakingTime: 0.3,
    distance: 1_150,
    requiredSeparation: 1_140,
    atSpeedLimitBoundary: true,
  });

  it("golden: aynı hızda daha uzun frenleme süresinin sınırı büyüttüğünü gösteren iki ölçüm geçer", () => {
    expect(predicate.evaluate([baseline(), measurement("success", {
      robotSpeed: 1_000,
      brakingTime: 0.6,
      distance: 1_900,
      requiredSeparation: 1_920,
      atSpeedLimitBoundary: true,
    })]).passed).toBe(true);
  });

  it("negatif: tek sınır ölçümü karşılaştırma sayılmaz", () => {
    expect(predicate.evaluate([baseline()]).passed).toBe(false);
  });

  it("negatif: iki ölçümde robot hızı değişmişse neden izole edilmemiştir", () => {
    expect(predicate.evaluate([baseline(), measurement("success", {
      robotSpeed: 1_200,
      brakingTime: 0.6,
      distance: 2_060,
      requiredSeparation: 2_060,
      atSpeedLimitBoundary: true,
    })]).passed).toBe(false);
  });

  it("negatif: durma sınırından uzaktaki başarısız ölçüm geçmez", () => {
    expect(predicate.evaluate([baseline(), measurement("retry", {
      robotSpeed: 1_000,
      brakingTime: 0.6,
      distance: 2_500,
      requiredSeparation: 1_920,
      atSpeedLimitBoundary: false,
    })]).passed).toBe(false);
  });
});

describe("PixelToWorld rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "camera-distortion-comparison-v1")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "pixel-to-world-v1",
  });
  const plain = () => observation("success", {
    cell: "7,7",
    distortion: false,
    worldX: 350,
    worldY: 350,
    distanceFromCenter: 4.95,
  });

  it("golden: aynı çevresel hücrenin bozulmalı sonucu değişmişse geçer", () => {
    expect(predicate.evaluate([plain(), observation("success", {
      cell: "7,7",
      distortion: true,
      worldX: 453.94,
      worldY: 453.94,
      distanceFromCenter: 4.95,
    })]).passed).toBe(true);
  });

  it("negatif: yalnız bozulmasız gözlem karşılaştırma değildir", () => {
    expect(predicate.evaluate([plain()]).passed).toBe(false);
  });

  it("negatif: farklı hücrelerin sonuçları karşılaştırılamaz", () => {
    expect(predicate.evaluate([plain(), observation("success", {
      cell: "6,7",
      distortion: true,
      worldX: 380,
      worldY: 440,
      distanceFromCenter: 4.3,
    })]).passed).toBe(false);
  });

  it("negatif: merkez çevresindeki başarısız gözlem çevresel kanıt sayılmaz", () => {
    expect(predicate.evaluate([observation("retry", {
      cell: "4,4",
      distortion: false,
      worldX: 200,
      worldY: 200,
      distanceFromCenter: 0.71,
    }), observation("retry", {
      cell: "4,4",
      distortion: true,
      worldX: 208.49,
      worldY: 208.49,
      distanceFromCenter: 0.71,
    })]).passed).toBe(false);
  });
});

describe("JacobianViz rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "jacobian-singularity-observation-v2")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "jacobian-v2",
  });
  const assessment = (result: EvidenceEvent["result"] = "success") => event("assessed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    contentVersion: "jacobian-v2",
  });

  it("golden: motorun tekil bulduğu commit ve başarılı transfer birlikte geçer", () => {
    expect(predicate.evaluate([
      observation("success", { singular: true, manipulability: 0, joint: 2, degrees: 0 }),
      assessment(),
    ]).passed).toBe(true);
  });

  it("negatif: eski 8 derece kestirmesi gerçek motor tekil değilse geçmez", () => {
    expect(predicate.evaluate([
      observation("retry", { singular: false, manipulability: 0.06, joint: 2, degrees: 7 }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: başarısız işaretlenmiş tekillik olayı geçmez", () => {
    expect(predicate.evaluate([
      observation("retry", { singular: true, manipulability: 0, joint: 2, degrees: 0 }),
      assessment(),
    ]).passed).toBe(false);
  });

  it("negatif: gerçek tekillik gözlense bile transfer değerlendirmesi olmadan geçmez", () => {
    expect(predicate.evaluate([
      observation("success", { singular: true, manipulability: 0, joint: 2, degrees: 0 }),
    ]).passed).toBe(false);
  });
});

describe("ScanPath rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "scan-row-density-comparison-v1")!;
  const scan = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "scan-path-v1",
  });

  it("golden: iki tamamlanmış boustrophedon taramada daha çok satır daha çok nokta üretirse geçer", () => {
    expect(predicate.evaluate([
      scan("success", { rows: 2, pointCount: 24, directionAlternates: true }),
      scan("success", { rows: 3, pointCount: 36, directionAlternates: true }),
    ]).passed).toBe(true);
  });

  it("negatif: tek tamamlanmış tarama karşılaştırma değildir", () => {
    expect(predicate.evaluate([
      scan("success", { rows: 2, pointCount: 24, directionAlternates: true }),
    ]).passed).toBe(false);
  });

  it("negatif: nokta sayısı eksik olan yarım tarama geçmez", () => {
    expect(predicate.evaluate([
      scan("success", { rows: 2, pointCount: 23, directionAlternates: true }),
      scan("success", { rows: 3, pointCount: 35, directionAlternates: true }),
    ]).passed).toBe(false);
  });

  it("negatif: satır yönleri dönüşümlü değilse tamamlanmış sayı bile geçmez", () => {
    expect(predicate.evaluate([
      scan("success", { rows: 2, pointCount: 24, directionAlternates: false }),
      scan("success", { rows: 3, pointCount: 36, directionAlternates: false }),
    ]).passed).toBe(false);
  });
});

describe("BlockEditor rollout: golden + negatif predicate testleri", () => {
  const sequence = EVIDENCE_PREDICATES.find((item) => item.id === "block-sequence-trace-v1")!;
  const condition = EVIDENCE_PREDICATES.find((item) => item.id === "block-condition-branches-v1")!;
  const assessed = (
    predicate: typeof sequence,
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("assessed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "block-editor-v1",
  });

  it("golden: iki blokla iki farklı limit-içi duruş üreten sıra geçer", () => {
    expect(sequence.evaluate([assessed(sequence, "success", {
      moveBlockCount: 2,
      distinctTraceSteps: 2,
      traceSteps: 2,
      withinLimits: true,
    })]).passed).toBe(true);
  });

  it("negatif: iki komut aynı duruşu üretiyorsa sıra görevi geçmez", () => {
    expect(sequence.evaluate([assessed(sequence, "retry", {
      moveBlockCount: 2,
      distinctTraceSteps: 1,
      traceSteps: 2,
      withinLimits: true,
    })]).passed).toBe(false);
  });

  it("negatif: limit dışı iz başarılı işaretlense bile sıra görevi geçmez", () => {
    expect(sequence.evaluate([assessed(sequence, "success", {
      moveBlockCount: 2,
      distinctTraceSteps: 2,
      withinLimits: false,
    })]).passed).toBe(false);
  });

  it("golden: koşulun iki dalı farklı limit-içi sonuç üretirse geçer", () => {
    expect(condition.evaluate([assessed(condition, "success", {
      trueBranch: true,
      falseBranch: true,
      distinctBranchOutcomes: true,
      withinLimits: true,
    })]).passed).toBe(true);
  });

  it("negatif: yalnız bir dal çalıştıysa koşul görevi geçmez", () => {
    expect(condition.evaluate([assessed(condition, "retry", {
      trueBranch: true,
      falseBranch: false,
      distinctBranchOutcomes: false,
      withinLimits: true,
    })]).passed).toBe(false);
  });

  it("negatif: iki dal aynı son pozu üretiyorsa koşul görevi geçmez", () => {
    expect(condition.evaluate([assessed(condition, "retry", {
      trueBranch: true,
      falseBranch: true,
      distinctBranchOutcomes: false,
      withinLimits: true,
    })]).passed).toBe(false);
  });
});

describe("ThresholdViewer rollout: golden + negatif predicate testleri", () => {
  const predicate = EVIDENCE_PREDICATES.find((item) => item.id === "threshold-three-regimes-v1")!;
  const observation = (
    result: EvidenceEvent["result"],
    metrics: Record<string, number | string | boolean>,
  ) => event("observed", result, {
    lessonId: predicate.lessonId,
    skillId: predicate.skillId,
    metrics,
    contentVersion: "threshold-viewer-v1",
  });
  const low = { regime: "too-low", threshold: 30, detectedCount: 96, objectCellCount: 21, falsePositiveCount: 75, falseNegativeCount: 0 };
  const separating = { regime: "separating", threshold: 128, detectedCount: 21, objectCellCount: 21, falsePositiveCount: 0, falseNegativeCount: 0 };
  const high = { regime: "too-high", threshold: 230, detectedCount: 0, objectCellCount: 21, falsePositiveCount: 0, falseNegativeCount: 21 };

  it("golden: düşük, ayıran ve yüksek eşik rejimlerinin üçü de doğrulanınca geçer", () => {
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", separating),
      observation("success", high),
    ]).passed).toBe(true);
  });

  it("negatif: üç rejimden biri eksikse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", separating),
    ]).passed).toBe(false);
  });

  it("negatif: düşük diye etiketlenen ölçüm false positive üretmediyse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", { ...low, falsePositiveCount: 0 }),
      observation("success", separating),
      observation("success", high),
    ]).passed).toBe(false);
  });

  it("negatif: yüksek rejim başarısız denemeyse geçmez", () => {
    expect(predicate.evaluate([
      observation("success", low),
      observation("success", separating),
      observation("retry", high),
    ]).passed).toBe(false);
  });
});
