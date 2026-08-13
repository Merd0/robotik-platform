import { describe, expect, it } from "vitest";
import { ROBOT_CELL_WORKPIECE } from "./robotCellProgram";
import { ROBOT_CELL_GRIPPER_VISUAL, robotCellAxisTarget, robotCellTargetFromScenePlane } from "./robotCellVisual";

describe("3B hücre gripper geometrisi", () => {
  it("TCP'yi kavrama merkezi yapar ve kapalı çeneler parçanın iki yüzüne oturur", () => {
    const halfWorkpiece = ROBOT_CELL_WORKPIECE.sizeMetres / 2;
    const innerJawFace = ROBOT_CELL_GRIPPER_VISUAL.closedFingerOffset
      - ROBOT_CELL_GRIPPER_VISUAL.fingerThickness / 2;

    expect(ROBOT_CELL_GRIPPER_VISUAL.gripCenterY).toBe(0);
    expect(innerJawFace).toBeGreaterThanOrEqual(halfWorkpiece);
    expect(innerJawFace).toBeLessThanOrEqual(halfWorkpiece + 0.01);
    expect(ROBOT_CELL_GRIPPER_VISUAL.fingerCenterY - ROBOT_CELL_GRIPPER_VISUAL.fingerLength / 2).toBeLessThan(0);
    expect(ROBOT_CELL_GRIPPER_VISUAL.fingerCenterY + ROBOT_CELL_GRIPPER_VISUAL.fingerLength / 2).toBeGreaterThan(0);
  });

  it("açık çeneleri parça genişliğinden belirgin biçimde daha geniş tutar", () => {
    const openInnerGap = 2 * (
      ROBOT_CELL_GRIPPER_VISUAL.openFingerOffset
      - ROBOT_CELL_GRIPPER_VISUAL.fingerThickness / 2
    );
    const totalOpenWidth = 2 * ROBOT_CELL_GRIPPER_VISUAL.openFingerOffset
      + ROBOT_CELL_GRIPPER_VISUAL.fingerThickness;

    expect(openInnerGap).toBeGreaterThan(ROBOT_CELL_WORKPIECE.sizeMetres * 1.35);
    expect(openInnerGap).toBeLessThan(ROBOT_CELL_WORKPIECE.sizeMetres * 1.7);
    expect(totalOpenWidth).toBeLessThanOrEqual(ROBOT_CELL_WORKPIECE.sizeMetres * 2);
    expect(ROBOT_CELL_GRIPPER_VISUAL.fingerLength).toBeLessThanOrEqual(ROBOT_CELL_WORKPIECE.sizeMetres * 1.15);
  });

  it("sahne sürüklemesini TCP yüksekliğini bozmadan robotik X/Y hedefine çevirir", () => {
    expect(robotCellTargetFromScenePlane({ x: 0.72, z: 0.18 }, 0.86)).toEqual({
      x: 0.72,
      y: -0.18,
      z: 0.86,
    });
  });

  it("tek eksen kumandasında diğer iki güncel TCP koordinatını korur", () => {
    const current = { x: 0.45, y: 0.12, z: 0.85 };

    expect(robotCellAxisTarget(current, "x", 0.72)).toEqual({ x: 0.72, y: 0.12, z: 0.85 });
    expect(robotCellAxisTarget(current, "y", -0.18)).toEqual({ x: 0.45, y: -0.18, z: 0.85 });
    expect(robotCellAxisTarget(current, "z", 0.73)).toEqual({ x: 0.45, y: 0.12, z: 0.73 });
  });
});
