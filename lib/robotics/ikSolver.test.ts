import { describe, expect, it } from "vitest";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { resolveIkSolver, selectClosestIkSolution, solveIkTarget } from "./ikSolver";

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

  it("canlı sürüşte mevcut poza en yakın analitik dalı seçip dirsek sıçramasını önler", () => {
    const currentAngles = [0.25, 0.9];
    const up = solveIkTarget(genericTwoDofRobot, { x: 0.8, y: 0.9 }, "analytical", "up", currentAngles);
    const down = solveIkTarget(genericTwoDofRobot, { x: 0.8, y: 0.9 }, "analytical", "down", currentAngles);

    const selected = selectClosestIkSolution(currentAngles, [up, down]);

    expect(selected).not.toBeNull();
    expect(selected?.angles).not.toBeNull();
    expect(selected?.angles?.[1]).toBeGreaterThan(0);
  });
});
