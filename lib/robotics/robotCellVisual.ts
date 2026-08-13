/**
 * Gripper'ın yerel Y ekseni takım çerçevesinin Y eksenidir ve TCP (Y=0)
 * iki çenenin kavrama merkezidir. Ölçüler metre cinsindedir.
 */
export const ROBOT_CELL_GRIPPER_VISUAL = {
  gripCenterY: 0,
  flangeCenterY: -0.155,
  adapterCenterY: -0.112,
  palmCenterY: -0.075,
  fingerCenterY: 0.015,
  fingerLength: 0.22,
  fingerThickness: 0.04,
  jawPadCenterY: 0.095,
  openFingerOffset: 0.14,
  closedFingerOffset: 0.085,
} as const;

export function robotCellTargetFromScenePlane(
  scenePoint: { x: number; z: number },
  tcpHeight: number,
): { x: number; y: number; z: number } {
  return { x: scenePoint.x, y: -scenePoint.z, z: tcpHeight };
}

export function robotCellAxisTarget(
  current: { x: number; y: number; z: number },
  axis: "x" | "y" | "z",
  value: number,
): { x: number; y: number; z: number } {
  return { ...current, [axis]: value };
}
