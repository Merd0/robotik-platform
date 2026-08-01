import type { RobotSpec } from "../kinematics";
import { genericTwoDofRobot } from "./genericTwoDof";

const REGISTRY: Record<string, RobotSpec> = {
  [genericTwoDofRobot.id]: genericTwoDofRobot,
};

export function getRobotById(id: string): RobotSpec {
  const robot = REGISTRY[id];
  if (!robot) throw new Error(`Bilinmeyen robot id: "${id}"`);
  return robot;
}

export { genericTwoDofRobot };
