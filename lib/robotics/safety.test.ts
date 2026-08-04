import { describe, expect, it } from "vitest";
import {
  allowedSpeed,
  requiredSeparation,
  stoppingDistance,
  travelDistance,
  zoneState,
} from "./safety";

describe("travelDistance", () => {
  it("sabit hızla alınan yolu verir", () => {
    expect(travelDistance(1000, 0.5)).toBe(500);
  });

  it("negatif hız veya süreyi sıfıra kırpar", () => {
    expect(travelDistance(-1000, 0.5)).toBe(0);
    expect(travelDistance(1000, -0.5)).toBe(0);
  });

  it("sonlu olmayan girdiyi reddeder", () => {
    expect(() => travelDistance(Number.NaN, 1)).toThrow();
    expect(() => travelDistance(1, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("stoppingDistance", () => {
  it("frenleme süresi boyunca alınan yolu verir", () => {
    expect(stoppingDistance(1500, 0.2)).toBeCloseTo(300, 9);
  });

  it("robot duruyorsa sıfırdır", () => {
    expect(stoppingDistance(0, 0.4)).toBe(0);
  });
});

describe("requiredSeparation", () => {
  const base = {
    robotSpeed: 1000,
    humanSpeed: 1600,
    reactionTime: 0.1,
    brakingTime: 0.3,
    uncertainty: 100,
  };

  it("iki tarafın yolunu ve belirsizliği toplar", () => {
    const result = requiredSeparation(base);
    // toplam süre 0.4 s → insan 640 mm, robot 400 mm, pay 100 mm
    expect(result.humanTravel).toBeCloseTo(640, 9);
    expect(result.robotTravel).toBeCloseTo(400, 9);
    expect(result.required).toBeCloseTo(1140, 9);
  });

  it("robot durunca gerekli mesafe sadece insan yolu + paydır", () => {
    const result = requiredSeparation({ ...base, robotSpeed: 0 });
    expect(result.robotTravel).toBe(0);
    expect(result.required).toBeCloseTo(740, 9);
  });

  it("robot hızı arttıkça gerekli mesafe artar (monoton)", () => {
    const yavas = requiredSeparation({ ...base, robotSpeed: 200 }).required;
    const hizli = requiredSeparation({ ...base, robotSpeed: 1200 }).required;
    expect(hizli).toBeGreaterThan(yavas);
  });
});

describe("zoneState", () => {
  it("gerekli mesafenin altında dur der", () => {
    expect(zoneState(500, 1000)).toBe("dur");
  });

  it("uyarı bandında yavasla der", () => {
    expect(zoneState(1500, 1000)).toBe("yavasla");
  });

  it("yeterince uzakta serbest der", () => {
    expect(zoneState(2500, 1000)).toBe("serbest");
  });

  it("sınır değerinde dur değil yavasla der (kapalı alt sınır)", () => {
    expect(zoneState(1000, 1000)).toBe("yavasla");
  });
});

describe("allowedSpeed", () => {
  const input = {
    humanSpeed: 1600,
    reactionTime: 0.1,
    brakingTime: 0.3,
    uncertainty: 100,
  };

  it("requiredSeparation'ın tersidir: hesaplanan hız aynı mesafeyi geri verir", () => {
    const measured = 1140;
    const speed = allowedSpeed(measured, input);
    const back = requiredSeparation({ ...input, robotSpeed: speed });
    expect(back.required).toBeCloseTo(measured, 6);
  });

  it("gerekli mesafenin altında sıfır hız verir", () => {
    expect(allowedSpeed(700, input)).toBe(0);
  });

  it("mesafe arttıkça izin verilen hız artar", () => {
    expect(allowedSpeed(2000, input)).toBeGreaterThan(allowedSpeed(1200, input));
  });
});
