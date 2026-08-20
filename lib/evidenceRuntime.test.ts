import { afterEach, describe, expect, it, vi } from "vitest";
import { createFourLensTrace } from "./robotics/fourLensTrace";
import { computeChallengeRevision, type ChallengeDefinition } from "./quiz";
import { FOUR_LENS_FK_TRANSFER_CHALLENGE, PLANNER_COMPARISON_TRANSFER_CHALLENGE } from "./evidence";

/** Bir `TransferChallenge` sabitinden hardened predicate'in beklediği doğru metrics'i üretir (bkz. evidence.test.ts). */
const transferChallengeMetrics = (challenge: ChallengeDefinition) => ({
  challengeRevision: computeChallengeRevision(challenge),
  selectedOriginalIndex: challenge.correct,
  correctOriginalIndex: challenge.correct,
});

function fakeWindow(initial: Record<string, string> = {}, failWrites = false) {
  const values = new Map(Object.entries(initial));
  const removed: string[] = [];
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failWrites) throw new DOMException("quota", "QuotaExceededError");
      values.set(key, value);
    },
    removeItem: (key: string) => {
      removed.push(key);
      values.delete(key);
    },
  };
  vi.stubGlobal("window", { localStorage });
  return { values, removed };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Evidence v2 çalışma zamanı", () => {
  it("yalnız predicate koşulları tamamlanınca başarı türetir", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    const base = {
      lessonId: "c-universite-algoritma-karsilastirma-deneyi",
      contentVersion: "sha256:current",
      result: "success" as const,
    };
    for (const algorithm of ["astar", "rrt", "rrt_star"]) {
      evidence.appendEvidence({ ...base, skillId: "planner-comparison", stage: "observed", metrics: { algorithm } });
    }
    expect(evidence.summarizeEvidence(evidence.getEvidenceEvents(), base.lessonId, base.contentVersion).passed).toBe(false);

    evidence.appendEvidence({ ...base, skillId: "planner-comparison", stage: "assessed", metrics: transferChallengeMetrics(PLANNER_COMPARISON_TRANSFER_CHALLENGE) });
    const events = evidence.getEvidenceEvents();
    expect(evidence.summarizeEvidence(events, base.lessonId, base.contentVersion).passed).toBe(true);
    expect(events.at(-1)).toMatchObject({
      kind: "achievement",
      stage: "passed",
      verification: "registry-predicate",
      predicateId: "planner-three-way-comparison-v2",
    });
  });

  it("çalışma zamanı çağrısıyla doğrudan passed yazılmasını reddeder", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    const result = evidence.appendEvidence({
      lessonId: "ders",
      skillId: "beceri",
      contentVersion: "v2",
      stage: "passed",
      result: "success",
    } as unknown as import("./evidence").EvidenceInput);
    expect(result).toBeNull();
    expect(evidence.getEvidenceEvents()).toHaveLength(0);
  });

  it("localStorage yazımı engellenirse olayı geçici bellekte tutar", async () => {
    fakeWindow({}, true);
    const evidence = await import("./evidence");
    evidence.appendEvidence({ lessonId: "ders", skillId: "okuma", contentVersion: "v2", stage: "read", result: "success" });
    expect(evidence.getEvidenceEvents()).toHaveLength(1);
    expect(evidence.getEvidencePersistence()).toBe("memory");
  });

  it("legacy anahtarlarını ancak v2 yazımı başarıyla tamamlanınca siler", async () => {
    const oldKey = "robotik-platform:evidence:v1";
    const progressKey = "robotik-platform:tamamlanan-dersler";
    const fake = fakeWindow({
      [oldKey]: JSON.stringify([{ id: "1", lessonId: "ders-1", skillId: "x", stage: "passed", result: "success" }]),
      [progressKey]: JSON.stringify(["ders-2"]),
    });
    const evidence = await import("./evidence");
    expect(evidence.getEvidenceEvents()).toHaveLength(2);
    expect(fake.values.has(evidence.EVIDENCE_STORAGE_KEY)).toBe(true);
    expect(fake.removed).toEqual(expect.arrayContaining([oldKey, progressKey]));
  });
});

describe("Evidence v2 saklama politikası (kör 1000-olay FIFO yerine semantik kota)", () => {
  it("binlerce hareket olayından sonra bile eski read ve passed kaydı korunur", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    const contentVersion = "sha256:current";

    evidence.appendEvidence({ lessonId: "b-ortaokul-eklemleri-oynat", skillId: "legacy-manual-completion", contentVersion, stage: "read", result: "success" });

    // Gerçek bir predicate'i tetikleyip gerçek bir "passed" milestone üret.
    const fourLens = { lessonId: "b-lise-ileri-kinematik", skillId: "four-lens-forward-kinematics", contentVersion };
    const trace = createFourLensTrace();
    for (const [sampleIndex, sample] of trace.entries()) {
      const endX = Number(sample.end.x.toFixed(3));
      const endY = Number(sample.end.y.toFixed(3));
      evidence.appendEvidence({
        ...fourLens,
        stage: "observed",
        result: "neutral",
        metrics: {
          sampleIndex,
          codeLine: sample.line,
          q1: sample.jointDegrees[0],
          q2: sample.jointDegrees[1],
          endX,
          endY,
          matrixX: endX,
          matrixY: endY,
        },
      });
    }
    evidence.appendEvidence({
      ...fourLens,
      stage: "assessed",
      result: "success",
      metrics: {
        prediction: "decrease",
        actual: "decrease",
        directionMatches: true,
        finalSample: 3,
        previousX: Number(trace[2].end.x.toFixed(3)),
        finalX: Number(trace[3].end.x.toFixed(3)),
      },
    });
    evidence.appendEvidence({
      ...fourLens,
      stage: "assessed",
      result: "success",
      metrics: transferChallengeMetrics(FOUR_LENS_FK_TRANSFER_CHALLENGE),
    });
    expect(evidence.summarizeEvidence(evidence.getEvidenceEvents(), fourLens.lessonId, contentVersion).passed).toBe(true);

    // Ağır sürükleme benzetimi: binlerce farklı gözlem olayı (her biri farklı seed/elapsedMs,
    // yani dedupe ile tek kayda inmez — gerçek bir aşınma senaryosu).
    for (let i = 0; i < 3000; i++) {
      evidence.appendEvidence({
        lessonId: "c-universite-algoritma-karsilastirma-deneyi",
        skillId: "planner-comparison",
        contentVersion,
        stage: "observed",
        result: i % 11 === 0 ? "success" : "retry",
        metrics: { algorithm: "astar", seed: i, elapsedMs: i * 1.7 },
      });
    }

    const events = evidence.getEvidenceEvents();
    expect(events.some((event) => event.lessonId === "b-ortaokul-eklemleri-oynat" && event.stage === "read")).toBe(true);
    expect(evidence.summarizeEvidence(events, fourLens.lessonId, contentVersion).passed).toBe(true);
    // Kör FIFO eskiden en fazla 1000 tutuyordu ve milestone ayrımı yapmıyordu;
    // yeni politika toplamı bundan belirgin biçimde daha düşük tutar.
    expect(events.length).toBeLessThan(1000);
  });

  it("aynı (ders, beceri, aşama, sonuç, metrik) tekrarını tek kayda indirger", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    for (let i = 0; i < 50; i++) {
      evidence.appendEvidence({
        lessonId: "b-ortaokul-eklemleri-oynat",
        skillId: "forward-kinematics",
        contentVersion: "v1",
        stage: "observed",
        result: "success",
        metrics: { joint: 1 },
      });
    }
    const observed = evidence.getEvidenceEvents().filter(
      (event) => event.lessonId === "b-ortaokul-eklemleri-oynat" && event.stage === "observed",
    );
    expect(observed).toHaveLength(1);
  });

  it("farklı içerikli gözlemler ders/beceri başına en yeni kayıtlarla sınırlanır", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    for (let i = 0; i < 200; i++) {
      evidence.appendEvidence({
        lessonId: "ders-x",
        skillId: "beceri-x",
        contentVersion: "v1",
        stage: "observed",
        result: "success",
        metrics: { i },
      });
    }
    const observed = evidence.getEvidenceEvents().filter((event) => event.lessonId === "ders-x");
    expect(observed.length).toBeGreaterThan(0);
    expect(observed.length).toBeLessThan(200);
    expect(observed.at(-1)?.metrics?.i).toBe(199);
  });

  it("performans: binlerce gözlem olayı eklemek hızlı kalır", async () => {
    fakeWindow();
    const evidence = await import("./evidence");
    const startedAt = Date.now();
    for (let i = 0; i < 3000; i++) {
      evidence.appendEvidence({
        lessonId: "c-universite-algoritma-karsilastirma-deneyi",
        skillId: "planner-comparison",
        contentVersion: "sha256:perf",
        stage: "observed",
        result: "retry",
        metrics: { algorithm: ["astar", "rrt", "rrt_star"][i % 3], seed: i, elapsedMs: i },
      });
    }
    const elapsedMs = Date.now() - startedAt;
    expect(evidence.getEvidenceEvents().length).toBeLessThan(1000);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
