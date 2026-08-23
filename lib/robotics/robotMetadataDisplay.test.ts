import { describe, expect, it } from "vitest";
import { formatReachMm, planarRevoluteMaxReachM } from "./robotMetadataDisplay";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { genericSixDofRobot } from "./robots/genericSixDof";
import { genericPrismaticRobot } from "./robots/genericPrismatic";

describe("planarRevoluteMaxReachM", () => {
  it("düz (alpha=0), tamamen döner bir zincirde bağlantı uzunluklarının toplamını döner", () => {
    expect(planarRevoluteMaxReachM(genericTwoDofRobot)).toBeCloseTo(1.8, 6);
  });

  it("alpha≠0 kollar taşıyan bir zincirde null döner (sum-of-a geçersiz olurdu)", () => {
    expect(planarRevoluteMaxReachM(genericSixDofRobot)).toBeNull();
  });

  it("prismatic eklem içeren bir zincirde null döner", () => {
    expect(planarRevoluteMaxReachM(genericPrismaticRobot)).toBeNull();
  });
});

describe("formatReachMm", () => {
  it("1000 mm katlarını metreye çevirir", () => {
    expect(formatReachMm(1300)).toBe("1.30 m");
    expect(formatReachMm(2000)).toBe("2 m");
  });

  it("1000 mm altını mm olarak bırakır", () => {
    expect(formatReachMm(580)).toBe("580 mm");
  });
});
