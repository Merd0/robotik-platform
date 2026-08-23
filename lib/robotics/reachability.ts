import {
  analyticalTwoDofDebug,
  computeJacobian,
  isNearSingularity,
  type Elbow,
  type RobotSpec,
} from "./kinematics";

export type ReachabilityStatus = "reachable" | "near-limit" | "unreachable" | "singularity-risk";
export type ReachabilityReason =
  | "solution"
  | "joint-near-limit"
  | "low-manipulability"
  | "no-real-joint-2-angle"
  | "joint-limit";

export interface JointLimitDiagnostic {
  jointIndex: number;
  required: number;
  min: number;
  max: number;
}

export interface JointMarginDiagnostic {
  jointIndex: number;
  value: number;
  min: number;
  max: number;
  marginRatio: number;
}

export interface PlanarReachabilityAnalysis {
  status: ReachabilityStatus;
  reason: ReachabilityReason;
  angles: number[] | null;
  targetDistance: number;
  minimumReach: number;
  maximumReach: number;
  requiredJoint2Cosine: number;
  manipulability: number | null;
  minimumLimitMarginRatio: number | null;
  nearestLimit?: JointMarginDiagnostic;
  blockingJoint?: JointLimitDiagnostic;
}

/** Mekanik aralığın iki ucundaki son %10, kullanıcıya "sınıra yakın" gösterilir. */
export const NEAR_LIMIT_RATIO = 0.1;

const EPSILON = 1e-10;

/**
 * Çalışma uzayı haritası yalnız mevcut analitik IK ile aynı varsayımları
 * taşıyan klasik 2R zincirlerde çizilir. Desteklenmeyen zinciri yaklaşık bir
 * disk gibi göstermek gerçek dışı olurdu.
 */
export function supportsPlanarReachability(robot: RobotSpec): boolean {
  return robot.joints.length === 2 && robot.joints.every((joint) =>
    joint.type === "revolute"
    && Number.isFinite(joint.dhParams.a)
    && joint.dhParams.a > 0
    && Math.abs(joint.dhParams.alpha) < EPSILON
    && Math.abs(joint.dhParams.d) < EPSILON
    && Math.abs(joint.dhParams.theta) < EPSILON
    && Number.isFinite(joint.limits.min)
    && Number.isFinite(joint.limits.max)
    && joint.limits.max > joint.limits.min,
  );
}

/**
 * Hedef noktasını gerçek 2R IK, RobotSpec mekanik limitleri ve Jacobian
 * manipülabilitesiyle sınıflandırır. Görsel katman bu sonucu yalnız sunar.
 */
export function analyzePlanarReachability(
  robot: RobotSpec,
  target: { x: number; y: number },
  elbow: Elbow,
): PlanarReachabilityAnalysis {
  if (!supportsPlanarReachability(robot)) {
    throw new Error("Çalışma uzayı analizi yalnız iki döner eklemli düzlemsel robotlar için tanımlı.");
  }

  const { a1, a2, cosTheta2 } = analyticalTwoDofDebug(robot, target);
  const targetDistance = Math.hypot(target.x, target.y);
  const minimumReach = Math.abs(a1 - a2);
  const maximumReach = a1 + a2;
  const base = { targetDistance, minimumReach, maximumReach, requiredJoint2Cosine: cosTheta2 };

  if (cosTheta2 < -1 - EPSILON || cosTheta2 > 1 + EPSILON) {
    return {
      ...base,
      status: "unreachable",
      reason: "no-real-joint-2-angle",
      angles: null,
      manipulability: null,
      minimumLimitMarginRatio: null,
    };
  }

  const boundedCosine = Math.max(-1, Math.min(1, cosTheta2));
  const sinTheta2Magnitude = Math.sqrt(Math.max(0, 1 - boundedCosine * boundedCosine));
  const theta2 = Math.atan2(elbow === "up" ? sinTheta2Magnitude : -sinTheta2Magnitude, boundedCosine);
  const theta1 = Math.atan2(target.y, target.x)
    - Math.atan2(a2 * Math.sin(theta2), a1 + a2 * Math.cos(theta2));
  const angles = [theta1, theta2];

  const blockingJointIndex = angles.findIndex((angle, index) => {
    const { min, max } = robot.joints[index].limits;
    return angle < min - EPSILON || angle > max + EPSILON;
  });
  if (blockingJointIndex >= 0) {
    const { min, max } = robot.joints[blockingJointIndex].limits;
    return {
      ...base,
      status: "unreachable",
      reason: "joint-limit",
      angles: null,
      manipulability: null,
      minimumLimitMarginRatio: null,
      blockingJoint: {
        jointIndex: blockingJointIndex,
        required: angles[blockingJointIndex],
        min,
        max,
      },
    };
  }

  const margins = angles.map((value, jointIndex): JointMarginDiagnostic => {
    const { min, max } = robot.joints[jointIndex].limits;
    return {
      jointIndex,
      value,
      min,
      max,
      marginRatio: Math.min(value - min, max - value) / (max - min),
    };
  });
  const nearestLimit = margins.reduce((nearest, current) =>
    current.marginRatio < nearest.marginRatio ? current : nearest);
  const manipulability = computeJacobian(robot, angles).manipulability;

  if (isNearSingularity(manipulability)) {
    return {
      ...base,
      status: "singularity-risk",
      reason: "low-manipulability",
      angles,
      manipulability,
      minimumLimitMarginRatio: nearestLimit.marginRatio,
      nearestLimit,
    };
  }

  if (nearestLimit.marginRatio <= NEAR_LIMIT_RATIO) {
    return {
      ...base,
      status: "near-limit",
      reason: "joint-near-limit",
      angles,
      manipulability,
      minimumLimitMarginRatio: nearestLimit.marginRatio,
      nearestLimit,
    };
  }

  return {
    ...base,
    status: "reachable",
    reason: "solution",
    angles,
    manipulability,
    minimumLimitMarginRatio: nearestLimit.marginRatio,
    nearestLimit,
  };
}
