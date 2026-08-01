import { dhTransform, multiply, identity, translationOf, type Mat4, type Vec3 } from "./transform";

export type JointType = "revolute" | "prismatic";

export interface JointSpec {
  type: JointType;
  dhParams: { a: number; alpha: number; d: number; theta: number };
  limits: { min: number; max: number };
  maxVelocity: number;
}

export interface RobotSpec {
  id: string;
  displayName: string;
  joints: JointSpec[];
  meshUrl?: string;
}

export interface ForwardKinematicsResult {
  /** Her eklemin ucundaki çerçevenin dünya konumu, taban dahil (index 0 = taban). */
  jointPositions: Vec3[];
  /** Her eklemin ucundaki tam dönüşüm matrisi. */
  jointTransforms: Mat4[];
  endEffector: Vec3;
}

/**
 * DH tabanlı ileri kinematik. jointAngles, her eklemin dhParams'taki theta/d
 * değerine EKLENEN canlı değişkendir (theta offset'i değil, joint'in
 * kendisidir) — bu yüzden statik robot tanımındaki theta/d "sıfır konumu"
 * (home offset), jointAngles ise kaydırıcıdan gelen anlık değerdir.
 */
export function forwardKinematics(robot: RobotSpec, jointAngles: number[]): ForwardKinematicsResult {
  if (jointAngles.length !== robot.joints.length) {
    throw new Error(
      `Eklem açısı sayısı (${jointAngles.length}) robotun eklem sayısıyla (${robot.joints.length}) eşleşmiyor.`,
    );
  }

  const jointTransforms: Mat4[] = [];
  const jointPositions: Vec3[] = [{ x: 0, y: 0, z: 0 }];

  let accumulated: Mat4 = identity();
  robot.joints.forEach((joint, index) => {
    const angle = jointAngles[index];
    const { a, alpha, d, theta } = joint.dhParams;
    const effectiveTheta = joint.type === "revolute" ? theta + angle : theta;
    const effectiveD = joint.type === "prismatic" ? d + angle : d;

    const step = dhTransform(a, alpha, effectiveD, effectiveTheta);
    accumulated = multiply(accumulated, step);
    jointTransforms.push(accumulated);
    jointPositions.push(translationOf(accumulated));
  });

  return {
    jointPositions,
    jointTransforms,
    endEffector: jointPositions[jointPositions.length - 1],
  };
}
