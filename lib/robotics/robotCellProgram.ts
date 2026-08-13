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

export type RobotCellProgramIssueReason = Exclude<RobotCellMotionStatus, "safe"> | "grip-zone" | "already-holding" | "not-holding";
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

export const ROBOT_CELL_WORKPIECE = {
  start: { x: 0.72, y: -0.18, z: 0.73 },
  drop: { x: 0.8, y: -0.45, z: 0.595 },
  sizeMetres: 0.12,
  gripRadiusMetres: 0.12,
  dropZoneRadiusMetres: 0.18,
} as const;

export const ROBOT_CELL_SAMPLE_JOB = {
  approach: [-12.45, 39.5, 60.21, 14.4, 146.71, 129.53],
  pick: [-13.16, 39.95, 44.79, 15.25, 163.25, 129.53],
  inspect: [10, 43, 24, 2, 98, 0],
  drop: [-22.6, 13.5, 126.8, 127.2, 63.8, 77.5],
} as const;

function distance(first: Vec3, second: Vec3): number {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function releasedWorkpiecePosition(tcp: Vec3): Vec3 {
  const overDropZone = Math.hypot(tcp.x - ROBOT_CELL_WORKPIECE.drop.x, tcp.y - ROBOT_CELL_WORKPIECE.drop.y)
    <= ROBOT_CELL_WORKPIECE.dropZoneRadiusMetres;
  return overDropZone ? { ...ROBOT_CELL_WORKPIECE.drop } : { ...tcp };
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

const WORKPIECE_COLLISION_RADIUS = 0.075;
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
  const verticalAlignment = Math.abs(tcpTransform[2][1]);
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
): RobotCellProgramIssue | undefined {
  if (plan.status !== "safe") return undefined;
  for (const sample of plan.samples) {
    const tcpTransform = forwardKinematics(robot, sample.jointAngles).jointTransforms.at(-1)!;
    for (const obstacle of ROBOT_CELL_OBSTACLES) {
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
      const plan = command.motion === "movej"
        ? planRobotCellMoveJ(robot, currentAngles, command.pose.jointAngles, ROBOT_CELL_OBSTACLES)
        : planRobotCellMoveL(robot, currentAngles, command.pose.tcp, ROBOT_CELL_OBSTACLES);
      const issue = issueFromPlan(command, commandIndex, plan) ?? (holdingPart ? carriedWorkpieceIssue(robot, command, commandIndex, plan) : undefined);
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
      workpiecePosition = releasedWorkpiecePosition(tcp);
      holdingPart = false;
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

export function createRobotCellSampleJob(robot: RobotSpec): RobotCellProgramCommand[] {
  const radians = (degrees: readonly number[]) => degrees.map((value) => value * Math.PI / 180);
  const approach = createTaughtPose(robot, "P1", "Yaklaşma noktası", radians(ROBOT_CELL_SAMPLE_JOB.approach));
  const pick = createTaughtPose(robot, "P2", "Parçayı al", radians(ROBOT_CELL_SAMPLE_JOB.pick));
  const inspect = createTaughtPose(robot, "P3", "Güvenli geri çekil", radians(ROBOT_CELL_SAMPLE_JOB.inspect));
  const drop = createTaughtPose(robot, "P4", "Kutunun üstü", radians(ROBOT_CELL_SAMPLE_JOB.drop));
  return [
    { id: "C1", type: "move", motion: "movej", pose: approach },
    { id: "C2", type: "move", motion: "movel", pose: pick },
    { id: "C3", type: "gripper", action: "close" },
    { id: "C4", type: "move", motion: "movel", pose: approach },
    { id: "C5", type: "move", motion: "movej", pose: inspect },
    { id: "C6", type: "move", motion: "movej", pose: drop },
    { id: "C7", type: "gripper", action: "open" },
  ];
}
