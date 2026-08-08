import { describe, expect, it } from "vitest";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { resolveIkSolver, solveIkTarget } from "./ikSolver";

describe("IkTarget çözücü seçimi", () => {
  it("auto modunda 2-DOF için analitik çözücüyü korur", () => {
    expect(resolveIkSolver(genericTwoDofRobot, "auto")).toBe("analytical");
  });

  it("DLS istendiğinde 2-DOF robotta da gerçekten sayısal çözücü çalıştırır", () => {
    const result = solveIkTarget(genericTwoDofRobot, { x: 0.8, y: -0.9 }, "dls", "up", [0.1, 0.1]);
    expect(result.solver).toBe("dls");
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThan(1);
    expect(result.residual).toBeLessThan(1e-3);
  });
});
