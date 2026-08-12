import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez. Tablo sarmalayıcısı MASUM
// çıktı (round 4: wrapper 358/358, docOverflow yine 4). Gerçek suçluyu
// bulmak için TEK URL'de genis esikli offender taraması.

test("DEBUG: dh-parametreleri gercek suclu (tur 5)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/a-universite-dh-parametreleri");
  const info = await page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;
    const scrollWidth = doc.scrollWidth;
    const all = Array.from(document.querySelectorAll("*"));
    const offenders = all
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          cls: (el.getAttribute("class") ?? "").slice(0, 60),
          right: Math.round(r.right * 100) / 100,
          left: Math.round(r.left * 100) / 100,
        };
      })
      .filter((o) => o.right > clientWidth - 2)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12);
    return { clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, offenders };
  });
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});
