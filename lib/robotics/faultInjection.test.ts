import { describe, expect, it } from "vitest";
import {
  evaluateFaultDiagnosis,
  generateFaultScenario,
  type FaultDiagnosisSelection,
} from "./faultInjection";

describe("arıza enjeksiyonu motoru", () => {
  it("aynı seed için aynı arızayı ve aynı telemetri izini üretir", () => {
    const first = generateFaultScenario(240824);
    const second = generateFaultScenario(240824);

    expect(second).toEqual(first);
    expect(first.samples.length).toBeGreaterThan(80);
    expect(first.samples.every((sample) => Object.values(sample).every(Number.isFinite))).toBe(true);
  });

  it("üç ardışık seed ile encoder bias, paket gecikmesi ve doygunluk vakalarını kapsar", () => {
    expect([0, 1, 2].map((seed) => generateFaultScenario(seed).fault)).toEqual([
      "encoder-bias",
      "packet-delay",
      "actuator-saturation",
    ]);
  });

  it("encoder bias vakasında ölçüm ile gerçek konum arasında kalıcı ofset bırakır", () => {
    const scenario = generateFaultScenario(0);
    const last = scenario.samples.at(-1)!;

    expect(Math.abs(last.measuredPosition - last.truePosition)).toBeGreaterThan(0.1);
    expect(Math.max(...scenario.samples.map((sample) => sample.packetAgeMs))).toBe(0);
  });

  it("paket gecikmesini telemetri yaşıyla görünür kılar", () => {
    const scenario = generateFaultScenario(1);

    expect(Math.max(...scenario.samples.map((sample) => sample.packetAgeMs))).toBeGreaterThanOrEqual(150);
    expect(Math.max(...scenario.samples.map((sample) => Math.abs(sample.measuredPosition - sample.truePosition)))).toBeGreaterThan(0.05);
  });

  it("aktüatör doygunluğunda istenen ve uygulanan komutu ayırır", () => {
    const scenario = generateFaultScenario(2);
    const faultSamples = scenario.samples.filter((sample) => sample.tSeconds >= scenario.faultStartsAtSeconds);
    const maxGap = Math.max(...faultSamples.map((sample) => Math.abs(sample.requestedControl - sample.appliedControl)));
    const maxApplied = Math.max(...faultSamples.map((sample) => Math.abs(sample.appliedControl)));

    expect(maxGap).toBeGreaterThan(0.2);
    expect(maxApplied).toBeLessThanOrEqual(scenario.faultMagnitude + 1e-9);
  });

  it("yalnız doğru kök neden + güvenli ilk eylem + doğrulama testi birleşimini geçirir", () => {
    const scenario = generateFaultScenario(1);
    const correct: FaultDiagnosisSelection = {
      hypothesis: "packet-delay",
      firstAction: "safe-stop-and-check-timestamps",
      verificationTest: "inspect-message-age",
    };

    expect(evaluateFaultDiagnosis(scenario, correct)).toMatchObject({ passed: true, score: 3 });
    expect(evaluateFaultDiagnosis(scenario, { ...correct, firstAction: "increase-gain" })).toMatchObject({
      passed: false,
      score: 2,
      safeAction: false,
    });
    expect(evaluateFaultDiagnosis(scenario, { ...correct, verificationTest: "repeat-same-command" })).toMatchObject({
      passed: false,
      score: 2,
      verificationMatched: false,
    });
  });
});
