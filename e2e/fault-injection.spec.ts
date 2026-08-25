import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("arıza kliniği gözlemden güvenli teşhise sıralı ilerler", async ({ page }) => {
  await page.goto("/laboratuvar/ariza-klinigi");

  await expect(page.getByRole("heading", { name: "Semptomu izle, arızayı güvenle teşhis et." })).toBeVisible();
  await expect(page.getByText("1/4 · Gözlem")).toBeVisible();

  await page.getByRole("button", { name: "Paket yaşı kanalını aç" }).click();
  await expect(page.getByRole("img", { name: /paket yaşı zaman grafiği/i })).toBeVisible();
  await page.getByText("Örneklenmiş veriyi tablo olarak göster").click();
  const table = page.getByRole("table", { name: /seçilen telemetri izinden/i });
  await expect(table.getByRole("columnheader", { name: "Yaş (ms)" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Uygulanan" })).toHaveCount(0);
  await page.getByRole("button", { name: "Hipoteze geç" }).click();

  await page.getByRole("radio", { name: "Paket gecikmesi" }).check();
  await page.getByRole("button", { name: "İlk eyleme geç" }).click();
  await page.getByRole("radio", { name: /güvenli duruşa al.*zaman damgalarını/i }).check();
  await page.getByRole("button", { name: "Doğrulama testine geç" }).click();
  await page.getByRole("radio", { name: /mesaj yaşını.*incele/i }).check();
  await page.getByRole("button", { name: "Teşhisi değerlendir" }).click();

  await expect(page.getByRole("status")).toContainText("Teşhis doğrulandı");
  await expect(page.getByText(/kök neden.*paket gecikmesi/i)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("arıza kliniği güvenli olmayan ilk eylemi başarı saymaz", async ({ page }) => {
  await page.goto("/laboratuvar/ariza-klinigi");
  await page.getByRole("button", { name: "Paket yaşı kanalını aç" }).click();
  await page.getByRole("button", { name: "Hipoteze geç" }).click();
  await page.getByRole("radio", { name: "Paket gecikmesi" }).check();
  await page.getByRole("button", { name: "İlk eyleme geç" }).click();
  await page.getByRole("radio", { name: "Kontrol kazancını artır" }).check();
  await page.getByRole("button", { name: "Doğrulama testine geç" }).click();
  await page.getByRole("radio", { name: /mesaj yaşını.*incele/i }).check();
  await page.getByRole("button", { name: "Teşhisi değerlendir" }).click();

  await expect(page.getByRole("status")).toContainText("Güvenli ilk eylem uyuşmuyor");
  await expect(page.getByRole("button", { name: "Aynı vakayı yeniden incele" })).toBeVisible();
});

test("laboratuvar dizini ve arıza kliniği kritik WCAG ihlali üretmez", async ({ page }) => {
  for (const url of ["/laboratuvar", "/laboratuvar/ariza-klinigi"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
    expect(blocking, `${url}: ${blocking.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});
