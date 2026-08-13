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

export const ROBOT_CELL_HOME_DEGREES = [14.44, 76.52, 9.64, 15.63, -174.91, 129.53] as const;

const CAMERA_PRESETS: Record<RobotCellCameraPreset, RobotCellCameraDefinition> = {
  cell: { label: "Hücre", position: [1.75, 1.25, 1.9], target: [0.43, 0.5, 0] },
  top: { label: "Üstten", position: [0.35, 3.8, 0.01], target: [0.35, 0, 0] },
  front: { label: "Önden", position: [0.42, 0.9, 2.65], target: [0.42, 0.48, 0] },
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
