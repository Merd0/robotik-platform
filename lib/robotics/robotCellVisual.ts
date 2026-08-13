/**
 * Gripper'ın yerel Y ekseni takım yaklaşma eksenidir ve TCP (Y=0)
 * iki çenenin kavrama merkezidir. Ölçüler metre cinsindedir.
 */
export const ROBOT_CELL_GRIPPER_VISUAL = {
  gripCenterY: 0,
  flangeCenterY: -0.105,
  adapterCenterY: -0.075,
  palmCenterY: -0.052,
  fingerCenterY: 0.01,
  fingerLength: 0.13,
  fingerThickness: 0.03,
  jawPadCenterY: 0.055,
  openFingerOffset: 0.105,
  closedFingerOffset: 0.075,
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
