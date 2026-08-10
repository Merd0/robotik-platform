import type { ReactNode } from "react";

/*
 * Ders kartının üstündeki küçük ölçüm penceresi. İçerik uydurma değil:
 * dersin frontmatter'ındaki `etkilesimli` bileşeninden seçilir, yani
 * pencerede gördüğün hareket derste gerçekten karşılaşacağın sahnenin
 * küçültülmüş halidir. Eşlemesi olmayan bileşen sessizce nötr bir düğüm
 * penceresine düşer — kart yine de doğru kalır, sadece daha az bilgi taşır.
 *
 * Tümü süslemedir (aria-hidden): aynı bilgi kartın metin satırında
 * ("hedef ve IK" gibi) zaten yazılı. Renk tek başına bilgi taşımaz.
 */

export type OnizlemeTuru =
  | "kol"
  | "calisma-uzayi"
  | "jacobian"
  | "ornekleme"
  | "arama"
  | "kod"
  | "sinyal"
  | "piksel"
  | "tarama"
  | "guvenlik"
  | "eksen"
  | "dugum";

const BILESEN_ONIZLEME: Record<string, OnizlemeTuru> = {
  JointSliders: "kol",
  FourLensTraceLab: "kol",
  IkTarget: "calisma-uzayi",
  JacobianViz: "jacobian",
  DlsTraceLab: "jacobian",
  PlannerRace: "ornekleme",
  CspaceLab: "ornekleme",
  MazePlanner: "arama",
  CodeRunner: "kod",
  BlockEditor: "kod",
  SignalTimeline: "sinyal",
  PixelToWorld: "piksel",
  ThresholdViewer: "piksel",
  ScanPath: "tarama",
  SafetyZone: "guvenlik",
  TransformOrderLab: "eksen",
  RobotSelectionTable: "dugum",
  PredictionPrompt: "dugum",
  TransferChallenge: "dugum",
};

const KANAL_KODU: Record<OnizlemeTuru, string> = {
  kol: "KİNEMATİK",
  "calisma-uzayi": "ÇALIŞMA UZAYI",
  jacobian: "JACOBIAN",
  ornekleme: "ÖRNEKLEME",
  arama: "ARAMA",
  kod: "KOD",
  sinyal: "SİNYAL",
  piksel: "PİKSEL",
  tarama: "TARAMA",
  guvenlik: "GÜVENLİK",
  eksen: "DÖNÜŞÜM",
  dugum: "KARAR",
};

export function onizlemeTuru(etkilesimli: readonly string[]): OnizlemeTuru {
  for (const bilesen of etkilesimli) {
    const tur = BILESEN_ONIZLEME[bilesen];
    if (tur) return tur;
  }
  return "dugum";
}

export function kanalKodu(tur: OnizlemeTuru) {
  return KANAL_KODU[tur];
}

const VURGU = "var(--onizleme-vurgu, var(--color-poster-blue))";
const IKINCIL = "var(--onizleme-ikincil, var(--color-poster-teal))";

function svgSar(children: ReactNode) {
  return (
    <svg viewBox="0 0 100 90" aria-hidden="true" className="h-20 w-24">
      {children}
    </svg>
  );
}

export function LessonPreview({ tur }: { tur: OnizlemeTuru }) {
  switch (tur) {
    case "kol":
      return svgSar(
        <g style={{ transformOrigin: "34px 68px", animation: "arm-toggle 3.4s ease-in-out infinite" }}>
          <line x1="34" y1="68" x2="34" y2="32" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="34" y1="32" x2="72" y2="44" stroke={VURGU} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="72" cy="44" r="4" fill="currentColor" />
        </g>,
      );

    case "calisma-uzayi":
      return svgSar(
        <>
          <path d="M50 74 A26 26 0 1 1 50 22" fill="none" stroke={IKINCIL} strokeWidth="2.5" strokeDasharray="4 6" style={{ animation: "arc-sweep 2.6s linear infinite" }} />
          <line x1="50" y1="48" x2="76" y2="48" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="3" fill="currentColor" />
          <circle cx="76" cy="48" r="3.5" fill={VURGU} />
        </>,
      );

    case "jacobian":
      return svgSar(
        <>
          <ellipse cx="50" cy="45" rx="30" ry="30" fill="none" stroke={VURGU} strokeWidth="2.5" style={{ transformOrigin: "50px 45px", animation: "ellipse-morph 4.5s ease-in-out infinite" }} />
          <circle cx="50" cy="45" r="2.5" fill="currentColor" />
        </>,
      );

    case "ornekleme":
      return svgSar(
        <>
          <path d="M14 78 C24 66, 20 54, 34 50" fill="none" stroke={VURGU} strokeWidth="2" strokeDasharray="4 6" style={{ animation: "dash-grow 2.2s linear infinite" }} />
          <path d="M34 50 C42 46, 40 30, 56 24" fill="none" stroke={VURGU} strokeWidth="2" strokeDasharray="4 6" style={{ animation: "dash-grow 2.6s linear .3s infinite" }} />
          <path d="M34 50 C44 54, 50 62, 66 58" fill="none" stroke={IKINCIL} strokeWidth="2" strokeDasharray="4 6" style={{ animation: "dash-grow 2s linear .6s infinite" }} />
          <circle cx="14" cy="78" r="2.6" fill="currentColor" />
          <circle cx="34" cy="50" r="2.4" fill="currentColor" style={{ animation: "node-grow 2s ease-out infinite" }} />
          <circle cx="56" cy="24" r="2.6" fill="currentColor" style={{ animation: "node-grow 2.6s ease-out .3s infinite" }} />
          <circle cx="66" cy="58" r="2.2" fill="currentColor" style={{ animation: "node-grow 2s ease-out .6s infinite" }} />
        </>,
      );

    case "arama":
      return svgSar(
        <>
          <path d="M16 70 L38 46 L62 56 L86 22" fill="none" stroke={VURGU} strokeWidth="2.5" strokeDasharray="5 6" style={{ animation: "trace-dash 1.8s linear infinite" }} />
          <circle cx="16" cy="70" r="3" fill="currentColor" />
          <circle cx="38" cy="46" r="3" fill="currentColor" style={{ animation: "node-current 1.4s ease-in-out infinite" }} />
          <circle cx="62" cy="56" r="3" fill="currentColor" />
          <circle cx="86" cy="22" r="3.5" fill={IKINCIL} />
        </>,
      );

    case "kod":
      return (
        <div aria-hidden="true" className="flex h-20 w-32 flex-col justify-center gap-1 overflow-hidden rounded-md bg-[#0a0a0a] px-3 font-mono text-[11px] leading-tight">
          <span className="overflow-hidden whitespace-nowrap text-[#2dd4bf]" style={{ ["--satir-genislik" as string]: "11ch", width: "11ch", animation: "type-line 3s steps(18) infinite" }}>move_j(q1)</span>
          <span className="overflow-hidden whitespace-nowrap text-[#a9b6c7]" style={{ ["--satir-genislik" as string]: "10ch", width: "10ch", animation: "type-line 3s steps(18) .5s infinite" }}>
            wait(0.4)<span style={{ animation: "caret-blink 1s step-end infinite" }}>▌</span>
          </span>
        </div>
      );

    case "sinyal":
      return svgSar(
        <>
          <line x1="10" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <path d="M12 62 H32 V36 H54 V62 H76 V36 H90" fill="none" stroke={VURGU} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="43" cy="36" r="3" fill={IKINCIL} style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
        </>,
      );

    case "piksel":
      return svgSar(
        <>
          {[0, 1, 2, 3].map((satir) =>
            [0, 1, 2, 3].map((sutun) => (
              <rect key={`${satir}-${sutun}`} x={16 + sutun * 15} y={20 + satir * 15} width="13" height="13" rx="2" fill="currentColor" opacity={satir === 1 && sutun === 2 ? 0 : 0.14} />
            )),
          )}
          <rect x="46" y="35" width="13" height="13" rx="2" fill={VURGU} style={{ animation: "pulse-dot 1.8s ease-in-out infinite" }} />
          <line x1="52" y1="48" x2="52" y2="80" stroke={IKINCIL} strokeWidth="2" strokeDasharray="3 4" />
        </>,
      );

    case "tarama":
      return svgSar(
        <>
          <path d="M12 66 Q34 50 52 62 T88 54" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
          <g style={{ animation: "sweep-band 2.4s ease-in-out infinite" }}>
            <line x1="20" y1="18" x2="80" y2="18" stroke={VURGU} strokeWidth="2.5" />
            <line x1="34" y1="18" x2="30" y2="44" stroke={IKINCIL} strokeWidth="1.5" opacity="0.7" />
            <line x1="66" y1="18" x2="70" y2="44" stroke={IKINCIL} strokeWidth="1.5" opacity="0.7" />
          </g>
        </>,
      );

    case "guvenlik":
      return svgSar(
        <>
          <circle cx="50" cy="48" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.35" />
          <circle cx="50" cy="48" r="19" fill="none" stroke={VURGU} strokeWidth="2" strokeDasharray="4 5" />
          <circle cx="50" cy="48" r="8" fill={VURGU} opacity="0.2" />
          <circle cx="50" cy="48" r="4" fill={VURGU} style={{ animation: "pulse-dot 1.5s ease-in-out infinite" }} />
          <circle cx="82" cy="24" r="4" fill={IKINCIL} />
        </>,
      );

    case "eksen":
      return svgSar(
        <>
          <g style={{ transformOrigin: "50px 52px", animation: "spin-slow 7s linear infinite" }}>
            <line x1="50" y1="52" x2="82" y2="52" stroke="#e05252" strokeWidth="2.5" />
            <line x1="50" y1="52" x2="50" y2="20" stroke="#2f9e63" strokeWidth="2.5" />
            <line x1="50" y1="52" x2="66" y2="36" stroke="#3b7ddd" strokeWidth="2.5" />
          </g>
          <circle cx="50" cy="52" r="3" fill="currentColor" />
        </>,
      );

    default:
      return svgSar(
        <>
          <line x1="22" y1="64" x2="78" y2="26" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <circle cx="22" cy="64" r="6" fill="currentColor" style={{ animation: "pulse-dot 1.8s ease-in-out infinite" }} />
          <circle cx="78" cy="26" r="6" fill="currentColor" style={{ animation: "pulse-dot 1.8s ease-in-out .9s infinite" }} />
          <circle r="3" fill={VURGU}>
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M22 64 L78 26" />
          </circle>
        </>,
      );
  }
}
