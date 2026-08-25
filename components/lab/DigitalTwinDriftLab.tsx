"use client";

import { useMemo, useState } from "react";
import {
  DIGITAL_TWIN_DRIFT_SCENARIO,
  buildTwinDriftSamples,
  evaluateTwinCalibration,
  evaluateTwinDecision,
  summarizeResiduals,
  type TwinDecision,
  type TwinDriftSample,
  type TwinSyncStatus,
} from "@/lib/robotics/digitalTwinDrift";
import { FirstVisitNote } from "@/components/ui/FirstVisitNote";

const INTRO_STORAGE_KEY = "robotik-platform:dijital-ikiz-kaymasi-tanitim:v1";

const STATUS_LABELS: Record<TwinSyncStatus, string> = {
  synced: "Senkron",
  watch: "İzle",
  drift: "Kayma",
};

const DECISIONS: readonly { value: TwinDecision; label: string; detail: string }[] = [
  { value: "continue", label: "Akışa devam et", detail: "İkizi değiştirmeden otomatik hücreyi çalıştır." },
  { value: "watch", label: "Yalnız izlemeyi sürdür", detail: "Artık hata büyürse daha sonra müdahale et." },
  { value: "pause-recalibrate", label: "Otomatik akışı durdur ve yeniden kalibre et", detail: "Modeli fiziksel ölçümle yeniden hizala; sonra ayrı pozlarda doğrula." },
] as const;

const millimeters = (meters: number) => Math.round(meters * 1_000);

function ResidualChart({ samples }: { samples: readonly TwinDriftSample[] }) {
  const width = 700;
  const height = 250;
  const left = 48;
  const right = 20;
  const top = 24;
  const bottom = 42;
  const threshold = DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters;
  const maxValue = Math.max(threshold * 1.35, ...samples.map((sample) => sample.residualMeters));
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;
  const barWidth = plotWidth / samples.length * 0.56;
  const x = (index: number) => left + (index + 0.5) * plotWidth / samples.length;
  const y = (value: number) => top + plotHeight - value / maxValue * plotHeight;
  const summary = summarizeResiduals(samples);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`${samples.length} ölçümün TCP artık hata grafiği. Ortalama ${millimeters(summary.meanResidualMeters)} milimetre, en yüksek ${millimeters(summary.maxResidualMeters)} milimetre, eşik ${millimeters(threshold)} milimetre.`}
    >
      <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="currentColor" opacity=".25" />
      <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="currentColor" opacity=".25" />
      <line x1={left} y1={y(threshold)} x2={width - right} y2={y(threshold)} stroke="#b45309" strokeWidth="3" strokeDasharray="8 6" />
      <text x={left + 6} y={y(threshold) - 8} fill="#92400e" fontSize="13" fontWeight="700">eşik · {millimeters(threshold)} mm</text>
      {samples.map((sample, index) => {
        const breached = sample.residualMeters > threshold;
        const barHeight = height - bottom - y(sample.residualMeters);
        return (
          <g key={sample.id}>
            <rect x={x(index) - barWidth / 2} y={y(sample.residualMeters)} width={barWidth} height={Math.max(2, barHeight)} rx="4" fill={breached ? "#b45309" : "#0f766e"} />
            <text x={x(index)} y={height - 18} textAnchor="middle" fill="currentColor" fontSize="12">{sample.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DigitalTwinDriftLab() {
  const [feedState, setFeedState] = useState<"baseline" | "drifted">("baseline");
  const [decision, setDecision] = useState<TwinDecision | null>(null);
  const [decisionResult, setDecisionResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctionDegrees, setCorrectionDegrees] = useState(0);
  const [validated, setValidated] = useState(false);

  const displayedSamples = useMemo(
    () => buildTwinDriftSamples(0, feedState),
    [feedState],
  );
  const displayedSummary = useMemo(() => summarizeResiduals(displayedSamples), [displayedSamples]);
  const calibration = useMemo(() => evaluateTwinCalibration(correctionDegrees), [correctionDegrees]);

  function loadDriftedFeed() {
    setFeedState("drifted");
    setDecision(null);
    setDecisionResult("idle");
    setCorrectionDegrees(0);
    setValidated(false);
  }

  function checkDecision() {
    setDecisionResult(decision && evaluateTwinDecision(decision) ? "correct" : "wrong");
  }

  return (
    <section aria-labelledby="twin-drift-title" className="rounded-2xl border border-site-border bg-site-soft p-4 shadow-sm sm:p-6">
      <header className="max-w-4xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">Seed {DIGITAL_TWIN_DRIFT_SCENARIO.seed} · sentetik fiziksel ölçüm</p>
        <h2 id="twin-drift-title" className="mt-2 font-heading text-3xl font-semibold text-site-ink">İkizin tahmini ile ölçümü aynı eksende karşılaştır.</h2>
        <p className="mt-3 text-sm leading-6 text-site-muted">Sürekli veri akışı yalnız bağlantıyı kanıtlar. Senkronu kanıtlamak için ikizin tahmini ile bağımsız fiziksel ölçüm arasındaki TCP artığını ve bu farkın kalıcılığını izle.</p>
      </header>

      <FirstVisitNote storageKey={INTRO_STORAGE_KEY} ariaLabel="Kayma ne demek, neden olur">
        <p className="font-heading text-base font-semibold">“Kayma” (drift) ne demek, neden olur?</p>
        <p className="mt-1.5">
          Dijital ikiz kurulduğunda modelin tahmini ile robotun gerçek davranışı örtüşür. Zamanla bu örtüşme
          bozulabilir: sıcaklık değişimi bağlantı uzunluklarını hafifçe genleştirir, eklem sürtünmesi aşınmayla
          değişir, encoder referansı küçük bir sıfır kaymasıyla kayabilir. Bağlantının açık olması (veri akıyor
          olması) bunu göstermez — göstergesi, ikizin tahmini ile bağımsız bir ölçüm arasındaki farkın (artık)
          tek seferlik değil, art arda tekrarlanan ve büyüyen bir sapma olmasıdır.
        </p>
      </FirstVisitNote>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-site-border bg-site-surface p-4">
          <h3 className="font-heading text-xl font-semibold text-site-ink">Senkron denetimi</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Durum</dt><dd className="mt-1 text-xl font-bold text-site-ink">{STATUS_LABELS[displayedSummary.status]}</dd></div>
            <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Ortalama TCP artığı</dt><dd className="mt-1 font-mono text-site-ink">{millimeters(displayedSummary.meanResidualMeters)} mm</dd></div>
            <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">En uzun eşik aşımı</dt><dd className="mt-1 font-mono text-site-ink">{displayedSummary.longestBreachRun} örnek</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-site-muted">Karar kuralı: {millimeters(DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters)} mm üstünde en az {DIGITAL_TWIN_DRIFT_SCENARIO.requiredConsecutiveBreaches} ardışık örnek kayma kabul edilir. Tek aşım yalnız izleme uyarısıdır.</p>
          {feedState === "baseline" && <button type="button" onClick={loadDriftedFeed} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Üç ay sonraki ölçümleri yükle</button>}
        </div>

        <div className="min-w-0 rounded-2xl border border-site-border bg-site-surface p-4 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-xl font-semibold text-site-ink">TCP artık izi</h3>
            <span className="font-mono text-xs text-site-muted">K: kalibrasyon · D: ayrı doğrulama</span>
          </div>
          <ResidualChart samples={displayedSamples} />
          <p className="text-sm leading-6 text-site-muted">Turkuaz sütun eşik içinde, amber sütun eşik üstündedir. Renkten bağımsız olarak her değeri aşağıdaki tabloda ve durum özetinde okuyabilirsin.</p>
          <details className="mt-4 rounded-xl border border-site-border bg-site-soft p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-site-ink">Ölçüm tablosunu aç</summary>
            <div className="overflow-x-auto">
              <table className="mt-3 w-full text-left text-sm">
                <caption className="sr-only">İkiz tahmini ile sentetik fiziksel ölçüm arasındaki TCP artık değerleri</caption>
                <thead><tr className="border-b border-site-border"><th className="p-2">Poz</th><th className="p-2">J1 / J2 komutu</th><th className="p-2">Artık</th><th className="p-2">Eşik</th></tr></thead>
                <tbody>{displayedSamples.map((sample) => <tr key={sample.id} className="border-b border-site-border"><th scope="row" className="p-2">{sample.id}</th><td className="p-2 font-mono">{sample.commandDegrees[0]}° / {sample.commandDegrees[1]}°</td><td className="p-2 font-mono">{millimeters(sample.residualMeters)} mm</td><td className="p-2">{sample.residualMeters > DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters ? "Aşıldı" : "İçinde"}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      {feedState === "drifted" && (
        <section className="mt-6 rounded-2xl border border-site-border bg-site-surface p-4" aria-labelledby="twin-decision-title">
          <h3 id="twin-decision-title" className="font-heading text-2xl font-semibold text-site-ink">1 · İşletme kararını ver</h3>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-site-ink">On ölçümdeki kalıcı farktan sonra ne yaparsın?</legend>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {DECISIONS.map((option) => <label key={option.value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${decision === option.value ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-soft"}`}><input type="radio" name="twin-decision" checked={decision === option.value} onChange={() => { setDecision(option.value); setDecisionResult("idle"); }} className="mt-1 size-4 accent-teal-700" /><span><strong className="block text-site-ink">{option.label}</strong><span className="mt-1 block text-xs leading-5 text-site-muted">{option.detail}</span></span></label>)}
            </div>
          </fieldset>
          <button type="button" onClick={checkDecision} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Kararı değerlendir</button>
          {decisionResult !== "idle" && <div role="status" aria-label="Kayma kararı geri bildirimi" className={`mt-4 rounded-xl border p-4 text-sm ${decisionResult === "correct" ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}><strong>{decisionResult === "correct" ? "Doğru karar." : "Bu karar güvenli değil."}</strong> {decisionResult === "correct" ? "Kalıcı model–ölçüm farkı varken otomatik akışı durdur; düzeltmeyi yalnız veriyle ayarla ve yeni pozlarda doğrula." : "On örnek de eşiği art arda aşıyor. Bağlantının açık olması, tahminin hâlâ geçerli olduğunu kanıtlamaz."}</div>}
        </section>
      )}

      {decisionResult === "correct" && (
        <section className="mt-6 rounded-2xl border border-site-border bg-site-surface p-4" aria-labelledby="twin-calibration-title">
          <h3 id="twin-calibration-title" className="font-heading text-2xl font-semibold text-site-ink">2 · Kalibre et, sonra görmediğin pozlarda doğrula</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-site-muted">K1–K6 pozlarıyla ikizin J1 sıfır düzeltmesini ayarla. Son karar yalnız aynı pozlara yeniden bakılarak değil, farklı J2 açıları kullanan D1–D4 doğrulama pozlarıyla verilir.</p>
          <label className="mt-5 grid max-w-2xl gap-2 text-sm font-semibold text-site-ink">
            <span>İkiz J1 sıfır düzeltmesi: <output>{correctionDegrees.toFixed(1)}°</output></span>
            <input aria-label="İkiz J1 sıfır düzeltmesi" type="range" min="-10" max="10" step="0.5" value={correctionDegrees} onChange={(event) => { setCorrectionDegrees(Number(event.target.value)); setValidated(false); }} className="h-11 w-full touch-pan-y accent-teal-700" />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-site-soft p-3 text-sm"><strong className="text-site-ink">Kalibrasyon · K1–K6</strong><p className="mt-1 font-mono text-site-muted">ortalama {millimeters(calibration.calibration.meanResidualMeters)} mm</p></div>
            <div className="rounded-xl bg-site-soft p-3 text-sm"><strong className="text-site-ink">Doğrulama · D1–D4</strong><p className="mt-1 font-mono text-site-muted">ortalama {millimeters(calibration.validation.meanResidualMeters)} mm</p></div>
          </div>
          <button type="button" onClick={() => setValidated(true)} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Ayrı pozlarda doğrula</button>
          {validated && <div role="status" aria-label="Kalibrasyon geri bildirimi" className={`mt-4 rounded-xl border p-4 text-sm ${calibration.passed ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}><strong>{calibration.passed ? "Senkron geri kazanıldı." : "Doğrulama henüz geçmedi."}</strong> {calibration.passed ? `Düzeltme, kalibrasyonda kullanılmayan 4 ayrı doğrulama pozunda ortalama ${millimeters(calibration.validation.meanResidualMeters)} mm artık üretti.` : `D1–D4 ortalaması ${millimeters(calibration.validation.meanResidualMeters)} mm; kabul sınırı ${millimeters(DIGITAL_TWIN_DRIFT_SCENARIO.validationToleranceMeters)} mm. Düzeltmeyi ölçümlere göre yeniden ayarla.`}</div>}
        </section>
      )}

      <p className="mt-6 rounded-xl border border-site-border bg-site-surface p-4 text-xs leading-5 text-site-muted"><strong className="text-site-ink">Model sınırı:</strong> “Fiziksel” akış, seed’li ölçüm gürültüsü ve mevcut jenerik 2-DOF ileri kinematik modelinden tarayıcıda üretilir; gerçek sensör veya robota bağlı değildir. Bu nedenle bu sayfanın kendisi dijital ikiz değil, ikiz senkronu için bir eğitim provasıdır. Gerçek devreye almada kalibrasyon prosedürü, güvenlik denetleyicisi ve üretici sınırları ayrıca doğrulanır.</p>
    </section>
  );
}
