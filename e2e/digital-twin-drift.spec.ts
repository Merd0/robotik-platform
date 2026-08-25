import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("dijital ikiz kayması kalıcı artığı teşhis ettirir ve ayrı pozlarda yeniden doğrular", async ({ page }) => {
  await page.goto("/laboratuvar/dijital-ikiz-kaymasi");

  await expect(page.getByRole("heading", { name: "Bağlı olmak, senkron kalmak demek değildir." })).toBeVisible();
  await expect(page.getByText("Senkron", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Üç ay sonraki ölçümleri yükle" }).click();
  await expect(page.getByText("Kayma", { exact: true })).toBeVisible();
  await expect(page.getByText(/en uzun eşik aşımı.*10 örnek/i)).toBeVisible();

  await page.getByRole("radio", { name: /otomatik akışı durdur.*yeniden kalibre et/i }).check();
  await page.getByRole("button", { name: "Kararı değerlendir" }).click();
  await expect(page.getByRole("status", { name: "Kayma kararı geri bildirimi" })).toContainText("Doğru karar");

  await page.getByRole("slider", { name: "İkiz J1 sıfır düzeltmesi" }).fill("7");
  await page.getByRole("button", { name: "Ayrı pozlarda doğrula" }).click();
  await expect(page.getByRole("status", { name: "Kalibrasyon geri bildirimi" })).toContainText("Senkron geri kazanıldı");
  await expect(page.getByText(/4 ayrı doğrulama pozu/i)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("dijital ikiz kayması tek eşik yerine kalıcılık kuralını ve güvenli kapıyı görünür tutar", async ({ page }) => {
  await page.goto("/laboratuvar/dijital-ikiz-kaymasi");
  await page.getByRole("button", { name: "Üç ay sonraki ölçümleri yükle" }).click();
  await page.getByRole("radio", { name: /akışa devam et/i }).check();
  await page.getByRole("button", { name: "Kararı değerlendir" }).click();

  await expect(page.getByRole("status", { name: "Kayma kararı geri bildirimi" })).toContainText("Bu karar güvenli değil");
  await expect(page.getByRole("slider", { name: "İkiz J1 sıfır düzeltmesi" })).toHaveCount(0);
  await expect(page.getByText(/3 ardışık örnek/i)).toBeVisible();
});

test("ilk ziyarette kayma ne demek neden olur açıklaması görünür, kapatılınca yeniden yüklemede çıkmaz", async ({ page }) => {
  await page.goto("/laboratuvar/dijital-ikiz-kaymasi");
  const intro = page.getByRole("note", { name: "Kayma ne demek, neden olur" });
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("sıcaklık değişimi");
  await expect(intro).toContainText("encoder referansı");

  await intro.getByRole("button", { name: "Anladım, kapat" }).click();
  await expect(intro).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Senkron", { exact: true })).toBeVisible();
  await expect(page.getByRole("note", { name: "Kayma ne demek, neden olur" })).toHaveCount(0);
});

test("dijital ikiz kayması laboratuvarı kritik WCAG ihlali üretmez", async ({ page }) => {
  await page.goto("/laboratuvar/dijital-ikiz-kaymasi");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
