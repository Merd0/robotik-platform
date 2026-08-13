import { describe, expect, it } from "vitest";
import {
  frameAxesOf,
  industrialRobotVisualLayout,
  jointAxisOf,
  roboticsVectorToScene,
  toolOrientationOf,
} from "@/components/scene/robotFrames";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { genericSixDofRobot } from "@/lib/robotics/robots/genericSixDof";
import { rotationZ } from "@/lib/robotics/transform";

function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

describe("robot çerçevesi renderer verisi", () => {
  it("Z ekseni dönüşümünü okunabilir yaw açısına çevirir", () => {
    const orientation = toolOrientationOf(rotationZ(Math.PI / 2));

    expect(orientation.roll).toBeCloseTo(0, 8);
    expect(orientation.pitch).toBeCloseTo(0, 8);
    expect(orientation.yaw).toBeCloseTo(90, 8);
  });

  it("robotik Z-yukarı eksenini sahnede Y-yukarı gösterir", () => {
    expect(roboticsVectorToScene({ x: 0, y: 0, z: 1 })).toEqual({ x: 0, y: 1, z: -0 });
    expect(roboticsVectorToScene({ x: 0, y: 1, z: 0 })).toEqual({ x: 0, y: 0, z: -1 });
  });

  it("J6 döndüğünde TCP konumu sabitken alet X/Y eksenlerini döndürür", () => {
    const zeroAngles = genericSixDofRobot.joints.map(() => 0);
    const j6Turned = zeroAngles.map((angle, index) => (index === 5 ? Math.PI / 2 : angle));
    const before = forwardKinematics(genericSixDofRobot, zeroAngles);
    const after = forwardKinematics(genericSixDofRobot, j6Turned);

    expect(after.endEffector.x).toBeCloseTo(before.endEffector.x, 8);
    expect(after.endEffector.y).toBeCloseTo(before.endEffector.y, 8);
    expect(after.endEffector.z).toBeCloseTo(before.endEffector.z, 8);

    const beforeTool = frameAxesOf(before.jointTransforms.at(-1)!);
    const afterTool = frameAxesOf(after.jointTransforms.at(-1)!);
    expect(dot(beforeTool.x, afterTool.x)).toBeCloseTo(0, 8);
    expect(dot(beforeTool.y, afterTool.y)).toBeCloseTo(0, 8);
    expect(dot(beforeTool.z, afterTool.z)).toBeCloseTo(1, 8);

    const j6Axis = jointAxisOf(after.jointTransforms, 5);
    expect(dot(j6Axis.direction, afterTool.z)).toBeCloseTo(1, 8);
  });

  it("6 eksenli hücre robotunda üst üste binen DH noktalarını tek okunur bilek gövdesinde birleştirir", () => {
    const angles = [-13.16, 39.95, 44.79, 15.25, 163.25, 129.53].map((degrees) => degrees * Math.PI / 180);
    const { jointPositions, jointTransforms } = forwardKinematics(genericSixDofRobot, angles);
    const layout = industrialRobotVisualLayout(genericSixDofRobot, jointPositions, jointTransforms);

    expect(layout.links).toHaveLength(4);
    expect(layout.links.at(-1)).toEqual({ start: jointPositions[4], end: jointPositions[6] });
    expect(layout.joints.map((joint) => joint.kind)).toEqual(["shoulder", "elbow", "wrist"]);
    expect(layout.joints.map((joint) => joint.position)).toEqual([
      jointPositions[1],
      jointPositions[2],
      jointPositions[4],
    ]);
    expect(layout.flange.position).toEqual(jointPositions.at(-1));
  });
});
