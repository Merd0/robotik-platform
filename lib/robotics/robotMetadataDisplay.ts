import type { RobotSpec } from "./kinematics";

/** Milimetreyi kısa, insan-okur bir birim dizgisine çevirir (1 m üstü metre, altı mm). */
export function formatReachMm(mm: number): string {
  if (mm >= 1000 && mm % 1000 === 0) return `${mm / 1000} m`;
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm} mm`;
}

/**
 * Sum-of-a azami erişim formülü SADECE düz (alpha=0), tamamen döner
 * eklemli bir zincirde geçerli — IkTarget'ın generic-2dof için zaten
 * kullandığı formülle aynı (bkz. components/interactive/IkTarget.tsx
 * `maxReach`). Genel bir DH zincirinde (d ofseti, alpha bükümü olan)
 * sum-of-a yanlış/yanıltıcı bir sayı üretir — bu yüzden koşul dışındaki
 * robotlar için (ör. generic-6dof, generic-prismatic) null döner, hiçbir
 * sayı UYDURULMAZ.
 */
export function planarRevoluteMaxReachM(robot: RobotSpec): number | null {
  const isPlanarRevoluteChain = robot.joints.every(
    (joint) => joint.type === "revolute" && joint.dhParams.alpha === 0,
  );
  if (!isPlanarRevoluteChain) return null;
  return robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
}
