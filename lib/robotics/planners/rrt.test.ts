import { describe, expect, it } from "vitest";
import { RrtPlanner } from "./rrt";
import { RrtStarPlanner } from "./rrtStar";
import { createCollisionChecker, type Obstacle } from "../collision";
import type { Vec3 } from "../transform";
import type { CollisionChecker, Planner } from "./base";
import { pathLength } from "./base";

/** İki nokta arasını ince örnekleyip her örneği isFree ile kontrol eder (test yardımcısı). */
function segmentRespectsFree(a: Vec3, b: Vec3, isFree: CollisionChecker, resolution = 0.01): boolean {
  const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const steps = Math.max(1, Math.round(dist / resolution));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const point: Vec3 = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
    if (!isFree(point)) return false;
  }
  return true;
}

/**
 * RRT/RRT* Python fixture'ına karşı bit-bit doğrulanamaz (RNG dizisi farklı,
 * bkz. rrt.ts yorumu). Bu yüzden docs/02-mimari.md katman 3'teki "özellik
 * testleri" yaklaşımıyla doğrulanır: yol geçerliliği ve çarpışmasızlık gibi
 * değişmezler, üretilen belirli bir yol değil.
 */

// Mulberry32 — testlerde tekrar üretilebilir sonuç için tohumlanabilir basit PRNG.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START: Vec3 = { x: 0, y: 0, z: 0 };
const GOAL: Vec3 = { x: 1, y: 0.5, z: 0 };

const WALL_WITH_GAP: Obstacle[] = [
  { kind: "box", center: { x: 0.5, y: 0.8, z: 0 }, size: [0.02, 0.6, 0.6] },
  { kind: "box", center: { x: 0.5, y: -0.6, z: 0 }, size: [0.02, 0.4, 0.6] },
];

function assertValidPath(planner: Planner, isFree: CollisionChecker) {
  const result = planner.plan(START, GOAL, isFree);
  expect(result.success).toBe(true);

  expect(result.path[0]).toEqual(START);
  const last = result.path[result.path.length - 1];
  expect(last.x).toBeCloseTo(GOAL.x, 9);
  expect(last.y).toBeCloseTo(GOAL.y, 9);
  expect(last.z).toBeCloseTo(GOAL.z, 9);

  // Son adım (goal_tolerance içinde "yapıştırma") hariç her segment çarpışmasız olmalı.
  for (let i = 0; i < result.path.length - 2; i++) {
    expect(isFree(result.path[i])).toBe(true);
    expect(segmentRespectsFree(result.path[i], result.path[i + 1], isFree)).toBe(true);
  }

  expect(pathLength(result.path)).toBeGreaterThan(0);
  expect(result.nodesExpanded).toBeGreaterThan(0);
}

describe("RrtPlanner — özellik testleri", () => {
  const seeds = [1, 42, 1337];

  it.each(seeds)("boş uzayda, tohum=%i, geçerli çarpışmasız bir yol üretir", (seed) => {
    const planner = new RrtPlanner({ random: seededRandom(seed), maxIterations: 5000 });
    const result = planner.plan(START, GOAL, () => true);
    expect(result.success).toBe(true);
    expect(result.path[0]).toEqual(START);
  });

  it.each(seeds)("engelli sahnede (duvar + boşluk), tohum=%i, yolu duvardan geçirmez", (seed) => {
    const planner = new RrtPlanner({ random: seededRandom(seed), maxIterations: 8000 });
    const isFree = createCollisionChecker(WALL_WITH_GAP);
    assertValidPath(planner, isFree);
  });

  it("start engelin içindeyse hemen başarısız olur", () => {
    const obstacles: Obstacle[] = [{ kind: "sphere", center: START, size: [0.1] }];
    const planner = new RrtPlanner({ random: seededRandom(7) });
    const result = planner.plan(START, GOAL, createCollisionChecker(obstacles));
    expect(result.success).toBe(false);
    expect(result.nodesExpanded).toBe(0);
  });

  it("çok az iterasyonla uzak bir hedefe ulaşamayabilir ve başarısız döner (exception atmaz)", () => {
    const planner = new RrtPlanner({ random: seededRandom(3), maxIterations: 2 });
    const result = planner.plan(START, { x: 5, y: 5, z: 5 }, () => true);
    expect(result.success).toBe(false);
    expect(result.path).toEqual([]);
  });
});

describe("RrtStarPlanner — özellik testleri", () => {
  const seeds = [1, 42, 1337];

  it.each(seeds)(
    "engelli sahnede (duvar + boşluk), tohum=%i, geçerli çarpışmasız bir yol üretir",
    (seed) => {
      const planner = new RrtStarPlanner({ random: seededRandom(seed), maxIterations: 3000 });
      const isFree = createCollisionChecker(WALL_WITH_GAP);
      assertValidPath(planner, isFree);
    },
    15000,
  );

  it(
    "rewire ile üretilen yolun maliyeti (cost) tutarlıdır — path uzunluğu pozitif ve sonludur",
    () => {
      const planner = new RrtStarPlanner({ random: seededRandom(11), maxIterations: 3000 });
      const result = planner.plan(START, GOAL, () => true);
      expect(result.success).toBe(true);
      expect(Number.isFinite(pathLength(result.path))).toBe(true);
    },
    15000,
  );
});
