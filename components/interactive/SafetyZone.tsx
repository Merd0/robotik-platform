"use client";

import { useState } from "react";
import { allowedSpeed, requiredSeparation, type ZoneState } from "@/lib/robotics/safety";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";

interface SafetyZoneProps {
  /**
   * Sunum derinliği:
   * - `bolge`: sadece bölgeler ve robotun durumu, sayı yok (ortaokul)
   * - `mesafe`: ayrım mesafesi sayıyla gösterilir, parametreler sabit (lise)
   * - `hesap`: gerekli mesafenin bileşenleri ve parametre kaydırıcıları (üniversite)
   */
  mode?: "bolge" | "mesafe" | "hesap";
  /** Robotun başlangıç hızı (mm/s). */
  robotSpeed?: number;
  theme?: "ortaokul" | "lise" | "universite";
  /** Ölçümü açık commit ile kaydeden sürümlü ders görevi. */
  pilot?: "braking-distance";
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/70",
    button: "bg-ortaokul-ink text-ortaokul-surface",
    outline: "border-ortaokul-ink/20",
  },
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    button: "bg-lise-ink text-lise-surface",
    outline: "border-lise-ink/20",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    button: "bg-universite-ink text-universite-surface",
    outline: "border-universite-ink/20",
  },
} as const;

/** Durum göstergesi: renk TEK BAŞINA bilgi taşımaz, her zaman ikon + metinle birlikte (docs/07). */
const DURUM: Record<ZoneState, { etiket: string; ikon: string; renk: string; aciklama: string }> = {
  serbest: {
    etiket: "Serbest",
    ikon: "●",
    renk: "text-[var(--color-durum-serbest)]",
    aciklama: "Robot tam hızda çalışıyor.",
  },
  yavasla: {
    etiket: "Yavaşla",
    ikon: "▲",
    renk: "text-[var(--color-durum-uyari)]",
    aciklama: "İnsan uyarı bölgesinde — robot hızını düşürdü.",
  },
  dur: {
    etiket: "Dur",
    ikon: "■",
    renk: "text-[var(--color-durum-dur)]",
    aciklama: "Ayrım mesafesi yetersiz — robot durdu.",
  },
};

const SCENE_MAX_MM = 4000;
const DEFAULTS = {
  humanSpeed: 1600,
  reactionTime: 0.1,
  brakingTime: 0.3,
  uncertainty: 100,
};

const round = (value: number) => Math.round(value);

/**
 * Ders içine gömülen etkileşimli sahne: bir robot ile bir insan arasındaki
 * ayrım mesafesi daraldıkça robotun önce yavaşlaması, sonra durması.
 *
 * Alttaki hesap her üç modda da aynıdır (`lib/robotics/safety.ts`); değişen
 * şey ne kadarının gösterildiğidir — docs/05'teki "aynı etkileşim motoru,
 * seviyeyle ciddileşen çerçeveleme" ilkesi.
 */
export function SafetyZone({
  mode = "mesafe",
  robotSpeed: initialSpeed = 1000,
  theme = "lise",
  pilot,
}: SafetyZoneProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const [distance, setDistance] = useState(2500);
  const [robotSpeed, setRobotSpeed] = useState(initialSpeed);
  const [brakingTime, setBrakingTime] = useState(DEFAULTS.brakingTime);

  const params = {
    humanSpeed: DEFAULTS.humanSpeed,
    reactionTime: DEFAULTS.reactionTime,
    brakingTime,
    uncertainty: DEFAULTS.uncertainty,
  };
  const separation = requiredSeparation({ ...params, robotSpeed });
  const izinliHiz = allowedSpeed(distance, params);
  // Robot komut edilen hızda değil, mesafenin izin verdiği hızda gider:
  // ikisinin küçüğü. Önceden `durum === "dur" ? 0 : Math.min(...)` yazıyordu;
  // `durum` komut hızına bağlı `required`'a baktığı için, komut hızı izinli
  // hızı aştığı anda gösterilen değer kademeli düşmek yerine bir anda SIFIRA
  // düşüyordu (ve Math.min dalı hiç çalışmıyordu — matematiksel olarak
  // durum "dur" olmasıyla robotSpeed > izinliHiz olması aynı koşul).
  const gosterilenHiz = Math.min(robotSpeed, izinliHiz);
  // Durum artık fiilen ne olduğunu anlatıyor: hız sıfırlandıysa dur, komut
  // hızı kısıldıysa yavaşla, kısılmadıysa serbest.
  const durum: ZoneState =
    gosterilenHiz <= 0 ? "dur" : gosterilenHiz < robotSpeed ? "yavasla" : "serbest";

  const d = DURUM[durum];
  const humanPct = Math.min(100, Math.max(0, (distance / SCENE_MAX_MM) * 100));
  // Adaptif motor iki gerçek eşik kullanır: insan yolu + belirsizlik bütçeyi
  // tükettiğinde hız sıfırdır; komut hızının gerekli mesafesine kadar hız
  // kademeli sınırlanır. Görsel bantlar da aynı eşikleri göstermeli.
  const stoppedSeparation = requiredSeparation({ ...params, robotSpeed: 0 }).required;
  const stopPct = Math.min(100, (stoppedSeparation / SCENE_MAX_MM) * 100);
  const warnPct = Math.min(100, (separation.required / SCENE_MAX_MM) * 100);

  useSharedLabState("safety-zone", (shared) => {
    if (shared.mode !== mode) return;
    setDistance(shared.distance);
    setRobotSpeed(shared.robotSpeed);
    setBrakingTime(shared.brakingTime);
  });

  function handleReset() {
    setDistance(2500);
    setRobotSpeed(initialSpeed);
    setBrakingTime(DEFAULTS.brakingTime);
  }

  function recordMeasurement() {
    const atSpeedLimitBoundary = Math.abs(distance - separation.required) <= 50;
    record({
      skillId: "safety-braking-distance",
      stage: "observed",
      result: atSpeedLimitBoundary && robotSpeed > 0 ? "success" : "retry",
      metrics: {
        robotSpeed,
        brakingTime,
        distance,
        requiredSeparation: separation.required,
        atSpeedLimitBoundary,
      },
    });
  }

  const ozet =
    mode === "bolge"
      ? `Robot ile insan arasındaki mesafe ${durum === "dur" ? "çok yakın" : durum === "yavasla" ? "yaklaşıyor" : "uzak"}. ${d.aciklama}`
      : `Ayrım mesafesi ${round(distance)} mm, gerekli en küçük mesafe ${round(separation.required)} mm. ${d.aciklama}`;

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {/* Sahne: sol uçta robot, kaydırıcıyla konumlanan insan, aradaki bölgeler */}
      <div className={`relative h-28 overflow-hidden rounded-lg ${t.bg}`} aria-hidden="true">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--color-durum-dur)]/15"
          style={{ width: `${stopPct}%` }}
        />
        <div
          className="absolute inset-y-0 bg-[var(--color-durum-uyari)]/12"
          style={{ left: `${stopPct}%`, width: `${Math.max(0, warnPct - stopPct)}%` }}
        />
        <div className={`absolute bottom-2 left-2 font-mono text-xs ${t.inkMuted}`}>robot</div>
        <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center">
          <div className={`h-12 w-6 rounded-sm border-2 ${t.outline} ${t.surface}`} />
        </div>
        <div
          className="absolute inset-y-0 flex w-10 items-center justify-center transition-[left] duration-150"
          style={{ left: `calc(${humanPct}% - 1.25rem)` }}
        >
          <div className={`h-10 w-3 rounded-full ${t.ink} bg-current opacity-70`} />
        </div>
        <div
          className={`absolute bottom-2 font-mono text-xs ${t.inkMuted}`}
          style={{ left: `calc(${humanPct}% - 1rem)` }}
        >
          insan
        </div>
      </div>

      {/* Durum: ikon + metin + renk birlikte */}
      <p className={`flex items-center gap-2 text-sm font-medium ${d.renk}`}>
        <span aria-hidden="true">{d.ikon}</span>
        <span>
          {d.etiket} — {d.aciklama}
        </span>
      </p>

      <div className="flex flex-col gap-3">
        <label className={`flex flex-col gap-1 text-sm ${t.ink}`}>
          <span>
            İnsanın robota uzaklığı
            {mode !== "bolge" && <span className="font-mono"> — {round(distance)} mm</span>}
          </span>
          <input
            type="range"
            className="h-11 touch-pan-y"
            min={0}
            max={SCENE_MAX_MM}
            step={50}
            value={distance}
            onChange={(event) => setDistance(Number(event.target.value))}
          />
        </label>

        {mode === "hesap" && (
          <>
            <label className={`flex flex-col gap-1 text-sm ${t.ink}`}>
              <span>
                Robot hızı — <span className="font-mono">{round(robotSpeed)} mm/s</span>
              </span>
              <input
                type="range"
                className="h-11 touch-pan-y"
                min={0}
                max={2000}
                step={50}
                value={robotSpeed}
                onChange={(event) => setRobotSpeed(Number(event.target.value))}
              />
            </label>
            <label className={`flex flex-col gap-1 text-sm ${t.ink}`}>
              <span>
                Frenleme süresi — <span className="font-mono">{brakingTime.toFixed(2)} s</span>
              </span>
              <input
                type="range"
                className="h-11 touch-pan-y"
                min={0.05}
                max={1}
                step={0.05}
                value={brakingTime}
                onChange={(event) => setBrakingTime(Number(event.target.value))}
              />
            </label>
          </>
        )}
      </div>

      {mode !== "bolge" && (
        <dl className={`grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs ${t.inkMuted}`}>
          <dt>Gerekli ayrım mesafesi</dt>
          <dd className={t.ink}>{round(separation.required)} mm</dd>
          <dt>Robotun anlık hızı</dt>
          <dd className={t.ink}>{round(gosterilenHiz)} mm/s</dd>
          {mode === "hesap" && (
            <>
              <dt>· insanın aldığı yol</dt>
              <dd className={t.ink}>{round(separation.humanTravel)} mm</dd>
              <dt>· robotun aldığı yol</dt>
              <dd className={t.ink}>{round(separation.robotTravel)} mm</dd>
              <dt>· belirsizlik payı</dt>
              <dd className={t.ink}>{round(separation.uncertainty)} mm</dd>
            </>
          )}
        </dl>
      )}

      <div className="flex items-center gap-3">
        {pilot === "braking-distance" && (
          <button
            type="button"
            onClick={recordMeasurement}
            className={`h-11 rounded-md border px-3 text-sm ${t.outline}`}
          >
            Bu ölçümü kaydet
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className={`h-11 rounded-md px-3 text-sm ${t.button}`}
        >
          Sıfırla
        </button>
      </div>

      <ExperimentShareButton
        seviye={theme}
        createShareUrl={() => createLabShareUrl({
          kind: "safety-zone",
          version: 1,
          mode,
          distance,
          robotSpeed,
          brakingTime,
        })}
      />

      {/* Ekran okuyucu için metin özeti (docs/02 erişilebilirlik) */}
      <p className="sr-only" role="status">
        {ozet}
      </p>
    </div>
  );
}
