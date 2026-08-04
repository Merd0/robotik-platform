"use client";

import { useMemo, useState } from "react";
import { JacobianScene, SahneAlani } from "@/components/scene/LazyScene";
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
      <SahneAlani className="aspect-square w-full overflow-hidden rounded-lg bg-universite-bg sm:aspect-video">
        <JacobianScene
          robot={robot}
          jointAngles={jointAngles}
          endEffector={endEffector}
          columns={columns}
          jointColors={JOINT_COLORS}
        />
      </SahneAlani>

      <div className="flex flex-col gap-3">
        {robot.joints.map((joint, index) => (
          <label key={index} className="flex flex-col gap-1 text-sm">
            {/*
              Renk, etiketi boyamak yerine ayrı bir kare olarak veriliyor:
              sahnedeki çizgiyle eşleşmeyi korur ama metnin kendisi tam
              kontrastlı ink renginde kalır (docs/07: kontrast WCAG AA, renk
              tek başına bilgi taşımaz — sayı ve "Eklem n" metni zaten var).
            */}
            <span className="flex items-center gap-2 text-universite-ink">
              <span
                aria-hidden="true"
                className="inline-block size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: JOINT_COLORS[index % JOINT_COLORS.length] }}
              />
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
        <span role="status">Manipülabilite: {manipulability.toExponential(3)}</span>
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
      <p className="text-xs text-universite-ink/70">
        Renkli çizgiler: her eklemin birim hızının uç noktada ürettiği hız yönü (Jacobian
        sütunları). Gri elips: tüm birim eklem hızı kombinasyonlarının süpürdüğü uç hız alanı
        (manipülabilite elipsi) — elips daralıp çizgiye dönüştüğünde tekillik yaklaşıyor demektir.
      </p>
    </div>
  );
}
