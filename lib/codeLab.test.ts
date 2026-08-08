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
});
