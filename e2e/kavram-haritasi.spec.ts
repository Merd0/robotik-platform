import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Kavram Haritası: SVG düğümleri ve metin özeti gerçek ders verisiyle tutarlı, bir derse tıklanabilir", async ({ page }) => {
  await page.goto("/kavram-haritasi");
  await expect(page.getByRole("heading", { level: 1, name: "Kavram Haritası" })).toBeVisible();

  const svg = page.getByRole("img", { name: /dersin hat ve seviyeye göre haritası/ });
  await expect(svg).toBeVisible();
  await expect(svg.locator("circle")).toHaveCount(94);

  await expect(page.getByRole("heading", { level: 2, name: "Metin özeti" })).toBeVisible();
  const temellerBaslik = page.getByRole("heading", { level: 3, name: "Temeller" });
  await expect(temellerBaslik).toBeVisible();

  const dersLinki = page.getByRole("link", { name: "Robot nedir, çevremizde nerede" }).first();
  await expect(dersLinki).toBeVisible();
  await dersLinki.click();
  await expect(page).toHaveURL(/\/ders\/a-ortaokul-robot-nedir/);
});

test("Kavram Haritası: kritik WCAG ihlali üretmez (yoğun SVG düğüm/bağlantı grafiği)", async ({ page }) => {
  await page.goto("/kavram-haritasi");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")).toEqual([]);
});
