import type { Mat4, Vec3 } from "@/lib/robotics/transform";

export interface FrameAxes {
  origin: Vec3;
  x: Vec3;
  y: Vec3;
  z: Vec3;
}

export interface ToolOrientation {
  roll: number;
  pitch: number;
  yaw: number;
}

const WORLD_ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };
const WORLD_Z: Vec3 = { x: 0, y: 0, z: 1 };
const RAD_TO_DEG = 180 / Math.PI;

/** Homojen dönüşümün konumunu ve dünya çerçevesindeki yerel eksenlerini ayırır. */
export function frameAxesOf(transform: Mat4): FrameAxes {
  return {
    origin: { x: transform[0][3], y: transform[1][3], z: transform[2][3] },
    x: { x: transform[0][0], y: transform[1][0], z: transform[2][0] },
    y: { x: transform[0][1], y: transform[1][1], z: transform[2][1] },
    z: { x: transform[0][2], y: transform[1][2], z: transform[2][2] },
  };
}

/** Robotik Z-yukarı koordinatını Three.js Y-yukarı sahne koordinatına taşır. */
export function roboticsVectorToScene(vector: Vec3): Vec3 {
  return { x: vector.x, y: vector.z, z: -vector.y };
}

export function roboticsFrameToScene(frame: FrameAxes): FrameAxes {
  return {
    origin: roboticsVectorToScene(frame.origin),
    x: roboticsVectorToScene(frame.x),
    y: roboticsVectorToScene(frame.y),
    z: roboticsVectorToScene(frame.z),
  };
}

/**
 * Standart DH zincirinde eklem i, çerçeve i-1'in Z ekseninde hareket eder.
 * Renderer bu bilgiyle seçili eklemin gerçek dünya eksenini gösterir.
 */
export function jointAxisOf(jointTransforms: Mat4[], jointIndex: number): { origin: Vec3; direction: Vec3 } {
  if (jointIndex <= 0) return { origin: WORLD_ORIGIN, direction: WORLD_Z };

  const previousFrame = frameAxesOf(jointTransforms[jointIndex - 1]);
  return { origin: previousFrame.origin, direction: previousFrame.z };
}

/**
 * Dönüşüm matrisini ZYX sıralı roll-pitch-yaw açılarına çevirir.
 * Sonuç yalnız okunabilir arayüz özeti içindir; kinematik hesabın girdisi değildir.
 */
export function toolOrientationOf(transform: Mat4): ToolOrientation {
  const pitch = Math.asin(Math.max(-1, Math.min(1, -transform[2][0])));
  const cosPitch = Math.cos(pitch);

  if (Math.abs(cosPitch) > 1e-8) {
    return {
      roll: Math.atan2(transform[2][1], transform[2][2]) * RAD_TO_DEG,
      pitch: pitch * RAD_TO_DEG,
      yaw: Math.atan2(transform[1][0], transform[0][0]) * RAD_TO_DEG,
    };
  }

  return {
    roll: Math.atan2(-transform[1][2], transform[1][1]) * RAD_TO_DEG,
    pitch: pitch * RAD_TO_DEG,
    yaw: 0,
  };
}
