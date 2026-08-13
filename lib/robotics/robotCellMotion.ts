import { forwardKinematics, inverseKinematicsNumerical, type RobotSpec } from "./kinematics";
import type { Vec3 } from "./transform";

export interface RobotCellObstacle {
  id: string;
  label: string;
  center: Vec3;
  halfSize: Vec3;
}

export interface RobotCellCollision {
  obstacleId: string;
  obstacleLabel: string;
  linkIndex: number;
}

export type RobotCellMotionStatus = "safe" | "collision" | "ik-failure" | "joint-limit";
export type RobotCellMotionKind = "movej" | "movel";

export interface RobotCellMotionSample {
  progress: number;
  jointAngles: number[];
  tcp: Vec3;
  collisions: RobotCellCollision[];
}

export interface RobotCellMotionIssue {
  reason: Exclude<RobotCellMotionStatus, "safe">;
  sampleIndex: number;
  progress: number;
  obstacleId?: string;
  obstacleLabel?: string;
  linkIndex?: number;
  errorMetres?: number;
}

export interface RobotCellMotionPlan {
  kind: RobotCellMotionKind;
  status: RobotCellMotionStatus;
  samples: RobotCellMotionSample[];
  tcpPath: Vec3[];
  firstIssue?: RobotCellMotionIssue;
  tcpDistanceMetres: number;
  jointTravelRadians: number;
  estimatedDurationSeconds: number;
  maxCartesianDeviation: number;
}

export interface RobotCellMotionOptions {
  sampleCount?: number;
  linkRadius?: number;
  speedScale?: number;
}

/**
 * Sahnedeki fiziksel hacimlerin robotik Z-yukarı koordinatlarındaki karşılığı.
 * Görsel geometri ile bu liste birlikte güncellenmelidir.
 */
export const ROBOT_CELL_OBSTACLES: RobotCellObstacle[] = [
  { id: "table", label: "Çalışma masası", center: { x: 0.78, y: -0.02, z: 0.26 }, halfSize: { x: 0.45, y: 0.59, z: 0.04 } },
  { id: "fixture", label: "Fikstür", center: { x: 0.7, y: -0.1, z: 0.45 }, halfSize: { x: 0.09, y: 0.09, z: 0.14 } },
  { id: "bin", label: "Bırakma tablası", center: { x: 0.55, y: -0.4, z: 0.325 }, halfSize: { x: 0.1, y: 0.1, z: 0.015 } },
  { id: "fence-nw", label: "Koruyucu çevre", center: { x: -0.45, y: 0.85, z: 0.58 }, halfSize: { x: 0.025, y: 0.025, z: 0.58 } },
  { id: "fence-sw", label: "Koruyucu çevre", center: { x: -0.45, y: -0.85, z: 0.58 }, halfSize: { x: 0.025, y: 0.025, z: 0.58 } },
  { id: "fence-ne", label: "Koruyucu çevre", center: { x: 1.55, y: 0.85, z: 0.58 }, halfSize: { x: 0.025, y: 0.025, z: 0.58 } },
  { id: "fence-se", label: "Koruyucu çevre", center: { x: 1.55, y: -0.85, z: 0.58 }, halfSize: { x: 0.025, y: 0.025, z: 0.58 } },
];

function pointBoxDistanceSquared(point: Vec3, obstacle: RobotCellObstacle): number {
  const axisDistance = (axis: keyof Vec3) => Math.max(
    0,
    Math.abs(point[axis] - obstacle.center[axis]) - obstacle.halfSize[axis],
  );
  const dx = axisDistance("x");
  const dy = axisDistance("y");
  const dz = axisDistance("z");
  return dx * dx + dy * dy + dz * dz;
}

/** Kapsül bağlantı–kutu testi: merkez çizgisinin kutuya en kısa uzaklığı yarıçapla karşılaştırılır. */
export function segmentIntersectsInflatedBox(
  start: Vec3,
  end: Vec3,
  obstacle: RobotCellObstacle,
  radius: number,
): boolean {
  const delta = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
  const distanceAt = (progress: number) => pointBoxDistanceSquared({
    x: start.x + delta.x * progress,
    y: start.y + delta.y * progress,
    z: start.z + delta.z * progress,
  }, obstacle);

  // Nokta–AABB uzaklığının segment üzerindeki karesi konvekstir. Ternary arama,
  // köşelerde eksen başına şişirilmiş kutunun üreteceği yanlış pozitifleri önler.
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const first = lower + (upper - lower) / 3;
    const second = upper - (upper - lower) / 3;
    if (distanceAt(first) <= distanceAt(second)) upper = second;
    else lower = first;
  }
  const minimumDistanceSquared = Math.min(distanceAt(0), distanceAt(1), distanceAt((lower + upper) / 2));
  return minimumDistanceSquared <= radius * radius + 1e-12;
}

export function detectRobotCellCollisions(
  robot: RobotSpec,
  jointAngles: readonly number[],
  obstacles: readonly RobotCellObstacle[] = ROBOT_CELL_OBSTACLES,
  linkRadius = 0.04,
): RobotCellCollision[] {
  const positions = forwardKinematics(robot, [...jointAngles]).jointPositions;
  const collisions: RobotCellCollision[] = [];
  for (let linkIndex = 0; linkIndex < positions.length - 1; linkIndex += 1) {
    const start = positions[linkIndex];
    const end = positions[linkIndex + 1];
    if (Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z) < 1e-9) continue;
    for (const obstacle of obstacles) {
      if (segmentIntersectsInflatedBox(start, end, obstacle, linkRadius)) {
        collisions.push({ obstacleId: obstacle.id, obstacleLabel: obstacle.label, linkIndex });
      }
    }
  }
  return collisions;
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function interpolatePoint(start: Vec3, end: Vec3, progress: number): Vec3 {
  return {
    x: interpolate(start.x, end.x, progress),
    y: interpolate(start.y, end.y, progress),
    z: interpolate(start.z, end.z, progress),
  };
}

function pathDistance(points: readonly Vec3[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

function jointTravel(samples: readonly RobotCellMotionSample[]): number {
  return samples.slice(1).reduce((sum, sample, index) => sum + sample.jointAngles.reduce(
    (jointSum, angle, jointIndex) => jointSum + Math.abs(angle - samples[index].jointAngles[jointIndex]),
    0,
  ), 0);
}

function sampleCountFor(start: readonly number[], end: readonly number[], requested?: number): number {
  if (requested !== undefined) return Math.max(2, Math.round(requested));
  const largestDelta = Math.max(...start.map((angle, index) => Math.abs(end[index] - angle)));
  return Math.max(24, Math.ceil(largestDelta / (2 * Math.PI / 180)));
}

function durationFromJointLimits(robot: RobotSpec, samples: readonly RobotCellMotionSample[], speedScale: number): number {
  if (samples.length < 2) return 0;
  return samples.slice(1).reduce((duration, sample, sampleIndex) => {
    const previous = samples[sampleIndex];
    const segmentDuration = Math.max(...sample.jointAngles.map(
      (angle, jointIndex) => Math.abs(angle - previous.jointAngles[jointIndex]) / (robot.joints[jointIndex].maxVelocity * speedScale),
    ));
    return duration + segmentDuration;
  }, 0);
}

function issueFromSample(sample: RobotCellMotionSample, sampleIndex: number): RobotCellMotionIssue | undefined {
  const collision = sample.collisions[0];
  if (!collision) return undefined;
  return {
    reason: "collision",
    sampleIndex,
    progress: sample.progress,
    obstacleId: collision.obstacleId,
    obstacleLabel: collision.obstacleLabel,
    linkIndex: collision.linkIndex,
  };
}

function finalizePlan(
  kind: RobotCellMotionKind,
  robot: RobotSpec,
  samples: RobotCellMotionSample[],
  firstIssue: RobotCellMotionIssue | undefined,
  maxCartesianDeviation: number,
  speedScale: number,
): RobotCellMotionPlan {
  const tcpPath = samples.map((sample) => sample.tcp);
  return {
    kind,
    status: firstIssue?.reason ?? "safe",
    samples,
    tcpPath,
    firstIssue,
    tcpDistanceMetres: pathDistance(tcpPath),
    jointTravelRadians: jointTravel(samples),
    estimatedDurationSeconds: durationFromJointLimits(robot, samples, speedScale),
    maxCartesianDeviation,
  };
}

export function planRobotCellMoveJ(
  robot: RobotSpec,
  startAngles: readonly number[],
  endAngles: readonly number[],
  obstacles: readonly RobotCellObstacle[] = ROBOT_CELL_OBSTACLES,
  options: RobotCellMotionOptions = {},
): RobotCellMotionPlan {
  const count = sampleCountFor(startAngles, endAngles, options.sampleCount);
  const samples: RobotCellMotionSample[] = [];
  let firstIssue: RobotCellMotionIssue | undefined;
  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    const jointAngles = index === 0
      ? [...startAngles]
      : index === count
        ? [...endAngles]
        : startAngles.map((angle, jointIndex) => interpolate(angle, endAngles[jointIndex], progress));
    const outOfLimit = robot.joints.findIndex((joint, jointIndex) => jointAngles[jointIndex] < joint.limits.min || jointAngles[jointIndex] > joint.limits.max);
    const pose = forwardKinematics(robot, jointAngles);
    const collisions = detectRobotCellCollisions(robot, jointAngles, obstacles, options.linkRadius);
    const sample = { progress, jointAngles, tcp: pose.endEffector, collisions };
    samples.push(sample);
    if (!firstIssue && outOfLimit >= 0) firstIssue = { reason: "joint-limit", sampleIndex: index, progress };
    if (!firstIssue) firstIssue = issueFromSample(sample, index);
  }
  return finalizePlan("movej", robot, samples, firstIssue, 0, options.speedScale ?? 0.35);
}

export function planRobotCellMoveL(
  robot: RobotSpec,
  startAngles: readonly number[],
  target: Vec3,
  obstacles: readonly RobotCellObstacle[] = ROBOT_CELL_OBSTACLES,
  options: RobotCellMotionOptions = {},
): RobotCellMotionPlan {
  const count = Math.max(2, Math.round(options.sampleCount ?? 32));
  const startTcp = forwardKinematics(robot, [...startAngles]).endEffector;
  const samples: RobotCellMotionSample[] = [];
  let previousAngles = [...startAngles];
  let firstIssue: RobotCellMotionIssue | undefined;
  let maxDeviation = 0;

  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    const desiredTcp = interpolatePoint(startTcp, target, progress);
    const result = index === 0
      ? { angles: [...startAngles], converged: true, finalError: 0 }
      : inverseKinematicsNumerical(robot, desiredTcp, {
        initialGuess: previousAngles,
        maxIterations: 160,
        tolerance: 0.0005,
        damping: 0.06,
        maxStep: 0.12,
      });

    if (!result.converged || !result.angles) {
      firstIssue ??= { reason: "ik-failure", sampleIndex: index, progress, errorMetres: result.finalError };
      break;
    }
    previousAngles = result.angles;
    const pose = forwardKinematics(robot, result.angles);
    const deviation = distance(pose.endEffector, desiredTcp);
    maxDeviation = Math.max(maxDeviation, deviation);
    const collisions = detectRobotCellCollisions(robot, result.angles, obstacles, options.linkRadius);
    const sample = { progress, jointAngles: [...result.angles], tcp: pose.endEffector, collisions };
    samples.push(sample);
    if (!firstIssue) firstIssue = issueFromSample(sample, index);
  }

  return finalizePlan("movel", robot, samples, firstIssue, maxDeviation, options.speedScale ?? 0.35);
}

/** Görsel prova için plan örnekleri arasında eklem uzayında doğrusal örnekleme. */
export function sampleRobotCellMotion(plan: RobotCellMotionPlan, progress: number): RobotCellMotionSample {
  if (plan.samples.length === 0) throw new Error("Boş hareket planı örneklenemez.");
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped === 0) return plan.samples[0];
  if (clamped === 1) return plan.samples.at(-1)!;
  const scaled = clamped * (plan.samples.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(plan.samples.length - 1, lowerIndex + 1);
  const localProgress = scaled - lowerIndex;
  const lower = plan.samples[lowerIndex];
  const upper = plan.samples[upperIndex];
  const jointAngles = lower.jointAngles.map((angle, index) => interpolate(angle, upper.jointAngles[index], localProgress));
  return {
    progress: clamped,
    jointAngles,
    tcp: interpolatePoint(lower.tcp, upper.tcp, localProgress),
    collisions: localProgress < 0.5 ? lower.collisions : upper.collisions,
  };
}
