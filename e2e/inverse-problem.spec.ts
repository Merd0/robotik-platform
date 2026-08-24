import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function setAngles(page: import("@playwright/test").Page, joint1: string, joint2: string) {
  await page.getByRole("slider", { name: /J1 açısı/i }).fill(joint1);
  await page.getByRole("slider", { name: /J2 açısı/i }).fill(joint2);
}

test("ters problem aynı TCP için iki farklı dirsek çözümünü doğrular", async ({ page }) => {
  await page.goto("/laboratuvar/ters-problem");

  await expect(page.getByRole("heading", { name: "Hedef belli. Onu üreten açıları sen bul." })).toBeVisible();
  await expect(page.getByText(/Hedef TCP.*x /)).toBeVisible();

  await setAngles(page, "25", "80");
  await page.getByRole("button", { name: "Bu çözümü sınayarak kaydet" }).click();
  await expect(page.getByRole("status", { name: "Ters problem geri bildirimi" })).toContainText("İlk çözüm kaydedildi: dirsek yukarı");

  await setAngles(page, "94", "-80");
  await page.getByRole("button", { name: "Bu çözümü sınayarak kaydet" }).click();
  await expect(page.getByRole("heading", { name: "Tek çıktı, iki geçerli girdi" })).toBeVisible();
  await expect(page.getByText(/Çözüm 1 · dirsek yukarı/)).toBeVisible();
  await expect(page.getByText(/Çözüm 2 · dirsek aşağı/)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("ileri ve ters problem yönleri aynı açı durumunu kaybetmeden değişir", async ({ page }) => {
  await page.goto("/laboratuvar/ters-problem");
  await setAngles(page, "25", "80");

  await page.getByRole("radio", { name: /İleri · açılar/i }).check();
  await expect(page.getByText(/Hedef TCP.*x /)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Bu çözümü sınayarak kaydet" })).toHaveCount(0);
  await expect(page.getByText(/Mevcut TCP.*x /)).toBeVisible();

  await page.getByRole("radio", { name: /Ters · TCP/i }).check();
  await expect(page.getByRole("slider", { name: "J1 açısı" })).toHaveValue("25");
  await expect(page.getByRole("slider", { name: "J2 açısı" })).toHaveValue("80");
});

test("ters problem modu kritik WCAG ihlali üretmez", async ({ page }) => {
  await page.goto("/laboratuvar/ters-problem");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
