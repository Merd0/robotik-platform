"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { allowedSpeed } from "@/lib/robotics/safety";
import { getEvidenceEvents } from "@/lib/evidence";

const SEED = 240807;
const STEPS = ["Kalibrasyon", "Yol", "Program", "Güvenlik"] as const;
const PROGRAM = [
  ["algila", "Parçayı algıla"],
  ["yaklas", "Güvenli yaklaş"],
  ["tut", "Vakumu aç"],
  ["birak", "Kutuda bırak"],
] as const;

export function RobotCellCapstone() {
  const [step, setStep] = useState(0);
  const [scale, setScale] = useState(1);
  const [route, setRoute] = useState<"duz" | "ust" | null>(null);
  const [program, setProgram] = useState<string[]>([]);
  const [distance, setDistance] = useState(900);
  const [speed, setSpeed] = useState(800);
  const [message, setMessage] = useState("Ölçeği hesaplayarak başla.");
  const [done, setDone] = useState([false, false, false, false]);
  const record = useEvidenceRecorder();
  const allowed = useMemo(() => allowedSpeed(distance, { humanSpeed: 1600, reactionTime: 0.1, brakingTime: 0.3, uncertainty: 100 }), [distance]);
  const progress = done.filter(Boolean).length;

  function complete(index: number, metrics: Record<string, number | string | boolean>) {
    const next = done.map((value, i) => i === index ? true : value);
    setDone(next);
    record({ skillId: `robot-cell:${STEPS[index].toLocaleLowerCase("tr")}`, stage: "observed", result: "success", seed: SEED, metrics });
    if (index < STEPS.length - 1) setStep(index + 1);
    if (next.every(Boolean)) record({ skillId: "cross-track-robot-cell", stage: "passed", result: "success", seed: SEED, attempts: 1, metrics: { scale, route: route ?? "ust", distance, speed } });
  }

  function checkCalibration() {
    if (Math.abs(scale - 2.5) < 0.05) { setMessage("Kalibrasyon doğru: 120 piksel = 300 mm, yani 2,5 mm/piksel."); complete(0, { mmPerPixel: scale }); }
    else { setMessage("Ölçek uyuşmadı. 300 mm’yi görüntüde ölçülen 120 piksele böl."); record({ skillId: "robot-cell:kalibrasyon", stage: "tried", result: "retry", seed: SEED, metrics: { scale } }); }
  }

  function checkRoute(choice: "duz" | "ust") {
    setRoute(choice);
    if (choice === "ust") { setMessage("Yol geçerli: üst rota fikstürün çevresinden geçiyor."); complete(1, { route: choice }); }
    else { setMessage("Çarpışma: düz parça fikstürün içinden geçiyor. Alternatif rotayı sına."); record({ skillId: "robot-cell:yol", stage: "tried", result: "retry", seed: SEED, metrics: { collision: true } }); }
  }

  function addInstruction(id: string) {
    if (program.includes(id) || done[2]) return;
    const next = [...program, id];
    setProgram(next);
    if (next.length === PROGRAM.length) {
      const success = next.join(",") === PROGRAM.map(([programId]) => programId).join(",");
      if (success) { setMessage("Program sırası çalıştı: algıla → yaklaş → tut → bırak."); complete(2, { program: next.join(">") }); }
      else { setMessage("Sıra çalışmadı. Parçayı görmeden yaklaşamaz, tutmadan bırakamazsın."); record({ skillId: "robot-cell:program", stage: "tried", result: "retry", seed: SEED, metrics: { program: next.join(">") } }); }
    }
  }

  function checkSafety() {
    if (speed <= allowed + 0.5) { setMessage(`Güvenli hız doğrulandı: bu mesafede üst sınır ${Math.round(allowed)} mm/s.`); complete(3, { distance, speed, allowed: Math.round(allowed) }); }
    else { setMessage(`Hız fazla. ${distance} mm ayrımda izin verilen üst sınır ${Math.round(allowed)} mm/s.`); record({ skillId: "robot-cell:güvenlik", stage: "tried", result: "retry", seed: SEED, metrics: { distance, speed, allowed: Math.round(allowed) } }); }
  }

  function resetProgram() { setProgram([]); setDone((values) => values.map((value, i) => i === 2 ? false : value)); }

  function exportEvidence() {
    const events = getEvidenceEvents().filter((event) => event.lessonId === "capstone-robot-hucresi");
    const payload = JSON.stringify({ schema: "robotik-beceri-kaniti/v1", seed: SEED, exportedAt: new Date().toISOString(), events }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `robot-hucresi-kanit-${SEED}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="lab-panel overflow-hidden bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[.14em] text-slate-400"><span>Hücre RC-01 · seed {SEED}</span><span>{progress}/4 görev</span></div>
        <div className="relative p-4 sm:p-6"><div className="pointer-events-none absolute inset-0 lab-grid opacity-20" />
          <svg viewBox="0 0 640 390" className="relative aspect-[1.64/1] w-full rounded-2xl bg-slate-900" role="img" aria-label="Robot kolu, kamera, fikstür, parça ve insan içeren iki boyutlu robot hücresi">
            <rect x="42" y="40" width="556" height="305" rx="18" fill="none" stroke="#334155" strokeWidth="2" />
            <rect x="365" y="142" width="88" height="78" rx="8" fill="#7c2d12" stroke="#fb923c" strokeWidth="2" /><text x="379" y="185" fill="#fed7aa" fontSize="12">FİKSTÜR</text>
            <circle cx="520" cy="274" r="30" fill="#172554" stroke="#60a5fa" strokeWidth="2" /><text x="501" y="278" fill="#dbeafe" fontSize="11">KUTU</text>
            <rect x="120" y="70" width="44" height="26" rx="5" fill="#134e4a" stroke="#5eead4" strokeWidth="2" /><path d="M142 96 L180 150" stroke="#5eead4" strokeDasharray="4 5" /><text x="111" y="62" fill="#99f6e4" fontSize="11">KAMERA</text>
            <circle cx="178" cy="275" r="22" fill="#0f172a" stroke="#5eead4" strokeWidth="5" /><line x1="178" y1="275" x2="245" y2="210" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" /><line x1="245" y1="210" x2="306" y2="160" stroke="#94a3b8" strokeWidth="16" strokeLinecap="round" /><circle cx="245" cy="210" r="10" fill="#0f172a" stroke="#5eead4" strokeWidth="4" /><circle cx="306" cy="160" r="10" fill="#f97316" />
            <circle cx="305" cy="161" r="6" fill="#fbbf24" />
            {route && <path d={route === "duz" ? "M305 161 L520 274" : "M305 161 Q425 65 520 274"} fill="none" stroke={route === "duz" ? "#ef4444" : "#2dd4bf"} strokeWidth="4" strokeDasharray="8 7" />}
            <circle cx={575 - distance / 20} cy="305" r="12" fill="#f8fafc" /><line x1={575 - distance / 20} y1="317" x2={575 - distance / 20} y2="340" stroke="#f8fafc" strokeWidth="6" /><text x="525" y="365" fill="#cbd5e1" fontSize="11">İNSAN · {distance} mm</text>
          </svg>
        </div>
        <p aria-live="polite" className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-slate-300">{message}</p>
      </section>

      <section className="lab-panel p-5 sm:p-6" aria-labelledby="gorev-paneli">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Çapraz-hat capstone</p><h2 id="gorev-paneli" className="mt-1 font-heading text-2xl font-semibold">{step + 1}. {STEPS[step]}</h2></div><span className="font-mono text-sm text-site-subtle">{progress * 25}%</span></div>
        <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Görev ilerlemesi">{STEPS.map((label, index) => <li key={label}><button type="button" onClick={() => setStep(index)} className={`min-h-11 w-full rounded-lg text-xs ${step === index ? "bg-site-strong text-site-on-strong" : done[index] ? "bg-success-surface text-success-ink" : "bg-site-soft text-site-subtle"}`} aria-label={`${index + 1}. ${label}${done[index] ? ", tamamlandı" : ""}`}>{done[index] ? "✓" : index + 1}</button></li>)}</ol>

        <div className="mt-6 min-h-72">
          {step === 0 && <div className="space-y-4"><p className="text-sm leading-6 text-site-muted">Kamerada fikstürün 120 px genişliği, gerçek hücrede 300 mm. Ölçeği bul.</p><label className="block text-sm font-medium">mm / piksel<input type="number" step="0.1" value={scale} onChange={(event) => setScale(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-surface px-3" /></label><button type="button" onClick={checkCalibration} className="min-h-11 w-full rounded-xl bg-site-strong px-4 font-semibold text-site-on-strong">Kalibrasyonu doğrula</button></div>}
          {step === 1 && <div className="space-y-4"><p className="text-sm leading-6 text-site-muted">Turuncu uçtan mavi kutuya giden iki aday yol var. Fikstürle çarpışmayanı seç.</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => checkRoute("duz")} className="min-h-11 rounded-xl border border-site-border px-3">Düz rota</button><button type="button" onClick={() => checkRoute("ust")} className="min-h-11 rounded-xl border border-site-border px-3">Üst rota</button></div></div>}
          {step === 2 && <div className="space-y-4"><p className="text-sm leading-6 text-site-muted">Komutları güvenli çalışma sırasıyla seç.</p><div className="grid gap-2">{PROGRAM.map(([id, label]) => <button key={id} type="button" disabled={program.includes(id)} onClick={() => addInstruction(id)} className="min-h-11 rounded-xl border border-site-border px-3 text-left text-sm disabled:opacity-40">{label}</button>)}</div><p className="min-h-8 rounded-lg bg-site-soft p-2 font-mono text-xs">{program.length ? program.join(" → ") : "sıra boş"}</p><button type="button" onClick={resetProgram} className="min-h-11 text-sm underline underline-offset-4">Sırayı temizle</button></div>}
          {step === 3 && <div className="space-y-4"><p className="text-sm leading-6 text-site-muted">İnsan yaklaşırken robot hızını fiziksel modelin izin verdiği sınıra indir.</p><label className="block text-sm">Ayrım: {distance} mm<input type="range" min="300" max="2000" step="50" value={distance} onChange={(event) => setDistance(Number(event.target.value))} className="h-11 w-full touch-pan-y accent-teal-700" /></label><label className="block text-sm">Komut hızı: {speed} mm/s<input type="range" min="0" max="1600" step="50" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="h-11 w-full touch-pan-y accent-teal-700" /></label><p className="rounded-xl bg-site-soft p-3 text-sm">Model üst sınırı: <strong>{Math.round(allowed)} mm/s</strong></p><button type="button" onClick={checkSafety} className="min-h-11 w-full rounded-xl bg-site-strong px-4 font-semibold text-site-on-strong">Güvenliği doğrula</button></div>}
        </div>

        {progress === 4 && <div className="mt-4 rounded-2xl border border-success-border bg-success-surface p-4"><strong className="text-success-ink">Beta senaryo tamamlandı.</strong><p className="mt-1 text-sm text-success-ink">Dört mini görevdeki seçimlerin bu cihazdaki deney kaydına eklendi.</p><button type="button" onClick={exportEvidence} className="mt-3 min-h-11 rounded-xl bg-success-ink px-4 text-sm font-semibold text-success-surface">Deney kaydı JSON’unu indir</button></div>}
      </section>
    </div>
  );
}
