import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez. Tur 5: HİÇBİR elementin
// getBoundingClientRect().right'ı 390'ı geçmiyor (hepsi tam 390), ama
// documentElement.scrollWidth 394. Demek ki bir elementin KENDİ KUTUSU
// tasmiyor ama İÇERİĞİ (overflow:visible, absolute child, canvas ...)
// kendi sınırını aşıyor. Bu turda el.scrollWidth > el.clientWidth olan
// asıl konteyneri arıyoruz.

test("DEBUG: dh-parametreleri ic-icerik tasmasi (tur 6)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/a-universite-dh-parametreleri");
  const info = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const offenders = all
      .map((el) => {
        const e = el as HTMLElement;
        return {
          tag: el.tagName,
          cls: (el.getAttribute("class") ?? "").slice(0, 70),
          clientWidth: e.clientWidth,
          scrollWidth: e.scrollWidth,
          diff: e.scrollWidth - e.clientWidth,
        };
      })
      .filter((o) => o.diff > 1)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 10);
    return { count: offenders.length, offenders };
  });
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});
