"use client";

import type { FaultSample } from "@/lib/robotics/faultInjection";

export type FaultChannel = "position" | "actuation" | "network";

interface ChartSeries {
  label: string;
  color: string;
  dash?: string;
  value: (sample: FaultSample) => number;
}

const CHANNELS: Record<FaultChannel, {
  title: string;
  unit: string;
  series: readonly ChartSeries[];
  summary: (samples: readonly FaultSample[]) => string;
}> = {
  position: {
    title: "Konum",
    unit: "normalize konum",
    series: [
      { label: "Hedef", color: "#475569", dash: "6 4", value: (sample) => sample.setpoint },
      { label: "Ölçülen", color: "#0f766e", value: (sample) => sample.measuredPosition },
    ],
    summary: (samples) => {
      const maxError = Math.max(...samples.map((sample) => Math.abs(sample.setpoint - sample.measuredPosition)));
      return `En büyük hedef–ölçüm farkı ${maxError.toFixed(3)}.`;
    },
  },
  actuation: {
    title: "Kontrol komutu",
    unit: "normalize komut",
    series: [
      { label: "İstenen", color: "#7c3aed", dash: "6 4", value: (sample) => sample.requestedControl },
      { label: "Uygulanan", color: "#c2410c", value: (sample) => sample.appliedControl },
    ],
    summary: (samples) => {
      const maxGap = Math.max(...samples.map((sample) => Math.abs(sample.requestedControl - sample.appliedControl)));
      return `İstenen–uygulanan komut arasındaki en büyük fark ${maxGap.toFixed(3)}.`;
    },
  },
  network: {
    title: "Paket yaşı",
    unit: "ms",
    series: [
      { label: "Mesaj yaşı", color: "#0369a1", value: (sample) => sample.packetAgeMs },
    ],
    summary: (samples) => `En yüksek mesaj yaşı ${Math.max(...samples.map((sample) => sample.packetAgeMs)).toFixed(0)} ms.`,
  },
};

const WIDTH = 640;
const HEIGHT = 190;
const PADDING_X = 32;
const PADDING_Y = 18;

function FaultChart({ channel, samples, faultStartsAtSeconds }: {
  channel: FaultChannel;
  samples: readonly FaultSample[];
  faultStartsAtSeconds: number;
}) {
  const config = CHANNELS[channel];
  const values = config.series.flatMap((serie) => samples.map(serie.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueSpan = Math.max(1e-6, maxValue - minValue);
  const maxTime = samples.at(-1)?.tSeconds ?? 1;
  const xFor = (time: number) => PADDING_X + (time / maxTime) * (WIDTH - PADDING_X * 2);
  const yFor = (value: number) => PADDING_Y + (1 - (value - minValue) / valueSpan) * (HEIGHT - PADDING_Y * 2);
  const faultX = xFor(faultStartsAtSeconds);

  return (
    <article className="min-w-0 rounded-2xl border border-site-border bg-site-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold text-site-ink">{config.title}</h3>
        <span className="font-mono text-xs text-site-muted">0–{maxTime.toFixed(1)} s · {config.unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${config.title} zaman grafiği. ${config.summary(samples)}`}
      >
        <line x1={PADDING_X} y1={HEIGHT - PADDING_Y} x2={WIDTH - PADDING_X} y2={HEIGHT - PADDING_Y} stroke="currentColor" opacity=".18" />
        <line x1={PADDING_X} y1={PADDING_Y} x2={PADDING_X} y2={HEIGHT - PADDING_Y} stroke="currentColor" opacity=".18" />
        <line x1={faultX} y1={PADDING_Y} x2={faultX} y2={HEIGHT - PADDING_Y} stroke="#b91c1c" strokeWidth="2" strokeDasharray="3 5" />
        <text x={Math.min(faultX + 6, WIDTH - 92)} y={PADDING_Y + 11} fill="#991b1b" fontSize="11">arıza enjekte edildi</text>
        {config.series.map((serie) => (
          <polyline
            key={serie.label}
            points={samples.map((sample) => `${xFor(sample.tSeconds)},${yFor(serie.value(sample))}`).join(" ")}
            fill="none"
            stroke={serie.color}
            strokeWidth="3"
            strokeDasharray={serie.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-site-muted">
        {config.series.map((serie) => (
          <span key={serie.label} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-0.5 w-5" style={{ backgroundColor: serie.color }} />
            {serie.label}{serie.dash ? " (kesikli)" : " (düz)"}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm leading-6 text-site-muted">{config.summary(samples)}</p>
    </article>
  );
}

export function FaultTracePanel({ channels, samples, faultStartsAtSeconds }: {
  channels: readonly FaultChannel[];
  samples: readonly FaultSample[];
  faultStartsAtSeconds: number;
}) {
  if (channels.length === 0) {
    return (
      <aside className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-site-border bg-site-soft p-8 text-center" aria-label="Telemetri alanı">
        <div>
          <p className="font-heading text-xl font-semibold text-site-ink">Henüz kanal açık değil</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-site-muted">Soldan bir gözlem kanalı seç. Arızanın adı verilmez; yalnız ölçtüğün izi görürsün.</p>
        </div>
      </aside>
    );
  }

  const tableSamples = samples.filter((_, index) => index % 20 === 0 || index === samples.length - 1);
  const tableColumns: readonly { label: string; value: (sample: FaultSample) => string }[] = [
    { label: "t (s)", value: (sample) => sample.tSeconds.toFixed(2) },
    ...(channels.includes("position") ? [
      { label: "Hedef", value: (sample: FaultSample) => sample.setpoint.toFixed(3) },
      { label: "Ölçüm", value: (sample: FaultSample) => sample.measuredPosition.toFixed(3) },
    ] : []),
    ...(channels.includes("actuation") ? [
      { label: "İstenen", value: (sample: FaultSample) => sample.requestedControl.toFixed(3) },
      { label: "Uygulanan", value: (sample: FaultSample) => sample.appliedControl.toFixed(3) },
    ] : []),
    ...(channels.includes("network") ? [
      { label: "Yaş (ms)", value: (sample: FaultSample) => sample.packetAgeMs.toFixed(0) },
    ] : []),
  ];

  return (
    <aside className="grid min-w-0 content-start gap-4" aria-label="Seçilen telemetri kanalları">
      {channels.map((channel) => (
        <FaultChart key={channel} channel={channel} samples={samples} faultStartsAtSeconds={faultStartsAtSeconds} />
      ))}
      <details className="min-w-0 rounded-xl border border-site-border bg-site-surface p-4 text-sm text-site-muted">
        <summary className="min-h-11 cursor-pointer font-semibold text-site-ink">Örneklenmiş veriyi tablo olarak göster</summary>
        <div className="mt-3 w-full max-w-full overflow-x-auto">
          <table className="min-w-[560px] border-collapse text-left font-mono text-xs">
            <caption className="sr-only">Seçilen telemetri izinden yaklaşık birer saniyelik örnekler</caption>
            <thead><tr className="border-b border-site-border">{tableColumns.map((column) => <th key={column.label} className="p-2">{column.label}</th>)}</tr></thead>
            <tbody>
              {tableSamples.map((sample) => (
                <tr key={sample.tSeconds} className="border-b border-site-border/60">
                  {tableColumns.map((column) => <td key={column.label} className="p-2">{column.value(sample)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </aside>
  );
}
