"use client";

import { useMemo, type ReactNode } from "react";
import { Cone, Cylinder, Grid, Line, Sphere, Torus } from "@react-three/drei";
import * as THREE from "three";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import { identity, type Vec3 } from "@/lib/robotics/transform";
import { useTheme } from "@/components/ui/ThemeProvider";
import { SCENE_PALETTES } from "@/lib/theme";
import {
  frameAxesOf,
  jointAxisOf,
  roboticsFrameToScene,
  roboticsVectorToScene,
  type FrameAxes,
} from "./robotFrames";
import { SceneCanvas } from "./SceneCanvas";

interface RobotArmProps {
  robot: RobotSpec;
  jointAngles: number[];
  /** Kaydırıcıda seçili eklem; gerçek DH ekseni sahnede vurgulanır. */
  activeJointIndex?: number;
  /** Sahneye eklenecek ek öğeler (ör. IkTarget'ın sürüklenebilir hedefi). */
  children?: ReactNode;
}

const LINK_RADIUS = 0.04;
const JOINT_RADIUS = 0.07;
const FRAME_AXIS_LENGTH = 0.24;
const BASE_FRAME = frameAxesOf(identity());

function toThreeVector(p: Vec3): [number, number, number] {
  return [p.x, p.y, p.z];
}

function ArmSegment({ start, end, color }: { start: Vec3; end: Vec3; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const segmentLength = direction.length();
    const midpoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    return { position: midpoint, quaternion: quat, length: segmentLength };
  }, [start, end]);

  if (length < 1e-6) return null;

  return (
    <Cylinder
      args={[LINK_RADIUS, LINK_RADIUS, length, 16]}
      position={position}
      quaternion={quaternion}
    >
      <meshStandardMaterial color={color} />
    </Cylinder>
  );
}

function AxisArrow({
  origin,
  direction,
  length,
  color,
  opacity = 1,
}: {
  origin: Vec3;
  direction: Vec3;
  length: number;
  color: string;
  opacity?: number;
}) {
  const { end, headPosition, quaternion } = useMemo(() => {
    const start = new THREE.Vector3(origin.x, origin.y, origin.z);
    const axis = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    const arrowEnd = start.clone().addScaledVector(axis, length);
    const headLength = Math.min(0.075, length * 0.3);

    return {
      end: arrowEnd,
      headPosition: arrowEnd.clone().addScaledVector(axis, -headLength / 2),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis),
    };
  }, [direction, length, origin]);

  return (
    <group renderOrder={4}>
      <Line
        points={[toThreeVector(origin), end]}
        color={color}
        lineWidth={2.5}
        transparent={opacity < 1}
        opacity={opacity}
        depthTest={false}
      />
      <Cone args={[0.028, Math.min(0.075, length * 0.3), 12]} position={headPosition} quaternion={quaternion}>
        <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} depthTest={false} />
      </Cone>
    </group>
  );
}

function FrameTriad({
  frame,
  colors,
  opacity,
}: {
  frame: FrameAxes;
  colors: { x: string; y: string; z: string };
  opacity: number;
}) {
  return (
    <group>
      <AxisArrow origin={frame.origin} direction={frame.x} length={FRAME_AXIS_LENGTH} color={colors.x} opacity={opacity} />
      <AxisArrow origin={frame.origin} direction={frame.y} length={FRAME_AXIS_LENGTH} color={colors.y} opacity={opacity} />
      <AxisArrow origin={frame.origin} direction={frame.z} length={FRAME_AXIS_LENGTH} color={colors.z} opacity={opacity} />
    </group>
  );
}

function JointAxisMarker({ origin, direction, color }: { origin: Vec3; direction: Vec3; color: string }) {
  const { arrowOrigin, ringQuaternion } = useMemo(() => {
    const axis = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    return {
      arrowOrigin: new THREE.Vector3(origin.x, origin.y, origin.z).addScaledVector(axis, -0.18),
      ringQuaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis),
    };
  }, [direction, origin]);

  return (
    <group>
      <AxisArrow
        origin={{ x: arrowOrigin.x, y: arrowOrigin.y, z: arrowOrigin.z }}
        direction={direction}
        length={0.44}
        color={color}
      />
      <Torus args={[0.11, 0.012, 12, 48]} position={toThreeVector(origin)} quaternion={ringQuaternion} renderOrder={3}>
        <meshBasicMaterial color={color} depthTest={false} />
      </Torus>
    </group>
  );
}

function ArmModel({
  robot,
  jointAngles,
  activeJointIndex,
  linkColor,
  accentColor,
  palette,
}: RobotArmProps & {
  linkColor: string;
  accentColor: string;
  palette: (typeof SCENE_PALETTES)[keyof typeof SCENE_PALETTES];
}) {
  const { jointPositions, jointTransforms } = useMemo(
    () => forwardKinematics(robot, jointAngles),
    [robot, jointAngles],
  );
  const showsOrientation = robot.joints.length === 6;
  const sceneJointPositions = showsOrientation
    ? jointPositions.map(roboticsVectorToScene)
    : jointPositions;
  const toolFrame = showsOrientation
    ? roboticsFrameToScene(frameAxesOf(jointTransforms[jointTransforms.length - 1]))
    : null;
  const activeAxisRobotics =
    showsOrientation && activeJointIndex !== undefined
      ? jointAxisOf(jointTransforms, activeJointIndex)
      : null;
  const activeAxis = activeAxisRobotics
    ? {
        origin: roboticsVectorToScene(activeAxisRobotics.origin),
        direction: roboticsVectorToScene(activeAxisRobotics.direction),
      }
    : null;

  return (
    <group>
      {sceneJointPositions.slice(0, -1).map((position, index) => (
        <ArmSegment key={index} start={position} end={sceneJointPositions[index + 1]} color={linkColor} />
      ))}
      {sceneJointPositions.map((position, index) => (
        <Sphere
          key={index}
          args={[index === activeJointIndex ? JOINT_RADIUS * 1.22 : JOINT_RADIUS, 24, 24]}
          position={toThreeVector(position)}
        >
          <meshStandardMaterial
            color={index === activeJointIndex ? palette.activeAxis : index === 0 ? linkColor : accentColor}
          />
        </Sphere>
      ))}
      {showsOrientation && (
        <>
          <FrameTriad
            frame={roboticsFrameToScene(BASE_FRAME)}
            colors={{ x: palette.axisX, y: palette.axisY, z: palette.axisZ }}
            opacity={0.55}
          />
          {toolFrame && (
            <FrameTriad
              frame={toolFrame}
              colors={{ x: palette.axisX, y: palette.axisY, z: palette.axisZ }}
              opacity={1}
            />
          )}
          {activeAxis && <JointAxisMarker {...activeAxis} color={palette.activeAxis} />}
        </>
      )}
    </group>
  );
}

/** Basit robot kolu, eklem ekseni ve uç çerçevesi çizimi. Kamera sabit — kullanıcı sahneyi bozamaz. */
export function RobotArm({ robot, jointAngles, activeJointIndex, children }: RobotArmProps) {
  const { theme } = useTheme();
  const palette = SCENE_PALETTES[theme];
  const isSpatialRobot = robot.joints.length === 6;

  return (
    <SceneCanvas
      camera={isSpatialRobot ? { position: [1.8, 1.4, 2.4], fov: 45 } : { position: [0, 0.4, 4.6], fov: 50 }}
      className="touch-pan-y"
      style={{ background: palette.background }}
      data-robot-arm={robot.id}
      data-active-joint={activeJointIndex === undefined ? undefined : activeJointIndex + 1}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1} />
      <Grid
        position={[0, -0.01, 0]}
        args={[6, 6]}
        cellColor={palette.grid}
        sectionColor={palette.gridSection}
        fadeDistance={8}
      />
      <ArmModel
        robot={robot}
        jointAngles={jointAngles}
        activeJointIndex={activeJointIndex}
        linkColor={palette.link}
        accentColor={palette.accent}
        palette={palette}
      />
      {children}
    </SceneCanvas>
  );
}
