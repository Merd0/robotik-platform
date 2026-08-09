import { describe, expect, it } from "vitest";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import {
  composePlanarTransform,
  configurationCollides,
  segmentIntersectsCircle,
  transformedFrame,
} from "./learningLabs";

describe("controlled learning lab models", () => {
  it("distinguishes translation-then-rotation from rotation-then-translation", () => {
    const angle = Math.PI / 2;
    const translatedThenRotated = transformedFrame(composePlanarTransform("translation-then-rotation", angle, 1));
    const rotatedThenTranslated = transformedFrame(composePlanarTransform("rotation-then-translation", angle, 1));

    expect(translatedThenRotated.origin.x).toBeCloseTo(0, 8);
    expect(translatedThenRotated.origin.y).toBeCloseTo(1, 8);
    expect(rotatedThenTranslated.origin.x).toBeCloseTo(1, 8);
    expect(rotatedThenTranslated.origin.y).toBeCloseTo(0, 8);
  });

  it("detects circle intersections on a segment, including endpoints", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 0, z: 0 };
    expect(segmentIntersectsCircle(a, b, { x: 0.5, y: 0.1, radius: 0.11 })).toBe(true);
    expect(segmentIntersectsCircle(a, b, { x: 1.2, y: 0, radius: 0.19 })).toBe(false);
  });

  it("maps physical link collisions into 2-DOF configuration space", () => {
    const obstacle = { x: 0.7, y: 0, radius: 0.12 };
    expect(configurationCollides(genericTwoDofRobot, [0, 0], obstacle)).toBe(true);
    expect(configurationCollides(genericTwoDofRobot, [Math.PI / 2, 0], obstacle)).toBe(false);
  });
});
