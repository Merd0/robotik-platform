"use client";

import { Line } from "@react-three/drei";
import { RobotArm } from "./RobotArm";
import type { RobotSpec } from "@/lib/robotics/kinematics";
import type { Vec3 } from "@/lib/robotics/transform";
import { useTheme } from "@/components/ui/ThemeProvider";
import { SCENE_PALETTES } from "@/lib/theme";

/**
 * Jacobian görselleştirmesinin 3D kısmı: robot kolu + her eklemin uç noktada
 * ürettiği hız yönü (Jacobian sütunları) + manipülabilite elipsi.
 *
 * Neden `JacobianViz.tsx` içinde değil de ayrı bir dosyada: `@react-three/drei`
 * import'u bileşenin modül düzeyinde durduğu sürece `three` ilk yükleme
 * paketine giriyor. Sahne buraya alınıp `LazyScene.tsx` üzerinden tembel
 * yüklendiğinde ders sayfasının ilk paketi docs/05'teki bütçenin altına
 * iniyor.
 */

const VECTOR_SCALE = 0.35;
const ELLIPSE_SAMPLES = 48;

function addScaled(base: Vec3, direction: Vec3, scale: number): [number, number, number] {
  return [base.x + direction.x * scale, base.y + direction.y * scale, base.z + direction.z * scale];
}

/**
 * İki eklemli kol için manipülabilite elipsi: birim eklem hızı dairesi
 * Jacobian ile uç hız uzayına taşınınca bir elipse dönüşür. Sadece 2 eklemli
 * robotlar için doğru — daha fazla eklemde n-küre örneklemesi gerekir.
 */
function ellipsePoints(columns: Vec3[], center: Vec3): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= ELLIPSE_SAMPLES; i++) {
    const angle = (i / ELLIPSE_SAMPLES) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const velocity: Vec3 = {
      x: columns[0].x * cos + columns[1].x * sin,
      y: columns[0].y * cos + columns[1].y * sin,
      z: 0,
    };
    points.push(addScaled(center, velocity, VECTOR_SCALE));
  }
  return points;
}

interface JacobianSceneProps {
  robot: RobotSpec;
  jointAngles: number[];
  endEffector: Vec3;
  columns: Vec3[];
  /** Her eklem sütununun rengi; kaydırıcı etiketlerindeki kareyle eşleşir. */
  jointColors: readonly string[];
}

export function JacobianScene({
  robot,
  jointAngles,
  endEffector,
  columns,
  jointColors,
}: JacobianSceneProps) {
  const { theme } = useTheme();

  return (
    <RobotArm robot={robot} jointAngles={jointAngles}>
      {columns.map((column, index) => (
        <Line
          key={index}
          points={[
            [endEffector.x, endEffector.y, endEffector.z],
            addScaled(endEffector, column, VECTOR_SCALE),
          ]}
          color={jointColors[index % jointColors.length]}
          lineWidth={3}
        />
      ))}
      <Line points={ellipsePoints(columns, endEffector)} color={SCENE_PALETTES[theme].ellipse} lineWidth={1.5} />
    </RobotArm>
  );
}
