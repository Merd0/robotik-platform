import { describe, expect, it } from "vitest";
import { forwardKinematics } from "./kinematics";
import { genericSixDofRobot } from "./robots/genericSixDof";
import {
  ROBOT_CELL_HOME_DEGREES,
  cameraPresetOf,
  clampJointDegrees,
  createRobotCellStudioState,
  jointAnglesRadians,
  updateRobotCellJoint,
} from "./robotCellStudio";

describe("3B robot hücresi durum modeli", () => {
  it("altı eksenli, zeminin üstünde okunabilir bir başlangıç duruşu kurar", () => {
    const state = createRobotCellStudioState();

    expect(state.jointDegrees).toEqual(ROBOT_CELL_HOME_DEGREES);
    expect(state.jointDegrees).toHaveLength(6);
    expect(state.cameraPreset).toBe("cell");
    const angles = jointAnglesRadians(state);
    expect(angles).toHaveLength(genericSixDofRobot.joints.length);
    const pose = forwardKinematics(genericSixDofRobot, angles);
    expect(pose.jointPositions.every((position) => position.z >= -1e-9)).toBe(true);
    expect(pose.endEffector.z).toBeGreaterThan(0.35);
  });

  it("eklem girdisini RobotSpec mekanik limitlerine kırpar", () => {
    expect(clampJointDegrees(genericSixDofRobot, 1, 200)).toBe(90);
    expect(clampJointDegrees(genericSixDofRobot, 1, -200)).toBe(-90);
    expect(clampJointDegrees(genericSixDofRobot, 0, 400)).toBe(180);
  });

  it("yalnız seçilen eklemi günceller ve etkin eklemi kaydeder", () => {
    const state = createRobotCellStudioState();
    const next = updateRobotCellJoint(state, genericSixDofRobot, 2, 44);

    expect(next.jointDegrees[2]).toBe(44);
    expect(next.jointDegrees.filter((value, index) => value !== state.jointDegrees[index])).toHaveLength(1);
    expect(next.activeJointIndex).toBe(2);
  });

  it("hazır kamera görünümlerini kararlı 3B pozlarla tanımlar", () => {
    expect(cameraPresetOf("cell")).toEqual(expect.objectContaining({ label: "Hücre", position: [1.75, 1.25, 1.9] }));
    expect(cameraPresetOf("top").position[1]).toBeGreaterThan(3);
    expect(cameraPresetOf("front").position[2]).toBeGreaterThan(2);
  });

  it("öğretim ana pozu gripper'ı masa ve gövdeden uzakta okunur bir pozda açar", () => {
    const state = createRobotCellStudioState();
    const pose = forwardKinematics(genericSixDofRobot, jointAnglesRadians(state));
    const tcp = pose.endEffector;
    const gripperVerticalAlignment = Math.abs(pose.jointTransforms.at(-1)![2][2]);

    expect(tcp).toEqual(expect.objectContaining({
      x: expect.closeTo(0.55, 2),
      y: expect.closeTo(0.1, 2),
      z: expect.closeTo(0.85, 2),
    }));
    expect(gripperVerticalAlignment).toBeGreaterThanOrEqual(0.72);
  });
});
