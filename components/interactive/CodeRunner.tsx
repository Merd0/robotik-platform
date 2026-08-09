"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { getRobotById } from "@/lib/robotics/robots";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import type { PyodideWorkerRequest, PyodideWorkerResponse } from "@/lib/workers/pyodideWorker";
import { MAX_CODE_RUNTIME_MS } from "@/lib/workers/executionLimits";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { evaluateCodeLab } from "@/lib/codeLab";
import { toolOrientationOf } from "@/components/scene/robotFrames";

interface CodeRunnerProps {
  /** Editörde başlangıçta görünen kod. */
  initialCode: string;
  /** Verilirse, Python'daki `robot.eklem_ac(index, derece)` çağrıları bu robotu sürer. */
  robot?: string;
  theme?: "ortaokul" | "lise" | "universite";
  /** Ölçülebilir laboratuvar görevi; yalnız istem değil, çalıştırılan çıktıyla doğrulanır. */
  taskTitle?: string;
  expectedOutput?: string;
  expectedFinalDegrees?: number[];
  toleranceDegrees?: number;
  skillId?: string;
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/70",
    button: "bg-ortaokul-ink text-ortaokul-surface",
    outline: "border-ortaokul-ink/20",
  },
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    button: "bg-lise-ink text-lise-surface",
    outline: "border-lise-ink/20",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    button: "bg-universite-ink text-universite-surface",
    outline: "border-universite-ink/20",
  },
} as const;

type RunState = "hazir" | "yukleniyor" | "calisiyor" | "bitti";

const roundPose = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

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

/**
 * Ders içine gömülen etkileşimli sahne: gerçek Python kodu, Pyodide
 * (WebAssembly CPython) ile Web Worker içinde çalışır — ana thread'i
 * kilitlemez, "Durdur" worker'ı sonlandırır (bkz. docs/08-guvenlik-
 * sertlestirme.md "Çalışma süresi sınırı"). Pyodide kendi alan adımızdan
 * servis edilir (public/pyodide/, bkz. scripts/copy-pyodide-assets.mjs).
 */
export function CodeRunner({
  initialCode,
  robot: robotId,
  theme = "lise",
  taskTitle,
  expectedOutput,
  expectedFinalDegrees,
  toleranceDegrees = 0.5,
  skillId = "python-robot-programming",
}: CodeRunnerProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const robot = robotId ? getRobotById(robotId) : null;
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
  const [traceIndex, setTraceIndex] = useState(0);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const workerRef = useRef<Worker | null>(null);
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

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function ensureWorker(): Worker {
    if (!workerRef.current) {
      // type: "module" zorunlu — pyodide.mjs klasik worker'larda çalışmayı
      // reddediyor (bkz. scripts/build-worker.mjs üstündeki not).
      const worker = new Worker("/workers/pyodide-worker.js", { type: "module" });
      // Worker top-level'da senkron bir hata atarsa "message" değil "error"
      // olayı gelir — sessizce yutulmasın diye logluyoruz.
      worker.addEventListener("error", (event) => {
        console.error("[CodeRunner] worker hatası:", event.message);
      });
      workerRef.current = worker;
    }
    return workerRef.current;
  }

  function handleRun() {
    if (state === "yukleniyor" || state === "calisiyor") return;
    setOutput("");
    setError(null);

    const firstRun = !workerRef.current;
    const worker = ensureWorker();
    setState(firstRun ? "yukleniyor" : "calisiyor");

    const requestId = `${Date.now()}-${Math.random()}`;

    function onMessage(event: MessageEvent<PyodideWorkerResponse>) {
      if (event.data.requestId !== requestId) return;
      worker.removeEventListener("message", onMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      const warnings = [
        event.data.limits.outputTruncated ? "[çıktı güvenlik kotasında kesildi]" : null,
        event.data.limits.traceTruncated ? "[eklem izi 500 örnekte kesildi]" : null,
      ]
        .filter(Boolean)
        .join("\n");
      setOutput([event.data.stdout, warnings].filter(Boolean).join("\n"));
      setError(event.data.error);
      setJointTrace(event.data.jointTrace);
      setTraceIndex(Math.max(0, event.data.jointTrace.length - 1));
      if (robot && event.data.jointTrace.length > 0) {
        setJointAngles(event.data.jointTrace[event.data.jointTrace.length - 1]);
        setActiveJointIndex(
          changedJointIndex(event.data.jointTrace, event.data.jointTrace.length - 1, robot.joints.length),
        );
      }
      const { outputMatches, poseMatches, hasAutomaticTest, passed } = evaluateCodeLab(
        { expectedOutput, expectedFinalDegrees, toleranceDegrees },
        event.data,
      );
      setTestPassed(hasAutomaticTest ? passed : null);
      record({
        skillId,
        stage: hasAutomaticTest ? "assessed" : "observed",
        result: !event.data.error && (!hasAutomaticTest || passed) ? "success" : "retry",
        metrics: { outputMatches, poseMatches, traceSteps: event.data.jointTrace.length },
      });
      setState("bitti");
    }
    worker.addEventListener("message", onMessage);
    timeoutRef.current = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      workerRef.current = null;
      timeoutRef.current = null;
      setError(`Kod ${MAX_CODE_RUNTIME_MS / 1000} saniyelik çalışma sınırını aştı.`);
      setOutput("[worker süre aşımı nedeniyle sonlandırıldı]");
      setState("bitti");
    }, MAX_CODE_RUNTIME_MS);

    const request: PyodideWorkerRequest = {
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
    workerRef.current?.terminate();
    workerRef.current = null;
    setState("hazir");
    setOutput((prev) => prev + "\n[durduruldu]");
  }

  function handleReset() {
    setCode(initialCode);
    setOutput("");
    setError(null);
    setJointTrace([]);
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

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {taskTitle && <div className={`rounded-lg border ${t.outline} ${t.bg} p-3 text-sm ${t.ink}`}><span className="font-bold">Otomatik görev:</span> {taskTitle}</div>}
      {robot && (
        <SahneAlani className={`aspect-video w-full overflow-hidden rounded-lg ${t.bg}`}>
          <RobotArm robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} />
        </SahneAlani>
      )}
      {toolPose?.orientation && (
        <p className={`font-mono text-xs ${t.inkMuted}`} data-testid="code-tool-pose">
          TCP: x {roundPose(toolPose.position.x)} · y {roundPose(toolPose.position.y)} · z {roundPose(toolPose.position.z)} m
          {" · "}Alet RPY: R {roundPose(toolPose.orientation.roll)}° · P {roundPose(toolPose.orientation.pitch)}° · Y {roundPose(toolPose.orientation.yaw)}°
        </p>
      )}

      <label htmlFor={editorId} className={`text-sm font-medium ${t.ink}`}>
        Python kodu
      </label>
      <textarea
        id={editorId}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        rows={10}
        className={`w-full rounded-lg border ${t.outline} ${t.bg} p-3 font-mono text-sm ${t.ink}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className={`h-11 rounded-md px-4 ${t.button} disabled:opacity-50`}
        >
          {state === "yukleniyor" ? "Python yükleniyor…" : state === "calisiyor" ? "Çalışıyor…" : "Çalıştır"}
        </button>
        {running && (
          <button type="button" onClick={handleStop} className={`h-11 rounded-md border ${t.outline} px-4`}>
            Durdur
          </button>
        )}
        <button type="button" onClick={handleReset} className={`h-11 rounded-md border ${t.outline} px-4`}>
          Sıfırla
        </button>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true">
        {output || error ? (
          <pre className={`whitespace-pre-wrap rounded-lg border ${t.outline} ${t.bg} p-3 font-mono text-sm ${t.ink}`}>
            {output}
            {error && <span className="text-red-600">{"\n" + error}</span>}
          </pre>
        ) : (
          <span className="sr-only">
            {state === "yukleniyor"
              ? "Python yükleniyor."
              : state === "calisiyor"
                ? "Kod çalışıyor."
                : state === "bitti"
                  ? "Kod çalışması tamamlandı."
                  : "Kod çalıştırılmaya hazır."}
          </span>
        )}
      </div>

      {jointTrace.length > 0 && robot && <div className={`rounded-lg border ${t.outline} ${t.bg} p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className={`font-semibold ${t.ink}`}>Çalışma izi · komut {traceIndex + 1}/{jointTrace.length}</span>
          <span className={`font-mono ${t.inkMuted}`}>{jointAngles.map((angle, index) => `θ${index + 1}=${(angle * 180 / Math.PI).toFixed(1)}°`).join(" · ")}</span>
        </div>
        <input aria-label="Çalışma izi adımı" type="range" min="0" max={jointTrace.length - 1} value={traceIndex} onChange={(event) => showTraceStep(Number(event.target.value))} className="mt-2 h-11 w-full" />
        <div className="flex gap-2"><button type="button" onClick={() => showTraceStep(traceIndex - 1)} className={`min-h-11 flex-1 rounded-md border ${t.outline}`}>Geri</button><button type="button" onClick={() => showTraceStep(traceIndex + 1)} className={`min-h-11 flex-1 rounded-md border ${t.outline}`}>İleri</button></div>
      </div>}

      {testPassed !== null && <p className={`rounded-lg border p-3 text-sm font-semibold ${testPassed ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`} role="status">{testPassed ? "Otomatik test geçti. Çıktı ve robot duruşu görevle uyuşuyor." : "Otomatik test henüz geçmedi. Çıktıyı veya son eklem açılarını görevle karşılaştır."}</p>}
    </div>
  );
}
