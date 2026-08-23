import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { forwardKinematics, inverseKinematicsAnalytical2Dof, type RobotSpec } from "./kinematics";
import { analyzePlanarReachability, supportsPlanarReachability } from "./reachability";
import { genericPrismaticRobot, genericTwoDofRobot } from "./robots";

const withLimits = (first: { min: number; max: number }, second: { min: number; max: number }): RobotSpec => ({
  ...genericTwoDofRobot,
  id: "limited-2dof",
  joints: genericTwoDofRobot.joints.map((joint, index) => ({
    ...joint,
    limits: index === 0 ? first : second,
  })),
});

interface FixtureCase {
  jointAnglesRad: [number, number];
  endEffector: { x: number; y: number; z: number };
  jacobian: { manipulability: number };
}

const fixture = JSON.parse(fs.readFileSync(path.join(
  process.cwd(),
  "reference-python",
  "fixtures",
  "generic-2dof-fk.json",
), "utf8")) as { tolerance: number; cases: FixtureCase[] };

describe("analyzePlanarReachability", () => {
  it("Python fixture'ındaki hedefleri ve manipülabiliteyi aynı sınıfa taşır", () => {
    const singularFixture = fixture.cases[0];
    const singular = analyzePlanarReachability(genericTwoDofRobot, singularFixture.endEffector, "up");
    expect(singular.status).toBe("singularity-risk");
    expect(singular.manipulability).toBeCloseTo(singularFixture.jacobian.manipulability, 6);

    const regularFixture = fixture.cases[2];
    const regular = analyzePlanarReachability(genericTwoDofRobot, regularFixture.endEffector, "up");
    expect(regular.status).toBe("reachable");
    expect(regular.angles?.[0]).toBeCloseTo(regularFixture.jointAnglesRad[0], 6);
    expect(regular.angles?.[1]).toBeCloseTo(regularFixture.jointAnglesRad[1], 6);
    expect(regular.manipulability).toBeCloseTo(regularFixture.jacobian.manipulability, 6);
  });

  it("golden: erişilebilir hedefi mevcut analitik IK ile aynı açılarda çözer", () => {
    const target = { x: 1, y: 0.5 };
    const expectedAngles = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, target, "up");
    const analysis = analyzePlanarReachability(genericTwoDofRobot, target, "up");

    expect(analysis.status).toBe("reachable");
    expect(analysis.reason).toBe("solution");
    expect(analysis.angles).toEqual(expectedAngles);
    expect(analysis.manipulability).toBeGreaterThan(0.1);
    expect(analysis.minimumLimitMarginRatio).toBeGreaterThan(0.1);
  });

  it("mekanik aralığın son yüzde 10'undaki gerçek IK çözümünü near-limit sınıfına alır", () => {
    const robot = withLimits({ min: -1, max: 1 }, { min: -2, max: 2 });
    const expectedAngles = [0.95, 0.5];
    const target = forwardKinematics(robot, expectedAngles).endEffector;
    const analysis = analyzePlanarReachability(robot, target, "up");

    expect(analysis.status).toBe("near-limit");
    expect(analysis.reason).toBe("joint-near-limit");
    expect(analysis.nearestLimit).toMatchObject({ jointIndex: 0, min: -1, max: 1 });
    expect(analysis.nearestLimit?.value).toBeCloseTo(0.95, 9);
    expect(analysis.minimumLimitMarginRatio).toBeCloseTo(0.025, 9);
  });

  it("uzatılmış kolu gerçek Jacobian manipülabilitesiyle singularity-risk olarak işaretler", () => {
    const analysis = analyzePlanarReachability(genericTwoDofRobot, { x: 1.8, y: 0 }, "up");

    expect(analysis.status).toBe("singularity-risk");
    expect(analysis.reason).toBe("low-manipulability");
    expect(analysis.angles).toEqual([0, 0]);
    expect(analysis.manipulability).toBeCloseTo(0, 12);
  });

  it("geometrik erişim dışını J2'nin gerçek açı üretemeyen kosinüs koşuluyla açıklar", () => {
    const analysis = analyzePlanarReachability(genericTwoDofRobot, { x: 1.81, y: 0 }, "up");

    expect(analysis.status).toBe("unreachable");
    expect(analysis.reason).toBe("no-real-joint-2-angle");
    expect(analysis.angles).toBeNull();
    expect(analysis.requiredJoint2Cosine).toBeGreaterThan(1);
    expect(analysis.maximumReach).toBeCloseTo(1.8, 12);
  });

  it("geometrik çözüm var ama J2 limiti yetmiyorsa gereken açıyı ve gerçek limiti döndürür", () => {
    const robot = withLimits({ min: -Math.PI, max: Math.PI }, { min: -0.6, max: 0.6 });
    const target = forwardKinematics(genericTwoDofRobot, [0.2, 1]).endEffector;
    const analysis = analyzePlanarReachability(robot, target, "up");

    expect(analysis.status).toBe("unreachable");
    expect(analysis.reason).toBe("joint-limit");
    expect(analysis.blockingJoint).toMatchObject({ jointIndex: 1, min: -0.6, max: 0.6 });
    expect(analysis.blockingJoint?.required).toBeCloseTo(1, 9);
  });

  it("prizmatik veya düzlemsel olmayan zinciri sessizce 2R haritası gibi göstermez", () => {
    expect(supportsPlanarReachability(genericTwoDofRobot)).toBe(true);
    expect(supportsPlanarReachability(genericPrismaticRobot)).toBe(false);
    expect(() => analyzePlanarReachability(genericPrismaticRobot, { x: 0.5, y: 0 }, "up"))
      .toThrow(/iki döner eklemli düzlemsel/);
  });
});
