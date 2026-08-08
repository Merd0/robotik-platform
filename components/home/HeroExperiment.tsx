"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { classifyVerticalMovement, HERO_ARM, heroArmPoints } from "@/lib/robotics/heroKinematics";

type Prediction = "yukari" | "asagi";

export function HeroExperiment() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [played, setPlayed] = useState(false);
  const [q1, setQ1] = useState(24);
  const initialQ2 = 8;
  const targetQ2 = 64;
  const points = useMemo(() => heroArmPoints(q1, played ? targetQ2 : initialQ2), [q1, played]);
  const before = useMemo(() => heroArmPoints(q1, initialQ2), [q1]);
  const actualMovement = classifyVerticalMovement(before.end.y, heroArmPoints(q1, targetQ2).end.y);
  const correct = (prediction === "yukari" && actualMovement === "up") || (prediction === "asagi" && actualMovement === "down");

  function reset() {
    setPlayed(false);
    setPrediction(null);
  }

  return (
    <section className="lab-panel overflow-hidden" aria-labelledby="hero-deney-baslik">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <div className="flex flex-col justify-center gap-4 p-4 lg:gap-6 lg:p-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-site-accent-text">
            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-teal-500" />
            Canlı İz Laboratuvarı
          </div>
          <div className="space-y-4">
            <h1 id="hero-deney-baslik" className="max-w-3xl font-heading text-3xl font-semibold leading-[1.04] tracking-tight text-site-ink lg:text-6xl">
              Robotu izleme. <span className="text-site-accent-text">Önce ne yapacağını tahmin et.</span>
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-site-muted lg:text-lg lg:leading-7">
              Burada her kavram bir deneydir: tahmin et, çalıştır, farkı gör ve sonucu açıklamaya başla. İlk deney kısa ve kurulum gerektirmiyor.
            </p>
          </div>
          <div className="hidden flex-wrap gap-3 lg:flex">
            <Link href="#seviye-baslik" className="inline-flex min-h-11 items-center rounded-full bg-site-strong px-5 py-2.5 text-sm font-semibold text-site-on-strong transition hover:opacity-90">
              Seviyeni seç
            </Link>
            <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-11 items-center rounded-full border border-site-border bg-site-surface px-5 py-2.5 text-sm font-semibold text-site-ink transition hover:border-site-accent">
              Robot hücresini aç
            </Link>
          </div>
        </div>

        <div className="relative border-t border-site-border bg-slate-950 p-4 text-white lg:border-l lg:border-t-0 lg:p-7">
          <div className="pointer-events-none absolute inset-0 lab-grid opacity-25" />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
              <span>Deney 00 · İleri kinematik</span>
              <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-2.5 py-1 text-teal-200">tarayıcıda canlı</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 lg:p-3">
              <svg viewBox="0 0 240 160" className="mx-auto aspect-[3/2] max-h-40 w-full lg:max-h-none" role="img" aria-label={`İki eklemli robot kolu. Uç nokta x ${Math.round(points.end.x)}, y ${Math.round(points.end.y)} konumunda.`}>
                <path d="M18 136 H222 M32 25 V143" stroke="#334155" strokeWidth="1" strokeDasharray="3 5" />
                {played && <path d={`M${before.end.x} ${before.end.y} Q${before.end.x + 18} ${before.end.y - 24} ${points.end.x} ${points.end.y}`} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 4" className="trace-path" />}
                <circle cx={before.end.x} cy={before.end.y} r="5" fill="none" stroke="#64748b" strokeWidth="1.5" />
                <line x1={HERO_ARM.shoulder.x} y1={HERO_ARM.shoulder.y} x2={points.elbow.x} y2={points.elbow.y} stroke="#f8fafc" strokeWidth="12" strokeLinecap="round" className="arm-motion" />
                <line x1={points.elbow.x} y1={points.elbow.y} x2={points.end.x} y2={points.end.y} stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" className="arm-motion" />
                <circle cx={HERO_ARM.shoulder.x} cy={HERO_ARM.shoulder.y} r="9" fill="#0f172a" stroke="#5eead4" strokeWidth="3" />
                <circle cx={points.elbow.x} cy={points.elbow.y} r="7" fill="#0f172a" stroke="#5eead4" strokeWidth="3" className="arm-motion" />
                <circle cx={points.end.x} cy={points.end.y} r="7" fill="#f97316" className="arm-motion" />
                <text x="18" y="18" fill="#94a3b8" fontSize="9">uç nokta izi</text>
              </svg>
            </div>

            <label className="space-y-1.5 text-sm text-slate-200">
              <span className="flex justify-between"><span>Omuz açısı</span><output>{q1}°</output></span>
              <input type="range" min="-10" max="58" value={q1} onChange={(event) => { setQ1(Number(event.target.value)); setPlayed(false); }} className="h-11 w-full touch-pan-y accent-teal-400" />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white">Dirsek 56° daha kapanırsa turuncu uç ne yapar?</legend>
              <div className="grid grid-cols-2 gap-2">
                {([['yukari', 'Yukarı çıkar'], ['asagi', 'Aşağı iner']] as const).map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={prediction === value} onClick={() => { setPrediction(value); setPlayed(false); }} className={`min-h-11 rounded-xl border px-3 py-2 text-sm transition ${prediction === value ? "border-teal-300 bg-teal-300/15 text-teal-100" : "border-white/15 bg-white/5 text-slate-300 hover:border-white/35"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={!prediction} onClick={() => setPlayed(true)} className="min-h-11 flex-1 rounded-xl bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                Tahminimi çalıştır
              </button>
              <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300">Sıfırla</button>
            </div>
            <p aria-live="polite" className="min-h-10 text-sm leading-5 text-slate-300">
              {played ? (
                actualMovement === "steady"
                  ? "Uç noktanın dikey konumu neredeyse değişmedi; bu omuz açısı iki etkinin sınırında. Açıyı bir derece değiştirip yeniden dene."
                  : correct
                    ? `İsabet. İz ${actualMovement === "up" ? "yukarı" : "aşağı"} kıvrıldı; iki eklemin açısı uç konumu birlikte belirledi.`
                    : `Tahminin şaştı — iyi. Dirseğin dönüşü bu omuz açısında ucu ${actualMovement === "up" ? "yukarı" : "aşağı"} taşıdı; omuz açısını değiştirip yeniden dene.`
              ) : "Önce seçimini kilitle; hareket ancak sonra gösterilecek."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-site-border bg-site-surface p-4 lg:hidden">
          <Link href="#seviye-baslik" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-site-strong px-4 py-2 text-sm font-semibold text-site-on-strong">
            Seviyeni seç
          </Link>
          <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-site-border px-4 py-2 text-center text-sm font-semibold text-site-ink">
            Robot hücresi
          </Link>
        </div>
      </div>
    </section>
  );
}
