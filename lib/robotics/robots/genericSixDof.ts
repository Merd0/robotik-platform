import type { RobotSpec } from "../kinematics";

/**
 * Genel, altı eksenli (6R, antropomorfik) örnek kol. Belirli bir üretici
 * modeline karşılık gelmez — DH parametreleri sadece "6 eksenli bir kol
 * nasıl bir kinematik zincir kurar" kavramını göstermek için seçildi
 * (bkz. docs/01-mufredat.md "A / Üniversite" ve "A / Lise — DOF"). Gerçek
 * marka/model iddiaları için ders metinlerinde ayrıca kaynak gösterilir,
 * bu robot tanımının kendisi bir iddia taşımaz (generic-2dof ile aynı
 * gerekçe, bkz. lib/robotics/robots/genericTwoDof.ts).
 */
export const genericSixDofRobot: RobotSpec = {
  id: "generic-6dof",
  displayName: "Genel 6 eksenli kol",
  joints: [
    {
      type: "revolute",
      dhParams: { a: 0, alpha: Math.PI / 2, d: 0.4, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0.5, alpha: 0, d: 0, theta: 0 },
      limits: { min: -Math.PI / 2, max: Math.PI / 2 },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: Math.PI / 2, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: -Math.PI / 2, d: 0.5, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: Math.PI / 2, d: 0, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: 0, d: 0.15, theta: 0 },
      limits: { min: -Math.PI, max: Math.PI },
      maxVelocity: Math.PI,
    },
  ],
};
