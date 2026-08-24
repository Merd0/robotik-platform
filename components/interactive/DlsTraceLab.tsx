"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { NasilHesaplandi } from "@/components/interactive/NasilHesaplandi";
import { Neden } from "@/components/interactive/Neden";
import { forwardKinematics, inverseKinematicsNumerical, type NumericalIkResult } from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import { useComplexityMode, useDeclareComplexityModeSupport } from "@/components/ui/ComplexityModeProvider";
import { DebugPanel } from "@/components/ui/DebugPanel";

const robot = getRobotById("generic-2dof");
const round = (value: number, digits = 4) => Number.isFinite(value) ? value.toFixed(digits) : "—";
const toDegrees = (value: number) => value * 180 / Math.PI;
const toSvg = (point: { x: number; y: number }) => ({ x: 150 + point.x * 68, y: 150 - point.y * 68 });

const SOLVER_CONFIG = {
  initialGuess: [-0.55, 1.1],
  maxIterations: 80,
  tolerance: 0.001,
  maxStep: 0.2,
};

function solve(target: { x: number; y: number }, damping: number): NumericalIkResult {
  return inverseKinematicsNumerical(robot, { ...target, z: 0 }, {
    ...SOLVER_CONFIG,
    initialGuess: [...SOLVER_CONFIG.initialGuess],
    damping,
  });
}

/** Exposes every numerical IK iteration instead of hiding an analytical result behind animation. */
export function DlsTraceLab() {
  const record = useEvidenceRecorder();
  const { mode } = useComplexityMode();
  useDeclareComplexityModeSupport();
  const [target, setTarget] = useState({ x: 1.15, y: 0.65 });
  const [damping, setDamping] = useState(0.08);
  const [result, setResult] = useState<NumericalIkResult | null>(null);
  const [step, setStep] = useState(0);

  useSharedLabState("dls-trace", (shared) => {
    const restoredTarget = { x: shared.targetX, y: shared.targetY };
    setTarget(restoredTarget);
    setDamping(shared.damping);
    if (shared.solved) {
      const restoredResult = solve(restoredTarget, shared.damping);
      setResult(restoredResult);
      setStep(Math.min(shared.step, Math.max(0, restoredResult.trace.length - 1)));
    } else {
      setResult(null);
      setStep(0);
    }
  });

  const iteration = result?.trace[Math.min(step, Math.max(0, result.trace.length - 1))];
  const positions = useMemo(
    () => forwardKinematics(robot, iteration?.angles ?? [-0.55, 1.1]).jointPositions,
    [iteration],
  );
  const chartPoints = result?.trace.map((item, index, items) => {
    const x = items.length <= 1 ? 0 : index / (items.length - 1) * 260;
    const maximum = Math.max(...items.map((entry) => entry.errorNorm), 0.001);
    const y = 72 - Math.min(1, item.errorNorm / maximum) * 64;
    return `${x},${y}`;
  }).join(" ") ?? "";

  function run() {
    const next = solve(target, damping);
    setResult(next);
    setStep(0);
    const dampingBand = damping <= 0.02 ? "dusuk" : damping >= 0.08 ? "sonumlu" : "orta";
    record({
      skillId: "dls-convergence",
      stage: "observed",
      result: next.converged ? "success" : "retry",
      metrics: {
        dampingBand,
        damping,
        targetX: target.x,
        targetY: target.y,
        converged: next.converged,
        iterations: next.iterations,
        traceLength: next.trace.length,
        initialError: Number(round(next.trace[0]?.errorNorm ?? next.finalError)),
        finalError: Number(round(next.finalError)),
      },
    });
  }

  return (
    <section className="my-5 rounded-2xl border border-universite-ink/15 bg-universite-surface p-4 sm:p-5" aria-labelledby="dls-title">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-universite-accent">Yinelemeyi geri sar</p>
      <h3 id="dls-title" className="text-lg font-bold text-universite-ink">DLS yakınsama izi</h3>
      <p className="mt-1 text-sm text-universite-ink/75">Aynı başlangıç konumundan çalışır. λ değerini değiştirip hata eğrisini ve her eklem güncellemesini karşılaştır.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <svg viewBox="0 0 300 300" className="aspect-square w-full" role="img" aria-label={`DLS adımı ${step}; hedef x ${target.x.toFixed(2)}, y ${target.y.toFixed(2)} metre`}>
            <path d="M15 150 H285 M150 15 V285" stroke="currentColor" opacity=".14" />
            <circle cx={toSvg(target).x} cy={toSvg(target).y} r="7" fill="#f97316" />
            <polyline points={positions.map((position) => { const p = toSvg(position); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            {positions.map((position, index) => { const p = toSvg(position); return <circle key={index} cx={p.x} cy={p.y} r="5" fill="currentColor" />; })}
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          {(["x", "y"] as const).map((axis) => <label key={axis} className="text-sm text-universite-ink">Hedef {axis.toUpperCase()}: {target[axis].toFixed(2)} m
            <input type="range" min={axis === "x" ? 0.2 : -1.4} max={axis === "x" ? 1.7 : 1.4} step="0.05" value={target[axis]} onChange={(event) => { setTarget({ ...target, [axis]: Number(event.target.value) }); setResult(null); }} className="block h-11 w-full accent-universite-accent" />
          </label>)}
          <label className="text-sm text-universite-ink">Sönümleme λ: {damping.toFixed(3)}
            <input type="range" min="0.005" max="0.2" step="0.005" value={damping} onChange={(event) => { setDamping(Number(event.target.value)); setResult(null); }} className="block h-11 w-full accent-universite-accent" />
          </label>
          <button type="button" onClick={run} className="min-h-11 rounded-xl bg-universite-ink px-4 font-semibold text-universite-surface">80 adıma kadar çöz</button>
          <p className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3 text-sm" role="status">
            {!result
              ? "Henüz çalıştırılmadı."
              : result.converged
                ? `Yakınsadı · ${result.iterations} iterasyon · son hata ${round(result.finalError)} m`
                : `Yakınsamadı · son hata ${round(result.finalError)} m`}
            {result && (
              <>
                {" "}
                <Neden etiket="Neden bu sonuç?" varsayilanAcik={mode === "engineering"}>
                  λ = {damping.toFixed(3)} ile başladı; hata {round(result.trace[0]?.errorNorm ?? result.finalError)} m&apos;den{" "}
                  {result.iterations} adımda {round(result.finalError)} m&apos;ye {result.converged ? "düştü" : "indi ama hedefin altına inemedi"}.{" "}
                  {damping <= 0.02
                    ? "Küçük λ ham düzeltmeyi büyütür — hızlı ama daha yalpalayan bir yakınsama."
                    : damping >= 0.08
                      ? "Büyük λ düzeltmeyi küçültür — yavaş ama düzgün bir yakınsama."
                      : "Orta bir λ, hız ile kararlılık arasında bir denge kurdu."}
                </Neden>
              </>
            )}
          </p>
        </div>
      </div>

      {result && result.trace.length > 0 && <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-universite-ink/65">Hata normu / iterasyon</p>
          <svg viewBox="0 0 260 80" className="mt-2 h-24 w-full" role="img" aria-label="DLS hata normunun iterasyonlara göre azalışı"><polyline points={chartPoints} fill="none" stroke="#38bdf8" strokeWidth="3" /></svg>
          <label className="text-sm">İz adımı: {step} / {result.trace.length - 1}
            <input type="range" min="0" max={Math.max(0, result.trace.length - 1)} value={step} onChange={(event) => setStep(Number(event.target.value))} className="block h-11 w-full accent-universite-accent" />
          </label>
          <div className="mt-2 flex gap-2"><button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="min-h-11 flex-1 rounded-xl border border-universite-ink/15">Geri</button><button type="button" onClick={() => setStep((value) => Math.min(result.trace.length - 1, value + 1))} className="min-h-11 flex-1 rounded-xl border border-universite-ink/15">İleri</button></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-universite-ink/10 bg-universite-bg p-3 text-sm">
          <p className="font-semibold">Adım {iteration?.iteration}</p>
          <p>Hata: <span className="font-mono">{round(iteration?.errorNorm ?? NaN)} m</span></p>
          <table className="mt-2 w-full"><thead><tr><th className="text-left">Eklem</th><th className="text-right">Açı</th></tr></thead><tbody>{iteration?.angles.map((angle, index) => <tr key={index}><td>θ{index + 1}</td><td className="text-right font-mono">{round(toDegrees(angle), 2)}°</td></tr>)}</tbody></table>
        </div>
      </div>}

      <NasilHesaplandi
        ozet="Her adımda hata, Jacobian'ın sönümlü tersinden gelen bir düzeltmeyle küçültülüyor."
        className="mt-4 border-universite-ink/10 bg-universite-bg text-universite-ink"
        varsayilanAcik={mode === "engineering"}
      >
        <p className="font-mono text-xs">Δθ = Jᵀ (J Jᵀ + λ²I)⁻¹ · hata</p>
        <p className="mt-2">
          <code>J</code> her adımda mevcut eklem açılarından yeniden hesaplanan Jacobian, <code>λ</code>{" "}
          yukarıdaki sönümleme kaydırıcısı. λ küçüldükçe ham düzeltme büyür (tekillik yakınında
          J·Jᵀ terslenmesi zorlaşır) — ama robot aniden sıçramaz, çünkü her adımdaki gerçek açı
          değişimi ayrıca sabit bir üst sınırla kırpılır; küçük λ bu yüzden sıçrama değil, daha
          çok iterasyonda kararsız/yalpalayan bir yakınsama olarak görünür. λ büyüdükçe düzeltme
          küçülür, yakınsama yavaşlar ama düzgünleşir — sağdaki hata eğrisinde bunu λ değerini
          değiştirerek gözlemleyebilirsin. Kaynak kodu: <code>lib/robotics/kinematics.ts</code>{" "}
          içindeki <code>inverseKinematicsNumerical</code>.
        </p>
        {mode === "engineering" && iteration && (
          <p className="mt-2 font-mono text-xs" data-testid="engineering-detail">
            {(() => {
              const previous = result?.trace[step - 1]?.angles;
              if (!previous) return "Δθ: ilk adım, önceki eklem açısı yok.";
              return iteration.angles
                .map((angle, index) => `Δθ${index + 1}=${round(toDegrees(angle - previous[index]), 3)}°`)
                .join(" · ");
            })()}
          </p>
        )}
      </NasilHesaplandi>

      <DebugPanel
        className="mt-3"
        items={[
          { label: "başlangıç tahmini (θ1, θ2)", value: `${SOLVER_CONFIG.initialGuess[0].toFixed(2)}, ${SOLVER_CONFIG.initialGuess[1].toFixed(2)} rad` },
          { label: "maksimum iterasyon", value: String(SOLVER_CONFIG.maxIterations) },
          { label: "yakınsama toleransı", value: `${SOLVER_CONFIG.tolerance} m` },
          { label: "adım başına eklem sınırı", value: `${SOLVER_CONFIG.maxStep} rad` },
          ...(result ? [{ label: "bu koşuda kullanılan iterasyon", value: `${result.iterations} / ${SOLVER_CONFIG.maxIterations}` }] : []),
        ]}
      />

      <ExperimentShareButton
        seviye="universite"
        createShareUrl={() => createLabShareUrl({
          kind: "dls-trace",
          version: 1,
          targetX: target.x,
          targetY: target.y,
          damping,
          solved: result !== null,
          step,
        })}
      />
    </section>
  );
}
