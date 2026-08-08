"use client";

import type { Seviye } from "@/lib/content";
import { useState } from "react";
import { clearEvidenceEvents, getEvidenceEvents, serializeEvidence } from "@/lib/evidence";
import { useEvidencePersistence, useEvidenceRecorder, useLessonEvidence } from "./LessonEvidenceProvider";

export function LessonCompletionPanel({ seviye }: { seviye: Seviye }) {
  const summary = useLessonEvidence();
  const persistence = useEvidencePersistence();
  const record = useEvidenceRecorder();
  const [confirmClear, setConfirmClear] = useState(false);
  const stages = [
    { label: "Okundu", done: summary.read, detail: "İçeriği inceledin" },
    { label: "Denendi", done: summary.tried, detail: "Sahneyi değiştirdin" },
    {
      label: summary.hasPredicate ? "Kanıtlandı" : "Kanıt tanımsız",
      done: summary.passed,
      detail: summary.hasPredicate
        ? "Deney koşulu ve kavram kontrolü geçti"
        : "Bu ders için doğrulanmış performans ölçütü henüz yayımlanmadı",
    },
  ];

  function exportEvidence() {
    const blob = new Blob([serializeEvidence(getEvidenceEvents())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "robotik-deney-kaydi-v2.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section data-seviye={seviye} className="lab-panel p-5" aria-labelledby="ilerleme-baslik">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Yerel beceri kaydı</p><h2 id="ilerleme-baslik" className="mt-1 font-heading text-xl font-semibold">Ders ilerlemen</h2></div>{!summary.read && <button type="button" onClick={() => record({ skillId: "lesson-reading", stage: "read", result: "success" })} className="min-h-11 rounded-xl border border-site-border px-4 py-2 text-sm font-semibold">Okumayı kaydet</button>}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">{stages.map((stage) => <div key={stage.label} className={`rounded-xl border p-3 ${stage.done ? "border-success-border bg-success-surface" : "border-site-border bg-site-soft"}`}><strong className="flex items-center gap-2 text-sm"><span aria-hidden="true">{stage.done ? "✓" : "○"}</span>{stage.label}</strong><span className="mt-1 block text-xs text-site-muted">{stage.detail}</span></div>)}</div>
      <p className="mt-3 text-xs text-site-subtle">“Okudum” ve doğru kavram yanıtı tek başına başarı değildir. Kanıtlandı durumu yalnızca kayıtlı deney koşulu ölçülebilir olayları doğruladığında oluşur.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-site-border pt-4 text-xs text-site-muted">
        <span role="status">Kayıt: {persistence === "local" ? "yalnız bu tarayıcıda kalıcı" : "geçici bellek; tarayıcı depolaması kullanılamıyor"}</span>
        <button type="button" onClick={exportEvidence} className="min-h-11 rounded-lg border border-site-border px-3 font-semibold text-site-ink">JSON dışa aktar</button>
        {!confirmClear ? (
          <button type="button" onClick={() => setConfirmClear(true)} className="min-h-11 rounded-lg border border-site-border px-3 font-semibold text-site-ink">Yerel kaydı sil</button>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span>Bu tarayıcıdaki tüm deney kayıtları silinecek.</span>
            <button type="button" onClick={() => { clearEvidenceEvents(); setConfirmClear(false); }} className="min-h-11 rounded-lg border border-red-600 px-3 font-semibold text-red-700 dark:text-red-300">Silmeyi onayla</button>
            <button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 rounded-lg border border-site-border px-3">Vazgeç</button>
          </span>
        )}
      </div>
    </section>
  );
}
