import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("bilgi haritası gerçek kapsamı ve TCP bağlantılarını görünür kılar", async ({ page }) => {
  await page.goto("/bilgi-haritasi");

  await expect(page.getByRole("heading", { level: 1, name: "Robotikte hangi kavramın nereye bağlandığını gör." })).toBeVisible();
  await expect(page.getByText("206 düğüm", { exact: true })).toBeVisible();
  await expect(page.getByText("94 ders", { exact: true })).toBeVisible();
  await expect(page.getByText("72 terim", { exact: true })).toBeVisible();
  await expect(page.getByText("19 etkileşim/lab", { exact: true })).toBeVisible();
  await expect(page.getByText("21 Kod Akademisi", { exact: true })).toBeVisible();

  const detail = page.getByRole("region", { name: "Seçili düğüm" });
  await expect(detail.getByRole("heading", { name: "alet merkez noktası" })).toBeVisible();
  await expect(detail.getByText("tool center point (TCP)", { exact: true })).toBeVisible();
  await expect(detail.getByRole("button", { name: /Alet merkez noktası \(TCP\) kavramı/ })).toBeVisible();
  await expect(detail.getByRole("button", { name: /hedef ve IK/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /206 düğümlü robotik bilgi haritası/ })).toBeVisible();

  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("arama, filtre ve harita düğümü aynı seçimi günceller", async ({ page }) => {
  await page.goto("/bilgi-haritasi");
  await expect(page.locator('[data-graph-ready="true"]')).toBeVisible({ timeout: 30_000 });

  await page.getByLabel("Düğüm ara").fill("jacobian");
  await page.locator('[data-result-id="term:jacobian-matrisi"]').click();
  await expect(page.getByRole("status")).toContainText("Jacobian matrisi seçildi");
  await expect(page.getByRole("region", { name: "Seçili düğüm" }).getByRole("heading", { name: "Jacobian matrisi" })).toBeVisible();

  await page.getByLabel("Düğüm ara").fill("");
  await page.getByLabel("İçerik türü").selectOption("code");
  await expect(page.getByText(/21 sonuçtan/)).toBeVisible();
  await page.locator('[data-node-id="term:alet-merkez-noktasi"]').click();
  await expect(page.getByRole("status")).toContainText("alet merkez noktası seçildi");
});

test("bilgi haritası kritik erişilebilirlik ihlali üretmez", async ({ page }) => {
  await page.goto("/bilgi-haritasi");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});

test("ilk ziyarette kısa yönlendirme görünür, kapatılınca yeniden yüklemede çıkmaz", async ({ page }) => {
  await page.goto("/bilgi-haritasi");
  const intro = page.getByRole("note", { name: "Bilgi haritası nasıl kullanılır" });
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("bir noktaya tıkla");

  await intro.getByRole("button", { name: "Anladım, kapat" }).click();
  await expect(intro).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("region", { name: "Seçili düğüm" })).toBeVisible();
  await expect(page.getByRole("note", { name: "Bilgi haritası nasıl kullanılır" })).toHaveCount(0);
});

test("sözlük keşif yüzeyi bilgi haritasına ulaştırır", async ({ page }) => {
  await page.goto("/sozluk");
  await expect(page.getByRole("link", { name: /bağlantılarını haritada gör/ })).toHaveAttribute("href", "/bilgi-haritasi");
});
