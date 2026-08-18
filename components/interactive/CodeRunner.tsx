"use client";

import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { ExperimentShareButton } from "@/components/interactive/LabChallengeUi";
import { roundPose, useCodeRunnerEngine } from "@/components/interactive/useCodeRunnerEngine";

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

/**
 * Ders içine gömülen etkileşimli sahne: gerçek Python kodu, Pyodide
 * (WebAssembly CPython) ile Web Worker içinde çalışır — ana thread'i
 * kilitlemez, "Durdur" worker'ı sonlandırır (bkz. docs/08-guvenlik-
 * sertlestirme.md "Çalışma süresi sınırı"). Pyodide kendi alan adımızdan
 * servis edilir (public/pyodide/, bkz. scripts/copy-pyodide-assets.mjs).
 *
 * Durum/worker mantığı `useCodeRunnerEngine`'de yaşıyor (bkz. o dosyanın
 * başlığı) — bu bileşen yalnız TEK PARÇA dikey yerleşimi çizer. Kod
 * Akademisi'nin yan yana/sekmeli yerleşimi aynı hook'u kullanan ayrı bir
 * bileşendir (`components/kod-akademisi/KodAkademisiCodeLab.tsx`).
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
  const engine = useCodeRunnerEngine({
    initialCode,
    robot: robotId,
    expectedOutput,
    expectedFinalDegrees,
    toleranceDegrees,
    skillId,
  });
  const {
    editorId,
    robot,
    code,
    setCode,
    output,
    error,
    state,
    running,
    jointAngles,
    activeJointIndex,
    jointTrace,
    traceIndex,
    testPassed,
    toolPose,
    handleRun,
    handleStop,
    handleReset,
    showTraceStep,
    createShareUrl,
  } = engine;

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

      <ExperimentShareButton seviye={theme} createShareUrl={createShareUrl} />

      <div role="status" aria-live="polite" aria-atomic="true">
        {state === "yukleniyor" && !output && !error ? (
          <p className={`text-sm ${t.inkMuted}`}>
            Python ortamı ilk kullanım için hazırlanıyor; bu süre kodun 8 saniyelik çalışma sınırına dahil değil.
          </p>
        ) : output || error ? (
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
