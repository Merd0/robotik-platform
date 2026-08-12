import { expect, test } from "@playwright/test";

// GEÇİCİ TEŞHİS DOSYASI — main'e asla girmez. Tek URL'e odaklan, kücük ve
// GitHub annotation limitine sigacak boyutta veri dön.

test("DEBUG: dh-parametreleri tablo sarmalayici Linux'ta calisiyor mu (tur 4)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "yalnız mobile-390");
  await page.goto("/ders/a-universite-dh-parametreleri");
  const info = await page.evaluate(() => {
    const doc = document.documentElement;
    const wrapper = document.querySelector(".ders-tablo-scroll");
    const table = document.querySelector(".ders-tablo-scroll table");
    const wrapperStyle = wrapper ? getComputedStyle(wrapper) : null;
    return {
      docClientWidth: doc.clientWidth,
      docScrollWidth: doc.scrollWidth,
      docOverflow: doc.scrollWidth - doc.clientWidth,
      wrapperFound: !!wrapper,
      wrapperClientWidth: wrapper ? (wrapper as HTMLElement).clientWidth : null,
      wrapperScrollWidth: wrapper ? (wrapper as HTMLElement).scrollWidth : null,
      wrapperOverflowX: wrapperStyle ? wrapperStyle.overflowX : null,
      wrapperMaxWidth: wrapperStyle ? wrapperStyle.maxWidth : null,
      tableWidth: table ? Math.round(table.getBoundingClientRect().width * 100) / 100 : null,
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 50),
    };
  });
  expect(JSON.stringify(info, null, 2)).toBe("__FORCE_FAIL__");
});
