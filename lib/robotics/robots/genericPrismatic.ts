import type { RobotSpec } from "../kinematics";

/**
 * İki eklemli, düzlemsel örnek kol — biri döner (revolute), biri doğrusal
 * (prismatic). A/Lise "döner ve doğrusal eklemler" dersi için: joint1'in
 * alpha=90° olması, joint2'nin (prismatic) kayma yönünü joint1'in koluna
 * DİK ve XY düzleminde tutar (bkz. lib/robotics/transform.ts dhTransform —
 * Rz(theta)·Rx(alpha) bileşimi, alpha=90° olduğunda çerçevenin Z ekseni
 * XY düzlemine döner). Sayısal doğrulama: forwardKinematics ile
 * theta1=0/30/90/180° ve d=0/0.3/0.6 için elle hesaplanıp doğrulandı, z
 * her durumda 0 kalıyor.
 */
export const genericPrismaticRobot: RobotSpec = {
  id: "generic-prismatic",
  displayName: "Döner + doğrusal eklemli örnek kol",
  joints: [
    {
      type: "revolute",
      dhParams: { a: 0.6, alpha: Math.PI / 2, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "prismatic",
      dhParams: { a: 0, alpha: 0, d: 0, theta: 0 },
      limits: { min: 0, max: 0.6 },
      maxVelocity: 0.5,
    },
  ],
};
