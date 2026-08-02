import type { Vec3 } from "../transform";

/**
 * docs/02-mimari.md "Değişmiş sözleşmeler" bölümündeki dondurulmuş arayüz.
 * Bu üç tip değiştirilmeden önce docs/02-mimari.md güncellenmeli.
 */
export interface PlanResult {
  success: boolean;
  path: Vec3[];
  elapsedMs: number;
  nodesExpanded: number;
  algorithm: string;
}

export type CollisionChecker = (p: Vec3) => boolean;

export interface Planner {
  name: string;
  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult;
}

/** Bir yolun toplam öklid uzunluğu. Yol yoksa (veya tek noktaysa) 0. */
export function pathLength(path: readonly Vec3[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y, path[i].z - path[i - 1].z);
  }
  return total;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
