"use client";

import { jointVelocityProfile, type RobotCellMotionPlan } from "@/lib/robotics/robotCellMotion";

const RAD_TO_DEG = 180 / Math.PI;
const JOINT_COLORS = ["#0f766e", "#c2410c", "#7c3aed", "#0369a1", "#b91c1c", "#65a30d"] as const;
const TCP_AXES = [
  { key: "x", label: "X", color: "#0f766e" },
  { key: "y", label: "Y", color: "#c2410c" },
  { key: "z", label: "Z", color: "#7c3aed" },
] as const;

interface ChartPoint {
  t: number;
  value: number;
}

interface ChartSeries {
  label: string;
  color: string;
  points: ChartPoint[];
}

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 84;
const PADDING = 6;

/**
 * `components/playground/JointTimeChart.tsx`nin (Faz 5, /oyun-alani) aynı
 * el yapımı SVG deseni — yeni bağımlılık eklemek yerine (docs/08 minimum
 * bağımlılık ilkesi) kanıtlanmış bu yaklaşım genelleştirildi: JointTimeChart
 * yalnız eklem açısına özeldi, bu bileşen açı/hız/TCP konumu gibi keyfi
 * seri kümelerini çizebiliyor.
 */
function MiniLineChart({ series, unit, ariaLabel, className = "" }: {
  series: ChartSeries[];
  unit: string;
  ariaLabel: string;
  className?: string;
}) {
  const allPoints = series.flatMap((serie) => serie.points);
  if (allPoints.length < 2) return null;

  const times = allPoints.map((point) => point.t);
  const values = allPoints.map((point) => point.value);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const spanT = Math.max(1e-6, maxT - minT);
  const spanV = Math.max(1e-6, maxV - minV);
  const usableWidth = VIEW_WIDTH - PADDING * 2;
  const usableHeight = VIEW_HEIGHT - PADDING * 2;
  const xFor = (t: number) => PADDING + ((t - minT) / spanT) * usableWidth;
  const yFor = (value: number) => PADDING + usableHeight - ((value - minV) / spanV) * usableHeight;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="w-full" role="img" aria-label={ariaLabel}>
        <line x1={PADDING} y1={VIEW_HEIGHT - PADDING} x2={VIEW_WIDTH - PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" opacity=".2" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" opacity=".2" />
        {series.map((serie) => (
          <polyline
            key={serie.label}
            points={serie.points.map((point) => `${xFor(point.t)},${yFor(point.value)}`).join(" ")}
            fill="none"
            stroke={serie.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-site-muted">
        {series.map((serie) => (
          <span key={serie.label} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ backgroundColor: serie.color }} />
            {serie.label}
          </span>
        ))}
        <span className="opacity-70">
          {minV.toFixed(1)}{unit} – {maxV.toFixed(1)}{unit} · 0–{maxT.toFixed(2)} s
        </span>
      </div>
    </div>
  );
}

function jointAngleSeries(plan: RobotCellMotionPlan): ChartSeries[] {
  const jointCount = plan.samples[0]?.jointAngles.length ?? 0;
  return Array.from({ length: jointCount }, (_, jointIndex) => ({
    label: `θ${jointIndex + 1}`,
    color: JOINT_COLORS[jointIndex % JOINT_COLORS.length],
    points: plan.samples.map((sample, index) => ({
      t: plan.sampleTimesSeconds[index],
      value: sample.jointAngles[jointIndex] * RAD_TO_DEG,
    })),
  }));
}

function jointVelocitySeries(plan: RobotCellMotionPlan): ChartSeries[] {
  const profile = jointVelocityProfile(plan);
  const jointCount = profile[0]?.degPerSecond.length ?? 0;
  return Array.from({ length: jointCount }, (_, jointIndex) => ({
    label: `θ${jointIndex + 1}`,
    color: JOINT_COLORS[jointIndex % JOINT_COLORS.length],
    points: profile.map((sample) => ({ t: sample.tSeconds, value: sample.degPerSecond[jointIndex] })),
  }));
}

function tcpPositionSeries(plan: RobotCellMotionPlan): ChartSeries[] {
  return TCP_AXES.map(({ key, label, color }) => ({
    label,
    color,
    points: plan.samples.map((sample, index) => ({ t: plan.sampleTimesSeconds[index], value: sample.tcp[key] })),
  }));
}

/**
 * `plan.samples`/`plan.sampleTimesSeconds`/`jointVelocityProfile`in ürettiği
 * zaten hesaplı veriyi üç zaman grafiğine (eklem açısı, eklem hızı, TCP
 * konumu) döker — hiçbiri dekoratif ya da uydurma değil. Varsayılan KAPALI
 * `<details>` içinde (docs/16 "ekranı sürekli doldurma" uyarısı, aynı
 * dosyadaki "Modelin sınırları" panelinin bitişiğinde aynı desen).
 */
export function RobotCellMotionCharts({ plan, label }: { plan: RobotCellMotionPlan; label: string }) {
  if (plan.samples.length < 2) return null;
  const totalSeconds = plan.sampleTimesSeconds.at(-1) ?? 0;

  return (
    <details className="mt-3 rounded-xl border border-site-border bg-site-soft p-3 text-xs leading-5 text-site-muted">
      <summary className="min-h-11 cursor-pointer font-semibold text-site-ink">
        {label} zaman grafiği · {totalSeconds.toFixed(2)} s
      </summary>
      <div className="mt-3 grid gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-site-subtle">Eklem açısı / zaman</p>
          <MiniLineChart
            series={jointAngleSeries(plan)}
            unit="°"
            ariaLabel={`${label} eklem açısı zaman grafiği, ${totalSeconds.toFixed(2)} saniye`}
            className="mt-1"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-site-subtle">Eklem hızı / zaman</p>
          <MiniLineChart
            series={jointVelocitySeries(plan)}
            unit="°/s"
            ariaLabel={`${label} eklem hızı zaman grafiği, ardışık örnekler arası türetilmiş`}
            className="mt-1"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-site-subtle">TCP konumu / zaman</p>
          <MiniLineChart
            series={tcpPositionSeries(plan)}
            unit=" m"
            ariaLabel={`${label} TCP konumu zaman grafiği, metre cinsinden`}
            className="mt-1"
          />
        </div>
      </div>
    </details>
  );
}
