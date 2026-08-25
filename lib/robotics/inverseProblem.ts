import { forwardKinematics } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import type { Vec3 } from "./transform";

export type InverseElbowBranch = "up" | "down";

export interface InverseProblemChallenge {
  id: string;
  seed: number;
  sourceAnglesDegrees: readonly [number, number];
  target: Vec3;
  toleranceMeters: number;
}

export interface InverseProblemAttempt {
  anglesDegrees: readonly [number, number];
  tcp: Vec3;
  errorMeters: number;
  reached: boolean;
  branch: InverseElbowBranch;
}

export interface InverseSolutionRegistration {
  status: "miss" | "first-saved" | "same-branch" | "complete";
  solutions: readonly InverseProblemAttempt[];
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;

function targetFromDegrees(angles: readonly [number, number]): Vec3 {
  return forwardKinematics(genericTwoDofRobot, angles.map(toRadians)).endEffector;
}

function challenge(seed: number, sourceAnglesDegrees: readonly [number, number]): InverseProblemChallenge {
  return {
    id: `inverse-${seed}`,
    seed,
    sourceAnglesDegrees,
    target: targetFromDegrees(sourceAnglesDegrees),
    toleranceMeters: 0.035,
  };
}

/**
 * Hedefler sabit sayılar olarak elle yazılmaz; sürümlü açı çiftlerinin gerçek
 * `forwardKinematics` sonucundan türetilir. Kaynak açı yalnız test oracle'ıdır,
 * kullanıcı arayüzünde ters problem çözülmeden gösterilmez.
 */
export const INVERSE_PROBLEM_CHALLENGES: readonly InverseProblemChallenge[] = [
  challenge(240831, [25, 80]),
  challenge(240832, [-40, 95]),
  challenge(240833, [70, -65]),
];

export function evaluateInverseAttempt(
  problem: InverseProblemChallenge,
  anglesDegrees: readonly [number, number],
): InverseProblemAttempt {
  const normalizedAngles = anglesDegrees.map((angle) => Number.isFinite(angle) ? angle : 0) as [number, number];
  const tcp = targetFromDegrees(normalizedAngles);
  const errorMeters = Math.hypot(
    tcp.x - problem.target.x,
    tcp.y - problem.target.y,
    tcp.z - problem.target.z,
  );

  return {
    anglesDegrees: normalizedAngles,
    tcp,
    errorMeters,
    reached: errorMeters <= problem.toleranceMeters,
    branch: normalizedAngles[1] >= 0 ? "up" : "down",
  };
}

export function registerInverseSolution(
  solutions: readonly InverseProblemAttempt[],
  attempt: InverseProblemAttempt,
): InverseSolutionRegistration {
  if (!attempt.reached) return { status: "miss", solutions };
  if (solutions.length === 0) return { status: "first-saved", solutions: [attempt] };
  if (solutions.some((solution) => solution.branch === attempt.branch)) {
    return { status: "same-branch", solutions };
  }
  return { status: "complete", solutions: [...solutions, attempt] };
}
