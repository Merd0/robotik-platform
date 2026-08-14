import { describe, expect, it } from "vitest";
import { forwardKinematics } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { genericSixDofRobot } from "./robots/genericSixDof";
import {
  degreesToRadians,
  poseOf,
  radiansToDegrees,
  solveCartesianTarget,
  validateJointAnglesDeg,
} from "./pythonBridge";

describe("degreesToRadians / radiansToDegrees", () => {
  it("dönüşü doğru yapar", () => {
    expect(degreesToRadians([180, -90, 0])).toEqual([Math.PI, -Math.PI / 2, 0]);
    expect(radiansToDegrees([Math.PI, -Math.PI / 2, 0])).toEqual([180, -90, 0]);
  });
});

describe("validateJointAnglesDeg", () => {
  it("doğru sayıda ve limit içindeki açılar için radyana çevirip kabul eder", () => {
    const result = validateJointAnglesDeg(genericSixDofRobot, [0, -30, 45, 0, 60, 0]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[1]).toBeCloseTo((-30 * Math.PI) / 180, 6);
      expect(result.value[4]).toBeCloseTo((60 * Math.PI) / 180, 6);
    }
  });

  it("yanlış sayıda eklem açısı verilirse eklem sayısını ve movej() örneğini anan öğretici hata döner", () => {
    const result = validateJointAnglesDeg(genericSixDofRobot, [0, -30]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("6 eklemli");
      expect(result.message).toContain("movej()");
      expect(result.message).toContain("robot.movej([0, 0, 0, 0, 0, 0])");
    }
  });

  it("dizi olmayan bir girdi için de aynı uzunluk hatasını döner", () => {
    const result = validateJointAnglesDeg(genericTwoDofRobot, 45 as unknown);
    expect(result.ok).toBe(false);
  });

  it("eklem limiti dışındaki bir açı için eklem indeksini ve izinli aralığı anan hata döner", () => {
    // generic-2dof: her iki eklem de [-180, 180] derece limitine sahip.
    const result = validateJointAnglesDeg(genericTwoDofRobot, [0, 400]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Eklem 1");
      expect(result.message).toMatch(/-180°.*180°|180°.*-180°/);
    }
  });

  it("sonlu olmayan bir açı için anlaşılır hata döner", () => {
    const result = validateJointAnglesDeg(genericTwoDofRobot, [0, Number.NaN]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Eklem 1");
  });
});

describe("solveCartesianTarget", () => {
  it("ulaşılabilir bir hedefe yakınsar ve FK(çözüm) ≈ hedef olur", () => {
    // Hedefi, bilinen bir eklem konfigürasyonunun ileri kinematiğinden türet
    // — bu yüzden ulaşılabilirliği garanti (round-trip).
    const knownAngles = [0.3, 0.5, -0.4, 0.2, 0.6, 0];
    const target = forwardKinematics(genericSixDofRobot, knownAngles).endEffector;

    const result = solveCartesianTarget(genericSixDofRobot, target);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const reached = forwardKinematics(genericSixDofRobot, result.value).endEffector;
      expect(reached.x).toBeCloseTo(target.x, 3);
      expect(reached.y).toBeCloseTo(target.y, 3);
      expect(reached.z).toBeCloseTo(target.z, 3);
    }
  });

  it("çalışma uzayının çok dışındaki bir hedef için öğretici hata döner", () => {
    const result = solveCartesianTarget(genericSixDofRobot, { x: 1000, y: 1000, z: 1000 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("çalışma uzayı");
    }
  });

  it("sonlu olmayan hedef koordinatları için hemen hata döner", () => {
    const result = solveCartesianTarget(genericSixDofRobot, { x: Number.NaN, y: 0, z: 0 });
    expect(result.ok).toBe(false);
  });

  it("verilen initialGuess'i başlangıç noktası olarak kullanır", () => {
    const knownAngles = [0.1, 0.2, -0.2, 0, 0.3, 0];
    const target = forwardKinematics(genericSixDofRobot, knownAngles).endEffector;
    const result = solveCartesianTarget(genericSixDofRobot, target, knownAngles);
    expect(result.ok).toBe(true);
  });
});

describe("poseOf", () => {
  it("forwardKinematics ile aynı uç nokta konumunu döner", () => {
    const angles = [0, -30 * (Math.PI / 180), 45 * (Math.PI / 180), 0, 60 * (Math.PI / 180), 0];
    const pose = poseOf(genericSixDofRobot, angles);
    const direct = forwardKinematics(genericSixDofRobot, angles).endEffector;
    expect(pose).toEqual(direct);
  });
});
