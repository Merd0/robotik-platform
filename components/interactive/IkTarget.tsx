"use client";

import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import {
  forwardKinematics,
  inverseKinematicsAnalytical2Dof,
  inverseKinematicsNumerical,
  type Elbow,
  type RobotSpec,
} from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

interface IkTargetProps {
  robot: string;
}

const REACHABLE_COLOR = "#0ea5a0";
const UNREACHABLE_COLOR = "#dc2626";
const round = (value: number) => Math.round(value * 1000) / 1000;

function solveIk(
  robot: RobotSpec,
  target: { x: number; y: number },
  elbow: Elbow,
  previousAngles: number[],
): number[] | null {
  if (robot.joints.length === 2) {
    return inverseKinematicsAnalytical2Dof(robot, target, elbow);
  }
  const result = inverseKinematicsNumerical(robot, { x: target.x, y: target.y, z: 0 }, {
    initialGuess: previousAngles,
  });
  return result.angles;
}

/** Ders içine gömülen etkileşimli sahne: hedefi sürükle, robot ters kinematikle uzansın. */
export function IkTarget({ robot: robotId }: IkTargetProps) {
  const record = useEvidenceRecorder();
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const maxReach = useMemo(
    () => robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0),
    [robot],
  );
  const initialTarget = useMemo(() => ({ x: maxReach * 0.6, y: maxReach * 0.35 }), [maxReach]);

  const [target, setTarget] = useState(initialTarget);
  const [elbow, setElbow] = useState<Elbow>("up");
  const [angles, setAngles] = useState<number[]>(
    () => solveIk(robot, initialTarget, "up", robot.joints.map(() => 0)) ?? robot.joints.map(() => 0),
  );
  const [reachable, setReachable] = useState(true);
  const [dragging, setDragging] = useState(false);

  function applyTarget(point: { x: number; y: number }, elbowChoice: Elbow) {
    setTarget(point);
    const solved = solveIk(robot, point, elbowChoice, angles);
    if (solved) {
      setAngles(solved);
      setReachable(true);
      record({ skillId: "inverse-kinematics", stage: "tried", result: "success", metrics: { x: round(point.x), y: round(point.y), elbow: elbowChoice } });
    } else {
      setReachable(false);
      record({ skillId: "inverse-kinematics", stage: "observed", result: "retry", metrics: { unreachable: true } });
    }
  }

  function handleElbowToggle() {
    const next = elbow === "up" ? "down" : "up";
    setElbow(next);
    applyTarget(target, next);
    record({ skillId: "multiple-ik-solutions", stage: "observed", result: "success", metrics: { elbow: next } });
  }

  function handleReset() {
    setElbow("up");
    applyTarget(initialTarget, "up");
  }

  const { endEffector } = useMemo(() => forwardKinematics(robot, angles), [robot, angles]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-lise-ink/10 bg-lise-surface p-4">
      <SahneAlani className="aspect-square w-full overflow-hidden rounded-lg bg-lise-bg sm:aspect-video">
        <RobotArm robot={robot} jointAngles={angles}>
          <mesh
            position={[target.x, target.y, 0.02]}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setDragging(true);
            }}
          >
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshStandardMaterial color={reachable ? REACHABLE_COLOR : UNREACHABLE_COLOR} />
          </mesh>
          {dragging && (
            <mesh
              onPointerMove={(event: ThreeEvent<PointerEvent>) =>
                applyTarget({ x: event.point.x, y: event.point.y }, elbow)
              }
              onPointerUp={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
            >
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </RobotArm>
      </SahneAlani>

      {/*
        Hedefi sürüklemek dokunmatik/fare için doğal ama klavyeyle imkânsız.
        docs/02 "her etkileşimli sahnenin klavyeyle kullanılabilir bir
        alternatifi olmalı" kuralı gereği aynı hedef bu iki kaydırıcıyla da
        konumlandırılabiliyor — alttaki IK çözümü ikisinde de aynı.
      */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["x", "y"] as const).map((eksen) => (
          <label key={eksen} className="flex flex-col gap-1 text-sm">
            <span>
              Hedef {eksen.toUpperCase()}: {round(target[eksen])} m
            </span>
            <input
              type="range"
              className="h-11 touch-pan-y accent-lise-accent"
              min={-maxReach}
              max={maxReach}
              step={0.01}
              value={target[eksen]}
              onChange={(event) =>
                applyTarget({ ...target, [eksen]: Number(event.target.value) }, elbow)
              }
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span role="status">
          {reachable
            ? `Hedef: (${round(target.x)}, ${round(target.y)})`
            : "Bu noktaya ulaşılamıyor — hedef, erişim alanının dışında"}
        </span>
        <div className="flex gap-2">
          {robot.joints.length === 2 && (
            <button
              type="button"
              onClick={handleElbowToggle}
              className="h-11 rounded-md border border-lise-ink/20 px-4"
            >
              Dirsek: {elbow === "up" ? "yukarı" : "aşağı"}
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="h-11 rounded-md bg-lise-ink px-4 text-lise-surface"
          >
            Sıfırla
          </button>
        </div>
      </div>
      <p className="text-xs text-lise-ink/70">
        Uç nokta: ({round(endEffector.x)}, {round(endEffector.y)})
      </p>
    </div>
  );
}
