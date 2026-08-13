import {
  forwardKinematics,
  inverseKinematicsAnalytical2Dof,
  inverseKinematicsNumerical,
  type Elbow,
  type RobotSpec,
} from "./kinematics";

export type IkSolverMode = "auto" | "analytical" | "dls";
export type ResolvedIkSolver = "analytical" | "dls";

export interface IkTargetSolution {
  angles: number[] | null;
  converged: boolean;
  iterations: number;
  residual: number;
  solver: ResolvedIkSolver;
}

function wrappedAngularDistance(first: number, second: number): number {
  const twoPi = 2 * Math.PI;
  const difference = ((first - second + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return Math.abs(difference);
}

/** Canlı sürüşte geçerli adaylar arasından mevcut poza en az eklem hareketi isteyen dalı seçer. */
export function selectClosestIkSolution(
  currentAngles: readonly number[],
  candidates: readonly IkTargetSolution[],
): IkTargetSolution | null {
  const valid = candidates.filter(
    (candidate): candidate is IkTargetSolution & { angles: number[] } =>
      candidate.converged && candidate.angles !== null && candidate.angles.length === currentAngles.length,
  );
  return valid.sort((first, second) => {
    const distance = (candidate: IkTargetSolution & { angles: number[] }) => Math.hypot(
      ...candidate.angles.map((angle, index) => wrappedAngularDistance(angle, currentAngles[index])),
    );
    return distance(first) - distance(second);
  })[0] ?? null;
}

export function resolveIkSolver(robot: RobotSpec, mode: IkSolverMode): ResolvedIkSolver {
  if (mode === "auto") return robot.joints.length === 2 ? "analytical" : "dls";
  return mode;
}

export function solveIkTarget(
  robot: RobotSpec,
  target: { x: number; y: number },
  mode: IkSolverMode,
  elbow: Elbow,
  initialGuess: number[],
): IkTargetSolution {
  const solver = resolveIkSolver(robot, mode);
  if (solver === "analytical") {
    const angles = inverseKinematicsAnalytical2Dof(robot, target, elbow);
    const residual = angles ? targetResidual(robot, angles, target) : Number.POSITIVE_INFINITY;
    return { angles, converged: angles !== null, iterations: angles ? 1 : 0, residual, solver };
  }

  const result = inverseKinematicsNumerical(
    robot,
    { x: target.x, y: target.y, z: 0 },
    { initialGuess },
  );
  return {
    angles: result.angles,
    converged: result.converged,
    iterations: result.iterations,
    residual: result.finalError,
    solver,
  };
}

function targetResidual(robot: RobotSpec, angles: number[], target: { x: number; y: number }): number {
  const { endEffector } = forwardKinematics(robot, angles);
  return Math.hypot(endEffector.x - target.x, endEffector.y - target.y, endEffector.z);
}
