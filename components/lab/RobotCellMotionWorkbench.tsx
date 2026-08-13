"use client";

import type { RobotCellMotionKind, RobotCellMotionPlan } from "@/lib/robotics/robotCellMotion";

const RAD_TO_DEG = 180 / Math.PI;

export const ROBOT_CELL_MOTION_TARGETS = {
  inspection: {
    label: "Kontrol noktası",
    jointDegrees: [10, 43, 24, 2, 98, 0],
    purpose: "Çalışma alanının üstündeki boş bir referans noktası. İki güvenli yolun şekil ve hareket farkını burada karşılaştır.",
  },
  narrow: {
    label: "Dar geçiş",
    jointDegrees: [-60, 0, 0, 7, 95, 0],
    purpose: "Hedef erişilebilir; fakat yaklaşım fikstür hacmini kesiyor. Geçerli bir hedef, güvenli bir yol demek değildir.",
  },
} as const;

export type RobotCellMotionTargetId = keyof typeof ROBOT_CELL_MOTION_TARGETS;

export function describeMotionStatus(plan: RobotCellMotionPlan): string {
  if (plan.status === "safe") return "Geçiş temiz";
  if (plan.status === "collision") return `${plan.firstIssue?.obstacleLabel ?? "Hücre elemanı"} · L${(plan.firstIssue?.linkIndex ?? 0) + 1} teması`;
  if (plan.status === "ik-failure") return "IK ara noktayı çözemedi";
  return "Eklem limiti aşıldı";
}

function MotionResultCard({ label, plan }: { label: "MoveJ" | "MoveL"; plan: RobotCellMotionPlan }) {
  const safe = plan.status === "safe";
  return (
    <div data-testid={`${plan.kind}-result`} className={`rounded-2xl border p-4 ${safe ? "border-success-border bg-success-surface" : "border-rose-400/50 bg-rose-950/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-site-subtle">{label} sonucu</span>
          <strong className={`mt-1 block ${safe ? "text-success-ink" : "text-rose-700 dark:text-rose-300"}`}>{safe ? "✓" : "!"} {describeMotionStatus(plan)}</strong>
        </div>
        <span className="font-mono text-[10px] uppercase text-site-subtle">{plan.samples.length} örnek</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-site-muted">
        <div><dt>TCP yolu</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{plan.tcpDistanceMetres.toFixed(3)} m</dd></div>
        <div><dt>Eklem yolu</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{(plan.jointTravelRadians * RAD_TO_DEG).toFixed(0)}°</dd></div>
        <div><dt>Teorik en az</dt><dd className="mt-1 font-mono font-semibold text-site-ink">{plan.estimatedDurationSeconds.toFixed(2)} s</dd></div>
      </dl>
    </div>
  );
}

export function RobotCellMotionSettings({
  targetId,
  selectedMotion,
  moveJPlan,
  moveLPlan,
  onSelectTarget,
  onSelectMotion,
}: {
  targetId: RobotCellMotionTargetId;
  selectedMotion: RobotCellMotionKind;
  moveJPlan: RobotCellMotionPlan;
  moveLPlan: RobotCellMotionPlan;
  onSelectTarget: (target: RobotCellMotionTargetId) => void;
  onSelectMotion: (kind: RobotCellMotionKind) => void;
}) {
  const target = ROBOT_CELL_MOTION_TARGETS[targetId];
  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Motion lab · yol ön kontrolü</p>
      <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-site-ink">Aynı hedefe iki farklı hareket</h3>
      <p className="mt-2 text-sm leading-6 text-site-muted">Önce hedefi, sonra robotun o hedefe hangi hareket türüyle gideceğini seç. Sarı nişangâh hedefi; mor ve yeşil çizgiler olası TCP yollarını gösterir.</p>

      <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-site-subtle"><span className="grid size-6 place-items-center rounded-full bg-site-strong font-mono text-site-on-strong">1</span>Hedefi seç</p>
      <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Prova hedefi">
        {(Object.entries(ROBOT_CELL_MOTION_TARGETS) as Array<[RobotCellMotionTargetId, (typeof ROBOT_CELL_MOTION_TARGETS)[RobotCellMotionTargetId]]>).map(([id, option]) => (
          <button key={id} type="button" aria-pressed={targetId === id} onClick={() => onSelectTarget(id)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${targetId === id ? "border-site-accent bg-site-accent text-site-on-accent" : "border-site-border bg-site-surface text-site-muted"}`}>{option.label} hedefi</button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-site-muted">
        <strong className="block text-site-ink">Bu hedef neden var?</strong>
        {target.purpose}
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-site-subtle"><span className="grid size-6 place-items-center rounded-full bg-site-strong font-mono text-site-on-strong">2</span>Hareket türünü seç</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <button type="button" aria-pressed={selectedMotion === "movej"} onClick={() => onSelectMotion("movej")} className={`min-h-14 rounded-2xl border px-4 text-left ${selectedMotion === "movej" ? "border-violet-500 bg-violet-500/10" : "border-site-border bg-site-surface"}`}><strong className="flex items-center gap-2 text-site-ink"><span className="size-2.5 rounded-full bg-violet-400" aria-hidden="true" />MoveJ yolunu seç</strong><span className="mt-1 block text-xs text-site-muted">Eklemler doğrusal · TCP eğrisel</span></button>
        <button type="button" aria-pressed={selectedMotion === "movel"} onClick={() => onSelectMotion("movel")} className={`min-h-14 rounded-2xl border px-4 text-left ${selectedMotion === "movel" ? "border-teal-500 bg-teal-500/10" : "border-site-border bg-site-surface"}`}><strong className="flex items-center gap-2 text-site-ink"><span className="size-2.5 rounded-full bg-teal-400" aria-hidden="true" />MoveL yolunu seç</strong><span className="mt-1 block text-xs text-site-muted">TCP doğrusal · IK ardışık</span></button>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Ön kontrol sonucu</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <MotionResultCard label="MoveJ" plan={moveJPlan} />
        <MotionResultCard label="MoveL" plan={moveLPlan} />
      </div>

      <details className="mt-4 rounded-xl border border-site-border bg-site-soft p-3 text-xs leading-5 text-site-muted">
        <summary className="min-h-11 cursor-pointer font-semibold text-site-ink">Modelin sınırları</summary>
        MoveL yalnız TCP konumunu doğrusal izler. Takım yönelimi, robotun kendi gövdesiyle çarpışması, ivme ve jerk henüz modellenmez. Süre gerçek çevrim süresi değil, RobotSpec hız limitinden çıkan teorik alt sınırdır.
      </details>
    </div>
  );
}

export function RobotCellMotionTransport({
  selectedPlan,
  selectedMotion,
  motionProgress,
  playing,
  onProgress,
  onPlay,
  onShowCollision,
}: {
  selectedPlan: RobotCellMotionPlan;
  selectedMotion: RobotCellMotionKind;
  motionProgress: number;
  playing: boolean;
  onProgress: (progress: number) => void;
  onPlay: () => void;
  onShowCollision: () => void;
}) {
  const collision = selectedPlan.firstIssue?.reason === "collision";
  return (
    <div className="grid items-center gap-3 lg:grid-cols-[auto_minmax(220px,1fr)_auto]">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onPlay} disabled={selectedPlan.samples.length < 2} className="min-h-11 min-w-40 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 disabled:opacity-45"><span className="mr-2 font-mono" aria-hidden="true">3</span>{playing ? "Duraklat" : collision ? "Çarpışmaya kadar oynat" : "Seçili provayı oynat"}</button>
        <button type="button" onClick={onShowCollision} disabled={!selectedPlan.firstIssue} className="min-h-11 rounded-xl border border-slate-600 bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-35">Çarpışmaya kadar göster</button>
      </div>
      <label className="block min-w-0">
        <span className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-200"><span>{selectedMotion === "movej" ? "MoveJ" : "MoveL"} zaman çizgisi</span><output className="font-mono">%{Math.round(motionProgress * 100)}</output></span>
        <input aria-label="Hareket provası ilerlemesi" type="range" min="0" max="100" step="1" value={Math.round(motionProgress * 100)} onChange={(event) => onProgress(Number(event.target.value) / 100)} className="mt-1 h-11 w-full touch-pan-y accent-teal-300" />
      </label>
      <p className={`max-w-64 text-xs leading-5 ${selectedPlan.status === "safe" ? "text-emerald-300" : "text-rose-300"}`} aria-live="polite">
        <strong className="block">{describeMotionStatus(selectedPlan)}</strong>
        {selectedPlan.status === "safe" ? "49 örnek boyunca temas bulunmadı." : "Pembe işaret ilk problemli örnektir."}
      </p>
    </div>
  );
}
