import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez. AccessibleTable fix'inden
// SONRA bile run #79'da aynı test hâlâ kırmızı; tam offender + font verisiyle
// tekrar bakıyoruz.

const publishedSixAxisLessons = [
  "/ders/a-lise-koordinat-sistemleri",
  "/ders/a-lise-serbestlik-derecesi",
  "/ders/a-lise-tcp-kavrami",
  "/ders/a-universite-dh-parametreleri",
  "/ders/a-universite-kinematik-zincir",
  "/ders/a-universite-poz-gosterimleri",
];

async function widestOffenders(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;
    const scrollWidth = doc.scrollWidth;
    const all = Array.from(document.querySelectorAll("*"));
    const offenders = all
      .map((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          tag: el.tagName,
          cls: (el.getAttribute("class") ?? "").slice(0, 140),
          right: Math.round(r.right * 1000) / 1000,
          width: Math.round(r.width * 1000) / 1000,
          left: Math.round(r.left * 1000) / 1000,
          fontFamily: style.fontFamily.slice(0, 80),
          fontLoaded: (document as unknown as { fonts: { check: (f: string) => boolean } }).fonts?.check(`16px "${style.fontFamily.split(",")[0].replace(/['"]/g, "").trim()}"`),
          text: (el.textContent ?? "").trim().slice(0, 80),
        };
      })
      .filter((o) => o.right > clientWidth - 5)
      .sort((a, b) => b.right - a.right)
      .slice(0, 8);
    return { clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, offenders };
  });
}

test("DEBUG: 6-DOF tasma kok nedeni (tur 3, fix sonrasi)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  const results: Record<string, unknown> = {};
  for (const url of publishedSixAxisLessons) {
    await page.goto(url);
    const info = await widestOffenders(page);
    results[url] = info;
  }
  expect(JSON.stringify(results, null, 2)).toBe("__FORCE_FAIL__");
});
