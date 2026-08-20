export interface CodeLabExpectation {
  expectedOutput?: string;
  expectedFinalDegrees?: readonly number[];
  toleranceDegrees?: number;
  /**
   * İkinci derinlik turu (docs/15 "Kod incelemesi"): doğru poza ulaşmak
   * YETMEZ, çözüm en fazla bu kadar robot.movej()/movel() çağrısıyla
   * ulaşmalı — "sadeleştir" görevlerinin geriye uyumlu, opsiyonel üst
   * sınırı. Verilmezse davranış öncekiyle birebir aynı.
   */
  maxTraceSteps?: number;
}

export interface CodeLabEvaluation {
  hasAutomaticTest: boolean;
  outputMatches: boolean;
  poseMatches: boolean;
  passed: boolean;
}

export function evaluateCodeLab(
  expectation: CodeLabExpectation,
  result: { stdout: string; error: string | null; jointTrace: readonly number[][] },
): CodeLabEvaluation {
  const { expectedOutput, expectedFinalDegrees, toleranceDegrees = 0.5, maxTraceSteps } = expectation;
  const outputMatches = expectedOutput === undefined || result.stdout.trim() === expectedOutput.trim();
  const lastAngles = result.jointTrace[result.jointTrace.length - 1];
  const poseMatches = expectedFinalDegrees === undefined || (
    lastAngles !== undefined &&
    lastAngles.length === expectedFinalDegrees.length &&
    lastAngles.every((angle, index) => Math.abs(angle * 180 / Math.PI - expectedFinalDegrees[index]) <= toleranceDegrees)
  );
  const traceStepsOk = maxTraceSteps === undefined || result.jointTrace.length <= maxTraceSteps;
  const hasAutomaticTest = expectedOutput !== undefined || expectedFinalDegrees !== undefined;
  return {
    hasAutomaticTest,
    outputMatches,
    poseMatches,
    passed: hasAutomaticTest && result.error === null && outputMatches && poseMatches && traceStepsOk,
  };
}
