"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { planRobotCellMoveJ, planRobotCellMoveL, ROBOT_CELL_OBSTACLES, sampleRobotCellMotion, type RobotCellMotionKind } from "@/lib/robotics/robotCellMotion";
import { assessRobotCellGrip, createRobotCellSampleJob, createTaughtPose, preflightRobotCellProgram, recordRobotCellCommandSmart, releasedWorkpiecePosition, repairRobotCellProgram, ROBOT_CELL_WORKPIECE, solveRobotCellDirectTarget, type RobotCellProgramCommand } from "@/lib/robotics/robotCellProgram";
import { robotCellAxisTarget } from "@/lib/robotics/robotCellVisual";
import { genericSixDofRobot } from "@/lib/robotics/robots/genericSixDof";
import type { Vec3 } from "@/lib/robotics/transform";
import {
  ROBOT_CELL_MOTION_TARGETS,
  RobotCellMotionSettings,
  RobotCellMotionTransport,
  type RobotCellMotionTargetId,
} from "./RobotCellMotionWorkbench";
import { RobotCellProgramTransport, RobotCellTeachingWorkbench } from "./RobotCellTeachingWorkbench";
import { RobotCellDirectTeaching } from "./RobotCellDirectTeaching";

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

function nextIndexedId(prefix: "C" | "P", values: readonly string[]): string {
  const maximum = values.reduce((current, value) => {
    const index = Number.parseInt(value.slice(1), 10);
    return Number.isFinite(index) ? Math.max(current, index) : current;
  }, 0);
  return `${prefix}${maximum + 1}`;
}

export function RobotCellStudio() {
  const [studio, setStudio] = useState(createRobotCellStudioState);
  const [showFrames, setShowFrames] = useState(false);
  const [controlMode, setControlMode] = useState<"joints" | "motion">("joints");
  const [focusMode, setFocusMode] = useState(false);
  const [focusPanel, setFocusPanel] = useState<"direct" | "motion" | "teach">("direct");
  const [motionTargetId, setMotionTargetId] = useState<RobotCellMotionTargetId>("inspection");
  const [selectedMotion, setSelectedMotion] = useState<RobotCellMotionKind>("movej");
  const [motionProgress, setMotionProgress] = useState(0);
  const [previewAngles, setPreviewAngles] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [programCommands, setProgramCommands] = useState<RobotCellProgramCommand[]>([]);
  const [programPlaying, setProgramPlaying] = useState(false);
  const [activeProgramCommandIndex, setActiveProgramCommandIndex] = useState<number | null>(null);
  const [programCompleted, setProgramCompleted] = useState(false);
  const [workpiecePosition, setWorkpiecePosition] = useState<Vec3>(() => ({ ...ROBOT_CELL_WORKPIECE.start }));
  const [gripperClosed, setGripperClosed] = useState(false);
  const [holdingPart, setHoldingPart] = useState(false);
  const [directTaskFinished, setDirectTaskFinished] = useState(false);
  const [directStatus, setDirectStatus] = useState("Önce Z ile güvenli yüksekliğe çık; sonra X ve Y ile turuncu parçanın üstüne ilerle.");
  const playbackFrame = useRef<number | null>(null);
  const programPlaybackFrame = useRef<number | null>(null);
  const directAnglesRef = useRef<number[]>([]);
  const programCommandProgress = useRef(0);
  const motionProgressRef = useRef(0);
  const focusCloseButton = useRef<HTMLButtonElement | null>(null);
  const focusDialog = useRef<HTMLDivElement | null>(null);
  const focusLaunchButton = useRef<HTMLButtonElement | null>(null);
  const focusSettingsPanel = useRef<HTMLElement | null>(null);
  const jointAngles = useMemo(() => jointAnglesRadians(studio), [studio]);
  const [motionStartAngles, setMotionStartAngles] = useState(() => [...jointAngles]);
  const targetAngles = useMemo(
    () => ROBOT_CELL_MOTION_TARGETS[motionTargetId].jointDegrees.map((degrees) => degrees * Math.PI / 180),
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
  const programPreflight = useMemo(
    () => preflightRobotCellProgram(genericSixDofRobot, motionStartAngles, programCommands),
    [motionStartAngles, programCommands],
  );
  const displayedAngles = previewAngles ?? jointAngles;
  useEffect(() => {
    directAnglesRef.current = [...displayedAngles];
  }, [displayedAngles]);
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
  const gripAssessment = useMemo(
    () => assessRobotCellGrip(genericSixDofRobot, displayedAngles, workpiecePosition),
    [displayedAngles, workpiecePosition],
  );
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
    motionProgressRef.current = clamped;
    setMotionProgress(clamped);
    setPreviewAngles([...sampleRobotCellMotion(plan, clamped).jointAngles]);
  }, [selectedPlan]);

  function selectMotionTarget(targetId: RobotCellMotionTargetId) {
    setMotionTargetId(targetId);
    setMotionProgress(0);
    motionProgressRef.current = 0;
    setPreviewAngles(null);
    setPlaying(false);
  }

  function selectMotion(kind: RobotCellMotionKind) {
    setSelectedMotion(kind);
    setMotionProgress(0);
    motionProgressRef.current = 0;
    setPreviewAngles(null);
    setPlaying(false);
  }

  function selectFocusPanel(panel: "direct" | "motion" | "teach") {
    setFocusPanel(panel);
    focusSettingsPanel.current?.scrollTo({ top: 0 });
  }

  function appendMove(label: string, angles = displayedAngles, motion: RobotCellMotionKind = "movej") {
    setProgramCommands((commands) => {
      const poseId = nextIndexedId("P", commands.flatMap((command) => command.type === "move" ? [command.pose.id] : []));
      const commandId = nextIndexedId("C", commands.map((command) => command.id));
      const pose = createTaughtPose(genericSixDofRobot, poseId, label, angles);
      return [...commands, { id: commandId, type: "move", motion, pose }];
    });
    setProgramCompleted(false);
  }

  function appendSmartMove(label: string, angles = displayedAngles, motion: RobotCellMotionKind = "movej") {
    setProgramCommands((commands) => {
      const poseId = nextIndexedId("P", commands.flatMap((command) => command.type === "move" ? [command.pose.id] : []));
      const commandId = nextIndexedId("C", commands.map((command) => command.id));
      const pose = createTaughtPose(genericSixDofRobot, poseId, label, angles);
      return recordRobotCellCommandSmart(commands, { id: commandId, type: "move", motion, pose }).commands;
    });
    setProgramCompleted(false);
  }

  function moveGripperTo(target: Vec3, label: string, save = true) {
    const solution = solveRobotCellDirectTarget(genericSixDofRobot, directAnglesRef.current, target);
    if (solution.status !== "ready" || !solution.angles) {
      setDirectStatus(solution.status === "collision" ? `Bu poz ${solution.obstacleLabel ?? "hücre elemanı"} ile çarpışıyor.` : "Robot bu noktaya eklem limitleri içinde ulaşamıyor.");
      return;
    }
    directAnglesRef.current = [...solution.angles];
    setPreviewAngles(solution.angles);
    if (holdingPart) setWorkpiecePosition({ ...forwardKinematics(genericSixDofRobot, solution.angles).endEffector });
    setDirectStatus(`${label} konumuna ulaşıldı${save ? " ve programa eklendi" : ""}.`);
    if (save) appendSmartMove(label, solution.angles, "movej");
  }

  function saveDirectMove(label: string) {
    appendSmartMove(label, displayedAngles, "movej");
    setDirectStatus(`${label} akıllı kayda işlendi. Aynı veya çok yakın bir poz varsa yeni satır açılmadı.`);
  }

  function jogGripper(axis: "x" | "y" | "z", delta: number) {
    const current = forwardKinematics(genericSixDofRobot, directAnglesRef.current).endEffector;
    const mustLiftBeforeTravel = holdingPart && (axis === "x" || axis === "y") && current.z < 0.74;
    if (mustLiftBeforeTravel) {
      setDirectStatus("Parçayı yatay taşımadan önce Z+ ile en az 0,75 m güvenli yüksekliğe kaldır.");
      return;
    }
    const target = robotCellAxisTarget(current, axis, current[axis] + delta);
    const reachesSafeLift = holdingPart && axis === "z" && current.z < 0.74 && target.z >= 0.74;
    const reachesDropApproach = holdingPart
      && axis !== "z"
      && target.z >= 0.74
      && Math.hypot(target.x - ROBOT_CELL_WORKPIECE.drop.x, target.y - ROBOT_CELL_WORKPIECE.drop.y) <= 0.012;
    moveGripperTo(target, reachesSafeLift ? "Güvenli kaldırma" : reachesDropApproach ? "Bırakma üstü" : `${axis.toUpperCase()} jog`, true);
  }

  function gripPart() {
    const assessment = assessRobotCellGrip(genericSixDofRobot, displayedAngles, workpiecePosition);
    if (!assessment.canGrip) {
      setDirectStatus(assessment.reason === "orientation" ? "Bilek açısı uygun değil. Gripper parçaya üstten ve paralel gelmeli." : "Gripper parçanın merkezinde değil. Biraz daha yaklaştır.");
      return;
    }
    saveDirectMove("Kavrama konumu");
    addSmartGripperCommand("close");
    setGripperClosed(true);
    setHoldingPart(true);
    setDirectTaskFinished(false);
    setDirectStatus("Parça kavrandı. Şimdi mavi bırakma alanına taşı.");
  }

  function releasePart() {
    const currentTcp = forwardKinematics(genericSixDofRobot, displayedAngles).endEffector;
    const atDrop = Math.hypot(currentTcp.x - ROBOT_CELL_WORKPIECE.drop.x, currentTcp.y - ROBOT_CELL_WORKPIECE.drop.y) <= 0.012
      && Math.abs(currentTcp.z - ROBOT_CELL_WORKPIECE.drop.z) <= 0.012;
    saveDirectMove(atDrop ? "Bırakma konumu" : "Elle bırakma konumu");
    addSmartGripperCommand("open");
    setGripperClosed(false);
    setHoldingPart(false);
    const landedPosition = releasedWorkpiecePosition(currentTcp);
    setWorkpiecePosition(landedPosition);
    setDirectTaskFinished(atDrop);
    setDirectStatus(atDrop
      ? "Parça mavi alana bırakıldı. Programı oynatıp bütün işi izle."
      : "Gripper açıldı. Parça altındaki yüzeye bırakıldı ve iki komut programa kaydedildi.");
  }

  function teachCurrentPose() {
    appendMove(`Öğretilen konum ${programCommands.filter((command) => command.type === "move").length + 1}`, displayedAngles, selectedMotion);
  }

  function addGripperCommand(action: "open" | "close") {
    setProgramCommands((commands) => {
      const commandId = nextIndexedId("C", commands.map((command) => command.id));
      return [...commands, { id: commandId, type: "gripper", action }];
    });
    setProgramCompleted(false);
  }

  function addSmartGripperCommand(action: "open" | "close") {
    setProgramCommands((commands) => {
      const commandId = nextIndexedId("C", commands.map((command) => command.id));
      return recordRobotCellCommandSmart(commands, { id: commandId, type: "gripper", action }).commands;
    });
    setProgramCompleted(false);
  }

  function resetProgramPlayback(resetScene = true) {
    if (programPlaybackFrame.current !== null) window.cancelAnimationFrame(programPlaybackFrame.current);
    programPlaybackFrame.current = null;
    programCommandProgress.current = 0;
    setProgramPlaying(false);
    setActiveProgramCommandIndex(null);
    setProgramCompleted(false);
    if (!resetScene) return;
    setPreviewAngles(null);
    setWorkpiecePosition({ ...ROBOT_CELL_WORKPIECE.start });
    setGripperClosed(false);
    setHoldingPart(false);
    setDirectTaskFinished(false);
  }

  function removeProgramCommand(id: string) {
    setProgramCommands((commands) => commands.filter((command) => command.id !== id));
    resetProgramPlayback();
    setDirectStatus("Program düzenlendi. Prova başlangıca alındı; yeniden oynattığında ilk satırdan başlayacak.");
  }

  function repairProgram() {
    const result = repairRobotCellProgram(genericSixDofRobot, motionStartAngles, programCommands);
    setProgramCommands(result.commands);
    resetProgramPlayback();
    setDirectStatus(result.removedCommandIds.length === 0
      ? "Program zaten temiz; yinelenen veya engellenen satır bulunmadı."
      : `${result.removedCommandIds.length} yinelenen veya engellenen satır ayıklandı. Prova baştan başlayacak.`);
  }

  useEffect(() => {
    if (!playing) return;
    const startedAt = performance.now();
    const terminalProgress = selectedPlan.firstIssue?.progress ?? 1;
    const initialProgress = motionProgressRef.current >= terminalProgress - 0.001 ? 0 : motionProgressRef.current;
    if (initialProgress === 0) showMotionProgress(0, selectedPlan);
    const durationMilliseconds = Math.max(1.2, selectedPlan.estimatedDurationSeconds * (terminalProgress - initialProgress)) * 1_000;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMilliseconds);
      showMotionProgress(initialProgress + progress * (terminalProgress - initialProgress), selectedPlan);
      if (progress < 1) playbackFrame.current = window.requestAnimationFrame(animate);
      else setPlaying(false);
    };
    playbackFrame.current = window.requestAnimationFrame(animate);
    return () => {
      if (playbackFrame.current !== null) window.cancelAnimationFrame(playbackFrame.current);
    };
  }, [playing, selectedPlan, showMotionProgress]);

  useEffect(() => {
    if (!programPlaying || programPreflight.status !== "ready") return;
    let commandIndex = activeProgramCommandIndex ?? 0;
    let commandStartedAt: number | null = null;

    const advance = (now: number) => {
      const step = programPreflight.steps[commandIndex];
      if (!step) {
        setProgramPlaying(false);
        setActiveProgramCommandIndex(null);
        setProgramCompleted(true);
        return;
      }
      setActiveProgramCommandIndex(commandIndex);
      const duration = step.motionPlan ? Math.max(2, step.motionPlan.estimatedDurationSeconds) * 1_000 : 900;
      commandStartedAt ??= now - programCommandProgress.current * duration;
      const progress = Math.min(1, (now - commandStartedAt) / duration);
      programCommandProgress.current = progress;
      if (step.motionPlan) setPreviewAngles([...sampleRobotCellMotion(step.motionPlan, progress).jointAngles]);
      if (step.motionPlan && step.holdingPartAfter) setWorkpiecePosition({ ...sampleRobotCellMotion(step.motionPlan, progress).tcp });
      if (progress >= 1) {
        const command = programCommands[commandIndex];
        if (command?.type === "gripper") {
          setGripperClosed(command.action === "close");
          setHoldingPart(command.action === "close");
          if (command.action === "open") setWorkpiecePosition({ ...step.workpiecePositionAfter });
        }
        commandIndex += 1;
        commandStartedAt = now;
        programCommandProgress.current = 0;
        if (commandIndex >= programPreflight.steps.length) {
          setProgramPlaying(false);
          setActiveProgramCommandIndex(null);
          setProgramCompleted(true);
          programCommandProgress.current = 0;
          return;
        }
      }
      programPlaybackFrame.current = window.requestAnimationFrame(advance);
    };
    programPlaybackFrame.current = window.requestAnimationFrame(advance);
    return () => {
      if (programPlaybackFrame.current !== null) window.cancelAnimationFrame(programPlaybackFrame.current);
    };
  }, [programPlaying, programPreflight, activeProgramCommandIndex, programCommands]);

  useEffect(() => {
    if (!focusMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusCloseButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        focusCloseButton.current?.click();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(focusDialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [focusMode]);

  function enterMotionFocus() {
    setMotionStartAngles([...jointAngles]);
    setControlMode("motion");
    setPreviewAngles(null);
    setMotionProgress(0);
    motionProgressRef.current = 0;
    setPlaying(false);
    setFocusPanel("direct");
    setFocusMode(true);
  }

  function leaveMotionFocus() {
    setPlaying(false);
    setProgramPlaying(false);
    setActiveProgramCommandIndex(null);
    programCommandProgress.current = 0;
    setFocusMode(false);
    setControlMode("joints");
    setPreviewAngles(null);
    setMotionProgress(0);
    motionProgressRef.current = 0;
    window.requestAnimationFrame(() => focusLaunchButton.current?.focus());
  }

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

          {focusMode ? (
            <div aria-hidden="true" className="h-[430px] rounded-2xl border border-slate-700 bg-slate-950 sm:h-[520px] lg:h-[600px]" />
          ) : (
            <SahneAlani className="h-[430px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 sm:h-[520px] lg:h-[600px]">
              <RobotCellScene
                robot={genericSixDofRobot}
                jointAngles={displayedAngles}
                activeJointIndex={studio.activeJointIndex}
                cameraPreset={studio.cameraPreset}
                showFrames={showFrames}
              />
            </SahneAlani>
          )}

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
            <li className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-700" aria-hidden="true" />Bırakma tablası</li>
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
            <button ref={focusLaunchButton} type="button" aria-pressed={controlMode === "motion"} onClick={enterMotionFocus} className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${controlMode === "motion" ? "bg-site-accent text-site-on-accent" : "text-site-muted"}`}>Robotu öğret</button>
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
          </> : null}
          {controlMode === "motion" && (
            <div className="rounded-2xl border border-site-border bg-site-soft p-5 text-sm leading-6 text-site-muted">
              <strong className="block text-site-ink">Robot öğretimi odak görünümünde açık.</strong>
              Robot, iş parçası ve kumanda aynı kadrajda tutuluyor.
            </div>
          )}
        </aside>
      </div>
      {focusMode && typeof document !== "undefined" && createPortal(
        <div ref={focusDialog} role="dialog" aria-modal="true" aria-label="Robot hücresi odak görünümü" className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-site-bg text-site-ink">
          <div className="relative min-h-[72px] shrink-0 border-b border-site-border bg-site-surface px-3 py-2 pr-24 sm:min-h-16 sm:px-6 sm:py-2 sm:pr-36">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-site-accent-text">Odak görünümü · robot öğretimi</p>
              <p className="truncate font-heading text-lg font-semibold">Robotu götür, kavrat, bıraktır</p>
            </div>
            <button ref={focusCloseButton} type="button" aria-label="Sayfaya dön" onClick={leaveMotionFocus} className="absolute right-3 top-2.5 min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold hover:bg-site-soft sm:right-6 sm:px-4"><span className="sm:hidden">Geri</span><span className="hidden sm:inline">Sayfaya dön</span></button>
          </div>

          <div role="region" aria-label="Hareket prova laboratuvarı" className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(500px,65dvh)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_430px] xl:grid-rows-1">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-site-border bg-slate-950 xl:border-b-0 xl:border-r">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Odak görünümü kamerası">
                  {CAMERA_BUTTONS.map(({ preset, label }) => (
                    <button key={preset} type="button" aria-pressed={studio.cameraPreset === preset} onClick={() => selectCamera(preset)} className={`min-h-11 rounded-xl border px-3 text-xs font-semibold ${studio.cameraPreset === preset ? "border-teal-300 bg-teal-300 text-slate-950" : "border-slate-600 bg-slate-900 text-slate-200"}`}>{label}</button>
                  ))}
                </div>
                <div className="font-mono text-xs text-slate-300">TCP · X {formatMetres(kinematics.endEffector.x)} · Y {formatMetres(kinematics.endEffector.y)} · Z {formatMetres(kinematics.endEffector.z)}</div>
                <span className="sr-only" data-testid="tcp-orientation-direct">R {orientation.roll.toFixed(1)} P {orientation.pitch.toFixed(1)} Y {orientation.yaw.toFixed(1)}</span>
              </div>

              <div data-testid="robot-cell-stage" className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <SahneAlani className="h-full">
                  <RobotCellScene
                    robot={genericSixDofRobot}
                    jointAngles={displayedAngles}
                    activeJointIndex={studio.activeJointIndex}
                    cameraPreset={studio.cameraPreset}
                    showFrames={showFrames}
                    motionPlans={focusPanel === "motion" ? motionPlans : undefined}
                    selectedMotion={selectedMotion}
                    targetTcp={focusPanel === "motion" ? targetTcp : undefined}
                    workpiecePosition={workpiecePosition}
                    gripperClosed={gripperClosed}
                    directControl={false}
                  />
                </SahneAlani>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-slate-950 px-3 py-3 text-white sm:px-4">
                {focusPanel === "motion" ? (
                  <RobotCellMotionTransport
                    selectedPlan={selectedPlan}
                    selectedMotion={selectedMotion}
                    motionProgress={motionProgress}
                    playing={playing}
                    onProgress={(progress) => showMotionProgress(progress)}
                    onPlay={() => setPlaying((current) => !current)}
                    onShowCollision={() => {
                      if (!selectedPlan.firstIssue) return;
                      showMotionProgress(selectedPlan.firstIssue.progress, selectedPlan);
                    }}
                  />
                ) : (
                  <RobotCellProgramTransport
                    commandCount={programCommands.length}
                    preflight={programPreflight}
                    playing={programPlaying}
                    activeCommandIndex={activeProgramCommandIndex}
                    completed={programCompleted}
                    gripperClosed={gripperClosed}
                    onPlay={() => {
                      if (programPlaying) {
                        setProgramPlaying(false);
                        return;
                      }
                      if (activeProgramCommandIndex === null) {
                        setPreviewAngles(null);
                        setWorkpiecePosition({ ...ROBOT_CELL_WORKPIECE.start });
                        setGripperClosed(false);
                        setHoldingPart(false);
                        setProgramCompleted(false);
                        setActiveProgramCommandIndex(0);
                        programCommandProgress.current = 0;
                      }
                      setProgramPlaying(true);
                    }}
                  />
                )}
              </div>
            </div>

            <aside ref={focusSettingsPanel} className="min-h-0 overflow-y-auto bg-site-surface p-4 sm:p-5" aria-label="Odak görünümü hareket ayarları">
              <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-site-border bg-site-soft p-1" role="tablist" aria-label="Robot hücresi çalışma modu">
                <button type="button" role="tab" aria-selected={focusPanel === "direct"} onClick={() => selectFocusPanel("direct")} className={`min-h-11 rounded-lg px-2 text-xs font-semibold sm:text-sm ${focusPanel === "direct" ? "bg-site-surface text-site-ink shadow-sm" : "text-site-muted"}`}>Al ve bırak</button>
                <button type="button" role="tab" aria-selected={focusPanel === "motion"} onClick={() => selectFocusPanel("motion")} className={`min-h-11 rounded-lg px-2 text-xs font-semibold sm:text-sm ${focusPanel === "motion" ? "bg-site-surface text-site-ink shadow-sm" : "text-site-muted"}`}>Yol provası</button>
                <button type="button" role="tab" aria-selected={focusPanel === "teach"} onClick={() => selectFocusPanel("teach")} className={`min-h-11 rounded-lg px-2 text-xs font-semibold sm:text-sm ${focusPanel === "teach" ? "bg-site-surface text-site-ink shadow-sm" : "text-site-muted"}`}>İleri düzey</button>
              </div>
              {focusPanel === "direct" ? (
                <RobotCellDirectTeaching
                  commands={programCommands}
                  preflight={programPreflight}
                  grip={gripAssessment}
                  gripperClosed={gripperClosed}
                  holdingPart={holdingPart}
                  directStatus={directStatus}
                  tcp={kinematics.endEffector}
                  activeTarget={holdingPart ? ROBOT_CELL_WORKPIECE.drop : workpiecePosition}
                  taskFinished={directTaskFinished}
                  playing={programPlaying}
                  onGrip={gripPart}
                  onRelease={releasePart}
                  onSavePose={() => saveDirectMove("Kaydedilen ara konum")}
                  onJog={jogGripper}
                  onRepair={repairProgram}
                  onReset={() => {
                    setPreviewAngles(null);
                    directAnglesRef.current = [...jointAngles];
                    setDirectStatus("Robot başlangıç pozuna döndü. X/Y ile hizala, Z ile alçal.");
                  }}
                  onClear={() => {
                    setProgramCommands([]);
                    resetProgramPlayback();
                    setDirectStatus("Program temizlendi. Gripper’ı yeniden parçanın üstüne getir.");
                  }}
                />
              ) : focusPanel === "motion" ? (
                <div role="tabpanel" aria-label="Yolu karşılaştır">
                  <RobotCellMotionSettings
                    targetId={motionTargetId}
                    selectedMotion={selectedMotion}
                    moveJPlan={moveJPlan}
                    moveLPlan={moveLPlan}
                    onSelectTarget={selectMotionTarget}
                    onSelectMotion={selectMotion}
                  />
                </div>
              ) : (
                <RobotCellTeachingWorkbench
                  selectedMotion={selectedMotion}
                  commands={programCommands}
                  preflight={programPreflight}
                  playing={programPlaying}
                  activeCommandIndex={activeProgramCommandIndex}
                  onSelectMotion={selectMotion}
                  onTeachPose={teachCurrentPose}
                  onAddGripper={addGripperCommand}
                  onRemoveCommand={removeProgramCommand}
                  onRepair={repairProgram}
                  onClear={() => {
                    setProgramCommands([]);
                    resetProgramPlayback();
                  }}
                  onLoadSample={() => {
                    setProgramCommands(createRobotCellSampleJob(genericSixDofRobot));
                    resetProgramPlayback();
                  }}
                />
              )}
            </aside>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
