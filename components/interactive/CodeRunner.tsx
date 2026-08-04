"use client";

import { useEffect, useRef, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { getRobotById } from "@/lib/robotics/robots";
import type { PyodideWorkerRequest, PyodideWorkerResponse } from "@/lib/workers/pyodideWorker";

interface CodeRunnerProps {
  /** Editörde başlangıçta görünen kod. */
  initialCode: string;
  /** Verilirse, Python'daki `robot.eklem_ac(index, derece)` çağrıları bu robotu sürer. */
  robot?: string;
  theme?: "ortaokul" | "lise" | "universite";
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

/**
 * Ders içine gömülen etkileşimli sahne: gerçek Python kodu, Pyodide
 * (WebAssembly CPython) ile Web Worker içinde çalışır — ana thread'i
 * kilitlemez, "Durdur" worker'ı sonlandırır (bkz. docs/08-guvenlik-
 * sertlestirme.md "Çalışma süresi sınırı"). Pyodide kendi alan adımızdan
 * servis edilir (public/pyodide/, bkz. scripts/copy-pyodide-assets.mjs).
 */
export function CodeRunner({ initialCode, robot: robotId, theme = "lise" }: CodeRunnerProps) {
  const t = THEME[theme];
  const robot = robotId ? getRobotById(robotId) : null;

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RunState>("hazir");
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot?.joints.map(() => 0) ?? []);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
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
      setOutput(event.data.stdout);
      setError(event.data.error);
      if (robot && event.data.jointTrace.length > 0) {
        setJointAngles(event.data.jointTrace[event.data.jointTrace.length - 1]);
      }
      setState("bitti");
    }
    worker.addEventListener("message", onMessage);

    const request: PyodideWorkerRequest = {
      requestId,
      code,
      jointCount: robot?.joints.length,
      robotSpec: robot ?? undefined,
    };
    worker.postMessage(request);
  }

  function handleStop() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState("hazir");
    setOutput((prev) => prev + "\n[durduruldu]");
  }

  function handleReset() {
    setCode(initialCode);
    setOutput("");
    setError(null);
    if (robot) setJointAngles(robot.joints.map(() => 0));
  }

  const running = state === "yukleniyor" || state === "calisiyor";

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {robot && (
        <SahneAlani className={`aspect-video w-full overflow-hidden rounded-lg ${t.bg}`}>
          <RobotArm robot={robot} jointAngles={jointAngles} />
        </SahneAlani>
      )}

      <textarea
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

      {(output || error) && (
        <pre className={`whitespace-pre-wrap rounded-lg border ${t.outline} ${t.bg} p-3 font-mono text-sm ${t.ink}`}>
          {output}
          {error && <span className="text-red-600">{"\n" + error}</span>}
        </pre>
      )}
    </div>
  );
}
