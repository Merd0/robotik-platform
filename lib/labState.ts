import { getRobotById } from "./robotics/robots";
import { PLANNER_IDS, type PlannerId } from "./robotics/planners";
import type { Obstacle } from "./robotics/collision";
import type { Elbow, RobotSpec } from "./robotics/kinematics";
import type { IkSolverMode } from "./robotics/ikSolver";
import { createCustomRobotSpec, type CustomRobotDefinition } from "./robotics/customRobot";
import { MAX_SCAN_ROWS, MIN_SCAN_ROWS, SCAN_PATH_COLUMNS } from "./scanPath";
import type { Block } from "./robotics/blockProgram";
import { evaluateTask, ROBOT_TASKS, withLayoutChange, type TaskSpec } from "./robotSelection";

const CUSTOM_ROBOT_MAX_SHARED_WAYPOINTS = 32;

/**
 * Sprint 2 "Kanıt Dikey Dilimi" — sürümlü, paylaşılabilir laboratuvar state'i.
 *
 * Amaç: bir laboratuvarın tam durumunu (eklem açıları, engel düzeni, hedef,
 * seed) kompakt ve URL fragment'ına yazılabilir bir dizeye kodlamak. Bu
 * sprintte YALNIZCA encode/decode/validate — URL'e yazma, "paylaş" düğmesi
 * veya sayfa yükleme entegrasyonu YOK (bkz. docs/03).
 *
 * Taşınabilirlik: bu modül bilinçli olarak `Buffer` kullanmaz (Node'a özel,
 * tarayıcıda yok). `TextEncoder`/`TextDecoder` hem Node hem tarayıcıda var —
 * `lib/robotics/`'teki "window/document asla girmez" disiplininin burada
 * karşılığı "yalnız Node'a özel API asla girmez".
 *
 * Sürümleme: her state türü kendi `version` alanını taşır. Bilinmeyen/ileri
 * bir sürüm görülürse decode açık bir hatayla reddeder — sessizce yanlış
 * yorumlamaz.
 */

export interface JointSlidersLabState {
  kind: "joint-sliders";
  version: 1;
  robotId: string;
  /** Radyan/metre — eklem sırasına göre (revolute: radyan, prismatic: metre). */
  jointAngles: number[];
}

export interface PlannerRaceLabState {
  kind: "planner-race";
  version: 1;
  extent: number;
  obstacles: Obstacle[];
  seed: number;
  algorithms: PlannerId[];
}

export interface IkTargetLabState {
  kind: "ik-target";
  version: 1;
  robotId: string;
  target: { x: number; y: number };
  elbow: Elbow;
  solver: IkSolverMode;
}

export const MAX_SHAREABLE_CODE_LENGTH = 8_000;

export interface CodeRunnerLabState {
  kind: "code-runner";
  version: 1;
  /** Robot kullanmayan saf Python örneklerinde null. */
  robotId: string | null;
  code: string;
}

export const MAX_SIGNAL_TIMELINE_SIGNALS = 12;
export const MAX_SIGNAL_TIMELINE_STEPS = 32;

export interface SignalTimelineLabState {
  kind: "signal-timeline";
  version: 1;
  signals: string[];
  steps: number;
  pattern: boolean[][];
}

export interface SafetyZoneLabState {
  kind: "safety-zone";
  version: 1;
  mode: "bolge" | "mesafe" | "hesap";
  distance: number;
  robotSpeed: number;
  brakingTime: number;
}

export interface PixelToWorldLabState {
  kind: "pixel-to-world";
  version: 1;
  adjustableCalibration: boolean;
  allowPerspectiveDistortion: boolean;
  calibration: number;
  selected: { col: number; row: number } | null;
  showDistortion: boolean;
}

export interface JacobianVizLabState {
  kind: "jacobian-viz";
  version: 1;
  robotId: string;
  jointAngles: number[];
}

export interface ScanPathLabState {
  kind: "scan-path";
  version: 1;
  adjustableRows: boolean;
  rows: number;
  visited: string[];
}

export interface BlockEditorLabState {
  kind: "block-editor";
  version: 1;
  robotId: string;
  allowedBlocks: Block["type"][];
  task: "sequence" | "condition" | null;
  blocks: Block[];
  engelVar: boolean;
}

export interface ThresholdViewerLabState {
  kind: "threshold-viewer";
  version: 1;
  theme: "lise" | "universite";
  threshold: number;
}

export interface TransformOrderLabState {
  kind: "transform-order";
  version: 1;
  order: "rotation-then-translation" | "translation-then-rotation";
  angleDegrees: number;
  prediction: "x" | "y" | null;
  revealed: boolean;
}

export interface DlsTraceLabState {
  kind: "dls-trace";
  version: 1;
  targetX: number;
  targetY: number;
  damping: number;
  solved: boolean;
  step: number;
}

export interface CspaceLabState {
  kind: "cspace";
  version: 1;
  q1: number;
  q2: number;
  observed: { safe: boolean; collision: boolean };
}

export interface RobotSelectionLabState {
  kind: "robot-selection";
  version: 1;
  taskId: TaskSpec["id"];
  layoutChangesOften: boolean;
  selectedId: string | null;
  evidenceKeys: string[];
  rationale: string;
  submitted: boolean;
  attempts: number;
}

export interface FourLensTraceLabState {
  kind: "four-lens-trace";
  version: 1;
  activeLens: "scene" | "matrix" | "graph" | "code";
  prediction: "increase" | "decrease" | null;
  running: boolean;
  sampleIndex: number;
  assessed: boolean;
}

export interface CustomRobotLabState {
  kind: "custom-robot";
  version: 1;
  definition: CustomRobotDefinition;
  /** Radyan cinsinden, tanımdaki eklem sırasıyla. */
  jointAngles: number[];
  target: { x: number; y: number };
  /** İsteğe bağlı teach-by-demonstration programı; eski v1 bağlantılarıyla geriye uyumludur. */
  program?: {
    waypoints: number[][];
    speedScale: number;
  };
}

export type LabState =
  | JointSlidersLabState
  | PlannerRaceLabState
  | IkTargetLabState
  | CodeRunnerLabState
  | SignalTimelineLabState
  | SafetyZoneLabState
  | PixelToWorldLabState
  | JacobianVizLabState
  | ScanPathLabState
  | BlockEditorLabState
  | ThresholdViewerLabState
  | TransformOrderLabState
  | DlsTraceLabState
  | CspaceLabState
  | RobotSelectionLabState
  | FourLensTraceLabState
  | CustomRobotLabState;

export type LabStateDecodeResult = { ok: true; state: LabState } | { ok: false; error: string };

const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToBase64Url(bytes: Uint8Array): string {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    output += BASE64URL_ALPHABET[b0 >> 2];
    output += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    output += b1 === undefined ? "" : BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    output += b2 === undefined ? "" : BASE64URL_ALPHABET[b2 & 0x3f];
  }
  return output;
}

function base64UrlToBytes(encoded: string): Uint8Array | null {
  if (!/^[A-Za-z0-9\-_]*$/.test(encoded)) return null;
  const lookup = new Map(BASE64URL_ALPHABET.split("").map((char, index) => [char, index]));
  const bytes: number[] = [];
  let buffer = 0;
  let bitsInBuffer = 0;
  for (const char of encoded) {
    const value = lookup.get(char);
    if (value === undefined) return null;
    buffer = (buffer << 6) | value;
    bitsInBuffer += 6;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      bytes.push((buffer >> bitsInBuffer) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/** Bir laboratuvar state'ini kompakt, URL fragment'ına yazılabilir bir dizeye kodlar. */
export function encodeLabState(state: LabState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPoint2(value: unknown): value is { x: number; y: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    isFiniteNumber((value as { x?: unknown }).x) &&
    isFiniteNumber((value as { y?: unknown }).y)
  );
}

function isPoint3(value: unknown): value is { x: number; y: number; z: number } {
  return isPoint2(value) && isFiniteNumber((value as { z?: unknown }).z);
}

function parseCustomRobotDefinitionShape(value: unknown): CustomRobotDefinition | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.name !== "string" || !Array.isArray(record.joints)) return null;
  const joints: CustomRobotDefinition["joints"] = [];
  for (const valueJoint of record.joints) {
    if (typeof valueJoint !== "object" || valueJoint === null) return null;
    const joint = valueJoint as Record<string, unknown>;
    if (
      joint.type !== "revolute" ||
      !isFiniteNumber(joint.linkLength) ||
      !isFiniteNumber(joint.minDegrees) ||
      !isFiniteNumber(joint.maxDegrees)
    ) return null;
    joints.push({
      type: "revolute",
      linkLength: joint.linkLength,
      minDegrees: joint.minDegrees,
      maxDegrees: joint.maxDegrees,
    });
  }
  return { name: record.name, joints };
}

const BLOCK_TYPES: readonly Block["type"][] = ["move", "repeat", "if"];
const MAX_BLOCK_COUNT = 100;
const MAX_BLOCK_DEPTH = 8;

function parseBlocks(
  value: unknown,
  depth = 0,
  counter: { count: number } = { count: 0 },
): Block[] | null {
  if (!Array.isArray(value) || depth > MAX_BLOCK_DEPTH) return null;
  const parsed: Block[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const block = item as Record<string, unknown>;
    if (typeof block.id !== "string" || !block.id || block.id.length > 80) return null;
    counter.count += 1;
    if (counter.count > MAX_BLOCK_COUNT) return null;
    if (block.type === "move") {
      if (typeof block.joint !== "number" || !Number.isSafeInteger(block.joint) || !isFiniteNumber(block.degrees)) return null;
      parsed.push({ id: block.id, type: "move", joint: block.joint, degrees: block.degrees });
    } else if (block.type === "repeat") {
      if (typeof block.times !== "number" || !Number.isSafeInteger(block.times) || block.times < 1 || block.times > 20) return null;
      const body = parseBlocks(block.body, depth + 1, counter);
      if (!body) return null;
      parsed.push({ id: block.id, type: "repeat", times: block.times, body });
    } else if (block.type === "if") {
      const body = parseBlocks(block.body, depth + 1, counter);
      const elseBody = parseBlocks(block.elseBody, depth + 1, counter);
      if (!body || !elseBody) return null;
      parsed.push({ id: block.id, type: "if", body, elseBody });
    } else {
      return null;
    }
  }
  return parsed;
}

/** Yalnız BİÇİM denetimi (tip/şekil) — fiziksel geçerlilik `validateLabState`'te. */
function parseStateShape(value: unknown): LabStateDecodeResult {
  if (typeof value !== "object" || value === null) return { ok: false, error: "state bir obje değil" };
  const record = value as Record<string, unknown>;

  if (record.kind === "joint-sliders") {
    if (record.version !== 1) return { ok: false, error: `joint-sliders: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.robotId !== "string" || !record.robotId) return { ok: false, error: "joint-sliders: robotId eksik" };
    if (!Array.isArray(record.jointAngles) || !record.jointAngles.every(isFiniteNumber)) {
      return { ok: false, error: "joint-sliders: jointAngles sonlu sayı dizisi olmalı" };
    }
    return { ok: true, state: { kind: "joint-sliders", version: 1, robotId: record.robotId, jointAngles: record.jointAngles } };
  }

  if (record.kind === "planner-race") {
    if (record.version !== 1) return { ok: false, error: `planner-race: desteklenmeyen sürüm ${String(record.version)}` };
    if (!isFiniteNumber(record.extent) || record.extent <= 0) return { ok: false, error: "planner-race: extent pozitif sonlu sayı olmalı" };
    if (typeof record.seed !== "number" || !Number.isSafeInteger(record.seed)) {
      return { ok: false, error: "planner-race: seed güvenli bir tam sayı olmalı" };
    }
    if (!Array.isArray(record.algorithms) || record.algorithms.length === 0) {
      return { ok: false, error: "planner-race: algorithms boş olamaz" };
    }
    if (!Array.isArray(record.obstacles)) return { ok: false, error: "planner-race: obstacles dizi olmalı" };
    for (const obstacle of record.obstacles) {
      if (typeof obstacle !== "object" || obstacle === null) return { ok: false, error: "planner-race: geçersiz engel" };
      const o = obstacle as Record<string, unknown>;
      if (o.kind !== "sphere" && o.kind !== "box") return { ok: false, error: "planner-race: engel türü sphere/box olmalı" };
      if (!isPoint3(o.center)) return { ok: false, error: "planner-race: engel merkezi sonlu (x,y,z) olmalı" };
      if (!Array.isArray(o.size) || o.size.length === 0 || !o.size.every(isFiniteNumber)) {
        return { ok: false, error: "planner-race: engel boyutu sonlu sayı dizisi olmalı" };
      }
    }
    return {
      ok: true,
      state: {
        kind: "planner-race",
        version: 1,
        extent: record.extent,
        seed: record.seed,
        algorithms: record.algorithms as PlannerId[],
        obstacles: record.obstacles as PlannerRaceLabState["obstacles"],
      },
    };
  }

  if (record.kind === "ik-target") {
    if (record.version !== 1) return { ok: false, error: `ik-target: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.robotId !== "string" || !record.robotId) return { ok: false, error: "ik-target: robotId eksik" };
    if (!isPoint2(record.target)) return { ok: false, error: "ik-target: target sonlu (x,y) olmalı" };
    if (record.elbow !== "up" && record.elbow !== "down") return { ok: false, error: "ik-target: elbow up/down olmalı" };
    if (record.solver !== "auto" && record.solver !== "analytical" && record.solver !== "dls") {
      return { ok: false, error: "ik-target: solver auto/analytical/dls olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "ik-target",
        version: 1,
        robotId: record.robotId,
        target: record.target,
        elbow: record.elbow,
        solver: record.solver,
      },
    };
  }

  if (record.kind === "code-runner") {
    if (record.version !== 1) return { ok: false, error: `code-runner: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.robotId !== null && (typeof record.robotId !== "string" || !record.robotId)) {
      return { ok: false, error: "code-runner: robotId null veya dolu string olmalı" };
    }
    if (typeof record.code !== "string") return { ok: false, error: "code-runner: code string olmalı" };
    return {
      ok: true,
      state: { kind: "code-runner", version: 1, robotId: record.robotId, code: record.code },
    };
  }

  if (record.kind === "signal-timeline") {
    if (record.version !== 1) return { ok: false, error: `signal-timeline: desteklenmeyen sürüm ${String(record.version)}` };
    if (!Array.isArray(record.signals) || !record.signals.every((signal) => typeof signal === "string" && signal.length > 0)) {
      return { ok: false, error: "signal-timeline: signals dolu string dizisi olmalı" };
    }
    if (typeof record.steps !== "number" || !Number.isSafeInteger(record.steps)) {
      return { ok: false, error: "signal-timeline: steps güvenli tam sayı olmalı" };
    }
    if (!Array.isArray(record.pattern) || !record.pattern.every(
      (row) => Array.isArray(row) && row.every((cell) => typeof cell === "boolean"),
    )) {
      return { ok: false, error: "signal-timeline: pattern boolean matris olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "signal-timeline",
        version: 1,
        signals: record.signals,
        steps: record.steps,
        pattern: record.pattern,
      },
    };
  }

  if (record.kind === "safety-zone") {
    if (record.version !== 1) return { ok: false, error: `safety-zone: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.mode !== "bolge" && record.mode !== "mesafe" && record.mode !== "hesap") {
      return { ok: false, error: "safety-zone: mode bolge/mesafe/hesap olmalı" };
    }
    if (!isFiniteNumber(record.distance) || !isFiniteNumber(record.robotSpeed) || !isFiniteNumber(record.brakingTime)) {
      return { ok: false, error: "safety-zone: sayısal alanlar sonlu olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "safety-zone",
        version: 1,
        mode: record.mode,
        distance: record.distance,
        robotSpeed: record.robotSpeed,
        brakingTime: record.brakingTime,
      },
    };
  }

  if (record.kind === "pixel-to-world") {
    if (record.version !== 1) return { ok: false, error: `pixel-to-world: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.adjustableCalibration !== "boolean" || typeof record.allowPerspectiveDistortion !== "boolean") {
      return { ok: false, error: "pixel-to-world: özellik bayrakları boolean olmalı" };
    }
    if (!isFiniteNumber(record.calibration) || typeof record.showDistortion !== "boolean") {
      return { ok: false, error: "pixel-to-world: calibration sonlu sayı, showDistortion boolean olmalı" };
    }
    if (record.selected !== null && (
      typeof record.selected !== "object" ||
      !isFiniteNumber((record.selected as { col?: unknown }).col) ||
      !isFiniteNumber((record.selected as { row?: unknown }).row)
    )) {
      return { ok: false, error: "pixel-to-world: selected null veya sonlu col/row olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "pixel-to-world",
        version: 1,
        adjustableCalibration: record.adjustableCalibration,
        allowPerspectiveDistortion: record.allowPerspectiveDistortion,
        calibration: record.calibration,
        selected: record.selected as PixelToWorldLabState["selected"],
        showDistortion: record.showDistortion,
      },
    };
  }

  if (record.kind === "jacobian-viz") {
    if (record.version !== 1) return { ok: false, error: `jacobian-viz: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.robotId !== "string" || !record.robotId) return { ok: false, error: "jacobian-viz: robotId eksik" };
    if (!Array.isArray(record.jointAngles) || !record.jointAngles.every(isFiniteNumber)) {
      return { ok: false, error: "jacobian-viz: jointAngles sonlu sayı dizisi olmalı" };
    }
    return {
      ok: true,
      state: { kind: "jacobian-viz", version: 1, robotId: record.robotId, jointAngles: record.jointAngles },
    };
  }

  if (record.kind === "scan-path") {
    if (record.version !== 1) return { ok: false, error: `scan-path: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.adjustableRows !== "boolean") return { ok: false, error: "scan-path: adjustableRows boolean olmalı" };
    if (typeof record.rows !== "number" || !Number.isSafeInteger(record.rows)) {
      return { ok: false, error: "scan-path: rows güvenli tam sayı olmalı" };
    }
    if (!Array.isArray(record.visited) || !record.visited.every((key) => typeof key === "string")) {
      return { ok: false, error: "scan-path: visited string dizisi olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "scan-path",
        version: 1,
        adjustableRows: record.adjustableRows,
        rows: record.rows,
        visited: record.visited,
      },
    };
  }

  if (record.kind === "block-editor") {
    if (record.version !== 1) return { ok: false, error: `block-editor: desteklenmeyen sürüm ${String(record.version)}` };
    if (typeof record.robotId !== "string" || !record.robotId) return { ok: false, error: "block-editor: robotId eksik" };
    if (!Array.isArray(record.allowedBlocks) || !record.allowedBlocks.every(
      (type) => typeof type === "string" && BLOCK_TYPES.includes(type as Block["type"]),
    )) return { ok: false, error: "block-editor: allowedBlocks geçersiz" };
    if (record.task !== null && record.task !== "sequence" && record.task !== "condition") {
      return { ok: false, error: "block-editor: task sequence/condition/null olmalı" };
    }
    if (typeof record.engelVar !== "boolean") return { ok: false, error: "block-editor: engelVar boolean olmalı" };
    const blocks = parseBlocks(record.blocks);
    if (!blocks) return { ok: false, error: "block-editor: blocks ağacı geçersiz veya sınırı aşıyor" };
    return {
      ok: true,
      state: {
        kind: "block-editor",
        version: 1,
        robotId: record.robotId,
        allowedBlocks: record.allowedBlocks as Block["type"][],
        task: record.task,
        blocks,
        engelVar: record.engelVar,
      },
    };
  }

  if (record.kind === "threshold-viewer") {
    if (record.version !== 1) return { ok: false, error: `threshold-viewer: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.theme !== "lise" && record.theme !== "universite") {
      return { ok: false, error: "threshold-viewer: theme lise/universite olmalı" };
    }
    if (typeof record.threshold !== "number" || !Number.isSafeInteger(record.threshold)) {
      return { ok: false, error: "threshold-viewer: threshold güvenli tam sayı olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "threshold-viewer",
        version: 1,
        theme: record.theme,
        threshold: record.threshold,
      },
    };
  }

  if (record.kind === "transform-order") {
    if (record.version !== 1) return { ok: false, error: `transform-order: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.order !== "rotation-then-translation" && record.order !== "translation-then-rotation") {
      return { ok: false, error: "transform-order: order geçersiz" };
    }
    if (typeof record.angleDegrees !== "number" || !Number.isSafeInteger(record.angleDegrees)) {
      return { ok: false, error: "transform-order: angleDegrees güvenli tam sayı olmalı" };
    }
    if (record.prediction !== null && record.prediction !== "x" && record.prediction !== "y") {
      return { ok: false, error: "transform-order: prediction x/y/null olmalı" };
    }
    if (typeof record.revealed !== "boolean") return { ok: false, error: "transform-order: revealed boolean olmalı" };
    return {
      ok: true,
      state: {
        kind: "transform-order",
        version: 1,
        order: record.order,
        angleDegrees: record.angleDegrees,
        prediction: record.prediction,
        revealed: record.revealed,
      },
    };
  }

  if (record.kind === "dls-trace") {
    if (record.version !== 1) return { ok: false, error: `dls-trace: desteklenmeyen sürüm ${String(record.version)}` };
    if (!isFiniteNumber(record.targetX) || !isFiniteNumber(record.targetY) || !isFiniteNumber(record.damping)) {
      return { ok: false, error: "dls-trace: hedef ve damping sonlu sayı olmalı" };
    }
    if (typeof record.solved !== "boolean") return { ok: false, error: "dls-trace: solved boolean olmalı" };
    if (typeof record.step !== "number" || !Number.isSafeInteger(record.step)) {
      return { ok: false, error: "dls-trace: step güvenli tam sayı olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "dls-trace",
        version: 1,
        targetX: record.targetX,
        targetY: record.targetY,
        damping: record.damping,
        solved: record.solved,
        step: record.step,
      },
    };
  }

  if (record.kind === "cspace") {
    if (record.version !== 1) return { ok: false, error: `cspace: desteklenmeyen sürüm ${String(record.version)}` };
    if (
      typeof record.q1 !== "number" || !Number.isSafeInteger(record.q1) ||
      typeof record.q2 !== "number" || !Number.isSafeInteger(record.q2)
    ) return { ok: false, error: "cspace: q1/q2 güvenli tam sayı olmalı" };
    if (
      typeof record.observed !== "object" || record.observed === null ||
      typeof (record.observed as { safe?: unknown }).safe !== "boolean" ||
      typeof (record.observed as { collision?: unknown }).collision !== "boolean"
    ) return { ok: false, error: "cspace: observed safe/collision boolean olmalı" };
    return {
      ok: true,
      state: {
        kind: "cspace",
        version: 1,
        q1: record.q1,
        q2: record.q2,
        observed: record.observed as CspaceLabState["observed"],
      },
    };
  }

  if (record.kind === "four-lens-trace") {
    if (record.version !== 1) return { ok: false, error: `four-lens-trace: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.activeLens !== "scene" && record.activeLens !== "matrix" && record.activeLens !== "graph" && record.activeLens !== "code") {
      return { ok: false, error: "four-lens-trace: activeLens geçersiz" };
    }
    if (record.prediction !== null && record.prediction !== "increase" && record.prediction !== "decrease") {
      return { ok: false, error: "four-lens-trace: prediction geçersiz" };
    }
    if (typeof record.running !== "boolean" || typeof record.assessed !== "boolean") {
      return { ok: false, error: "four-lens-trace: running ve assessed boolean olmalı" };
    }
    if (typeof record.sampleIndex !== "number" || !Number.isSafeInteger(record.sampleIndex)) {
      return { ok: false, error: "four-lens-trace: sampleIndex güvenli tam sayı olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "four-lens-trace",
        version: 1,
        activeLens: record.activeLens,
        prediction: record.prediction,
        running: record.running,
        sampleIndex: record.sampleIndex,
        assessed: record.assessed,
      },
    };
  }

  if (record.kind === "custom-robot") {
    if (record.version !== 1) return { ok: false, error: `custom-robot: desteklenmeyen sürüm ${String(record.version)}` };
    const definition = parseCustomRobotDefinitionShape(record.definition);
    if (!definition) return { ok: false, error: "custom-robot: robot tanımı biçimsel olarak geçersiz" };
    if (!Array.isArray(record.jointAngles) || !record.jointAngles.every(isFiniteNumber)) {
      return { ok: false, error: "custom-robot: jointAngles sonlu sayı dizisi olmalı" };
    }
    if (!isPoint2(record.target)) return { ok: false, error: "custom-robot: target sonlu (x,y) olmalı" };
    let program: CustomRobotLabState["program"];
    if (record.program !== undefined) {
      if (typeof record.program !== "object" || record.program === null) {
        return { ok: false, error: "custom-robot: program bir obje olmalı" };
      }
      const rawProgram = record.program as Record<string, unknown>;
      if (
        !Array.isArray(rawProgram.waypoints) ||
        !rawProgram.waypoints.every(
          (waypoint) => Array.isArray(waypoint) && waypoint.every(isFiniteNumber),
        ) ||
        !isFiniteNumber(rawProgram.speedScale)
      ) {
        return { ok: false, error: "custom-robot: program yolu sonlu açı dizilerinden oluşmalı" };
      }
      program = {
        waypoints: rawProgram.waypoints.map((waypoint) => [...waypoint]),
        speedScale: rawProgram.speedScale,
      };
    }
    return {
      ok: true,
      state: {
        kind: "custom-robot",
        version: 1,
        definition,
        jointAngles: record.jointAngles,
        target: record.target,
        ...(program ? { program } : {}),
      },
    };
  }

  if (record.kind === "robot-selection") {
    if (record.version !== 1) return { ok: false, error: `robot-selection: desteklenmeyen sürüm ${String(record.version)}` };
    if (record.taskId !== "electronics" && record.taskId !== "shared-assembly" && record.taskId !== "intralogistics") {
      return { ok: false, error: "robot-selection: taskId geçersiz" };
    }
    if (typeof record.layoutChangesOften !== "boolean") return { ok: false, error: "robot-selection: layoutChangesOften boolean olmalı" };
    if (record.selectedId !== null && (typeof record.selectedId !== "string" || !record.selectedId)) {
      return { ok: false, error: "robot-selection: selectedId null veya dolu string olmalı" };
    }
    if (!Array.isArray(record.evidenceKeys) || !record.evidenceKeys.every((key) => typeof key === "string" && key.length > 0)) {
      return { ok: false, error: "robot-selection: evidenceKeys dolu string dizisi olmalı" };
    }
    if (typeof record.rationale !== "string" || typeof record.submitted !== "boolean") {
      return { ok: false, error: "robot-selection: rationale string ve submitted boolean olmalı" };
    }
    if (typeof record.attempts !== "number" || !Number.isSafeInteger(record.attempts)) {
      return { ok: false, error: "robot-selection: attempts güvenli tam sayı olmalı" };
    }
    return {
      ok: true,
      state: {
        kind: "robot-selection",
        version: 1,
        taskId: record.taskId,
        layoutChangesOften: record.layoutChangesOften,
        selectedId: record.selectedId,
        evidenceKeys: record.evidenceKeys,
        rationale: record.rationale,
        submitted: record.submitted,
        attempts: record.attempts,
      },
    };
  }

  return { ok: false, error: `bilinmeyen laboratuvar türü: ${String(record.kind)}` };
}

/**
 * Bir state'in FİZİKSEL geçerliliğini denetler — biçimi doğru ama örneğin
 * eklem açısı robotun limitlerinin dışında olabilir. Boş dizi = geçerli.
 * `getRobotById` bilinmeyen id için fırlatır; burada onu yakalayıp okunabilir
 * bir hataya çeviriyoruz (throw yerine hata listesi — "doğrulanabilir" API'nin
 * her zaman bir sonuç döndürmesi gerekir).
 */
export function validateLabState(state: LabState): string[] {
  const errors: string[] = [];

  if (state.kind === "joint-sliders") {
    let robot;
    try {
      robot = getRobotById(state.robotId);
    } catch {
      errors.push(`bilinmeyen robot id: ${state.robotId}`);
      return errors;
    }
    if (state.jointAngles.length !== robot.joints.length) {
      errors.push(`jointAngles uzunluğu (${state.jointAngles.length}) robotun eklem sayısıyla (${robot.joints.length}) eşleşmiyor`);
      return errors;
    }
    robot.joints.forEach((joint, index) => {
      const angle = state.jointAngles[index];
      if (angle < joint.limits.min || angle > joint.limits.max) {
        errors.push(`J${index + 1} değeri (${angle}) limit dışında [${joint.limits.min}, ${joint.limits.max}]`);
      }
    });
    return errors;
  }

  if (state.kind === "planner-race") {
    const half = state.extent / 2;
    for (const algorithm of state.algorithms) {
      if (!PLANNER_IDS.includes(algorithm)) errors.push(`bilinmeyen algoritma: ${algorithm}`);
    }
    state.obstacles.forEach((obstacle, index) => {
      if (Math.abs(obstacle.center.x) > half || Math.abs(obstacle.center.y) > half) {
        errors.push(`engel ${index}: merkez sahne sınırlarının (±${half}) dışında`);
      }
      if (obstacle.size.some((value) => value <= 0)) errors.push(`engel ${index}: boyut pozitif olmalı`);
    });
    return errors;
  }

  if (state.kind === "code-runner") {
    if (state.code.length > MAX_SHAREABLE_CODE_LENGTH) {
      errors.push(`kod ${MAX_SHAREABLE_CODE_LENGTH} karakter sınırını aşıyor`);
    }
    if (state.robotId !== null) {
      try {
        getRobotById(state.robotId);
      } catch {
        errors.push(`bilinmeyen robot id: ${state.robotId}`);
      }
    }
    return errors;
  }

  if (state.kind === "signal-timeline") {
    if (state.signals.length === 0 || state.signals.length > MAX_SIGNAL_TIMELINE_SIGNALS) {
      errors.push(`signals uzunluğu 1-${MAX_SIGNAL_TIMELINE_SIGNALS} arasında olmalı`);
    }
    if (state.signals.some((signal) => signal.length > 120)) errors.push("sinyal adı 120 karakteri aşamaz");
    if (state.steps < 1 || state.steps > MAX_SIGNAL_TIMELINE_STEPS) {
      errors.push(`steps 1-${MAX_SIGNAL_TIMELINE_STEPS} arasında olmalı`);
    }
    if (state.pattern.length !== state.signals.length) errors.push("pattern satır sayısı signals ile eşleşmiyor");
    if (state.pattern.some((row) => row.length !== state.steps)) errors.push("pattern satır uzunluğu steps ile eşleşmiyor");
    return errors;
  }

  if (state.kind === "safety-zone") {
    if (state.distance < 0 || state.distance > 4_000) errors.push("distance 0-4000 mm arasında olmalı");
    if (state.robotSpeed < 0 || state.robotSpeed > 2_000) errors.push("robotSpeed 0-2000 mm/s arasında olmalı");
    if (state.brakingTime < 0.05 || state.brakingTime > 1) errors.push("brakingTime 0.05-1 s arasında olmalı");
    return errors;
  }

  if (state.kind === "pixel-to-world") {
    if (state.calibration < 1 || state.calibration > 15) errors.push("calibration 1-15 mm/piksel arasında olmalı");
    if (state.showDistortion && !state.allowPerspectiveDistortion) {
      errors.push("showDistortion yalnız perspektif özelliği açıkken true olabilir");
    }
    if (state.selected) {
      if (!Number.isSafeInteger(state.selected.col) || !Number.isSafeInteger(state.selected.row)) {
        errors.push("selected col/row güvenli tam sayı olmalı");
      } else if (state.selected.col < 0 || state.selected.col > 7 || state.selected.row < 0 || state.selected.row > 7) {
        errors.push("selected col/row 0-7 arasında olmalı");
      }
    }
    return errors;
  }

  if (state.kind === "jacobian-viz") {
    let robot;
    try {
      robot = getRobotById(state.robotId);
    } catch {
      errors.push(`bilinmeyen robot id: ${state.robotId}`);
      return errors;
    }
    if (state.jointAngles.length !== robot.joints.length) {
      errors.push(`jointAngles uzunluğu (${state.jointAngles.length}) robotun eklem sayısıyla (${robot.joints.length}) eşleşmiyor`);
      return errors;
    }
    robot.joints.forEach((joint, index) => {
      const angle = state.jointAngles[index];
      if (angle < joint.limits.min || angle > joint.limits.max) {
        errors.push(`J${index + 1} değeri (${angle}) limit dışında [${joint.limits.min}, ${joint.limits.max}]`);
      }
    });
    return errors;
  }

  if (state.kind === "scan-path") {
    if (state.rows < MIN_SCAN_ROWS || state.rows > MAX_SCAN_ROWS) {
      errors.push(`rows ${MIN_SCAN_ROWS}-${MAX_SCAN_ROWS} arasında olmalı`);
    }
    if (new Set(state.visited).size !== state.visited.length) errors.push("visited yinelenen hücre içeremez");
    for (const key of state.visited) {
      const match = /^(\d+)-(\d+)$/.exec(key);
      if (!match) {
        errors.push(`geçersiz visited hücresi: ${key}`);
        continue;
      }
      const col = Number(match[1]);
      const row = Number(match[2]);
      if (col < 0 || col >= SCAN_PATH_COLUMNS || row < 0 || row >= state.rows) {
        errors.push(`visited hücresi sınır dışında: ${key}`);
      }
    }
    return errors;
  }

  if (state.kind === "block-editor") {
    const blockState = state;
    let robot: RobotSpec;
    try {
      robot = getRobotById(blockState.robotId);
    } catch {
      errors.push(`bilinmeyen robot id: ${blockState.robotId}`);
      return errors;
    }
    if (blockState.allowedBlocks.length === 0 || new Set(blockState.allowedBlocks).size !== blockState.allowedBlocks.length) {
      errors.push("allowedBlocks boş veya yinelenen olamaz");
    }
    if (blockState.task === "sequence" && !blockState.allowedBlocks.includes("move")) errors.push("sequence görevi move bloğu gerektirir");
    if (blockState.task === "condition" && !blockState.allowedBlocks.includes("if")) errors.push("condition görevi if bloğu gerektirir");
    const ids = new Set<string>();
    let blockCount = 0;
    function validateBlocks(blocks: readonly Block[], depth: number) {
      if (depth > MAX_BLOCK_DEPTH) errors.push(`blok derinliği ${MAX_BLOCK_DEPTH} sınırını aşıyor`);
      for (const block of blocks) {
        blockCount += 1;
        if (ids.has(block.id)) errors.push(`yinelenen blok id: ${block.id}`);
        ids.add(block.id);
        if (!blockState.allowedBlocks.includes(block.type)) errors.push(`izin verilmeyen blok türü: ${block.type}`);
        if (block.type === "move") {
          if (block.joint < 0 || block.joint >= robot.joints.length) {
            errors.push(`blok ${block.id}: eklem indexi sınır dışında`);
          } else {
            const radians = (block.degrees * Math.PI) / 180;
            const joint = robot.joints[block.joint];
            if (!Number.isFinite(radians) || radians < joint.limits.min || radians > joint.limits.max) {
              errors.push(`blok ${block.id}: açı eklem limiti dışında`);
            }
          }
        } else if (block.type === "repeat") {
          if (!Number.isSafeInteger(block.times) || block.times < 1 || block.times > 20) errors.push(`blok ${block.id}: tekrar 1-20 olmalı`);
          validateBlocks(block.body, depth + 1);
        } else {
          validateBlocks(block.body, depth + 1);
          validateBlocks(block.elseBody, depth + 1);
        }
      }
    }
    validateBlocks(blockState.blocks, 0);
    if (blockCount > MAX_BLOCK_COUNT) errors.push(`blok sayısı ${MAX_BLOCK_COUNT} sınırını aşıyor`);
    return errors;
  }

  if (state.kind === "threshold-viewer") {
    if (state.threshold < 0 || state.threshold > 255) errors.push("threshold 0-255 arasında olmalı");
    return errors;
  }

  if (state.kind === "transform-order") {
    if (state.angleDegrees < 0 || state.angleDegrees > 180 || state.angleDegrees % 15 !== 0) {
      errors.push("angleDegrees 0-180 arasında ve 15'in katı olmalı");
    }
    if (state.revealed && state.prediction === null) errors.push("revealed state bir prediction gerektirir");
    return errors;
  }

  if (state.kind === "dls-trace") {
    const isGridStep = (value: number, scale: number) => Math.abs(value * scale - Math.round(value * scale)) < 1e-8;
    if (state.targetX < 0.2 || state.targetX > 1.7 || !isGridStep(state.targetX, 20)) {
      errors.push("targetX 0.2-1.7 arasında ve 0.05 adımında olmalı");
    }
    if (state.targetY < -1.4 || state.targetY > 1.4 || !isGridStep(state.targetY, 20)) {
      errors.push("targetY -1.4-1.4 arasında ve 0.05 adımında olmalı");
    }
    if (state.damping < 0.005 || state.damping > 0.2 || !isGridStep(state.damping, 200)) {
      errors.push("damping 0.005-0.2 arasında ve 0.005 adımında olmalı");
    }
    if (state.step < 0 || state.step > 80) errors.push("step 0-80 arasında olmalı");
    if (!state.solved && state.step !== 0) errors.push("çalıştırılmamış state step 0 olmalı");
    return errors;
  }

  if (state.kind === "cspace") {
    for (const [name, angle] of [["q1", state.q1], ["q2", state.q2]] as const) {
      if (angle < -180 || angle > 180 || angle % 5 !== 0) {
        errors.push(`${name} -180 ile 180 arasında ve 5'in katı olmalı`);
      }
    }
    return errors;
  }

  if (state.kind === "four-lens-trace") {
    if (state.sampleIndex < 0 || state.sampleIndex > 3) errors.push("sampleIndex 0-3 arasında olmalı");
    if (!state.running && (state.sampleIndex !== 0 || state.assessed)) {
      errors.push("çalıştırılmamış state örnek 0'da ve değerlendirilmemiş olmalı");
    }
    if (state.running && state.prediction === null) errors.push("çalışan state bir prediction gerektirir");
    if (state.assessed && state.sampleIndex !== 3) errors.push("değerlendirilmiş state son örnekte olmalı");
    return errors;
  }

  if (state.kind === "custom-robot") {
    const result = createCustomRobotSpec(state.definition);
    if (!result.ok) return result.issues.map((issue) => issue.message);
    const robot = result.robot;
    if (state.jointAngles.length !== robot.joints.length) {
      errors.push(`jointAngles uzunluğu (${state.jointAngles.length}) robotun eklem sayısıyla (${robot.joints.length}) eşleşmiyor`);
      return errors;
    }
    robot.joints.forEach((joint, index) => {
      const angle = state.jointAngles[index];
      if (!Number.isFinite(angle) || angle < joint.limits.min || angle > joint.limits.max) {
        errors.push(`J${index + 1} değeri (${angle}) limit dışında [${joint.limits.min}, ${joint.limits.max}]`);
      }
    });
    const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
    if (Math.abs(state.target.x) > reach || Math.abs(state.target.y) > reach) {
      errors.push(`hedef koordinatları ±${reach} m deney alanının dışında`);
    }
    if (state.program) {
      if (state.program.waypoints.length > CUSTOM_ROBOT_MAX_SHARED_WAYPOINTS) {
        errors.push(`öğretilmiş yol en fazla ${CUSTOM_ROBOT_MAX_SHARED_WAYPOINTS} poz içerebilir`);
      }
      if (state.program.speedScale < 0.05 || state.program.speedScale > 1) {
        errors.push("program hızı %5 ile %100 arasında olmalı");
      }
      state.program.waypoints.forEach((waypoint, waypointIndex) => {
        if (waypoint.length !== robot.joints.length) {
          errors.push(`öğretilmiş poz ${waypointIndex + 1}: eklem sayısı robotla eşleşmiyor`);
          return;
        }
        waypoint.forEach((angle, jointIndex) => {
          const joint = robot.joints[jointIndex];
          if (angle < joint.limits.min || angle > joint.limits.max) {
            errors.push(`öğretilmiş poz ${waypointIndex + 1}: J${jointIndex + 1} eklem limiti dışında`);
          }
        });
      });
    }
    return errors;
  }

  if (state.kind === "robot-selection") {
    if (state.taskId !== "intralogistics" && state.layoutChangesOften) {
      errors.push("layoutChangesOften yalnız intralogistics görevinde true olabilir");
    }
    if (state.rationale.length > 4_000) errors.push("rationale 4000 karakteri aşamaz");
    if (state.attempts < 0 || state.attempts > 1_000) errors.push("attempts 0-1000 arasında olmalı");
    if (new Set(state.evidenceKeys).size !== state.evidenceKeys.length) errors.push("evidenceKeys yinelenemez");
    const baseTask = ROBOT_TASKS.find((task) => task.id === state.taskId)!;
    const task = state.taskId === "intralogistics" ? withLayoutChange(baseTask, state.layoutChangesOften) : baseTask;
    const evaluation = state.selectedId === null
      ? null
      : evaluateTask(task).find((candidate) => candidate.candidate.id === state.selectedId) ?? null;
    if (state.selectedId !== null && !evaluation) errors.push("selectedId seçili görevde aday değil");
    if (state.selectedId === null) {
      if (state.evidenceKeys.length > 0 || state.rationale.length > 0 || state.submitted) {
        errors.push("aday seçilmeden kanıt/not/submit state'i taşınamaz");
      }
      return errors;
    }
    const eligibleKeys = new Set(
      evaluation?.constraints
        .filter((constraint) => constraint.quantitative && constraint.status !== "fail")
        .map((constraint) => constraint.key) ?? [],
    );
    for (const key of state.evidenceKeys) {
      if (!eligibleKeys.has(key)) errors.push(`uygun olmayan evidence key: ${key}`);
    }
    return errors;
  }

  // ik-target
  let robot;
  try {
    robot = getRobotById(state.robotId);
  } catch {
    errors.push(`bilinmeyen robot id: ${state.robotId}`);
    return errors;
  }
  const maxReach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  const distanceFromOrigin = Math.hypot(state.target.x, state.target.y);
  if (distanceFromOrigin > maxReach + 1e-9) {
    errors.push(`hedef (${state.target.x}, ${state.target.y}) robotun erişim yarıçapının (${maxReach}) dışında`);
  }
  return errors;
}

/** Kodlanmış bir dizeyi çözer VE fiziksel olarak doğrular. Tek çağrıda tam sonuç. */
export function decodeLabState(encoded: string): LabStateDecodeResult {
  const bytes = base64UrlToBytes(encoded);
  if (!bytes) return { ok: false, error: "geçersiz base64url dizesi" };

  let json: string;
  try {
    json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: "UTF-8 olarak çözülemedi" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "geçerli JSON değil" };
  }

  const shapeResult = parseStateShape(parsed);
  if (!shapeResult.ok) return shapeResult;

  const validationErrors = validateLabState(shapeResult.state);
  if (validationErrors.length > 0) {
    return { ok: false, error: validationErrors.join("; ") };
  }
  return shapeResult;
}
