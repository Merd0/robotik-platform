import type { RobotSpec } from "./kinematics";

export const CUSTOM_ROBOT_MIN_DOF = 1;
export const CUSTOM_ROBOT_MAX_DOF = 6;
export const CUSTOM_ROBOT_MIN_LINK_LENGTH = 0.05;
export const CUSTOM_ROBOT_MAX_LINK_LENGTH = 2;
export const CUSTOM_ROBOT_MIN_ANGLE_DEGREES = -180;
export const CUSTOM_ROBOT_MAX_ANGLE_DEGREES = 180;
export const CUSTOM_ROBOT_MAX_NAME_LENGTH = 48;
export const CUSTOM_ROBOT_ID = "custom-robot-v1";

export interface CustomRobotJointDefinition {
  type: "revolute";
  linkLength: number;
  minDegrees: number;
  maxDegrees: number;
}

export interface CustomRobotDefinition {
  name: string;
  joints: CustomRobotJointDefinition[];
}

export interface CustomRobotValidationIssue {
  field: string;
  message: string;
}

export type CustomRobotSpecResult =
  | { ok: true; robot: RobotSpec; definition: CustomRobotDefinition }
  | { ok: false; issues: CustomRobotValidationIssue[] };

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => Math.round(((radians * 180) / Math.PI) * 1e9) / 1e9;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Kullanıcı girdisini biçim ve fiziksel sınırlar açısından tek noktada denetler. */
export function validateCustomRobotDefinition(value: unknown): CustomRobotValidationIssue[] {
  const issues: CustomRobotValidationIssue[] = [];
  if (typeof value !== "object" || value === null) {
    return [{ field: "definition", message: "Robot tanımı bir nesne olmalı." }];
  }

  const definition = value as { name?: unknown; joints?: unknown };
  if (typeof definition.name !== "string") {
    issues.push({ field: "name", message: "Robot etiketi metin olmalı." });
  } else if (definition.name.trim().length > CUSTOM_ROBOT_MAX_NAME_LENGTH) {
    issues.push({ field: "name", message: `Robot etiketi en fazla ${CUSTOM_ROBOT_MAX_NAME_LENGTH} karakter olabilir.` });
  }

  if (!Array.isArray(definition.joints)) {
    issues.push({ field: "dof", message: `Eklem sayısı ${CUSTOM_ROBOT_MIN_DOF} ile ${CUSTOM_ROBOT_MAX_DOF} arasında olmalı.` });
    return issues;
  }
  if (definition.joints.length < CUSTOM_ROBOT_MIN_DOF || definition.joints.length > CUSTOM_ROBOT_MAX_DOF) {
    issues.push({ field: "dof", message: `Eklem sayısı ${CUSTOM_ROBOT_MIN_DOF} ile ${CUSTOM_ROBOT_MAX_DOF} arasında olmalı.` });
  }

  definition.joints.forEach((rawJoint, index) => {
    const prefix = `J${index + 1}`;
    if (typeof rawJoint !== "object" || rawJoint === null) {
      issues.push({ field: `joints.${index}`, message: `${prefix} tanımı eksik.` });
      return;
    }
    const joint = rawJoint as Record<string, unknown>;
    if (joint.type !== "revolute") {
      issues.push({ field: `joints.${index}.type`, message: "V1’de yalnız dönel (revolute) eklemler desteklenir." });
    }
    if (
      !isFiniteNumber(joint.linkLength) ||
      joint.linkLength < CUSTOM_ROBOT_MIN_LINK_LENGTH ||
      joint.linkLength > CUSTOM_ROBOT_MAX_LINK_LENGTH
    ) {
      issues.push({
        field: `joints.${index}.linkLength`,
        message: `${prefix} bağlantı uzunluğu 0,05 ile 2 metre arasında olmalı.`,
      });
    }
    if (
      !isFiniteNumber(joint.minDegrees) ||
      joint.minDegrees < CUSTOM_ROBOT_MIN_ANGLE_DEGREES ||
      joint.minDegrees > CUSTOM_ROBOT_MAX_ANGLE_DEGREES
    ) {
      issues.push({
        field: `joints.${index}.minDegrees`,
        message: `${prefix} en küçük açı limiti −180° ile 180° arasında olmalı.`,
      });
    }
    if (
      !isFiniteNumber(joint.maxDegrees) ||
      joint.maxDegrees < CUSTOM_ROBOT_MIN_ANGLE_DEGREES ||
      joint.maxDegrees > CUSTOM_ROBOT_MAX_ANGLE_DEGREES
    ) {
      issues.push({
        field: `joints.${index}.maxDegrees`,
        message: `${prefix} en büyük açı limiti −180° ile 180° arasında olmalı.`,
      });
    }
    if (isFiniteNumber(joint.minDegrees) && isFiniteNumber(joint.maxDegrees) && joint.minDegrees >= joint.maxDegrees) {
      issues.push({
        field: `joints.${index}.limits`,
        message: `${prefix} en küçük açı limiti en büyük limitten küçük olmalı.`,
      });
    }
  });

  return issues;
}

/** Doğrulanmış form tanımını değişmez RobotSpec sözleşmesine dönüştürür. */
export function createCustomRobotSpec(value: unknown): CustomRobotSpecResult {
  const issues = validateCustomRobotDefinition(value);
  if (issues.length > 0) return { ok: false, issues };

  const input = value as CustomRobotDefinition;
  const definition: CustomRobotDefinition = {
    name: input.name.trim() || "Kendi robotum",
    joints: input.joints.map((joint) => ({ ...joint })),
  };
  const robot: RobotSpec = {
    id: CUSTOM_ROBOT_ID,
    displayName: definition.name,
    joints: definition.joints.map((joint) => ({
      type: "revolute",
      dhParams: { a: joint.linkLength, alpha: 0, d: 0, theta: 0 },
      limits: {
        min: degreesToRadians(joint.minDegrees),
        max: degreesToRadians(joint.maxDegrees),
      },
      maxVelocity: Math.PI,
    })),
  };
  return { ok: true, robot, definition };
}

export function createDefaultCustomRobotDefinition(dof = 2): CustomRobotDefinition {
  const safeDof = Number.isSafeInteger(dof)
    ? Math.min(CUSTOM_ROBOT_MAX_DOF, Math.max(CUSTOM_ROBOT_MIN_DOF, dof))
    : 2;
  return {
    name: "Kendi robotum",
    joints: Array.from({ length: safeDof }, (_, index) => ({
      type: "revolute" as const,
      linkLength: Math.max(0.45, 0.85 - index * 0.08),
      minDegrees: -160,
      maxDegrees: 160,
    })),
  };
}

/** Yalnız bu modülün ürettiği düzlemsel RobotSpec'ler için düzenleme tanımı. */
export function customRobotSpecToDefinition(robot: RobotSpec): CustomRobotDefinition {
  return {
    name: robot.displayName,
    joints: robot.joints.map((joint) => ({
      type: "revolute",
      linkLength: joint.dhParams.a,
      minDegrees: radiansToDegrees(joint.limits.min),
      maxDegrees: radiansToDegrees(joint.limits.max),
    })),
  };
}
