import { describe, expect, it } from "vitest";
import type { PlanResult } from "./base";
import { validatePlanResult } from "./validatePlanResult";

const base: Omit<PlanResult, "path" | "success"> = {
  algorithm: "test",
  elapsedMs: 1,
  nodesExpanded: 2,
};

describe("validatePlanResult", () => {
  it("başlangıç, hedef ve bütün segmentleri doğrular", () => {
    const result: PlanResult = {
      ...base,
      success: true,
      path: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ],
    };
    expect(validatePlanResult(result, result.path[0], result.path[2], [], { planar: true })).toEqual({ valid: true });
  });

  it("özellikle hedefe giden son segmentteki çarpışmayı reddeder", () => {
    const result: PlanResult = {
      ...base,
      success: true,
      path: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ],
    };
    const validation = validatePlanResult(
      result,
      result.path[0],
      result.path[2],
      [{ kind: "sphere", center: { x: 0.5, y: 1, z: 0 }, size: [0.1] }],
      { planar: true, resolution: 0.01 },
    );
    expect(validation.valid).toBe(false);
    if (!validation.valid) expect(validation.reason).toContain("2. segmenti");
  });

  it("düzlemsel sonuçta görünmez z kaçışını reddeder", () => {
    const result: PlanResult = {
      ...base,
      success: true,
      path: [
        { x: 0, y: 0, z: 0 },
        { x: 0.5, y: 0.5, z: 1 },
        { x: 1, y: 1, z: 0 },
      ],
    };
    const validation = validatePlanResult(result, result.path[0], result.path[2], [], { planar: true });
    expect(validation.valid).toBe(false);
  });
});
