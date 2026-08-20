import { describe, expect, it } from "vitest";
import { evaluateCodeLab } from "./codeLab";

describe("code laboratory automatic tests", () => {
  it("requires exact normalized stdout for a matrix task", () => {
    expect(evaluateCodeLab({ expectedOutput: "0.0 1.0" }, { stdout: "0.0 1.0\n", error: null, jointTrace: [] }).passed).toBe(true);
    expect(evaluateCodeLab({ expectedOutput: "0.0 1.0" }, { stdout: "1.0 0.0\n", error: null, jointTrace: [] }).passed).toBe(false);
  });

  it("checks the final robot pose in degrees within tolerance", () => {
    const trace = [[Math.PI / 3, -Math.PI / 9]];
    expect(evaluateCodeLab({ expectedFinalDegrees: [60, -20], toleranceDegrees: 0.1 }, { stdout: "", error: null, jointTrace: trace }).passed).toBe(true);
    expect(evaluateCodeLab({ expectedFinalDegrees: [60, -10], toleranceDegrees: 0.1 }, { stdout: "", error: null, jointTrace: trace }).passed).toBe(false);
  });

  it("never passes when the worker reports an error", () => {
    expect(evaluateCodeLab({ expectedOutput: "ok" }, { stdout: "ok", error: "boom", jointTrace: [] }).passed).toBe(false);
  });

  it("İkinci derinlik turu (docs/15 'Kod incelemesi'): maxTraceSteps doğru poza ulaşsa bile sadeleştirilmemiş çözümü reddeder", () => {
    const expectation = { expectedFinalDegrees: [85, -55], toleranceDegrees: 1, maxTraceSteps: 1 };
    const tekHareket = { stdout: "", error: null, jointTrace: [[85 * Math.PI / 180, -55 * Math.PI / 180]] };
    const ucHareket = {
      stdout: "",
      error: null,
      jointTrace: [
        [15 * Math.PI / 180, -5 * Math.PI / 180],
        [50 * Math.PI / 180, -25 * Math.PI / 180],
        [85 * Math.PI / 180, -55 * Math.PI / 180],
      ],
    };
    expect(evaluateCodeLab(expectation, tekHareket).passed).toBe(true);
    // Aynı doğru sonuca üç hareketle ulaşan (sadeleştirilmemiş) çözüm poseMatches=true olsa da geçmemeli.
    expect(evaluateCodeLab(expectation, ucHareket).passed).toBe(false);
  });

  it("maxTraceSteps verilmediğinde davranış değişmez (geriye uyumlu, Hat D dersleri etkilenmez)", () => {
    const trace = [[Math.PI / 3, -Math.PI / 9]];
    expect(evaluateCodeLab({ expectedFinalDegrees: [60, -20], toleranceDegrees: 0.1 }, { stdout: "", error: null, jointTrace: trace }).passed).toBe(true);
  });
});
