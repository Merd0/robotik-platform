import { createSeededRandom } from "./random";

export const FAULT_KINDS = ["encoder-bias", "packet-delay", "actuator-saturation"] as const;
export type FaultKind = (typeof FAULT_KINDS)[number];

export type FaultFirstAction =
  | "stop-and-reference-check"
  | "safe-stop-and-check-timestamps"
  | "safe-stop-and-check-load"
  | "increase-gain"
  | "bypass-limit";

export type FaultVerificationTest =
  | "compare-independent-reference"
  | "inspect-message-age"
  | "compare-requested-applied"
  | "repeat-same-command";

export interface FaultSample {
  tSeconds: number;
  setpoint: number;
  truePosition: number;
  measuredPosition: number;
  requestedControl: number;
  appliedControl: number;
  packetAgeMs: number;
}

export interface FaultScenario {
  seed: number;
  fault: FaultKind;
  faultStartsAtSeconds: number;
  /** Arızanın SI-temelli motor parametresi; teşhis tamamlanana kadar UI'da gizlenir. */
  faultMagnitude: number;
  samples: FaultSample[];
}

export interface FaultDiagnosisSelection {
  hypothesis: FaultKind;
  firstAction: FaultFirstAction;
  verificationTest: FaultVerificationTest;
}

export interface FaultDiagnosisResult {
  passed: boolean;
  score: number;
  rootCauseMatched: boolean;
  safeAction: boolean;
  verificationMatched: boolean;
}

export const FAULT_INFO: Record<FaultKind, {
  label: string;
  shortLabel: string;
  safeAction: FaultFirstAction;
  verificationTest: FaultVerificationTest;
  signature: string;
}> = {
  "encoder-bias": {
    label: "Encoder sabit ofseti (bias)",
    shortLabel: "Encoder bias",
    safeAction: "stop-and-reference-check",
    verificationTest: "compare-independent-reference",
    signature: "Ölçülen konum, gerçek konumdan kalıcı ve yaklaşık sabit bir miktar ayrıldı; paket yaşı normal kaldı.",
  },
  "packet-delay": {
    label: "Paket gecikmesi",
    shortLabel: "Paket gecikmesi",
    safeAction: "safe-stop-and-check-timestamps",
    verificationTest: "inspect-message-age",
    signature: "Konum ölçümü güncel hareketin gerisinde kaldı ve mesaj yaşı arıza anından sonra belirgin biçimde yükseldi.",
  },
  "actuator-saturation": {
    label: "Aktüatör doygunluğu",
    shortLabel: "Aktüatör doygunluğu",
    safeAction: "safe-stop-and-check-load",
    verificationTest: "compare-requested-applied",
    signature: "İstenen kontrol komutu büyümeye devam ederken uygulanan komut sabit bir sınırda kırpıldı.",
  },
};

export const FIRST_ACTION_OPTIONS: readonly { id: FaultFirstAction; label: string }[] = [
  { id: "stop-and-reference-check", label: "Robotu durdur; harici referansla konumu doğrula" },
  { id: "safe-stop-and-check-timestamps", label: "Sistemi güvenli duruşa al; mesaj zaman damgalarını denetle" },
  { id: "safe-stop-and-check-load", label: "Komutu durdur; yükü ve aktüatör sınırlarını güvenli durumda kontrol et" },
  { id: "increase-gain", label: "Kontrol kazancını artır" },
  { id: "bypass-limit", label: "Komut sınırını geçici olarak devre dışı bırak" },
];

export const VERIFICATION_TEST_OPTIONS: readonly { id: FaultVerificationTest; label: string }[] = [
  { id: "compare-independent-reference", label: "Ölçümü bağımsız konum referansıyla karşılaştır" },
  { id: "inspect-message-age", label: "Mesaj yaşını ve zaman damgası farkını incele" },
  { id: "compare-requested-applied", label: "İstenen ve uygulanan kontrol komutlarını karşılaştır" },
  { id: "repeat-same-command", label: "Aynı komutu daha yüksek kazançla tekrar çalıştır" },
];

const DT_SECONDS = 0.05;
const DURATION_SECONDS = 7;
const FAULT_START_SECONDS = 1.5;
const PROPORTIONAL_GAIN = 1.8;
const NOMINAL_CONTROL_LIMIT = 2.5;

function normalizedModulo(value: number, divisor: number): number {
  return ((Math.trunc(value) % divisor) + divisor) % divisor;
}

function setpointAt(tSeconds: number): number {
  if (tSeconds < 0.5) return 0;
  if (tSeconds < 2.5) return 1;
  return 0.15;
}

/**
 * Tek eksenli, birinci dereceden öğretim plant'i. Amaç gerçek bir servo
 * kimliği taklit etmek değil; üç arıza imzasını aynı birimli ve tekrar
 * üretilebilir iz üzerinde ayırmaktır.
 */
export function generateFaultScenario(seed: number): FaultScenario {
  const normalizedSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const fault = FAULT_KINDS[normalizedModulo(normalizedSeed, FAULT_KINDS.length)];
  const random = createSeededRandom(normalizedSeed);
  const faultMagnitude = fault === "encoder-bias"
    ? 0.14 + random() * 0.08
    : fault === "packet-delay"
      ? 4 + Math.floor(random() * 3)
      : 0.32 + random() * 0.12;
  const delaySteps = fault === "packet-delay" ? faultMagnitude : 0;
  const samples: FaultSample[] = [];
  const sensorHistory: number[] = [];
  let truePosition = 0;

  for (let index = 0; index <= DURATION_SECONDS / DT_SECONDS; index += 1) {
    const tSeconds = index * DT_SECONDS;
    const faultActive = tSeconds >= FAULT_START_SECONDS;
    const noise = (random() * 2 - 1) * 0.003;
    const biasedMeasurement = truePosition + (fault === "encoder-bias" && faultActive ? faultMagnitude : 0) + noise;
    sensorHistory.push(biasedMeasurement);

    const activeDelaySteps = fault === "packet-delay" && faultActive ? delaySteps : 0;
    const delayedIndex = Math.max(0, sensorHistory.length - 1 - activeDelaySteps);
    const measuredPosition = sensorHistory[delayedIndex];
    const setpoint = setpointAt(tSeconds);
    const requestedControl = PROPORTIONAL_GAIN * (setpoint - measuredPosition);
    const controlLimit = fault === "actuator-saturation" && faultActive ? faultMagnitude : NOMINAL_CONTROL_LIMIT;
    const appliedControl = Math.max(-controlLimit, Math.min(controlLimit, requestedControl));

    samples.push({
      tSeconds,
      setpoint,
      truePosition,
      measuredPosition,
      requestedControl,
      appliedControl,
      packetAgeMs: activeDelaySteps * DT_SECONDS * 1000,
    });

    truePosition += appliedControl * DT_SECONDS;
  }

  return {
    seed: normalizedSeed,
    fault,
    faultStartsAtSeconds: FAULT_START_SECONDS,
    faultMagnitude,
    samples,
  };
}

export function evaluateFaultDiagnosis(
  scenario: FaultScenario,
  selection: FaultDiagnosisSelection,
): FaultDiagnosisResult {
  const expected = FAULT_INFO[scenario.fault];
  const rootCauseMatched = selection.hypothesis === scenario.fault;
  const safeAction = selection.firstAction === expected.safeAction;
  const verificationMatched = selection.verificationTest === expected.verificationTest;
  const score = Number(rootCauseMatched) + Number(safeAction) + Number(verificationMatched);

  return {
    passed: rootCauseMatched && safeAction && verificationMatched,
    score,
    rootCauseMatched,
    safeAction,
    verificationMatched,
  };
}
