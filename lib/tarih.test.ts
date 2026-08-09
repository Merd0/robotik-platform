import { describe, expect, it } from "vitest";
import { bugunIstanbul } from "./tarih";

describe("proje saat diliminde gün", () => {
  it("UTC günü ile yerel gün ayrıştığında yerel günü verir", () => {
    // Gerçek regresyon: 2026-08-09T21:02Z, Europe/Istanbul'da 10 Ağustos
    // 00:02'dir. toISOString().slice(0, 10) burada 2026-08-09 döndürüyordu ve
    // review makbuzuna bir gün geriye tarih yazıyordu.
    expect(bugunIstanbul(new Date("2026-08-09T21:02:55.851Z"))).toBe("2026-08-10");
  });

  it("gün içi saatlerde UTC ile aynı günü verir", () => {
    expect(bugunIstanbul(new Date("2026-08-09T12:00:00Z"))).toBe("2026-08-09");
  });

  it("yerel gün sınırının hemen öncesinde günü çevirmez", () => {
    expect(bugunIstanbul(new Date("2026-08-09T20:59:59Z"))).toBe("2026-08-09");
  });

  it("YYYY-MM-DD biçimi üretir", () => {
    expect(bugunIstanbul()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
