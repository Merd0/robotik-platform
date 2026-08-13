import { describe, expect, it } from "vitest";
import { genericSixDofRobot } from "./robots/genericSixDof";
import { ROBOT_CELL_WORKPIECE } from "./robotCellProgram";
import {
  ROBOT_CELL_OBSTACLES,
  detectRobotCellCollisions,
  planRobotCellMoveJ,
  planRobotCellMoveL,
  sampleRobotCellMotion,
  segmentIntersectsInflatedBox,
  type RobotCellObstacle,
} from "./robotCellMotion";

const toRadians = (degrees: readonly number[]) => degrees.map((value) => value * Math.PI / 180);
const HOME = toRadians([20, 50, -20, 0, 120, 0]);
const BIN_APPROACH = toRadians([-24, 25, 38, 6, 82, 0]);

describe("3B robot hücresi hareket provası", () => {
  it("iş parçasını fikstür ve bırakma tablası üzerinde boşluksuz taşır", () => {
    const fixture = ROBOT_CELL_OBSTACLES.find((obstacle) => obstacle.id === "fixture")!;
    const bin = ROBOT_CELL_OBSTACLES.find((obstacle) => obstacle.id === "bin")!;
    const halfPart = ROBOT_CELL_WORKPIECE.sizeMetres / 2;

    expect(fixture.center.z + fixture.halfSize.z + halfPart).toBeCloseTo(ROBOT_CELL_WORKPIECE.start.z, 8);
    expect(bin.center.z + bin.halfSize.z + halfPart).toBeCloseTo(ROBOT_CELL_WORKPIECE.drop.z, 8);
    expect(Math.hypot(fixture.center.x - bin.center.x, fixture.center.y - bin.center.y)).toBeGreaterThan(
      fixture.halfSize.y + bin.halfSize.y,
    );
  });

  it("yarıçaplı bağlantının kutuyu kesmesini ve boşluk payıyla geçmesini ayırır", () => {
    const obstacle: RobotCellObstacle = {
      id: "test-box",
      label: "Test kutusu",
      center: { x: 0.5, y: 0, z: 0 },
      halfSize: { x: 0.1, y: 0.1, z: 0.1 },
    };

    expect(segmentIntersectsInflatedBox(
      { x: 0, y: 0.14, z: 0 },
      { x: 1, y: 0.14, z: 0 },
      obstacle,
      0.05,
    )).toBe(true);
    expect(segmentIntersectsInflatedBox(
      { x: 0, y: 0.16, z: 0 },
      { x: 1, y: 0.16, z: 0 },
      obstacle,
      0.05,
    )).toBe(false);
    expect(segmentIntersectsInflatedBox(
      { x: 0, y: 0.14, z: 0.14 },
      { x: 1, y: 0.14, z: 0.14 },
      obstacle,
      0.05,
    )).toBe(false);
  });

  it("başlangıç pozunu hücre hacimlerine karşı çarpışmasız kabul eder", () => {
    expect(detectRobotCellCollisions(genericSixDofRobot, HOME, ROBOT_CELL_OBSTACLES)).toEqual([]);
  });

  it("MoveJ yolunu eklem uzayında örnekler ve iki uç pozu eksiksiz korur", () => {
    const plan = planRobotCellMoveJ(genericSixDofRobot, HOME, BIN_APPROACH, [], { sampleCount: 25 });

    expect(plan.status).toBe("safe");
    expect(plan.samples).toHaveLength(26);
    expect(plan.samples[0].jointAngles).toEqual(HOME);
    expect(plan.samples.at(-1)?.jointAngles).toEqual(BIN_APPROACH);
    expect(plan.tcpPath).toHaveLength(26);
    expect(sampleRobotCellMotion(plan, 0).jointAngles).toEqual(HOME);
    expect(sampleRobotCellMotion(plan, 1).jointAngles).toEqual(BIN_APPROACH);
    expect(sampleRobotCellMotion(plan, 0.5).progress).toBeCloseTo(0.5, 6);
  });

  it("MoveJ provasını ara örnekte bağlantı hacmi engele değerse açıklanabilir biçimde reddeder", () => {
    const midpoint = planRobotCellMoveJ(genericSixDofRobot, HOME, BIN_APPROACH, [], { sampleCount: 2 }).samples[1];
    const blockingObstacle: RobotCellObstacle = {
      id: "midpoint-blocker",
      label: "Ara konum engeli",
      center: midpoint.tcp,
      halfSize: { x: 0.03, y: 0.03, z: 0.03 },
    };
    const plan = planRobotCellMoveJ(genericSixDofRobot, HOME, BIN_APPROACH, [blockingObstacle], { sampleCount: 30 });

    expect(plan.status).toBe("collision");
    expect(plan.firstIssue).toEqual(expect.objectContaining({ obstacleId: "midpoint-blocker" }));
    expect(plan.firstIssue?.sampleIndex).toBeGreaterThan(0);
  });

  it("mekanik limit dışındaki MoveJ hedefini güvenli diye işaretlemez", () => {
    const outsideLimit = [...HOME];
    outsideLimit[1] = Math.PI;
    const plan = planRobotCellMoveJ(genericSixDofRobot, HOME, outsideLimit, [], { sampleCount: 12 });

    expect(plan.status).toBe("joint-limit");
    expect(plan.firstIssue).toEqual(expect.objectContaining({ reason: "joint-limit" }));
  });

  it("hücrenin bilinen kontrol hedefini geçirir, dar geçişi fikstür temasıyla durdurur", () => {
    const inspection = toRadians([10, 43, 24, 2, 98, 0]);
    const safe = planRobotCellMoveJ(genericSixDofRobot, HOME, inspection, ROBOT_CELL_OBSTACLES, { sampleCount: 48 });
    const narrow = planRobotCellMoveJ(genericSixDofRobot, HOME, toRadians([-24, 36, 25, 7, 95, 0]), ROBOT_CELL_OBSTACLES, { sampleCount: 48 });

    expect(safe.status).toBe("safe");
    expect(narrow.status).toBe("collision");
    expect(narrow.firstIssue).toEqual(expect.objectContaining({ obstacleId: "fixture" }));
  });

  it("MoveL TCP yolunu doğru üzerinde tutar ve çözülemeyen hedefi IK hatasıyla reddeder", () => {
    const reachable = planRobotCellMoveL(genericSixDofRobot, HOME, { x: 0.55, y: 0.2, z: 0.65 }, [], { sampleCount: 18 });
    expect(reachable.status).toBe("safe");
    expect(reachable.maxCartesianDeviation).toBeLessThan(0.002);
    expect(reachable.tcpPath.at(-1)).toEqual(expect.objectContaining({ x: expect.closeTo(0.55, 3), z: expect.closeTo(0.65, 3) }));

    const unreachable = planRobotCellMoveL(genericSixDofRobot, HOME, { x: 4, y: 0, z: 4 }, [], { sampleCount: 12 });
    expect(unreachable.status).toBe("ik-failure");
    expect(unreachable.firstIssue).toEqual(expect.objectContaining({ reason: "ik-failure" }));
  });
});
