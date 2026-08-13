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
      ...candidate.angles.map((angle, index) => Math.abs(angle - currentAngles[index])),
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

/**
 * 3+ DOF DLS, tek bir başlangıç pozunda yerel minimuma takılabilir. Canlı
 * yönlendirme için önce mevcut pozu dener; başarısızsa limitlerin içinde kalan
 * sabit ve tekrarlanabilir tohumlardan alternatif robot duruşları arar.
 */
export function solveIkTargetCandidates(
  robot: RobotSpec,
  target: { x: number; y: number },
  currentAngles: readonly number[],
  isCandidateAcceptable: (angles: readonly number[]) => boolean = () => true,
): IkTargetSolution[] {
  if (robot.joints.length === 2) {
    const initialGuess = [...currentAngles];
    return (["up", "down"] as const).map((elbow) =>
      solveIkTarget(robot, target, "analytical", elbow, initialGuess));
  }

  const midpoint = robot.joints.map((joint) => (joint.limits.min + joint.limits.max) / 2);
  const normalizedCurrent = currentAngles.length === robot.joints.length
    ? [...currentAngles]
    : midpoint;
  const primary = solveIkTarget(robot, target, "dls", "up", normalizedCurrent);
  if (primary.converged && primary.angles && isCandidateAcceptable(primary.angles)) return [primary];

  const offsetSeed = (direction: 1 | -1, alternating: boolean) => robot.joints.map((joint, index) => {
    const span = joint.limits.max - joint.limits.min;
    const sign = alternating && index % 2 === 1 ? -direction : direction;
    return midpoint[index] + sign * span * 0.22;
  });
  const seeds = [
    midpoint,
    offsetSeed(1, true),
    offsetSeed(-1, true),
    offsetSeed(1, false),
    offsetSeed(-1, false),
  ];
  const uniqueSeeds = seeds.filter((seed, index) =>
    !seeds.slice(0, index).some((previous) =>
      previous.every((value, jointIndex) => Math.abs(value - seed[jointIndex]) < 1e-9)));

  return [
    primary,
    ...uniqueSeeds.map((seed) => solveIkTarget(robot, target, "dls", "up", seed)),
  ];
}

function targetResidual(robot: RobotSpec, angles: number[], target: { x: number; y: number }): number {
  const { endEffector } = forwardKinematics(robot, angles);
  return Math.hypot(endEffector.x - target.x, endEffector.y - target.y, endEffector.z);
}
