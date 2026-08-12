import { forwardKinematics, type RobotSpec } from "./kinematics";

export const CUSTOM_ROBOT_MAX_WAYPOINTS = 32;
const COLLISION_EPSILON = 1e-7;
const MAX_VALIDATION_ANGLE_STEP = (2 * Math.PI) / 180;

export interface JointLimitViolation {
  jointIndex: number;
  value: number;
  min: number;
  max: number;
}

export interface CustomRobotPoseAnalysis {
  valid: boolean;
  limitViolations: JointLimitViolation[];
  /** Sıfır tabanlı; kesişen veya üst üste katlanan bağlantı çiftleri. */
  selfCollisionPairs: Array<[number, number]>;
  /** Radyan; limit dışı bir pozda negatif olabilir. */
  minimumLimitMargin: number;
}

export interface JointTrajectorySegment {
  startAngles: number[];
  endAngles: number[];
  startTimeSeconds: number;
  durationSeconds: number;
}

export interface JointTrajectory {
  segments: JointTrajectorySegment[];
  totalDurationSeconds: number;
  peakVelocityRatio: number;
  checkedSamples: number;
  jointTravelRadians: number;
  tcpTravelMeters: number;
  minimumLimitMargin: number;
}

export type JointTrajectoryPlanResult =
  | { ok: true; trajectory: JointTrajectory }
  | {
      ok: false;
      reason: "not-enough-waypoints" | "invalid-speed" | "joint-limit" | "self-collision" | "invalid-shape";
      waypointIndex?: number;
      segmentIndex?: number;
      analysis?: CustomRobotPoseAnalysis;
    };

interface Point2 {
  x: number;
  y: number;
}

function orientation(a: Point2, b: Point2, c: Point2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointOnSegment(point: Point2, a: Point2, b: Point2): boolean {
  return (
    Math.abs(orientation(a, b, point)) <= COLLISION_EPSILON &&
    point.x >= Math.min(a.x, b.x) - COLLISION_EPSILON &&
    point.x <= Math.max(a.x, b.x) + COLLISION_EPSILON &&
    point.y >= Math.min(a.y, b.y) - COLLISION_EPSILON &&
    point.y <= Math.max(a.y, b.y) + COLLISION_EPSILON
  );
}

function segmentsIntersect(a: Point2, b: Point2, c: Point2, d: Point2): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 * o2 < -COLLISION_EPSILON && o3 * o4 < -COLLISION_EPSILON) return true;
  return (
    pointOnSegment(c, a, b) ||
    pointOnSegment(d, a, b) ||
    pointOnSegment(a, c, d) ||
    pointOnSegment(b, c, d)
  );
}

function adjacentLinksOverlap(before: Point2, joint: Point2, after: Point2): boolean {
  const previousX = before.x - joint.x;
  const previousY = before.y - joint.y;
  const nextX = after.x - joint.x;
  const nextY = after.y - joint.y;
  const cross = previousX * nextY - previousY * nextX;
  const dot = previousX * nextX + previousY * nextY;
  return Math.abs(cross) <= COLLISION_EPSILON && dot > COLLISION_EPSILON;
}

/**
 * Düzlemsel kullanıcı robotunun merkez çizgilerini denetler. Bağlantı kalınlığı,
 * motor gövdesi ve çevre geometrisi RobotSpec'te olmadığı için bu test bilinçli
 * olarak idealize bir öz-çarpışma ön kontrolüdür; gerçek hücre güvenlik analizi değildir.
 */
export function analyzeCustomRobotPose(robot: RobotSpec, angles: readonly number[]): CustomRobotPoseAnalysis {
  const limitViolations: JointLimitViolation[] = [];
  let minimumLimitMargin = Number.POSITIVE_INFINITY;

  if (angles.length !== robot.joints.length || angles.some((angle) => !Number.isFinite(angle))) {
    return {
      valid: false,
      limitViolations: robot.joints.map((joint, jointIndex) => ({
        jointIndex,
        value: angles[jointIndex] ?? Number.NaN,
        min: joint.limits.min,
        max: joint.limits.max,
      })),
      selfCollisionPairs: [],
      minimumLimitMargin: Number.NEGATIVE_INFINITY,
    };
  }

  robot.joints.forEach((joint, jointIndex) => {
    const value = angles[jointIndex];
    const margin = Math.min(value - joint.limits.min, joint.limits.max - value);
    minimumLimitMargin = Math.min(minimumLimitMargin, margin);
    if (value < joint.limits.min - 1e-10 || value > joint.limits.max + 1e-10) {
      limitViolations.push({ jointIndex, value, min: joint.limits.min, max: joint.limits.max });
    }
  });

  const selfCollisionPairs: Array<[number, number]> = [];
  const positions = forwardKinematics(robot, [...angles]).jointPositions;
  for (let first = 0; first < positions.length - 1; first += 1) {
    for (let second = first + 1; second < positions.length - 1; second += 1) {
      const collides = second === first + 1
        ? adjacentLinksOverlap(positions[first], positions[first + 1], positions[second + 1])
        : segmentsIntersect(positions[first], positions[first + 1], positions[second], positions[second + 1]);
      if (collides) {
        selfCollisionPairs.push([first, second]);
      }
    }
  }

  return {
    valid: limitViolations.length === 0 && selfCollisionPairs.length === 0,
    limitViolations,
    selfCollisionPairs,
    minimumLimitMargin,
  };
}

function interpolateAngles(start: readonly number[], end: readonly number[], amount: number): number[] {
  return start.map((angle, index) => angle + (end[index] - angle) * amount);
}

function smoothstep(amount: number): number {
  const clamped = Math.min(1, Math.max(0, amount));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Öğretilmiş eklem pozları arasında sıfır uç-hızlı kübik geçişler planlar.
 * Süre, RobotSpec.maxVelocity sınırına göre hesaplanır; ara pozlar 2° veya
 * daha sık örneklenerek limit/idealize öz-çarpışma açısından prova edilir.
 */
export function planJointTrajectory(
  robot: RobotSpec,
  waypoints: readonly (readonly number[])[],
  speedScale: number,
): JointTrajectoryPlanResult {
  if (waypoints.length < 2) return { ok: false, reason: "not-enough-waypoints" };
  if (waypoints.length > CUSTOM_ROBOT_MAX_WAYPOINTS || waypoints.some((angles) => angles.length !== robot.joints.length)) {
    return { ok: false, reason: "invalid-shape" };
  }
  if (!Number.isFinite(speedScale) || speedScale < 0.05 || speedScale > 1) {
    return { ok: false, reason: "invalid-speed" };
  }

  let minimumLimitMargin = Number.POSITIVE_INFINITY;
  for (let waypointIndex = 0; waypointIndex < waypoints.length; waypointIndex += 1) {
    const analysis = analyzeCustomRobotPose(robot, waypoints[waypointIndex]);
    minimumLimitMargin = Math.min(minimumLimitMargin, analysis.minimumLimitMargin);
    if (analysis.limitViolations.length > 0) return { ok: false, reason: "joint-limit", waypointIndex, analysis };
    if (analysis.selfCollisionPairs.length > 0) return { ok: false, reason: "self-collision", waypointIndex, analysis };
  }

  const segments: JointTrajectorySegment[] = [];
  let totalDurationSeconds = 0;
  let checkedSamples = waypoints.length;
  let jointTravelRadians = 0;
  let tcpTravelMeters = 0;
  let peakVelocityRatio = 0;

  for (let segmentIndex = 0; segmentIndex < waypoints.length - 1; segmentIndex += 1) {
    const startAngles = [...waypoints[segmentIndex]];
    const endAngles = [...waypoints[segmentIndex + 1]];
    const deltas = startAngles.map((angle, jointIndex) => endAngles[jointIndex] - angle);
    const segmentDuration = Math.max(
      0.08,
      ...deltas.map((delta, jointIndex) => {
        const velocity = robot.joints[jointIndex].maxVelocity;
        return velocity > 0 ? (1.5 * Math.abs(delta)) / (velocity * speedScale) : Number.POSITIVE_INFINITY;
      }),
    );
    if (!Number.isFinite(segmentDuration)) return { ok: false, reason: "invalid-shape" };

    const maxDelta = Math.max(...deltas.map(Math.abs), 0);
    const sampleCount = Math.max(2, Math.ceil(maxDelta / MAX_VALIDATION_ANGLE_STEP));
    let previousTcp = forwardKinematics(robot, startAngles).endEffector;
    for (let sample = 1; sample < sampleCount; sample += 1) {
      const sampleAngles = interpolateAngles(startAngles, endAngles, sample / sampleCount);
      const analysis = analyzeCustomRobotPose(robot, sampleAngles);
      checkedSamples += 1;
      minimumLimitMargin = Math.min(minimumLimitMargin, analysis.minimumLimitMargin);
      if (analysis.limitViolations.length > 0) return { ok: false, reason: "joint-limit", segmentIndex, analysis };
      if (analysis.selfCollisionPairs.length > 0) return { ok: false, reason: "self-collision", segmentIndex, analysis };
      const tcp = forwardKinematics(robot, sampleAngles).endEffector;
      tcpTravelMeters += Math.hypot(tcp.x - previousTcp.x, tcp.y - previousTcp.y, tcp.z - previousTcp.z);
      previousTcp = tcp;
    }
    const endTcp = forwardKinematics(robot, endAngles).endEffector;
    tcpTravelMeters += Math.hypot(endTcp.x - previousTcp.x, endTcp.y - previousTcp.y, endTcp.z - previousTcp.z);

    const segmentPeakRatio = Math.max(
      ...deltas.map((delta, jointIndex) => (1.5 * Math.abs(delta)) / (segmentDuration * robot.joints[jointIndex].maxVelocity)),
      0,
    );
    peakVelocityRatio = Math.max(peakVelocityRatio, segmentPeakRatio);
    jointTravelRadians += deltas.reduce((sum, delta) => sum + Math.abs(delta), 0);
    segments.push({ startAngles, endAngles, startTimeSeconds: totalDurationSeconds, durationSeconds: segmentDuration });
    totalDurationSeconds += segmentDuration;
  }

  return {
    ok: true,
    trajectory: {
      segments,
      totalDurationSeconds,
      peakVelocityRatio,
      checkedSamples,
      jointTravelRadians,
      tcpTravelMeters,
      minimumLimitMargin,
    },
  };
}

export function sampleJointTrajectory(trajectory: JointTrajectory, elapsedSeconds: number): number[] {
  const first = trajectory.segments[0];
  if (!first) return [];
  if (elapsedSeconds <= 0) return [...first.startAngles];
  const last = trajectory.segments[trajectory.segments.length - 1];
  if (elapsedSeconds >= trajectory.totalDurationSeconds) return [...last.endAngles];

  const segment = trajectory.segments.find(
    (candidate) => elapsedSeconds <= candidate.startTimeSeconds + candidate.durationSeconds,
  ) ?? last;
  const localTime = (elapsedSeconds - segment.startTimeSeconds) / segment.durationSeconds;
  return interpolateAngles(segment.startAngles, segment.endAngles, smoothstep(localTime));
}

export function sampleTrajectoryTcpPath(robot: RobotSpec, trajectory: JointTrajectory, samples = 80) {
  const count = Math.max(2, Math.min(240, Math.round(samples)));
  return Array.from({ length: count }, (_, index) => {
    const elapsed = (trajectory.totalDurationSeconds * index) / (count - 1);
    const point = forwardKinematics(robot, sampleJointTrajectory(trajectory, elapsed)).endEffector;
    return { x: point.x, y: point.y };
  });
}
