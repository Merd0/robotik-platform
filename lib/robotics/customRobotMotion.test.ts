import { describe, expect, it } from "vitest";
import type { RobotSpec } from "./kinematics";
import {
  analyzeCustomRobotPose,
  appendMotionWaypointWithCompaction,
  beginAdaptiveMotionCapture,
  captureAdaptiveMotionSample,
  planJointTrajectory,
  sampleJointTrajectory,
} from "./customRobotMotion";

function planarRobot(linkCount: number): RobotSpec {
  return {
    id: `motion-test-${linkCount}`,
    displayName: "Hareket test robotu",
    joints: Array.from({ length: linkCount }, () => ({
      type: "revolute" as const,
      dhParams: { a: 1, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    })),
  };
}

describe("öğretilmiş robot hareketinin fiziksel ön doğrulaması", () => {
  it("geçerli açık zinciri güvenli kabul eder ve limit payını hesaplar", () => {
    const analysis = analyzeCustomRobotPose(planarRobot(3), [0, 0, 0]);

    expect(analysis.valid).toBe(true);
    expect(analysis.limitViolations).toEqual([]);
    expect(analysis.selfCollisionPairs).toEqual([]);
    expect(analysis.minimumLimitMargin).toBeCloseTo(Math.PI, 8);
  });

  it("limit dışı pozu ve düzlemsel öz-çakışmayı ayrı nedenlerle reddeder", () => {
    const robot = planarRobot(3);
    const outsideLimits = analyzeCustomRobotPose(robot, [Math.PI + 0.01, 0, 0]);
    const foldedToBase = analyzeCustomRobotPose(robot, [0, (2 * Math.PI) / 3, (2 * Math.PI) / 3]);

    expect(outsideLimits.valid).toBe(false);
    expect(outsideLimits.limitViolations).toEqual([expect.objectContaining({ jointIndex: 0 })]);
    expect(foldedToBase.valid).toBe(false);
    expect(foldedToBase.selfCollisionPairs).toContainEqual([0, 2]);
  });

  it("180° katlanıp bir önceki bağlantının üstüne binen komşu bağlantıyı da yakalar", () => {
    const folded = analyzeCustomRobotPose(planarRobot(2), [0, Math.PI]);

    expect(folded.valid).toBe(false);
    expect(folded.selfCollisionPairs).toContainEqual([0, 1]);
  });

  it("öğretilen pozlar arasında hız limitini aşmayan eşzamanlı eklem yolu üretir", () => {
    const robot = planarRobot(2);
    const result = planJointTrajectory(robot, [[0, 0], [Math.PI / 2, Math.PI / 4]], 0.5);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Kübik ease-in/out profilinin tepe hızı ortalama hızın 1,5 katıdır;
    // süre buna göre uzatılır ve RobotSpec.maxVelocity aşılmaz.
    expect(result.trajectory.totalDurationSeconds).toBeCloseTo(1.5, 8);
    expect(result.trajectory.peakVelocityRatio).toBeLessThanOrEqual(0.5 + 1e-9);
    expect(result.trajectory.checkedSamples).toBeGreaterThan(2);
    expect(sampleJointTrajectory(result.trajectory, 0.75)).toEqual([
      expect.closeTo(Math.PI / 4, 8),
      expect.closeTo(Math.PI / 8, 8),
    ]);
  });

  it("limit dışı veya öz-çakışmalı öğretilmiş pozu oynatmaya hazırlamaz", () => {
    const robot = planarRobot(3);
    const limitResult = planJointTrajectory(robot, [[0, 0, 0], [Math.PI + 0.01, 0, 0]], 0.5);
    const collisionResult = planJointTrajectory(
      robot,
      [[0, 0, 0], [0, (2 * Math.PI) / 3, (2 * Math.PI) / 3]],
      0.5,
    );

    expect(limitResult).toEqual(expect.objectContaining({ ok: false, reason: "joint-limit" }));
    expect(collisionResult).toEqual(expect.objectContaining({ ok: false, reason: "self-collision" }));
  });

  it("hızlı sürüklemede olay sayısını değil zamanı örnekler", () => {
    const robot = planarRobot(1);
    let capture = beginAdaptiveMotionCapture([0], 0);

    const early = captureAdaptiveMotionSample(robot, capture, [0.35], 100);
    capture = early.state;
    const stillEarly = captureAdaptiveMotionSample(robot, capture, [0.9], 550);
    capture = stillEarly.state;
    const oneSecond = captureAdaptiveMotionSample(robot, capture, [1.2], 1_000);

    expect(early).toEqual(expect.objectContaining({ shouldRecord: false, mode: "rapid" }));
    expect(stillEarly.shouldRecord).toBe(false);
    expect(oneSecond.shouldRecord).toBe(true);
  });

  it("yavaş mikro hareketi küçük açı farkları birikince ayrıntılı kaydeder", () => {
    const robot = planarRobot(1);
    let capture = beginAdaptiveMotionCapture([0], 0);

    const firstMicronudge = captureAdaptiveMotionSample(robot, capture, [0.001], 200);
    capture = firstMicronudge.state;
    const accumulatedMicronudge = captureAdaptiveMotionSample(robot, capture, [0.002], 400);

    expect(firstMicronudge).toEqual(expect.objectContaining({ shouldRecord: false, mode: "precision" }));
    expect(accumulatedMicronudge).toEqual(expect.objectContaining({ shouldRecord: true, mode: "precision" }));
  });

  it("uzun kaydı kesmek yerine düz ara pozları sıkıştırıp köşeyi ve uçları korur", () => {
    const waypoints = [[0], [0.25], [0.5], [1.5]];
    const next = appendMotionWaypointWithCompaction(waypoints, [2], 4);

    expect(next).toHaveLength(4);
    expect(next[0]).toEqual([0]);
    expect(next).toContainEqual([1.5]);
    expect(next.at(-1)).toEqual([2]);
  });
});
