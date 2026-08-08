import { JointSliders } from "./JointSliders";
import { IkTarget } from "./IkTarget";
import { JacobianViz } from "./JacobianViz";
import { PlannerRace } from "./PlannerRace";
import { CodeRunner } from "./CodeRunner";
import { Quiz } from "./Quiz";
import { BlockEditor } from "./BlockEditor";
import { SignalTimeline } from "./SignalTimeline";
import { PixelToWorld } from "./PixelToWorld";
import { ThresholdViewer } from "./ThresholdViewer";
import { ScanPath } from "./ScanPath";
import { SafetyZone } from "./SafetyZone";
import { PredictionPrompt } from "./PredictionPrompt";
import { TransferChallenge } from "./TransferChallenge";
import { TransformOrderLab } from "./TransformOrderLab";
import { DlsTraceLab } from "./DlsTraceLab";
import { CspaceLab } from "./CspaceLab";
import type { IZINLI_BILESEN_ADLARI } from "@/lib/izinliBilesenler";

/**
 * MDX'e açılan bileşenlerin TEK listesi. Bir ders dosyası burada olmayan bir
 * bileşeni kullanamaz — bkz. CLAUDE.md "içerikte sadece önceden tanımlı
 * components/interactive/ bileşenleri kullanılır".
 *
 * Tip, adları `lib/izinliBilesenler.ts`'ten alıyor: o liste MDX güvenlik
 * denetiminin (lib/mdxGuvenlik.ts) de kaynağı. Böylece bir bileşen ekleyip
 * listeye yazmamak (ya da tersi) DERLEME hatası veriyor — denetim sessizce
 * eskiyemiyor.
 */
export const mdxComponents = {
  JointSliders,
  IkTarget,
  JacobianViz,
  PlannerRace,
  CodeRunner,
  Quiz,
  BlockEditor,
  SignalTimeline,
  PixelToWorld,
  ThresholdViewer,
  ScanPath,
  SafetyZone,
  PredictionPrompt,
  TransferChallenge,
  TransformOrderLab,
  DlsTraceLab,
  CspaceLab,
  // `satisfies`: anahtarların izinli liste ile birebir aynı olmasını derleme
  // zamanında zorlar, ama değer tiplerini geniştetmez (compileMDX bileşen
  // tiplerini görmeye devam eder).
} satisfies Record<(typeof IZINLI_BILESEN_ADLARI)[number], unknown>;
