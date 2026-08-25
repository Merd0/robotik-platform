import { describe, expect, it } from "vitest";
import {
  evaluateBoundaryTestGuess,
  generateBoundaryTestRounds,
} from "./boundaryTest";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { genericSixDofRobot } from "./robots/genericSixDof";

describe("generateBoundaryTestRounds", () => {
  it("düzlemsel döner zincir desteklenmeyen bir robotta boş dizi döner", () => {
    expect(generateBoundaryTestRounds(genericSixDofRobot)).toEqual([]);
  });

  it("iç boşluğu anlamlı olan (a1 ≠ a2) bir robotta 5 farklı round üretir", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    expect(rounds).toHaveLength(5);
    const ids = rounds.map((round) => round.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("'orta' round'u gerçekten ulaşılabilir bir hedef üretir", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    const orta = rounds.find((round) => round.id === "orta")!;
    const outcome = evaluateBoundaryTestGuess(genericTwoDofRobot, orta, true);
    expect(outcome.analysis.angles).not.toBeNull();
  });

  it("'cok-uzak' round'u gerçekten ulaşılamaz bir hedef üretir (azami erişimin çok ötesinde)", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    const cokUzak = rounds.find((round) => round.id === "cok-uzak")!;
    const outcome = evaluateBoundaryTestGuess(genericTwoDofRobot, cokUzak, false);
    expect(outcome.analysis.angles).toBeNull();
    expect(outcome.analysis.status).toBe("unreachable");
  });

  it("'ic-bosluk' round'u gerçekten ulaşılamaz bir hedef üretir (minimum erişimin altında)", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    const icBosluk = rounds.find((round) => round.id === "ic-bosluk")!;
    const outcome = evaluateBoundaryTestGuess(genericTwoDofRobot, icBosluk, false);
    expect(outcome.analysis.angles).toBeNull();
  });

  it("'ic-bosluk-kenari' round'u iç boşluğun az dışında, gerçekten ulaşılabilir bir hedef üretir", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    const kenar = rounds.find((round) => round.id === "ic-bosluk-kenari")!;
    const outcome = evaluateBoundaryTestGuess(genericTwoDofRobot, kenar, true);
    expect(outcome.analysis.angles).not.toBeNull();
  });

  it("'tam-kenar' round'u azami erişime çok yakın ama hâlâ ulaşılabilir bir hedef üretir", () => {
    const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
    const tamKenar = rounds.find((round) => round.id === "tam-kenar")!;
    const outcome = evaluateBoundaryTestGuess(genericTwoDofRobot, tamKenar, true);
    expect(outcome.analysis.angles).not.toBeNull();
  });
});

describe("evaluateBoundaryTestGuess", () => {
  const rounds = generateBoundaryTestRounds(genericTwoDofRobot);
  const orta = rounds.find((round) => round.id === "orta")!;
  const cokUzak = rounds.find((round) => round.id === "cok-uzak")!;

  it("doğru tahmini (ulaşılabilir hedefe 'evet') doğru sayar", () => {
    expect(evaluateBoundaryTestGuess(genericTwoDofRobot, orta, true).correct).toBe(true);
  });

  it("yanlış tahmini (ulaşılabilir hedefe 'hayır') yanlış sayar", () => {
    expect(evaluateBoundaryTestGuess(genericTwoDofRobot, orta, false).correct).toBe(false);
  });

  it("doğru tahmini (ulaşılamaz hedefe 'hayır') doğru sayar", () => {
    expect(evaluateBoundaryTestGuess(genericTwoDofRobot, cokUzak, false).correct).toBe(true);
  });

  it("yanlış tahmini (ulaşılamaz hedefe 'evet') yanlış sayar", () => {
    expect(evaluateBoundaryTestGuess(genericTwoDofRobot, cokUzak, true).correct).toBe(false);
  });
});
