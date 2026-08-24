import { describe, expect, it } from "vitest";
import { forwardKinematics } from "./kinematics";
import { genericSixDofRobot } from "./robots/genericSixDof";
import { ROBOT_CELL_HOME_DEGREES } from "./robotCellStudio";
import {
  createTaughtPose,
  createRobotCellSampleJob,
  assessRobotCellGrip,
  solveRobotCellDragTarget,
  solveRobotCellDirectTarget,
  releasedWorkpiecePosition,
  recordRobotCellCommandSmart,
  repairRobotCellProgram,
  ROBOT_CELL_SAMPLE_JOB,
  ROBOT_CELL_WORKPIECE,
  preflightRobotCellProgram,
  preflightRobotStateSignals,
  type RobotCellProgramCommand,
  type RobotCellProgramIssueReason,
  type RobotCellProgramPreflight,
} from "./robotCellProgram";

const toRadians = (degrees: readonly number[]) => degrees.map((value) => value * Math.PI / 180);
const HOME = toRadians(ROBOT_CELL_HOME_DEGREES);
const INSPECTION = toRadians([10, 43, 24, 2, 98, 0]);
const NARROW = toRadians([-24, 36, 25, 7, 95, 0]);

function toolOrientationDistance(firstAngles: readonly number[], secondAngles: readonly number[]): number {
  const first = forwardKinematics(genericSixDofRobot, [...firstAngles]).jointTransforms.at(-1)!;
  const second = forwardKinematics(genericSixDofRobot, [...secondAngles]).jointTransforms.at(-1)!;
  const trace = [0, 1, 2].reduce((sum, row) => sum
    + [0, 1, 2].reduce((cellSum, column) => cellSum + first[row][column] * second[row][column], 0), 0);
  return Math.acos(Math.max(-1, Math.min(1, (trace - 1) / 2)));
}

function shortestAngleDistance(first: number, second: number): number {
  return Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)));
}

describe("3B robot hücresi öğretim programı", () => {
  it("gripper hedef dışında açıldığında parçayı havada bırakmayıp altındaki yüzeye oturtur", () => {
    expect(releasedWorkpiecePosition({ x: 0.845, y: 0.051, z: 0.7 })).toEqual({
      x: 0.845,
      y: 0.051,
      z: 0.36,
    });
    expect(releasedWorkpiecePosition({ x: 0.7, y: -0.1, z: 0.9 })).toEqual(expect.objectContaining({
      x: 0.7,
      y: -0.1,
      z: expect.closeTo(0.65, 8),
    }));
  });

  it("5 cm jog ile tabla yüzeyine hafif giren parçayı zemine düşürmez", () => {
    expect(releasedWorkpiecePosition({ x: 0.645, y: 0.251, z: 0.35 })).toEqual({
      x: 0.645,
      y: 0.251,
      z: 0.36,
    });
  });

  it("akıllı kayıt aynı veya milimetrik yakın pozu programda çoğaltmaz", () => {
    const firstPose = createTaughtPose(genericSixDofRobot, "P1", "Kaydedilen ara konum", HOME);
    const nearbyAngles = [...HOME];
    nearbyAngles[5] += 0.001;
    const nearbyPose = createTaughtPose(genericSixDofRobot, "P2", "Kaydedilen ara konum", nearbyAngles);
    const first: RobotCellProgramCommand = { id: "C1", type: "move", motion: "movej", pose: firstPose };
    const duplicate: RobotCellProgramCommand = { id: "C2", type: "move", motion: "movej", pose: nearbyPose };

    const result = recordRobotCellCommandSmart([first], duplicate);

    expect(result.change).toBe("ignored");
    expect(result.commands).toEqual([first]);
  });

  it("aynı poz kritik kavrama veya bırakma anıysa önceki jog satırının anlamını günceller", () => {
    const jog: RobotCellProgramCommand = {
      id: "C7",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P7", "Z jog", HOME),
    };
    const release: RobotCellProgramCommand = {
      id: "C8",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P8", "Elle bırakma konumu", HOME),
    };

    const result = recordRobotCellCommandSmart([jog], release);

    expect(result.change).toBe("replaced");
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual(expect.objectContaining({
      id: "C7",
      pose: expect.objectContaining({ id: "P7", label: "Elle bırakma konumu" }),
    }));
  });

  it("kritik bırakma pozu eski bir ara pozla aynıysa komutu geriye taşımayıp sona ekler", () => {
    const releaseAngles = [...HOME];
    const detourAngles = [...HOME];
    detourAngles[0] += 0.35;
    const earlier: RobotCellProgramCommand = {
      id: "C1",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P1", "Z jog", releaseAngles),
    };
    const detour: RobotCellProgramCommand = {
      id: "C2",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P2", "Y jog", detourAngles),
    };
    const release: RobotCellProgramCommand = {
      id: "C3",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P3", "Elle bırakma konumu", releaseAngles),
    };

    const result = recordRobotCellCommandSmart([earlier, detour], release);

    expect(result.change).toBe("added");
    expect(result.commands.map((command) => command.id)).toEqual(["C1", "C2", "C3"]);
    expect(result.commands.at(-1)).toEqual(expect.objectContaining({
      type: "move",
      pose: expect.objectContaining({ label: "Elle bırakma konumu" }),
    }));
  });

  it("akıllı kayıt aynı iş evresindeki otomatik güvenli kaldırma pozunu günceller", () => {
    const firstAngles = toRadians([-10, 55, 20, 0, -80, -10]);
    const correctedAngles = toRadians([-12, 58, 18, 0, -82, -12]);
    const first: RobotCellProgramCommand = {
      id: "C4",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P4", "Güvenli kaldırma", firstAngles),
    };
    const corrected: RobotCellProgramCommand = {
      id: "C5",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P5", "Güvenli kaldırma", correctedAngles),
    };

    const result = recordRobotCellCommandSmart([first], corrected);

    expect(result.change).toBe("replaced");
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual(expect.objectContaining({
      id: "C4",
      type: "move",
      pose: expect.objectContaining({ id: "P4", jointAngles: correctedAngles }),
    }));
  });

  it("aynı eksendeki peş peşe jogları tek hareket segmentinin son noktasında toplar", () => {
    const first: RobotCellProgramCommand = {
      id: "C1",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P1", "X jog", HOME),
    };
    const laterAngles = [...HOME];
    laterAngles[0] += 0.2;
    const later: RobotCellProgramCommand = {
      id: "C2",
      type: "move",
      motion: "movej",
      pose: createTaughtPose(genericSixDofRobot, "P2", "X jog", laterAngles),
    };

    const result = recordRobotCellCommandSmart([first], later);

    expect(result.change).toBe("replaced");
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual(expect.objectContaining({
      id: "C1",
      pose: expect.objectContaining({ id: "P1", jointAngles: laterAngles }),
    }));
  });

  it("akıllı onarım yolu engelleyen kırmızı satırı ayıklayıp kalan programı yeniden doğrular", () => {
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kontrol", INSPECTION) },
      { id: "C2", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Hatalı geçiş", NARROW) },
    ];

    const result = repairRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.removedCommandIds).toEqual(["C2"]);
    expect(result.commands.map((command) => command.id)).toEqual(["C1"]);
    expect(result.preflight.status).toBe("ready");
  });

  it("mavi bırakma alanında açılan parçayı tabla merkezine oturtur", () => {
    expect(releasedWorkpiecePosition({ x: 0.56, y: -0.39, z: 0.8 })).toEqual(ROBOT_CELL_WORKPIECE.drop);
  });

  it("basit kumandada her hedefte gripper yaklaşma eksenini düşey aşağı kilitler", () => {
    const targets = [
      { x: 0.65, y: 0.02, z: 0.82 },
      { x: ROBOT_CELL_WORKPIECE.start.x, y: ROBOT_CELL_WORKPIECE.start.y, z: ROBOT_CELL_WORKPIECE.start.z },
      { x: ROBOT_CELL_WORKPIECE.drop.x, y: ROBOT_CELL_WORKPIECE.drop.y, z: ROBOT_CELL_WORKPIECE.drop.z },
    ];
    let previous = HOME;

    for (const target of targets) {
      const solution = solveRobotCellDirectTarget(genericSixDofRobot, previous, target);
      expect(solution).toEqual(expect.objectContaining({ status: "ready", angles: expect.any(Array) }));
      const transform = forwardKinematics(genericSixDofRobot, solution.angles!).jointTransforms.at(-1)!;
      expect(transform[2][2]).toBeLessThan(-0.999);
      previous = solution.angles!;
    }
  });

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

  it("gripper yalnız parçanın merkezinde ve kavrama açıklığı uygunken kutuyu tutar", () => {
    const aligned = assessRobotCellGrip(genericSixDofRobot, toRadians(ROBOT_CELL_SAMPLE_JOB.pick), { ...ROBOT_CELL_WORKPIECE.start });
    const tiltedAngles = [...ROBOT_CELL_SAMPLE_JOB.pick];
    tiltedAngles[4] = 0;
    const tilted = assessRobotCellGrip(genericSixDofRobot, toRadians(tiltedAngles), forwardKinematics(genericSixDofRobot, toRadians(tiltedAngles)).endEffector);

    expect(aligned).toEqual(expect.objectContaining({
      canGrip: true,
      positionAligned: true,
      orientationAligned: true,
      positionErrorMetres: expect.any(Number),
    }));
    expect(tilted).toEqual(expect.objectContaining({
      canGrip: false,
      reason: "orientation",
      positionAligned: true,
      orientationAligned: false,
    }));
  });

  it("sürüklenen gripper hedefini en yakın limit-içi ve çarpışmasız IK pozuna çözer", () => {
    const result = solveRobotCellDragTarget(genericSixDofRobot, HOME, { x: 0.72, y: -0.18, z: 0.86 });
    const unreachable = solveRobotCellDragTarget(genericSixDofRobot, HOME, { x: 4, y: 0, z: 4 });

    expect(result).toEqual(expect.objectContaining({ status: "ready", angles: expect.any(Array) }));
    expect(result.angles).toHaveLength(6);
    expect(unreachable).toEqual(expect.objectContaining({ status: "ik-failure", angles: null }));
  });

  it("ardışık sürüklemede kavrama yönelimini koruyarak kullanıcının parçaya elle inmesini sağlar", () => {
    const orientedSeed = toRadians([-13.16, 39.95, 44.79, 15.25, 163.25, 129.53]);
    const approach = solveRobotCellDragTarget(genericSixDofRobot, HOME, { x: 0.72, y: -0.18, z: 0.86 }, orientedSeed);
    const pick = solveRobotCellDragTarget(genericSixDofRobot, approach.angles!, { ...ROBOT_CELL_WORKPIECE.start }, orientedSeed);

    expect(approach).toEqual(expect.objectContaining({ status: "ready", angles: expect.any(Array) }));
    expect(pick).toEqual(expect.objectContaining({ status: "ready", angles: expect.any(Array) }));
    expect(assessRobotCellGrip(genericSixDofRobot, pick.angles!, { ...ROBOT_CELL_WORKPIECE.start })).toEqual(expect.objectContaining({
      canGrip: true,
      positionAligned: true,
      orientationAligned: true,
    }));
  });

  it("TCP eksen kumandasında takım yönünü kilitler ve bileği çözüm dalları arasında takla attırmaz", () => {
    const home = toRadians(ROBOT_CELL_HOME_DEGREES);
    const targets = [
      { x: 0.72, y: 0.12, z: 0.85 },
      { x: 0.72, y: -0.18, z: 0.85 },
      { x: 0.72, y: -0.18, z: 0.73 },
    ];
    let previous = home;

    for (const target of targets) {
      const solution = solveRobotCellDragTarget(genericSixDofRobot, previous, target);

      expect(solution).toEqual(expect.objectContaining({ status: "ready", angles: expect.any(Array) }));
      expect(toolOrientationDistance(home, solution.angles!)).toBeLessThan(0.02);
      expect(Math.max(...solution.angles!.map((angle, index) => shortestAngleDistance(previous[index], angle)))).toBeLessThan(Math.PI / 2);
      previous = solution.angles!;
    }
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

    expect(program.map((command) => command.type === "move" ? command.motion : command.action)).toEqual(["movej", "movel", "close", "movel", "movej", "movej", "movel", "open"]);
    expect(result.status).toBe("ready");
    expect(result.steps.map((step) => step.holdingPartAfter)).toEqual([false, false, true, true, true, true, true, false]);
  });

  it("MoveL sonrasında sıradaki satıra çözücünün gerçekten ulaştığı eklem pozundan başlar", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot);
    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);
    const moveLEnd = result.steps[1].motionPlan?.samples.at(-1)?.jointAngles;

    expect(moveLEnd).toBeDefined();
    expect(result.steps[2].startAngles).toEqual(moveLEnd);
    expect(result.steps[3].startAngles).toEqual(moveLEnd);
  });

  it("bırakılan parçayı altındaki tablaya boşluksuz oturtur ve tutma durumunu kapatır", () => {
    const program = createRobotCellSampleJob(genericSixDofRobot);

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, program);

    expect(result.status).toBe("ready");
    expect(result.steps[7].workpiecePositionAfter).toEqual(expect.objectContaining({ x: expect.closeTo(0.55, 2), y: expect.closeTo(-0.4, 2), z: 0.4 }));
    expect(result.steps.at(-1)).toEqual(expect.objectContaining({ status: "ready", holdingPartAfter: false }));
  });

  it("masa yüzeyine kontrollü inip hemen açılan parçayı bırakma teması olarak kabul eder", () => {
    const pick = toRadians(ROBOT_CELL_SAMPLE_JOB.pick);
    const lowTarget = { x: 0.645, y: 0.251, z: 0.35 };
    const highSolution = solveRobotCellDirectTarget(genericSixDofRobot, pick, { ...lowTarget, z: 0.75 });
    const lowSolution = solveRobotCellDirectTarget(genericSixDofRobot, highSolution.angles!, lowTarget);
    expect(lowSolution.status).toBe("ready");
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kavrama konumu", pick) },
      { id: "C2", type: "gripper", action: "close" },
      { id: "C3", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Güvenli kaldırma", highSolution.angles!) },
      { id: "C4", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P3", "Elle bırakma konumu", lowSolution.angles!) },
      { id: "C5", type: "gripper", action: "open" },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("ready");
    expect(result.steps[3]).toEqual(expect.objectContaining({ status: "ready", holdingPartAfter: true }));
    expect(result.steps[4]).toEqual(expect.objectContaining({ status: "ready", holdingPartAfter: false }));
    expect(result.steps[4].workpiecePositionAfter.z).toBe(0.36);
  });

  it("aynı masa temasını ardından bırakma komutu yoksa çarpışma olarak engeller", () => {
    const pick = toRadians(ROBOT_CELL_SAMPLE_JOB.pick);
    const target = { x: 0.645, y: 0.251, z: 0.35 };
    const highSolution = solveRobotCellDirectTarget(genericSixDofRobot, pick, { ...target, z: 0.75 });
    const lowSolution = solveRobotCellDirectTarget(genericSixDofRobot, highSolution.angles!, target);
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kavrama konumu", pick) },
      { id: "C2", type: "gripper", action: "close" },
      { id: "C3", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Güvenli kaldırma", highSolution.angles!) },
      { id: "C4", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P3", "Alçak ara konum", lowSolution.angles!) },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("blocked");
    expect(result.firstIssue).toEqual(expect.objectContaining({
      commandId: "C4",
      reason: "collision",
      obstacleLabel: "Çalışma masası (taşınan parça)",
    }));
  });

  it("parça taşınırken havadaki tutucu açma komutunu reddeder", () => {
    const pick = toRadians(ROBOT_CELL_SAMPLE_JOB.pick);
    const highSolution = solveRobotCellDirectTarget(genericSixDofRobot, pick, { x: 0.8, y: 0.15, z: 0.79 });
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kavrama konumu", pick) },
      { id: "C2", type: "gripper", action: "close" },
      { id: "C3", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Elle bırakma konumu", highSolution.angles!) },
      { id: "C4", type: "gripper", action: "open" },
    ];

    const result = preflightRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.status).toBe("blocked");
    expect(result.firstIssue).toEqual(expect.objectContaining({ commandId: "C4", reason: "release-surface" }));
  });

  it("akıllı onarım havadaki bırakma işaretiyle açma komutunu birlikte kaldırır", () => {
    const pick = toRadians(ROBOT_CELL_SAMPLE_JOB.pick);
    const highSolution = solveRobotCellDirectTarget(genericSixDofRobot, pick, { x: 0.8, y: 0.15, z: 0.79 });
    const commands: RobotCellProgramCommand[] = [
      { id: "C1", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P1", "Kavrama konumu", pick) },
      { id: "C2", type: "gripper", action: "close" },
      { id: "C3", type: "move", motion: "movej", pose: createTaughtPose(genericSixDofRobot, "P2", "Elle bırakma konumu", highSolution.angles!) },
      { id: "C4", type: "gripper", action: "open" },
    ];

    const result = repairRobotCellProgram(genericSixDofRobot, HOME, commands);

    expect(result.removedCommandIds).toEqual(expect.arrayContaining(["C3", "C4"]));
    expect(result.commands.some((command) => command.type === "gripper" && command.action === "open")).toBe(false);
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

describe("preflightRobotStateSignals", () => {
  const readyPreflight: RobotCellProgramPreflight = { status: "ready", steps: [], estimatedDurationSeconds: 1.2 };
  const emptyPreflight: RobotCellProgramPreflight = { status: "empty", steps: [], estimatedDurationSeconds: 0 };

  function blockedPreflight(reason: RobotCellProgramIssueReason): RobotCellProgramPreflight {
    return {
      status: "blocked",
      steps: [],
      estimatedDurationSeconds: 0,
      firstIssue: { commandId: "C1", commandIndex: 0, reason },
    };
  }

  it("ready ve oynatılıyorken busy+moving sinyali üretir", () => {
    expect(preflightRobotStateSignals(readyPreflight, true, false)).toEqual({ busy: true, phase: "moving", completed: false });
  });

  it("ready, oynatılmıyor ve tamamlanmışken completed sinyali üretir", () => {
    expect(preflightRobotStateSignals(readyPreflight, false, true)).toEqual({ busy: false, phase: "moving", completed: true });
  });

  it("empty durumda (henüz poz öğretilmemiş) hiçbir sinyal taşımaz — idle'a düşer", () => {
    expect(preflightRobotStateSignals(emptyPreflight, false, false)).toEqual({ busy: false, phase: "moving", completed: false });
  });

  it("çarpışma nedeniyle bloklanmışsa collision sinyali üretir", () => {
    expect(preflightRobotStateSignals(blockedPreflight("collision"), false, false)).toEqual({ collision: true });
  });

  it("IK çözülemediği için bloklanmışsa unreachable sinyali üretir", () => {
    expect(preflightRobotStateSignals(blockedPreflight("ik-failure"), false, false)).toEqual({ unreachable: true });
  });

  it("eklem limiti nedeniyle bloklanmışsa unreachable sinyali üretir", () => {
    expect(preflightRobotStateSignals(blockedPreflight("joint-limit"), false, false)).toEqual({ unreachable: true });
  });

  it("prosedürel bir nedenle (kavrama bölgesi dışı) bloklanmışsa genel error sinyali üretir — fiziksel imkânsızlıkla karıştırmaz", () => {
    expect(preflightRobotStateSignals(blockedPreflight("grip-zone"), false, false)).toEqual({ error: true });
  });

  it("bloklanma her zaman playing/completed'dan önceliklidir (ör. duraklatılmış oynatma sırasında hata bulunmuş olabilir)", () => {
    expect(preflightRobotStateSignals(blockedPreflight("collision"), true, true)).toEqual({ collision: true });
  });
});
