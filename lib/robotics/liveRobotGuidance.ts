import type { RobotSpec } from "./kinematics";

export const LIVE_GUIDANCE_MAX_FRAME_SECONDS = 0.05;

/**
 * Canlı IK hedefini tek karede atamak yerine RobotSpec hız limitleriyle yaklaşır.
 * Uzun bir ana-thread gecikmesi, bir sonraki karede büyük bir poz sıçramasına dönüşmez.
 */
export function stepLiveGuidanceAngles(
  robot: RobotSpec,
  currentAngles: readonly number[],
  targetAngles: readonly number[],
  elapsedSeconds: number,
): number[] {
  if (currentAngles.length !== robot.joints.length || targetAngles.length !== robot.joints.length) {
    throw new Error("Canlı sürüş açı dizileri RobotSpec eklem sayısıyla eşleşmeli.");
  }
  const safeElapsed = Math.min(
    LIVE_GUIDANCE_MAX_FRAME_SECONDS,
    Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0),
  );
  return currentAngles.map((current, index) => {
    const joint = robot.joints[index];
    const boundedTarget = Math.min(joint.limits.max, Math.max(joint.limits.min, targetAngles[index]));
    const difference = boundedTarget - current;
    const maxStep = Math.max(0, joint.maxVelocity) * safeElapsed;
    if (Math.abs(difference) <= maxStep) return boundedTarget;
    return Math.min(joint.limits.max, Math.max(joint.limits.min, current + Math.sign(difference) * maxStep));
  });
}
