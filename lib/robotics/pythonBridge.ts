import { forwardKinematics, inverseKinematicsNumerical, type RobotSpec } from "./kinematics";
import type { Vec3 } from "./transform";

/**
 * Python öğretim API'sinin (`robot.movej`/`robot.movel`/`robot.forward_kinematics`/
 * `robot.inverse_kinematics`, bkz. lib/workers/pyodideWorker.ts) dayandığı SAF
 * doğrulama ve köprü mantığı. Yeni matematik içermez — yalnız kinematics.ts'in
 * mevcut, zaten test edilmiş FK/IK'sını sarar ve öğrenciye Türkçe, öğretici
 * hata mesajları üretir (bkz. docs/06-kalite-ve-topluluk.md "hata mesajları
 * eğitim odaklı olsun").
 */

const RAD_PER_DEG = Math.PI / 180;
const DEG_PER_RAD = 180 / Math.PI;

export function degreesToRadians(degrees: readonly number[]): number[] {
  return degrees.map((value) => value * RAD_PER_DEG);
}

export function radiansToDegrees(radians: readonly number[]): number[] {
  return radians.map((value) => value * DEG_PER_RAD);
}

export type BridgeResult<T> = { ok: true; value: T } | { ok: false; message: string };

function movejUsageExample(jointCount: number): string {
  const example = Array.from({ length: jointCount }, () => 0).join(", ");
  return `robot.movej([${example}])`;
}

/**
 * `robot.movej(acilar)` ve `robot.forward_kinematics(acilar)` için ortak
 * girdi doğrulaması: uzunluk, sayı olma ve eklem limiti kontrolü. `anglesDeg`
 * Pyodide sınırından geldiği için tip garantisi yok — bilinçli olarak `unknown`.
 */
export function validateJointAnglesDeg(robot: RobotSpec, anglesDeg: unknown): BridgeResult<number[]> {
  const jointCount = robot.joints.length;
  if (!Array.isArray(anglesDeg) || anglesDeg.length !== jointCount) {
    return {
      ok: false,
      message:
        `Bu robot ${jointCount} eklemli olduğu için movej() ${jointCount} eklem açısı bekliyor.\n\n` +
        `Örnek:\n${movejUsageExample(jointCount)}`,
    };
  }

  const anglesRad: number[] = [];
  for (let index = 0; index < jointCount; index += 1) {
    const deg = anglesDeg[index];
    if (typeof deg !== "number" || !Number.isFinite(deg)) {
      return { ok: false, message: `Eklem ${index} için verilen açı geçerli bir sayı değil: ${String(deg)}` };
    }
    const rad = deg * RAD_PER_DEG;
    const { min, max } = robot.joints[index].limits;
    if (rad < min || rad > max) {
      const minDeg = Math.round(min * DEG_PER_RAD);
      const maxDeg = Math.round(max * DEG_PER_RAD);
      return {
        ok: false,
        message: `Eklem ${index} için açı ${minDeg}° ile ${maxDeg}° arasında olmalı (verilen: ${deg}°).`,
      };
    }
    anglesRad.push(rad);
  }
  return { ok: true, value: anglesRad };
}

export interface CartesianTarget {
  x: number;
  y: number;
  z: number;
}

function isFiniteCartesian(target: CartesianTarget): boolean {
  return (
    typeof target.x === "number" && Number.isFinite(target.x) &&
    typeof target.y === "number" && Number.isFinite(target.y) &&
    typeof target.z === "number" && Number.isFinite(target.z)
  );
}

/**
 * `robot.movel(x, y, z)` ve `robot.inverse_kinematics(x=, y=, z=)` için ortak
 * çözücü: sayısal (genel) ters kinematik ile hedefe yakınsamayı dener.
 * `initialGuessRad` verilirse (movel'de robotun güncel duruşu) çözücüyü oradan
 * başlatır — bu hem daha hızlı yakınsar hem de birden çok geçerli çözümden
 * mevcut duruşa en yakınını tercih eder.
 */
export function solveCartesianTarget(
  robot: RobotSpec,
  target: CartesianTarget,
  initialGuessRad?: readonly number[],
): BridgeResult<number[]> {
  if (!isFiniteCartesian(target)) {
    return { ok: false, message: "Hedef x, y, z değerleri sonlu sayılar olmalı." };
  }

  const result = inverseKinematicsNumerical(robot, target, {
    initialGuess: initialGuessRad ? [...initialGuessRad] : undefined,
  });

  if (!result.converged || !result.angles) {
    return {
      ok: false,
      message:
        `Hedef (x=${target.x}, y=${target.y}, z=${target.z}) bu robotun çalışma uzayı dışında ` +
        `veya sayısal çözücü ${result.iterations} iterasyonda yakınsamadı. Koordinatları robotun ` +
        `erişebileceği aralığa çek.`,
    };
  }

  return { ok: true, value: result.angles };
}

/** `robot.get_tcp()` ve `robot.forward_kinematics(acilar)` için uç nokta konumu. */
export function poseOf(robot: RobotSpec, anglesRad: readonly number[]): Vec3 {
  return forwardKinematics(robot, [...anglesRad]).endEffector;
}
