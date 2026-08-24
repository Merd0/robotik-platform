"use client";

import { useMemo, useState } from "react";
import {
  FAULT_INFO,
  FAULT_KINDS,
  FIRST_ACTION_OPTIONS,
  VERIFICATION_TEST_OPTIONS,
  evaluateFaultDiagnosis,
  generateFaultScenario,
  type FaultDiagnosisSelection,
  type FaultFirstAction,
  type FaultKind,
  type FaultVerificationTest,
} from "@/lib/robotics/faultInjection";
import { FaultTracePanel, type FaultChannel } from "./FaultTracePanel";

const CASE_SEEDS = [240823, 240824, 240825] as const;
const CHANNEL_OPTIONS: readonly { id: FaultChannel; label: string; description: string }[] = [
  { id: "position", label: "Konum", description: "Hedef ile ölçülen konumu karşılaştırır." },
  { id: "actuation", label: "Kontrol komutu", description: "İstenen ve gerçekten uygulanan komutu gösterir." },
  { id: "network", label: "Paket yaşı", description: "Ölçüm paketinin kaç milisaniye eski olduğunu gösterir." },
];
type Stage = "observe" | "hypothesis" | "action" | "verification" | "result";

const STAGE_LABELS: Record<Stage, string> = {
  observe: "1/4 · Gözlem",
  hypothesis: "2/4 · Hipotez",
  action: "3/4 · Güvenli ilk eylem",
  verification: "4/4 · Doğrulama testi",
  result: "Sonuç",
};

function RadioChoices<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="font-heading text-xl font-semibold text-site-ink">{legend}</legend>
      <div className="mt-4 grid gap-3">
        {options.map((option) => (
          <label key={option.id} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 ${value === option.id ? "border-site-accent bg-site-accent-soft text-site-ink" : "border-site-border bg-site-surface text-site-muted"}`}>
            <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} className="mt-1 size-4 shrink-0 accent-teal-700" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NextButton({ children, disabled, onClick }: { children: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

export function FaultInjectionLab() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("observe");
  const [channels, setChannels] = useState<FaultChannel[]>([]);
  const [hypothesis, setHypothesis] = useState<FaultKind | null>(null);
  const [firstAction, setFirstAction] = useState<FaultFirstAction | null>(null);
  const [verificationTest, setVerificationTest] = useState<FaultVerificationTest | null>(null);
  const scenario = useMemo(() => generateFaultScenario(CASE_SEEDS[caseIndex]), [caseIndex]);
  const diagnosis = stage === "result" && hypothesis && firstAction && verificationTest
    ? evaluateFaultDiagnosis(scenario, { hypothesis, firstAction, verificationTest })
    : null;

  function resetDiagnosis(nextCaseIndex = caseIndex, preserveChannels = false) {
    setCaseIndex(nextCaseIndex);
    setStage("observe");
    if (!preserveChannels) setChannels([]);
    setHypothesis(null);
    setFirstAction(null);
    setVerificationTest(null);
  }

  function toggleChannel(channel: FaultChannel) {
    setChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : current.length < 2 ? [...current, channel] : current);
  }

  const hypothesisOptions = FAULT_KINDS.map((id) => ({ id, label: FAULT_INFO[id].label }));
  const resultMessage = diagnosis?.passed
    ? "Teşhis doğrulandı. Kök neden, güvenli ilk eylem ve doğrulama testi birbiriyle tutarlı."
    : diagnosis && !diagnosis.safeAction
      ? "Güvenli ilk eylem uyuşmuyor. Arızayı doğru adlandırsan bile sistemi daha fazla zorlayan müdahale başarı sayılmaz."
      : diagnosis && !diagnosis.rootCauseMatched
        ? "Kök neden hipotezi telemetriyle uyuşmuyor. Açtığın kanallardaki imzayı yeniden karşılaştır."
        : "Doğrulama testi hipotezi ayırt etmiyor. Kök nedeni doğrudan sınayan bir ölçüm seç.";

  return (
    <section aria-labelledby="fault-lab-title" className="rounded-[2rem] border border-site-border bg-site-soft p-4 shadow-sm sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-site-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.15em] text-site-accent-text">Vaka {caseIndex + 1}/3 · seed {scenario.seed}</p>
          <h2 id="fault-lab-title" className="mt-2 font-heading text-3xl font-semibold text-site-ink">Bilinmeyen arıza izi</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-site-muted">Arıza türünü seçmedin. En fazla iki telemetri kanalı aç, kök nedeni savun, önce güvenli eylemi seç ve hipotezini ayırt eden testi belirle.</p>
        </div>
        <button type="button" onClick={() => resetDiagnosis((caseIndex + 1) % CASE_SEEDS.length)} className="min-h-11 shrink-0 rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink">Yeni vaka</button>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-site-border bg-site-surface px-4 py-3">
        <p className="font-mono text-sm font-bold text-site-ink">{STAGE_LABELS[stage]}</p>
        <p className="text-xs text-site-muted">Arıza t = {scenario.faultStartsAtSeconds.toFixed(2)} s anında enjekte edildi.</p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-site-border bg-site-surface p-4 sm:p-5">
          {stage === "observe" && (
            <div>
              <h3 className="font-heading text-xl font-semibold text-site-ink">Gözlem bütçeni seç</h3>
              <p className="mt-2 text-sm leading-6 text-site-muted">En fazla iki kanal açabilirsin. Kanal adları ölçümü söyler; arızanın adını söylemez.</p>
              <div className="mt-4 grid gap-3">
                {CHANNEL_OPTIONS.map((channel) => {
                  const active = channels.includes(channel.id);
                  const unavailable = !active && channels.length >= 2;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      aria-pressed={active}
                      disabled={unavailable}
                      onClick={() => toggleChannel(channel.id)}
                      className={`min-h-11 rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-site-accent bg-site-accent-soft" : "border-site-border bg-site-soft"}`}
                    >
                      <span className="block text-sm font-semibold text-site-ink">{channel.label} kanalını {active ? "kapat" : "aç"}</span>
                      <span className="mt-1 block text-xs leading-5 text-site-muted">{channel.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-site-muted" role="status">{channels.length}/2 kanal açık.</p>
              <NextButton disabled={channels.length === 0} onClick={() => setStage("hypothesis")}>Hipoteze geç</NextButton>
            </div>
          )}

          {stage === "hypothesis" && (
            <div>
              <RadioChoices legend="Kök neden hipotezin ne?" name="fault-hypothesis" options={hypothesisOptions} value={hypothesis} onChange={setHypothesis} />
              <NextButton disabled={!hypothesis} onClick={() => setStage("action")}>İlk eyleme geç</NextButton>
            </div>
          )}

          {stage === "action" && (
            <div>
              <RadioChoices legend="Önce hangi eylemi yaparsın?" name="fault-action" options={FIRST_ACTION_OPTIONS} value={firstAction} onChange={setFirstAction} />
              <p className="mt-3 text-xs leading-5 text-site-muted">Amaç üretimi sürdürmek değil, teşhis belirsizken riski büyütmemektir.</p>
              <NextButton disabled={!firstAction} onClick={() => setStage("verification")}>Doğrulama testine geç</NextButton>
            </div>
          )}

          {stage === "verification" && (
            <div>
              <RadioChoices legend="Hipotezi hangi test ayırt eder?" name="fault-test" options={VERIFICATION_TEST_OPTIONS} value={verificationTest} onChange={setVerificationTest} />
              <NextButton disabled={!verificationTest} onClick={() => setStage("result")}>Teşhisi değerlendir</NextButton>
            </div>
          )}

          {stage === "result" && diagnosis && (
            <div>
              <div role="status" aria-live="polite" className={`rounded-xl border p-4 ${diagnosis.passed ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}>
                <p className="font-heading text-xl font-semibold">{diagnosis.passed ? "Teşhis doğrulandı" : "Teşhis henüz tamam değil"}</p>
                <p className="mt-2 text-sm leading-6">{resultMessage}</p>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl border border-site-border p-3"><dt className="font-semibold text-site-muted">Kök neden</dt><dd className="mt-1 text-site-ink">{FAULT_INFO[scenario.fault].label}</dd></div>
                <div className="rounded-xl border border-site-border p-3"><dt className="font-semibold text-site-muted">Trace imzası</dt><dd className="mt-1 leading-6 text-site-ink">{FAULT_INFO[scenario.fault].signature}</dd></div>
                <div className="rounded-xl border border-site-border p-3"><dt className="font-semibold text-site-muted">Karar uyumu</dt><dd className="mt-1 font-mono text-site-ink">{diagnosis.score}/3</dd></div>
              </dl>
              <button type="button" onClick={() => resetDiagnosis(caseIndex, true)} className="mt-5 min-h-11 rounded-xl border border-site-border px-4 text-sm font-semibold text-site-ink">Aynı vakayı yeniden incele</button>
            </div>
          )}
        </div>

        <FaultTracePanel channels={channels} samples={scenario.samples} faultStartsAtSeconds={scenario.faultStartsAtSeconds} />
      </div>

      <div className="mt-6 rounded-xl border border-site-border bg-site-surface p-4 text-xs leading-5 text-site-muted">
        <strong className="text-site-ink">Model sınırı:</strong> Bu, tek eksenli ve birinci dereceden idealize bir öğretim simülasyonudur. Gerçek servo dinamiği, mekanik esneklik, yük, güvenlik PLC’si veya üretici denetleyicisi değildir; gerçek robota komut göndermez.
      </div>
    </section>
  );
}
