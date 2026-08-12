"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HERO_ARM, HERO_JOINTS, HERO_TARGET, heroPose } from "@/lib/robotics/heroKinematics";

type Prediction = "durur" | "devam";

const yuvarla = (deger: number) => Math.round(deger);

export function HeroExperiment() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [played, setPlayed] = useState(false);
  /* Tek girdi: "uzanma komutu". Hangi eklemin döneceğine kullanıcı değil,
     omuzun limiti karar veriyor (lib/robotics/heroKinematics.ts). */
  const [command, setCommand] = useState(20);
  const pose = useMemo(() => heroPose(command), [command]);
  const devirNoktasi = useMemo(() => heroPose(HERO_JOINTS.handoffAt), []);
  const hedefeVardi = pose.distanceToTarget < 1;

  /* Poster zeminindeki dev kol dekoratif değil: deneyin kendi açılarını
     büyük ölçekte çiziyor (docs/07: dekorasyon ile işlev aynı görsel dili
     paylaşır). Ondalık kırpma şart — yuvarlanmamış float sunucuda ve
     tarayıcıda farklı basamakla dizgeleşip hydration uyuşmazlığı üretiyor. */
  const ghost = useMemo(() => {
    const rad = (derece: number) => (derece * Math.PI) / 180;
    const kirp = (deger: number) => Math.round(deger * 100) / 100;
    const taban = { x: 110, y: 560 };
    const a1 = -rad(pose.q1 - 40);
    const a2 = -rad(pose.q1 - 40 + pose.q2 - 90);
    const dirsek = { x: kirp(taban.x + 265 * Math.cos(a1)), y: kirp(taban.y + 265 * Math.sin(a1)) };
    const uc = { x: kirp(dirsek.x + 215 * Math.cos(a2)), y: kirp(dirsek.y + 215 * Math.sin(a2)) };
    return { taban, dirsek, uc };
  }, [pose.q1, pose.q2]);

  const omuzAktif = pose.activeJoint === "omuz";
  const eklemVurgusu = "var(--color-poster-blue)";
  const eklemSakin = "var(--color-poster-teal)";
  const sinirRengi = "#b45309";

  function reset() {
    setCommand(20);
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
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-poster-purple-text">Deney 00 · Eklem limiti</span>
            <span className="rounded-full border-2 border-poster-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-poster-ink">canlı</span>
          </div>

          <div className="mt-3 rounded-xl border border-poster-line bg-poster-soft p-2">
            <svg
              viewBox="0 0 240 160"
              /* Dar ekranda sahne kısalıyor: tahmin düğmeleri ilk ekranın
                 içinde kalmalı (e2e bunu ölçüyor). */
              className="mx-auto aspect-[3/2] max-h-28 w-full sm:max-h-40"
              role="img"
              aria-label={`İki eklemli robot kolu. Omuz ${yuvarla(pose.q1)} derece, dirsek ${yuvarla(pose.q2)} derece. Şu an ${pose.activeJoint} eklemi hareket ediyor. Hedefe uzaklık ${yuvarla(pose.distanceToTarget)} birim.`}
            >
              <path d="M18 136 H222 M32 25 V143" stroke="var(--color-poster-line)" strokeWidth="1" strokeDasharray="3 5" />

              {/* Hedef: komut sonuna kadar çekildiğinde ucun varacağı nokta. */}
              <circle cx={HERO_TARGET.x} cy={HERO_TARGET.y} r="11" fill="none" stroke="var(--color-poster-purple)" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx={HERO_TARGET.x} cy={HERO_TARGET.y} r="3" fill="var(--color-poster-purple)" />

              {/* Omuz tek başına ucu bu daire üzerinde gezdirir; daire yarıçapı
                  dirseğe bağlı, o yüzden omuz evresinde hiç değişmiyor. */}
              <circle cx={HERO_ARM.shoulder.x} cy={HERO_ARM.shoulder.y} r={pose.reach} fill="none" stroke="var(--color-poster-line)" strokeWidth="1" strokeDasharray="2 4" />

              {pose.shoulderAtLimit && (
                <circle cx={devirNoktasi.end.x} cy={devirNoktasi.end.y} r="5" fill="none" stroke={sinirRengi} strokeWidth="1.5" strokeDasharray="3 3" />
              )}

              <line x1={HERO_ARM.shoulder.x} y1={HERO_ARM.shoulder.y} x2={pose.elbow.x} y2={pose.elbow.y} stroke={omuzAktif ? "var(--color-poster-ink)" : "var(--color-poster-line)"} strokeWidth="12" strokeLinecap="round" className="arm-motion" />
              <line x1={pose.elbow.x} y1={pose.elbow.y} x2={pose.end.x} y2={pose.end.y} stroke={omuzAktif ? "var(--color-poster-line)" : "var(--color-poster-blue)"} strokeWidth="10" strokeLinecap="round" className="arm-motion" />

              <circle cx={HERO_ARM.shoulder.x} cy={HERO_ARM.shoulder.y} r={pose.shoulderAtLimit ? 9 : 8} fill={pose.shoulderAtLimit ? sinirRengi : omuzAktif ? eklemVurgusu : eklemSakin} stroke="var(--color-poster-ink)" strokeWidth="2.5" />
              <circle cx={pose.elbow.x} cy={pose.elbow.y} r="6.5" fill={omuzAktif ? eklemSakin : eklemVurgusu} stroke="var(--color-poster-ink)" strokeWidth="2.5" className="arm-motion" />
              <circle cx={pose.end.x} cy={pose.end.y} r="7" fill={hedefeVardi ? "var(--color-poster-purple)" : "var(--color-poster-ink)"} stroke="var(--color-poster-ink)" strokeWidth="2.5" className="arm-motion" />
            </svg>
          </div>

          <label className="mt-3 block">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-poster-subtle">Uzanma komutu</span>
              <output className="font-heading text-3xl font-black leading-none text-poster-blue-text">
                {yuvarla(pose.reach)}<span className="ml-1 font-sans text-xs font-bold text-poster-subtle">br uzanım</span>
              </output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={command}
              onChange={(event) => { setCommand(Number(event.target.value)); setPlayed(false); }}
              className="mt-1 h-11 w-full touch-pan-y accent-[var(--color-poster-purple)]"
            />
          </label>

          {/* Devrin sessizce olmaması için: hangi eklemin döndüğü ve omuzun
              sınıra dayandığı hem renkle hem yazıyla söyleniyor. */}
          <p aria-live="polite" className="flex flex-wrap items-center gap-2 text-xs">
            {pose.shoulderAtLimit ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-surface px-2.5 py-1 font-bold text-warning-ink">
                  <span aria-hidden="true">■</span> Omuz sınırda ({yuvarla(HERO_JOINTS.shoulder.limit)}°)
                </span>
                <span className="font-bold text-poster-blue-text">→ şimdi dirsek hareket ediyor ({yuvarla(pose.q2)}°)</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-poster-line bg-poster-soft px-2.5 py-1 font-bold text-poster-blue-text">
                  <span aria-hidden="true">●</span> Omuz hareket ediyor ({yuvarla(pose.q1)}°)
                </span>
                <span className="text-poster-subtle">dirsek {yuvarla(pose.q2)}° bekliyor</span>
              </>
            )}
          </p>

          {/*
            mt-2 (mt-3 değil): ilk viewport sınırı e2e'de ölçülüyor
            (hero ilk anlamlı kontrolü testi) ve CI'ın Linux runner'ında
            gövde yazı tipi metrikleri Windows'tan farklı sıra dışı
            piksel kesirleri üretiyor (2026-08-12, Linux'ta 844.515625 >
            844 — yarım pikselden az bir taşma). CSS'in bunu kesin sıfıra
            indirmesi mümkün değil (yazı tipi rasterlemesi platforma
            göre değişir); bu yüzden gerçek bir pay bırakıldı.
          */}
          <fieldset className="mt-2">
            <legend className="text-sm font-semibold text-poster-ink">Komutu sonuna kadar çekersen ne olur?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([["durur", "Sınırda durur"], ["devam", "Dirsek devralır"]] as const).map(([value, label]) => (
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
            <button type="button" disabled={!prediction} onClick={() => { setCommand(100); setPlayed(true); }} className="min-h-11 flex-1 rounded-full border-2 border-poster-ink bg-poster-ink px-4 py-2 text-sm font-bold text-poster-bg transition disabled:cursor-not-allowed disabled:opacity-40">
              Tahminimi çalıştır
            </button>
            <button type="button" onClick={reset} className="min-h-11 rounded-full border-2 border-poster-line px-4 py-2 text-sm font-bold text-poster-muted hover:border-poster-ink">Sıfırla</button>
          </div>

          <p aria-live="polite" className="mt-2 min-h-10 text-sm leading-5 text-poster-muted">
            {played
              ? prediction === "devam"
                ? "İsabet. Omuz 8°'de sınıra dayandı ve komut kendiliğinden dirseğe geçti; uzanım büyüyerek uç hedefe vardı."
                : "Tahminin şaştı — iyi. Omuz sınıra dayandı ama komut orada bitmedi: kontrol dirseğe geçti ve kol uzanmaya devam etti."
              : "Kaydırıcıyı çek. Omuz evresinde mor halka sabit kalır: tek dönme eklemi ucu daire üzerinde gezdirir, uzanımı büyütmez."}
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
