"use client";

import { useMemo, useState } from "react";
import {
  FIRST_ACTION_OPTIONS,
  VERIFICATION_TEST_OPTIONS,
  generateFaultScenario,
} from "@/lib/robotics/faultInjection";
import {
  ERROR_MUSEUM_EXHIBITS,
  evaluateMuseumEvidence,
  type ErrorMuseumLevel,
  type MuseumEvidenceId,
} from "@/lib/robotics/errorMuseum";
import { FaultTracePanel } from "./FaultTracePanel";

const LEVEL_LABEL: Record<ErrorMuseumLevel, string> = {
  temel: "Temel · 1 kanal",
  orta: "Orta · 2 kanal, gecikme",
  ileri: "İleri · 2 kanal, komut karşılaştırması",
};

function evidenceValue(value: number, unit: string) {
  return unit === "ms" ? `${Math.round(value)} ms` : `${value.toFixed(3)} ${unit}`;
}

export function ErrorMuseum() {
  const [exhibitIndex, setExhibitIndex] = useState(0);
  const [selectedEvidence, setSelectedEvidence] = useState<MuseumEvidenceId | null>(null);
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [openedExhibits, setOpenedExhibits] = useState<readonly string[]>([]);
  const exhibit = ERROR_MUSEUM_EXHIBITS[exhibitIndex];
  const scenario = useMemo(() => generateFaultScenario(exhibit.seed), [exhibit.seed]);
  const safeAction = FIRST_ACTION_OPTIONS.find((option) => option.id === exhibit.safeAction)!.label;
  const verificationTest = VERIFICATION_TEST_OPTIONS.find((option) => option.id === exhibit.verificationTest)!.label;

  function openExhibit(nextIndex: number) {
    setExhibitIndex(nextIndex);
    setSelectedEvidence(null);
    setResult("idle");
  }

  function checkEvidence() {
    if (!selectedEvidence) {
      setResult("wrong");
      return;
    }
    const evaluation = evaluateMuseumEvidence(exhibit, selectedEvidence);
    setResult(evaluation.reveal ? "correct" : "wrong");
    if (evaluation.reveal) {
      setOpenedExhibits((current) => current.includes(exhibit.id) ? current : [...current, exhibit.id]);
    }
  }

  return (
    <section aria-labelledby="error-museum-title" className="rounded-2xl border border-site-border bg-site-soft p-4 shadow-sm sm:p-6">
      <header className="max-w-4xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">3 golden trace · 3 karşı örnek · veri toplama yok</p>
        <h2 id="error-museum-title" className="mt-2 font-heading text-3xl font-semibold text-site-ink">Semptomu değil, onu ayırt eden kanıtı biriktir.</h2>
        <p className="mt-3 text-sm leading-6 text-site-muted">Her eser aynı izi önce cazip ama yanlış bir zihinsel modelle gösterir. Doğru okuma, kök neden adını tahmin ederek değil, yanlış iddiayı gerçekten çürüten ölçümü seçerek açılır.</p>
        <p className="mt-2 text-sm leading-6 text-site-muted">Eserler kademeli zorlukla sıralı: Eser 01 tek kanaldan okunan basit bir sapma, Eser 03 iki kanalı karşılaştırmayı gerektiren daha dolaylı bir okuma ister. Sırayla ilerlemen önerilir ama zorunlu değil.</p>
      </header>

      <nav className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Hata Müzesi eserleri">
        {ERROR_MUSEUM_EXHIBITS.map((item, index) => (
          <button key={item.id} type="button" aria-current={index === exhibitIndex ? "page" : undefined} onClick={() => openExhibit(index)} className={`min-h-11 rounded-xl border p-3 text-left ${index === exhibitIndex ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-surface"}`}>
            <span className="flex items-center justify-between gap-2">
              <span className="block text-sm font-semibold text-site-ink">Eser {String(index + 1).padStart(2, "0")}</span>
              <span className="rounded-full border border-site-border bg-site-soft px-2 py-0.5 text-[11px] font-semibold text-site-muted">{LEVEL_LABEL[item.level]}</span>
            </span>
            <span className="mt-1 block text-xs text-site-muted">{openedExhibits.includes(item.id) ? "Doğru okuma açıldı" : "Karşı kanıt bekliyor"}</span>
          </button>
        ))}
      </nav>

      <article className="mt-6" aria-labelledby="museum-exhibit-title">
        <div className="rounded-2xl border border-site-border bg-site-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">Küratörlü sentetik vaka · seed {exhibit.seed}</p>
              <h3 id="museum-exhibit-title" className="mt-2 font-heading text-2xl font-semibold text-site-ink">{exhibit.title}</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-xl border border-site-border bg-site-soft px-3 py-2 text-xs font-semibold text-site-muted">Anonim · yerel · sabit</span>
              <span className="rounded-full border border-site-border bg-site-soft px-3 py-1 text-xs font-semibold text-site-muted">{LEVEL_LABEL[exhibit.level]}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-site-muted">{exhibit.symptom}</p>
          <div className="mt-4 rounded-xl border border-warning-border bg-warning-surface p-4 text-warning-ink">
            <p className="text-xs font-bold uppercase tracking-[.14em]">Cazip yanlış okuma</p>
            <p className="mt-2 font-heading text-xl font-semibold">{exhibit.misconception}</p>
            <p className="mt-2 text-sm leading-6">{exhibit.whyTempting}</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-site-muted">Seed {exhibit.seed} bu deterministik simülasyonu yeniden üretir; kullanıcı kaydı değildir ve gerçek bir kişiden toplanmış hata anlatısı içermez.</p>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-site-border bg-site-surface p-4" aria-labelledby="museum-evidence-title">
            <h3 id="museum-evidence-title" className="font-heading text-xl font-semibold text-site-ink">Hangi bulgu bu yorumu ayırt eder?</h3>
            <p className="mt-2 text-sm leading-6 text-site-muted">Büyük görünen sayıyı değil, yanlış iddianın mekanizmasını doğrudan sınayan ölçümü seç.</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Yanlış okumayı çürüten karşı kanıt</legend>
              <div className="grid gap-3">
                {exhibit.evidenceOptions.map((option) => (
                  <label key={option.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${selectedEvidence === option.id ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-soft"}`}>
                    <input type="radio" name="museum-evidence" checked={selectedEvidence === option.id} onChange={() => { setSelectedEvidence(option.id); setResult("idle"); }} className="mt-1 size-4 shrink-0 accent-teal-700" />
                    <span><strong className="block text-site-ink">{option.label}</strong><span className="mt-1 block font-mono text-xs text-site-muted">{evidenceValue(option.value, option.unit)}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="button" onClick={checkEvidence} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Karşı kanıtı sına</button>
            {result !== "idle" && (
              <div role="status" aria-label="Müze karşı kanıt geri bildirimi" className={`mt-4 rounded-xl border p-4 text-sm ${result === "correct" ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}>
                <strong>{result === "correct" ? "Karşı kanıt ayırt ediyor." : "Bu ölçüm tek başına ayırt etmiyor."}</strong> {result === "correct" ? "Yanlış modelin tahminini doğrudan sınadın; doğru okuma ve güvenli sıra açıldı." : "Bu değer bağlam sağlar ama seçilen yanlış mekanizmayı doğrudan çürütmüyor. İddianın hangi ölçümde farklı sonuç öngördüğünü ara."}
              </div>
            )}
          </section>

          <FaultTracePanel channels={exhibit.channels} samples={scenario.samples} faultStartsAtSeconds={scenario.faultStartsAtSeconds} />
        </div>

        {result === "correct" && (
          <section className="mt-6" aria-label="Açılan doğru vaka okuması">
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-warning-border bg-warning-surface p-4 text-warning-ink">
                <h3 className="font-heading text-2xl font-semibold">Yanlış okuma</h3>
                <p className="mt-3 text-sm leading-6">{exhibit.misconception} Bu yorum semptomu adlandırıyor, fakat ayırt edici ölçümü açıklamıyor.</p>
              </article>
              <article className="rounded-2xl border border-success-border bg-success-surface p-4 text-success-ink">
                <h3 className="font-heading text-2xl font-semibold">Doğru okuma</h3>
                <p className="mt-3 text-sm leading-6">{exhibit.correctInterpretation}</p>
              </article>
            </div>
            <div className="mt-4 rounded-2xl border border-site-border bg-site-surface p-4">
              <h3 className="font-heading text-xl font-semibold text-site-ink">Güvenli teşhis sırası</h3>
              <ol className="mt-3 grid gap-3 text-sm text-site-muted sm:grid-cols-2">
                <li className="rounded-xl bg-site-soft p-3"><strong className="block text-site-ink">1 · İlk eylem</strong><span className="mt-1 block leading-6">{safeAction}</span></li>
                <li className="rounded-xl bg-site-soft p-3"><strong className="block text-site-ink">2 · Ayırt eden test</strong><span className="mt-1 block leading-6">{verificationTest}</span></li>
              </ol>
            </div>
            <button type="button" onClick={() => openExhibit((exhibitIndex + 1) % ERROR_MUSEUM_EXHIBITS.length)} className="mt-4 min-h-11 rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink">Sıradaki esere geç</button>
          </section>
        )}
      </article>

      <p className="mt-6 rounded-xl border border-site-border bg-site-surface p-4 text-xs leading-5 text-site-muted"><strong className="text-site-ink">Model sınırı:</strong> Müzedeki üç eser, Arıza Kliniği’nin tek eksenli birinci dereceden eğitim plant’inden üretilir. “Bağımsız referans” bu simülasyonda oracle olan gerçek konumdur; sahada ayrı ve doğrulanmış bir ölçüm aracı gerekir. Gerçek servo, güvenlik PLC’si veya üretici denetleyicisi modellenmez; robota komut gönderilmez.</p>
    </section>
  );
}
