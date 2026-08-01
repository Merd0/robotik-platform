"use client";

import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { RobotArm } from "@/components/scene/RobotArm";
import {
  forwardKinematics,
  inverseKinematicsAnalytical2Dof,
  inverseKinematicsNumerical,
  type Elbow,
  type RobotSpec,
} from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";

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
    } else {
      setReachable(false);
    }
  }

  function handleElbowToggle() {
    const next = elbow === "up" ? "down" : "up";
    setElbow(next);
    applyTarget(target, next);
  }

  function handleReset() {
    setElbow("up");
    applyTarget(initialTarget, "up");
  }

  const { endEffector } = useMemo(() => forwardKinematics(robot, angles), [robot, angles]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-lise-ink/10 bg-lise-surface p-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-lise-bg sm:aspect-video">
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {reachable
            ? `Hedef: (${round(target.x)}, ${round(target.y)})`
            : "Bu noktaya ulaşılamıyor — kırmızı nokta erişim alanının dışında"}
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
      <p className="text-xs text-lise-ink/60">
        Uç nokta: ({round(endEffector.x)}, {round(endEffector.y)})
      </p>
    </div>
  );
}
