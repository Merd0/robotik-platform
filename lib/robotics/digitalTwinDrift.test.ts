import { describe, expect, it } from "vitest";
import { forwardKinematics } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import {
  DIGITAL_TWIN_DRIFT_SCENARIO,
  buildTwinDriftSamples,
  evaluateTwinCalibration,
  evaluateTwinDecision,
  summarizeResiduals,
} from "./digitalTwinDrift";

describe("dijital ikiz kayması", () => {
  it("sentetik fiziksel TCP ölçümünü mevcut ileri kinematik modelinden türetir", () => {
    const sample = buildTwinDriftSamples(0, "drifted")[0];
    const expected = forwardKinematics(
      genericTwoDofRobot,
      [
        (sample.commandDegrees[0] + DIGITAL_TWIN_DRIFT_SCENARIO.actualJointZeroOffsetDegrees) * Math.PI / 180,
        sample.commandDegrees[1] * Math.PI / 180,
      ],
    ).endEffector;

    expect(sample.measuredTcp.x - sample.measurementNoise.x).toBeCloseTo(expected.x, 10);
    expect(sample.measuredTcp.y - sample.measurementNoise.y).toBeCloseTo(expected.y, 10);
  });

  it("başlangıç kalibrasyonunda artık hatayı eşik altında ve senkron sınıflandırır", () => {
    const summary = summarizeResiduals(buildTwinDriftSamples(0, "baseline"));

    expect(summary.status).toBe("synced");
    expect(summary.meanResidualMeters).toBeLessThan(DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters);
    expect(summary.longestBreachRun).toBe(0);
  });

  it("tek bir eşik aşımını kayma saymaz, üç kalıcı aşımı kayma sayar", () => {
    const threshold = DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters;

    expect(summarizeResiduals([threshold * 1.2, threshold * 0.2, threshold * 0.3]).status).toBe("watch");
    expect(summarizeResiduals([threshold * 1.2, threshold * 1.3, threshold * 1.1]).status).toBe("drift");
  });

  it("kaymış akışta yalnız güvenli durdurma ve yeniden kalibrasyon kararını kabul eder", () => {
    expect(summarizeResiduals(buildTwinDriftSamples(0, "drifted")).status).toBe("drift");
    expect(evaluateTwinDecision("continue")).toBe(false);
    expect(evaluateTwinDecision("watch")).toBe(false);
    expect(evaluateTwinDecision("pause-recalibrate")).toBe(true);
  });

  it("kalibrasyon pozlarına uyan düzeltmeyi ayrı doğrulama pozlarında da sınar", () => {
    const corrected = evaluateTwinCalibration(7);
    const wrong = evaluateTwinCalibration(2);

    expect(corrected.calibration.meanResidualMeters).toBeLessThan(0.005);
    expect(corrected.validation.meanResidualMeters).toBeLessThan(0.005);
    expect(corrected.passed).toBe(true);
    expect(wrong.validation.meanResidualMeters).toBeGreaterThan(DIGITAL_TWIN_DRIFT_SCENARIO.validationToleranceMeters);
    expect(wrong.passed).toBe(false);
  });
});
