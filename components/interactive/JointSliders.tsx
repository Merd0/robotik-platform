"use client";

import { useMemo, useState } from "react";
import { RobotArm } from "@/components/scene/RobotArm";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";

interface JointSlidersProps {
  robot: string;
}

const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const round = (value: number) => Math.round(value * 1000) / 1000;

/** Ders içine gömülen etkileşimli sahne: eklem kaydırıcıları + robot kolu çizimi. */
export function JointSliders({ robot: robotId }: JointSlidersProps) {
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot.joints.map(() => 0));

  const { endEffector } = useMemo(
    () => forwardKinematics(robot, jointAngles),
    [robot, jointAngles],
  );

  function handleChange(index: number, degrees: number) {
    setJointAngles((prev) => prev.map((angle, i) => (i === index ? toRadians(degrees) : angle)));
  }

  function handleReset() {
    setJointAngles(robot.joints.map(() => 0));
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ortaokul-ink/10 bg-ortaokul-surface p-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-ortaokul-bg sm:aspect-video">
        <RobotArm robot={robot} jointAngles={jointAngles} />
      </div>

      <div className="flex flex-col gap-3">
        {robot.joints.map((joint, index) =>
          joint.type === "prismatic" ? (
            <label key={index} className="flex flex-col gap-1 text-sm">
              <span>Eklem {index + 1} (öteleme): {round(jointAngles[index])} m</span>
              <input
                type="range"
                className="h-11 touch-none accent-ortaokul-accent"
                min={joint.limits.min}
                max={joint.limits.max}
                step={0.001}
                value={jointAngles[index]}
                onChange={(event) =>
                  setJointAngles((prev) =>
                    prev.map((v, i) => (i === index ? Number(event.target.value) : v)),
                  )
                }
              />
            </label>
          ) : (
            <label key={index} className="flex flex-col gap-1 text-sm">
              <span>
                Eklem {index + 1}: {round(toDegrees(jointAngles[index]))}°
              </span>
              <input
                type="range"
                className="h-11 touch-none accent-ortaokul-accent"
                min={toDegrees(joint.limits.min)}
                max={toDegrees(joint.limits.max)}
                value={toDegrees(jointAngles[index])}
                onChange={(event) => handleChange(index, Number(event.target.value))}
              />
            </label>
          ),
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>
          Uç nokta: ({round(endEffector.x)}, {round(endEffector.y)})
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="h-11 rounded-md bg-ortaokul-ink px-4 text-ortaokul-surface"
        >
          Sıfırla
        </button>
      </div>
    </div>
  );
}
