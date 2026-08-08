"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { createFourLensTrace, finalXDirection } from "@/lib/robotics/fourLensTrace";

type Lens = "scene" | "matrix" | "graph" | "code";
type Prediction = "increase" | "decrease";

const lenses: { id: Lens; label: string }[] = [
  { id: "scene", label: "Sahne" },
  { id: "matrix", label: "Matris" },
  { id: "graph", label: "Grafik" },
  { id: "code", label: "Kod" },
];

const round = (value: number) => Math.abs(value) < 0.0005 ? "0.000" : value.toFixed(3);
const point = (value: { x: number; y: number }) => ({ x: 150 + value.x * 68, y: 160 - value.y * 68 });

/** All four views consume the same immutable sample; no view recomputes robot state. */
export function FourLensTraceLab() {
  const record = useEvidenceRecorder();
  const trace = useMemo(() => createFourLensTrace(), []);
  const [activeLens, setActiveLens] = useState<Lens>("scene");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [running, setRunning] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [assessed, setAssessed] = useState(false);
  const sample = trace[sampleIndex];
  const finalDirection = finalXDirection(trace);
  const elbow = point(sample.elbow);
  const end = point(sample.end);
  const maxIndex = trace.length - 1;

  function run() {
    if (!prediction) return;
    setRunning(true);
    setSampleIndex(0);
    setAssessed(false);
    record({ skillId: "four-lens-forward-kinematics", stage: "predicted", result: "neutral", metrics: { prediction } });
    record({ skillId: "four-lens-forward-kinematics", stage: "observed", result: "neutral", metrics: { sampleIndex: 0, codeLine: trace[0].line } });
  }

  function moveTo(next: number) {
    setSampleIndex(next);
    record({ skillId: "four-lens-forward-kinematics", stage: "observed", result: "neutral", metrics: { sampleIndex: next, codeLine: trace[next].line, endX: Number(round(trace[next].end.x)), endY: Number(round(trace[next].end.y)) } });
    if (next === maxIndex && !assessed) {
      const success = prediction === finalDirection;
      record({ skillId: "four-lens-forward-kinematics", stage: "assessed", result: success ? "success" : "retry", metrics: { prediction: prediction ?? "none", actual: finalDirection, finalSample: next } });
      setAssessed(true);
    }
  }

  const panelClass = (lens: Lens) => `${activeLens === lens ? "block" : "hidden"} rounded-xl border border-lise-ink/10 bg-lise-bg p-3 lg:block`;

  return (
    <section className="my-5 rounded-2xl border border-lise-ink/15 bg-lise-surface p-4 sm:p-5" aria-labelledby="four-lens-title">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-lise-ink">Tek çalışma · tek örnek · dört görünüm</p>
      <h3 id="four-lens-title" className="mt-1 text-lg font-bold text-lise-ink">İleri kinematik İz Laboratuvarı</h3>
      <p className="mt-2 text-sm text-lise-ink/75">Kod satırı, eklem açıları, metre cinsinden sahne ve 4×4 matris aynı örnek numarasına bağlıdır. Geri sardığında dördü birlikte geri gider.</p>

      <fieldset className="mt-4 rounded-xl border border-lise-ink/10 bg-lise-bg p-3">
        <legend className="px-1 text-sm font-semibold">Son satır q₁’i 30°’den 75°’ye çıkarınca uç noktanın x değeri ne olur?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{(["increase", "decrease"] as const).map((choice) => <button key={choice} type="button" aria-pressed={prediction === choice} onClick={() => { setPrediction(choice); setRunning(false); setAssessed(false); }} className={`min-h-11 rounded-lg border ${prediction === choice ? "border-lise-accent bg-lise-surface" : "border-lise-ink/15"}`}>{choice === "increase" ? "Artar" : "Azalır"}</button>)}</div>
        <button type="button" disabled={!prediction} onClick={run} className="mt-3 min-h-11 rounded-lg bg-lise-ink px-4 font-semibold text-lise-surface disabled:opacity-40">Programı çalıştır</button>
      </fieldset>

      {running && <>
        <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden" aria-label="Mobil görünüm seçimi">{lenses.map((lens) => <button key={lens.id} type="button" aria-pressed={activeLens === lens.id} onClick={() => setActiveLens(lens.id)} className={`min-h-11 min-w-24 rounded-lg border px-3 ${activeLens === lens.id ? "border-lise-accent bg-lise-bg" : "border-lise-ink/15"}`}>{lens.label}</button>)}</div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className={panelClass("scene")}><h4 className="text-sm font-bold">Sahne · metre</h4><svg viewBox="0 0 300 210" className="mt-2 aspect-[10/7] w-full" role="img" aria-label={`Örnek ${sampleIndex}: uç nokta x ${round(sample.end.x)}, y ${round(sample.end.y)} metre`}><path d="M15 160 H285 M150 20 V195" stroke="currentColor" opacity=".15" /><line x1="150" y1="160" x2={elbow.x} y2={elbow.y} stroke="currentColor" strokeWidth="8" strokeLinecap="round" /><line x1={elbow.x} y1={elbow.y} x2={end.x} y2={end.y} stroke="#0f766e" strokeWidth="8" strokeLinecap="round" /><circle cx="150" cy="160" r="7" fill="currentColor" /><circle cx={elbow.x} cy={elbow.y} r="7" fill="#f59e0b" /><circle cx={end.x} cy={end.y} r="8" fill="#14b8a6" /><text x="8" y="18" fontSize="11" fill="currentColor">q₁ {sample.jointDegrees[0]}° · q₂ {sample.jointDegrees[1]}°</text><text x="8" y="200" fontSize="11" fill="currentColor">uç ({round(sample.end.x)}, {round(sample.end.y)}) m</text></svg></div>
          <div className={panelClass("matrix")}><h4 className="text-sm font-bold">Uç çerçevesi · T₀₂</h4><p className="mt-1 text-xs text-lise-ink/60">Son sütun sahnedeki aynı (x, y) konumudur; uzunluk birimi metredir.</p><div className="mt-3 overflow-x-auto"><table className="w-full border-collapse font-mono text-xs"><tbody>{sample.endTransform.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex} className={`border border-lise-ink/10 px-2 py-2 text-right ${columnIndex === 3 ? "bg-lise-accent/10 font-bold" : ""}`}>{round(value)}</td>)}</tr>)}</tbody></table></div></div>
          <div className={panelClass("graph")}><h4 className="text-sm font-bold">Eklem grafiği · derece / örnek</h4><svg viewBox="0 0 320 180" className="mt-2 aspect-video w-full" role="img" aria-label={`Açı grafiğinde aktif örnek ${sampleIndex}`}><path d="M35 15 V145 H305" stroke="currentColor" opacity=".25" />{[0, 30, 60, 90].map((tick) => <g key={tick}><line x1="30" x2="305" y1={145 - tick * 1.35} y2={145 - tick * 1.35} stroke="currentColor" opacity=".08" /><text x="5" y={149 - tick * 1.35} fontSize="10" fill="currentColor">{tick}°</text></g>)}<polyline points={trace.map((item, index) => `${45 + index * 80},${145 - item.jointDegrees[0] * 1.35}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="4" /><polyline points={trace.map((item, index) => `${45 + index * 80},${145 - item.jointDegrees[1] * 1.35}`).join(" ")} fill="none" stroke="#d97706" strokeWidth="4" />{trace.map((_, index) => <circle key={index} cx={45 + index * 80} cy={145 - trace[index].jointDegrees[0] * 1.35} r={index === sampleIndex ? 7 : 4} fill="#0f766e" />)}<line x1={45 + sampleIndex * 80} x2={45 + sampleIndex * 80} y1="10" y2="150" stroke="currentColor" strokeDasharray="4 4" /><text x="170" y="172" fontSize="10" fill="#0f766e">q₁</text><text x="205" y="172" fontSize="10" fill="#d97706">q₂</text></svg></div>
          <div className={panelClass("code")}><h4 className="text-sm font-bold">Kod adımları</h4><ol className="mt-2 space-y-1 font-mono text-sm">{trace.map((step, index) => <li key={step.line} aria-current={index === sampleIndex ? "step" : undefined} className={`rounded-lg border px-3 py-2 ${index === sampleIndex ? "border-lise-accent bg-lise-accent/10" : "border-transparent"}`}><span className="mr-3 text-lise-ink/45">{step.line}</span>{step.code}</li>)}</ol><p className="mt-3 rounded-lg bg-lise-surface p-2 text-xs">Aktif satırın açısı grafikteki dikey işaretle, matris ve sahnedeki uç konumuyla aynıdır.</p></div>
        </div>

        <label className="mt-4 block rounded-xl border border-lise-ink/10 bg-lise-bg p-3 text-sm font-semibold">Örnek: {sampleIndex} / {maxIndex} · satır {sample.line}<input type="range" min="0" max={maxIndex} step="1" value={sampleIndex} onChange={(event) => moveTo(Number(event.target.value))} className="block h-11 w-full accent-lise-accent" /></label>
        <div className="mt-2 flex gap-2"><button type="button" disabled={sampleIndex === 0} onClick={() => moveTo(sampleIndex - 1)} className="min-h-11 flex-1 rounded-lg border border-lise-ink/15 disabled:opacity-40">Geri sar</button><button type="button" disabled={sampleIndex === maxIndex} onClick={() => moveTo(sampleIndex + 1)} className="min-h-11 flex-1 rounded-lg border border-lise-ink/15 disabled:opacity-40">Sonraki örnek</button></div>
        {sampleIndex === maxIndex && <p className={`mt-3 rounded-lg border p-3 text-sm ${prediction === finalDirection ? "border-emerald-600/35 bg-emerald-500/10" : "border-amber-600/35 bg-amber-500/10"}`} aria-live="polite">{prediction === finalDirection ? "Tahminin ölçümle uyuştu." : "Tahminin ölçümle uyuşmadı."} Son iki örnekte x, {round(trace[maxIndex - 1].end.x)} m’den {round(trace[maxIndex].end.x)} m’ye {finalDirection === "decrease" ? "azaldı" : "arttı"}. Hareketin yönünü yalnız q₁ sayısından değil, q₁+q₂ toplamından oku.</p>}
      </>}
    </section>
  );
}
