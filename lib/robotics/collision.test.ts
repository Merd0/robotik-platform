import { describe, expect, it } from "vitest";
import { isPointFree, isSegmentFree, type Obstacle } from "./collision";

describe("isPointFree", () => {
  it("engel yoksa her nokta serbesttir", () => {
    expect(isPointFree({ x: 0, y: 0, z: 0 }, [])).toBe(true);
  });

  it("küre engelinin merkezinde nokta serbest değildir", () => {
    const obstacles: Obstacle[] = [{ kind: "sphere", center: { x: 1, y: 0, z: 0 }, size: [0.5] }];
    expect(isPointFree({ x: 1, y: 0, z: 0 }, obstacles)).toBe(false);
    expect(isPointFree({ x: 1, y: 0.6, z: 0 }, obstacles)).toBe(true);
  });

  it("kutu engelinin sınırındaki nokta (tam yarı_x) serbest değildir", () => {
    const obstacles: Obstacle[] = [{ kind: "box", center: { x: 0, y: 0, z: 0 }, size: [0.2, 0.2, 0.2] }];
    expect(isPointFree({ x: 0.2, y: 0, z: 0 }, obstacles)).toBe(false);
    expect(isPointFree({ x: 0.21, y: 0, z: 0 }, obstacles)).toBe(true);
  });
});

describe("isSegmentFree", () => {
  it("iki serbest nokta arasında engel yoksa segment serbesttir", () => {
    expect(isSegmentFree({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, [])).toBe(true);
  });

  it("iki serbest nokta arasında engel varsa segment serbest değildir", () => {
    const obstacles: Obstacle[] = [{ kind: "sphere", center: { x: 0.5, y: 0, z: 0 }, size: [0.1] }];
    expect(isSegmentFree({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, obstacles)).toBe(false);
  });
});
