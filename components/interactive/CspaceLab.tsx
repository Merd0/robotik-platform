"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { configurationCollides, type CircleObstacle } from "@/lib/robotics/learningLabs";
import { forwardKinematics } from "@/lib/robotics/kinematics";
import { getRobotById } from "@/lib/robotics/robots";
import { NasilHesaplandi } from "@/components/interactive/NasilHesaplandi";
import { useComplexityMode, useDeclareComplexityModeSupport } from "@/components/ui/ComplexityModeProvider";

const robot = getRobotById("generic-2dof");
const obstacle: CircleObstacle = { x: 0.72, y: 0.28, radius: 0.24 };
const radians = (degrees: number) => degrees * Math.PI / 180;
const workspacePoint = (point: { x: number; y: number }) => ({ x: 160 + point.x * 73, y: 160 - point.y * 73 });
const configurationPoint = (q1: number, q2: number) => ({ x: (q1 + 180) / 360 * 320, y: (180 - q2) / 360 * 320 });

const CELLS = Array.from({ length: 24 * 24 }, (_, index) => {
  const column = index % 24;
  const row = Math.floor(index / 24);
  const q1 = -180 + column * 15 + 7.5;
  const q2 = 180 - row * 15 - 7.5;
  return { column, row, collides: configurationCollides(robot, [radians(q1), radians(q2)], obstacle) };
});

/** Couples a real planar arm collision to its point in theta1/theta2 space. */
export function CspaceLab() {
  const record = useEvidenceRecorder();
  const { mode } = useComplexityMode();
  useDeclareComplexityModeSupport();
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [observed, setObserved] = useState({ safe: false, collision: false });

  useSharedLabState("cspace", (shared) => {
    setQ1(shared.q1);
    setQ2(shared.q2);
    setObserved(shared.observed);
  });
  const angles = useMemo(() => [radians(q1), radians(q2)], [q1, q2]);
  const positions = useMemo(() => forwardKinematics(robot, angles).jointPositions, [angles]);
  const collides = useMemo(() => configurationCollides(robot, angles, obstacle), [angles]);
  const config = configurationPoint(q1, q2);
  const obstacleSvg = workspacePoint(obstacle);

  function observe() {
    const kind = collides ? "collision" : "safe";
    setObserved((current) => ({ ...current, [kind]: true }));
    record({
      skillId: "configuration-space",
      stage: "observed",
      result: "success",
      metrics: {
        configuration: kind,
        collides,
        q1,
        q2,
        robotId: robot.id,
        obstacleX: obstacle.x,
        obstacleY: obstacle.y,
        obstacleRadius: obstacle.radius,
      },
    });
  }

  return (
    <section className="my-5 rounded-2xl border border-universite-ink/15 bg-universite-surface p-4 sm:p-5" aria-labelledby="cspace-title">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-universite-accent">Aynı durum · iki görünüm</p>
      <h3 id="cspace-title" className="text-lg font-bold text-universite-ink">İş uzayı ↔ konfigürasyon uzayı</h3>
      <p className="mt-1 text-sm text-universite-ink/75">Eklem açılarını değiştir. Soldaki robotun tamamı, sağdaki haritada tek bir (θ1, θ2) noktasıdır; koyu hücreler çarpışan konfigürasyonlardır.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <figure className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <figcaption className="text-xs font-bold uppercase tracking-wider text-universite-ink/65">İş uzayı · metre</figcaption>
          <svg viewBox="0 0 320 320" className="aspect-square w-full" role="img" aria-label={`İki eklemli robot ${collides ? "engelle çarpışıyor" : "engelden uzakta"}`}>
            <path d="M10 160 H310 M160 10 V310" stroke="currentColor" opacity=".12" />
            <circle cx={obstacleSvg.x} cy={obstacleSvg.y} r={obstacle.radius * 73} fill="#f97316" opacity=".8" />
            <polyline points={positions.map((point) => { const p = workspacePoint(point); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke={collides ? "#dc2626" : "#38bdf8"} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            {positions.map((point, index) => { const p = workspacePoint(point); return <circle key={index} cx={p.x} cy={p.y} r="6" fill="currentColor" />; })}
          </svg>
        </figure>

        <figure className="rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
          <figcaption className="text-xs font-bold uppercase tracking-wider text-universite-ink/65">C-space · derece</figcaption>
          <svg viewBox="0 0 320 320" className="aspect-square w-full" role="img" aria-label={`Konfigürasyon noktası theta 1 ${q1}, theta 2 ${q2} derece; ${collides ? "yasak bölge" : "serbest bölge"}`}>
            <rect width="320" height="320" fill="currentColor" opacity=".035" />
            {CELLS.filter((cell) => cell.collides).map((cell) => <rect key={`${cell.column}-${cell.row}`} x={cell.column * 320 / 24} y={cell.row * 320 / 24} width={320 / 24 + .4} height={320 / 24 + .4} fill="#f97316" opacity=".48" />)}
            <path d="M0 160 H320 M160 0 V320" stroke="currentColor" opacity=".35" />
            <circle cx={config.x} cy={config.y} r="7" fill={collides ? "#dc2626" : "#22c55e"} stroke="white" strokeWidth="2" />
            <text x="284" y="153" fontSize="10" fill="currentColor">θ1</text><text x="166" y="14" fontSize="10" fill="currentColor">θ2</text>
          </svg>
        </figure>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-universite-ink">θ1: {q1}°<input type="range" min="-180" max="180" step="5" value={q1} onChange={(event) => setQ1(Number(event.target.value))} className="block h-11 w-full accent-universite-accent" /></label>
        <label className="text-sm text-universite-ink">θ2: {q2}°<input type="range" min="-180" max="180" step="5" value={q2} onChange={(event) => setQ2(Number(event.target.value))} className="block h-11 w-full accent-universite-accent" /></label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={() => { setQ1(0); setQ2(0); }} className="min-h-11 rounded-xl border border-universite-ink/15 px-3">Serbest örneğe git · 0°, 0°</button>
        <button type="button" onClick={() => { setQ1(20); setQ2(0); }} className="min-h-11 rounded-xl border border-universite-ink/15 px-3">Çarpışan örneğe git · 20°, 0°</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={observe} className="min-h-11 rounded-xl bg-universite-ink px-4 font-semibold text-universite-surface">Bu konfigürasyonu kaydet</button>
        <p className={`text-sm font-semibold ${collides ? "text-red-700 dark:text-red-300" : "text-success-ink"}`} role="status">{collides ? "Çarpışma: bu nokta C-space'te yasak." : "Serbest: bu nokta geçerli bir konfigürasyon."}</p>
      </div>
      <p className="mt-2 text-xs text-universite-ink/65">Gözlem görevi: bir serbest ve bir çarpışan konfigürasyon kaydet. Serbest {observed.safe ? "✓" : "○"} · Çarpışan {observed.collision ? "✓" : "○"}</p>

      <NasilHesaplandi
        ozet="Sağdaki nokta doğrudan (θ1, θ2)'den geliyor; soldaki kol, aynı açıların forwardKinematics'ten hesaplanan eklem konumlarıdır."
        className="mt-3 border-universite-ink/10 bg-universite-bg text-universite-ink"
        varsayilanAcik={mode === "engineering"}
      >
        <p>
          İki görünüm aynı durumun iki farklı izdüşümü: iş uzayındaki kol tamamen <code>forwardKinematics</code>{" "}
          çıktısıyla çizilir, C-space&apos;teki nokta ise sadece açı çiftinin kendisidir.
        </p>
        {mode === "engineering" && (
          <p className="mt-2 font-mono text-xs" data-testid="engineering-detail">
            q=({radians(q1).toFixed(3)}, {radians(q2).toFixed(3)}) rad ·{" "}
            {positions.map((point, index) => `eklem${index}=(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`).join(" · ")}
          </p>
        )}
      </NasilHesaplandi>

      <ExperimentShareButton
        seviye="universite"
        createShareUrl={() => createLabShareUrl({
          kind: "cspace",
          version: 1,
          q1,
          q2,
          observed,
        })}
      />
    </section>
  );
}
