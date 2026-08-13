import { describe, expect, it } from "vitest";
import { createCustomRobotSpec, createDefaultCustomRobotDefinition } from "./customRobot";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { resolveIkSolver, selectClosestIkSolution, solveIkTarget, solveIkTargetCandidates } from "./ikSolver";

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

  it("mekanik limitin iki ucunu açı sarmasıyla sahte biçimde yakın saymaz", () => {
    const degrees = (value: number) => value * Math.PI / 180;
    const current = [degrees(-158), 0];
    const acrossMechanicalLimit = {
      angles: [degrees(158), 0], converged: true, iterations: 1, residual: 0, solver: "analytical" as const,
    };
    const reachableWithoutCrossingLimit = {
      angles: [degrees(-100), 0], converged: true, iterations: 1, residual: 0, solver: "analytical" as const,
    };

    expect(selectClosestIkSolution(current, [acrossMechanicalLimit, reachableWithoutCrossingLimit]))
      .toBe(reachableWithoutCrossingLimit);
  });

  it("ekran görüntüsündeki limit köşesinden sağdaki erişilebilir hedefi çoklu başlangıçla bulur", () => {
    const result = createCustomRobotSpec(createDefaultCustomRobotDefinition(3));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const degrees = (value: number) => value * Math.PI / 180;
    const cornerPose = [160, 78, -34.4].map(degrees);
    const target = { x: 0.8, y: 0.5 };

    expect(solveIkTarget(result.robot, target, "dls", "up", cornerPose).converged).toBe(false);
    const candidates = solveIkTargetCandidates(result.robot, target, cornerPose);

    expect(candidates.some((candidate) => candidate.converged && candidate.angles)).toBe(true);
    expect(Math.min(...candidates.map((candidate) => candidate.residual))).toBeLessThan(1e-3);
  });

  it("negatif limit köşesinden karşı yarı düzleme geçebilen aday üretir", () => {
    const result = createCustomRobotSpec(createDefaultCustomRobotDefinition(3));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const degrees = (value: number) => value * Math.PI / 180;
    const cornerPose = [-158.8, -109.2, -31.8].map(degrees);
    const target = { x: 0.6, y: 1.2 };

    expect(solveIkTarget(result.robot, target, "dls", "up", cornerPose).converged).toBe(false);
    expect(solveIkTargetCandidates(result.robot, target, cornerPose).some((candidate) => candidate.converged)).toBe(true);
  });

  it("ilk sayısal çözüm fizik ön kontrolünden geçmezse alternatif duruşları da arar", () => {
    const result = createCustomRobotSpec(createDefaultCustomRobotDefinition(3));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const current = [0.1, 0.2, 0.3];
    const target = { x: 1.2, y: 0.7 };
    expect(solveIkTarget(result.robot, target, "dls", "up", current).converged).toBe(true);

    const candidates = solveIkTargetCandidates(result.robot, target, current, () => false);

    expect(candidates.length).toBeGreaterThan(1);
  });
});
