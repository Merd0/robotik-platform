"use client";

import { Box, Cylinder, Grid, Line, OrbitControls, Sphere, Torus } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cameraPresetOf, type RobotCellCameraPreset } from "@/lib/robotics/robotCellStudio";
import { ROBOT_CELL_OBSTACLES, type RobotCellMotionPlan, type RobotCellObstacle } from "@/lib/robotics/robotCellMotion";
import { ROBOT_CELL_WORKPIECE } from "@/lib/robotics/robotCellProgram";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import type { Vec3 } from "@/lib/robotics/transform";
import { SCENE_PALETTES } from "@/lib/theme";
import { RobotArmModel } from "./RobotArm";
import { roboticsVectorToScene } from "./robotFrames";
import { SceneCanvas } from "./SceneCanvas";

function toSceneTuple(point: Vec3): [number, number, number] {
  const scenePoint = roboticsVectorToScene(point);
  return [scenePoint.x, scenePoint.y, scenePoint.z];
}

function obstacleSizeInScene(obstacle: RobotCellObstacle): [number, number, number] {
  return [obstacle.halfSize.x * 2, obstacle.halfSize.z * 2, obstacle.halfSize.y * 2];
}

function requiredObstacle(id: string): RobotCellObstacle {
  const obstacle = ROBOT_CELL_OBSTACLES.find((candidate) => candidate.id === id);
  if (!obstacle) throw new Error(`3B hücre engeli bulunamadı: ${id}`);
  return obstacle;
}

function CameraRig({ preset, directControl }: { preset: RobotCellCameraPreset; directControl: boolean }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const definition = cameraPresetOf(preset);

  useEffect(() => {
    camera.position.set(...definition.position);
    camera.lookAt(...definition.target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, definition, invalidate]);

  return <OrbitControls makeDefault target={definition.target} enableDamping={false} enableRotate={!directControl} enablePan={!directControl} minDistance={1.4} maxDistance={6} />;
}
function Table() {
  const table = requiredObstacle("table");
  return (
    <group>
      <Box args={obstacleSizeInScene(table)} position={toSceneTuple(table.center)}>
        <meshStandardMaterial color="#334155" roughness={0.78} />
      </Box>
      {[[0.42, 0.11, -0.45], [1.14, 0.11, -0.45], [0.42, 0.11, 0.49], [1.14, 0.11, 0.49]].map((position, index) => (
        <Box key={index} args={[0.07, 0.22, 0.07]} position={position as [number, number, number]}>
          <meshStandardMaterial color="#1e293b" />
        </Box>
      ))}
    </group>
  );
}

function SafetyFence() {
  const posts: Array<[number, number, number]> = [
    [-0.45, 0.58, -0.85], [-0.45, 0.58, 0.85], [1.55, 0.58, -0.85], [1.55, 0.58, 0.85],
  ];
  return (
    <group>
      {posts.map((position, index) => (
        <Cylinder key={index} args={[0.025, 0.025, 1.16, 10]} position={position}>
          <meshStandardMaterial color="#64748b" />
        </Cylinder>
      ))}
      <Line points={[posts[0], posts[1]]} color="#64748b" lineWidth={1.5} transparent opacity={0.55} />
      <Line points={[posts[0], posts[2]]} color="#64748b" lineWidth={1.5} transparent opacity={0.55} />
      <Line points={[posts[1], posts[3]]} color="#64748b" lineWidth={1.5} transparent opacity={0.55} />
    </group>
  );
}

export function RobotCellScene({
  robot,
  jointAngles,
  activeJointIndex,
  cameraPreset,
  showFrames,
  motionPlans,
  selectedMotion,
  targetTcp,
  workpiecePosition,
  gripperClosed = false,
  directControl = false,
  onGripperTarget,
}: {
  robot: RobotSpec;
  jointAngles: number[];
  activeJointIndex: number;
  cameraPreset: RobotCellCameraPreset;
  showFrames: boolean;
  motionPlans?: RobotCellMotionPlan[];
  selectedMotion?: "movej" | "movel";
  targetTcp?: Vec3;
  workpiecePosition?: Vec3;
  gripperClosed?: boolean;
  directControl?: boolean;
  onGripperTarget?: (target: Vec3) => void;
}) {
  const { theme } = useTheme();
  const palette = SCENE_PALETTES[theme];
  const tcpTransform = forwardKinematics(robot, jointAngles).jointTransforms.at(-1)!;
  const gripperQuaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(
    tcpTransform[0][0], tcpTransform[0][2], -tcpTransform[0][1], 0,
    tcpTransform[2][0], tcpTransform[2][2], -tcpTransform[2][1], 0,
    -tcpTransform[1][0], -tcpTransform[1][2], tcpTransform[1][1], 0,
    0, 0, 0, 1,
  ));
  const fixture = requiredObstacle("fixture");
  const bin = requiredObstacle("bin");
  const tcp = forwardKinematics(robot, jointAngles).endEffector;
  const gripperScenePosition = toSceneTuple(tcp);
  const fingerOffset = gripperClosed ? 0.083 : 0.12;
  const [draggingGripper, setDraggingGripper] = useState(false);
  const dragTarget = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onGripperTarget?.({ x: event.point.x, y: -event.point.z, z: event.point.y });
  };

  return (
    <SceneCanvas
      camera={{ position: cameraPresetOf("cell").position, fov: 42, near: 0.05, far: 30 }}
      style={{ background: palette.background }}
      data-robot-cell-scene="true"
      data-camera-preset={cameraPreset}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[2.8, 4.5, 2.2]} intensity={1.35} />
      <directionalLight position={[-2, 2, -1]} intensity={0.35} />
      <Grid
        position={[0.5, -0.006, 0]}
        args={[4.5, 4.5]}
        cellSize={0.1}
        sectionSize={0.5}
        cellColor={palette.grid}
        sectionColor={palette.gridSection}
        fadeDistance={7}
      />
      <Cylinder args={[0.22, 0.26, 0.16, 24]} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#0f766e" metalness={0.18} roughness={0.55} />
      </Cylinder>
      <RobotArmModel robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} showFrames={showFrames} industrial />
      <group position={gripperScenePosition} quaternion={gripperQuaternion}>
        <Cylinder args={[0.075, 0.075, 0.1, 24]} position={[0, 0.24, 0]}>
          <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.32} />
        </Cylinder>
        <Box args={[0.28, 0.07, 0.14]} position={[0, 0.16, 0]}>
          <meshStandardMaterial color="#0f766e" metalness={0.35} roughness={0.38} />
        </Box>
        <Box args={[0.045, 0.2, 0.055]} position={[-fingerOffset, 0.03, 0]}>
          <meshStandardMaterial color={gripperClosed ? "#fbbf24" : "#e2e8f0"} metalness={0.55} roughness={0.3} />
        </Box>
        <Box args={[0.045, 0.2, 0.055]} position={[fingerOffset, 0.03, 0]}>
          <meshStandardMaterial color={gripperClosed ? "#fbbf24" : "#e2e8f0"} metalness={0.55} roughness={0.3} />
        </Box>
        {directControl && (
          <Sphere
            args={[0.18, 20, 20]}
            onPointerDown={(event) => { event.stopPropagation(); setDraggingGripper(true); }}
            onPointerUp={(event) => { event.stopPropagation(); setDraggingGripper(false); }}
          >
            <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
          </Sphere>
        )}
      </group>
      {directControl && (
        <mesh
          position={[0.55, 0.65, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={dragTarget}
          onPointerMove={(event) => { if (draggingGripper || event.buttons === 1) dragTarget(event); }}
          onPointerUp={() => setDraggingGripper(false)}
          onPointerLeave={() => setDraggingGripper(false)}
        >
          <planeGeometry args={[3.8, 3.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {motionPlans?.map((plan) => {
        if (plan.tcpPath.length < 2) return null;
        const selected = plan.kind === selectedMotion;
        const color = plan.status === "collision" ? "#fb7185" : plan.kind === "movej" ? "#a78bfa" : "#2dd4bf";
        return (
          <group key={plan.kind}>
            <Line
              points={plan.tcpPath.map(toSceneTuple)}
              color={color}
              lineWidth={selected ? 4 : 2}
              transparent
              opacity={selected ? 1 : 0.42}
            />
            {plan.firstIssue?.reason === "collision" && plan.samples[plan.firstIssue.sampleIndex] && (
              <Sphere args={[0.055, 16, 16]} position={toSceneTuple(plan.samples[plan.firstIssue.sampleIndex].tcp)}>
                <meshStandardMaterial color="#fb7185" emissive="#be123c" emissiveIntensity={0.65} />
              </Sphere>
            )}
          </group>
        );
      })}
      {targetTcp && (
        <group position={toSceneTuple(targetTcp)}>
          <Torus args={[0.1, 0.012, 10, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#fbbf24" emissive="#92400e" emissiveIntensity={0.45} />
          </Torus>
          <Line points={[[-0.14, 0, 0], [0.14, 0, 0]]} color="#fbbf24" lineWidth={2.5} />
          <Line points={[[0, -0.14, 0], [0, 0.14, 0]]} color="#fbbf24" lineWidth={2.5} />
        </group>
      )}
      <Table />
      <Box args={obstacleSizeInScene(fixture)} position={toSceneTuple(fixture.center)}>
        <meshStandardMaterial color="#7c2d12" roughness={0.7} />
      </Box>
      <Box args={[0.12, 0.12, 0.12]} position={toSceneTuple(workpiecePosition ?? ROBOT_CELL_WORKPIECE.start)}>
        <meshStandardMaterial color="#f59e0b" emissive="#7c2d12" emissiveIntensity={0.16} roughness={0.48} />
      </Box>
      <Box args={obstacleSizeInScene(bin)} position={toSceneTuple(bin.center)}>
        <meshStandardMaterial color="#1d4ed8" roughness={0.68} />
      </Box>
      <SafetyFence />
      <CameraRig preset={cameraPreset} directControl={directControl} />
    </SceneCanvas>
  );
}
