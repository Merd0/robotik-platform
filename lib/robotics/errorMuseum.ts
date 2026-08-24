import {
  FAULT_INFO,
  generateFaultScenario,
  type FaultFirstAction,
  type FaultKind,
  type FaultVerificationTest,
} from "./faultInjection";

export type MuseumEvidenceId = "independent-reference" | "message-age" | "requested-applied";
export type MuseumTraceChannel = "position" | "actuation" | "network";

export interface ErrorMuseumMetrics {
  meanIndependentReferenceGap: number;
  maxPacketAgeMs: number;
  maxActuationGap: number;
}

export interface ErrorMuseumExhibit {
  id: string;
  seed: number;
  fault: FaultKind;
  title: string;
  symptom: string;
  misconception: string;
  whyTempting: string;
  correctEvidenceId: MuseumEvidenceId;
  evidenceOptions: readonly { id: MuseumEvidenceId; label: string; value: number; unit: string }[];
  channels: readonly MuseumTraceChannel[];
  metrics: ErrorMuseumMetrics;
  correctInterpretation: string;
  safeAction: FaultFirstAction;
  verificationTest: FaultVerificationTest;
}

const EXHIBIT_COPY: Record<FaultKind, {
  title: string;
  symptom: string;
  misconception: string;
  whyTempting: string;
  correctEvidenceId: MuseumEvidenceId;
  channels: readonly MuseumTraceChannel[];
}> = {
  "encoder-bias": {
    title: "Eser 01 · Yerinde duran sapma",
    symptom: "Ölçülen konum hedefin çevresinde kararlı görünüyor; buna rağmen bağımsız konum referansı başka bir değer söylüyor.",
    misconception: "“Takip zayıf; kontrol kazancını artırırsak hedef hatası kapanır.”",
    whyTempting: "Hedef–ölçüm farkı bir kontrol hatası gibi görünür. Ama sensörün kendisi kaymışsa daha yüksek kazanç, yanlış ölçüme daha sert uymaktan başka bir şey yapmaz.",
    correctEvidenceId: "independent-reference",
    channels: ["position"],
  },
  "packet-delay": {
    title: "Eser 02 · Geçmişten gelen konum",
    symptom: "Ölçülen konum hareketi izliyor, fakat yön değişimlerinde güncel fiziksel durumun gerisinde kalıyor.",
    misconception: "“Encoder sıfırı kaydı; tek bir referans ayarı tüm izi düzeltir.”",
    whyTempting: "Geciken ölçüm de anlık olarak konum ofseti üretir. Ofset zamanla değişiyorsa önce verinin yaşı ve zaman damgası sınanmalıdır.",
    correctEvidenceId: "message-age",
    channels: ["position", "network"],
  },
  "actuator-saturation": {
    title: "Eser 03 · Komut büyürken hareketin durması",
    symptom: "Denetleyici daha büyük komut istiyor, fakat fiziksel tepki aynı hızda artmıyor ve hedef geç yakalanıyor.",
    misconception: "“Konum sensörü gürültülü; daha güçlü filtre uygularsak hareket düzelir.”",
    whyTempting: "Takip hatası ölçüm grafiğinde görünür. Fakat istenen ve uygulanan komut ayrışıyorsa sorun ölçümü yumuşatmak değil, aktüatör/yük sınırını güvenli durumda incelemektir.",
    correctEvidenceId: "requested-applied",
    channels: ["actuation", "position"],
  },
};

export function buildErrorMuseumExhibit(seed: number): ErrorMuseumExhibit {
  const scenario = generateFaultScenario(seed);
  const faultSamples = scenario.samples.filter((sample) => sample.tSeconds >= scenario.faultStartsAtSeconds);
  const metrics: ErrorMuseumMetrics = {
    meanIndependentReferenceGap: faultSamples.reduce(
      (sum, sample) => sum + Math.abs(sample.measuredPosition - sample.truePosition),
      0,
    ) / faultSamples.length,
    maxPacketAgeMs: Math.max(...faultSamples.map((sample) => sample.packetAgeMs)),
    maxActuationGap: Math.max(...faultSamples.map((sample) => Math.abs(sample.requestedControl - sample.appliedControl))),
  };
  const copy = EXHIBIT_COPY[scenario.fault];

  return {
    id: `fault-exhibit-${scenario.fault}`,
    seed: scenario.seed,
    fault: scenario.fault,
    ...copy,
    metrics,
    evidenceOptions: [
      { id: "independent-reference", label: "Bağımsız referans–ölçüm ortalama farkı", value: metrics.meanIndependentReferenceGap, unit: "normalize konum" },
      { id: "message-age", label: "En yüksek paket yaşı", value: metrics.maxPacketAgeMs, unit: "ms" },
      { id: "requested-applied", label: "İstenen–uygulanan en büyük komut farkı", value: metrics.maxActuationGap, unit: "normalize komut" },
    ],
    correctInterpretation: FAULT_INFO[scenario.fault].signature,
    safeAction: FAULT_INFO[scenario.fault].safeAction,
    verificationTest: FAULT_INFO[scenario.fault].verificationTest,
  };
}

export const ERROR_MUSEUM_EXHIBITS = [0, 1, 2].map(buildErrorMuseumExhibit) as readonly ErrorMuseumExhibit[];

export function evaluateMuseumEvidence(exhibit: ErrorMuseumExhibit, selected: MuseumEvidenceId) {
  const reveal = selected === exhibit.correctEvidenceId;
  return {
    status: reveal ? "correct" as const : "not-distinguishing" as const,
    reveal,
  };
}
