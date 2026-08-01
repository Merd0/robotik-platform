"use client";

import { useMemo, useState } from "react";
import { Line } from "@react-three/drei";
import { RobotArm } from "@/components/scene/RobotArm";
import {
  computeJacobian,
  forwardKinematics,
  isNearSingularity,
  SINGULARITY_THRESHOLD,
} from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import type { Vec3 } from "@/lib/robotics/transform";

interface JacobianVizProps {
  robot: string;
}

const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const round = (value: number) => Math.round(value * 1000) / 1000;

const JOINT_COLORS = ["#0ea5a0", "#f97316"];
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

/** Ders içine gömülen etkileşimli sahne: Jacobian sütunlarını ve manipülabilite elipsini görselleştirir. */
export function JacobianViz({ robot: robotId }: JacobianVizProps) {
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const [jointAngles, setJointAngles] = useState<number[]>(() => [Math.PI / 4, Math.PI / 3]);

  const { endEffector } = useMemo(() => forwardKinematics(robot, jointAngles), [robot, jointAngles]);
  const { columns, manipulability } = useMemo(
    () => computeJacobian(robot, jointAngles),
    [robot, jointAngles],
  );
  const singular = isNearSingularity(manipulability);

  function handleChange(index: number, degrees: number) {
    setJointAngles((prev) => prev.map((angle, i) => (i === index ? toRadians(degrees) : angle)));
  }

  function handleReset() {
    setJointAngles([Math.PI / 4, Math.PI / 3]);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-universite-ink/10 bg-universite-surface p-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-universite-bg sm:aspect-video">
        <RobotArm robot={robot} jointAngles={jointAngles}>
          {columns.map((column, index) => (
            <Line
              key={index}
              points={[
                [endEffector.x, endEffector.y, endEffector.z],
                addScaled(endEffector, column, VECTOR_SCALE),
              ]}
              color={JOINT_COLORS[index % JOINT_COLORS.length]}
              lineWidth={3}
            />
          ))}
          <Line points={ellipsePoints(columns, endEffector)} color="#64748b" lineWidth={1.5} />
        </RobotArm>
      </div>

      <div className="flex flex-col gap-3">
        {robot.joints.map((joint, index) => (
          <label key={index} className="flex flex-col gap-1 text-sm">
            <span style={{ color: JOINT_COLORS[index % JOINT_COLORS.length] }}>
              Eklem {index + 1} hızı yönü: {round(toDegrees(jointAngles[index]))}°
            </span>
            <input
              type="range"
              className="h-11 touch-none accent-universite-accent"
              min={toDegrees(joint.limits.min)}
              max={toDegrees(joint.limits.max)}
              value={toDegrees(jointAngles[index])}
              onChange={(event) => handleChange(index, Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>Manipülabilite: {manipulability.toExponential(3)}</span>
        <button
          type="button"
          onClick={handleReset}
          className="h-11 rounded-md bg-universite-ink px-4 text-universite-surface"
        >
          Sıfırla
        </button>
      </div>

      {singular && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Tekillik: manipülabilite {SINGULARITY_THRESHOLD} eşiğinin altına düştü. Bu konumda kol,
          bazı yönlerde hızlanamaz — Jacobian bu yönde tersinemez hale gelir.
        </p>
      )}
      <p className="text-xs text-universite-ink/60">
        Renkli çizgiler: her eklemin birim hızının uç noktada ürettiği hız yönü (Jacobian
        sütunları). Gri elips: tüm birim eklem hızı kombinasyonlarının süpürdüğü uç hız alanı
        (manipülabilite elipsi) — elips daralıp çizgiye dönüştüğünde tekillik yaklaşıyor demektir.
      </p>
    </div>
  );
}
