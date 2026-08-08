import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("ana sayfa taşmadan güvenilir bir başlangıç sunar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const platformNumbers = page.getByRole("region", { name: "Platform sayıları" });
  await expect(platformNumbers.getByText("39", { exact: true })).toBeVisible();
  await expect(platformNumbers.getByText("yayında ders", { exact: true })).toBeVisible();
  const overflows = await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflows).toBe(false);
});

test("seviye, hat ve yayınlı ders rotası erişilebilir", async ({ page }) => {
  await page.goto("/seviye/ortaokul");
  const firstTrack = page.locator('a[href*="/seviye/ortaokul/"]').first();
  await expect(firstTrack).toBeVisible();
  await firstTrack.click();
  const firstLesson = page.locator('a[href^="/ders/"]').first();
  await expect(firstLesson).toBeVisible();
  await firstLesson.click();
  await expect(page.locator("main h1")).toBeVisible();
});

test("review borcu yeşil insan incelemesi gibi sunulmaz", async ({ page }) => {
  await page.goto("/ders/a-ortaokul-robot-nedir");
  await expect(page.getByText("Yeniden insan incelemesi gerekli", { exact: false })).toBeVisible();
  await expect(page.getByText(/Artifact: sha256:/)).toBeVisible();
});

test("taslak ders statik üretim çıktısında bulunmaz", async ({ request }) => {
  const response = await request.get("/ders/d-lise-python-komut-dizisi");
  expect(response.status()).toBe(404);
});

test("ana sayfa ve ders kritik WCAG ihlali üretmez", async ({ page }) => {
  for (const url of ["/", "/ders/a-ortaokul-robot-nedir"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
    expect(blocking, `${url}: ${blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});
