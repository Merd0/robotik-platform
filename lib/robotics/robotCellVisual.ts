/**
 * Gripper'ın yerel Z ekseni takım yaklaşma eksenidir ve TCP (Z=0)
 * iki çenenin kavrama merkezidir. Ölçüler metre cinsindedir.
 */
export const ROBOT_CELL_GRIPPER_VISUAL = {
  gripCenterZ: 0,
  mountCenterZ: -0.145,
  palmCenterZ: -0.105,
  fingerCenterZ: -0.035,
  fingerLength: 0.13,
  fingerThickness: 0.03,
  jawPadCenterZ: 0.01,
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
