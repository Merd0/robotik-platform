import type { Vec3 } from "./transform";

export type ObstacleKind = "sphere" | "box";

export interface Obstacle {
  center: Vec3;
  kind: ObstacleKind;
  /** Küre için [yarıçap], kutu için [yarı_x, yarı_y, yarı_z]. */
  size: number[];
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function pointInObstacle(point: Vec3, obstacle: Obstacle): boolean {
  if (obstacle.kind === "sphere") {
    const [radius] = obstacle.size;
    return distance(point, obstacle.center) <= radius;
  }
  const [halfX, halfY, halfZ] = obstacle.size;
  return (
    Math.abs(point.x - obstacle.center.x) <= halfX &&
    Math.abs(point.y - obstacle.center.y) <= halfY &&
    Math.abs(point.z - obstacle.center.z) <= halfZ
  );
}

/** Verilen 3B nokta hiçbir engelin içinde değilse true döner. */
export function isPointFree(point: Vec3, obstacles: readonly Obstacle[]): boolean {
  return !obstacles.some((obstacle) => pointInObstacle(point, obstacle));
}

/** a ve b arasındaki doğru parçasını örnekleyip her örneğin güvenli olup olmadığını kontrol eder. */
export function isSegmentFree(
  a: Vec3,
  b: Vec3,
  obstacles: readonly Obstacle[],
  resolution = 0.05,
): boolean {
  const dist = distance(a, b);
  const steps = Math.max(1, Math.round(dist / resolution));

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const point: Vec3 = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
    if (!isPointFree(point, obstacles)) return false;
  }

  return true;
}

/** obstacles listesinden, `Planner.plan`'ın beklediği CollisionChecker'ı üretir. */
export function createCollisionChecker(obstacles: readonly Obstacle[]): (point: Vec3) => boolean {
  return (point: Vec3) => isPointFree(point, obstacles);
}
