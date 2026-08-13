import { forwardKinematics, inverseKinematicsNumerical, type RobotSpec } from "./kinematics";
import {
  ROBOT_CELL_OBSTACLES,
  detectRobotCellCollisions,
  planRobotCellMoveJ,
  planRobotCellMoveL,
  type RobotCellMotionKind,
  type RobotCellMotionPlan,
  type RobotCellMotionStatus,
} from "./robotCellMotion";
import type { Vec3 } from "./transform";

export interface RobotCellTaughtPose {
  id: string;
  label: string;
  jointAngles: readonly number[];
  tcp: Readonly<Vec3>;
}

export type RobotCellProgramCommand =
  | { id: string; type: "move"; motion: RobotCellMotionKind; pose: RobotCellTaughtPose }
  | { id: string; type: "gripper"; action: "open" | "close" };

export interface RobotCellSmartRecordResult {
  commands: RobotCellProgramCommand[];
  change: "added" | "replaced" | "ignored";
}

export interface RobotCellProgramRepairResult {
  commands: RobotCellProgramCommand[];
  removedCommandIds: string[];
  preflight: RobotCellProgramPreflight;
}

export type RobotCellProgramIssueReason = Exclude<RobotCellMotionStatus, "safe"> | "grip-zone" | "release-surface" | "already-holding" | "not-holding";
export type RobotCellProgramStepStatus = "ready" | "blocked" | "not-checked";

export interface RobotCellProgramStep {
  commandId: string;
  commandIndex: number;
  status: RobotCellProgramStepStatus;
  startAngles: readonly number[];
  endAngles: readonly number[];
  motionPlan?: RobotCellMotionPlan;
  issue?: RobotCellProgramIssue;
  holdingPartAfter: boolean;
  workpiecePositionAfter: Readonly<Vec3>;
}

export interface RobotCellProgramIssue {
  commandId: string;
  commandIndex: number;
  reason: RobotCellProgramIssueReason;
  obstacleLabel?: string;
}

export interface RobotCellProgramPreflight {
  status: "empty" | "ready" | "blocked";
  steps: RobotCellProgramStep[];
  firstIssue?: RobotCellProgramIssue;
  estimatedDurationSeconds: number;
}

export interface RobotCellGripAssessment {
  canGrip: boolean;
  reason?: "position" | "orientation";
  positionAligned: boolean;
  orientationAligned: boolean;
  positionErrorMetres: number;
  verticalAlignment: number;
}

export interface RobotCellDragSolution {
  status: "ready" | "ik-failure" | "collision";
  angles: number[] | null;
  errorMetres: number;
  obstacleLabel?: string;
}

export interface RobotCellReleaseAssessment {
  canRelease: boolean;
  landingPosition: Readonly<Vec3>;
  surfaceId?: string;
  surfaceLabel?: string;
}

export const ROBOT_CELL_WORKPIECE = {
  start: { x: 0.7, y: -0.1, z: 0.65 },
  drop: { x: 0.55, y: -0.4, z: 0.4 },
  sizeMetres: 0.12,
  gripRadiusMetres: 0.12,
  dropZoneRadiusMetres: 0.12,
} as const;

export const ROBOT_CELL_SAMPLE_JOB = {
  approach: [-8.13, 64.96, 32.74, 0, -97.7, -8.13],
  pick: [-8.13, 65.16, 18.66, 0, -83.83, -8.13],
  inspect: [-9.46, 77.33, 8.33, 0, -85.66, -9.46],
  dropApproach: [-36.03, 68.89, 21.52, 0, -90.41, -36.03],
  drop: [-36.03, 58.3, -1.72, 0, -56.58, -36.03],
} as const;

function distance(first: Vec3, second: Vec3): number {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

const SMART_POSE_DISTANCE_METRES = 0.015;
const SMART_POSE_ANGLE_RADIANS = 2 * Math.PI / 180;
const SMART_SINGLETON_MOVE_LABELS = new Set(["Güvenli kaldırma", "Bırakma üstü"]);
const SMART_CRITICAL_MOVE_LABELS = new Set(["Kavrama konumu", "Bırakma konumu", "Elle bırakma konumu"]);
const RELEASE_SURFACE_SNAP_METRES = 0.025;

function isJogLabel(label: string): boolean {
  return /^(X|Y|Z) jog$/.test(label);
}

function shortestAngleDistance(first: number, second: number): number {
  return Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)));
}

/** Basit öğretimde aynı iş evresindeki gereksiz örnekleri tekilleştirir. */
export function recordRobotCellCommandSmart(
  commands: readonly RobotCellProgramCommand[],
  command: RobotCellProgramCommand,
): RobotCellSmartRecordResult {
  if (command.type === "gripper") {
    const previousGripper = [...commands].reverse().find((item) => item.type === "gripper");
    if (previousGripper?.type === "gripper" && previousGripper.action === command.action) {
      return { commands: [...commands], change: "ignored" };
    }
    return { commands: [...commands, command], change: "added" };
  }

  let phaseStart = 0;
  for (let index = commands.length - 1; index >= 0; index -= 1) {
    if (commands[index].type === "gripper") {
      phaseStart = index + 1;
      break;
    }
  }
  const phaseMoves = commands
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => index >= phaseStart && item.type === "move") as Array<{
      item: RobotCellProgramCommand & { type: "move" };
      index: number;
    }>;
  const duplicate = phaseMoves.find(({ item }) => {
    const closeInSpace = distance(item.pose.tcp, command.pose.tcp) <= SMART_POSE_DISTANCE_METRES;
    const closeInJoints = item.pose.jointAngles.every((angle, index) =>
      shortestAngleDistance(angle, command.pose.jointAngles[index]) <= SMART_POSE_ANGLE_RADIANS);
    return closeInSpace && closeInJoints;
  });
  if (duplicate) {
    if (!SMART_CRITICAL_MOVE_LABELS.has(command.pose.label) || duplicate.item.pose.label === command.pose.label) {
      return { commands: [...commands], change: "ignored" };
    }
    const latestMove = phaseMoves.at(-1);
    if (latestMove?.index !== duplicate.index) {
      return { commands: [...commands, command], change: "added" };
    }
    const previous = duplicate.item;
    const replacement: RobotCellProgramCommand = {
      ...command,
      id: previous.id,
      pose: Object.freeze({ ...command.pose, id: previous.pose.id }),
    };
    const updated = [...commands];
    updated[duplicate.index] = replacement;
    return { commands: updated, change: "replaced" };
  }

  const previousMove = phaseMoves.at(-1);
  if (previousMove && isJogLabel(command.pose.label) && previousMove.item.pose.label === command.pose.label) {
    const previous = previousMove.item;
    const replacement: RobotCellProgramCommand = {
      ...command,
      id: previous.id,
      pose: Object.freeze({ ...command.pose, id: previous.pose.id }),
    };
    const updated = [...commands];
    updated[previousMove.index] = replacement;
    return { commands: updated, change: "replaced" };
  }

  if (SMART_SINGLETON_MOVE_LABELS.has(command.pose.label)) {
    const previousSemanticPose = phaseMoves.find(({ item }) => item.pose.label === command.pose.label);
    if (previousSemanticPose) {
      const previous = previousSemanticPose.item;
      const replacement: RobotCellProgramCommand = {
        ...command,
        id: previous.id,
        pose: Object.freeze({ ...command.pose, id: previous.pose.id }),
      };
      const updated = [...commands];
      updated[previousSemanticPose.index] = replacement;
      return { commands: updated, change: "replaced" };
    }
  }

  return { commands: [...commands, command], change: "added" };
}

function releaseSurfaceCandidates(tcp: Vec3) {
  const halfPart = ROBOT_CELL_WORKPIECE.sizeMetres / 2;
  return ROBOT_CELL_OBSTACLES
    .filter((obstacle) => ["table", "fixture", "bin"].includes(obstacle.id))
    .filter((obstacle) => Math.abs(tcp.x - obstacle.center.x) <= obstacle.halfSize.x
      && Math.abs(tcp.y - obstacle.center.y) <= obstacle.halfSize.y)
    .map((obstacle) => ({
      obstacle,
      landingZ: obstacle.center.z + obstacle.halfSize.z + halfPart,
    }));
}

/** Parçanın havada değil, algılanan bir hücre yüzeyinde bırakılmaya hazır olduğunu denetler. */
export function assessRobotCellRelease(tcp: Vec3): RobotCellReleaseAssessment {
  const overDropZone = Math.hypot(tcp.x - ROBOT_CELL_WORKPIECE.drop.x, tcp.y - ROBOT_CELL_WORKPIECE.drop.y)
    <= ROBOT_CELL_WORKPIECE.dropZoneRadiusMetres;
  if (overDropZone && Math.abs(tcp.z - ROBOT_CELL_WORKPIECE.drop.z) <= RELEASE_SURFACE_SNAP_METRES) {
    return {
      canRelease: true,
      landingPosition: { ...ROBOT_CELL_WORKPIECE.drop },
      surfaceId: "bin",
      surfaceLabel: "Bırakma tablası",
    };
  }

  const halfPart = ROBOT_CELL_WORKPIECE.sizeMetres / 2;
  const surface = releaseSurfaceCandidates(tcp)
    .filter(({ landingZ }) => Math.abs(tcp.z - landingZ) <= RELEASE_SURFACE_SNAP_METRES)
    .sort((first, second) => second.landingZ - first.landingZ)[0];
  if (!surface) return { canRelease: false, landingPosition: { x: tcp.x, y: tcp.y, z: halfPart } };
  return {
    canRelease: true,
    landingPosition: { x: tcp.x, y: tcp.y, z: surface.landingZ },
    surfaceId: surface.obstacle.id,
    surfaceLabel: surface.obstacle.label,
  };
}

/** Gripper açıldığında parçayı XY konumunun altındaki en yüksek hücre yüzeyine oturtur. */
export function releasedWorkpiecePosition(tcp: Vec3): Vec3 {
  const overDropZone = Math.hypot(tcp.x - ROBOT_CELL_WORKPIECE.drop.x, tcp.y - ROBOT_CELL_WORKPIECE.drop.y)
    <= ROBOT_CELL_WORKPIECE.dropZoneRadiusMetres;
  if (overDropZone) return { ...ROBOT_CELL_WORKPIECE.drop };
  const assessed = assessRobotCellRelease(tcp);
  if (assessed.canRelease) return { ...assessed.landingPosition };
  const halfPart = ROBOT_CELL_WORKPIECE.sizeMetres / 2;
  const supportingSurfaces = releaseSurfaceCandidates(tcp)
    .filter(({ landingZ }) => landingZ <= tcp.z + RELEASE_SURFACE_SNAP_METRES);
  const landingZ = supportingSurfaces.length > 0
    ? Math.max(...supportingSurfaces.map((surface) => surface.landingZ))
    : halfPart;
  return { x: tcp.x, y: tcp.y, z: landingZ };
}

export function createTaughtPose(
  robot: RobotSpec,
  id: string,
  label: string,
  jointAngles: readonly number[],
): RobotCellTaughtPose {
  const frozenAngles = Object.freeze([...jointAngles]);
  const tcp = Object.freeze({ ...forwardKinematics(robot, [...frozenAngles]).endEffector });
  return Object.freeze({ id, label, jointAngles: frozenAngles, tcp });
}

function issueFromPlan(command: RobotCellProgramCommand & { type: "move" }, commandIndex: number, plan: RobotCellMotionPlan): RobotCellProgramIssue | undefined {
  if (plan.status === "safe") return undefined;
  return {
    commandId: command.id,
    commandIndex,
    reason: plan.status,
    obstacleLabel: plan.firstIssue?.obstacleLabel,
  };
}

const WORKPIECE_COLLISION_RADIUS = 0.07;
const GRIP_POSITION_TOLERANCE = 0.055;
const GRIP_VERTICAL_ALIGNMENT = 0.72;

export function assessRobotCellGrip(
  robot: RobotSpec,
  jointAngles: readonly number[],
  workpiecePosition: Vec3,
): RobotCellGripAssessment {
  const kinematics = forwardKinematics(robot, [...jointAngles]);
  const tcpTransform = kinematics.jointTransforms.at(-1)!;
  const positionErrorMetres = distance(kinematics.endEffector, workpiecePosition);
  const verticalAlignment = Math.abs(tcpTransform[2][2]);
  const positionAligned = positionErrorMetres <= GRIP_POSITION_TOLERANCE;
  const orientationAligned = verticalAlignment >= GRIP_VERTICAL_ALIGNMENT;
  if (!positionAligned) {
    return { canGrip: false, reason: "position", positionAligned, orientationAligned, positionErrorMetres, verticalAlignment };
  }
  if (!orientationAligned) {
    return { canGrip: false, reason: "orientation", positionAligned, orientationAligned, positionErrorMetres, verticalAlignment };
  }
  return { canGrip: true, positionAligned, orientationAligned, positionErrorMetres, verticalAlignment };
}

export function solveRobotCellDragTarget(
  robot: RobotSpec,
  currentAngles: readonly number[],
  target: Vec3,
  orientationSeed?: readonly number[],
): RobotCellDragSolution {
  const targetOrientation = forwardKinematics(robot, [...currentAngles]).jointTransforms.at(-1)!;
  const seeds = orientationSeed ? [[...currentAngles], [...orientationSeed]] : [[...currentAngles]];
  let smallestError = Number.POSITIVE_INFINITY;
  let collisionLabel: string | undefined;
  for (const seed of seeds) {
    const result = inverseKinematicsNumerical(robot, target, {
      initialGuess: seed,
      maxIterations: 180,
      tolerance: 0.001,
      damping: 0.065,
      maxStep: 0.11,
      targetOrientation,
      orientationTolerance: 0.006,
    });
    smallestError = Math.min(smallestError, result.finalError);
    if (!result.converged || !result.angles) continue;
    const collision = detectRobotCellCollisions(robot, result.angles, ROBOT_CELL_OBSTACLES)[0];
    if (collision) {
      collisionLabel ??= collision.obstacleLabel;
      continue;
    }
    return { status: "ready", angles: [...result.angles], errorMetres: result.finalError };
  }
  if (collisionLabel) return { status: "collision", angles: null, errorMetres: smallestError, obstacleLabel: collisionLabel };
  return { status: "ik-failure", angles: null, errorMetres: smallestError };
}

const ROBOT_CELL_DIRECT_ORIENTATION = [
  [1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [0, 0, 0, 1],
] as const;

/**
 * Basit al-bırak kumandası pozisyonu çözerken gripper'ı düşey tutar.
 * Böylece kullanıcı X/Y/Z joglarında bileğin farklı IK dallarına takla atmasını görmez.
 */
export function solveRobotCellDirectTarget(
  robot: RobotSpec,
  currentAngles: readonly number[],
  target: Vec3,
): RobotCellDragSolution {
  const seeds = [[...currentAngles], ROBOT_CELL_SAMPLE_JOB.approach.map((degrees) => degrees * Math.PI / 180)];
  let smallestError = Number.POSITIVE_INFINITY;
  let collisionLabel: string | undefined;
  for (const seed of seeds) {
    const result = inverseKinematicsNumerical(robot, target, {
      initialGuess: seed,
      maxIterations: 220,
      tolerance: 0.0005,
      damping: 0.05,
      maxStep: 0.11,
      targetOrientation: ROBOT_CELL_DIRECT_ORIENTATION,
      orientationTolerance: 0.003,
    });
    smallestError = Math.min(smallestError, result.finalError);
    if (!result.converged || !result.angles) continue;
    const collision = detectRobotCellCollisions(robot, result.angles, ROBOT_CELL_OBSTACLES)[0];
    if (collision) {
      collisionLabel ??= collision.obstacleLabel;
      continue;
    }
    return { status: "ready", angles: [...result.angles], errorMetres: result.finalError };
  }
  if (collisionLabel) return { status: "collision", angles: null, errorMetres: smallestError, obstacleLabel: collisionLabel };
  return { status: "ik-failure", angles: null, errorMetres: smallestError };
}

function carriedWorkpieceIssue(
  robot: RobotSpec,
  command: RobotCellProgramCommand & { type: "move" },
  commandIndex: number,
  plan: RobotCellMotionPlan,
  releaseAssessment?: RobotCellReleaseAssessment,
): RobotCellProgramIssue | undefined {
  if (plan.status !== "safe") return undefined;
  for (const sample of plan.samples) {
    const tcpTransform = forwardKinematics(robot, sample.jointAngles).jointTransforms.at(-1)!;
    for (const obstacle of ROBOT_CELL_OBSTACLES) {
      // Kavranmış parça, ayrılmakta olduğu fikstürden ilk örneklerde doğal olarak
      // geçer. Bu temas robot linki için zaten denetlenir; taşınan parça testine dahil edilmez.
      if (obstacle.id === "fixture") continue;
      const controlledSurfaceContact = releaseAssessment?.canRelease
        && releaseAssessment.surfaceId === obstacle.id
        && Math.hypot(sample.tcp.x - command.pose.tcp.x, sample.tcp.y - command.pose.tcp.y) <= 0.03
        && sample.tcp.z >= releaseAssessment.landingPosition.z - RELEASE_SURFACE_SNAP_METRES
        && sample.tcp.z <= releaseAssessment.landingPosition.z + WORKPIECE_COLLISION_RADIUS + 0.02;
      if (controlledSurfaceContact) continue;
      const placingOnDropSurface = (obstacle.id === "bin" || obstacle.id === "table")
        && Math.hypot(sample.tcp.x - ROBOT_CELL_WORKPIECE.drop.x, sample.tcp.y - ROBOT_CELL_WORKPIECE.drop.y) <= ROBOT_CELL_WORKPIECE.dropZoneRadiusMetres
        && sample.tcp.z >= ROBOT_CELL_WORKPIECE.drop.z - 0.002;
      if (placingOnDropSurface) continue;
      for (const offset of [-0.075, 0, 0.075]) {
        const workpiecePoint = {
          x: sample.tcp.x + tcpTransform[0][2] * offset,
          y: sample.tcp.y + tcpTransform[1][2] * offset,
          z: sample.tcp.z + tcpTransform[2][2] * offset,
        };
        const axisDistance = (axis: keyof Vec3) => Math.max(
          0,
          Math.abs(workpiecePoint[axis] - obstacle.center[axis]) - obstacle.halfSize[axis],
        );
        if (Math.hypot(axisDistance("x"), axisDistance("y"), axisDistance("z")) <= WORKPIECE_COLLISION_RADIUS) {
          return { commandId: command.id, commandIndex, reason: "collision", obstacleLabel: `${obstacle.label} (taşınan parça)` };
        }
      }
    }
  }
  return undefined;
}

export function preflightRobotCellProgram(
  robot: RobotSpec,
  startAngles: readonly number[],
  commands: readonly RobotCellProgramCommand[],
): RobotCellProgramPreflight {
  if (commands.length === 0) return { status: "empty", steps: [], firstIssue: undefined, estimatedDurationSeconds: 0 };

  const steps: RobotCellProgramStep[] = [];
  let currentAngles = [...startAngles];
  let holdingPart = false;
  let workpiecePosition: Vec3 = { ...ROBOT_CELL_WORKPIECE.start };
  let firstIssue: RobotCellProgramIssue | undefined;
  let estimatedDurationSeconds = 0;

  commands.forEach((command, commandIndex) => {
    if (firstIssue) {
      steps.push({ commandId: command.id, commandIndex, status: "not-checked", startAngles: [...currentAngles], endAngles: [...currentAngles], holdingPartAfter: holdingPart, workpiecePositionAfter: { ...workpiecePosition } });
      return;
    }

    if (command.type === "move") {
      const nextCommand = commands[commandIndex + 1];
      const releaseAssessment = holdingPart
        && nextCommand?.type === "gripper"
        && nextCommand.action === "open"
        ? assessRobotCellRelease(command.pose.tcp)
        : undefined;
      const plan = command.motion === "movej"
        ? planRobotCellMoveJ(robot, currentAngles, command.pose.jointAngles, ROBOT_CELL_OBSTACLES)
        : planRobotCellMoveL(robot, currentAngles, command.pose.tcp, ROBOT_CELL_OBSTACLES);
      const issue = issueFromPlan(command, commandIndex, plan)
        ?? (holdingPart ? carriedWorkpieceIssue(robot, command, commandIndex, plan, releaseAssessment) : undefined);
      const reachedAngles = plan.samples.at(-1)?.jointAngles ?? currentAngles;
      steps.push({
        commandId: command.id,
        commandIndex,
        status: issue ? "blocked" : "ready",
        startAngles: [...currentAngles],
        endAngles: issue ? [...currentAngles] : [...reachedAngles],
        motionPlan: plan,
        issue,
        holdingPartAfter: holdingPart,
        workpiecePositionAfter: holdingPart && !issue ? { ...plan.samples.at(-1)!.tcp } : { ...workpiecePosition },
      });
      if (issue) firstIssue = issue;
      else {
        currentAngles = [...reachedAngles];
        if (holdingPart) workpiecePosition = { ...plan.samples.at(-1)!.tcp };
        estimatedDurationSeconds += plan.estimatedDurationSeconds;
      }
      return;
    }

    const tcp = forwardKinematics(robot, currentAngles).endEffector;
    let issue: RobotCellProgramIssue | undefined;
    if (command.action === "close" && holdingPart) issue = { commandId: command.id, commandIndex, reason: "already-holding" };
    else if (command.action === "close") {
      const grip = assessRobotCellGrip(robot, currentAngles, workpiecePosition);
      if (!grip.canGrip) issue = { commandId: command.id, commandIndex, reason: "grip-zone" };
      else holdingPart = true;
    } else if (command.action === "open" && !holdingPart) {
      // Boş tutucuyu açmak gerçek kontrolörlerde geçerli ve güvenli bir komuttur.
    } else if (command.action === "open" && holdingPart) {
      const release = assessRobotCellRelease(tcp);
      if (!release.canRelease) issue = { commandId: command.id, commandIndex, reason: "release-surface" };
      else {
        workpiecePosition = { ...release.landingPosition };
        holdingPart = false;
      }
    }

    steps.push({
      commandId: command.id,
      commandIndex,
      status: issue ? "blocked" : "ready",
      startAngles: [...currentAngles],
      endAngles: [...currentAngles],
      issue,
      holdingPartAfter: holdingPart,
      workpiecePositionAfter: { ...workpiecePosition },
    });
    if (issue) firstIssue = issue;
  });

  return {
    status: firstIssue ? "blocked" : "ready",
    steps,
    firstIssue,
    estimatedDurationSeconds,
  };
}

/**
 * Kullanıcının açıkça istediği bakım işleminde yinelenen ve ön kontrolü
 * durduran satırları ayıklar. Her silmeden sonra program baştan doğrulanır;
 * böylece ilk kırmızı satırın arkasında saklanan hatalar da bulunur.
 */
export function repairRobotCellProgram(
  robot: RobotSpec,
  startAngles: readonly number[],
  commands: readonly RobotCellProgramCommand[],
): RobotCellProgramRepairResult {
  let repaired: RobotCellProgramCommand[] = [];
  const removedCommandIds: string[] = [];

  for (const command of commands) {
    const result = recordRobotCellCommandSmart(repaired, command);
    repaired = result.commands;
    if (result.change !== "added") removedCommandIds.push(command.id);
  }

  let preflight = preflightRobotCellProgram(robot, startAngles, repaired);
  while (preflight.status === "blocked" && preflight.firstIssue) {
    const rejectedIndex = preflight.firstIssue.commandIndex;
    const rejectedId = repaired[rejectedIndex]?.id;
    if (!rejectedId) break;
    const idsToRemove = new Set([rejectedId]);
    if (preflight.firstIssue.reason === "release-surface") {
      for (let index = rejectedIndex - 1; index >= 0; index -= 1) {
        const candidate = repaired[index];
        if (candidate.type === "gripper") break;
        if (candidate.type === "move" && SMART_CRITICAL_MOVE_LABELS.has(candidate.pose.label)) {
          idsToRemove.add(candidate.id);
          break;
        }
      }
    }
    removedCommandIds.push(...idsToRemove);
    repaired = repaired.filter((command) => !idsToRemove.has(command.id));
    preflight = preflightRobotCellProgram(robot, startAngles, repaired);
  }

  return { commands: repaired, removedCommandIds, preflight };
}

export function createRobotCellSampleJob(robot: RobotSpec): RobotCellProgramCommand[] {
  const radians = (degrees: readonly number[]) => degrees.map((value) => value * Math.PI / 180);
  const approach = createTaughtPose(robot, "P1", "Yaklaşma noktası", radians(ROBOT_CELL_SAMPLE_JOB.approach));
  const pick = createTaughtPose(robot, "P2", "Parçayı al", radians(ROBOT_CELL_SAMPLE_JOB.pick));
  const inspect = createTaughtPose(robot, "P3", "Güvenli geri çekil", radians(ROBOT_CELL_SAMPLE_JOB.inspect));
  const dropApproach = createTaughtPose(robot, "P4", "Bırakma tablasına yaklaş", radians(ROBOT_CELL_SAMPLE_JOB.dropApproach));
  const drop = createTaughtPose(robot, "P5", "Bırakma tablası", radians(ROBOT_CELL_SAMPLE_JOB.drop));
  return [
    { id: "C1", type: "move", motion: "movej", pose: approach },
    { id: "C2", type: "move", motion: "movel", pose: pick },
    { id: "C3", type: "gripper", action: "close" },
    { id: "C4", type: "move", motion: "movel", pose: approach },
    { id: "C5", type: "move", motion: "movej", pose: inspect },
    { id: "C6", type: "move", motion: "movej", pose: dropApproach },
    { id: "C7", type: "move", motion: "movel", pose: drop },
    { id: "C8", type: "gripper", action: "open" },
  ];
}
