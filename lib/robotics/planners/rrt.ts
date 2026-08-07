import type { Vec3 } from "../transform";
import type { CollisionChecker, Planner, PlanResult } from "./base";
import { distance } from "./base";

export interface RrtOptions {
  /** Her adımda ağacın en fazla ne kadar uzayacağı (metre). */
  stepSize?: number;
  maxIterations?: number;
  /** Rastgele örnek yerine doğrudan hedefin seçilme olasılığı. */
  goalBias?: number;
  goalTolerance?: number;
  /** Örnekleme kutusunun start/goal kutusunun dışına taşma payı. */
  workspaceMargin?: number;
  segmentResolution?: number;
  /**
   * Düzlemsel planlama: z ekseni start.z değerinde sabitlenir.
   *
   * Neden gerekli: sahneler (PlannerRace) üstten görünen 2B bir çalışma
   * alanı çiziyor, ama planlayıcı 3B örnekliyordu. Engeller z ekseninde
   * sınırlı olduğu için yol, kullanıcının göremediği üçüncü boyuttan
   * dolaşıp engeli "delmiş" gibi görünüyordu. 2B sahnelerde bu açık
   * kapatılmalı.
   */
  planar?: boolean;
  /** [0, 1) aralığında sözde-rastgele sayı üreten fonksiyon; testlerde tohumlanabilir. */
  random?: () => number;
}

type Bounds = readonly [number, number][];

/**
 * RRT — rastgele ağaç genişletme (Rapidly-exploring Random Tree).
 * reference-python/backend/planners/rrt.py'nin TS portu (bkz. docs/02).
 *
 * Not: RNG dizisi Python'ın `random.Random` çıktısıyla bit bit eşleşmez
 * (farklı algoritma), bu yüzden bu planlayıcı Python fixture'ına karşı değil,
 * özellik testlerine (yol geçerliliği, çarpışmasızlık) karşı doğrulanır —
 * bkz. docs/02-mimari.md "Doğrulama stratejisi" katman 3.
 */
export class RrtPlanner implements Planner {
  name = "rrt";
  protected stepSize: number;
  protected maxIterations: number;
  protected goalBias: number;
  protected goalTolerance: number;
  protected workspaceMargin: number;
  protected segmentResolution: number;
  protected planar: boolean;
  protected random: () => number;

  constructor(options: RrtOptions = {}) {
    this.stepSize = options.stepSize ?? 0.1;
    this.maxIterations = options.maxIterations ?? 3000;
    this.goalBias = options.goalBias ?? 0.1;
    this.goalTolerance = options.goalTolerance ?? 0.05;
    this.workspaceMargin = options.workspaceMargin ?? 0.3;
    this.segmentResolution = options.segmentResolution ?? 0.02;
    this.planar = options.planar ?? false;
    this.random = options.random ?? Math.random;
  }

  protected workspaceBounds(start: Vec3, goal: Vec3): Bounds {
    const axes: (keyof Vec3)[] = ["x", "y", "z"];
    return axes.map((axis) => {
      // Düzlemsel modda z hiç örneklenmez: aralık start.z'de kapatılır.
      if (this.planar && axis === "z") return [start.z, start.z] as const;
      const low = Math.min(start[axis], goal[axis]) - this.workspaceMargin;
      const high = Math.max(start[axis], goal[axis]) + this.workspaceMargin;
      return [low, high] as const;
    }) as Bounds;
  }

  protected sample(bounds: Bounds): Vec3 {
    return {
      x: bounds[0][0] + this.random() * (bounds[0][1] - bounds[0][0]),
      y: bounds[1][0] + this.random() * (bounds[1][1] - bounds[1][0]),
      z: bounds[2][0] + this.random() * (bounds[2][1] - bounds[2][0]),
    };
  }

  protected nearest(nodes: readonly Vec3[], point: Vec3): Vec3 {
    let best = nodes[0];
    let bestDist = distance(best, point);
    for (let i = 1; i < nodes.length; i++) {
      const d = distance(nodes[i], point);
      if (d < bestDist) {
        best = nodes[i];
        bestDist = d;
      }
    }
    return best;
  }

  protected steer(origin: Vec3, target: Vec3): Vec3 {
    const dist = distance(origin, target);
    if (dist <= this.stepSize) return target;
    const ratio = this.stepSize / dist;
    return {
      x: origin.x + (target.x - origin.x) * ratio,
      y: origin.y + (target.y - origin.y) * ratio,
      z: origin.z + (target.z - origin.z) * ratio,
    };
  }

  protected segmentFree(a: Vec3, b: Vec3, isFree: CollisionChecker): boolean {
    const dist = distance(a, b);
    // ceil — bkz. collision.ts isSegmentFree: asagi yuvarlama ince engelleri atlıyordu.
    const steps = Math.max(1, Math.ceil(dist / this.segmentResolution));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const point: Vec3 = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
      if (!isFree(point)) return false;
    }
    return true;
  }

  /** parent zincirini end'den köke doğru izler; end goal değilse sona goal'i ekler. */
  protected buildPath(parent: Map<Vec3, Vec3 | null>, endNode: Vec3, goal: Vec3): Vec3[] {
    const nodes: Vec3[] = [];
    let current: Vec3 | null = endNode;
    while (current !== null) {
      nodes.push(current);
      current = parent.get(current) ?? null;
    }
    nodes.reverse();
    if (endNode !== goal) nodes.push(goal);
    return nodes;
  }

  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult {
    const startedAt = Date.now();
    if (!isFree(start) || !isFree(goal)) {
      return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded: 0, algorithm: this.name };
    }

    const bounds = this.workspaceBounds(start, goal);
    const nodes: Vec3[] = [start];
    const parent = new Map<Vec3, Vec3 | null>([[start, null]]);
    let nodesExpanded = 0;

    for (let i = 0; i < this.maxIterations; i++) {
      nodesExpanded++;
      const sample = this.random() < this.goalBias ? goal : this.sample(bounds);
      const nearest = this.nearest(nodes, sample);
      const newPoint = this.steer(nearest, sample);

      if (parent.has(newPoint)) continue;
      if (!isFree(newPoint) || !this.segmentFree(nearest, newPoint, isFree)) continue;

      nodes.push(newPoint);
      parent.set(newPoint, nearest);

      // Hedefe yeterince yaklaşmak tek başına yetmez: son sıçrama
      // (newPoint → goal) da çarpışmasız olmalı. Aksi hâlde goalTolerance
      // kadar uzunlukta, hiç kontrol edilmemiş bir segment yola ekleniyor
      // ve engelin içinden geçen bir yol "başarılı" dönebiliyordu.
      if (distance(newPoint, goal) <= this.goalTolerance) {
        if (newPoint === goal || this.segmentFree(newPoint, goal, isFree)) {
          const path = this.buildPath(parent, newPoint, goal);
          return { success: true, path, elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
        }
      }
    }

    return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
  }
}
