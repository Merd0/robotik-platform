"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChallengeHeader,
  ChallengeResult,
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { toolOrientationOf } from "@/components/scene/robotFrames";
import { RobotInfoLine } from "@/components/interactive/RobotInfoLine";

interface JointSlidersProps {
  robot: string;
  pilot?: "forward-kinematics";
}

const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const round = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};
const CHALLENGE_TARGET = { x: 0.65, y: 1.5, z: 0 } as const;
const CHALLENGE_TOLERANCE = 0.14;

/** Ders içine gömülen etkileşimli sahne: eklem kaydırıcıları + robot kolu çizimi. */
export function JointSliders({ robot: robotId, pilot }: JointSlidersProps) {
  const record = useEvidenceRecorder();
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot.joints.map(() => 0));
  const [activeJointIndex, setActiveJointIndex] = useState(() => (robot.joints.length === 6 ? 5 : 0));
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState({ moves: 0, touched: [false, false], complete: false });
  const challengeCommittedAngles = useRef([...jointAngles]);
  const isSixAxis = robot.joints.length === 6;

  const { endEffector, jointTransforms } = useMemo(
    () => forwardKinematics(robot, jointAngles),
    [robot, jointAngles],
  );
  const toolOrientation = isSixAxis ? toolOrientationOf(jointTransforms[jointTransforms.length - 1]) : null;
  const targetDistance = Math.hypot(
    endEffector.x - CHALLENGE_TARGET.x,
    endEffector.y - CHALLENGE_TARGET.y,
    endEffector.z - CHALLENGE_TARGET.z,
  );
  const challengeAvailable = pilot === "forward-kinematics" && robot.id === "generic-2dof";
  const challengeFailed = challengeActive && challengeProgress.moves >= 3 && !challengeProgress.complete;
  useSharedLabState("joint-sliders", (state) => {
    if (state.robotId !== robot.id) return;
    setJointAngles(state.jointAngles);
    setActiveJointIndex(0);
    setChallengeActive(false);
    setChallengeProgress({ moves: 0, touched: [false, false], complete: false });
    challengeCommittedAngles.current = [...state.jointAngles];
  });
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
  function commitJoint(index: number, countChallengeMove = true) {
    record({ skillId: "forward-kinematics", stage: "observed", result: "success", metrics: { joint: index + 1 } });
    if (!countChallengeMove) return;
    const changedSinceCommit = challengeCommittedAngles.current[index] !== jointAngles[index];
    challengeCommittedAngles.current[index] = jointAngles[index];
    if (!changedSinceCommit) return;
    if (!challengeActive || challengeProgress.complete || challengeProgress.moves >= 3) return;
    setChallengeProgress((current) => {
      const touched = current.touched.map((value, jointIndex) => value || jointIndex === index);
      const moves = current.moves + 1;
      return {
        moves,
        touched,
        complete: touched.every(Boolean) && targetDistance <= CHALLENGE_TOLERANCE && moves <= 3,
      };
    });
  }

  function resetChallenge() {
    setJointAngles(robot.joints.map(() => 0));
    setActiveJointIndex(isSixAxis ? 5 : 0);
    setChallengeProgress({ moves: 0, touched: [false, false], complete: false });
    challengeCommittedAngles.current = robot.joints.map(() => 0);
  }

  function handleReset() {
    resetChallenge();
  }

  function toggleChallenge() {
    const next = !challengeActive;
    setChallengeActive(next);
    resetChallenge();
  }

  return (
    <div
      className="rounded-xl border border-ortaokul-ink/10 bg-ortaokul-surface p-4"
      data-joint-sliders
      data-robot-id={robot.id}
    >
      {challengeAvailable && (
        <ChallengeHeader
          seviye="ortaokul"
          active={challengeActive}
          eyebrow="Mini görev"
          title="Biber hedefine üç hamlede dokun"
          description="Turuncu hedefi sürükleyemezsin. Omuz ve dirsek kaydırıcılarını bırakışların birer hamle sayılır."
          constraints={[
            "İki eklemi de en az bir kez oynat.",
            "Kolun ucunu en fazla üç hamlede turuncu hedefe getir.",
          ]}
          onToggle={toggleChallenge}
        />
      )}

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
            <RobotArm robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex}>
              {challengeActive && (
                <mesh position={[CHALLENGE_TARGET.x, CHALLENGE_TARGET.y, CHALLENGE_TARGET.z]}>
                  <torusGeometry args={[0.12, 0.025, 16, 48]} />
                  <meshStandardMaterial color="#f97316" />
                </mesh>
              )}
            </RobotArm>
          </SahneAlani>
          <RobotInfoLine robot={robot} className="mt-2 text-ortaokul-ink/70" />
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
                          onKeyUp={() => commitJoint(index, false)}
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
                          onKeyUp={() => commitJoint(index, false)}
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
          {challengeActive && !challengeProgress.complete && (
            <div className="mt-3 rounded-lg border border-ortaokul-ink/10 bg-ortaokul-surface p-3 text-sm" role="status">
              {challengeFailed ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Üç hamle doldu. Hedefe başka bir açı çiftiyle yaklaşmayı dene.</span>
                  <button type="button" onClick={resetChallenge} className="min-h-11 rounded-lg border border-ortaokul-ink/20 px-3 font-semibold">Görevi yeniden başlat</button>
                </div>
              ) : (
                <span>Hamle {challengeProgress.moves} / 3 · Omuz {challengeProgress.touched[0] ? "✓" : "○"} · Dirsek {challengeProgress.touched[1] ? "✓" : "○"}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {challengeActive && challengeProgress.complete && (
        <ChallengeResult
          seviye="ortaokul"
          title="Kol hedefe ulaştı"
          summary="Omuz ve dirseği birlikte kullanarak kolun ucunu turuncu halkaya getirdin."
          metrics={[
            { label: "Hamle", value: `${challengeProgress.moves} / 3` },
            { label: "Omuz", value: `${round(toDegrees(jointAngles[0]))}°` },
            { label: "Dirsek", value: `${round(toDegrees(jointAngles[1]))}°` },
          ]}
          onRetry={resetChallenge}
        />
      )}

      {challengeAvailable && (
        <ExperimentShareButton
          seviye="ortaokul"
          createShareUrl={() => createLabShareUrl({
            kind: "joint-sliders",
            version: 1,
            robotId: robot.id,
            jointAngles,
          })}
        />
      )}
    </div>
  );
}
