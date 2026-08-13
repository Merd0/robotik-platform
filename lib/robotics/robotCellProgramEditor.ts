import { forwardKinematics, type RobotSpec } from "./kinematics";
import type { RobotCellProgramCommand } from "./robotCellProgram";

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
