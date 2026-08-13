import { describe, expect, it } from "vitest";
import type { RobotSpec } from "./kinematics";
import { stepLiveGuidanceAngles } from "./liveRobotGuidance";

const robot: RobotSpec = {
  id: "live-guidance-test",
  displayName: "Canlı sürüş test robotu",
  joints: [
    {
      type: "revolute",
      dhParams: { a: 1, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: 1,
    },
    {
      type: "revolute",
      dhParams: { a: 1, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI / 2, max: Math.PI / 2 },
      maxVelocity: 2,
    },
  ],
};

describe("canlı TCP sürüş yumuşatması", () => {
  it("bir karedeki eklem adımını RobotSpec hız limitine göre sınırlar", () => {
    const next = stepLiveGuidanceAngles(robot, [0, 0], [1, -1], 0.02);

    expect(next).toEqual([expect.closeTo(0.02, 10), expect.closeTo(-0.04, 10)]);
  });

  it("uzun kare gecikmesinde birikmiş süreyi sıçramaya çevirmeden sınırlar", () => {
    const next = stepLiveGuidanceAngles(robot, [0, 0], [1, 1], 1);

    expect(next[0]).toBeCloseTo(0.05, 10);
    expect(next[1]).toBeCloseTo(0.1, 10);
  });

  it("hedefe yeterince yaklaştığında tam hedefi döndürür ve limit içinde kalır", () => {
    const next = stepLiveGuidanceAngles(robot, [0.49, 1.55], [0.5, 2], 0.02);

    expect(next[0]).toBeCloseTo(0.5, 10);
    expect(next[1]).toBeCloseTo(Math.PI / 2, 10);
  });

  it("yanlış eklem sayısını sessizce kabul etmez", () => {
    expect(() => stepLiveGuidanceAngles(robot, [0], [1], 0.02))
      .toThrow("RobotSpec eklem sayısıyla eşleşmeli");
  });
});
