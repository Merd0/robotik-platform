import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Hata Müzesi yanlış zihinsel modeli hesaplanmış karşı kanıtla açar", async ({ page }) => {
  await page.goto("/laboratuvar/hata-muzesi");

  await expect(page.getByRole("heading", { name: "Aynı izi iki kez oku: önce cazip hata, sonra ayırt eden kanıt." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Yerinde duran sapma/ })).toBeVisible();
  await expect(page.getByText(/kontrol kazancını artırırsak/i)).toBeVisible();

  await page.getByRole("radio", { name: /Bağımsız referans–ölçüm ortalama farkı/i }).check();
  await page.getByRole("button", { name: "Karşı kanıtı sına" }).click();
  await expect(page.getByRole("status", { name: "Müze karşı kanıt geri bildirimi" })).toContainText("Karşı kanıt ayırt ediyor");
  await expect(page.getByRole("heading", { name: "Yanlış okuma" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doğru okuma" })).toBeVisible();
  await expect(page.getByText(/Robotu durdur; harici referansla konumu doğrula/i)).toBeVisible();

  await page.getByRole("button", { name: "Sıradaki esere geç" }).click();
  await expect(page.getByRole("heading", { name: /Geçmişten gelen konum/ })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("Hata Müzesi ayırt etmeyen ölçümle doğru okumayı açmaz", async ({ page }) => {
  await page.goto("/laboratuvar/hata-muzesi");
  await page.getByRole("radio", { name: /En yüksek paket yaşı/i }).check();
  await page.getByRole("button", { name: "Karşı kanıtı sına" }).click();

  await expect(page.getByRole("status", { name: "Müze karşı kanıt geri bildirimi" })).toContainText("Bu ölçüm tek başına ayırt etmiyor");
  await expect(page.getByRole("heading", { name: "Doğru okuma" })).toHaveCount(0);
  await expect(page.getByText(/seed 0.*kullanıcı kaydı değildir/i)).toBeVisible();
});

test("Hata Müzesi kritik WCAG ihlali üretmez", async ({ page }) => {
  await page.goto("/laboratuvar/hata-muzesi");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
