import { describe, expect, it } from "vitest";
import { genericSixDofRobot } from "./robots/genericSixDof";
import {
  createTaughtPose,
  createRobotCellSampleJob,
  preflightRobotCellProgram,
  type RobotCellProgramCommand,
} from "./robotCellProgram";

const toRadians = (degrees: readonly number[]) => degrees.map((value) => value * Math.PI / 180);
const HOME = toRadians([20, 50, -20, 0, 120, 0]);
const INSPECTION = toRadians([10, 43, 24, 2, 98, 0]);
const NARROW = toRadians([-24, 36, 25, 7, 95, 0]);

describe("3B robot hücresi öğretim programı", () => {
  it("öğretilen pozu eklem açıları ve FK'den gelen TCP ile dondurur", () => {
    const pose = createTaughtPose(genericSixDofRobot, "P1", "Kontrol", INSPECTION);

    expect(pose.id).toBe("P1");
    expect(pose.jointAngles).toEqual(INSPECTION);
    expect(pose.tcp).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) }));
    expect(Object.isFrozen(pose.jointAngles)).toBe(true);
  });

  it("geçerli MoveJ ve tutucu programını satır satır ön kontrolden geçirir", () => {
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kontrol", INSPECTION) },
      { id: "C2", type: "gripper", action: "open" },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("ready");
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]).toEqual(expect.objectContaining({ status: "ready", startAngles: HOME, endAngles: INSPECTION }));
    expect(result.estimatedDurationSeconds).toBeGreaterThan(0);
  });

  it("ara yolda fikstüre çarpan satırı ve sonrasındaki yürütülemeyen satırları reddeder", () => {
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kontrol", INSPECTION) },
      { id: "C2", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Dar geçiş", NARROW) },
      { id: "C3", type: "gripper", action: "close" },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("blocked");
    expect(result.firstIssue).toEqual(expect.objectContaining({ commandId: "C2", reason: "collision", obstacleLabel: "Fikstür" }));
    expect(result.steps[2].status).toBe("not-checked");
  });

  it("parçadan uzakta kapatma komutunu sahte kavrama olarak kabul etmez", () => {
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "gripper", action: "close" },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("blocked");
    expect(result.firstIssue).toEqual(expect.objectContaining({ commandId: "C1", reason: "grip-zone" }));
  });

  it("boş programı oynatılabilir saymaz", () => {
    expect(preflightRobotCellProgram(genericSixDofRobot, HOME, [])).toEqual(expect.objectContaining({
      status: "empty",
      steps: [],
      firstIssue: undefined,
    }));
  });

  it("örnek al-bırak işini güvenli ve kavrama sırası tutarlı üretir", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot);
    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);

    expect(program.map((command) => command.type === "move" ? command.motion : command.action)).toEqual(["movej", "movel", "close", "movel", "movej", "movej", "open"]);
    expect(result.status).toBe("ready");
    expect(result.steps.map((step) => step.holdingPartAfter)).toEqual([false, false, true, true, true, true, false]);
  });

  it("MoveL sonrasında sıradaki satıra çözücünün gerçekten ulaştığı eklem pozundan başlar", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot);
    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);
    const moveLEnd = result.steps[1].motionPlan?.samples.at(-1)?.jointAngles;

    expect(moveLEnd).toBeDefined();
    expect(result.steps[2].startAngles).toEqual(moveLEnd);
    expect(result.steps[3].startAngles).toEqual(moveLEnd);
  });

  it("bırakılan parçayı altındaki kutuya oturtur ve uzaktaki sahte yeniden kavramayı reddeder", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot);
    program.push({ id: "C8", type: "gripper", action: "close" });

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);

    expect(result.status).toBe("blocked");
    expect(result.steps[6].workpiecePositionAfter).toEqual(expect.objectContaining({ x: expect.closeTo(0.8, 2), y: expect.closeTo(-0.45, 2), z: 0.595 }));
    expect(result.steps.at(-1)).toEqual(expect.objectContaining({ status: "blocked", holdingPartAfter: false }));
    expect(result.firstIssue).toEqual(expect.objectContaining({ commandId: "C8", reason: "grip-zone" }));
  });

  it("robot kolu geçse bile taşınan parçanın koruyucu çevre temasını engeller", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot).slice(0, 3);
    program.push({
      id: "C4",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P3", "Parça için dar geçiş", toRadians([-105.89, 1.67, 81.36, -100.69, -128.44, -27.53])),
    });

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);

    expect(result.status).toBe("blocked");
    expect(result.firstIssue).toEqual(expect.objectContaining({ commandId: "C4", reason: "collision", obstacleLabel: "Koruyucu çevre (taşınan parça)" }));
  });
});
