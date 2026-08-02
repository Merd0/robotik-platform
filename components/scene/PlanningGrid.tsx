"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Grid, Line } from "@react-three/drei";
import type { Vec3 } from "@/lib/robotics/transform";
import type { Obstacle } from "@/lib/robotics/collision";

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

const START_COLOR = "#0ea5a0";
const GOAL_COLOR = "#dc2626";
const OBSTACLE_COLOR = "#475569";
// Görünmez tıklama düzlemi, engellerin önünde durur ki tıklama her zaman
// engel geometrisi yerine bu düzlemi vursun (raycasting kameraya en yakın
// nesneyi seçer).
const CATCHER_PLANE_Z = 0.5;

function toVector3(p: Vec3): [number, number, number] {
  return [p.x, p.y, p.z];
}

function ObstacleMesh({ obstacle }: { obstacle: Obstacle }) {
  if (obstacle.kind === "sphere") {
    const [radius] = obstacle.size;
    return (
      <mesh position={toVector3(obstacle.center)}>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color={OBSTACLE_COLOR} />
      </mesh>
    );
  }
  const [halfX, halfY, halfZ] = obstacle.size;
  return (
    <mesh position={toVector3(obstacle.center)}>
      <boxGeometry args={[halfX * 2, halfY * 2, Math.max(halfZ * 2, 0.08)]} />
      <meshStandardMaterial color={OBSTACLE_COLOR} />
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

  return (
    <Canvas camera={{ position: [0, 0.3, extent * 1.15], fov: 45 }} dpr={[1, 2]} className="touch-none">
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 4]} intensity={0.9} />
      <Grid
        position={[0, 0, -0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[extent, extent]}
        cellColor="#cbd5e1"
        sectionColor="#94a3b8"
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
        <ObstacleMesh key={index} obstacle={obstacle} />
      ))}

      {paths
        .filter((path) => path.points.length > 1)
        .map((path) => (
          <Line key={path.algorithm} points={path.points.map(toVector3)} color={path.color} lineWidth={2.5} />
        ))}

      <mesh position={toVector3(start)}>
        <sphereGeometry args={[markerRadius, 20, 20]} />
        <meshStandardMaterial color={START_COLOR} />
      </mesh>
      <mesh position={toVector3(goal)}>
        <sphereGeometry args={[markerRadius, 20, 20]} />
        <meshStandardMaterial color={GOAL_COLOR} />
      </mesh>
    </Canvas>
  );
}
