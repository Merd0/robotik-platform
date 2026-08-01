"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Cylinder, Sphere, Grid } from "@react-three/drei";
import * as THREE from "three";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import type { Vec3 } from "@/lib/robotics/transform";

interface RobotArmProps {
  robot: RobotSpec;
  jointAngles: number[];
}

const ACCENT_COLOR = "#0ea5a0";
const LINK_COLOR = "#334155";
const LINK_RADIUS = 0.04;
const JOINT_RADIUS = 0.07;

function toThreeVector(p: Vec3): [number, number, number] {
  return [p.x, p.y, p.z];
}

function ArmSegment({ start, end }: { start: Vec3; end: Vec3 }) {
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
      <meshStandardMaterial color={LINK_COLOR} />
    </Cylinder>
  );
}

function ArmModel({ robot, jointAngles }: RobotArmProps) {
  const { jointPositions } = useMemo(
    () => forwardKinematics(robot, jointAngles),
    [robot, jointAngles],
  );

  return (
    <group>
      {jointPositions.slice(0, -1).map((position, index) => (
        <ArmSegment key={index} start={position} end={jointPositions[index + 1]} />
      ))}
      {jointPositions.map((position, index) => (
        <Sphere key={index} args={[JOINT_RADIUS, 24, 24]} position={toThreeVector(position)}>
          <meshStandardMaterial color={index === 0 ? LINK_COLOR : ACCENT_COLOR} />
        </Sphere>
      ))}
    </group>
  );
}

/** Basit, düzlemsel robot kolu çizimi. Kamera sabit — kullanıcı sahneyi bozamaz. */
export function RobotArm({ robot, jointAngles }: RobotArmProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.6], fov: 50 }}
      dpr={[1, 2]}
      className="touch-none"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1} />
      <Grid
        position={[0, -0.01, 0]}
        args={[6, 6]}
        cellColor="#cbd5e1"
        sectionColor="#94a3b8"
        fadeDistance={8}
      />
      <ArmModel robot={robot} jointAngles={jointAngles} />
    </Canvas>
  );
}
