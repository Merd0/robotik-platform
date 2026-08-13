"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  planRobotCellMoveJ,
  planRobotCellMoveL,
  ROBOT_CELL_OBSTACLES,
  sampleRobotCellMotion,
  type RobotCellMotionKind,
  type RobotCellMotionPlan,
} from "@/lib/robotics/robotCellMotion";
import { genericSixDofRobot } from "@/lib/robotics/robots/genericSixDof";

const RAD_TO_DEG = 180 / Math.PI;
const CAMERA_BUTTONS: Array<{ preset: RobotCellCameraPreset; label: string }> = [
  { preset: "cell", label: "Hücre görünümü" },
  { preset: "top", label: "Üstten gör" },
  { preset: "front", label: "Önden gör" },
];
const MOTION_TARGETS = {
  inspection: { label: "Kontrol noktası", jointDegrees: [10, 43, 24, 2, 98, 0] },
  narrow: { label: "Dar geçiş", jointDegrees: [-24, 36, 25, 7, 95, 0] },
} as const;
type MotionTargetId = keyof typeof MOTION_TARGETS;

function formatMetres(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatDegrees(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

export function RobotCellStudio() {
  const [studio, setStudio] = useState(createRobotCellStudioState);
  const [showFrames, setShowFrames] = useState(false);
  const [controlMode, setControlMode] = useState<"joints" | "motion">("joints");
  const [motionTargetId, setMotionTargetId] = useState<MotionTargetId>("inspection");
  const [selectedMotion, setSelectedMotion] = useState<RobotCellMotionKind>("movej");
  const [motionProgress, setMotionProgress] = useState(0);
  const [previewAngles, setPreviewAngles] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const playbackFrame = useRef<number | null>(null);
  const jointAngles = useMemo(() => jointAnglesRadians(studio), [studio]);
  const [motionStartAngles, setMotionStartAngles] = useState(() => [...jointAngles]);
  const targetAngles = useMemo(
    () => MOTION_TARGETS[motionTargetId].jointDegrees.map((degrees) => degrees * Math.PI / 180),
    [motionTargetId],
  );
  const targetTcp = useMemo(() => forwardKinematics(genericSixDofRobot, targetAngles).endEffector, [targetAngles]);
  const moveJPlan = useMemo(
    () => planRobotCellMoveJ(genericSixDofRobot, motionStartAngles, targetAngles, ROBOT_CELL_OBSTACLES, { sampleCount: 48 }),
    [motionStartAngles, targetAngles],
  );
  const moveLPlan = useMemo(
    () => planRobotCellMoveL(genericSixDofRobot, motionStartAngles, targetTcp, ROBOT_CELL_OBSTACLES, { sampleCount: 48 }),
    [motionStartAngles, targetTcp],
  );
  const motionPlans = useMemo(() => [moveJPlan, moveLPlan], [moveJPlan, moveLPlan]);
  const selectedPlan = selectedMotion === "movej" ? moveJPlan : moveLPlan;
  const displayedAngles = previewAngles ?? jointAngles;
  const kinematics = useMemo(() => forwardKinematics(genericSixDofRobot, displayedAngles), [displayedAngles]);
  const orientation = useMemo(
    () => toolOrientationOf(kinematics.jointTransforms.at(-1)!),
    [kinematics.jointTransforms],
  );
  const manipulability = useMemo(
    () => computeJacobian(genericSixDofRobot, displayedAngles).manipulability,
    [displayedAngles],
  );
  const activeJoint = genericSixDofRobot.joints[studio.activeJointIndex];

  function selectCamera(cameraPreset: RobotCellCameraPreset) {
    setStudio((current) => ({ ...current, cameraPreset }));
  }

  function resetPose() {
    setStudio(createRobotCellStudioState());
    setPreviewAngles(null);
    setMotionProgress(0);
    setPlaying(false);
  }

  const showMotionProgress = useCallback((progress: number, plan = selectedPlan) => {
    const clamped = Math.min(1, Math.max(0, progress));
    setMotionProgress(clamped);
    setPreviewAngles([...sampleRobotCellMotion(plan, clamped).jointAngles]);
  }, [selectedPlan]);

  function selectMotionTarget(targetId: MotionTargetId) {
    setMotionTargetId(targetId);
    setMotionProgress(0);
    setPreviewAngles(null);
    setPlaying(false);
  }

  function selectMotion(kind: RobotCellMotionKind) {
    setSelectedMotion(kind);
    setMotionProgress(0);
    setPreviewAngles(null);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    const startedAt = performance.now();
    const terminalProgress = selectedPlan.firstIssue?.progress ?? 1;
    const durationMilliseconds = Math.max(1.2, selectedPlan.estimatedDurationSeconds * terminalProgress) * 1_000;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMilliseconds);
      showMotionProgress(progress * terminalProgress, selectedPlan);
      if (progress < 1) playbackFrame.current = window.requestAnimationFrame(animate);
      else setPlaying(false);
    };
    playbackFrame.current = window.requestAnimationFrame(animate);
    return () => {
      if (playbackFrame.current !== null) window.cancelAnimationFrame(playbackFrame.current);
    };
  }, [playing, selectedPlan, showMotionProgress]);

  return (
    <section
      aria-label="3B dijital robot hücresi"
      className="overflow-hidden rounded-[2rem] border border-site-border bg-site-surface shadow-sm"
    >
      <div className="border-b border-site-border bg-site-soft px-5 py-6 sm:px-7 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">3B hücre stüdyosu · hareket ön kontrollü</p>
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
              jointAngles={displayedAngles}
              activeJointIndex={studio.activeJointIndex}
              cameraPreset={studio.cameraPreset}
              showFrames={showFrames}
              motionPlans={controlMode === "motion" ? motionPlans : undefined}
              selectedMotion={selectedMotion}
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
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-site-border bg-site-soft p-1" role="group" aria-label="Kumanda modu">
            <button type="button" aria-pressed={controlMode === "joints"} onClick={() => { setControlMode("joints"); setPreviewAngles(null); setMotionProgress(0); setPlaying(false); }} className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${controlMode === "joints" ? "bg-site-accent text-site-on-accent" : "text-site-muted"}`}>Eksenleri sür</button>
            <button type="button" aria-pressed={controlMode === "motion"} onClick={() => { setMotionStartAngles([...jointAngles]); setControlMode("motion"); setPreviewAngles(null); setMotionProgress(0); setPlaying(false); }} className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${controlMode === "motion" ? "bg-site-accent text-site-on-accent" : "text-site-muted"}`}>Hareket provası</button>
          </div>

          {controlMode === "joints" ? <>
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
                    disabled={playing}
                    onFocus={() => setStudio((current) => ({ ...current, activeJointIndex: index }))}
                    onChange={(event) => {
                      setPreviewAngles(null);
                      setMotionProgress(0);
                      setStudio((current) => updateRobotCellJoint(current, genericSixDofRobot, index, Number(event.target.value)));
                    }}
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
              <li className="rounded-lg bg-success-surface px-3 py-2 text-success-ink">✓ Kapsül–kutu hareket provası</li>
              <li className="rounded-lg bg-success-surface px-3 py-2 text-success-ink">✓ MoveJ / MoveL yol karşılaştırması</li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-site-subtle">Bu, marka bağımsız bir eğitim robotudur. Öz-çarpışma, tork, esneme, motor dinamiği ve güvenlik PLC davranışı henüz modellenmez; gerçek robot komutu üretmez.</p>
            </div>
          </> : (
            <MotionComparisonLab
              targetId={motionTargetId}
              selectedMotion={selectedMotion}
              selectedPlan={selectedPlan}
              moveJPlan={moveJPlan}
              moveLPlan={moveLPlan}
              motionProgress={motionProgress}
              playing={playing}
              onSelectTarget={selectMotionTarget}
              onSelectMotion={selectMotion}
              onProgress={(progress) => showMotionProgress(progress)}
              onPlay={() => {
                setMotionProgress(0);
                setPreviewAngles(null);
                setPlaying(true);
              }}
              onShowCollision={() => {
                if (!selectedPlan.firstIssue) return;
                showMotionProgress(selectedPlan.firstIssue.progress, selectedPlan);
              }}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

function motionStatus(plan: RobotCellMotionPlan): string {
  if (plan.status === "safe") return "Geçiş temiz";
  if (plan.status === "collision") return `${plan.firstIssue?.obstacleLabel ?? "Hücre elemanı"} · L${(plan.firstIssue?.linkIndex ?? 0) + 1} teması`;
  if (plan.status === "ik-failure") return "IK ara noktayı çözemedi";
  return "Eklem limiti aşıldı";
}

function MotionResultCard({ plan }: { plan: RobotCellMotionPlan }) {
  const safe = plan.status === "safe";
  return (
    <div data-testid={`${plan.kind}-result`} className={`rounded-2xl border p-4 ${safe ? "border-success-border bg-success-surface" : "border-rose-400/50 bg-rose-950/10"}`}>
      <div className="flex items-center justify-between gap-3">
        <strong className={safe ? "text-success-ink" : "text-rose-700 dark:text-rose-300"}>{safe ? "✓" : "!"} {motionStatus(plan)}</strong>
        <span className="font-mono text-xs uppercase text-site-subtle">{plan.samples.length} örnek</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-site-muted">
        <div><dt>TCP yolu</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{plan.tcpDistanceMetres.toFixed(3)} m</dd></div>
        <div><dt>Eklem yolu</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{(plan.jointTravelRadians * RAD_TO_DEG).toFixed(0)}°</dd></div>
        <div><dt>Alt süre</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{plan.estimatedDurationSeconds.toFixed(2)} s</dd></div>
      </dl>
    </div>
  );
}

function MotionComparisonLab({
  targetId,
  selectedMotion,
  selectedPlan,
  moveJPlan,
  moveLPlan,
  motionProgress,
  playing,
  onSelectTarget,
  onSelectMotion,
  onProgress,
  onPlay,
  onShowCollision,
}: {
  targetId: MotionTargetId;
  selectedMotion: RobotCellMotionKind;
  selectedPlan: RobotCellMotionPlan;
  moveJPlan: RobotCellMotionPlan;
  moveLPlan: RobotCellMotionPlan;
  motionProgress: number;
  playing: boolean;
  onSelectTarget: (target: MotionTargetId) => void;
  onSelectMotion: (kind: RobotCellMotionKind) => void;
  onProgress: (progress: number) => void;
  onPlay: () => void;
  onShowCollision: () => void;
}) {
  return (
    <section aria-label="Hareket prova laboratuvarı">
      <div>
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Motion lab · yol ön kontrolü</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-site-ink">Aynı hedefe iki farklı hareket</h3>
          <p className="mt-3 text-sm leading-6 text-site-muted">MoveJ bütün eklemleri birlikte ilerletir; TCP çoğu zaman eğri çizer. MoveL ise her Kartezyen ara noktayı IK ile çözmeye çalışır. İki yol da bağlantı kalınlığı hesaba katılarak masa, fikstür, kutu ve çevreye karşı örneklenir.</p>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Prova hedefi">
            {(Object.entries(MOTION_TARGETS) as Array<[MotionTargetId, (typeof MOTION_TARGETS)[MotionTargetId]]>).map(([id, target]) => (
              <button key={id} type="button" aria-pressed={targetId === id} onClick={() => onSelectTarget(id)} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${targetId === id ? "border-site-accent bg-site-accent text-site-on-accent" : "border-site-border bg-site-surface text-site-muted"}`}>{target.label} hedefi</button>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-site-border bg-site-surface p-3 text-xs leading-5 text-site-muted"><strong className="text-site-ink">Gerçeklik sınırı:</strong> Buradaki MoveL TCP konumunu doğrusal izler; takım yönelimini sabit tutma ve robotun kendi gövdesiyle çarpışması henüz çözülmez. Süre yalnız RobotSpec hız limitinden hesaplanan teorik alt sınırdır; ivme ve jerk profili değildir.</p>
        </div>

        <div className="mt-5 min-w-0">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <button type="button" aria-pressed={selectedMotion === "movej"} onClick={() => onSelectMotion("movej")} className={`min-h-14 rounded-2xl border px-4 text-left ${selectedMotion === "movej" ? "border-violet-500 bg-violet-500/10" : "border-site-border bg-site-surface"}`}><strong className="block text-site-ink">MoveJ yolunu seç</strong><span className="mt-1 block text-xs text-site-muted">Eklemler doğrusal · TCP eğrisel</span></button>
            <button type="button" aria-pressed={selectedMotion === "movel"} onClick={() => onSelectMotion("movel")} className={`min-h-14 rounded-2xl border px-4 text-left ${selectedMotion === "movel" ? "border-teal-500 bg-teal-500/10" : "border-site-border bg-site-surface"}`}><strong className="block text-site-ink">MoveL yolunu seç</strong><span className="mt-1 block text-xs text-site-muted">TCP doğrusal · IK ardışık</span></button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><MotionResultCard plan={moveJPlan} /><MotionResultCard plan={moveLPlan} /></div>

          <label className="mt-4 block rounded-2xl border border-site-border bg-site-surface p-4">
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-site-ink"><span>Hareket provası ilerlemesi</span><output className="font-mono">%{Math.round(motionProgress * 100)}</output></span>
            <input aria-label="Hareket provası ilerlemesi" type="range" min="0" max="100" step="1" value={Math.round(motionProgress * 100)} onChange={(event) => onProgress(Number(event.target.value) / 100)} className="mt-2 h-11 w-full touch-pan-y accent-teal-600" />
          </label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onPlay} disabled={playing || selectedPlan.samples.length < 2} className="min-h-11 rounded-xl bg-site-strong px-4 text-sm font-semibold text-site-on-strong disabled:cursor-not-allowed disabled:opacity-45">{playing ? "Prova oynatılıyor…" : "Seçili provayı oynat"}</button>
            <button type="button" onClick={onShowCollision} disabled={!selectedPlan.firstIssue} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink disabled:cursor-not-allowed disabled:opacity-45">Çarpışmaya kadar göster</button>
          </div>
          <p className="mt-3 min-h-11 text-xs leading-5 text-site-muted" aria-live="polite">{selectedPlan.status === "safe" ? `${selectedMotion === "movej" ? "MoveJ" : "MoveL"} yolu bütün örneklerde temiz. Mor/yeşil TCP izlerini sahnede karşılaştır.` : `${selectedMotion === "movej" ? "MoveJ" : "MoveL"} provası durduruldu: ${motionStatus(selectedPlan)}. Pembe işaret ilk problemli örneği gösteriyor.`}</p>
        </div>
      </div>
    </section>
  );
}
