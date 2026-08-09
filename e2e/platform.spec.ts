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

test("hero ilk anlamlı kontrolü ilk viewport içinde gösterir", async ({ page }) => {
  await page.goto("/");
  const prediction = page.getByRole("button", { name: "Aşağı iner" });
  await expect(prediction).toBeVisible();
  const box = await prediction.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  await expect(page.getByRole("link", { name: "Seviyeni seç" })).toHaveAttribute("href", "#seviye-baslik");
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

test("404 durumu taslak yayın sınırını açıklar", async ({ page }) => {
  const response = await page.goto("/ders/d-lise-python-komut-dizisi");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Bu deney production haritasında yok." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Yayınlı derslerde ara" })).toBeVisible();
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

test("homojen dönüşüm pilotu iki işlem sırasını ölçülebilir biçimde ayırır", async ({ page }) => {
  await page.goto("/ders/a-universite-homojen-donusum");
  await page.getByRole("button", { name: "Y ekseni" }).click();
  await page.getByRole("button", { name: "Dönüşümü uygula" }).click();
  await expect(page.getByText("(0.000, 1.000, 0) m")).toBeVisible();

  await page.getByRole("button", { name: /Önce döndür, sonra ötele/ }).click();
  await page.getByRole("button", { name: "X ekseni" }).click();
  await page.getByRole("button", { name: "Dönüşümü uygula" }).click();
  await expect(page.getByText("(1.000, 0.000, 0) m")).toBeVisible();
});

test("DLS pilotu gerçek yineleme izini ve hata eğrisini gösterir", async ({ page }) => {
  await page.goto("/ders/b-universite-ters-kinematik");
  await page.getByRole("button", { name: "80 adıma kadar çöz" }).click();
  await expect(page.getByText(/Yakınsadı · \d+ iterasyon/)).toBeVisible();
  await expect(page.getByRole("img", { name: "DLS hata normunun iterasyonlara göre azalışı" })).toBeVisible();
  await expect(page.getByRole("slider", { name: /İz adımı/ })).toBeVisible();
});

test("C-space pilotu fiziksel çarpışmayı açı uzayındaki yasak bölgeye bağlar", async ({ page }) => {
  await page.goto("/ders/c-universite-c-space");
  await page.getByRole("button", { name: /Serbest örneğe git/ }).click();
  await expect(page.getByText(/Serbest: bu nokta/)).toBeVisible();
  await page.getByRole("button", { name: "Bu konfigürasyonu kaydet" }).click();
  await page.getByRole("button", { name: /Çarpışan örneğe git/ }).click();
  await expect(page.getByText(/Çarpışma: bu nokta/)).toBeVisible();
  await page.getByRole("button", { name: "Bu konfigürasyonu kaydet" }).click();
  await expect(page.getByText(/Serbest ✓ · Çarpışan ✓/)).toBeVisible();
});

test("ana sayfa ve ders kritik WCAG ihlali üretmez", async ({ page }) => {
  for (const url of ["/", "/ders/a-ortaokul-robot-nedir", "/ders/a-universite-robot-mimarileri", "/ders/b-lise-ileri-kinematik"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
    expect(blocking, `${url}: ${blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});

test("Robot Seçim Masası tek kısıt değişimini ve dört ölçülü kararı kanıtlar", async ({ page }) => {
  await page.goto("/ders/a-universite-robot-mimarileri");
  await page.getByRole("button", { name: /Hat içi malzeme taşıma/ }).click();
  const k05 = page.locator('[data-candidate-id="kivnon-k05"]');
  await expect(k05).toHaveAttribute("data-decision-status", "review");
  await page.getByLabel(/Yerleşim sık değişiyor/).check();
  await expect(k05).toHaveAttribute("data-decision-status", "fail");

  const mir = page.locator('[data-candidate-id="mir250"]');
  await mir.getByRole("button", { name: "Bu adayı incele" }).click();
  const numericEvidence = page.locator("fieldset").filter({ hasText: "Savunmana katacağın en az dört sayısal kriter" });
  for (const checkbox of await numericEvidence.locator('input[type="checkbox"]').all()) await checkbox.check();
  await page.getByLabel(/Karar notu/).fill("Dört sayısal sınırı karşılıyor; koruyucu alan ve trafik senaryosu sahada ayrıca doğrulanmalı.");
  await page.getByRole("button", { name: "Kararı test et" }).click();
  await expect(page.getByText(/Kararın kanıtlandı/)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) => event.stage === "passed" && event.predicateId === "robot-selection-four-criteria-v1")).toBe(true);
});

test("İz Laboratuvarı sahne, matris, grafik ve kodu aynı son örneğe taşır", async ({ page }) => {
  await page.goto("/ders/b-lise-ileri-kinematik");
  await page.getByRole("button", { name: "Azalır" }).click();
  await page.getByRole("button", { name: "Programı çalıştır" }).click();
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Sonraki örnek" }).click();
  await expect(page.getByText(/Tahminin ölçümle uyuştu/)).toBeVisible();
  await expect(page.getByRole("img", { name: /Örnek 3: uç nokta/ })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText("q[0] = 75");
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) => event.stage === "passed" && event.predicateId === "four-lens-fk-trace-v1")).toBe(true);
});
