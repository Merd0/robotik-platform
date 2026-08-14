import { describe, expect, it } from "vitest";
import { genericSixDofRobot } from "./robots/genericSixDof";
import { ROBOT_CELL_SAMPLE_JOB, createRobotCellSampleJob, type RobotCellProgramCommand } from "./robotCellProgram";
import { ROBOT_CELL_HOME_DEGREES } from "./robotCellStudio";
import {
  appendRobotCellDemonstration,
  decodeRobotCellProgramDraft,
  encodeRobotCellProgramDraft,
  moveRobotCellProgramCommand,
  replaceRobotCellProgramCommand,
} from "./robotCellProgramEditor";

const radians = (values: readonly number[]) => values.map((value) => value * Math.PI / 180);

describe("3B robot hücresi program editörü", () => {
  it("öğretilen programı ad, sürüm ve komutlarla kayıpsız saklar", () => {
    const commands = createRobotCellSampleJob(genericSixDofRobot);

    const encoded = encodeRobotCellProgramDraft({ name: "İstasyon A", commands });
    const decoded = decodeRobotCellProgramDraft(encoded, genericSixDofRobot);

    expect(decoded).toEqual({ ok: true, value: { version: 1, name: "İstasyon A", commands } });
  });

  it("bozuk, fizik dışı ve aşırı büyük yerel kayıtları reddeder", () => {
    const valid = createRobotCellSampleJob(genericSixDofRobot)[0];
    const outsideLimits = structuredClone(valid) as RobotCellProgramCommand;
    if (outsideLimits.type === "move") outsideLimits.pose = { ...outsideLimits.pose, jointAngles: [99, ...outsideLimits.pose.jointAngles.slice(1)] };
    const tooMany = Array.from({ length: 65 }, (_, index) => ({ ...valid, id: `C${index + 1}` }));

    expect(decodeRobotCellProgramDraft("{", genericSixDofRobot)).toEqual(expect.objectContaining({ ok: false }));
    expect(decodeRobotCellProgramDraft(JSON.stringify({ version: 1, name: "Bozuk", commands: [outsideLimits] }), genericSixDofRobot)).toEqual(expect.objectContaining({ ok: false }));
    expect(decodeRobotCellProgramDraft(JSON.stringify({ version: 1, name: "Taşma", commands: tooMany }), genericSixDofRobot)).toEqual(expect.objectContaining({ ok: false }));
  });

  it("bir adımı komşusuyla taşır, sınırda no-op yapar", () => {
    const commands = createRobotCellSampleJob(genericSixDofRobot).slice(0, 3);

    expect(moveRobotCellProgramCommand(commands, "C2", -1).map((command) => command.id)).toEqual(["C2", "C1", "C3"]);
    expect(moveRobotCellProgramCommand(commands, "C1", -1)).toEqual(commands);
    expect(moveRobotCellProgramCommand(commands, "yok", 1)).toEqual(commands);
  });

  it("seçili hareket pozunu günceller ama gripper komutunu hareketle ezmez", () => {
    const commands = createRobotCellSampleJob(genericSixDofRobot).slice(0, 3);
    const replacement = commands[1];

    expect(replaceRobotCellProgramCommand(commands, "C1", replacement).map((command) => command.id)).toEqual(["C1", "C2", "C3"]);
    expect(replaceRobotCellProgramCommand(commands, "C3", replacement)).toEqual(commands);
  });

  it("elle sürülen güvenli yolu az sayıda zorunlu ara noktaya sadeleştirir", () => {
    const sample = createRobotCellSampleJob(genericSixDofRobot);
    const existing = sample.slice(0, 3);
    const result = appendRobotCellDemonstration({
      robot: genericSixDofRobot,
      startAngles: radians(ROBOT_CELL_HOME_DEGREES),
      commands: existing,
      jointTrace: [
        radians(ROBOT_CELL_SAMPLE_JOB.pick),
        radians(ROBOT_CELL_SAMPLE_JOB.approach),
        radians(ROBOT_CELL_SAMPLE_JOB.inspect),
        radians(ROBOT_CELL_SAMPLE_JOB.dropApproach),
        radians(ROBOT_CELL_SAMPLE_JOB.drop),
      ],
      terminalLabel: "Elle bırakma konumu",
      terminalAction: "open",
    });

    expect(result.preflight.status).toBe("ready");
    expect(result.insertedIntermediateCount).toBe(1);
    expect(result.commands).toHaveLength(existing.length + 3);
    expect(result.commands.at(-1)).toEqual(expect.objectContaining({ type: "gripper", action: "open" }));
    expect(result.commands.filter((command) => command.type === "move").at(-1))
      .toEqual(expect.objectContaining({ pose: expect.objectContaining({ label: "Elle bırakma konumu" }) }));
  });

  it("kullanıcı güvenli ara yol göstermediyse tehlikeli kestirmeyi hazır saymaz", () => {
    const sample = createRobotCellSampleJob(genericSixDofRobot);
    const existing = sample.slice(0, 3);
    const result = appendRobotCellDemonstration({
      robot: genericSixDofRobot,
      startAngles: radians(ROBOT_CELL_HOME_DEGREES),
      commands: existing,
      jointTrace: [radians(ROBOT_CELL_SAMPLE_JOB.pick), radians(ROBOT_CELL_SAMPLE_JOB.drop)],
      terminalLabel: "Bırakma konumu",
      terminalAction: "open",
    });

    expect(result.preflight.status).toBe("blocked");
    expect(result.preflight.firstIssue).toEqual(expect.objectContaining({ reason: "collision" }));
    expect(result.insertedIntermediateCount).toBe(0);
  });
});
