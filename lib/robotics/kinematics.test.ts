import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { forwardKinematics } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";

interface FixtureCase {
  jointAnglesRad: [number, number];
  joint1Position: { x: number; y: number; z: number };
  endEffector: { x: number; y: number; z: number };
}

interface Fixture {
  robot: string;
  tolerance: number;
  cases: FixtureCase[];
}

const FIXTURE_PATH = path.join(
  process.cwd(),
  "reference-python",
  "fixtures",
  "generic-2dof-fk.json",
);

describe("forwardKinematics — birim testi (elle çözülebilir durum)", () => {
  it("her iki eklem 0 iken uç nokta a1+a2 kadar x ekseninde olur", () => {
    const result = forwardKinematics(genericTwoDofRobot, [0, 0]);
    expect(result.endEffector.x).toBeCloseTo(1.8, 6);
    expect(result.endEffector.y).toBeCloseTo(0, 6);
  });

  it("90 derece + 0 derecede uç nokta y ekseninde olur", () => {
    const result = forwardKinematics(genericTwoDofRobot, [Math.PI / 2, 0]);
    expect(result.endEffector.x).toBeCloseTo(0, 6);
    expect(result.endEffector.y).toBeCloseTo(1.8, 6);
  });
});

describe("forwardKinematics — Python fixture'larına karşı çapraz doğrulama", () => {
  const fixture: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  it("fixture dosyası generic-2dof robotu için ve dolu", () => {
    expect(fixture.robot).toBe("generic-2dof");
    expect(fixture.cases.length).toBeGreaterThan(0);
  });

  fixture.cases.forEach((testCase, index) => {
    it(`durum ${index}: açılar [${testCase.jointAnglesRad}]`, () => {
      const result = forwardKinematics(genericTwoDofRobot, testCase.jointAnglesRad);

      expect(result.jointPositions[1].x).toBeCloseTo(testCase.joint1Position.x, 6);
      expect(result.jointPositions[1].y).toBeCloseTo(testCase.joint1Position.y, 6);

      expect(result.endEffector.x).toBeCloseTo(testCase.endEffector.x, 6);
      expect(result.endEffector.y).toBeCloseTo(testCase.endEffector.y, 6);
    });
  });
});
