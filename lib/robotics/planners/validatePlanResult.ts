import { isPointFree, isSegmentFree, type Obstacle } from "../collision";
import type { Vec3 } from "../transform";
import { distance, type PlanResult } from "./base";

export interface PlanValidationOptions {
  planar?: boolean;
  resolution?: number;
  endpointTolerance?: number;
}

export type PlanValidation = { valid: true } | { valid: false; reason: string };

const isFinitePoint = (point: Vec3) =>
  Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);

/** Worker sınırında, görselleştirilecek yolun sahne sözleşmesini gerçekten karşıladığını doğrular. */
export function validatePlanResult(
  result: PlanResult,
  start: Vec3,
  goal: Vec3,
  obstacles: readonly Obstacle[],
  options: PlanValidationOptions = {},
): PlanValidation {
  if (!result.success) {
    return result.path.length === 0
      ? { valid: true }
      : { valid: false, reason: "Başarısız plan boş olmayan yol döndürdü." };
  }

  const tolerance = options.endpointTolerance ?? 1e-6;
  const resolution = options.resolution ?? 0.02;
  if (result.path.length < 2) return { valid: false, reason: "Başarılı plan en az iki nokta içermeli." };
  if (!result.path.every(isFinitePoint)) return { valid: false, reason: "Yol sonlu olmayan koordinat içeriyor." };
  if (distance(result.path[0], start) > tolerance) return { valid: false, reason: "Yol başlangıç noktasında başlamıyor." };
  if (distance(result.path.at(-1)!, goal) > tolerance) return { valid: false, reason: "Yol hedef noktasında bitmiyor." };

  if (options.planar && result.path.some((point) => Math.abs(point.z - start.z) > tolerance)) {
    return { valid: false, reason: "Düzlemsel yol z düzleminden ayrılıyor." };
  }

  for (const point of result.path) {
    if (!isPointFree(point, obstacles)) return { valid: false, reason: "Yol engel içinden geçen nokta içeriyor." };
  }
  for (let index = 1; index < result.path.length; index++) {
    if (!isSegmentFree(result.path[index - 1], result.path[index], obstacles, resolution)) {
      return { valid: false, reason: `Yolun ${index}. segmenti çarpışıyor.` };
    }
  }
  return { valid: true };
}
