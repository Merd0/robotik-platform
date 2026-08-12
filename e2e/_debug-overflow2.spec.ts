import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez, debug/overflow-repro-2 dalında
// yalnız CI'ın Linux runner'ında 6-DOF ders taşmasının gerçek kaynağını
// görmek için var (8f22150 fix'i bu taşmayı çözmedi, run #77 hâlâ kırmızı).

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
          fontFamily: style.fontFamily.slice(0, 60),
          text: (el.textContent ?? "").trim().slice(0, 60),
        };
      })
      .filter((o) => o.right > clientWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 6);
    return { clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, offenders };
  });
}

test("DEBUG: 6-DOF tasma kok nedeni (tur 2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  const results: Record<string, unknown> = {};
  for (const url of publishedSixAxisLessons) {
    await page.goto(url);
    const info = await widestOffenders(page);
    if (info.overflow > 0) {
      results[url] = info;
    }
  }
  expect(JSON.stringify(results, null, 2)).toBe("__FORCE_FAIL__");
});
