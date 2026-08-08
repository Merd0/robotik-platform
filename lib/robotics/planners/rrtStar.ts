import type { Vec3 } from "../transform";
import type { CollisionChecker, PlanResult } from "./base";
import { distance } from "./base";
import { RrtPlanner, type RrtOptions } from "./rrt";

export interface RrtStarOptions extends RrtOptions {
  /** Yeniden bağlama (rewire) için komşu arama yarıçapı. */
  rewireRadius?: number;
}

export function propagateDescendantCosts(
  root: Vec3,
  delta: number,
  children: Map<Vec3, Set<Vec3>>,
  cost: Map<Vec3, number>,
): void {
  const pending = [root];
  while (pending.length > 0) {
    const node = pending.pop()!;
    cost.set(node, (cost.get(node) ?? 0) + delta);
    for (const child of children.get(node) ?? []) pending.push(child);
  }
}

/**
 * RRT* — komşu yeniden bağlama (rewire) ile yol maliyetini düşüren RRT
 * varyantı. reference-python/backend/planners/rrt_star.py'nin TS portu.
 * Hedefe ulaşan ilk düğümden sonra da arama devam eder; RRT'nin aksine amaç
 * sadece bir yol değil, rewire ile giderek kısalan bir yoldur.
 */
export class RrtStarPlanner extends RrtPlanner {
  name = "rrt_star";
  private rewireRadius: number;

  constructor(options: RrtStarOptions = {}) {
    super(options);
    this.rewireRadius = options.rewireRadius ?? 0.15;
  }

  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult {
    const startedAt = Date.now();
    if (!isFree(start) || !isFree(goal)) {
      return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded: 0, algorithm: this.name };
    }

    const bounds = this.workspaceBounds(start, goal);
    const nodes: Vec3[] = [start];
    const parent = new Map<Vec3, Vec3 | null>([[start, null]]);
    const children = new Map<Vec3, Set<Vec3>>([[start, new Set()]]);
    const cost = new Map<Vec3, number>([[start, 0]]);
    let nodesExpanded = 0;
    const goalCandidates: Vec3[] = [];

    for (let i = 0; i < this.maxIterations; i++) {
      nodesExpanded++;
      const sample = this.random() < this.goalBias ? goal : this.sample(bounds);
      const nearest = this.nearest(nodes, sample);
      const newPoint = this.steer(nearest, sample);

      if (cost.has(newPoint)) continue;
      if (!isFree(newPoint) || !this.segmentFree(nearest, newPoint, isFree)) continue;

      const nearby = nodes.filter((n) => distance(n, newPoint) <= this.rewireRadius);
      const neighbors = nearby.length > 0 ? nearby : [nearest];

      let bestParent = nearest;
      let bestCost = (cost.get(nearest) ?? 0) + distance(nearest, newPoint);
      for (const neighbor of neighbors) {
        const candidateCost = (cost.get(neighbor) ?? 0) + distance(neighbor, newPoint);
        if (candidateCost < bestCost && this.segmentFree(neighbor, newPoint, isFree)) {
          bestParent = neighbor;
          bestCost = candidateCost;
        }
      }

      nodes.push(newPoint);
      parent.set(newPoint, bestParent);
      cost.set(newPoint, bestCost);
      children.set(newPoint, new Set());
      children.get(bestParent)?.add(newPoint);

      for (const neighbor of neighbors) {
        if (neighbor === bestParent) continue;
        const candidateCost = bestCost + distance(newPoint, neighbor);
        if (candidateCost < (cost.get(neighbor) ?? Infinity) && this.segmentFree(newPoint, neighbor, isFree)) {
          const previousCost = cost.get(neighbor) ?? Infinity;
          const previousParent = parent.get(neighbor);
          if (previousParent) children.get(previousParent)?.delete(neighbor);
          parent.set(neighbor, newPoint);
          children.get(newPoint)?.add(neighbor);
          propagateDescendantCosts(neighbor, candidateCost - previousCost, children, cost);
        }
      }

      // RRT'deki ile aynı kural: hedefe yakın olmak yetmez, son sıçrama da
      // çarpışmasız olmalı. RRT*'de bu düğüm yalnızca aday olarak
      // saklandığı için kontrolü burada yapıyoruz — aksi hâlde kontrol
      // edilmemiş bir son segment en iyi yol olarak seçilebilirdi.
      if (distance(newPoint, goal) <= this.goalTolerance) {
        const sonSegmentGuvenli = newPoint === goal || this.segmentFree(newPoint, goal, isFree);
        if (sonSegmentGuvenli) goalCandidates.push(newPoint);
      }
    }

    const bestGoalNode = goalCandidates.reduce<Vec3 | null>((best, candidate) => {
      if (best === null) return candidate;
      const candidateCost = (cost.get(candidate) ?? Infinity) + distance(candidate, goal);
      const bestCost = (cost.get(best) ?? Infinity) + distance(best, goal);
      return candidateCost < bestCost ? candidate : best;
    }, null);

    if (bestGoalNode === null) {
      return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
    }

    const path = this.buildPath(parent, bestGoalNode, goal);
    return { success: true, path, elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
  }
}
