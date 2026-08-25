"use client";

import { useMemo, useState } from "react";
import {
  ROSETTA_SOURCES,
  ROSETTA_TASKS,
  buildVendorComparison,
  type RosettaTaskId,
} from "@/lib/robotics/vendorRosetta";

function CodePanel({ label, lines }: { label: string; lines: readonly string[] }) {
  return (
    <article className="min-w-0 rounded-2xl border border-site-border bg-slate-950 p-4 text-slate-100 sm:p-5">
      <h3 className="font-heading text-xl font-semibold text-white">{label}</h3>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-slate-900 p-4 text-sm leading-7" aria-label={`${label} salt okunur komut görünümü`}>
        <code>{lines.join("\n")}</code>
      </pre>
    </article>
  );
}

export function VendorRosettaLab() {
  const [taskId, setTaskId] = useState<RosettaTaskId>("joint-pose");
  const comparison = useMemo(() => buildVendorComparison(taskId), [taskId]);
  const { intent } = comparison.task;

  return (
    <section aria-labelledby="rosetta-title" className="rounded-[2rem] border border-site-border bg-site-soft p-4 shadow-sm sm:p-6">
      <header className="max-w-4xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">MoveIntent v1 · salt okunur</p>
        <h2 id="rosetta-title" className="mt-2 font-heading text-3xl font-semibold text-site-ink">Önce hareket niyeti, sonra üretici sözdizimi</h2>
        <p className="mt-3 text-sm leading-6 text-site-muted">Bu araç kod dönüştürmez. Aynı sentetik görevin iki kontrolör modelinde nerede ayrıştığını gösterir; çıktı indirilemez, çalıştırılamaz ve robota gönderilemez.</p>
      </header>

      <fieldset className="mt-6">
        <legend className="font-heading text-xl font-semibold text-site-ink">Karşılaştırılacak görev</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {ROSETTA_TASKS.map((task) => (
            <label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${taskId === task.id ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-surface"}`}>
              <input type="radio" name="rosetta-task" value={task.id} checked={taskId === task.id} onChange={() => setTaskId(task.id)} className="mt-1 size-4 shrink-0 accent-teal-700" />
              <span>
                <strong className="block text-sm text-site-ink">{task.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-site-muted">{task.prompt}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="mt-6 rounded-2xl border border-site-border bg-site-surface p-4 sm:p-5" aria-labelledby="move-intent-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id="move-intent-heading" className="font-heading text-xl font-semibold text-site-ink">Ortak semantik form</h3>
          <span className="rounded-full border border-site-border px-3 py-1 font-mono text-xs text-site-muted">{intent.motion === "joint" ? "joint-space" : "cartesian-linear"}</span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Hedef pose</dt><dd className="mt-1 font-mono text-xs leading-5 text-site-ink">[{intent.targetPose.join(", ")}]</dd></div>
          <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">İş çerçevesi</dt><dd className="mt-1 text-site-ink">fixture A · [{intent.workFramePose.slice(0, 3).join(", ")}] mm</dd></div>
          <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Takım</dt><dd className="mt-1 text-site-ink">toolLab · Z={intent.toolFramePose[2]} mm</dd></div>
          <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Hız niyeti</dt><dd className="mt-1 text-site-ink">Kontrollü gösterim</dd></div>
          <div className="rounded-xl bg-site-soft p-3"><dt className="font-semibold text-site-muted">Hedef geçişi</dt><dd className="mt-1 text-site-ink">{intent.stopAtTarget ? "Tam dur" : "Yumuşak geç"}</dd></div>
        </dl>
      </section>

      <p className="mt-6 rounded-xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-ink" role="status">{comparison.screenReaderSummary}</p>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <CodePanel label={comparison.outputs.abb.label} lines={comparison.outputs.abb.lines} />
        <CodePanel label={comparison.outputs.mecademic.label} lines={comparison.outputs.mecademic.lines} />
      </div>

      <section className="mt-6" aria-labelledby="semantic-trace-heading">
        <h3 id="semantic-trace-heading" className="font-heading text-2xl font-semibold text-site-ink">Beş ölçütlü semantik iz</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-site-muted">Satırları soldan sağa çevirmek yerine, aynı kararın her sistemde nerede ve hangi birimle yaşadığına bak.</p>
        <div className="mt-4 grid gap-4">
          {comparison.differences.map((row, index) => (
            <article key={row.id} className="rounded-2xl border border-site-border bg-site-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-heading text-lg font-semibold text-site-ink">{index + 1}. {row.label}</h4>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.equivalent ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}>{row.equivalent ? "Niyet yakın, sınırlar farklı" : "Birebir eşdeğer değil"}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-site-soft p-3"><p className="text-xs font-bold uppercase tracking-wide text-site-accent-text">ABB RAPID</p><p className="mt-2 text-sm leading-6 text-site-muted">{row.abb}</p></div>
                <div className="rounded-xl bg-site-soft p-3"><p className="text-xs font-bold uppercase tracking-wide text-site-accent-text">Mecademic</p><p className="mt-2 text-sm leading-6 text-site-muted">{row.mecademic}</p></div>
              </div>
              <p className="mt-3 text-sm leading-6 text-site-ink"><strong>Mühendislik sonucu:</strong> {row.consequence}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-6 rounded-2xl border border-site-border bg-site-surface p-4 text-sm leading-6 text-site-muted">
        <p><strong className="text-site-ink">Kaynak sınırı:</strong> Komut adları ve semantik notlar aşağıdaki sürümlü üretici kılavuzlarına dayanır. Controller seçeneği, robot modeli ve firmware değişirse davranış yeniden doğrulanmalıdır.</p>
        <ul className="mt-3 grid gap-2">
          {Object.values(ROSETTA_SOURCES).map((source) => (
            <li key={source.publisher}><a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-site-ink underline underline-offset-4">{source.publisher}: {source.document}</a></li>
          ))}
        </ul>
      </footer>
    </section>
  );
}
