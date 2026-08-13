import type { RobotSpec } from "./kinematics";

export type RobotCellCameraPreset = "cell" | "top" | "front";

export interface RobotCellStudioState {
  jointDegrees: number[];
  activeJointIndex: number;
  cameraPreset: RobotCellCameraPreset;
}

export interface RobotCellCameraDefinition {
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const ROBOT_CELL_HOME_DEGREES = [20, 50, -20, 0, 120, 0] as const;

const CAMERA_PRESETS: Record<RobotCellCameraPreset, RobotCellCameraDefinition> = {
  cell: { label: "Hücre", position: [2.35, 1.65, 2.55], target: [0.35, 0.45, 0] },
  top: { label: "Üstten", position: [0.35, 3.8, 0.01], target: [0.35, 0, 0] },
  front: { label: "Önden", position: [0.35, 1.05, 3.6], target: [0.35, 0.4, 0] },
};

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function createRobotCellStudioState(): RobotCellStudioState {
  return {
    jointDegrees: [...ROBOT_CELL_HOME_DEGREES],
    activeJointIndex: 0,
    cameraPreset: "cell",
  };
}

export function clampJointDegrees(robot: RobotSpec, jointIndex: number, degrees: number): number {
  const joint = robot.joints[jointIndex];
  if (!joint || !Number.isFinite(degrees)) return 0;
  const minimum = joint.limits.min * RAD_TO_DEG;
  const maximum = joint.limits.max * RAD_TO_DEG;
  return Math.min(maximum, Math.max(minimum, degrees));
}

export function updateRobotCellJoint(
  state: RobotCellStudioState,
  robot: RobotSpec,
  jointIndex: number,
  degrees: number,
): RobotCellStudioState {
  if (!robot.joints[jointIndex]) return state;
  return {
    ...state,
    activeJointIndex: jointIndex,
    jointDegrees: state.jointDegrees.map((value, index) =>
      index === jointIndex ? clampJointDegrees(robot, jointIndex, degrees) : value),
  };
}

export function jointAnglesRadians(state: RobotCellStudioState): number[] {
  return state.jointDegrees.map((degrees) => degrees * DEG_TO_RAD);
}

export function cameraPresetOf(preset: RobotCellCameraPreset): RobotCellCameraDefinition {
  return CAMERA_PRESETS[preset];
}
