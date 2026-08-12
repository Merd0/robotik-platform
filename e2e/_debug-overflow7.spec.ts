import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez. Tur 6: `.ders-icerik` içindeki
// bir <p> (class="") clientWidth 358, scrollWidth 378 (fark 20px) -- html'e
// kadar sönümlenerek 4px'lik gerçek tasmaya donusuyor. Bu turda TAM O <p>'nin
// icerigini (innerHTML) ve hangi cocugunun tastigini buluyoruz.

test("DEBUG: suclu paragrafin icerigi (tur 7)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/a-universite-dh-parametreleri");
  const info = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll(".ders-icerik p"));
    const culprit = paragraphs.find((p) => (p as HTMLElement).scrollWidth > (p as HTMLElement).clientWidth + 1);
    if (!culprit) return { found: false };
    const inlineChildren = Array.from(culprit.querySelectorAll("*")).map((el) => {
      const e = el as HTMLElement;
      return {
        tag: el.tagName,
        cls: (el.getAttribute("class") ?? "").slice(0, 50),
        text: (el.textContent ?? "").slice(0, 60),
        offsetWidth: e.offsetWidth,
      };
    });
    return {
      found: true,
      clientWidth: (culprit as HTMLElement).clientWidth,
      scrollWidth: (culprit as HTMLElement).scrollWidth,
      innerHTML: culprit.innerHTML.slice(0, 400),
      inlineChildren,
    };
  });
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});
