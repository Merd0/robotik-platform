import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  analyticalTwoDofDebug,
  computeJacobian,
  forwardKinematics,
  inverseKinematicsAnalytical2Dof,
  inverseKinematicsNumerical,
  isNearSingularity,
} from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";

interface FixtureCase {
  jointAnglesRad: [number, number];
  joint1Position: { x: number; y: number; z: number };
  endEffector: { x: number; y: number; z: number };
  jacobian: { matrix: [[number, number], [number, number]]; manipulability: number };
}

interface Fixture {
  robot: string;
  tolerance: number;
  cases: FixtureCase[];
}

const FIXTURE_PATH = path.join(
  process.cwd(),
  "reference-python",
  "fixtures",
  "generic-2dof-fk.json",
);

describe("forwardKinematics — birim testi (elle çözülebilir durum)", () => {
  it("her iki eklem 0 iken uç nokta a1+a2 kadar x ekseninde olur", () => {
    const result = forwardKinematics(genericTwoDofRobot, [0, 0]);
    expect(result.endEffector.x).toBeCloseTo(1.8, 6);
    expect(result.endEffector.y).toBeCloseTo(0, 6);
  });

  it("90 derece + 0 derecede uç nokta y ekseninde olur", () => {
    const result = forwardKinematics(genericTwoDofRobot, [Math.PI / 2, 0]);
    expect(result.endEffector.x).toBeCloseTo(0, 6);
    expect(result.endEffector.y).toBeCloseTo(1.8, 6);
  });
});

describe("forwardKinematics — Python fixture'larına karşı çapraz doğrulama", () => {
  const fixture: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  it("fixture dosyası generic-2dof robotu için ve dolu", () => {
    expect(fixture.robot).toBe("generic-2dof");
    expect(fixture.cases.length).toBeGreaterThan(0);
  });

  fixture.cases.forEach((testCase, index) => {
    it(`durum ${index}: açılar [${testCase.jointAnglesRad}]`, () => {
      const result = forwardKinematics(genericTwoDofRobot, testCase.jointAnglesRad);

      expect(result.jointPositions[1].x).toBeCloseTo(testCase.joint1Position.x, 6);
      expect(result.jointPositions[1].y).toBeCloseTo(testCase.joint1Position.y, 6);

      expect(result.endEffector.x).toBeCloseTo(testCase.endEffector.x, 6);
      expect(result.endEffector.y).toBeCloseTo(testCase.endEffector.y, 6);
    });
  });
});

describe("computeJacobian — Python'un bağımsız analitik formülüne karşı çapraz doğrulama", () => {
  const fixture: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  fixture.cases.forEach((testCase, index) => {
    it(`durum ${index}: Jacobian ve manipülabilite eşleşiyor`, () => {
      const { columns, manipulability } = computeJacobian(genericTwoDofRobot, testCase.jointAnglesRad);

      // columns[i] eklem i'nin (x,y,z) hız katkısı; Python'daki J matrisinin
      // sütunları da aynı sırada (eklem 1, eklem 2).
      expect(columns[0].x).toBeCloseTo(testCase.jacobian.matrix[0][0], 6);
      expect(columns[0].y).toBeCloseTo(testCase.jacobian.matrix[1][0], 6);
      expect(columns[1].x).toBeCloseTo(testCase.jacobian.matrix[0][1], 6);
      expect(columns[1].y).toBeCloseTo(testCase.jacobian.matrix[1][1], 6);

      expect(manipulability).toBeCloseTo(testCase.jacobian.manipulability, 6);
    });
  });

  it("theta2 = 0 (tam açık kol) tekillik olarak tespit edilir", () => {
    const { manipulability } = computeJacobian(genericTwoDofRobot, [Math.PI / 3, 0]);
    expect(isNearSingularity(manipulability)).toBe(true);
  });

  it("theta2 = 180° (tam katlı kol) tekillik olarak tespit edilir", () => {
    const { manipulability } = computeJacobian(genericTwoDofRobot, [Math.PI / 3, Math.PI]);
    expect(isNearSingularity(manipulability)).toBe(true);
  });

  it("theta2 = 90° tekillik değildir", () => {
    const { manipulability } = computeJacobian(genericTwoDofRobot, [Math.PI / 4, Math.PI / 2]);
    expect(isNearSingularity(manipulability)).toBe(false);
  });
});

describe("inverseKinematicsAnalytical2Dof", () => {
  it("erişilebilir bir hedefte FK(IK(hedef)) ≈ hedef (dirsek yukarı)", () => {
    const target = { x: 1.2, y: 0.6 };
    const angles = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, target, "up");
    expect(angles).not.toBeNull();
    const { endEffector } = forwardKinematics(genericTwoDofRobot, angles!);
    expect(endEffector.x).toBeCloseTo(target.x, 6);
    expect(endEffector.y).toBeCloseTo(target.y, 6);
  });

  it("aynı hedefte dirsek yukarı ve dirsek aşağı farklı açı verir ama aynı noktaya ulaşır", () => {
    const target = { x: 1.0, y: 0.5 };
    const up = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, target, "up")!;
    const down = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, target, "down")!;
    expect(up).not.toEqual(down);

    const fkUp = forwardKinematics(genericTwoDofRobot, up).endEffector;
    const fkDown = forwardKinematics(genericTwoDofRobot, down).endEffector;
    expect(fkUp.x).toBeCloseTo(target.x, 6);
    expect(fkDown.x).toBeCloseTo(target.x, 6);
  });

  it("erişim alanı dışındaki hedef için null döner", () => {
    const angles = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, { x: 10, y: 10 }, "up");
    expect(angles).toBeNull();
  });
});

describe("analyticalTwoDofDebug", () => {
  it("inverseKinematicsAnalytical2Dof'un kullandığı aynı ara değerleri döner (erişilebilir hedef)", () => {
    const target = { x: 1.2, y: 0.6 };
    const debug = analyticalTwoDofDebug(genericTwoDofRobot, target);
    expect(debug.a1).toBeCloseTo(1.0, 6);
    expect(debug.a2).toBeCloseTo(0.8, 6);
    expect(debug.r2).toBeCloseTo(1.2 * 1.2 + 0.6 * 0.6, 6);
    expect(debug.reachable).toBe(true);
    expect(debug.cosTheta2).toBeGreaterThanOrEqual(-1);
    expect(debug.cosTheta2).toBeLessThanOrEqual(1);
  });

  it("erişim dışı bir hedefte reachable false ve cosTheta2 [-1, 1] dışında", () => {
    const debug = analyticalTwoDofDebug(genericTwoDofRobot, { x: 10, y: 10 });
    expect(debug.reachable).toBe(false);
    expect(debug.cosTheta2).toBeGreaterThan(1);
  });

  it("2 eklemden farklı bir robotta fırlatır", () => {
    const sixDofStub = { ...genericTwoDofRobot, joints: [...genericTwoDofRobot.joints, genericTwoDofRobot.joints[0]] };
    expect(() => analyticalTwoDofDebug(sixDofStub, { x: 1, y: 1 })).toThrow();
  });
});

describe("inverseKinematicsNumerical", () => {
  it("erişilebilir bir hedefte yakınsar ve FK(IK(hedef)) ≈ hedef", () => {
    const target = { x: 0.8, y: -0.9, z: 0 };
    const result = inverseKinematicsNumerical(genericTwoDofRobot, target);
    expect(result.converged).toBe(true);
    expect(result.angles).not.toBeNull();

    const { endEffector } = forwardKinematics(genericTwoDofRobot, result.angles!);
    expect(endEffector.x).toBeCloseTo(target.x, 3);
    expect(endEffector.y).toBeCloseTo(target.y, 3);
  });

  it("erişim alanı dışındaki hedefte yakınsamaz", () => {
    const result = inverseKinematicsNumerical(genericTwoDofRobot, { x: 5, y: 5, z: 0 });
    expect(result.converged).toBe(false);
    expect(result.angles).toBeNull();
  });

  it("başlangıç tahmini ve bütün DLS iterasyonlarını mekanik eklem limitlerine izdüşürür", () => {
    const limitedRobot = {
      id: "limited-3dof",
      displayName: "Limitli üç eksen",
      joints: Array.from({ length: 3 }, () => ({
        type: "revolute" as const,
        dhParams: { a: 0.7, alpha: 0, d: 0, theta: 0 },
        limits: { min: -0.25, max: 0.25 },
        maxVelocity: 1,
      })),
    };
    const result = inverseKinematicsNumerical(
      limitedRobot,
      { x: 1.4, y: 1.4, z: 0 },
      { initialGuess: [2, -2, 2], maxIterations: 20 },
    );

    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace.every((step) => step.angles.every((angle) => angle >= -0.25 && angle <= 0.25))).toBe(true);
    if (result.angles) {
      expect(result.angles.every((angle) => angle >= -0.25 && angle <= 0.25)).toBe(true);
    }
  });

  it("−180° eşdeğerini yalnız negatif tarafta çalışan mekanik limitte korur", () => {
    const negativeHalfTurnRobot = {
      id: "negative-half-turn",
      displayName: "Negatif yarım tur",
      joints: [{
        type: "revolute" as const,
        dhParams: { a: 1, alpha: 0, d: 0, theta: 0 },
        limits: { min: -Math.PI, max: -2.8 },
        maxVelocity: 1,
      }],
    };
    const result = inverseKinematicsNumerical(
      negativeHalfTurnRobot,
      { x: -1, y: 0, z: 0 },
      { initialGuess: [-Math.PI], maxIterations: 1 },
    );

    expect(result.trace[0].angles[0]).toBeCloseTo(-Math.PI, 10);
  });
});
