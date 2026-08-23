import type { RobotSpec } from "../kinematics";
import { genericTwoDofRobot } from "./genericTwoDof";
import { genericPrismaticRobot } from "./genericPrismatic";
import { genericSixDofRobot } from "./genericSixDof";
import { meca500R4Robot } from "./meca500R4";

const REGISTRY: Record<string, RobotSpec> = {
  [genericTwoDofRobot.id]: genericTwoDofRobot,
  [genericPrismaticRobot.id]: genericPrismaticRobot,
  [genericSixDofRobot.id]: genericSixDofRobot,
  [meca500R4Robot.id]: meca500R4Robot,
};

export function getRobotById(id: string): RobotSpec {
  const robot = REGISTRY[id];
  if (!robot) throw new Error(`Bilinmeyen robot id: "${id}"`);
  return robot;
}

export { genericTwoDofRobot, genericPrismaticRobot, genericSixDofRobot, meca500R4Robot };
