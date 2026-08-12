import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez, debug/overflow-repro dalında
// yalnız CI'ın Linux runner'ında gerçek sayıları görmek için var.

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
        return {
          tag: el.tagName,
          cls: (el.getAttribute("class") ?? "").slice(0, 100),
          right: Math.round(r.right * 1000) / 1000,
          width: Math.round(r.width * 1000) / 1000,
          left: Math.round(r.left * 1000) / 1000,
        };
      })
      .filter((o) => o.right > clientWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 5);
    return { clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, offenders };
  });
}

test("DEBUG: threshold overflow (fix sonrasi)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/f-lise-esikleme-nesne-bulma");
  const info = await widestOffenders(page);
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});

test("DEBUG: tum 6-DOF derslerini tara (fix sonrasi)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  const results: Record<string, unknown> = {};
  for (const url of publishedSixAxisLessons) {
    await page.goto(url);
    results[url] = await widestOffenders(page);
  }
  expect(JSON.stringify(results, null, 2)).toBe("__FORCE_FAIL__");
});

test("DEBUG: hero height chain (fix sonrasi)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/");
  const prediction = page.getByRole("button", { name: "Sınırda durur" });
  await expect(prediction).toBeVisible();
  const box = await prediction.boundingBox();
  const viewport = page.viewportSize();
  expect(JSON.stringify({ bottom: box!.y + box!.height, viewportHeight: viewport!.height, margin: viewport!.height - (box!.y + box!.height) }, null, 2)).toBe("__FORCE_FAIL__");
});
