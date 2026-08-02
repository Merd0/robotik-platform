import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AStarPlanner } from "./astar";
import { createCollisionChecker, type Obstacle } from "../collision";
import type { Vec3 } from "../transform";

interface FixtureCase {
  name: string;
  start: [number, number, number];
  goal: [number, number, number];
  obstacles: { kind: "sphere" | "box"; center: [number, number, number]; size: number[] }[];
  options: { resolution: number; padding: number; maxExpansions: number };
  expected: {
    success: boolean;
    path: [number, number, number][];
    nodesExpanded: number;
    algorithm: string;
  };
}

interface Fixture {
  tolerance: number;
  cases: FixtureCase[];
}

const FIXTURE_PATH = path.join(process.cwd(), "reference-python", "fixtures", "astar-planner.json");

function toVec3([x, y, z]: [number, number, number]): Vec3 {
  return { x, y, z };
}

describe("AStarPlanner — Python fixture'ına karşı çapraz doğrulama", () => {
  const fixture: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  it("fixture dosyası dolu", () => {
    expect(fixture.cases.length).toBeGreaterThan(0);
  });

  fixture.cases.forEach((testCase) => {
    it(`durum "${testCase.name}": Python ile birebir aynı yol ve düğüm sayısı`, () => {
      const obstacles: Obstacle[] = testCase.obstacles.map((o) => ({
        kind: o.kind,
        center: toVec3(o.center),
        size: o.size,
      }));
      const planner = new AStarPlanner({
        resolution: testCase.options.resolution,
        padding: testCase.options.padding,
        maxExpansions: testCase.options.maxExpansions,
      });

      const result = planner.plan(
        toVec3(testCase.start),
        toVec3(testCase.goal),
        createCollisionChecker(obstacles),
      );

      expect(result.success).toBe(testCase.expected.success);
      expect(result.algorithm).toBe(testCase.expected.algorithm);
      expect(result.nodesExpanded).toBe(testCase.expected.nodesExpanded);
      expect(result.path.length).toBe(testCase.expected.path.length);

      result.path.forEach((point, i) => {
        const expectedPoint = testCase.expected.path[i];
        expect(point.x).toBeCloseTo(expectedPoint[0], 9);
        expect(point.y).toBeCloseTo(expectedPoint[1], 9);
        expect(point.z).toBeCloseTo(expectedPoint[2], 9);
      });
    });
  });
});

describe("AStarPlanner — birim testleri", () => {
  it("start veya goal engelin içindeyse hemen başarısız olur, hiç düğüm genişletmez", () => {
    const planner = new AStarPlanner();
    const obstacles: Obstacle[] = [{ kind: "sphere", center: { x: 0.2, y: 0, z: 0 }, size: [0.1] }];
    const result = planner.plan(
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: 0, z: 0 },
      createCollisionChecker(obstacles),
    );
    expect(result.success).toBe(false);
    expect(result.nodesExpanded).toBe(0);
  });

  it("boş uzayda dümdüz bir çizgi bulur", () => {
    const planner = new AStarPlanner({ resolution: 0.1 });
    const result = planner.plan({ x: 0, y: 0, z: 0 }, { x: 0.5, y: 0, z: 0 }, () => true);
    expect(result.success).toBe(true);
    expect(result.path[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ x: 0.5, y: 0, z: 0 });
  });
});
