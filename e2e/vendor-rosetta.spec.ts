import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("dil karşılaştırıcı ortak niyetten beş ölçütlü vendor farkına gider", async ({ page }) => {
  await page.goto("/laboratuvar/dil-karsilastirici");

  await expect(page.getByRole("heading", { name: "Aynı hareket niyeti, aynı program demek değildir." })).toBeVisible();
  await expect(page.getByLabel("ABB RAPID salt okunur komut görünümü")).toContainText("MoveJ pHedef");
  await expect(page.getByLabel("Mecademic TCP/Text API salt okunur komut görünümü")).toContainText("MovePose(400,120,300,180,0,90)");
  await expect(page.getByRole("heading", { name: "1. Hedef", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2. İş çerçevesi", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /çalıştır|indir|robota gönder/i })).toHaveCount(0);

  await page.getByRole("radio", { name: /Görev 2.*doğrusal/i }).check();
  await expect(page.getByLabel("ABB RAPID salt okunur komut görünümü")).toContainText("MoveL pHedef");
  await expect(page.getByLabel("Mecademic TCP/Text API salt okunur komut görünümü")).toContainText("MoveLin(400,120,300,180,0,90)");
  await expect(page.getByText("z10 ile %50 aynı geometrik tolerans değildir")).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("dil karşılaştırıcı kritik WCAG ihlali üretmez", async ({ page }) => {
  await page.goto("/laboratuvar/dil-karsilastirici");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
