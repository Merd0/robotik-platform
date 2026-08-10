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
  const reach = Math.round(Math.hypot(points.end.x - HERO_ARM.shoulder.x, points.end.y - HERO_ARM.shoulder.y));
  /* Poster zeminindeki dev kol dekoratif değil: deneyin kendi açılarını
     büyük ölçekte çiziyor, kaydırıcıyla birlikte dönüyor (docs/07:
     dekorasyon ile işlev aynı görsel dili paylaşır). Ayrı bir taban ve
     uzuv boyu kullanır çünkü poster kadrajı deney kadrajından farklı. */
  const ghost = useMemo(() => {
    const rad = (derece: number) => (derece * Math.PI) / 180;
    /* Ondalık kırpma şart: yuvarlanmamış float sunucuda ve tarayıcıda farklı
       basamakla dizgeleşip hydration uyuşmazlığı üretiyor. */
    const yuvarla = (deger: number) => Math.round(deger * 100) / 100;
    const taban = { x: 110, y: 560 };
    const a1 = -rad(q1 + 16);
    const a2 = -rad(q1 + 16 + (played ? targetQ2 : initialQ2));
    const dirsek = { x: yuvarla(taban.x + 265 * Math.cos(a1)), y: yuvarla(taban.y + 265 * Math.sin(a1)) };
    const uc = { x: yuvarla(dirsek.x + 215 * Math.cos(a2)), y: yuvarla(dirsek.y + 215 * Math.sin(a2)) };
    return { taban, dirsek, uc };
  }, [q1, played]);

  function reset() {
    setPlayed(false);
    setPrediction(null);
  }

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-deney-baslik">
      <svg
        viewBox="0 0 800 620"
        preserveAspectRatio="xMinYMax meet"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden size-full opacity-[0.22] lg:block"
      >
        <line x1={ghost.taban.x} y1={ghost.taban.y} x2={ghost.dirsek.x} y2={ghost.dirsek.y} stroke="var(--color-poster-teal)" strokeWidth="46" strokeLinecap="round" className="arm-motion" />
        <line x1={ghost.dirsek.x} y1={ghost.dirsek.y} x2={ghost.uc.x} y2={ghost.uc.y} stroke="var(--color-poster-purple)" strokeWidth="36" strokeLinecap="round" className="arm-motion" />
        <circle cx={ghost.taban.x} cy={ghost.taban.y} r="34" fill="var(--color-poster-bg)" stroke="var(--color-poster-teal)" strokeWidth="7" />
        <circle cx={ghost.dirsek.x} cy={ghost.dirsek.y} r="24" fill="var(--color-poster-bg)" stroke="var(--color-poster-purple)" strokeWidth="7" className="arm-motion" />
        <circle cx={ghost.uc.x} cy={ghost.uc.y} r="15" fill="var(--color-poster-blue)" className="arm-motion" />
      </svg>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)] lg:gap-12">
        <div className="flex flex-col gap-5 pt-2 lg:gap-7">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-3 rounded-full bg-poster-teal shadow-[0_0_12px_var(--color-poster-teal)] [animation:glow-pulse_1.6s_ease-in-out_infinite]" />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-poster-ink">Canlı İz Laboratuvarı</span>
          </div>

          <h1 id="hero-deney-baslik" className="font-heading text-[clamp(3.25rem,9vw,8.25rem)] font-black uppercase leading-[0.84] tracking-tight">
            <span className="block text-poster-teal-text">Tahmin et.</span>
            <span className="block text-poster-blue-text">Çalıştır.</span>
            <span className="block text-poster-purple-text">Farkı gör.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-poster-muted lg:text-lg">
            Burada her kavram bir deneydir: önce tahminini kilitle, robotu çalıştır, uç noktanın izini gör.
            Kurulum yok, hesap yok — ortaokuldan üniversiteye tek laboratuvar.
          </p>

          <div className="hidden flex-wrap gap-4 lg:flex">
            <Link
              href="#seviye-baslik"
              className="inline-flex min-h-14 items-center rounded-full bg-poster-ink px-8 text-base font-bold text-poster-bg shadow-[6px_6px_0_var(--color-poster-teal)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-poster-teal)]"
            >
              Seviyeni seç <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link
              href="/laboratuvar/robot-hucresi"
              className="inline-flex min-h-14 items-center rounded-full border-[3px] border-poster-ink px-8 text-base font-bold text-poster-ink transition hover:bg-poster-soft"
            >
              Robot hücresini aç
            </Link>
          </div>
        </div>

        <div className="poster-card bg-poster-surface p-4 lg:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-poster-purple-text">Deney 00 · İleri kinematik</span>
            <span className="rounded-full border-2 border-poster-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-poster-ink">canlı</span>
          </div>

          <div className="mt-3 rounded-xl border border-poster-line bg-poster-soft p-2">
            <svg viewBox="0 0 240 160" className="mx-auto aspect-[3/2] max-h-40 w-full" role="img" aria-label={`İki eklemli robot kolu. Uç nokta x ${Math.round(points.end.x)}, y ${Math.round(points.end.y)} konumunda.`}>
              <path d="M18 136 H222 M32 25 V143" stroke="var(--color-poster-line)" strokeWidth="1" strokeDasharray="3 5" />
              {played && <path d={`M${before.end.x} ${before.end.y} Q${before.end.x + 18} ${before.end.y - 24} ${points.end.x} ${points.end.y}`} fill="none" stroke="var(--color-poster-purple)" strokeWidth="2.5" strokeDasharray="4 4" className="trace-path" />}
              <circle cx={before.end.x} cy={before.end.y} r="5" fill="none" stroke="var(--color-poster-subtle)" strokeWidth="1.5" />
              <line x1={HERO_ARM.shoulder.x} y1={HERO_ARM.shoulder.y} x2={points.elbow.x} y2={points.elbow.y} stroke="var(--color-poster-ink)" strokeWidth="12" strokeLinecap="round" className="arm-motion" />
              <line x1={points.elbow.x} y1={points.elbow.y} x2={points.end.x} y2={points.end.y} stroke="var(--color-poster-blue)" strokeWidth="10" strokeLinecap="round" className="arm-motion" />
              <circle cx={HERO_ARM.shoulder.x} cy={HERO_ARM.shoulder.y} r="8" fill="var(--color-poster-teal)" stroke="var(--color-poster-ink)" strokeWidth="2.5" />
              <circle cx={points.elbow.x} cy={points.elbow.y} r="6.5" fill="var(--color-poster-teal)" stroke="var(--color-poster-ink)" strokeWidth="2.5" className="arm-motion" />
              <circle cx={points.end.x} cy={points.end.y} r="7" fill="var(--color-poster-purple)" stroke="var(--color-poster-ink)" strokeWidth="2.5" className="arm-motion" />
            </svg>
          </div>

          <label className="mt-3 block">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-poster-subtle">Omuz açısını çek</span>
              <output className="font-heading text-3xl font-black leading-none text-poster-blue-text">
                {q1}°<span className="ml-1 font-sans text-xs font-bold text-poster-subtle">· {reach} br ulaşım</span>
              </output>
            </span>
            <input type="range" min="-10" max="58" value={q1} onChange={(event) => { setQ1(Number(event.target.value)); setPlayed(false); }} className="mt-1 h-11 w-full touch-pan-y accent-[var(--color-poster-purple)]" />
          </label>

          <fieldset className="mt-1">
            <legend className="text-sm font-semibold text-poster-ink">Dirsek 56° daha kapanırsa mor uç ne yapar?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([["yukari", "Yukarı çıkar"], ["asagi", "Aşağı iner"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={prediction === value}
                  onClick={() => { setPrediction(value); setPlayed(false); }}
                  className={`min-h-11 rounded-full border-2 px-3 py-2 text-sm font-bold transition ${prediction === value ? "border-poster-ink bg-poster-teal text-poster-ink" : "border-poster-line bg-poster-surface text-poster-muted hover:border-poster-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!prediction} onClick={() => setPlayed(true)} className="min-h-11 flex-1 rounded-full border-2 border-poster-ink bg-poster-ink px-4 py-2 text-sm font-bold text-poster-bg transition disabled:cursor-not-allowed disabled:opacity-40">
              Tahminimi çalıştır
            </button>
            <button type="button" onClick={reset} className="min-h-11 rounded-full border-2 border-poster-line px-4 py-2 text-sm font-bold text-poster-muted hover:border-poster-ink">Sıfırla</button>
          </div>

          <p aria-live="polite" className="mt-2 min-h-10 text-sm leading-5 text-poster-muted">
            {played ? (
              actualMovement === "steady"
                ? "Uç noktanın dikey konumu neredeyse değişmedi; bu omuz açısı iki etkinin sınırında. Açıyı bir derece değiştirip yeniden dene."
                : correct
                  ? `İsabet. İz ${actualMovement === "up" ? "yukarı" : "aşağı"} kıvrıldı; iki eklemin açısı uç konumu birlikte belirledi.`
                  : `Tahminin şaştı — iyi. Dirseğin dönüşü bu omuz açısında ucu ${actualMovement === "up" ? "yukarı" : "aşağı"} taşıdı; omuz açısını değiştirip yeniden dene.`
            ) : "Önce seçimini kilitle; hareket ancak sonra gösterilecek."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 lg:hidden">
          <Link href="#seviye-baslik" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-poster-ink px-4 text-sm font-bold text-poster-bg shadow-[4px_4px_0_var(--color-poster-teal)]">
            Seviyeni seç
          </Link>
          <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border-[3px] border-poster-ink px-4 text-center text-sm font-bold text-poster-ink">
            Robot hücresi
          </Link>
        </div>
      </div>
    </section>
  );
}
