import { afterEach, describe, expect, it, vi } from "vitest";

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

    evidence.appendEvidence({ ...base, skillId: "planner-comparison", stage: "assessed" });
    const events = evidence.getEvidenceEvents();
    expect(evidence.summarizeEvidence(events, base.lessonId, base.contentVersion).passed).toBe(true);
    expect(events.at(-1)).toMatchObject({
      kind: "achievement",
      stage: "passed",
      verification: "registry-predicate",
      predicateId: "planner-three-way-comparison-v1",
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
