import { forwardKinematics, type RobotSpec } from "./kinematics";
import {
  createTaughtPose,
  preflightRobotCellProgram,
  type RobotCellProgramCommand,
  type RobotCellProgramPreflight,
} from "./robotCellProgram";

export const ROBOT_CELL_PROGRAM_STORAGE_KEY = "robotik-platform:robot-cell-program:v1";
const MAX_COMMANDS = 64;
const MAX_ENCODED_LENGTH = 100_000;

export interface RobotCellProgramDraft {
  version: 1;
  name: string;
  commands: RobotCellProgramCommand[];
}

export type RobotCellProgramDraftResult =
  | { ok: true; value: RobotCellProgramDraft }
  | { ok: false; error: string };

export interface RobotCellDemonstrationInput {
  robot: RobotSpec;
  startAngles: readonly number[];
  commands: readonly RobotCellProgramCommand[];
  jointTrace: readonly (readonly number[])[];
  terminalLabel: string;
  terminalAction: "open" | "close";
}

export interface RobotCellDemonstrationResult {
  commands: RobotCellProgramCommand[];
  preflight: RobotCellProgramPreflight;
  insertedIntermediateCount: number;
}

const TRACE_ANGLE_EPSILON = 0.0005;

function nextIndexedId(prefix: "C" | "P", values: readonly string[]): string {
  const maximum = values.reduce((current, value) => {
    const index = Number.parseInt(value.slice(1), 10);
    return Number.isFinite(index) ? Math.max(current, index) : current;
  }, 0);
  return `${prefix}${maximum + 1}`;
}

function sameJointPose(first: readonly number[], second: readonly number[]): boolean {
  return first.length === second.length
    && first.every((angle, index) => Math.abs(angle - second[index]) <= TRACE_ANGLE_EPSILON);
}

function validTracePose(robot: RobotSpec, angles: readonly number[]): boolean {
  return angles.length === robot.joints.length && angles.every((angle, index) =>
    Number.isFinite(angle)
    && angle >= robot.joints[index].limits.min
    && angle <= robot.joints[index].limits.max);
}

function createDemonstrationCommands(
  input: RobotCellDemonstrationInput,
  trace: readonly (readonly number[])[],
): RobotCellProgramCommand[] {
  const commands = [...input.commands];
  const commandIds = commands.map((command) => command.id);
  const poseIds = commands.flatMap((command) => command.type === "move" ? [command.pose.id] : []);

  trace.forEach((angles, index) => {
    const commandId = nextIndexedId("C", commandIds);
    const poseId = nextIndexedId("P", poseIds);
    const terminal = index === trace.length - 1;
    commands.push({
      id: commandId,
      type: "move",
      motion: "movej",
      pose: createTaughtPose(
        input.robot,
        poseId,
        terminal ? input.terminalLabel : `Otomatik güvenli ara nokta ${index + 1}`,
        angles,
      ),
    });
    commandIds.push(commandId);
    poseIds.push(poseId);
  });

  const gripperId = nextIndexedId("C", commandIds);
  commands.push({ id: gripperId, type: "gripper", action: input.terminalAction });
  return commands;
}

/**
 * Elle sürülen yolu olduğu gibi doğrular, ardından yalnızca güvenliği bozmayan
 * ara noktaları siler. Böylece program ekranı her jog'u doldurmaz; fakat taşıma
 * yolu hiçbir zaman yalnızca görsel olarak doğru son poza indirgenmez.
 */
export function appendRobotCellDemonstration(input: RobotCellDemonstrationInput): RobotCellDemonstrationResult {
  const normalizedTrace: number[][] = [];
  input.jointTrace.forEach((angles) => {
    if (!validTracePose(input.robot, angles)) return;
    if (normalizedTrace.at(-1) && sameJointPose(normalizedTrace.at(-1)!, angles)) return;
    normalizedTrace.push([...angles]);
  });

  const lastExistingMove = [...input.commands].reverse().find((command) => command.type === "move");
  const lastExistingCommand = input.commands.at(-1);
  if (lastExistingMove?.type === "move"
    && lastExistingCommand?.type === "gripper"
    && lastExistingCommand.action === input.terminalAction
    && normalizedTrace.at(-1)
    && sameJointPose(lastExistingMove.pose.jointAngles, normalizedTrace.at(-1)!)) {
    const preflight = preflightRobotCellProgram(input.robot, input.startAngles, input.commands);
    if (preflight.status === "ready") {
      return { commands: [...input.commands], preflight, insertedIntermediateCount: 0 };
    }
  }
  if (lastExistingMove?.type === "move" && normalizedTrace[0]
    && sameJointPose(lastExistingMove.pose.jointAngles, normalizedTrace[0])) {
    normalizedTrace.shift();
  } else if (input.commands.length === 0 && normalizedTrace[0]
    && sameJointPose(input.startAngles, normalizedTrace[0])) {
    normalizedTrace.shift();
  }

  if (normalizedTrace.length === 0) {
    const commands = [...input.commands];
    const commandId = nextIndexedId("C", commands.map((command) => command.id));
    commands.push({ id: commandId, type: "gripper", action: input.terminalAction });
    return {
      commands,
      preflight: preflightRobotCellProgram(input.robot, input.startAngles, commands),
      insertedIntermediateCount: 0,
    };
  }

  const directCommands = createDemonstrationCommands(input, [normalizedTrace.at(-1)!]);
  const directPreflight = preflightRobotCellProgram(input.robot, input.startAngles, directCommands);
  if (directPreflight.status === "ready") {
    return {
      commands: directCommands,
      preflight: directPreflight,
      insertedIntermediateCount: 0,
    };
  }

  let keptTrace = normalizedTrace;
  let commands = createDemonstrationCommands(input, keptTrace);
  let preflight = preflightRobotCellProgram(input.robot, input.startAngles, commands);

  if (preflight.status === "ready") {
    let index = 0;
    while (index < keptTrace.length - 1) {
      const candidateTrace = keptTrace.filter((_, candidateIndex) => candidateIndex !== index);
      const candidateCommands = createDemonstrationCommands(input, candidateTrace);
      const candidatePreflight = preflightRobotCellProgram(input.robot, input.startAngles, candidateCommands);
      if (candidatePreflight.status === "ready") {
        keptTrace = candidateTrace;
        commands = candidateCommands;
        preflight = candidatePreflight;
      } else {
        index += 1;
      }
    }
  }

  return {
    commands,
    preflight,
    insertedIntermediateCount: Math.max(0, keptTrace.length - 1),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteVec3(value: unknown): value is { x: number; y: number; z: number } {
  return isRecord(value)
    && [value.x, value.y, value.z].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
}

function isShortText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximum;
}

function validateCommand(value: unknown, robot: RobotSpec): value is RobotCellProgramCommand {
  if (!isRecord(value) || !isShortText(value.id, 24)) return false;
  if (value.type === "gripper") return value.action === "open" || value.action === "close";
  if (value.type !== "move" || (value.motion !== "movej" && value.motion !== "movel") || !isRecord(value.pose)) return false;
  if (!isShortText(value.pose.id, 24) || !isShortText(value.pose.label, 80) || !Array.isArray(value.pose.jointAngles)) return false;
  if (value.pose.jointAngles.length !== robot.joints.length || !isFiniteVec3(value.pose.tcp)) return false;
  const angles = value.pose.jointAngles;
  if (!angles.every((angle, index) => typeof angle === "number"
    && Number.isFinite(angle)
    && angle >= robot.joints[index].limits.min
    && angle <= robot.joints[index].limits.max)) return false;
  const computed = forwardKinematics(robot, angles).endEffector;
  return Math.hypot(computed.x - value.pose.tcp.x, computed.y - value.pose.tcp.y, computed.z - value.pose.tcp.z) <= 1e-6;
}

export function encodeRobotCellProgramDraft(input: { name: string; commands: readonly RobotCellProgramCommand[] }): string {
  return JSON.stringify({ version: 1, name: input.name.trim(), commands: input.commands });
}

export function decodeRobotCellProgramDraft(encoded: string, robot: RobotSpec): RobotCellProgramDraftResult {
  if (encoded.length === 0 || encoded.length > MAX_ENCODED_LENGTH) return { ok: false, error: "Program kaydı boş veya çok büyük." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(encoded);
  } catch {
    return { ok: false, error: "Program kaydı okunamadı." };
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !isShortText(parsed.name, 48) || !Array.isArray(parsed.commands)) {
    return { ok: false, error: "Program kaydının biçimi geçersiz." };
  }
  if (parsed.commands.length > MAX_COMMANDS || !parsed.commands.every((command) => validateCommand(command, robot))) {
    return { ok: false, error: "Programda geçersiz bir robot komutu var." };
  }
  const ids = parsed.commands.map((command) => command.id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: "Program komut kimlikleri benzersiz değil." };
  return {
    ok: true,
    value: {
      version: 1,
      name: parsed.name.trim(),
      commands: parsed.commands.map((command) => structuredClone(command)),
    },
  };
}

export function moveRobotCellProgramCommand(
  commands: readonly RobotCellProgramCommand[],
  commandId: string,
  direction: -1 | 1,
): RobotCellProgramCommand[] {
  const index = commands.findIndex((command) => command.id === commandId);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= commands.length) return [...commands];
  const next = [...commands];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function replaceRobotCellProgramCommand(
  commands: readonly RobotCellProgramCommand[],
  commandId: string,
  replacement: RobotCellProgramCommand,
): RobotCellProgramCommand[] {
  const index = commands.findIndex((command) => command.id === commandId);
  if (index < 0 || commands[index].type !== replacement.type) return [...commands];
  const current = commands[index];
  const normalized = current.type === "move" && replacement.type === "move"
    ? { ...replacement, id: current.id, pose: { ...replacement.pose, id: current.pose.id } }
    : { ...replacement, id: current.id };
  const next = [...commands];
  next[index] = normalized as RobotCellProgramCommand;
  return next;
}
