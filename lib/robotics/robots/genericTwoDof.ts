import type { RobotSpec } from "../kinematics";

/**
 * İki eklemli, düzlemsel (planar) örnek kol. Faz 0'ın ilk dersi ve
 * doğrulama fixture'ları bu robot üzerinden çalışır — analitik FK'sı
 * (x = a1*cos(θ1) + a2*cos(θ1+θ2)) elle doğrulanabildiği için güvenilir
 * bir "oracle" görevi görür. Endüstriyel robotlar (ör. KUKA iiwa,
 * reference-python'da PyBullet ile) ileri seviye derslerde ayrıca ele alınır.
 */
export const genericTwoDofRobot: RobotSpec = {
  id: "generic-2dof",
  displayName: "Genel 2 eklemli kol",
  joints: [
    {
      type: "revolute",
      dhParams: { a: 1.0, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0.8, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
  ],
};
