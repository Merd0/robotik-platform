import { getRobotById } from "./robotics/robots";
import { PLANNER_IDS, type PlannerId } from "./robotics/planners";
import type { Obstacle } from "./robotics/collision";
import type { Elbow } from "./robotics/kinematics";
import type { IkSolverMode } from "./robotics/ikSolver";

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

export type LabState = JointSlidersLabState | PlannerRaceLabState | IkTargetLabState;

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
