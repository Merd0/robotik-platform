import type { RobotSpec } from "../kinematics";
import { genericTwoDofRobot } from "./genericTwoDof";
import { genericPrismaticRobot } from "./genericPrismatic";
import { genericSixDofRobot } from "./genericSixDof";

const REGISTRY: Record<string, RobotSpec> = {
  [genericTwoDofRobot.id]: genericTwoDofRobot,
  [genericPrismaticRobot.id]: genericPrismaticRobot,
  [genericSixDofRobot.id]: genericSixDofRobot,
};

export function getRobotById(id: string): RobotSpec {
  const robot = REGISTRY[id];
  if (!robot) throw new Error(`Bilinmeyen robot id: "${id}"`);
  return robot;
}

export { genericTwoDofRobot, genericPrismaticRobot, genericSixDofRobot };
