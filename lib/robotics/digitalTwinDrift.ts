import { forwardKinematics } from "./kinematics";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import type { Vec3 } from "./transform";

export type TwinFeedState = "baseline" | "drifted";
export type TwinDecision = "continue" | "watch" | "pause-recalibrate";
export type TwinSyncStatus = "synced" | "watch" | "drift";

export interface TwinDriftSample {
  id: string;
  subset: "calibration" | "validation";
  commandDegrees: readonly [number, number];
  twinTcp: Vec3;
  measuredTcp: Vec3;
  measurementNoise: Readonly<{ x: number; y: number }>;
  residualMeters: number;
}

export interface ResidualSummary {
  status: TwinSyncStatus;
  meanResidualMeters: number;
  maxResidualMeters: number;
  breachCount: number;
  longestBreachRun: number;
}

export const DIGITAL_TWIN_DRIFT_SCENARIO = {
  seed: "DT-204",
  actualJointZeroOffsetDegrees: 7,
  residualThresholdMeters: 0.06,
  requiredConsecutiveBreaches: 3,
  validationToleranceMeters: 0.012,
} as const;

const SAMPLE_FIXTURES = [
  { id: "K1", subset: "calibration", commandDegrees: [-55, 55], noise: [0.001, -0.001] },
  { id: "K2", subset: "calibration", commandDegrees: [-30, 55], noise: [-0.002, 0.001] },
  { id: "K3", subset: "calibration", commandDegrees: [-5, 55], noise: [0.001, 0.002] },
  { id: "K4", subset: "calibration", commandDegrees: [20, 55], noise: [-0.001, -0.002] },
  { id: "K5", subset: "calibration", commandDegrees: [45, 55], noise: [0.002, -0.001] },
  { id: "K6", subset: "calibration", commandDegrees: [65, 55], noise: [-0.001, 0.001] },
  { id: "D1", subset: "validation", commandDegrees: [-42, 78], noise: [0.002, 0.001] },
  { id: "D2", subset: "validation", commandDegrees: [-12, 78], noise: [-0.001, 0.002] },
  { id: "D3", subset: "validation", commandDegrees: [18, 78], noise: [0.001, -0.002] },
  { id: "D4", subset: "validation", commandDegrees: [52, 78], noise: [-0.002, -0.001] },
] as const;

const radians = (degrees: number) => degrees * Math.PI / 180;

function tcpAt(commandDegrees: readonly [number, number], jointZeroOffsetDegrees: number): Vec3 {
  return forwardKinematics(genericTwoDofRobot, [
    radians(commandDegrees[0] + jointZeroOffsetDegrees),
    radians(commandDegrees[1]),
  ]).endEffector;
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function buildTwinDriftSamples(
  twinJointZeroOffsetDegrees: number,
  feedState: TwinFeedState = "drifted",
): readonly TwinDriftSample[] {
  const actualOffset = feedState === "drifted"
    ? DIGITAL_TWIN_DRIFT_SCENARIO.actualJointZeroOffsetDegrees
    : 0;

  return SAMPLE_FIXTURES.map((fixture) => {
    const commandDegrees = fixture.commandDegrees as readonly [number, number];
    const physicalTcp = tcpAt(commandDegrees, actualOffset);
    const twinTcp = tcpAt(commandDegrees, twinJointZeroOffsetDegrees);
    const measuredTcp = {
      x: physicalTcp.x + fixture.noise[0],
      y: physicalTcp.y + fixture.noise[1],
      z: physicalTcp.z,
    };

    return {
      id: fixture.id,
      subset: fixture.subset,
      commandDegrees,
      twinTcp,
      measuredTcp,
      measurementNoise: { x: fixture.noise[0], y: fixture.noise[1] },
      residualMeters: distance(twinTcp, measuredTcp),
    };
  });
}

export function summarizeResiduals(
  values: readonly TwinDriftSample[] | readonly number[],
): ResidualSummary {
  const residuals = values.map((value) => typeof value === "number" ? value : value.residualMeters);
  let longestBreachRun = 0;
  let currentRun = 0;
  let breachCount = 0;

  for (const residual of residuals) {
    if (residual > DIGITAL_TWIN_DRIFT_SCENARIO.residualThresholdMeters) {
      breachCount += 1;
      currentRun += 1;
      longestBreachRun = Math.max(longestBreachRun, currentRun);
    } else {
      currentRun = 0;
    }
  }

  const status: TwinSyncStatus = longestBreachRun >= DIGITAL_TWIN_DRIFT_SCENARIO.requiredConsecutiveBreaches
    ? "drift"
    : breachCount > 0 ? "watch" : "synced";

  return {
    status,
    meanResidualMeters: residuals.length === 0
      ? 0
      : residuals.reduce((total, residual) => total + residual, 0) / residuals.length,
    maxResidualMeters: residuals.length === 0 ? 0 : Math.max(...residuals),
    breachCount,
    longestBreachRun,
  };
}

export function evaluateTwinDecision(decision: TwinDecision): boolean {
  return decision === "pause-recalibrate";
}

export function evaluateTwinCalibration(twinJointZeroOffsetDegrees: number) {
  const samples = buildTwinDriftSamples(twinJointZeroOffsetDegrees, "drifted");
  const calibration = summarizeResiduals(samples.filter((sample) => sample.subset === "calibration"));
  const validation = summarizeResiduals(samples.filter((sample) => sample.subset === "validation"));

  return {
    samples,
    calibration,
    validation,
    passed: validation.meanResidualMeters <= DIGITAL_TWIN_DRIFT_SCENARIO.validationToleranceMeters,
  };
}
