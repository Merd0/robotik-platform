"use client";

import { useMemo, useState } from "react";
import {
  INVERSE_PROBLEM_CHALLENGES,
  evaluateInverseAttempt,
  registerInverseSolution,
  type InverseProblemAttempt,
} from "@/lib/robotics/inverseProblem";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { genericTwoDofRobot } from "@/lib/robotics/robots/genericTwoDof";

type ProblemMode = "forward" | "inverse";

const round = (value: number, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function ArmDiagram({ attempt, target, showTarget }: {
  attempt: InverseProblemAttempt;
  target: { x: number; y: number };
  showTarget: boolean;
}) {
  const positions = forwardKinematics(
    genericTwoDofRobot,
    attempt.anglesDegrees.map((angle) => angle * Math.PI / 180),
  ).jointPositions;
  const width = 560;
  const height = 360;
  const scale = 135;
  const x = (value: number) => width / 2 + value * scale;
  const y = (value: number) => height - 55 - value * scale;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`İki eklemli kol. TCP x ${round(attempt.tcp.x)}, y ${round(attempt.tcp.y)} metre.${showTarget ? ` Hedefe hata ${round(attempt.errorMeters)} metre.` : " İleri problem modunda hedef gizli."}`}>
      <line x1="32" y1={y(0)} x2={width - 32} y2={y(0)} stroke="currentColor" opacity=".18" />
      <line x1={x(0)} y1="28" x2={x(0)} y2={height - 28} stroke="currentColor" opacity=".18" />
      {showTarget && (
        <>
          <line x1={x(attempt.tcp.x)} y1={y(attempt.tcp.y)} x2={x(target.x)} y2={y(target.y)} stroke="#b45309" strokeWidth="2" strokeDasharray="6 5" />
          <circle cx={x(target.x)} cy={y(target.y)} r="13" fill="none" stroke="#b45309" strokeWidth="4" />
          <line x1={x(target.x) - 18} y1={y(target.y)} x2={x(target.x) + 18} y2={y(target.y)} stroke="#b45309" strokeWidth="2" />
          <line x1={x(target.x)} y1={y(target.y) - 18} x2={x(target.x)} y2={y(target.y) + 18} stroke="#b45309" strokeWidth="2" />
        </>
      )}
      <polyline points={positions.map((point) => `${x(point.x)},${y(point.y)}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      {positions.map((point, index) => <circle key={index} cx={x(point.x)} cy={y(point.y)} r={index === positions.length - 1 ? 9 : 7} fill={index === positions.length - 1 ? "#0f766e" : "#f8fafc"} stroke="#0f766e" strokeWidth="4" />)}
    </svg>
  );
}

export function InverseProblemLab() {
  const [mode, setMode] = useState<ProblemMode>("inverse");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [angles, setAngles] = useState<[number, number]>([0, 0]);
  const [solutions, setSolutions] = useState<readonly InverseProblemAttempt[]>([]);
  const [message, setMessage] = useState("Hedef TCP verildi. Bu çıktıyı üreten iki farklı açı çifti bul.");
  const problem = INVERSE_PROBLEM_CHALLENGES[challengeIndex];
  const attempt = useMemo(() => evaluateInverseAttempt(problem, angles), [problem, angles]);

  function updateAngle(index: number, value: number) {
    setAngles((current) => current.map((angle, angleIndex) => angleIndex === index ? value : angle) as [number, number]);
  }

  function reset(nextIndex = challengeIndex) {
    setChallengeIndex(nextIndex);
    setAngles([0, 0]);
    setSolutions([]);
    setMessage("Hedef TCP verildi. Bu çıktıyı üreten iki farklı açı çifti bul.");
  }

  function saveAttempt() {
    const registration = registerInverseSolution(solutions, attempt);
    setSolutions(registration.solutions);
    if (registration.status === "miss") {
      setMessage(`Henüz hedefte değilsin. TCP hatası ${round(attempt.errorMeters)} m; kesikli hata çizgisini küçült.`);
    } else if (registration.status === "first-saved") {
      setMessage(`İlk çözüm kaydedildi: dirsek ${attempt.branch === "up" ? "yukarı" : "aşağı"}. Aynı hedef için karşı dirsek dalını bul.`);
    } else if (registration.status === "same-branch") {
      setMessage("Bu açı çifti hedefe ulaşıyor ama ilk çözümle aynı dirsek dalında. İkinci çözüm için J2 işaretini değiştirip J1'i yeniden ayarla.");
    } else {
      setMessage("İki farklı çözüm doğrulandı. Aynı TCP çıktısı iki ayrı eklem duruşundan üretildi.");
    }
  }

  const complete = solutions.length === 2;

  return (
    <section aria-labelledby="inverse-problem-title" className="rounded-2xl border border-site-border bg-site-soft p-4 shadow-sm sm:p-6">
      <header className="max-w-4xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">Seed {problem.seed} · gerçek FK geri bildirimi</p>
        <h2 id="inverse-problem-title" className="mt-2 font-heading text-3xl font-semibold text-site-ink">Girdiyi değil, istenen çıktıyı ver</h2>
        <p className="mt-3 text-sm leading-6 text-site-muted">İleri problem “bu açılarda TCP nerede?” diye sorar. Ters problem yönü değiştirir: TCP hedefi sabittir; onu üreten eklem açılarını sen bulursun.</p>
      </header>

      <fieldset className="mt-6">
        <legend className="font-heading text-xl font-semibold text-site-ink">Problem yönü</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${mode === "forward" ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-surface"}`}>
            <input type="radio" name="problem-mode" checked={mode === "forward"} onChange={() => setMode("forward")} className="mt-1 size-4 accent-teal-700" />
            <span><strong className="block text-site-ink">İleri · açılar → TCP</strong><span className="mt-1 block text-xs leading-5 text-site-muted">Açıları seç, tek uç nokta sonucunu doğrudan oku.</span></span>
          </label>
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${mode === "inverse" ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-surface"}`}>
            <input type="radio" name="problem-mode" checked={mode === "inverse"} onChange={() => setMode("inverse")} className="mt-1 size-4 accent-teal-700" />
            <span><strong className="block text-site-ink">Ters · TCP → açılar</strong><span className="mt-1 block text-xs leading-5 text-site-muted">Sabit çıktıya ulaşan iki farklı girdi çözümünü ara.</span></span>
          </label>
        </div>
      </fieldset>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-site-border bg-site-surface p-4">
          <h3 className="font-heading text-xl font-semibold text-site-ink">Eklem girdileri</h3>
          <div className="mt-4 grid gap-4">
            {angles.map((angle, index) => (
              <label key={index} className="grid gap-2 text-sm font-semibold text-site-ink">
                <span>J{index + 1} açısı: <output>{round(angle, 0)}°</output></span>
                <input aria-label={`J${index + 1} açısı`} type="range" min="-180" max="180" step="1" value={angle} onChange={(event) => updateAngle(index, Number(event.target.value))} className="h-11 w-full touch-pan-y accent-teal-700" />
              </label>
            ))}
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Mevcut TCP</dt><dd className="mt-1 font-mono text-site-ink">x {round(attempt.tcp.x)} · y {round(attempt.tcp.y)} m</dd></div>
            {mode === "inverse" && <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Hedef TCP</dt><dd className="mt-1 font-mono text-site-ink">x {round(problem.target.x)} · y {round(problem.target.y)} m</dd></div>}
            {mode === "inverse" && <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Öklid hata</dt><dd className="mt-1 font-mono text-site-ink">{round(attempt.errorMeters)} m · tolerans {problem.toleranceMeters} m</dd></div>}
          </dl>
          {mode === "inverse" && (
            <button type="button" onClick={saveAttempt} disabled={complete} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-40">Bu çözümü sınayarak kaydet</button>
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-site-border bg-site-surface p-4 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-xl font-semibold text-site-ink">2B kinematik prova</h3>
            <span className="font-mono text-xs text-site-muted">Genel 2-DOF · a1 1.0 m · a2 0.8 m</span>
          </div>
          <ArmDiagram attempt={attempt} target={problem.target} showTarget={mode === "inverse"} />
          <p className="text-sm leading-6 text-site-muted">Turkuaz kol mevcut açıların gerçek ileri kinematik sonucudur. {mode === "inverse" ? "Amber halka hedefi, kesikli çizgi kalan TCP hatasını gösterir." : "İleri modda hedef verilmez; seçtiğin girdinin çıktısını gözlersin."}</p>
        </div>
      </div>

      {mode === "inverse" && (
        <div className={`mt-6 rounded-xl border p-4 ${complete ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`} role="status" aria-label="Ters problem geri bildirimi" aria-live="polite">
          <p className="font-semibold">{message}</p>
          <p className="mt-2 text-sm">Çözüm dalları: dirsek yukarı {solutions.some((solution) => solution.branch === "up") ? "✓" : "○"} · dirsek aşağı {solutions.some((solution) => solution.branch === "down") ? "✓" : "○"}</p>
        </div>
      )}

      {complete && (
        <section className="mt-6 rounded-2xl border border-success-border bg-success-surface p-4" aria-labelledby="inverse-result-title">
          <h3 id="inverse-result-title" className="font-heading text-2xl font-semibold text-success-ink">Tek çıktı, iki geçerli girdi</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {solutions.map((solution, index) => (
              <div key={solution.branch} className="rounded-xl border border-success-border p-3 text-sm text-success-ink"><strong>Çözüm {index + 1} · dirsek {solution.branch === "up" ? "yukarı" : "aşağı"}</strong><p className="mt-1 font-mono">J1 {round(solution.anglesDegrees[0], 1)}° · J2 {round(solution.anglesDegrees[1], 1)}° · hata {round(solution.errorMeters)} m</p></div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-success-ink">İleri kinematik belirli bir açı çiftinden tek TCP üretir. Ters yönde ise aynı TCP için birden fazla eklem duruşu olabilir; görev bu yüzden yalnız “hedefe ulaştın mı?” değil, “hangi çözüm dalındasın?” diye de bakar.</p>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => reset()} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink">Açıları ve kayıtları sıfırla</button>
        <button type="button" onClick={() => reset((challengeIndex + 1) % INVERSE_PROBLEM_CHALLENGES.length)} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink">Yeni hedef</button>
      </div>

      <p className="mt-6 rounded-xl border border-site-border bg-site-surface p-4 text-xs leading-5 text-site-muted"><strong className="text-site-ink">Model sınırı:</strong> Bu görev tam eklem limitli genel 2-DOF düzlemsel kolun kinematiğini kullanır. Çarpışma, tork, kablo sarımı ve gerçek robot güvenliği modellenmez; gerçek robota komut gönderilmez.</p>
    </section>
  );
}
