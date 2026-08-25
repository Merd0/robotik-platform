import { describe, expect, it } from "vitest";
import { FAULT_INFO, generateFaultScenario } from "./faultInjection";
import {
  ERROR_MUSEUM_EXHIBITS,
  buildErrorMuseumExhibit,
  evaluateMuseumEvidence,
} from "./errorMuseum";

describe("Hata Müzesi", () => {
  it("üç golden trace'i birer anonim karşı örnek olarak kapsar", () => {
    expect(ERROR_MUSEUM_EXHIBITS.map((exhibit) => exhibit.fault)).toEqual([
      "encoder-bias",
      "packet-delay",
      "actuator-saturation",
    ]);
    expect(new Set(ERROR_MUSEUM_EXHIBITS.map((exhibit) => exhibit.seed)).size).toBe(3);
  });

  it("sergilenen sayıları aynı deterministik telemetri izinden hesaplar", () => {
    const exhibit = buildErrorMuseumExhibit(1);
    const scenario = generateFaultScenario(exhibit.seed);
    const faultSamples = scenario.samples.filter((sample) => sample.tSeconds >= scenario.faultStartsAtSeconds);
    const expectedPacketAge = Math.max(...faultSamples.map((sample) => sample.packetAgeMs));
    const expectedActuationGap = Math.max(...faultSamples.map((sample) => Math.abs(sample.requestedControl - sample.appliedControl)));

    expect(exhibit.metrics.maxPacketAgeMs).toBe(expectedPacketAge);
    expect(exhibit.metrics.maxActuationGap).toBeCloseTo(expectedActuationGap, 12);
    expect(exhibit.evidenceOptions.every((option) => Number.isFinite(option.value))).toBe(true);
  });

  it("yalnız yanlış zihinsel modeli ayırt eden karşı kanıtı kabul eder", () => {
    const exhibit = buildErrorMuseumExhibit(2);

    expect(evaluateMuseumEvidence(exhibit, "message-age")).toMatchObject({ status: "not-distinguishing", reveal: false });
    expect(evaluateMuseumEvidence(exhibit, "requested-applied")).toMatchObject({ status: "correct", reveal: true });
  });

  it("temelden ileriye kademeli zorluk sırasını taşır (kanal sayısı artan)", () => {
    expect(ERROR_MUSEUM_EXHIBITS.map((exhibit) => exhibit.level)).toEqual(["temel", "orta", "ileri"]);
    expect(ERROR_MUSEUM_EXHIBITS.map((exhibit) => exhibit.channels.length)).toEqual([1, 2, 2]);
  });

  it("doğru okuma ve güvenli sıra mevcut fault sözleşmesiyle çelişmez", () => {
    for (const exhibit of ERROR_MUSEUM_EXHIBITS) {
      expect(exhibit.correctInterpretation).toBe(FAULT_INFO[exhibit.fault].signature);
      expect(exhibit.safeAction).toBe(FAULT_INFO[exhibit.fault].safeAction);
      expect(exhibit.verificationTest).toBe(FAULT_INFO[exhibit.fault].verificationTest);
    }
  });
});
