"use client";

import type { Seviye } from "@/lib/content";
import { useEvidenceRecorder, useLessonEvidence } from "./LessonEvidenceProvider";

export function LessonCompletionPanel({ seviye }: { seviye: Seviye }) {
  const summary = useLessonEvidence();
  const record = useEvidenceRecorder();
  const stages = [
    { label: "Okundu", done: summary.read, detail: "İçeriği inceledin" },
    { label: "Denendi", done: summary.tried, detail: "Sahneyi değiştirdin" },
    { label: "Kanıtlandı", done: summary.passed, detail: "Transferi çözdün" },
  ];
  return (
    <section data-seviye={seviye} className="lab-panel p-5" aria-labelledby="ilerleme-baslik">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-teal-800">Yerel beceri kaydı</p><h2 id="ilerleme-baslik" className="mt-1 font-heading text-xl font-semibold">Ders ilerlemen</h2></div>{!summary.read && <button type="button" onClick={() => record({ skillId: "lesson-reading", stage: "read", result: "success" })} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Okumayı kaydet</button>}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">{stages.map((stage) => <div key={stage.label} className={`rounded-xl border p-3 ${stage.done ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><strong className="flex items-center gap-2 text-sm"><span aria-hidden="true">{stage.done ? "✓" : "○"}</span>{stage.label}</strong><span className="mt-1 block text-xs text-slate-600">{stage.detail}</span></div>)}</div>
      <p className="mt-3 text-xs text-slate-500">“Okudum” başarı değildir. Kanıtlandı durumu yalnızca dersin transfer görevinden gelir.</p>
    </section>
  );
}
