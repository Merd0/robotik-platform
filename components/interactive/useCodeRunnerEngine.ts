import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getRobotById } from "@/lib/robotics/robots";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import { activeTraceLine } from "@/lib/pythonCodeEditor";
import type {
  PyodideWorkerRequest,
  PyodideWorkerResponse,
  PyodideWorkerResult,
} from "@/lib/workers/pyodideWorker";
import { MAX_CODE_RUNTIME_MS } from "@/lib/workers/executionLimits";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { evaluateCodeLab } from "@/lib/codeLab";
import { toolOrientationOf } from "@/components/scene/robotFrames";
import { createLabShareUrl, useSharedLabState } from "@/components/interactive/LabChallengeUi";
import { deriveRobotState, type RobotState } from "@/lib/robotics/robotState";

/**
 * CodeRunner'ın (Hat D derslerinde kullanılan, tek-parça dikey yerleşim)
 * durum/worker mantığı — sunumdan (JSX) ayrıldı ki Kod Akademisi'nin
 * masaüstünde yan yana/mobilde sekmeli yerleşimi AYNI motoru, farklı bir
 * dizilimle kullanabilsin. Yeni matematik veya worker protokolü yok; bu saf
 * bir "extract hook" — `CodeRunner.tsx`'in çıktısı bu değişiklikten önce ve
 * sonra birebir aynı (bkz. docs/durum-codex.md "Kod Akademisi — mimari
 * teklif" §5, "gerçek gereksinim mevcut CodeRunner kullanan Hat D
 * derslerine de retrofit edilmeli, ama şimdi yalnız burada").
 */

export interface CodeRunnerEngineProps {
  initialCode: string;
  robot?: string;
  taskTitle?: string;
  expectedOutput?: string;
  expectedFinalDegrees?: number[];
  toleranceDegrees?: number;
  /** bkz. lib/codeLab.ts CodeLabExpectation — opsiyonel, verilmezse davranış değişmez. */
  maxTraceSteps?: number;
  skillId?: string;
}

export type RunState = "hazir" | "yukleniyor" | "calisiyor" | "bitti";

export function roundPose(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Sekmeli/dikey her iki yerleşimde de aynı durum metnini üretir — CodeRunner ve KodAkademisiCodeLab paylaşır. */
export function codeRunnerStatusText(state: RunState, testPassed: boolean | null): string {
  if (state === "yukleniyor") return "Python yükleniyor…";
  if (state === "calisiyor") return "Çalışıyor…";
  if (state === "bitti") {
    if (testPassed === true) return "Tamamlandı ✓";
    if (testPassed === false) return "Tekrar dene";
    return "Tamamlandı";
  }
  return "Hazır";
}

function changedJointIndex(trace: number[][], traceIndex: number, jointCount: number): number {
  const current = trace[traceIndex];
  if (!current) return Math.max(0, jointCount - 1);
  const previous = traceIndex > 0 ? trace[traceIndex - 1] : Array.from({ length: jointCount }, () => 0);

  return current.reduce(
    (largest, angle, index) =>
      Math.abs(angle - (previous[index] ?? 0)) > Math.abs(current[largest] - (previous[largest] ?? 0))
        ? index
        : largest,
    0,
  );
}

export function useCodeRunnerEngine({
  initialCode,
  robot: robotId,
  expectedOutput,
  expectedFinalDegrees,
  toleranceDegrees = 0.5,
  maxTraceSteps,
  skillId = "python-robot-programming",
}: CodeRunnerEngineProps) {
  const record = useEvidenceRecorder();
  const robot: RobotSpec | null = robotId ? getRobotById(robotId) : null;
  const editorId = useId();

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RunState>("hazir");
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot?.joints.map(() => 0) ?? []);
  const [activeJointIndex, setActiveJointIndex] = useState(() =>
    robot?.joints.length === 6 ? 5 : 0,
  );
  const [jointTrace, setJointTrace] = useState<number[][]>([]);
  const [jointTraceLines, setJointTraceLines] = useState<(number | null)[]>([]);
  const [traceIndex, setTraceIndex] = useState(0);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<Promise<Worker> | null>(null);
  const workerReadyRejectRef = useRef<((reason?: unknown) => void) | null>(null);
  const workerIsReadyRef = useRef(false);
  const activeRequestIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolPose = useMemo(() => {
    if (!robot) return null;
    const result = forwardKinematics(robot, jointAngles);
    const transform = result.jointTransforms[result.jointTransforms.length - 1];
    return {
      position: result.endEffector,
      orientation: robot.joints.length === 6 ? toolOrientationOf(transform) : null,
    };
  }, [jointAngles, robot]);

  useSharedLabState("code-runner", (shared) => {
    if (shared.robotId !== (robot?.id ?? null)) return;
    setCode(shared.code);
    setOutput("");
    setError(null);
    setJointTrace([]);
    setJointTraceLines([]);
    setTraceIndex(0);
    setTestPassed(null);
  });

  useEffect(() => {
    return () => {
      const rejectReady = workerReadyRejectRef.current;
      activeRequestIdRef.current = null;
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      rejectReady?.(new Error("CodeRunner kapatıldı."));
    };
  }, []);

  function clearWorkerReferences() {
    workerRef.current = null;
    workerReadyRef.current = null;
    workerReadyRejectRef.current = null;
    workerIsReadyRef.current = false;
  }

  function ensureWorker(): Promise<Worker> {
    if (workerReadyRef.current) return workerReadyRef.current;

    // type: "module" zorunlu — pyodide.mjs klasik worker'larda çalışmayı
    // reddediyor (bkz. scripts/build-worker.mjs üstündeki not).
    const worker = new Worker("/workers/pyodide-worker.js", { type: "module" });
    workerRef.current = worker;
    workerReadyRef.current = new Promise<Worker>((resolve, reject) => {
      workerReadyRejectRef.current = reject;
      function finish() {
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        workerReadyRejectRef.current = null;
      }

      function onMessage(event: MessageEvent<PyodideWorkerResponse>) {
        if (event.data.type === "ready") {
          finish();
          workerIsReadyRef.current = true;
          resolve(worker);
        } else if (event.data.type === "load-error") {
          finish();
          worker.terminate();
          clearWorkerReferences();
          reject(new Error(event.data.error));
        }
      }

      function onError(event: ErrorEvent) {
        finish();
        worker.terminate();
        clearWorkerReferences();
        reject(new Error(event.message || "Python worker başlatılamadı."));
      }

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
    });
    return workerReadyRef.current;
  }

  async function handleRun() {
    if (state === "yukleniyor" || state === "calisiyor") return;
    setOutput("");
    setError(null);

    const requestId = `${Date.now()}-${Math.random()}`;
    activeRequestIdRef.current = requestId;
    if (!workerIsReadyRef.current) setState("yukleniyor");

    let worker: Worker;
    try {
      worker = await ensureWorker();
    } catch (workerError) {
      if (activeRequestIdRef.current !== requestId) return;
      activeRequestIdRef.current = null;
      setError(
        `Python ortamı hazırlanamadı: ${workerError instanceof Error ? workerError.message : String(workerError)}`,
      );
      setState("bitti");
      return;
    }

    if (activeRequestIdRef.current !== requestId) return;
    setState("calisiyor");

    function onMessage(event: MessageEvent<PyodideWorkerResponse>) {
      if (event.data.type !== "result" || event.data.requestId !== requestId) return;
      worker.removeEventListener("message", onMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      activeRequestIdRef.current = null;
      const result: PyodideWorkerResult = event.data;
      const warnings = [
        result.limits.outputTruncated ? "[çıktı güvenlik kotasında kesildi]" : null,
        result.limits.traceTruncated ? "[eklem izi 500 örnekte kesildi]" : null,
      ]
        .filter(Boolean)
        .join("\n");
      setOutput([result.stdout, warnings].filter(Boolean).join("\n"));
      setError(result.error);
      setJointTrace(result.jointTrace);
      setJointTraceLines(result.jointTraceLines);
      setTraceIndex(Math.max(0, result.jointTrace.length - 1));
      if (robot && result.jointTrace.length > 0) {
        setJointAngles(result.jointTrace[result.jointTrace.length - 1]);
        setActiveJointIndex(
          changedJointIndex(result.jointTrace, result.jointTrace.length - 1, robot.joints.length),
        );
      }
      const { outputMatches, poseMatches, hasAutomaticTest, passed } = evaluateCodeLab(
        { expectedOutput, expectedFinalDegrees, toleranceDegrees, maxTraceSteps },
        result,
      );
      setTestPassed(hasAutomaticTest ? passed : null);
      record({
        skillId,
        stage: hasAutomaticTest ? "assessed" : "observed",
        result: !result.error && (!hasAutomaticTest || passed) ? "success" : "retry",
        metrics: { outputMatches, poseMatches, traceSteps: result.jointTrace.length },
      });
      setState("bitti");
    }
    worker.addEventListener("message", onMessage);
    timeoutRef.current = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      clearWorkerReferences();
      activeRequestIdRef.current = null;
      timeoutRef.current = null;
      setError(`Kod ${MAX_CODE_RUNTIME_MS / 1000} saniyelik çalışma sınırını aştı.`);
      setOutput("[worker süre aşımı nedeniyle sonlandırıldı]");
      setState("bitti");
    }, MAX_CODE_RUNTIME_MS);

    const request: PyodideWorkerRequest = {
      type: "run",
      requestId,
      code,
      jointCount: robot?.joints.length,
      robotSpec: robot ?? undefined,
    };
    worker.postMessage(request);
  }

  function handleStop() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    const rejectReady = workerReadyRejectRef.current;
    workerRef.current?.terminate();
    clearWorkerReferences();
    activeRequestIdRef.current = null;
    rejectReady?.(new Error("Python ortamı hazırlanırken durduruldu."));
    setState("hazir");
    setOutput((prev) => prev + "\n[durduruldu]");
  }

  function handleReset() {
    setCode(initialCode);
    setOutput("");
    setError(null);
    setJointTrace([]);
    setJointTraceLines([]);
    setTraceIndex(0);
    setTestPassed(null);
    if (robot) {
      setJointAngles(robot.joints.map(() => 0));
      setActiveJointIndex(robot.joints.length === 6 ? 5 : 0);
    }
  }

  function showTraceStep(index: number) {
    if (!robot || jointTrace.length === 0) return;
    const bounded = Math.max(0, Math.min(jointTrace.length - 1, index));
    setTraceIndex(bounded);
    setJointAngles(jointTrace[bounded]);
    setActiveJointIndex(changedJointIndex(jointTrace, bounded, robot.joints.length));
  }

  const running = state === "yukleniyor" || state === "calisiyor";
  const currentTraceLine = activeTraceLine(error, jointTraceLines, traceIndex);
  const robotState: RobotState = deriveRobotState({
    busy: running,
    phase: state === "yukleniyor" ? "planning" : "moving",
    error: error !== null,
    completed: state === "bitti" && testPassed !== false,
  });

  return {
    editorId,
    robot,
    code,
    setCode,
    output,
    error,
    state,
    running,
    robotState,
    jointAngles,
    activeJointIndex,
    jointTrace,
    traceIndex,
    currentTraceLine,
    testPassed,
    toolPose,
    handleRun,
    handleStop,
    handleReset,
    showTraceStep,
    createShareUrl: () => createLabShareUrl({ kind: "code-runner", version: 1, robotId: robot?.id ?? null, code }),
  };
}

export type CodeRunnerEngine = ReturnType<typeof useCodeRunnerEngine>;
