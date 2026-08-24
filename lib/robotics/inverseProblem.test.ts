import { describe, expect, it } from "vitest";
import { inverseKinematicsAnalytical2Dof } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import {
  INVERSE_PROBLEM_CHALLENGES,
  evaluateInverseAttempt,
  registerInverseSolution,
} from "./inverseProblem";

describe("ters problem modu", () => {
  const challenge = INVERSE_PROBLEM_CHALLENGES[0];

  it("hedefi gizli seed açılarının gerçek ileri kinematik sonucundan türetir", () => {
    const attempt = evaluateInverseAttempt(challenge, challenge.sourceAnglesDegrees);

    expect(attempt.reached).toBe(true);
    expect(attempt.errorMeters).toBeLessThan(1e-9);
    expect(attempt.tcp).toEqual(challenge.target);
  });

  it("aynı hedef için iki analitik dirsek dalını da geçerli çözüm kabul eder", () => {
    const up = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, challenge.target, "up")!;
    const down = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, challenge.target, "down")!;
    const radiansToDegrees = (angles: number[]) => angles.map((angle) => angle * 180 / Math.PI) as [number, number];
    const upAttempt = evaluateInverseAttempt(challenge, radiansToDegrees(up));
    const downAttempt = evaluateInverseAttempt(challenge, radiansToDegrees(down));

    expect(upAttempt).toMatchObject({ reached: true, branch: "up" });
    expect(downAttempt).toMatchObject({ reached: true, branch: "down" });
  });

  it("hedefe uzak bir açı çiftini çözüm diye kaydetmez", () => {
    const attempt = evaluateInverseAttempt(challenge, [0, 0]);
    const registration = registerInverseSolution([], attempt);

    expect(attempt.reached).toBe(false);
    expect(registration).toMatchObject({ status: "miss", solutions: [] });
  });

  it("ilk geçerli dalı kaydeder, aynı dalı ikinci çözüm saymaz", () => {
    const first = evaluateInverseAttempt(challenge, challenge.sourceAnglesDegrees);
    const firstRegistration = registerInverseSolution([], first);
    const sameBranch = evaluateInverseAttempt(challenge, [challenge.sourceAnglesDegrees[0] + 0.5, challenge.sourceAnglesDegrees[1]]);
    const duplicate = registerInverseSolution(firstRegistration.solutions, sameBranch);

    expect(firstRegistration.status).toBe("first-saved");
    expect(duplicate).toMatchObject({ status: "same-branch", solutions: firstRegistration.solutions });
  });

  it("karşı dirsek dalı hedefe ulaştığında görevi tamamlar", () => {
    const first = evaluateInverseAttempt(challenge, challenge.sourceAnglesDegrees);
    const down = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, challenge.target, "down")!;
    const second = evaluateInverseAttempt(challenge, down.map((angle) => angle * 180 / Math.PI) as [number, number]);
    const registration = registerInverseSolution([first], second);

    expect(registration.status).toBe("complete");
    expect(registration.solutions.map((solution) => solution.branch).sort()).toEqual(["down", "up"]);
  });
});
