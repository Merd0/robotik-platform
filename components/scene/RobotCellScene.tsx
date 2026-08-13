"use client";

import { Box, Cylinder, Grid, Line, OrbitControls, Sphere } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cameraPresetOf, type RobotCellCameraPreset } from "@/lib/robotics/robotCellStudio";
import type { RobotSpec } from "@/lib/robotics/kinematics";
import { SCENE_PALETTES } from "@/lib/theme";
import { RobotArmModel } from "./RobotArm";
import { SceneCanvas } from "./SceneCanvas";

function CameraRig({ preset }: { preset: RobotCellCameraPreset }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const definition = cameraPresetOf(preset);

  useEffect(() => {
    camera.position.set(...definition.position);
    camera.lookAt(...definition.target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, definition, invalidate]);

  return <OrbitControls makeDefault target={definition.target} enableDamping={false} minDistance={1.4} maxDistance={6} />;
}
function Table() {
  return (
    <group>
      <Box args={[0.9, 0.08, 1.18]} position={[0.78, 0.32, 0.02]}>
        <meshStandardMaterial color="#334155" roughness={0.78} />
      </Box>
      {[[0.42, 0.15, -0.45], [1.14, 0.15, -0.45], [0.42, 0.15, 0.49], [1.14, 0.15, 0.49]].map((position, index) => (
        <Box key={index} args={[0.07, 0.3, 0.07]} position={position as [number, number, number]}>
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
}: {
  robot: RobotSpec;
  jointAngles: number[];
  activeJointIndex: number;
  cameraPreset: RobotCellCameraPreset;
  showFrames: boolean;
}) {
  const { theme } = useTheme();
  const palette = SCENE_PALETTES[theme];

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
      <RobotArmModel robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} showFrames={showFrames} />
      <Table />
      <Box args={[0.28, 0.28, 0.28]} position={[0.72, 0.5, 0.18]}>
        <meshStandardMaterial color="#7c2d12" roughness={0.7} />
      </Box>
      <Sphere args={[0.075, 20, 20]} position={[0.64, 0.45, -0.22]}>
        <meshStandardMaterial color="#f59e0b" emissive="#7c2d12" emissiveIntensity={0.18} />
      </Sphere>
      <Box args={[0.34, 0.22, 0.36]} position={[0.86, 0.46, 0.39]}>
        <meshStandardMaterial color="#1d4ed8" roughness={0.68} />
      </Box>
      <SafetyFence />
      <CameraRig preset={cameraPreset} />
    </SceneCanvas>
  );
}
