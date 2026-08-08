"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  composePlanarTransform,
  transformedFrame,
  type TransformOrder,
} from "@/lib/robotics/learningLabs";

const round = (value: number) => Math.abs(value) < 0.0005 ? "0.000" : value.toFixed(3);

function pointToSvg(point: { x: number; y: number }) {
  return { x: 150 + point.x * 75, y: 145 - point.y * 75 };
}

/** Rotation, translation, matrix and frame geometry share one deterministic model. */
export function TransformOrderLab() {
  const record = useEvidenceRecorder();
  const [order, setOrder] = useState<TransformOrder>("translation-then-rotation");
  const [angleDegrees, setAngleDegrees] = useState(90);
  const [prediction, setPrediction] = useState<"x" | "y" | null>(null);
  const [revealed, setRevealed] = useState(false);

  const matrix = useMemo(
    () => composePlanarTransform(order, angleDegrees * Math.PI / 180, 1),
    [angleDegrees, order],
  );
  const frame = useMemo(() => transformedFrame(matrix), [matrix]);
  const origin = pointToSvg(frame.origin);
  const xAxis = pointToSvg(frame.xAxis);
  const yAxis = pointToSvg(frame.yAxis);
  const dominantDirection = Math.abs(frame.origin.y) > Math.abs(frame.origin.x) ? "y" : "x";

  function changeOrder(next: TransformOrder) {
    setOrder(next);
    setPrediction(null);
    setRevealed(false);
  }

  function run() {
    if (!prediction) return;
    setRevealed(true);
    const success = prediction === dominantDirection;
    record({ skillId: "transform-order", stage: "predicted", result: "neutral", metrics: { prediction } });
    record({
      skillId: "transform-order",
      stage: "observed",
      result: success ? "success" : "retry",
      metrics: { order, angleDegrees, outputX: Number(round(frame.origin.x)), outputY: Number(round(frame.origin.y)) },
    });
  }

  return (
    <section className="my-5 rounded-2xl border border-universite-ink/15 bg-universite-surface p-4 sm:p-5" aria-labelledby="transform-lab-title">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-universite-accent">Tahmin → uygula → matrisi doğrula</p>
        <h3 id="transform-lab-title" className="text-lg font-bold text-universite-ink">Dönüşüm sırası laboratuvarı</h3>
        <p className="text-sm text-universite-ink/75">Birim çerçeveyi 90° döndür ve X yönünde 1 m ötele. İşlem sırasının orijini nereye taşıdığını ölç.</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]">
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <svg viewBox="0 0 300 220" className="aspect-[4/3] w-full" role="img" aria-label={revealed ? `Dönüşmüş çerçeve orijini x ${round(frame.origin.x)}, y ${round(frame.origin.y)} metre` : "Sonuç tahmin edilene kadar gizli koordinat sahnesi"}>
            <path d="M20 145 H280 M150 15 V205" stroke="currentColor" opacity=".18" />
            <text x="276" y="139" fontSize="10" fill="currentColor">X</text>
            <text x="156" y="20" fontSize="10" fill="currentColor">Y</text>
            {revealed && <>
              <line x1={origin.x} y1={origin.y} x2={xAxis.x} y2={xAxis.y} stroke="#ef4444" strokeWidth="4" />
              <line x1={origin.x} y1={origin.y} x2={yAxis.x} y2={yAxis.y} stroke="#22c55e" strokeWidth="4" />
              <circle cx={origin.x} cy={origin.y} r="7" fill="#38bdf8" />
              <path d={`M150 145 L${origin.x} ${origin.y}`} stroke="currentColor" strokeDasharray="5 5" opacity=".55" />
            </>}
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <fieldset>
            <legend className="text-sm font-semibold text-universite-ink">1. Fiziksel işlem sırası</legend>
            <div className="mt-2 grid gap-2">
              <button type="button" onClick={() => changeOrder("translation-then-rotation")} aria-pressed={order === "translation-then-rotation"} className={`min-h-11 rounded-xl border px-3 text-left text-sm ${order === "translation-then-rotation" ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}>Önce ötele, sonra döndür · R × T</button>
              <button type="button" onClick={() => changeOrder("rotation-then-translation")} aria-pressed={order === "rotation-then-translation"} className={`min-h-11 rounded-xl border px-3 text-left text-sm ${order === "rotation-then-translation" ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}>Önce döndür, sonra ötele · T × R</button>
            </div>
          </fieldset>
          <label className="text-sm text-universite-ink">Dönüş: {angleDegrees}°
            <input type="range" min="0" max="180" step="15" value={angleDegrees} onChange={(event) => { setAngleDegrees(Number(event.target.value)); setPrediction(null); setRevealed(false); }} className="block h-11 w-full accent-universite-accent" />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold text-universite-ink">2. Orijin daha çok hangi eksende yer değiştirir?</legend>
            <div className="mt-2 flex gap-2">
              {(["x", "y"] as const).map((axis) => <button key={axis} type="button" onClick={() => setPrediction(axis)} aria-pressed={prediction === axis} className={`min-h-11 flex-1 rounded-xl border ${prediction === axis ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}>{axis.toUpperCase()} ekseni</button>)}
            </div>
          </fieldset>
          <button type="button" onClick={run} disabled={!prediction} className="min-h-11 rounded-xl bg-universite-ink px-4 font-semibold text-universite-surface disabled:opacity-40">Dönüşümü uygula</button>
        </div>
      </div>

      {revealed && <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" aria-live="polite">
        <div className="overflow-x-auto rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-universite-ink/65">Canlı 4×4 matris · metre</p>
          <table className="w-full border-collapse font-mono text-xs"><tbody>{matrix.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, colIndex) => <td key={colIndex} className="border border-universite-ink/10 px-2 py-1 text-right">{round(value)}</td>)}</tr>)}</tbody></table>
        </div>
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3 text-sm">
          <p className="font-semibold">Çerçeve orijini</p>
          <p className="font-mono">({round(frame.origin.x)}, {round(frame.origin.y)}, 0) m</p>
          <p className={prediction === dominantDirection ? "mt-2 text-success-ink" : "mt-2 text-warning-ink"}>{prediction === dominantDirection ? "Tahmin ölçümle uyuştu." : "Tahmininle ölçüm farklı. Matrisin son sütununu izle."}</p>
        </div>
      </div>}
    </section>
  );
}
