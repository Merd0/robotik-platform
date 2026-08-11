"use client";

import { useMemo, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { toolOrientationOf } from "@/components/scene/robotFrames";

interface JointSlidersProps {
  robot: string;
}

const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const round = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

/** Ders içine gömülen etkileşimli sahne: eklem kaydırıcıları + robot kolu çizimi. */
export function JointSliders({ robot: robotId }: JointSlidersProps) {
  const record = useEvidenceRecorder();
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot.joints.map(() => 0));
  const [activeJointIndex, setActiveJointIndex] = useState(() => (robot.joints.length === 6 ? 5 : 0));
  const isSixAxis = robot.joints.length === 6;

  const { endEffector, jointTransforms } = useMemo(
    () => forwardKinematics(robot, jointAngles),
    [robot, jointAngles],
  );
  const toolOrientation = isSixAxis ? toolOrientationOf(jointTransforms[jointTransforms.length - 1]) : null;
  const jointGroups = isSixAxis
    ? [
        { label: "Kol · J1–J3", joints: robot.joints.slice(0, 3), offset: 0 },
        { label: "Bilek · J4–J6", joints: robot.joints.slice(3, 6), offset: 3 },
      ]
    : [{ label: "Eklemler", joints: robot.joints, offset: 0 }];

  function handleChange(index: number, degrees: number) {
    setActiveJointIndex(index);
    setJointAngles((prev) => prev.map((angle, i) => (i === index ? toRadians(degrees) : angle)));
  }

  /**
   * Görsel hareket (yukarıdaki onChange) her piksel için tetiklenir ve anlık
   * kalmalı. Kalıcı kanıt yalnız kullanıcı bir değeri "bıraktığında" yazılır —
   * pointer-up (mouse + touch, Pointer Events ikisini de aynı olayla verir),
   * blur veya klavye commit'i (ok tuşu bırakıldığında). Üçü de aynı anlamsal
   * "observed" olayını üretir; sürekli sürüklemede yüzlerce "tried" kaydı
   * biriktirip localStorage'ı aşındırmaz.
   */
  function commitJoint(index: number) {
    record({ skillId: "forward-kinematics", stage: "observed", result: "success", metrics: { joint: index + 1 } });
  }

  function handleReset() {
    setJointAngles(robot.joints.map(() => 0));
    setActiveJointIndex(isSixAxis ? 5 : 0);
  }

  return (
    <div
      className="rounded-xl border border-ortaokul-ink/10 bg-ortaokul-surface p-4"
      data-joint-sliders
      data-robot-id={robot.id}
    >
      {/*
        Sahnenin bilgi içeriği aşağıdaki kaydırıcı etiketlerinde ve uç nokta
        özetinde metin olarak var (docs/02 "her sahnenin metin özeti olmalı") —
        SahneAlani, 3D kutusunu ekran okuyucudan gizler ve görünür olana kadar
        bağlamaz.
      */}
      <div className={isSixAxis ? "grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] md:items-start" : "flex flex-col gap-4"}>
        <div className={isSixAxis ? "min-w-0 md:sticky md:top-4" : "min-w-0"}>
          <p className="mb-2 text-sm font-semibold">Sahne</p>
          <SahneAlani className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-ortaokul-bg sm:aspect-video md:aspect-[4/3]">
            <RobotArm robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} />
          </SahneAlani>
          {isSixAxis && (
            <div className="mt-2 space-y-1 text-xs leading-relaxed text-ortaokul-ink/70">
              <p>Çerçeveler: X kırmızı · Y yeşil · Z mavi · soluk taban · parlak alet</p>
              <p data-testid="active-joint-axis">Turuncu halka ve ok: etkin J{activeJointIndex + 1} dönme ekseni</p>
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-ortaokul-ink/10 bg-ortaokul-bg/50 p-3">
          <p className="mb-2 text-sm font-semibold">Kontroller</p>
          <div className={isSixAxis ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
            {jointGroups.map((group) => (
              <fieldset key={group.label} className="min-w-0 rounded-lg border border-ortaokul-ink/10 p-2">
                <legend className="px-1 text-xs font-semibold text-ortaokul-ink/70">{group.label}</legend>
                <div className="grid gap-1.5">
                  {group.joints.map((joint, localIndex) => {
                    const index = group.offset + localIndex;
                    return joint.type === "prismatic" ? (
                      <label key={index} className="grid min-w-0 gap-0.5 text-xs sm:text-sm">
                        <span>J{index + 1} öteleme: {round(jointAngles[index])} m</span>
                        <input
                          type="range"
                          className="h-11 w-full touch-pan-y accent-ortaokul-accent"
                          min={joint.limits.min}
                          max={joint.limits.max}
                          step={0.001}
                          value={jointAngles[index]}
                          onFocus={() => setActiveJointIndex(index)}
                          onPointerDown={() => setActiveJointIndex(index)}
                          onChange={(event) => {
                            setActiveJointIndex(index);
                            setJointAngles((prev) => prev.map((v, i) => (i === index ? Number(event.target.value) : v)));
                          }}
                          onPointerUp={() => commitJoint(index)}
                          onBlur={() => commitJoint(index)}
                          onKeyUp={() => commitJoint(index)}
                        />
                      </label>
                    ) : (
                      <label key={index} className="grid min-w-0 gap-0.5 text-xs sm:text-sm">
                        <span>J{index + 1}: {round(toDegrees(jointAngles[index]))}°</span>
                        <input
                          type="range"
                          className="h-11 w-full touch-pan-y accent-ortaokul-accent"
                          min={toDegrees(joint.limits.min)}
                          max={toDegrees(joint.limits.max)}
                          value={toDegrees(jointAngles[index])}
                          onFocus={() => setActiveJointIndex(index)}
                          onPointerDown={() => setActiveJointIndex(index)}
                          onChange={(event) => handleChange(index, Number(event.target.value))}
                          onPointerUp={() => commitJoint(index)}
                          onBlur={() => commitJoint(index)}
                          onKeyUp={() => commitJoint(index)}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 text-xs sm:text-sm">
            <div role="status" aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 space-y-1 font-mono">
              <p data-testid="tcp-position">
                TCP: x {round(endEffector.x)} · y {round(endEffector.y)} · z {round(endEffector.z)} m
              </p>
              {toolOrientation && (
                <p data-testid="tool-orientation">
                  Alet RPY: R {round(toolOrientation.roll)}° · P {round(toolOrientation.pitch)}° · Y {round(toolOrientation.yaw)}°
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="h-11 rounded-md bg-ortaokul-ink px-4 text-ortaokul-surface"
            >
              Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
