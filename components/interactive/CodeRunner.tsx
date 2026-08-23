"use client";

import { useEffect, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { ExperimentShareButton } from "@/components/interactive/LabChallengeUi";
import { LazyPythonCodeEditor } from "@/components/interactive/LazyPythonCodeEditor";
import { RobotInfoLine } from "@/components/interactive/RobotInfoLine";
import { codeRunnerStatusText, roundPose, useCodeRunnerEngine } from "@/components/interactive/useCodeRunnerEngine";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/Tabs";

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

const MOBILE_TABS: readonly TabItem[] = [
  { id: "kod", label: "Kod" },
  { id: "sonuc", label: "Sonuç" },
];

const TAB_ID_PREFIX = "coderunner-panel";

/**
 * Ders içine gömülen etkileşimli sahne: gerçek Python kodu, Pyodide
 * (WebAssembly CPython) ile Web Worker içinde çalışır — ana thread'i
 * kilitlemez, "Durdur" worker'ı sonlandırır (bkz. docs/08-guvenlik-
 * sertlestirme.md "Çalışma süresi sınırı"). Pyodide kendi alan adımızdan
 * servis edilir (public/pyodide/, bkz. scripts/copy-pyodide-assets.mjs).
 *
 * Durum/worker mantığı `useCodeRunnerEngine`'de yaşıyor (bkz. o dosyanın
 * başlığı) — bu bileşen yalnız SUNUMU çizer. Yerleşim Kod Akademisi'nin
 * masaüstünde yan yana/sticky + mobilde sekmeli desenini (bkz.
 * `components/kod-akademisi/KodAkademisiCodeLab.tsx`) aynı `useCodeRunnerEngine`
 * hook'unu paylaşarak yeniden kullanır (docs/05 "Görünürlük ve yönelim
 * ilkesi" retrofit'i — bkz. docs/durum-denetim.md).
 *
 * Masaüstü eşiği Kod Akademisi'nden farklı: `xl:` (1280px), `lg:` (1024px)
 * DEĞİL. Kod Akademisi kendi sayfasında yan panelsiz `max-w-7xl` bir kapta
 * yaşıyor; bu bileşen ise `/ders/[slug]` sayfasının `lg:grid-cols-
 * [minmax(0,1fr)_320px]` güven panosu yan paneliyle PAYLAŞILAN bir sütunda
 * render ediliyor. O yüzden ders sayfası `lg:` eşiğine ulaştığında (1024px
 * viewport) ana sütun genişliği aslında yalnız ~616px'e düşüyor — Kod
 * Akademisi'nin 1024px ölçümündeki (51 karakter/satır, 256px sahne) rahat
 * genişlikten çok uzak. `max-w-7xl` kapsayıcı 1280px'de tavan yaptığı için
 * yan panelli ana sütun en fazla ~872px'e ulaşabiliyor (1280px viewport
 * ve üzeri sabit kalıyor) — bu, Kod Akademisi'nin kendi ölçüm tablosundaki
 * 850-900px satırına denk düşüyor (41-44 karakter/satır, 207-221px sahne),
 * yani kullanılabilir ama yalnız `xl:` (1280px) eşiğinden itibaren. Altında
 * (`lg` dahil) sekmeli görünüm kalır. Gerçek DOM ile doğrulama:
 * docs/durum-denetim.md.
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

  const [activeTab, setActiveTab] = useState<"kod" | "sonuc">("kod");

  useEffect(() => {
    if (state !== "bitti") return;
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. components/scene/LazyScene.tsx'teki aynı desen).
    const zamanlayici = setTimeout(() => setActiveTab("sonuc"), 0);
    return () => clearTimeout(zamanlayici);
  }, [state]);

  const codeVisibility = activeTab === "kod" ? "block" : "hidden";
  const resultVisibility = activeTab === "sonuc" ? "block" : "hidden";
  const editorLabelId = `${editorId}-label`;

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {taskTitle && <div className={`rounded-lg border ${t.outline} ${t.bg} p-3 text-sm ${t.ink}`}><span className="font-bold">Otomatik görev:</span> {taskTitle}</div>}

      <p role="status" aria-live="polite" className={`inline-flex min-h-11 w-fit items-center rounded-full border ${t.outline} ${t.bg} px-4 text-sm font-semibold ${t.ink}`}>
        {codeRunnerStatusText(state, testPassed)}
      </p>

      <Tabs
        items={MOBILE_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as "kod" | "sonuc")}
        ariaLabel="Kod çalıştırma görünümü"
        idPrefix={TAB_ID_PREFIX}
        className={`grid grid-cols-2 gap-1 rounded-2xl border ${t.outline} ${t.bg} p-1 xl:hidden`}
        tabClassName={(active) =>
          `min-h-11 rounded-xl px-3 text-sm font-semibold ${active ? `${t.surface} ${t.ink} shadow-sm` : t.inkMuted}`
        }
      />

      <div className="xl:grid xl:grid-cols-2 xl:items-start xl:gap-4">
        <TabPanel id="kod" idPrefix={TAB_ID_PREFIX} ariaLabel="Kod editörü" className={`${codeVisibility} xl:block`}>
          <div className="flex flex-col gap-3">
            <span id={editorLabelId} className={`text-sm font-medium ${t.ink}`}>
              Python kodu
            </span>
            <LazyPythonCodeEditor
              id={editorId}
              value={code}
              onChange={setCode}
              error={error}
              labelledBy={editorLabelId}
              tone={theme}
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
          </div>
        </TabPanel>

        <TabPanel id="sonuc" idPrefix={TAB_ID_PREFIX} ariaLabel="Sahne ve sonuç" className={`${resultVisibility} xl:sticky xl:top-20 xl:block xl:self-start`}>
          <div className="flex flex-col gap-3">
            {robot && (
              <>
                <SahneAlani className={`aspect-video w-full overflow-hidden rounded-lg ${t.bg}`}>
                  <RobotArm robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} />
                </SahneAlani>
                <RobotInfoLine robot={robot} className={t.inkMuted} />
              </>
            )}
            {toolPose?.orientation && (
              <p className={`font-mono text-xs ${t.inkMuted}`} data-testid="code-tool-pose">
                TCP: x {roundPose(toolPose.position.x)} · y {roundPose(toolPose.position.y)} · z {roundPose(toolPose.position.z)} m
                {" · "}Alet RPY: R {roundPose(toolPose.orientation.roll)}° · P {roundPose(toolPose.orientation.pitch)}° · Y {roundPose(toolPose.orientation.yaw)}°
              </p>
            )}

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
        </TabPanel>
      </div>
    </div>
  );
}
