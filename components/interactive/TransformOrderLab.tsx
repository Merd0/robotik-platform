"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { rotationZ, translation } from "@/lib/robotics/transform";
import {
  composePlanarTransform,
  transformedFrame,
  type TransformOrder,
} from "@/lib/robotics/learningLabs";

const round = (value: number) => Math.abs(value) < 0.0005 ? "0.000" : value.toFixed(3);

function pointToSvg(point: { x: number; y: number }) {
  return { x: 150 + point.x * 75, y: 145 - point.y * 75 };
}

const SIRA_ETIKETI: Record<TransformOrder, string> = {
  "translation-then-rotation": "Önce ötele, sonra döndür",
  "rotation-then-translation": "Önce döndür, sonra ötele",
};

const SIRA_CARPIM: Record<TransformOrder, string> = {
  "translation-then-rotation": "R × T",
  "rotation-then-translation": "T × R",
};

const SIRA_RENGI: Record<TransformOrder, string> = {
  "translation-then-rotation": "#0d9488",
  "rotation-then-translation": "#a855f7",
};

/** İki sıranın ilk adımı farklı: biri önce öteler, öbürü önce döndürür. */
function ilkAdimMatrisi(order: TransformOrder, angleRadians: number) {
  return order === "translation-then-rotation" ? translation(1, 0, 0) : rotationZ(angleRadians);
}

function CerceveCizimi({
  frame,
  renk,
  kalinlik,
  kesikli,
  etiket,
  etiketKaydir = { dx: 9, dy: -8 },
}: {
  frame: ReturnType<typeof transformedFrame>;
  renk: string;
  kalinlik: number;
  kesikli?: boolean;
  etiket?: string;
  /* 90°'de "1. adım" ile T × R sonucu AYNI noktaya düşüyor (ötelemeyi önce
     yapmak, döndürüp öteleyenin bittiği yer). Bu güzel bir tesadüf ama
     etiketler üst üste biniyor; o yüzden etiket kayması dışarıdan verilir. */
  etiketKaydir?: { dx: number; dy: number };
}) {
  const origin = pointToSvg(frame.origin);
  const xAxis = pointToSvg(frame.xAxis);
  const yAxis = pointToSvg(frame.yAxis);
  return (
    <g>
      <line x1={origin.x} y1={origin.y} x2={xAxis.x} y2={xAxis.y} stroke={renk} strokeWidth={kalinlik} strokeDasharray={kesikli ? "4 4" : undefined} strokeLinecap="round" />
      <line x1={origin.x} y1={origin.y} x2={yAxis.x} y2={yAxis.y} stroke={renk} strokeWidth={kalinlik * 0.7} strokeDasharray={kesikli ? "4 4" : undefined} strokeLinecap="round" opacity="0.75" />
      <circle cx={origin.x} cy={origin.y} r={kalinlik + 1.5} fill={renk} />
      {etiket && <text x={origin.x + etiketKaydir.dx} y={origin.y + etiketKaydir.dy} fontSize="9" fontWeight="700" fill={renk}>{etiket}</text>}
    </g>
  );
}

/**
 * Rotation, translation, matrix and frame geometry share one deterministic model.
 *
 * Yeniden düzenleme gerekçesi: sahne, tahmin verilene kadar tamamen boştu —
 * kullanıcıdan ekranda hiçbir şey yokken "orijin hangi eksende daha çok
 * kayar" sorusuna cevap vermesi isteniyordu, sonuç da tek bir çerçeve ve bir
 * 4×4 matris tablosu olarak çıkıyordu. İki sıra hiçbir zaman yan yana
 * görünmediği için "sıra neden önemli" sorusu görsel olarak hiç
 * cevaplanmıyordu. Artık başlangıç çerçevesi ve öteleme oku baştan duruyor,
 * seçilen sıranın ARA ADIMI çiziliyor ve iki sıranın sonucu aynı sahnede
 * karşılaştırılıyor; matris tablosu ikincil bir ayrıntıya indi.
 */
export function TransformOrderLab() {
  const record = useEvidenceRecorder();
  const [order, setOrder] = useState<TransformOrder>("translation-then-rotation");
  const [angleDegrees, setAngleDegrees] = useState(90);
  const [prediction, setPrediction] = useState<"x" | "y" | null>(null);
  const [revealed, setRevealed] = useState(false);

  useSharedLabState("transform-order", (shared) => {
    setOrder(shared.order);
    setAngleDegrees(shared.angleDegrees);
    setPrediction(shared.prediction);
    setRevealed(shared.revealed);
  });

  const angleRadians = angleDegrees * Math.PI / 180;
  const digerSira: TransformOrder = order === "translation-then-rotation" ? "rotation-then-translation" : "translation-then-rotation";

  const matrix = useMemo(() => composePlanarTransform(order, angleRadians, 1), [angleRadians, order]);
  const frame = useMemo(() => transformedFrame(matrix), [matrix]);
  const digerFrame = useMemo(() => transformedFrame(composePlanarTransform(digerSira, angleRadians, 1)), [angleRadians, digerSira]);
  const araFrame = useMemo(() => transformedFrame(ilkAdimMatrisi(order, angleRadians)), [angleRadians, order]);
  const baslangicFrame = useMemo(() => transformedFrame(translation(0, 0, 0)), []);

  const dominantDirection = Math.abs(frame.origin.y) > Math.abs(frame.origin.x) ? "y" : "x";
  const ayrim = Math.hypot(frame.origin.x - digerFrame.origin.x, frame.origin.y - digerFrame.origin.y);
  const origin = pointToSvg(frame.origin);
  const digerOrigin = pointToSvg(digerFrame.origin);
  const tahminOku = prediction === "y" ? pointToSvg({ x: 0, y: 1 }) : pointToSvg({ x: 1, y: 0 });

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
      metrics: {
        order,
        angleDegrees,
        prediction,
        correctPrediction: success,
        outputX: Number(round(frame.origin.x)),
        outputY: Number(round(frame.origin.y)),
        comparisonDistance: Number(round(ayrim)),
      },
    });
  }

  return (
    <section className="my-5 rounded-2xl border border-universite-ink/15 bg-universite-surface p-4 sm:p-5" aria-labelledby="transform-lab-title">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-universite-accent">Tahmin → uygula → iki sırayı karşılaştır</p>
        <h3 id="transform-lab-title" className="text-lg font-bold text-universite-ink">Dönüşüm sırası laboratuvarı</h3>
        <p className="text-sm text-universite-ink/75">Aynı iki işlem: çerçeveyi {angleDegrees}° döndür ve X yönünde 1 m ötele. Sırayı değiştir, çerçevenin nerede bittiğini gör.</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]">
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <svg viewBox="0 0 300 220" className="aspect-[4/3] w-full" role="img" aria-label={revealed
            ? `İki işlem sırasının sonucu. ${SIRA_ETIKETI[order]}: orijin x ${round(frame.origin.x)}, y ${round(frame.origin.y)} metre. ${SIRA_ETIKETI[digerSira]}: orijin x ${round(digerFrame.origin.x)}, y ${round(digerFrame.origin.y)} metre. İki sonuç arasındaki mesafe ${round(ayrim)} metre.`
            : "Başlangıç çerçevesi orijinde duruyor; X yönündeki 1 metrelik öteleme ok ile gösteriliyor. Sonuç, tahmin verildikten sonra çizilecek."}>
            <path d="M20 145 H280 M150 15 V205" stroke="currentColor" opacity=".18" />
            <text x="276" y="139" fontSize="10" fill="currentColor">X</text>
            <text x="156" y="20" fontSize="10" fill="currentColor">Y</text>

            {/* Başlangıç durumu artık baştan görünüyor: kullanıcı boş ekrana
                bakarak tahmin etmiyor. */}
            <CerceveCizimi frame={baslangicFrame} renk="currentColor" kalinlik={2.5} etiket="başlangıç" />

            {!revealed && (
              <>
                <path d={`M150 145 L${pointToSvg({ x: 1, y: 0 }).x} 145`} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity=".5" />
                <text x="190" y="160" fontSize="8.5" fill="currentColor" opacity=".65">1 m öteleme</text>
                {prediction && (
                  <>
                    <path d={`M150 145 L${tahminOku.x} ${tahminOku.y}`} stroke="var(--color-durum-uyari)" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
                    <text x={tahminOku.x + 6} y={tahminOku.y + 4} fontSize="9" fontWeight="700" fill="var(--color-durum-uyari)">tahminin</text>
                  </>
                )}
              </>
            )}

            {revealed && <>
              {/* Seçilen sıranın ARA adımı: sıranın neden önemli olduğu
                  ancak birinci işlemin sonucu görülünce anlaşılıyor. */}
              <CerceveCizimi frame={araFrame} renk={SIRA_RENGI[order]} kalinlik={2} kesikli etiket="1. adım" etiketKaydir={{ dx: -2, dy: 20 }} />
              <path d={`M${digerOrigin.x} ${digerOrigin.y} L${origin.x} ${origin.y}`} stroke="var(--color-durum-uyari)" strokeWidth="1.5" strokeDasharray="4 4" />
              <CerceveCizimi frame={digerFrame} renk={SIRA_RENGI[digerSira]} kalinlik={3} etiket={SIRA_CARPIM[digerSira]} />
              <CerceveCizimi frame={frame} renk={SIRA_RENGI[order]} kalinlik={4.5} etiket={SIRA_CARPIM[order]} />
              <text x={(origin.x + digerOrigin.x) / 2 - 12} y={(origin.y + digerOrigin.y) / 2 - 5} fontSize="9" fontWeight="700" fill="var(--color-durum-uyari)">fark {round(ayrim)} m</text>
            </>}
          </svg>

          {revealed && (
            <ul className="mt-2 grid gap-1 text-xs">
              {([order, digerSira] as const).map((sira) => (
                <li key={sira} className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: SIRA_RENGI[sira] }} />
                  <span className={sira === order ? "font-bold text-universite-ink" : "text-universite-ink/70"}>
                    {SIRA_ETIKETI[sira]} ({SIRA_CARPIM[sira]}) → orijin ({round(transformedFrame(composePlanarTransform(sira, angleRadians, 1)).origin.x)}, {round(transformedFrame(composePlanarTransform(sira, angleRadians, 1)).origin.y)}) m
                    {sira === order ? " · seçtiğin sıra" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <fieldset>
            <legend className="text-sm font-semibold text-universite-ink">1. Fiziksel işlem sırası</legend>
            <div className="mt-2 grid gap-2">
              {(["translation-then-rotation", "rotation-then-translation"] as const).map((sira) => (
                <button key={sira} type="button" onClick={() => changeOrder(sira)} aria-pressed={order === sira} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${order === sira ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}>
                  <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: SIRA_RENGI[sira] }} />
                  {SIRA_ETIKETI[sira]} · {SIRA_CARPIM[sira]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="text-sm text-universite-ink">Dönüş: {angleDegrees}°
            <input type="range" min="0" max="180" step="15" value={angleDegrees} onChange={(event) => { setAngleDegrees(Number(event.target.value)); setPrediction(null); setRevealed(false); }} className="block h-11 w-full accent-universite-accent" />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold text-universite-ink">2. Seçtiğin sırada orijin daha çok hangi eksende yer değiştirir?</legend>
            <div className="mt-2 flex gap-2">
              {(["x", "y"] as const).map((axis) => <button key={axis} type="button" onClick={() => setPrediction(axis)} aria-pressed={prediction === axis} className={`min-h-11 flex-1 rounded-xl border ${prediction === axis ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}>{axis.toUpperCase()} ekseni</button>)}
            </div>
          </fieldset>
          <button type="button" onClick={run} disabled={!prediction} className="min-h-11 rounded-xl bg-universite-ink px-4 font-semibold text-universite-surface disabled:opacity-40">Dönüşümü uygula</button>
        </div>
      </div>

      {revealed && <div className="mt-4 grid gap-3" aria-live="polite">
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3 text-sm">
          <p className={prediction === dominantDirection ? "font-semibold text-success-ink" : "font-semibold text-warning-ink"}>
            {prediction === dominantDirection
              ? `Tahmin ölçümle uyuştu: orijin ${dominantDirection.toUpperCase()} ekseninde daha çok yer değiştirdi.`
              : `Tahminin şaştı: orijin ${dominantDirection.toUpperCase()} ekseninde daha çok yer değiştirdi.`}
          </p>
          {/* "Neden farklı" sorusunun matris tablosuna bakmadan cevabı. */}
          <p className="mt-3 font-semibold text-universite-ink">Neden iki sonuç farklı?</p>
          <p className="mt-1 text-universite-ink/80">
            Dönme her zaman <strong>orijinin etrafında</strong> olur — dönen şey çerçevenin kendisi değil, çerçevenin orijine göre konumudur.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-universite-ink/80">
            <li><strong>Önce ötelersen:</strong> çerçeve X’te 1 m uzaklaşır, sonra bu uzaklığın tamamı orijin etrafında döner. Ötelemenin kendisi de dönmüş olur.</li>
            <li><strong>Önce döndürürsen:</strong> çerçeve yerinde döner, orijini hiç kıpırdamaz; öteleme sonra ve dönmemiş dünya ekseninde uygulanır.</li>
          </ul>
          <p className="mt-2 text-universite-ink/80">
            İki işlem aynı, sıra farklı, sonuç {round(ayrim)} m uzakta. Matris dilinde söylenişi: çarpma değişmeli değildir, <span className="font-mono">R × T ≠ T × R</span>.
          </p>
        </div>

        <details className="overflow-x-auto rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <summary className="min-h-11 cursor-pointer py-2 text-xs font-bold uppercase tracking-wider text-universite-ink/65">Seçtiğin sıranın 4×4 matrisi · metre</summary>
          <table className="mt-2 w-full border-collapse font-mono text-xs"><tbody>{matrix.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, colIndex) => <td key={colIndex} className="border border-universite-ink/10 px-2 py-1 text-right">{round(value)}</td>)}</tr>)}</tbody></table>
          <p className="mt-2 text-xs text-universite-ink/65">Son sütun çerçeve orijinini taşır: ({round(frame.origin.x)}, {round(frame.origin.y)}, 0) m.</p>
        </details>
      </div>}

      <ExperimentShareButton
        seviye="universite"
        createShareUrl={() => createLabShareUrl({
          kind: "transform-order",
          version: 1,
          order,
          angleDegrees,
          prediction,
          revealed,
        })}
      />
    </section>
  );
}
