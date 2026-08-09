import { forwardKinematics, type RobotSpec } from "./kinematics";
import { multiply, rotationZ, transformPoint, translation, type Mat4, type Vec3 } from "./transform";

export type TransformOrder = "rotation-then-translation" | "translation-then-rotation";

/**
 * Column-vector convention: A * B applies B first, then A. The human-facing
 * order names describe the physical action order, not the written matrix order.
 */
export function composePlanarTransform(
  order: TransformOrder,
  angleRadians: number,
  translationX: number,
): Mat4 {
  const rotation = rotationZ(angleRadians);
  const move = translation(translationX, 0, 0);
  return order === "translation-then-rotation"
    ? multiply(rotation, move)
    : multiply(move, rotation);
}

export function transformedFrame(
  transform: Mat4,
  axisLength = 0.55,
): { origin: Vec3; xAxis: Vec3; yAxis: Vec3 } {
  return {
    origin: transformPoint(transform, { x: 0, y: 0, z: 0 }),
    xAxis: transformPoint(transform, { x: axisLength, y: 0, z: 0 }),
    yAxis: transformPoint(transform, { x: 0, y: axisLength, z: 0 }),
  };
}

export interface CircleObstacle {
  x: number;
  y: number;
  radius: number;
}

export function segmentIntersectsCircle(start: Vec3, end: Vec3, obstacle: CircleObstacle): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((obstacle.x - start.x) * dx + (obstacle.y - start.y) * dy) / lengthSquared));
  const nearestX = start.x + projection * dx;
  const nearestY = start.y + projection * dy;
  return Math.hypot(nearestX - obstacle.x, nearestY - obstacle.y) <= obstacle.radius;
}

/** A configuration is forbidden when either physical link intersects the obstacle. */
export function configurationCollides(
  robot: RobotSpec,
  jointAngles: number[],
  obstacle: CircleObstacle,
): boolean {
  const { jointPositions } = forwardKinematics(robot, jointAngles);
  return jointPositions.slice(0, -1).some((start, index) =>
    segmentIntersectsCircle(start, jointPositions[index + 1], obstacle),
  );
}
