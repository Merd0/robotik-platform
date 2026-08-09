import { describe, expect, it } from "vitest";
import { classifyVerticalMovement, heroArmPoints } from "./heroKinematics";

describe("hero kinematik tahmini", () => {
  it("varsayılan omuz açısında dirsek kapanınca ucu yukarı taşır", () => {
    const before = heroArmPoints(24, 8);
    const after = heroArmPoints(24, 64);
    expect(classifyVerticalMovement(before.end.y, after.end.y)).toBe("up");
  });

  it("58 derecelik sınır durumda ucu aşağı taşır", () => {
    const before = heroArmPoints(58, 8);
    const after = heroArmPoints(58, 64);
    expect(after.end.y).toBeGreaterThan(before.end.y);
    expect(classifyVerticalMovement(before.end.y, after.end.y)).toBe("down");
  });

  it("ölçüm toleransı içindeki farkı sabit sayar", () => {
    expect(classifyVerticalMovement(10, 10.1)).toBe("steady");
  });
});
