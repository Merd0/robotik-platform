import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publishedSixAxisLessons = [
  "/ders/a-lise-koordinat-sistemleri",
  "/ders/a-lise-serbestlik-derecesi",
  "/ders/a-lise-tcp-kavrami",
  "/ders/a-universite-dh-parametreleri",
  "/ders/a-universite-kinematik-zincir",
  "/ders/a-universite-poz-gosterimleri",
];

test("ana sayfa taşmadan güvenilir bir başlangıç sunar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const platformNumbers = page.getByRole("region", { name: "Platform sayıları" });
  // 2026-08-10 politika değişikliğinde 50 taslak yayına alındığı için 39 → 89.
  await expect(platformNumbers.getByText("89", { exact: true })).toBeVisible();
  await expect(platformNumbers.getByText("yayında ders", { exact: true })).toBeVisible();
  const overflows = await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflows).toBe(false);
});

test("hero ilk anlamlı kontrolü ilk viewport içinde gösterir", async ({ page }) => {
  await page.goto("/");
  const prediction = page.getByRole("button", { name: "Sınırda durur" });
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

/*
 * Bu testin eski hâli "review borcu yeşil insan incelemesi gibi sunulmaz"
 * adıyla, makbuzu olmayan derste bir UYARI rozeti arıyordu. O rozet
 * 2026-08-10 kararından sonra bilinçli olarak kaldırıldı: insan incelemesi
 * opsiyonel olduğu için "inceleme bekliyor" demek yanlış bir beklenti
 * üretiyordu (bkz. components/lesson/LessonTrustPanel.tsx yorumu).
 *
 * Korunması gereken asıl güvence tersinden hâlâ geçerli ve burada ölçülüyor:
 * incelenmemiş bir ders, incelenmiş gibi YEŞİL gösterilemez. Bu, makbuz
 * sisteminin tek kullanıcıya dönük vaadi.
 */
test("insan incelemesi rozeti yalnız gerçek makbuzu olan derste görünür", async ({ page }) => {
  await page.goto("/ders/b-lise-ileri-kinematik");
  const incelenmis = page.locator("[data-review-state]");
  await expect(incelenmis).toHaveAttribute("data-review-state", "verified");
  await expect(incelenmis).toContainText("Bu sürüm elle incelendi");

  await page.goto("/ders/a-ortaokul-robot-nedir");
  await expect(page.getByText("Bu sürüm elle incelendi")).toHaveCount(0);
  await expect(page.locator("[data-review-state]")).toHaveCount(0);
  // Makbuz olmasa da kaynak zorunluluğu duruyor: yayının tek içerik şartı bu.
  await expect(page.getByText("kaynağı olmayan bilgi yayımlanmaz", { exact: false })).toBeVisible();
});

test("bilinmeyen ders adresi güvenli 404 sınırında karşılanır", async ({ page }) => {
  const response = await page.goto("/ders/boyle-bir-ders-yok");
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
    event.predicateId === "planner-three-way-comparison-v2",
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

test("iki eklemli kaydırıcı deneyi klavye ve pointer commit'iyle geçilebilir", async ({ page }) => {
  await page.goto("/ders/b-ortaokul-eklemleri-oynat");
  const experiment = page.locator("[data-joint-sliders]");
  await experiment.scrollIntoViewIfNeeded();
  const sliders = experiment.getByRole("slider");
  await expect(sliders).toHaveCount(2);

  // J1: klavye commit — odaklan, ok tuşuyla değiştir, tuş bırakılınca (keyup) "observed" yazılmalı.
  await sliders.nth(0).focus();
  await sliders.nth(0).press("ArrowRight");

  // J2: pointer commit — Pointer Events mouse ve touch'ı aynı olayla temsil eder,
  // bu yüzden tek bir pointerup dispatch'i ikisini de temsil eder.
  await sliders.nth(1).evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "30";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });

  await page.getByRole("button", { name: "Robotun iki eklem açısını" }).click();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { skillId?: string; stage?: string; metrics?: { joint?: number } }) =>
    event.skillId === "forward-kinematics" && event.stage === "observed" && event.metrics?.joint === 1,
  )).toBe(true);
  expect(evidence.some((event: { skillId?: string; stage?: string; metrics?: { joint?: number } }) =>
    event.skillId === "forward-kinematics" && event.stage === "observed" && event.metrics?.joint === 2,
  )).toBe(true);
  expect(evidence.some((event: { stage?: string; predicateId?: string }) =>
    event.stage === "passed" && event.predicateId === "forward-kinematics-dual-joint-v2",
  )).toBe(true);
});

test("dirsek değiştirme deneyi iki gerçek çözülebilir duruşla geçilebilir (Sprint 2 doğruluk düzeltmesi)", async ({ page }) => {
  await page.goto("/ders/b-ortaokul-birden-fazla-yol");
  const toggle = page.getByRole("button", { name: /^Dirsek:/ });
  await toggle.scrollIntoViewIfNeeded();

  // Başlangıç hedefinde her iki duruş da (yukarı/aşağı) gerçekten çözülebilir —
  // bu yüzden iki tık, iki AYRI gerçek "success" gözlemi üretir.
  await toggle.click();
  await toggle.click();

  await page.getByRole("button", { name: "Dirsek-aşağı çözümünü" }).click();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { skillId?: string; stage?: string; result?: string; metrics?: { elbow?: string } }) =>
    event.skillId === "multiple-ik-solutions" && event.stage === "observed" && event.result === "success" && event.metrics?.elbow === "up",
  )).toBe(true);
  expect(evidence.some((event: { skillId?: string; stage?: string; result?: string; metrics?: { elbow?: string } }) =>
    event.skillId === "multiple-ik-solutions" && event.stage === "observed" && event.result === "success" && event.metrics?.elbow === "down",
  )).toBe(true);
  expect(evidence.some((event: { stage?: string; predicateId?: string }) =>
    event.stage === "passed" && event.predicateId === "multiple-ik-solutions-v2",
  )).toBe(true);
});

test("homojen dönüşüm pilotu iki işlem sırasını ölçülebilir biçimde ayırır", async ({ page }) => {
  await page.goto("/ders/a-universite-homojen-donusum");
  await page.getByRole("button", { name: "Y ekseni" }).click();
  await page.getByRole("button", { name: "Dönüşümü uygula" }).click();
  // İki sıranın sonucu artık aynı sahnede yan yana duruyor: koordinatlar
  // matris tablosunda değil, her zaman görünen karşılaştırma listesinde.
  await expect(page.getByText("orijin (0.000, 1.000) m", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("orijin (1.000, 0.000) m", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/sıra farklı, sonuç 1\.414 m uzakta/)).toBeVisible();

  await page.getByRole("button", { name: /Önce döndür, sonra ötele/ }).click();
  await page.getByRole("button", { name: "X ekseni" }).click();
  await page.getByRole("button", { name: "Dönüşümü uygula" }).click();
  await expect(page.getByText("orijin (1.000, 0.000) m · seçtiğin sıra", { exact: false }).first()).toBeVisible();
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
  const denetlenen = [
    "/",
    "/seviye/ortaokul",
    "/seviye/lise",
    "/seviye/universite",
    "/ders/a-ortaokul-robot-nedir",
    "/ders/a-universite-robot-mimarileri",
    "/ders/a-universite-homojen-donusum",
    "/ders/b-lise-ileri-kinematik",
    "/laboratuvar/robot-hucresi",
  ];
  for (const url of denetlenen) {
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

test("altı yayınlı 6-DOF deneyi sahne ve gruplanmış kontrollerle kompakt kalır", async ({ page }) => {
  for (const url of publishedSixAxisLessons) {
    await page.goto(url);
    const experiment = page.locator('[data-joint-sliders][data-robot-id="generic-6dof"]');
    await expect(experiment).toBeVisible();
    await expect(experiment.getByRole("slider")).toHaveCount(6);
    await expect(experiment.getByRole("group", { name: "Kol · J1–J3" })).toBeVisible();
    await expect(experiment.getByRole("group", { name: "Bilek · J4–J6" })).toBeVisible();

    const box = await experiment.boundingBox();
    expect(box, `${url}: deney kutusu ölçülemedi`).not.toBeNull();
    expect(box!.height, `${url}: 6-DOF deney kutusu yeniden dikey yığıldı`).toBeLessThan(800);
    expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  }
});

test("J6 TCP konumunu sabit tutarken görünür alet yönelimini değiştirir", async ({ page }) => {
  await page.goto("/ders/a-lise-serbestlik-derecesi");
  const experiment = page.locator('[data-joint-sliders][data-robot-id="generic-6dof"]');
  await experiment.scrollIntoViewIfNeeded();

  const position = experiment.getByTestId("tcp-position");
  const orientation = experiment.getByTestId("tool-orientation");
  const beforePosition = await position.textContent();
  const beforeOrientation = await orientation.textContent();
  await experiment.getByRole("slider").nth(5).press("End");

  await expect(experiment.getByTestId("active-joint-axis")).toContainText("etkin J6");
  await expect(position).toHaveText(beforePosition!);
  await expect(orientation).not.toHaveText(beforeOrientation!);
});
