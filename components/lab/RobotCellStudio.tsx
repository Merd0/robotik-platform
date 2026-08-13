"use client";

import { useMemo, useState } from "react";
import { RobotCellScene, SahneAlani } from "@/components/scene/LazyScene";
import { toolOrientationOf } from "@/components/scene/robotFrames";
import {
  cameraPresetOf,
  createRobotCellStudioState,
  jointAnglesRadians,
  type RobotCellCameraPreset,
  updateRobotCellJoint,
} from "@/lib/robotics/robotCellStudio";
import { computeJacobian, forwardKinematics, isNearSingularity } from "@/lib/robotics/kinematics";
import { genericSixDofRobot } from "@/lib/robotics/robots/genericSixDof";

const RAD_TO_DEG = 180 / Math.PI;
const CAMERA_BUTTONS: Array<{ preset: RobotCellCameraPreset; label: string }> = [
  { preset: "cell", label: "Hücre görünümü" },
  { preset: "top", label: "Üstten gör" },
  { preset: "front", label: "Önden gör" },
];

function formatMetres(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatDegrees(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

export function RobotCellStudio() {
  const [studio, setStudio] = useState(createRobotCellStudioState);
  const [showFrames, setShowFrames] = useState(false);
  const jointAngles = useMemo(() => jointAnglesRadians(studio), [studio]);
  const kinematics = useMemo(() => forwardKinematics(genericSixDofRobot, jointAngles), [jointAngles]);
  const orientation = useMemo(
    () => toolOrientationOf(kinematics.jointTransforms.at(-1)!),
    [kinematics.jointTransforms],
  );
  const manipulability = useMemo(
    () => computeJacobian(genericSixDofRobot, jointAngles).manipulability,
    [jointAngles],
  );
  const activeJoint = genericSixDofRobot.joints[studio.activeJointIndex];

  function selectCamera(cameraPreset: RobotCellCameraPreset) {
    setStudio((current) => ({ ...current, cameraPreset }));
  }

  function resetPose() {
    setStudio(createRobotCellStudioState());
  }

  return (
    <section
      aria-label="3B dijital robot hücresi"
      className="overflow-hidden rounded-[2rem] border border-site-border bg-site-surface shadow-sm"
    >
      <div className="border-b border-site-border bg-site-soft px-5 py-6 sm:px-7 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">3B hücre stüdyosu · ilk çalışan dilim</p>
            <span className="rounded-full border border-site-border bg-site-surface px-2.5 py-1 text-[11px] font-semibold text-site-muted">6R · DH tabanlı</span>
          </div>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-site-ink sm:text-4xl">Hücreyi üç boyutta devreye al</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-site-muted sm:text-base">
            Eksenleri sür; kolun pozu, TCP konumu ve takım yönelimi aynı kinematik zincirden canlı hesaplansın. Sahneyi fareyle veya dokunarak döndürebilirsin.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-site-border bg-site-border text-center lg:mt-0 lg:min-w-64">
          <div className="bg-site-surface px-4 py-3"><strong className="block font-mono text-xl text-site-ink">6</strong><span className="text-[10px] font-semibold uppercase tracking-widest text-site-subtle">eksen</span></div>
          <div className="bg-site-surface px-4 py-3"><strong className="block font-mono text-xl text-site-ink">FK</strong><span className="text-[10px] font-semibold uppercase tracking-widest text-site-subtle">canlı çözüm</span></div>
        </div>
      </div>

      <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)]">
        <div className="min-w-0 border-b border-site-border p-4 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kamera görünümü">
              {CAMERA_BUTTONS.map(({ preset, label }) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={studio.cameraPreset === preset}
                  onClick={() => selectCamera(preset)}
                  className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent ${studio.cameraPreset === preset ? "border-site-accent bg-site-accent text-site-on-accent" : "border-site-border bg-site-surface text-site-muted hover:bg-site-soft"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={showFrames}
              onClick={() => setShowFrames((visible) => !visible)}
              className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-semibold text-site-muted hover:bg-site-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent"
            >
              {showFrames ? "Eksenleri gizle" : "Eksenleri göster"}
            </button>
          </div>

          <SahneAlani className="h-[430px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 sm:h-[520px] lg:h-[600px]">
            <RobotCellScene
              robot={genericSixDofRobot}
              jointAngles={jointAngles}
              activeJointIndex={studio.activeJointIndex}
              cameraPreset={studio.cameraPreset}
              showFrames={showFrames}
            />
          </SahneAlani>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Takım merkezi noktası ölçümleri">
            <div data-testid="tcp-position-3d" className="rounded-xl border border-site-border bg-site-soft px-4 py-3 font-mono text-sm leading-6 text-site-ink sm:col-span-2 lg:col-span-1">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-site-subtle">TCP · metre</span>
              X {formatMetres(kinematics.endEffector.x)} · Y {formatMetres(kinematics.endEffector.y)} · Z {formatMetres(kinematics.endEffector.z)}
            </div>
            <div className="rounded-xl border border-site-border bg-site-soft px-4 py-3 font-mono text-sm leading-6 text-site-ink">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-site-subtle">Takım yönelimi · RPY</span>
              R {orientation.roll.toFixed(0)}° · P {orientation.pitch.toFixed(0)}° · Y {orientation.yaw.toFixed(0)}°
            </div>
            <div className="rounded-xl border border-site-border bg-site-soft px-4 py-3 text-sm leading-6 text-site-ink">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-site-subtle">Poz durumu</span>
              {isNearSingularity(manipulability) ? "Tekilliğe yakın" : "Çözülebilir poz"}
              <span className="ml-2 font-mono text-xs text-site-subtle">μ {manipulability.toFixed(4)}</span>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-site-muted" aria-label="3B hücre renk anahtarı">
            <li className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-500" aria-hidden="true" />İş parçası</li>
            <li className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-700" aria-hidden="true" />Çıkış kutusu</li>
            <li className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-orange-800" aria-hidden="true" />Fikstür</li>
            <li className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-slate-500" aria-hidden="true" />Koruyucu çevre</li>
          </ul>
          <p className="sr-only" aria-live="polite">
            Etkin eksen J{studio.activeJointIndex + 1}. TCP konumu X {formatMetres(kinematics.endEffector.x)}, Y {formatMetres(kinematics.endEffector.y)}, Z {formatMetres(kinematics.endEffector.z)} metre.
          </p>
        </div>

        <aside className="min-w-0 p-5 sm:p-6" aria-label="Robot kumandası">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Eksen kumandası</p>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-site-ink">Robotu eklem uzayında sür</h3>
            </div>
            <button type="button" onClick={resetPose} className="min-h-11 shrink-0 rounded-xl border border-site-border px-3 text-xs font-semibold text-site-muted hover:bg-site-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent">Ana poza dön</button>
          </div>

          <p className="mt-4 rounded-xl border border-site-border bg-site-soft px-4 py-3 text-sm leading-6 text-site-muted" aria-live="polite">
            <strong className="text-site-ink">Etkin eksen: J{studio.activeJointIndex + 1}</strong> · {formatDegrees(studio.jointDegrees[studio.activeJointIndex])}° · izin verilen aralık {formatDegrees(activeJoint.limits.min * RAD_TO_DEG)}°–{formatDegrees(activeJoint.limits.max * RAD_TO_DEG)}°
          </p>

          <div className="mt-5 grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {genericSixDofRobot.joints.map((joint, index) => {
              const minimum = Math.round(joint.limits.min * RAD_TO_DEG);
              const maximum = Math.round(joint.limits.max * RAD_TO_DEG);
              return (
                <label key={index} className="block rounded-xl border border-transparent px-2 py-1 focus-within:border-site-accent">
                  <span className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-site-ink">J{index + 1} <span className="font-normal text-site-subtle">{index < 3 ? "kol" : "bilek"}</span></span>
                    <output className="font-mono font-semibold text-site-ink">{formatDegrees(studio.jointDegrees[index])}°</output>
                  </span>
                  <input
                    aria-label={`J${index + 1} açısı`}
                    type="range"
                    min={minimum}
                    max={maximum}
                    step="1"
                    value={studio.jointDegrees[index]}
                    onFocus={() => setStudio((current) => ({ ...current, activeJointIndex: index }))}
                    onChange={(event) => setStudio((current) => updateRobotCellJoint(current, genericSixDofRobot, index, Number(event.target.value)))}
                    className="mt-1 h-11 w-full touch-pan-y accent-teal-600"
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-6 border-t border-site-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Bu dilimde gerçek olan</p>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-site-muted sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <li className="rounded-lg bg-success-surface px-3 py-2 text-success-ink">✓ DH tabanlı 6 eksen FK</li>
              <li className="rounded-lg bg-success-surface px-3 py-2 text-success-ink">✓ Eklem limitleri ve TCP/RPY</li>
              <li className="rounded-lg bg-site-soft px-3 py-2">Sonraki: çarpışma hacimleri</li>
              <li className="rounded-lg bg-site-soft px-3 py-2">Sonraki: MoveJ / MoveL programı</li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-site-subtle">Bu, marka bağımsız bir eğitim robotudur. Tork, esneme, motor dinamiği ve güvenlik PLC davranışı henüz modellenmez; gerçek robot komutu üretmez.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
