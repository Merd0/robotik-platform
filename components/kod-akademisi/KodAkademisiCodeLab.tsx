"use client";

import { useEffect, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { ExperimentShareButton } from "@/components/interactive/LabChallengeUi";
import { LazyPythonCodeEditor } from "@/components/interactive/LazyPythonCodeEditor";
import { codeRunnerStatusText, roundPose, useCodeRunnerEngine } from "@/components/interactive/useCodeRunnerEngine";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/Tabs";

/**
 * Kod Akademisi'nin masaüstünde yan yana/mobilde sekmeli yerleşimi.
 * `useCodeRunnerEngine`'i CodeRunner ile PAYLAŞIR — worker/durum mantığı
 * tekrar yazılmadı (bkz. docs/durum-codex.md "Kod Akademisi — mimari
 * teklif" §5, ölçülen lg: (1024px) eşiği).
 *
 * Masaüstü: `lg:grid-cols-2` — sol sütun kod, sağ sütun `lg:sticky` sahne +
 * sonuç. Mobil (<lg): "Kod"/"Sonuç" iki sekme; her iki panel de TEK SEFER
 * DOM'da durur (state kaybı/hydration riski yok), görünürlük Tailwind'in
 * `hidden`/`lg:block` sınıflarıyla değişir — JS yalnız hangi panelin
 * "aktif" sayıldığını, sekme geçişini ve sonrasında odak taşımayı yönetir.
 */

const MOBILE_TABS: readonly TabItem[] = [
  { id: "kod", label: "Kod" },
  { id: "sonuc", label: "Sonuç" },
];

interface KodAkademisiCodeLabProps {
  initialCode: string;
  robot: string;
  skillId: string;
  expectedFinalDegrees?: number[];
  toleranceDegrees?: number;
  /** İkinci derinlik turu (docs/15 "Kod incelemesi") — bkz. lib/codeLab.ts CodeLabExpectation. */
  maxTraceSteps?: number;
  ipuclari: readonly string[];
  cozum: string;
  /** İkinci derinlik turu (docs/15 "Kişisel optimizasyon") — rekabetsiz, yalnız bilgilendirici. */
  showOptimizationMetric?: boolean;
}

/** Boş satırları ve yalnız yorum olan satırları saymaz — "Çözümün: N satır" bunun üzerinden hesaplanır. */
function countMeaningfulLines(code: string): number {
  return code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#")).length;
}

export function KodAkademisiCodeLab({
  initialCode,
  robot: robotId,
  skillId,
  expectedFinalDegrees,
  toleranceDegrees,
  maxTraceSteps,
  ipuclari,
  cozum,
  showOptimizationMetric = false,
}: KodAkademisiCodeLabProps) {
  const engine = useCodeRunnerEngine({ initialCode, robot: robotId, expectedFinalDegrees, toleranceDegrees, maxTraceSteps, skillId });
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

  const record = useEvidenceRecorder();
  const [activeTab, setActiveTab] = useState<"kod" | "sonuc">("kod");
  const [hintLevel, setHintLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (state !== "bitti") return;
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. components/scene/LazyScene.tsx'teki aynı desen).
    const zamanlayici = setTimeout(() => setActiveTab("sonuc"), 0);
    return () => clearTimeout(zamanlayici);
  }, [state]);

  function revealNextHint() {
    if (hintLevel >= ipuclari.length) return;
    const nextLevel = hintLevel + 1;
    setHintLevel(nextLevel);
    record({ skillId, stage: "observed", result: "neutral", metrics: { hintLevel: nextLevel } });
  }

  function revealSolution() {
    if (showSolution) return;
    setShowSolution(true);
    record({ skillId, stage: "observed", result: "neutral", metrics: { hintLevel: ipuclari.length + 1 } });
  }

  const codeVisibility = activeTab === "kod" ? "block" : "hidden";
  const resultVisibility = activeTab === "sonuc" ? "block" : "hidden";
  const editorLabelId = `${editorId}-label`;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" aria-live="polite" className="inline-flex min-h-11 w-fit items-center rounded-full border border-site-border bg-site-soft px-4 text-sm font-semibold text-site-ink">
        {codeRunnerStatusText(state, testPassed)}
      </p>

      <Tabs
        items={MOBILE_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as "kod" | "sonuc")}
        ariaLabel="Kod Akademisi görünümü"
        idPrefix="koda-mobile"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-site-border bg-site-soft p-1 lg:hidden"
        tabClassName={(active) =>
          `min-h-11 rounded-xl px-3 text-sm font-semibold ${active ? "bg-site-surface text-site-ink shadow-sm" : "text-site-muted"}`
        }
      />

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        <TabPanel id="kod" idPrefix="koda-mobile" ariaLabel="Kod editörü" className={`${codeVisibility} lg:block`}>
          <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4">
            <span id={editorLabelId} className="text-sm font-medium text-site-ink">
              Python kodu
            </span>
            <LazyPythonCodeEditor
              id={editorId}
              value={code}
              onChange={setCode}
              error={error}
              labelledBy={editorLabelId}
              tone="site"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleRun} disabled={running} className="h-11 rounded-md bg-site-strong px-4 text-site-on-strong disabled:opacity-50">
                {state === "yukleniyor" ? "Python yükleniyor…" : state === "calisiyor" ? "Çalışıyor…" : "Çalıştır"}
              </button>
              {running && (
                <button type="button" onClick={handleStop} className="h-11 rounded-md border border-site-border px-4 text-site-ink">
                  Durdur
                </button>
              )}
              <button type="button" onClick={handleReset} className="h-11 rounded-md border border-site-border px-4 text-site-ink">
                Sıfırla
              </button>
            </div>
            <ExperimentShareButton seviye="lise" createShareUrl={createShareUrl} />

            <div className="flex flex-col gap-2 rounded-xl border border-site-border bg-site-soft p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-site-accent-text">İpuçları</p>
              {Array.from({ length: hintLevel }).map((_, index) => (
                <p key={index} className="text-sm text-site-ink">
                  <span className="font-semibold">İpucu {index + 1}:</span> {ipuclari[index]}
                </p>
              ))}
              {hintLevel < ipuclari.length && (
                <button type="button" onClick={revealNextHint} className="min-h-11 w-fit rounded-md border border-site-border px-3 text-sm text-site-ink">
                  İpucu göster ({hintLevel}/{ipuclari.length})
                </button>
              )}
              {showSolution ? (
                <p className="rounded-lg border border-site-border bg-site-bg p-2 font-mono text-xs text-site-ink">{cozum}</p>
              ) : (
                <button type="button" onClick={revealSolution} className="min-h-11 w-fit rounded-md border border-site-border px-3 text-sm text-site-muted">
                  Çözümü göster
                </button>
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel id="sonuc" idPrefix="koda-mobile" ariaLabel="Sahne ve sonuç" className={`${resultVisibility} lg:sticky lg:top-20 lg:block lg:self-start`}>
          <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4">
            {robot && (
              <SahneAlani className="aspect-video w-full overflow-hidden rounded-lg bg-site-bg">
                <RobotArm robot={robot} jointAngles={jointAngles} activeJointIndex={activeJointIndex} />
              </SahneAlani>
            )}
            {toolPose?.orientation && (
              <p className="font-mono text-xs text-site-muted" data-testid="code-tool-pose">
                TCP: x {roundPose(toolPose.position.x)} · y {roundPose(toolPose.position.y)} · z {roundPose(toolPose.position.z)} m
                {" · "}Alet RPY: R {roundPose(toolPose.orientation.roll)}° · P {roundPose(toolPose.orientation.pitch)}° · Y {roundPose(toolPose.orientation.yaw)}°
              </p>
            )}

            <div role="status" aria-live="polite" aria-atomic="true">
              {state === "yukleniyor" && !output && !error ? (
                <p className="text-sm text-site-muted">Python ortamı ilk kullanım için hazırlanıyor.</p>
              ) : output || error ? (
                <pre className="whitespace-pre-wrap rounded-lg border border-site-border bg-site-bg p-3 font-mono text-sm text-site-ink">
                  {output}
                  {error && <span className="text-red-600">{"\n" + error}</span>}
                </pre>
              ) : (
                <span className="sr-only">Kod çalıştırılmaya hazır.</span>
              )}
            </div>

            {jointTrace.length > 0 && robot && (
              <div className="rounded-lg border border-site-border bg-site-bg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-site-ink">Çalışma izi · komut {traceIndex + 1}/{jointTrace.length}</span>
                  <span className="font-mono text-site-muted">{jointAngles.map((angle, index) => `θ${index + 1}=${(angle * 180 / Math.PI).toFixed(1)}°`).join(" · ")}</span>
                </div>
                <input aria-label="Çalışma izi adımı" type="range" min="0" max={jointTrace.length - 1} value={traceIndex} onChange={(event) => showTraceStep(Number(event.target.value))} className="mt-2 h-11 w-full" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => showTraceStep(traceIndex - 1)} className="min-h-11 flex-1 rounded-md border border-site-border text-site-ink">Geri</button>
                  <button type="button" onClick={() => showTraceStep(traceIndex + 1)} className="min-h-11 flex-1 rounded-md border border-site-border text-site-ink">İleri</button>
                </div>
              </div>
            )}

            {testPassed !== null && (
              <p
                role="status"
                className={`rounded-lg border p-3 text-sm font-semibold ${testPassed ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}
              >
                {testPassed ? "Otomatik test geçti. Çıktı ve robot duruşu görevle uyuşuyor." : "Otomatik test henüz geçmedi. Çıktıyı veya son eklem açılarını görevle karşılaştır."}
              </p>
            )}

            {showOptimizationMetric && testPassed === true && (
              <p className="rounded-lg border border-site-border bg-site-soft p-3 text-sm text-site-muted" data-testid="optimization-metric">
                Çözümün: {countMeaningfulLines(code)} satır, {jointTrace.length} robot hareketi. Karşılaştırma yok
                — bu yalnız kendi çözümün hakkında bilgi.
              </p>
            )}
          </div>
        </TabPanel>
      </div>
    </div>
  );
}
