"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import {
  createCustomRobotSpec,
  createDefaultCustomRobotDefinition,
  CUSTOM_ROBOT_MAX_DOF,
  CUSTOM_ROBOT_MAX_LINK_LENGTH,
  CUSTOM_ROBOT_MIN_DOF,
  CUSTOM_ROBOT_MIN_LINK_LENGTH,
  type CustomRobotDefinition,
  type CustomRobotValidationIssue,
} from "@/lib/robotics/customRobot";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import { selectClosestIkSolution, solveIkTargetCandidates } from "@/lib/robotics/ikSolver";
import { stepLiveGuidanceAngles } from "@/lib/robotics/liveRobotGuidance";
import {
  analyzeCustomRobotPose,
  appendMotionWaypointWithCompaction,
  beginAdaptiveMotionCapture,
  captureAdaptiveMotionSample,
  CUSTOM_ROBOT_MAX_WAYPOINTS,
  planJointTrajectory,
  sampleJointTrajectory,
  sampleTrajectoryTcpPath,
  type AdaptiveMotionCaptureState,
  type JointTrajectory,
  type JointTrajectoryPlanResult,
} from "@/lib/robotics/customRobotMotion";
import { decodeLabState, encodeLabState, type CustomRobotLabState } from "@/lib/labState";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

const STORAGE_KEY = "robotik-platform:custom-robot:v1";
const MAX_TRACE_POINTS = 160;
const DEFAULT_PROGRAM_SPEED = 0.35;
const DEFAULT_DEFINITION = createDefaultCustomRobotDefinition(2);
type ConsolePanel = "joints" | "target" | "teach";
type LiveGuideCommand = {
  target: { x: number; y: number };
  desiredAngles: number[];
  lastFrameAtMs: number | null;
  solver: "analytical" | "dls";
  residual: number;
};

const CONSOLE_PANELS: Array<{ id: ConsolePanel; label: string; shortLabel: string }> = [
  { id: "joints", label: "Eklemleri sür", shortLabel: "Eklemler" },
  { id: "target", label: "Hedefe git", shortLabel: "Hedef" },
  { id: "teach", label: "Hareket öğret", shortLabel: "Öğret" },
];

function round(value: number, digits = 3) {
  const scale = 10 ** digits;
  const result = Math.round(value * scale) / scale;
  return Object.is(result, -0) ? 0 : result;
}

function homeAngles(robot: RobotSpec): number[] {
  return robot.joints.map((joint) => {
    if (joint.limits.min <= 0 && joint.limits.max >= 0) return 0;
    return (joint.limits.min + joint.limits.max) / 2;
  });
}

function defaultTarget(robot: RobotSpec) {
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  return { x: round(reach * 0.55, 2), y: round(reach * 0.25, 2) };
}

function stateFromDefinition(definition: CustomRobotDefinition): CustomRobotLabState {
  const result = createCustomRobotSpec(definition);
  if (!result.ok) throw new Error("Varsayılan kullanıcı robotu geçersiz.");
  return {
    kind: "custom-robot",
    version: 1,
    definition: result.definition,
    jointAngles: homeAngles(result.robot),
    target: defaultTarget(result.robot),
    program: { waypoints: [], speedScale: DEFAULT_PROGRAM_SPEED },
  };
}

function programOf(state: CustomRobotLabState) {
  return state.program ?? { waypoints: [], speedScale: DEFAULT_PROGRAM_SPEED };
}

function describeRejectedPose(robot: RobotSpec, angles: number[]) {
  const analysis = analyzeCustomRobotPose(robot, angles);
  if (analysis.limitViolations.length > 0) {
    const violation = analysis.limitViolations[0];
    return `Hareket reddedildi · J${violation.jointIndex + 1} mekanik limitin dışına çıkıyor.`;
  }
  if (analysis.selfCollisionPairs.length > 0) {
    const [first, second] = analysis.selfCollisionPairs[0];
    return `Hareket reddedildi · idealize ön kontrolde L${first + 1} ile L${second + 1} kesişiyor.`;
  }
  return null;
}

function describeTrajectoryFailure(result: JointTrajectoryPlanResult) {
  if (result.ok) return null;
  if (result.reason === "not-enough-waypoints") return "Prova için en az iki farklı poz öğret.";
  if (result.reason === "invalid-speed") return "Prova hızı %5 ile %100 arasında olmalı.";
  if (result.reason === "joint-limit") {
    const joint = result.analysis?.limitViolations[0];
    return `Prova reddedildi · ${joint ? `J${joint.jointIndex + 1}` : "bir eklem"} mekanik limitin dışına çıkıyor.`;
  }
  if (result.reason === "self-collision") {
    const pair = result.analysis?.selfCollisionPairs[0];
    return `Prova reddedildi · ${pair ? `L${pair[0] + 1} ile L${pair[1] + 1}` : "bağlantılar"} ara harekette kesişiyor.`;
  }
  return "Prova reddedildi · programdaki eklem sayıları robotla eşleşmiyor.";
}

function tracePoint(robot: RobotSpec, angles: number[]) {
  const point = forwardKinematics(robot, angles).endEffector;
  return { x: point.x, y: point.y };
}

function PlanarRobotDiagram({
  robot,
  angles,
  target,
  trace,
  taughtPath,
  taughtPoints,
  guideEnabled,
  onGuideTarget,
}: {
  robot: RobotSpec;
  angles: number[];
  target: { x: number; y: number };
  trace: Array<{ x: number; y: number }>;
  taughtPath: Array<{ x: number; y: number }>;
  taughtPoints: Array<{ x: number; y: number }>;
  guideEnabled: boolean;
  onGuideTarget: (target: { x: number; y: number }, capturedAtMs: number) => void;
}) {
  const dragging = useRef(false);
  const pendingGuide = useRef<{ target: { x: number; y: number }; capturedAtMs: number } | null>(null);
  const guideFrame = useRef<number | null>(null);
  const { jointPositions, endEffector } = useMemo(
    () => forwardKinematics(robot, angles),
    [angles, robot],
  );
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  const scale = 168 / Math.max(reach, 0.25);
  const toSvg = (point: { x: number; y: number }) => ({ x: 200 + point.x * scale, y: 200 - point.y * scale });
  const sceneJoints = jointPositions.map(toSvg);
  const sceneTarget = toSvg(target);
  const tracePath = trace.map((point, index) => {
    const scenePoint = toSvg(point);
    return `${index === 0 ? "M" : "L"} ${scenePoint.x} ${scenePoint.y}`;
  }).join(" ");
  const taughtPathData = taughtPath.map((point, index) => {
    const scenePoint = toSvg(point);
    return `${index === 0 ? "M" : "L"} ${scenePoint.x} ${scenePoint.y}`;
  }).join(" ");
  const sceneTaughtPoints = taughtPoints.map(toSvg);
  const grid = Array.from({ length: 9 }, (_, index) => 32 + index * 42);

  useEffect(() => () => {
    if (guideFrame.current !== null) window.cancelAnimationFrame(guideFrame.current);
  }, []);

  function scheduleGuide(target: { x: number; y: number }, capturedAtMs: number) {
    pendingGuide.current = { target, capturedAtMs };
    if (guideFrame.current !== null) return;
    guideFrame.current = window.requestAnimationFrame(() => {
      guideFrame.current = null;
      const pending = pendingGuide.current;
      pendingGuide.current = null;
      if (pending) onGuideTarget(pending.target, pending.capturedAtMs);
    });
  }

  function guideFromPointer(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const sceneX = ((event.clientX - bounds.left) / bounds.width) * 400;
    const sceneY = ((event.clientY - bounds.top) / bounds.height) * 400;
    scheduleGuide({ x: (sceneX - 200) / scale, y: (200 - sceneY) / scale }, event.timeStamp);
  }

  return (
    <div className="relative aspect-square min-h-72 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-inner">
      <svg
        viewBox="0 0 400 400"
        className={`h-full w-full ${guideEnabled ? "cursor-crosshair touch-none" : ""}`}
        role="img"
        aria-label={`${robot.displayName}: ${robot.joints.length} dönel eklemli düzlemsel robot. Uç nokta x ${round(endEffector.x)} metre, y ${round(endEffector.y)} metre.`}
        onPointerDown={(event) => {
          if (!guideEnabled) return;
          event.preventDefault();
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          guideFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (guideEnabled && dragging.current) {
            event.preventDefault();
            guideFromPointer(event);
          }
        }}
        onPointerUp={(event) => {
          if (guideEnabled) event.preventDefault();
          dragging.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <rect width="400" height="400" fill="#071217" />
        <g stroke="#17343d" strokeWidth="1">
          {grid.map((value) => (
            <g key={value}>
              <line x1={value} y1="32" x2={value} y2="368" />
              <line x1="32" y1={value} x2="368" y2={value} />
            </g>
          ))}
        </g>
        <circle cx="200" cy="200" r="168" fill="none" stroke="#31535e" strokeDasharray="5 6" />
        <line x1="32" y1="200" x2="368" y2="200" stroke="#5d7881" />
        <line x1="200" y1="32" x2="200" y2="368" stroke="#5d7881" />

        {tracePath && (
          <path
            d={tracePath}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            opacity="0.72"
          />
        )}

        {taughtPathData && (
          <path
            d={taughtPathData}
            fill="none"
            stroke="#c084fc"
            strokeWidth="3"
            opacity="0.9"
          />
        )}
        <g fill="#581c87" stroke="#e9d5ff" strokeWidth="2">
          {sceneTaughtPoints.map((position, index) => (
            <circle key={`taught-${index}`} cx={position.x} cy={position.y} r="5" />
          ))}
        </g>

        <g stroke="#b8d7df" strokeWidth="8" strokeLinecap="round">
          {sceneJoints.slice(0, -1).map((position, index) => (
            <line
              key={`link-${index}`}
              x1={position.x}
              y1={position.y}
              x2={sceneJoints[index + 1].x}
              y2={sceneJoints[index + 1].y}
            />
          ))}
        </g>
        <g fill="#0f172a" stroke="#5eead4" strokeWidth="3">
          {sceneJoints.map((position, index) => (
            <circle data-robot-joint={index} key={`joint-${index}`} cx={position.x} cy={position.y} r="7" />
          ))}
        </g>

        <g transform={`translate(${sceneTarget.x} ${sceneTarget.y})`}>
          <circle r="11" fill="none" stroke="#fb7185" strokeWidth="3" />
          <line x1="-17" y1="0" x2="17" y2="0" stroke="#fb7185" strokeWidth="2" />
          <line x1="0" y1="-17" x2="0" y2="17" stroke="#fb7185" strokeWidth="2" />
        </g>
        <text x={sceneTarget.x} y={sceneTarget.y - 22} textAnchor="middle" fill="#fecdd3" fontSize="10" fontFamily="ui-monospace, monospace">
          HEDEF
        </text>
        <text x="16" y="24" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
          XY / metre
        </text>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent" />
      <p className="absolute bottom-3 left-4 font-mono text-[11px] font-semibold tracking-wide text-slate-300">
        TCP [{round(endEffector.x)}, {round(endEffector.y)}]
      </p>
      {guideEnabled && (
        <p className="pointer-events-none absolute right-3 top-3 rounded-full border border-teal-400/50 bg-slate-950/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-200">
          TCP yönlendirme açık
        </p>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  invalid,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  invalid: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-site-muted">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="min-h-11 w-full rounded-xl border border-site-border bg-site-surface px-3 font-mono text-sm text-site-ink"
      />
    </label>
  );
}

export function CustomRobotPlayground() {
  const initialState = useMemo(() => stateFromDefinition(DEFAULT_DEFINITION), []);
  const [draft, setDraft] = useState<CustomRobotDefinition>(initialState.definition);
  const [activeState, setActiveState] = useState<CustomRobotLabState>(initialState);
  const [issues, setIssues] = useState<CustomRobotValidationIssue[]>([]);
  const [trace, setTrace] = useState<Array<{ x: number; y: number }>>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("Varsayılan iki eksenli robot deneye hazır.");
  const [ikStatus, setIkStatus] = useState("IK henüz çalıştırılmadı; hedefi seçip “Hedefe çöz” düğmesini kullan.");
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [guideEnabled, setGuideEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [motionStatus, setMotionStatus] = useState("Öğretim programı boş; robotu konumlandırıp ilk pozu kaydet.");
  const [playback, setPlayback] = useState<{ trajectory: JointTrajectory; startedAt: number } | null>(null);
  const [consolePanel, setConsolePanel] = useState<ConsolePanel>("joints");
  const captureRef = useRef<AdaptiveMotionCaptureState | null>(null);
  const activeAnglesRef = useRef([...initialState.jointAngles]);
  const guideEnabledRef = useRef(false);
  const robotRef = useRef<RobotSpec | null>(null);
  const liveGuideCommandRef = useRef<LiveGuideCommand | null>(null);
  const liveGuideFrameRef = useRef<number | null>(null);
  const liveGuideTickRef = useRef<(now: number) => void>(() => undefined);
  const liveGuideLastStatusRef = useRef<{ kind: string; atMs: number }>({ kind: "", atMs: 0 });

  const robotResult = useMemo(() => createCustomRobotSpec(activeState.definition), [activeState.definition]);
  const robot = robotResult.ok
    ? robotResult.robot
    : createCustomRobotSpec(DEFAULT_DEFINITION).ok
      ? (createCustomRobotSpec(DEFAULT_DEFINITION) as { ok: true; robot: RobotSpec }).robot
      : (() => { throw new Error("Varsayılan robot kurulamadı."); })();
  useEffect(() => {
    robotRef.current = robot;
  }, [robot]);
  const { endEffector } = useMemo(
    () => forwardKinematics(robot, activeState.jointAngles),
    [activeState.jointAngles, robot],
  );
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  const program = programOf(activeState);
  const poseAnalysis = useMemo(
    () => analyzeCustomRobotPose(robot, activeState.jointAngles),
    [activeState.jointAngles, robot],
  );
  const trajectoryPlan = useMemo(
    () => program.waypoints.length >= 2
      ? planJointTrajectory(robot, program.waypoints, program.speedScale)
      : null,
    [program, robot],
  );
  const taughtPath = useMemo(
    () => trajectoryPlan?.ok ? sampleTrajectoryTcpPath(robot, trajectoryPlan.trajectory) : [],
    [robot, trajectoryPlan],
  );
  const taughtPoints = useMemo(
    () => program.waypoints.map((angles) => {
      const point = forwardKinematics(robot, angles).endEffector;
      return { x: point.x, y: point.y };
    }),
    [program.waypoints, robot],
  );

  const stopLiveGuidance = useCallback(() => {
    liveGuideCommandRef.current = null;
    if (liveGuideFrameRef.current !== null) {
      window.cancelAnimationFrame(liveGuideFrameRef.current);
      liveGuideFrameRef.current = null;
    }
  }, []);

  const ensureLiveGuidanceFrame = useCallback(() => {
    if (liveGuideFrameRef.current !== null) return;
    liveGuideFrameRef.current = window.requestAnimationFrame((now) => {
      liveGuideFrameRef.current = null;
      liveGuideTickRef.current(now);
    });
  }, []);

  const restoreState = useCallback((state: CustomRobotLabState, source: "storage" | "share") => {
    const result = createCustomRobotSpec(state.definition);
    if (!result.ok) return;
    const restoredProgram = state.program ?? { waypoints: [], speedScale: DEFAULT_PROGRAM_SPEED };
    const restoredPlan = restoredProgram.waypoints.length >= 2
      ? planJointTrajectory(result.robot, restoredProgram.waypoints, restoredProgram.speedScale)
      : null;
    setDraft(result.definition);
    stopLiveGuidance();
    activeAnglesRef.current = [...state.jointAngles];
    setActiveState({
      ...state,
      definition: result.definition,
      program: restoredProgram,
    });
    setIssues([]);
    setTrace([tracePoint(result.robot, state.jointAngles)]);
    setConsolePanel("joints");
    setIkStatus("IK durumu yüklendi; hedefi değiştirebilir veya yeniden çözebilirsin.");
    setMotionStatus(restoredPlan?.ok
      ? `${restoredProgram.waypoints.length} öğretilmiş poz yüklendi; dijital provayı çalıştırabilirsin.`
      : restoredPlan
        ? describeTrajectoryFailure(restoredPlan) ?? "Öğretilmiş program yüklendi."
        : restoredProgram.waypoints.length === 1
          ? "Bir öğretilmiş poz yüklendi; prova için ikinci pozu öğret."
          : "Öğretim programı boş; robotu konumlandırıp ilk pozu kaydet.");
    setIsRecording(false);
    captureRef.current = null;
    setPlayback(null);
    if (source === "share") {
      setAnnouncement("Paylaşılan robot yüklendi ve bu tarayıcıya kaydedildi.");
      setShareNotice(null);
      setStorageReady(true);
    } else {
      setAnnouncement("Bu tarayıcıdaki son robot geri yüklendi.");
    }
  }, [stopLiveGuidance]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hasSharedState = new URLSearchParams(window.location.hash.slice(1)).has("lab");
        const encoded = window.localStorage.getItem(STORAGE_KEY);
        if (encoded && !hasSharedState) {
          const decoded = decodeLabState(encoded);
          if (decoded.ok && decoded.state.kind === "custom-robot") restoreState(decoded.state, "storage");
          else setAnnouncement("Yerel robot kaydı doğrulanamadı; güvenli varsayılan açıldı.");
        }
        setStorageAvailable(true);
        if (!hasSharedState) setStorageReady(true);
      } catch {
        setStorageAvailable(false);
        setAnnouncement("Yerel depolama kapalı; robot yalnız bu sekmede kalacak.");
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [restoreState]);

  useEffect(() => () => {
    liveGuideCommandRef.current = null;
    if (liveGuideFrameRef.current !== null) window.cancelAnimationFrame(liveGuideFrameRef.current);
  }, []);

  useEffect(() => {
    activeAnglesRef.current = activeState.jointAngles;
  }, [activeState.jointAngles]);

  useEffect(() => {
    guideEnabledRef.current = guideEnabled;
  }, [guideEnabled]);

  useSharedLabState(
    "custom-robot",
    (state) => restoreState(state, "share"),
    (error) => {
      setShareNotice(error);
      try {
        const encoded = window.localStorage.getItem(STORAGE_KEY);
        const decoded = encoded ? decodeLabState(encoded) : null;
        if (decoded?.ok && decoded.state.kind === "custom-robot") restoreState(decoded.state, "storage");
        else setAnnouncement("Paylaşım bağlantısı geçersiz; güvenli varsayılan açıldı.");
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
        setAnnouncement("Paylaşım açılamadı ve yerel depolama kapalı; güvenli varsayılan açıldı.");
      }
      setStorageReady(true);
    },
  );

  useEffect(() => {
    if (!storageReady) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, encodeLabState(activeState));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeState, storageReady]);

  useEffect(() => {
    if (!playback) return;
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = (now - playback.startedAt) / 1_000;
      const angles = sampleJointTrajectory(playback.trajectory, elapsed);
      activeAnglesRef.current = angles;
      setActiveState((current) => ({ ...current, jointAngles: angles }));
      if (elapsed >= playback.trajectory.totalDurationSeconds) {
        setTrace((current) => [...current, tracePoint(robot, angles)].slice(-MAX_TRACE_POINTS));
        setMotionStatus("Program tamamlandı · robot öğretilmiş yolun son pozunda.");
        setPlayback(null);
        return;
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [playback, robot]);

  function updateDof(nextDof: number) {
    const defaults = createDefaultCustomRobotDefinition(nextDof).joints;
    setDraft((current) => ({
      ...current,
      joints: Array.from({ length: nextDof }, (_, index) => current.joints[index] ?? defaults[index]),
    }));
    setIssues([]);
  }

  function updateJoint(index: number, field: "linkLength" | "minDegrees" | "maxDegrees", value: number) {
    setDraft((current) => ({
      ...current,
      joints: current.joints.map((joint, jointIndex) => jointIndex === index ? { ...joint, [field]: value } : joint),
    }));
    setIssues([]);
  }

  function applyDesign() {
    const result = createCustomRobotSpec(draft);
    if (!result.ok) {
      setIssues(result.issues);
      setAnnouncement("Tasarım uygulanmadı; işaretli alanları düzelt.");
      return;
    }
    const nextState = stateFromDefinition(result.definition);
    stopLiveGuidance();
    activeAnglesRef.current = [...nextState.jointAngles];
    setDraft(result.definition);
    setActiveState(nextState);
    setIssues([]);
    setTrace([tracePoint(result.robot, nextState.jointAngles)]);
    setIkStatus("IK henüz çalıştırılmadı; yeni robot için bir hedef seç.");
    setMotionStatus("Yeni robot için öğretim programı temizlendi; ilk pozu kaydedebilirsin.");
    setGuideEnabled(false);
    setIsRecording(false);
    captureRef.current = null;
    setPlayback(null);
    setAnnouncement(storageAvailable === false
      ? "Robot uygulandı; yerel depolama kapalı olduğu için yalnız bu sekmede kalacak."
      : "Robot tarayıcıya kaydedildi.");
  }

  function appendRecordedPose(currentProgram: ReturnType<typeof programOf>, angles: number[], force: boolean) {
    const last = currentProgram.waypoints.at(-1);
    if (last && angles.every((angle, index) => Math.abs(angle - last[index]) < 1e-9)) {
      return currentProgram;
    }
    if (!force && !captureRef.current) return currentProgram;
    return {
      ...currentProgram,
      waypoints: appendMotionWaypointWithCompaction(
        currentProgram.waypoints,
        angles,
        CUSTOM_ROBOT_MAX_WAYPOINTS,
      ),
    };
  }

  function commitSafePose(
    angles: number[],
    status: string,
    target?: { x: number; y: number },
    capturedAtMs?: number,
  ) {
    const rejection = describeRejectedPose(robot, angles);
    if (rejection) {
      setMotionStatus(rejection);
      return false;
    }
    let captureMode: "precision" | "rapid" | null = null;
    let shouldRecord = false;
    if (isRecording && capturedAtMs !== undefined) {
      const capture = captureRef.current ?? beginAdaptiveMotionCapture(activeAnglesRef.current, capturedAtMs);
      const decision = captureAdaptiveMotionSample(robot, capture, angles, capturedAtMs);
      captureRef.current = decision.state;
      captureMode = decision.mode;
      shouldRecord = decision.shouldRecord;
    }
    activeAnglesRef.current = angles;
    setActiveState((current) => {
      const nextProgram = shouldRecord
        ? appendRecordedPose(programOf(current), angles, false)
        : programOf(current);
      return { ...current, jointAngles: angles, ...(target ? { target } : {}), program: nextProgram };
    });
    setTrace((current) => [...current, tracePoint(robot, angles)].slice(-MAX_TRACE_POINTS));
    setMotionStatus(captureMode === "precision"
      ? "Adaptif kayıt · hassas hareket ayrıntıları mesafeye göre yakalanıyor."
      : captureMode === "rapid"
        ? "Adaptif kayıt · hızlı harekette saniyede en çok bir ara poz alınıyor."
        : status);
    return true;
  }

  function setJointAngle(index: number, degrees: number, capturedAtMs: number) {
    const angles = activeAnglesRef.current.map((angle, jointIndex) => jointIndex === index ? (degrees * Math.PI) / 180 : angle);
    if (commitSafePose(angles, "FK pozu geçerli · eklem limitleri ve idealize öz-çarpışma kontrol edildi.", undefined, capturedAtMs)) {
      setIkStatus("FK güncellendi; turkuaz çizgi TCP izini gösteriyor.");
    }
  }

  function setTarget(axis: "x" | "y", value: number) {
    setActiveState((current) => ({ ...current, target: { ...current.target, [axis]: value } }));
    setIkStatus("Yeni hedef seçildi; çözümü hesaplamak için “Hedefe çöz” düğmesini kullan.");
  }

  function solveTarget(capturedAtMs: number) {
    const currentAngles = activeAnglesRef.current;
    const candidates = solveIkTargetCandidates(
      robot,
      activeState.target,
      currentAngles,
      (angles) => !describeRejectedPose(robot, [...angles]),
    );
    const converged = selectClosestIkSolution(currentAngles, candidates);
    if (!converged) {
      const residual = Math.min(...candidates.map((candidate) => candidate.residual));
      setIkStatus(`IK hedefe yakınsamadı · son hata ${Number.isFinite(residual) ? round(residual, 4) : "∞"} m. Hedefi veya eklem limitlerini değiştir.`);
      return;
    }
    const safeCandidates = candidates.filter((candidate) => candidate.angles && !describeRejectedPose(robot, candidate.angles));
    const solution = selectClosestIkSolution(currentAngles, safeCandidates);
    if (solution?.angles && commitSafePose(solution.angles, "IK pozu fiziksel ön kontrolden geçti.", undefined, capturedAtMs)) {
      setIkStatus(`IK çözümü bulundu · ${solution.solver === "analytical" ? "analitik" : "DLS"} · ${solution.iterations} iterasyon · hata ${round(solution.residual, 5)} m.`);
    } else {
      setIkStatus("IK matematiksel bir aday buldu ancak hareket öz-çarpışma ön kontrolünden geçmedi.");
    }
  }

  function guideTcp(target: { x: number; y: number }, capturedAtMs: number) {
    const currentAngles = activeAnglesRef.current;
    const candidates = solveIkTargetCandidates(
      robot,
      target,
      currentAngles,
      (angles) => !describeRejectedPose(robot, [...angles]),
    );
    const safeCandidates = candidates.filter((candidate) => candidate.angles && !describeRejectedPose(robot, candidate.angles));
    const solution = selectClosestIkSolution(currentAngles, safeCandidates);
    if (!solution?.angles) {
      const residual = Math.min(...candidates.map((candidate) => candidate.residual));
      setMotionStatus(`Bu ara nokta çözülemedi · robot son geçerli hedefe yumuşak ilerlemeyi sürdürüyor · IK hatası ${Number.isFinite(residual) ? round(residual, 4) : "∞"} m.`);
      return;
    }
    liveGuideCommandRef.current = {
      target,
      desiredAngles: solution.angles,
      lastFrameAtMs: liveGuideCommandRef.current?.lastFrameAtMs ?? capturedAtMs,
      solver: solution.solver,
      residual: solution.residual,
    };
    ensureLiveGuidanceFrame();
  }

  function tickLiveGuidance(now: number) {
    const command = liveGuideCommandRef.current;
    const guidanceRobot = robotRef.current;
    if (!command || !guideEnabledRef.current || !guidanceRobot) {
      stopLiveGuidance();
      return;
    }
    const elapsedSeconds = command.lastFrameAtMs === null
      ? 1 / 60
      : (now - command.lastFrameAtMs) / 1_000;
    command.lastFrameAtMs = now;
    const currentAngles = activeAnglesRef.current;
    const nextAngles = stepLiveGuidanceAngles(guidanceRobot, currentAngles, command.desiredAngles, elapsedSeconds);
    const reachedTarget = nextAngles.every((angle, index) => Math.abs(angle - command.desiredAngles[index]) < 1e-7);
    const status = reachedTarget
      ? "TCP elle yönlendirildi; hız limitli poz ön kontrolden geçti."
      : "TCP hız limitleri içinde yumuşak biçimde hedefe ilerliyor.";
    const rejection = describeRejectedPose(guidanceRobot, nextAngles);
    if (rejection) {
      stopLiveGuidance();
      setMotionStatus(rejection);
      setIkStatus("Canlı IK ara pozu fiziksel ön kontrolden geçmedi; son güvenli poz korundu.");
      return;
    }
    let captureMode: "precision" | "rapid" | null = null;
    let shouldRecord = false;
    if (isRecording) {
      const capture = captureRef.current ?? beginAdaptiveMotionCapture(currentAngles, now);
      const decision = captureAdaptiveMotionSample(guidanceRobot, capture, nextAngles, now);
      captureRef.current = decision.state;
      captureMode = decision.mode;
      shouldRecord = decision.shouldRecord;
    }
    activeAnglesRef.current = nextAngles;
    setActiveState((current) => ({
      ...current,
      jointAngles: nextAngles,
      target: command.target,
      program: shouldRecord
        ? appendRecordedPose(programOf(current), nextAngles, false)
        : programOf(current),
    }));
    setTrace((current) => [...current, tracePoint(guidanceRobot, nextAngles)].slice(-MAX_TRACE_POINTS));
    const statusKind = captureMode ?? (reachedTarget ? "reached" : "moving");
    if (
      reachedTarget ||
      liveGuideLastStatusRef.current.kind !== statusKind ||
      now - liveGuideLastStatusRef.current.atMs >= 250
    ) {
      liveGuideLastStatusRef.current = { kind: statusKind, atMs: now };
      setMotionStatus(captureMode === "precision"
        ? "Adaptif kayıt · hassas hareket ayrıntıları mesafeye göre yakalanıyor."
        : captureMode === "rapid"
          ? "Adaptif kayıt · hızlı harekette saniyede en çok bir ara poz alınıyor."
          : status);
      setIkStatus(`Canlı IK · ${command.solver === "analytical" ? "analitik" : "DLS"} · hız limitli · hata ${round(command.residual, 5)} m.`);
    }
    if (reachedTarget) {
      liveGuideCommandRef.current = null;
      return;
    }
    ensureLiveGuidanceFrame();
  }

  useEffect(() => {
    liveGuideTickRef.current = tickLiveGuidance;
  });

  function teachCurrentPose() {
    const nextProgram = appendRecordedPose(program, activeState.jointAngles, true);
    if (nextProgram === program) {
      setMotionStatus(program.waypoints.length >= CUSTOM_ROBOT_MAX_WAYPOINTS
        ? `Program ${CUSTOM_ROBOT_MAX_WAYPOINTS} poz sınırında; önce yolu temizle.`
        : "Bu poz zaten son öğretilmiş pozla aynı.");
      return;
    }
    setActiveState((current) => ({ ...current, program: nextProgram }));
    const plan = nextProgram.waypoints.length >= 2
      ? planJointTrajectory(robot, nextProgram.waypoints, nextProgram.speedScale)
      : null;
    setMotionStatus(plan?.ok
      ? `Prova hazır · ${nextProgram.waypoints.length} poz, ${round(plan.trajectory.totalDurationSeconds, 2)} saniyelik hız-sınırlı hareket.`
      : plan
        ? describeTrajectoryFailure(plan) ?? "Prova tamamlanamadı."
        : "İlk poz öğretildi; robotu başka bir konuma getirip ikinci pozu kaydet.");
  }

  function toggleRecording(capturedAtMs: number) {
    if (isRecording) {
      setIsRecording(false);
      captureRef.current = null;
      const nextProgram = appendRecordedPose(program, activeState.jointAngles, true);
      if (nextProgram !== program) setActiveState((current) => ({ ...current, program: nextProgram }));
      const plan = nextProgram.waypoints.length >= 2
        ? planJointTrajectory(robot, nextProgram.waypoints, nextProgram.speedScale)
        : null;
      setMotionStatus(plan?.ok
        ? `Prova hazır · ${nextProgram.waypoints.length} poz ve ${plan.trajectory.checkedSamples} ara kontrol.`
        : plan
          ? describeTrajectoryFailure(plan) ?? "Kayıt bitti ancak prova tamamlanamadı."
          : "Kayıt bitti; oynatma için en az iki farklı poz öğret.");
      return;
    }
    const nextProgram = appendRecordedPose(program, activeState.jointAngles, true);
    setActiveState((current) => ({ ...current, program: nextProgram }));
    captureRef.current = beginAdaptiveMotionCapture(activeState.jointAngles, capturedAtMs);
    setIsRecording(true);
    setPlayback(null);
    setMotionStatus("Adaptif kayıt başladı · yavaş harekette küçük ayrıntılar, hızlı harekette yaklaşık saniyede bir ara poz saklanır.");
  }

  function updateProgramSpeed(speedScale: number) {
    setActiveState((current) => ({ ...current, program: { ...programOf(current), speedScale } }));
    const nextPlan = program.waypoints.length >= 2
      ? planJointTrajectory(robot, program.waypoints, speedScale)
      : null;
    setMotionStatus(nextPlan?.ok
      ? `Program hızı %${Math.round(speedScale * 100)}; prova RobotSpec hız limitine göre yeniden zamanlandı.`
      : nextPlan
        ? describeTrajectoryFailure(nextPlan) ?? "Program yeniden prova edilemedi."
        : `Program hızı %${Math.round(speedScale * 100)}; süre iki poz öğretildiğinde hesaplanacak.`);
  }

  function playProgram() {
    if (!trajectoryPlan?.ok) {
      setMotionStatus("Program oynatılamadı · en az iki güvenli poz öğret ve dijital provayı geçir.");
      return;
    }
    setIsRecording(false);
    setGuideEnabled(false);
    stopLiveGuidance();
    activeAnglesRef.current = [...trajectoryPlan.trajectory.segments[0].startAngles];
    setActiveState((current) => ({
      ...current,
      jointAngles: [...trajectoryPlan.trajectory.segments[0].startAngles],
    }));
    setPlayback({ trajectory: trajectoryPlan.trajectory, startedAt: performance.now() });
    setMotionStatus(`Program oynatılıyor · ${round(trajectoryPlan.trajectory.totalDurationSeconds, 2)} saniye.`);
  }

  function clearProgram() {
    setPlayback(null);
    setIsRecording(false);
    captureRef.current = null;
    setActiveState((current) => ({ ...current, program: { waypoints: [], speedScale: programOf(current).speedScale } }));
    setMotionStatus("Öğretim programı temizlendi; robot geometrisi ve mevcut poz korunuyor.");
  }

  function resetExperiment() {
    const next = stateFromDefinition(activeState.definition);
    setActiveState(next);
    setTrace([tracePoint(robot, next.jointAngles)]);
    stopLiveGuidance();
    activeAnglesRef.current = [...next.jointAngles];
    setIkStatus("Deney sıfırlandı; robot güvenli başlangıç duruşunda.");
    setGuideEnabled(false);
    setIsRecording(false);
    captureRef.current = null;
    setPlayback(null);
    setMotionStatus("Deney ve öğretim programı sıfırlandı.");
  }

  const issueFor = (field: string) => issues.some((issue) => issue.field === field || (issue.field.endsWith(".limits") && field.startsWith(issue.field.slice(0, -"limits".length))));

  function selectConsolePanel(panel: ConsolePanel) {
    const documentScrollY = window.scrollY;
    const pane = document.querySelector<HTMLElement>('[data-workbench-pane="experiment"]');
    const paneScrollTop = pane?.scrollTop ?? 0;
    setConsolePanel(panel);
    window.requestAnimationFrame(() => {
      if (pane) pane.scrollTop = paneScrollTop;
      window.scrollTo({ top: documentScrollY, behavior: "instant" });
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14" aria-label="Özel robot tasarım alanı">
      {shareNotice && (
        <div role="alert" className="mb-6 rounded-xl border border-danger-border bg-danger-surface p-4 text-sm font-semibold text-danger-ink">
          {shareNotice}
        </div>
      )}

      <div className="grid items-start gap-6 xl:h-[calc(100dvh-5rem)] xl:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.42fr)] xl:overflow-hidden">
        <form
          data-workbench-pane="design"
          className="workbench-pane lab-panel p-5 [overflow-anchor:none] sm:p-6 xl:h-full xl:overflow-y-auto xl:overscroll-contain"
          onSubmit={(event) => {
            event.preventDefault();
            applyDesign();
          }}
          noValidate
        >
          <div className="border-b border-site-border pb-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-site-accent-text">RobotSpec oluşturucu</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-site-ink">Geometriyi tanımla</h2>
            <p className="mt-2 text-sm leading-6 text-site-muted">Düzlemsel seri kol · DH a parametresi · radyana çevrilen derece limitleri</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <label className="grid gap-1.5 text-sm font-semibold text-site-ink">
              <span>Robot etiketi <span className="font-normal text-site-muted">(isteğe bağlı)</span></span>
              <input
                value={draft.name}
                maxLength={48}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, name: event.target.value }));
                  setIssues([]);
                }}
                className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-site-ink"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-site-ink">
              <span>Eklem sayısı</span>
              <select
                value={draft.joints.length}
                onChange={(event) => updateDof(Number(event.target.value))}
                className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 font-mono text-site-ink"
              >
                {Array.from({ length: CUSTOM_ROBOT_MAX_DOF - CUSTOM_ROBOT_MIN_DOF + 1 }, (_, index) => index + CUSTOM_ROBOT_MIN_DOF).map((dof) => (
                  <option key={dof} value={dof}>{dof} DOF</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-6 grid gap-4">
            <legend className="mb-1 text-sm font-bold text-site-ink">Eklem ve bağlantı parametreleri</legend>
            {draft.joints.map((joint, index) => (
              <div key={index} className="rounded-2xl border border-site-border bg-site-soft p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-xl font-bold text-site-ink">J{index + 1}</h3>
                  <span className="rounded-full border border-site-border bg-site-surface px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-site-muted">DH · a{index + 1}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-site-muted sm:col-span-2">
                    <span>J{index + 1} eklem tipi</span>
                    <select value={joint.type} onChange={() => undefined} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-sm text-site-ink">
                      <option value="revolute">Dönel · revolute</option>
                    </select>
                  </label>
                  <NumberField
                    label={`J${index + 1} bağlantı uzunluğu`}
                    value={joint.linkLength}
                    min={CUSTOM_ROBOT_MIN_LINK_LENGTH}
                    max={CUSTOM_ROBOT_MAX_LINK_LENGTH}
                    step={0.05}
                    invalid={issueFor(`joints.${index}.linkLength`)}
                    onChange={(value) => updateJoint(index, "linkLength", value)}
                  />
                  <div className="hidden sm:block" aria-hidden="true">
                    <p className="mb-1.5 text-xs font-semibold text-site-muted">Birim</p>
                    <div className="grid min-h-11 place-items-center rounded-xl border border-dashed border-site-border bg-site-surface font-mono text-xs font-semibold text-site-muted">metre</div>
                  </div>
                  <NumberField
                    label={`J${index + 1} en küçük açı`}
                    value={joint.minDegrees}
                    min={-180}
                    max={180}
                    step={1}
                    invalid={issueFor(`joints.${index}.minDegrees`)}
                    onChange={(value) => updateJoint(index, "minDegrees", value)}
                  />
                  <NumberField
                    label={`J${index + 1} en büyük açı`}
                    value={joint.maxDegrees}
                    min={-180}
                    max={180}
                    step={1}
                    invalid={issueFor(`joints.${index}.maxDegrees`)}
                    onChange={(value) => updateJoint(index, "maxDegrees", value)}
                  />
                </div>
              </div>
            ))}
          </fieldset>

          {issues.length > 0 && (
            <div role="alert" className="mt-5 rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger-ink">
              <p className="font-bold">Robot uygulanamadı</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues.map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}
              </ul>
            </div>
          )}

          <button type="submit" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-site-strong px-5 py-3 text-sm font-bold text-site-on-strong hover:opacity-90">
            Tasarımı uygula
          </button>
          <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-site-muted">{announcement}</p>
          <p className="mt-1 text-[11px] leading-5 text-site-subtle">
            {storageAvailable === false ? "Kalıcı kayıt kullanılamıyor." : "Kayıt yalnız bu tarayıcıdaki localStorage alanında tutulur; sunucuya gönderilmez."}
          </p>
        </form>

        <section
          aria-label="Robot deneyi"
          data-workbench-pane="experiment"
          className="workbench-pane lab-panel overflow-hidden p-4 [overflow-anchor:none] sm:p-6 xl:h-full xl:overflow-y-auto xl:overscroll-contain"
        >
          <div className="flex flex-col gap-4 border-b border-site-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-site-accent-text">FK / IK / TCP izi</p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-site-ink">{robot.displayName}</h2>
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-site-muted">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${poseAnalysis.valid ? "bg-teal-600" : "bg-red-600"}`} />
                {poseAnalysis.valid ? "Poz ön kontrolden geçti" : "Poz fiziksel ön kontrolden geçmedi"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-site-border bg-site-border text-center font-mono text-[10px] uppercase tracking-wider text-site-muted">
              <div className="bg-site-surface px-3 py-2"><strong className="block text-sm text-site-ink">{robot.joints.length}</strong>DOF</div>
              <div className="bg-site-surface px-3 py-2"><strong className="block text-sm text-site-ink">{round(reach, 2)} m</strong>erişim</div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
            <div>
              <PlanarRobotDiagram
                robot={robot}
                angles={activeState.jointAngles}
                target={activeState.target}
                trace={trace}
                taughtPath={taughtPath}
                taughtPoints={taughtPoints}
                guideEnabled={guideEnabled && !playback}
                onGuideTarget={guideTcp}
              />
              <p className="sr-only">
                Robotun uç noktası x {round(endEffector.x)} metre, y {round(endEffector.y)} metre. Hedef x {round(activeState.target.x)} metre, y {round(activeState.target.y)} metre.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs text-site-muted">
                <p className="rounded-xl border border-site-border bg-site-soft p-3"><span className="block text-[10px] uppercase tracking-wider">TCP · x</span><strong className="mt-1 block text-site-ink">{round(endEffector.x)} m</strong></p>
                <p className="rounded-xl border border-site-border bg-site-soft p-3"><span className="block text-[10px] uppercase tracking-wider">TCP · y</span><strong className="mt-1 block text-site-ink">{round(endEffector.y)} m</strong></p>
              </div>
            </div>

            <div className="grid content-start gap-4">
              <Tabs
                items={CONSOLE_PANELS.map((panel): TabItem => ({
                  id: panel.id,
                  label: panel.label,
                  shortLabel: panel.shortLabel,
                  badge:
                    panel.id === "teach" && (isRecording || program.waypoints.length > 0) ? (
                      <span
                        className={`ml-1.5 inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                          consolePanel === panel.id ? "bg-white/20" : "bg-poster-purple/15 text-poster-purple-text"
                        }`}
                      >
                        {isRecording ? "REC" : program.waypoints.length}
                      </span>
                    ) : undefined,
                }))}
                activeId={consolePanel}
                onSelect={(id) => selectConsolePanel(id as ConsolePanel)}
                ariaLabel="Deney kumandaları"
                idPrefix="console"
                className="grid grid-cols-3 gap-1 rounded-2xl border border-site-border bg-site-soft p-1"
                tabClassName={(active) =>
                  `relative min-h-12 rounded-xl px-2 py-2 text-xs font-bold transition-colors sm:px-3 ${
                    active
                      ? "bg-site-strong text-site-on-strong shadow-sm"
                      : "text-site-muted hover:bg-site-surface hover:text-site-ink"
                  }`
                }
              />

              {consolePanel === "joints" && (
                <div
                  id="console-panel-joints"
                  role="tabpanel"
                  aria-labelledby="console-tab-joints"
                  aria-label="Eklemleri sür"
                  className="rounded-2xl border border-site-border bg-site-surface p-4"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-site-accent-text">İleri kinematik</p>
                      <h3 className="mt-1 font-heading text-2xl font-bold text-site-ink">Eklemleri doğrudan sür</h3>
                    </div>
                    <span className="rounded-full border border-site-border bg-site-soft px-2.5 py-1 font-mono text-[10px] text-site-muted">limitli</span>
                  </div>
                  <fieldset className="grid gap-3">
                    <legend className="sr-only">Eklem açıları</legend>
                    {robot.joints.map((joint, index) => {
                      const degrees = round((activeState.jointAngles[index] * 180) / Math.PI, 1);
                      return (
                        <label key={index} className="grid gap-1 text-xs font-semibold text-site-muted">
                          <span className="flex justify-between gap-3"><span>J{index + 1} açısı</span><output className="font-mono text-site-ink">{degrees}°</output></span>
                          <input
                            type="range"
                            aria-label={`J${index + 1} açısı`}
                            value={degrees}
                            min={round((joint.limits.min * 180) / Math.PI, 6)}
                            max={round((joint.limits.max * 180) / Math.PI, 6)}
                            step={0.1}
                            onChange={(event) => setJointAngle(index, Number(event.target.value), event.timeStamp)}
                            className="min-h-11 w-full accent-teal-600"
                          />
                        </label>
                      );
                    })}
                  </fieldset>
                </div>
              )}

              {consolePanel === "target" && (
                <div
                  id="console-panel-target"
                  role="tabpanel"
                  aria-labelledby="console-tab-target"
                  aria-label="Hedefe git"
                  className="rounded-2xl border border-site-border bg-site-surface p-4"
                >
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">Ters kinematik</p>
                  <h3 className="mt-1 font-heading text-2xl font-bold text-site-ink">TCP hedefini seç</h3>
                  <fieldset className="mt-4 grid gap-3">
                    <legend className="sr-only">Ters kinematik hedefi</legend>
                    {(["x", "y"] as const).map((axis) => (
                      <label key={axis} className="grid gap-1 text-xs font-semibold text-site-muted">
                        <span className="flex justify-between gap-3"><span>Hedef {axis.toUpperCase()}</span><output className="font-mono text-site-ink">{round(activeState.target[axis], 2)} m</output></span>
                        <input
                          type="range"
                          aria-label={`Hedef ${axis.toUpperCase()}`}
                          value={activeState.target[axis]}
                          min={round(-reach, 2)}
                          max={round(reach, 2)}
                          step={0.01}
                          onChange={(event) => setTarget(axis, Number(event.target.value))}
                          className="min-h-11 w-full accent-rose-500"
                        />
                      </label>
                    ))}
                    <button type="button" onClick={(event) => solveTarget(event.timeStamp)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
                      Hedefe çöz
                    </button>
                  </fieldset>
                  <p role="status" aria-live="polite" className="mt-3 h-20 overflow-y-auto rounded-xl border border-site-border bg-site-soft p-3 text-xs leading-5 text-site-muted [overflow-anchor:none]">{ikStatus}</p>
                </div>
              )}

              {consolePanel === "teach" && (
                <div
                  id="console-panel-teach"
                  role="tabpanel"
                  aria-labelledby="console-tab-teach"
                  aria-label="Hareket öğret"
                  className="grid gap-4 rounded-2xl border border-poster-purple/35 bg-poster-purple/5 p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-poster-purple-text">Teach-by-demonstration</p>
                      {isRecording && <span className="rounded-full bg-red-600 px-2.5 py-1 font-mono text-[10px] font-bold text-white">● KAYIT</span>}
                    </div>
                    <h3 className="mt-1 font-heading text-2xl font-bold text-site-ink">Hareketi öğret</h3>
                    <p className="mt-1 text-xs leading-5 text-site-muted">Yavaş harekette küçük ayrıntılar mesafeye göre, hızlı harekette yaklaşık saniyede bir örnek alınır. Kayıt olay sayısına bağlı değildir.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={guideEnabled}
                      disabled={Boolean(playback)}
                      onClick={() => {
                        const nextGuideEnabled = !guideEnabled;
                        guideEnabledRef.current = nextGuideEnabled;
                        if (!nextGuideEnabled) stopLiveGuidance();
                        setGuideEnabled(nextGuideEnabled);
                        setMotionStatus(guideEnabled
                          ? "TCP yönlendirme kapatıldı."
                          : "TCP yönlendirme açık · sahneye dokunup sürükleyerek canlı IK çalıştır.");
                      }}
                      className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guideEnabled ? "Yönlendirmeyi kapat" : "TCP’yi elle yönlendir"}
                    </button>
                    <button type="button" onClick={teachCurrentPose} disabled={Boolean(playback)} className="min-h-11 rounded-xl bg-poster-purple px-3 text-xs font-bold text-poster-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                      Bu pozu öğret
                    </button>
                    <button type="button" aria-pressed={isRecording} onClick={(event) => toggleRecording(event.timeStamp)} disabled={Boolean(playback)} className="min-h-11 rounded-xl border border-poster-purple/40 bg-poster-purple/10 px-3 text-xs font-bold text-poster-purple-text hover:bg-poster-purple/15 disabled:cursor-not-allowed disabled:opacity-50">
                      {isRecording ? "Kaydı bitir" : "Yolu kaydet"}
                    </button>
                    <button type="button" onClick={clearProgram} disabled={program.waypoints.length === 0} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft disabled:cursor-not-allowed disabled:opacity-50">
                      Programı temizle
                    </button>
                  </div>

                  <label className="grid gap-1 text-xs font-semibold text-site-muted">
                    <span className="flex justify-between gap-3"><span>Prova hızı</span><output className="font-mono text-site-ink">%{Math.round(program.speedScale * 100)}</output></span>
                    <input type="range" aria-label="Program hızı" value={program.speedScale} min="0.05" max="1" step="0.05" onChange={(event) => updateProgramSpeed(Number(event.currentTarget.value))} className="min-h-11 w-full accent-poster-purple" />
                  </label>

                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-site-border bg-site-border font-mono text-[10px] text-site-muted">
                    <p aria-label={`${program.waypoints.length} öğretilmiş poz`} className="bg-site-surface p-3"><strong className="block text-base text-site-ink">{program.waypoints.length}</strong>temsilî poz</p>
                    <p className="bg-site-surface p-3"><strong className="block text-base text-site-ink">{trajectoryPlan?.ok ? `${round(trajectoryPlan.trajectory.totalDurationSeconds, 2)} s` : "—"}</strong>zamanlı prova</p>
                    <p className="bg-site-surface p-3"><strong className="block text-base text-site-ink">{trajectoryPlan?.ok ? trajectoryPlan.trajectory.checkedSamples : "—"}</strong>ara kontrol</p>
                    <p className="bg-site-surface p-3"><strong className="block text-base text-site-ink">{trajectoryPlan?.ok ? `${round(trajectoryPlan.trajectory.tcpTravelMeters, 2)} m` : "—"}</strong>TCP yolu</p>
                  </div>

                  <button type="button" onClick={playProgram} disabled={!trajectoryPlan?.ok || Boolean(playback)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-site-strong px-4 py-3 text-sm font-bold text-site-on-strong hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
                    {playback ? "Program oynatılıyor…" : "Programı oynat"}
                  </button>
                </div>
              )}

              <p data-motion-status role="status" aria-live="polite" className="h-24 overflow-y-auto rounded-xl border border-poster-purple/35 bg-poster-purple/5 p-3 text-xs leading-5 text-site-ink [overflow-anchor:none]">{motionStatus}</p>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTrace([tracePoint(robot, activeState.jointAngles)])} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft">İzi temizle</button>
                <button type="button" onClick={resetExperiment} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft">Deneyi sıfırla</button>
              </div>
            </div>
          </div>

          <aside className="mt-5 grid gap-2 rounded-2xl border border-warning-border bg-warning-surface p-4 text-warning-ink sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Gerçeklik kapsamı</p>
            <div>
              <p className="text-xs font-bold">Kinematik, eklem limitleri, azami hız ve merkez çizgisi öz-çarpışması denetlenir.</p>
              <p className="mt-1 text-xs leading-5">Tork, yerçekimi, yük, ivme/jerk sınırı ve denetleyici gecikmesi modellenmiyor. Bağlantı kalınlığı, motor gövdesi ve çevre engelleri de bu düzlemsel V1’in dışında; gerçek robota doğrudan komut üretmez.</p>
            </div>
          </aside>

          <ExperimentShareButton
            seviye="universite"
            createShareUrl={() => createLabShareUrl(activeState)}
            buttonLabel="Bu robotu paylaş"
            linkLabel="Paylaşılan robotu aç"
            idleDescription="Bağlantı geçerli RobotSpec'i, eklem duruşunu, IK hedefini ve öğretilmiş hareket programını taşır; hesap gerektirmez."
          />
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["01 / Sınır", "1–6 DOF", "Bu aralık mobil kontrolleri okunur tutar ve mevcut tarayıcı motorunun doğrulanmış üst sınırıyla eşleşir."],
          ["02 / Model", "Revolute v1", "Her eklemde α, d ve θ ofseti sıfır; kullanıcı DH a uzunluğunu ve mekanik açı aralığını belirler."],
          ["03 / Öğretim", "Göster ve prova et", "TCP’yi elle yönlendir, pozları kaydet; hız-sınırlı eklem hareketinin oluşturduğu TCP yolunu oynatmadan önce gör."],
          ["04 / Gizlilik", "Yerel + URL", "Robot ve öğretilmiş program yerel depoda kalır. Paylaşım verisi URL fragment’ındadır; sunucuya gitmez."],
        ].map(([eyebrow, title, body]) => (
          <article key={eyebrow} className="rounded-2xl border border-site-border bg-site-surface p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-site-accent-text">{eyebrow}</p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-site-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-site-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
