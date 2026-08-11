"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { Grid, Line } from "@react-three/drei";
import type { Vec3 } from "@/lib/robotics/transform";
import type { Obstacle } from "@/lib/robotics/collision";
import { useTheme } from "@/components/ui/ThemeProvider";
import { SCENE_PALETTES } from "@/lib/theme";
import { SceneCanvas } from "./SceneCanvas";

export interface PlannerPathDisplay {
  algorithm: string;
  color: string;
  points: Vec3[];
}

interface PlanningGridProps {
  /** Görünen ızgaranın kenar uzunluğu (metre); sahne (-extent/2, extent/2) aralığında. */
  extent: number;
  obstacles: readonly Obstacle[];
  start: Vec3;
  goal: Vec3;
  paths: readonly PlannerPathDisplay[];
  onPlaneClick?: (point: Vec3) => void;
}

// Görünmez tıklama düzlemi, engellerin önünde durur ki tıklama her zaman
// engel geometrisi yerine bu düzlemi vursun (raycasting kameraya en yakın
// nesneyi seçer).
const CATCHER_PLANE_Z = 0.5;

function toVector3(p: Vec3): [number, number, number] {
  return [p.x, p.y, p.z];
}

function ObstacleMesh({ obstacle, color }: { obstacle: Obstacle; color: string }) {
  if (obstacle.kind === "sphere") {
    const [radius] = obstacle.size;
    return (
      <mesh position={toVector3(obstacle.center)}>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  const [halfX, halfY, halfZ] = obstacle.size;
  return (
    <mesh position={toVector3(obstacle.center)}>
      <boxGeometry args={[halfX * 2, halfY * 2, Math.max(halfZ * 2, 0.08)]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * Yol planlama sahnesi: X/Y düzlemi çalışma alanı (RobotArm/IkTarget'la aynı
 * kural — kamera +Z'den bakar), engeller ve algoritma yolları bu düzlemde.
 * Kamera sabit, kullanıcı sahneyi bozamaz (bkz. docs/04 "etkileşimli sahne kuralları").
 */
export function PlanningGrid({ extent, obstacles, start, goal, paths, onPlaneClick }: PlanningGridProps) {
  const markerRadius = Math.min(0.09, extent * 0.03);
  const { theme } = useTheme();
  const palette = SCENE_PALETTES[theme];

  return (
    <SceneCanvas camera={{ position: [0, 0.3, extent * 1.15], fov: 45 }} className="touch-pan-y" style={{ background: palette.background }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 4]} intensity={0.9} />
      <Grid
        position={[0, 0, -0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[extent, extent]}
        cellColor={palette.grid}
        sectionColor={palette.gridSection}
        fadeDistance={extent * 2.5}
      />

      {onPlaneClick && (
        <mesh
          position={[0, 0, CATCHER_PLANE_Z]}
          onPointerDown={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onPlaneClick({ x: event.point.x, y: event.point.y, z: 0 });
          }}
        >
          <planeGeometry args={[extent, extent]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {obstacles.map((obstacle, index) => (
        <ObstacleMesh key={index} obstacle={obstacle} color={palette.obstacle} />
      ))}

      {paths
        .filter((path) => path.points.length > 1)
        .map((path) => (
          <Line key={path.algorithm} points={path.points.map(toVector3)} color={path.color} lineWidth={2.5} />
        ))}

      <mesh position={toVector3(start)}>
        <sphereGeometry args={[markerRadius, 20, 20]} />
        <meshStandardMaterial color={palette.start} />
      </mesh>
      <mesh position={toVector3(goal)}>
        <sphereGeometry args={[markerRadius, 20, 20]} />
        <meshStandardMaterial color={palette.goal} />
      </mesh>
    </SceneCanvas>
  );
}
