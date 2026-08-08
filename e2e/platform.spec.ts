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

test("kavram kontrolü tek başına değil, kayıtlı deney predicate'iyle kanıt üretir", async ({ page }) => {
  await page.goto("/ders/c-universite-algoritma-karsilastirma-deneyi");
  await page.getByRole("button", { name: "Başarı oranını gerekçe gösterip A*" }).click();
  await expect(page.getByText("Kavram kontrolü tamamlandı.", { exact: false })).toBeVisible();
  let evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string }) => event.stage === "passed")).toBe(false);

  await page.getByRole("button", { name: "Yarıştır" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yarıştır" })).toBeEnabled({ timeout: 10_000 });
  evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "planner-three-way-comparison-v1",
  )).toBe(true);
});

test("yerel kayıt silme işlemi iki adımlıdır", async ({ page }) => {
  await page.goto("/ders/a-ortaokul-robot-nedir");
  await page.getByRole("button", { name: "Okumayı kaydet" }).click();
  await page.getByRole("button", { name: "Yerel kaydı sil" }).click();
  await expect(page.getByText("Bu tarayıcıdaki tüm deney kayıtları silinecek.")).toBeVisible();
  await page.getByRole("button", { name: "Silmeyi onayla" }).click();
  expect(await page.evaluate(() => localStorage.getItem("robotik-platform:evidence:v2"))).toBeNull();
});

test("ana sayfa ve ders kritik WCAG ihlali üretmez", async ({ page }) => {
  for (const url of ["/", "/ders/a-ortaokul-robot-nedir"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
    expect(blocking, `${url}: ${blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});
