import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez, debug/overflow-repro dalında
// yalnız CI'ın Linux runner'ında gerçek sayıları görmek için var.

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
      .slice(0, 8);
    return { clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, offenders };
  });
}

test("DEBUG: threshold overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/f-lise-esikleme-nesne-bulma");
  const info = await widestOffenders(page);
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});

test("DEBUG: 6dof overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/a-lise-koordinat-sistemleri");
  const info = await widestOffenders(page);
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});

test("DEBUG: hero height chain", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/");
  const prediction = page.getByRole("button", { name: "Sınırda durur" });
  await expect(prediction).toBeVisible();
  const info = await page.evaluate(() => {
    const target = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Sınırda durur");
    const chain: Array<{ tag: string; cls: string; top: number; bottom: number; height: number }> = [];
    let el: Element | null = target;
    while (el) {
      const r = el.getBoundingClientRect();
      chain.push({
        tag: el.tagName,
        cls: (el.getAttribute("class") ?? "").slice(0, 90),
        top: Math.round(r.top * 1000) / 1000,
        bottom: Math.round(r.bottom * 1000) / 1000,
        height: Math.round(r.height * 1000) / 1000,
      });
      el = el.parentElement;
      if (chain.length > 14) break;
    }
    return { viewportHeight: window.innerHeight, docScrollHeight: document.documentElement.scrollHeight, chain };
  });
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});
