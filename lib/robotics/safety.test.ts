import { describe, expect, it } from "vitest";
import {
  allowedSpeed,
  assessSafetySpeed,
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

describe("assessSafetySpeed", () => {
  it("sıfır hızı güvenli başarı diye kabul etmez", () => {
    expect(assessSafetySpeed(0, 400, 50)).toBe("stopped");
  });

  it("50 mm/s çözünürlükte en hızlı güvenli pozitif adımı kabul eder", () => {
    expect(assessSafetySpeed(350, 374, 50)).toBe("fastest-safe-step");
    expect(assessSafetySpeed(300, 374, 50)).toBe("safe-but-not-maximal");
    expect(assessSafetySpeed(400, 374, 50)).toBe("too-fast");
  });

  it("pozitif güvenli adım yoksa önce mesafenin artırılmasını ister", () => {
    expect(assessSafetySpeed(0, 20, 50)).toBe("no-positive-speed");
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

  it("adaptif hızın dur, yavaşla ve tam hız eşikleri gerekli mesafeyle tutarlıdır", () => {
    const commandedSpeed = 1000;
    const stoppedBoundary = requiredSeparation({ ...input, robotSpeed: 0 }).required;
    const fullSpeedBoundary = requiredSeparation({ ...input, robotSpeed: commandedSpeed }).required;
    const middle = (stoppedBoundary + fullSpeedBoundary) / 2;

    expect(allowedSpeed(stoppedBoundary, input)).toBe(0);
    expect(allowedSpeed(middle, input)).toBeGreaterThan(0);
    expect(allowedSpeed(middle, input)).toBeLessThan(commandedSpeed);
    expect(allowedSpeed(fullSpeedBoundary, input)).toBeCloseTo(commandedSpeed, 9);
  });
});

describe("allowedSpeed monoton", () => {
  const params = { humanSpeed: 1600, reactionTime: 0.1, brakingTime: 0.3, uncertainty: 100 };

  it("mesafe arttıkça izin verilen hız asla düşmez", () => {
    let onceki = -1;
    for (let mesafe = 0; mesafe <= 4000; mesafe += 25) {
      const hiz = allowedSpeed(mesafe, params);
      expect(hiz).toBeGreaterThanOrEqual(onceki);
      onceki = hiz;
    }
  });

  it("SafetyZone'un gösterdiği hız komut hızında monoton ve sıçramasız", () => {
    // Bileşendeki formülün aynısı: min(komut hızı, izinli hız).
    // Eski kod `durum === "dur" ? 0 : ...` diyordu ve komut hızı izinli hızı
    // aşar aşmaz gösterilen değer sıfıra düşüyordu — bu testin yakaladığı
    // sıçrama tam olarak oydu.
    const mesafe = 1500;
    const izinli = allowedSpeed(mesafe, params);
    let onceki = -1;
    for (let komut = 0; komut <= 3000; komut += 10) {
      const gosterilen = Math.min(komut, izinli);
      expect(gosterilen).toBeGreaterThanOrEqual(onceki);
      expect(gosterilen).toBeLessThanOrEqual(izinli);
      onceki = gosterilen;
    }
    // Doyuma ulaşır, sıfıra düşmez.
    expect(Math.min(3000, izinli)).toBeCloseTo(izinli, 10);
  });
});
