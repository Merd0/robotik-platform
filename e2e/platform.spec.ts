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
  // 2026-08-15: Hat D'ye 5 yeni Python/movej/movel dersi eklendi, 89 → 94.
  await expect(platformNumbers.getByText("94", { exact: true })).toBeVisible();
  await expect(platformNumbers.getByText("yayında ders", { exact: true })).toBeVisible();
  const overflows = await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflows).toBe(false);
});

test("öğretmen pilotu görev, mobil ve baskı yüzeylerini birlikte korur", async ({ page }) => {
  await page.goto("/ogretmen");
  await expect(page.getByRole("heading", { name: "Bir hedef, iki robot duruşu." })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  const taskLink = page.getByRole("link", { name: /robotik-platform\.vercel\.app\/ders\/b-lise-geometrik-ters-kinematik/ });
  const taskHref = await taskLink.getAttribute("href");
  expect(taskHref).not.toBeNull();
  const taskHash = new URL(taskHref!).hash;

  await page.goto(`/ders/b-lise-geometrik-ters-kinematik${taskHash}`);
  await expect(page.getByText("Hedef: (0.9, 0.3)", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dirsek: yukarı" })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  await page.goto("/ogretmen");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Tahmin et, çalıştır, farkı gör." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bir hedef, iki robot duruşu." })).toBeHidden();
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.locator("body > footer")).toBeHidden();
});

test("öğretmen pilotu · Hat C görev bağlantısı önceden ayarlanmış dar-koridor sahnesini açar", async ({ page }) => {
  await page.goto("/ogretmen/hat-c");
  await expect(page.getByRole("heading", { name: "Aynı koridor, üç planlayıcı." })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  const taskLink = page.getByRole("link", { name: /robotik-platform\.vercel\.app\/ders\/c-universite-algoritma-karsilastirma-deneyi/ });
  const taskHref = await taskLink.getAttribute("href");
  expect(taskHref).not.toBeNull();
  const taskHash = new URL(taskHref!).hash;

  await page.goto(`/ders/c-universite-algoritma-karsilastirma-deneyi${taskHash}`);
  await expect(page.getByText("Şu an 2 engel var.", { exact: false })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  await page.goto("/ogretmen/hat-c");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Ölç, karşılaştır, seç." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aynı koridor, üç planlayıcı." })).toBeHidden();
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.locator("body > footer")).toBeHidden();
});

test("öğretmen pilotu · Kod Akademisi üç modül bağlantısı da yayında modüllere gider", async ({ page }) => {
  await page.goto("/ogretmen/kod-akademisi");
  await expect(page.getByRole("heading", { name: "Okumadan önce çalıştır." })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  for (const slug of ["koda-temel-ilk-calistirma", "koda-temel-degisken-degistir", "koda-temel-acikla-sonra-uygula"]) {
    const link = page.getByRole("link", { name: new RegExp(`robotik-platform\\.vercel\\.app/kod-akademisi/temel/${slug}$`) });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toBe(`https://robotik-platform.vercel.app/kod-akademisi/temel/${slug}`);
  }

  await page.goto("/ogretmen/kod-akademisi");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "İzle, değiştir, yaz." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Okumadan önce çalıştır." })).toBeHidden();
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.locator("body > footer")).toBeHidden();
});

test("öğretmen pilotu anahtarlayıcısı üç sayfa arasında gezinir", async ({ page }) => {
  await page.goto("/ogretmen");
  await page.getByRole("link", { name: "Hat C · Planlayıcı karşılaştırması" }).click();
  await expect(page).toHaveURL(/\/ogretmen\/hat-c$/);
  await page.getByRole("link", { name: "Kod Akademisi · Giriş" }).click();
  await expect(page).toHaveURL(/\/ogretmen\/kod-akademisi$/);
  await page.getByRole("link", { name: "Hat B · Ters kinematik" }).click();
  await expect(page).toHaveURL(/\/ogretmen$/);
});

test("Pyodide cold-load süresi kullanıcı kodu zaman aşımına karışmaz", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Cold-load sözleşmesi tek gerçek Chromium yüzeyinde yeterli.");
  let firstRuntimeRequest = true;
  await page.route("**/pyodide/**", async (route) => {
    if (firstRuntimeRequest) {
      firstRuntimeRequest = false;
      await new Promise((resolve) => setTimeout(resolve, 9_000));
    }
    await route.continue();
  });

  await page.goto("/ders/d-lise-python-komut-dizisi");
  await page.getByLabel("Python kodu").fill(
    'robot.eklem_ac(0, 60)\nrobot.eklem_ac(1, -20)\nprint("Son duruş hazır.")',
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/ilk kullanım için hazırlanıyor/)).toBeVisible();
  await expect(page.getByText("Son duruş hazır.", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible();
});

test("R3F canvas görünmezken durur ve cihaz DPR bütçesini kullanır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Canvas yaşam döngüsü tek gerçek Chromium yüzeyinde yeterli.");
  await page.goto("/ders/b-lise-geometrik-ters-kinematik");
  const scene = page.locator("[data-scene-active]").first();
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene-active", "true");
  await expect(scene).toHaveAttribute("data-scene-dpr", "1");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(scene).toHaveAttribute("data-scene-active", "false");
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

test("CodeRunner state'i doğrulanmış paylaşım bağlantısıyla geri yüklenir", async ({ page }) => {
  await page.goto("/ders/d-lise-python-komut-dizisi");
  const editor = page.getByLabel("Python kodu");
  const sharedCode = 'robot.eklem_ac(0, 60)\nrobot.eklem_ac(1, -20)\nprint("paylaşıldı")';
  await editor.fill(sharedCode);
  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const sharedLink = page.getByRole("link", { name: "Paylaşılan görünümü aç" });
  await expect(sharedLink).toBeVisible();
  const href = await sharedLink.getAttribute("href");
  expect(href).not.toBeNull();

  await page.goto(href!);
  await expect(page.getByLabel("Python kodu")).toHaveValue(sharedCode);
});

test("movej geçerli bir açı listesiyle robotu hareket ettirir ve predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/ders/d-lise-degiskenlerle-hareket");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible({ timeout: 30_000 });

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "movej-degiskenlerle-hareket-v1",
  )).toBe(true);
});

test("movej yanlış sayıda eklem açısı için öğretici bir hata verir, robotu bozmaz", async ({ page }) => {
  await page.goto("/ders/d-lise-degiskenlerle-hareket");
  await page.getByLabel("Python kodu").fill("robot.movej([75])\nprint(\"bu satıra hiç ulaşılmamalı\")");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/2 eklemli olduğu için movej\(\) 2 eklem açısı bekliyor/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("pre")).not.toContainText("bu satıra hiç ulaşılmamalı");
  // Mesaj TEMİZ olmalı — CPython'un ürettiği ham "Traceback (most recent
  // call last): ..." dökümü veya Pyodide'in dahili JsException sarmalaması
  // sızmamalı (bkz. docs/durum-codex.md — Kod Akademisi'nde boş movej([])
  // ile yakalanan regresyonun kök nedeni buydu, düzeltme pyodideWorker.ts'te
  // sistemik — bu test Hat D üzerinde de aynı düzeltmeyi doğruluyor).
  const preText = await page.locator("pre").textContent();
  expect(preText).not.toContain("Traceback");
  expect(preText).not.toContain("pyodide.ffi");
  expect(preText).not.toContain("_pyodide/_base.py");
});

test("fonksiyonla tanımlanan hareket dizisi çalışır ve predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/ders/d-lise-fonksiyonla-hareket-dizisi");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("pre")).toContainText("Koseye gidildi: (1.0, 0.5)");

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "fonksiyonla-hareket-dizisi-v1",
  )).toBe(true);
});

test("movel bir for döngüsüyle üç noktayı gezer ve predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/ders/d-lise-donguyle-cok-nokta");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible({ timeout: 30_000 });

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "movel-donguyle-rota-v1",
  )).toBe(true);
});

test("koşullu TCP kontrolü doğru dala girer ve predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/ders/d-lise-kosullu-robot-durumu");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("pre")).toContainText("TCP guvenli calisma bolgesinde");

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "kosullu-tcp-kontrolu-v1",
  )).toBe(true);
});

test("Python FK/IK round-trip aynı TCP noktasına ulaşır ve predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/ders/d-universite-python-fk-ik");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("pre")).toContainText("IK'nin bulduğu açılar");

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "python-fk-ik-round-trip-v1",
  )).toBe(true);
});

test("CodeRunner: mobilde çalıştırma sonrası otomatik Sonuç sekmesine geçer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Sekme davranışı yalnız xl: eşiğinin altında var.");
  await page.goto("/ders/d-lise-degiskenlerle-hareket");
  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  const sonucSekmesi = page.getByRole("tab", { name: "Sonuç" });
  await expect(kodSekmesi).toHaveAttribute("aria-selected", "true");
  await expect(sonucSekmesi).toHaveAttribute("aria-selected", "false");

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(sonucSekmesi).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });
  await expect(page.getByText(/Otomatik test geçti/)).toBeVisible();
});

/*
 * CodeRunner'ın masaüstü eşiği (`xl:`, 1280px) Kod Akademisi'nin kendi eşiğinden
 * (`lg:`, 1024px) BİLEREK farklı — bkz. components/interactive/CodeRunner.tsx
 * başlığındaki not ve docs/durum-denetim.md ölçümü. `/ders/[slug]` sayfasının
 * kendi 320px güven panosu yan paneli main sütunu 1024px viewport'ta ~616px'e
 * düşürüyor; Kod Akademisi'nin rahat 1024px ölçümü burada geçerli değil. Bu iki
 * test viewport'u projeden değil elle (setViewportSize) veriyor çünkü mevcut
 * projelerin hiçbiri 1024-1279 aralığını temsil etmiyor — asıl kanıtlanmak
 * istenen tam bu aralıkta (Kod Akademisi'nde split, burada hâlâ sekmeli).
 */
test("CodeRunner: 1152px'de (xl eşiğinin altında) hâlâ sekmeli görünüm var", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Elle viewport veriliyor; tek Chromium yüzeyinde yeterli.");
  await page.setViewportSize({ width: 1152, height: 900 });
  await page.goto("/ders/d-lise-degiskenlerle-hareket");
  await expect(page.getByRole("tablist", { name: "Kod çalıştırma görünümü" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toBeVisible();
  await expect(page.locator("#coderunner-panel-panel-sonuc")).toBeHidden();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("CodeRunner: 1280px'de (xl) kod ve sonuç aynı anda görünür, sekme yok", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Elle viewport veriliyor; tek Chromium yüzeyinde yeterli.");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ders/d-lise-degiskenlerle-hareket");
  await expect(page.getByRole("tablist", { name: "Kod çalıştırma görünümü" })).toBeHidden();
  await expect(page.getByLabel("Python kodu")).toBeVisible();
  await expect(page.locator("#coderunner-panel-panel-sonuc")).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("Kod Akademisi: Değeri değiştir modülü doğru düzeltmeyle predicate'i kanıtlar, düzeltmeden geçmez", async ({ page }) => {
  await page.goto("/kod-akademisi/temel/koda-temel-degisken-degistir");
  await expect(page.getByRole("heading", { name: "Değeri değiştir" })).toBeVisible();

  // Düzenlemeden çalıştırma: predicate geçmemeli.
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });
  const oncesindekiKanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(oncesindekiKanit.some((event: { stage?: string; predicateId?: string }) =>
    event.stage === "passed" && event.predicateId === "koda-temel-degisken-degistir-v1",
  )).toBe(false);

  // İlk çalıştırma bittiğinde dar viewport'ta "Sonuç" sekmesine otomatik
  // geçilir ("Kod" paneli o an gizli) — gerçek kullanıcı gibi önce geri dön.
  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // Doğru düzeltmeyle çalıştırma: predicate geçmeli.
  await page.getByLabel("Python kodu").fill("aci_1 = 60\naci_2 = -45\nrobot.movej([aci_1, aci_2])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-temel-degisken-degistir-v1",
  )).toBe(true);
});

test("Kod Akademisi: robot.movej([]) boş listeyle çalıştırılınca ham traceback değil, öğretici mesaj gösterir", async ({ page }) => {
  // Regresyon testi: bu senaryo (Parametre gönder modülünün kendi başlangıç
  // kodu — boş robot.movej([])) daha önce CPython'un tam "Traceback (most
  // recent call last): ..." dökümünü, pyodide.ffi.JsException dahili
  // detaylarıyla birlikte ekrana döküyordu. Kök neden pyodideWorker.ts'te
  // (JS callback throw ettiğinde Pyodide bunu Python istisnası olarak
  // sarıp geri fırlatıyor, CPython da tam traceback formatlıyordu) — sistemik
  // bir düzeltmeydi, yalnız bu modüle özel değil (bkz. Hat D testindeki aynı
  // kontrol, satır ~198).
  await page.goto("/kod-akademisi/temel/koda-temel-parametre-gonder");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/2 eklemli olduğu için movej\(\) 2 eklem açısı bekliyor/)).toBeVisible({ timeout: 30_000 });

  const preText = await page.locator("pre").textContent();
  expect(preText).not.toContain("Traceback");
  expect(preText).not.toContain("pyodide.ffi");
  expect(preText).not.toContain("_pyodide/_base.py");
  expect(preText).not.toContain("eval_code_async");

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { lessonId?: string; stage?: string }) =>
    event.lessonId === "koda-temel-parametre-gonder" && event.stage === "passed",
  )).toBe(false);

  // İlk çalıştırma bittiğinde dar viewport'ta "Sonuç" sekmesine otomatik
  // geçilir ("Kod" paneli o an gizli) — gerçek kullanıcı gibi önce geri dön.
  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // Doğru düzeltmeyle çalıştırma hâlâ predicate'i geçirmeli — hata yolunu
  // temizlemek başarı yolunu bozmamalı.
  await page.getByLabel("Python kodu").fill("robot.movej([45, -30])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });
});

test("Kod Akademisi: gerçek Python yazım hatası (NameError) da ham traceback göstermez", async ({ page }) => {
  await page.goto("/kod-akademisi/temel/koda-temel-parametre-gonder");
  await page.getByLabel("Python kodu").fill("robott.movej([45, -30])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/NameError.*robott/)).toBeVisible({ timeout: 30_000 });
  const preText = await page.locator("pre").textContent();
  expect(preText).not.toContain("Traceback");
  expect(preText).not.toContain("_pyodide/_base.py");
});

test("Kod Akademisi: Açıkla-sonra-uygula modülü boş editörle açılır, sıfırdan yazılan kod predicate'i geçirir", async ({ page }) => {
  await page.goto("/kod-akademisi/temel/koda-temel-acikla-sonra-uygula");
  await expect(page.getByRole("heading", { name: "Açıkla, sonra uygula" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toHaveValue(/^# Buraya kendi kodunu yaz\.?\s*$/);

  // Boş editörle çalıştırma: otomatik test istiyor ama robot hiç hareket
  // etmedi, predicate geçmemeli.
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // Sıfırdan yazılan doğru kod predicate'i geçirmeli.
  await page.getByLabel("Python kodu").fill("robot.movej([90, -60])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-temel-acikla-sonra-uygula-v1",
  )).toBe(true);
});

test("Kod Akademisi: Hata avcılığı modülü bozuk kodla öğretici hata gösterir, düzeltmeyle predicate'i geçirir, sonunda 'neden' Quiz sorusu var", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-hata-avcisi");
  await expect(page.getByRole("heading", { name: "Hata avcılığı: eksik parametre" })).toBeVisible();

  // Bozuk başlangıç koduyla çalıştırma: temiz öğretici hata mesajı
  // görünmeli, ham traceback DEĞİL (bkz. Parametre gönder modülündeki aynı
  // regresyon testi — kök neden ortak, pyodideWorker.ts seviyesinde).
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/2 eklemli olduğu için movej\(\) 2 eklem açısı bekliyor/)).toBeVisible({ timeout: 30_000 });
  const preText = await page.locator("pre").textContent();
  expect(preText).not.toContain("Traceback");
  expect(preText).not.toContain("pyodide.ffi");

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // Birden fazla doğru düzeltme olabilir — burada listeye aci_2 eklenerek
  // düzeltiliyor, davranışsal (poseMatches) değerlendirme string
  // eşleşmesi değil bunu kanıtlar.
  await page.getByLabel("Python kodu").fill("aci_1 = 90\naci_2 = -45\nrobot.movej([aci_1, aci_2])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-hata-avcisi-v1",
  )).toBe(true);

  // Modül sonu "neden" Quiz sorusu görünür ve seçilince değerlendirici geri bildirim verir.
  await expect(page.getByText(/Hata mesajı 'movej\(\) 2 eklem açısı bekliyor' diyordu/)).toBeVisible();
  await page.getByRole("button", { name: /aci_2 değişkeni tanımlanmıştı/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();
});

test("Kod Akademisi: Döngüyle üç nokta modülü pass'i değiştirmeden geçmez, üç adımlık izle geçer", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-donguyle-uc-nokta");
  await expect(page.getByRole("heading", { name: "Döngüyle üç noktayı ziyaret et" })).toBeVisible();

  // pass ile (hiç hareket etmeden) çalıştırma: predicate geçmemeli.
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "noktalar = [[30, -20], [60, -40], [90, -60]]\n\nfor aci in noktalar:\n    robot.movej(aci)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-donguyle-uc-nokta-v1",
  )).toBe(true);
});

test("Kod Akademisi: Liste ile açı dizisi modülü yanlış index'le geçmez, doğru index'le predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-liste-ile-aci-dizisi");
  await expect(page.getByRole("heading", { name: "Listeden doğru durağı seç" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "duraklar = [[20, -10], [70, -50]]\n\nhedef = duraklar[1]\nrobot.movej(hedef)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-liste-ile-aci-dizisi-v1",
  )).toBe(true);
});

test("Kod Akademisi: Konuma göre dallan modülü pass ile geçmez, if dalı tamamlanınca predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-kosul-ile-dal");
  await expect(page.getByRole("heading", { name: "Konuma göre dallan" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "robot.movej([50, -20])\ntcp = robot.get_tcp()\n\nif tcp.x > 1.0:\n    robot.movej([90, -60])\nelse:\n    robot.movej([10, 60])",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-kosul-ile-dal-v1",
  )).toBe(true);
});

test("Kod Akademisi: Döngü ve liste birlikte modülü boş editörle açılır, sıfırdan yazılan dört noktalık rota predicate'i geçirir", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-donguyle-liste-birlikte");
  await expect(page.getByRole("heading", { name: "Döngü ve liste birlikte" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toHaveValue(/^# Buraya kendi kodunu yaz\.?\s*$/);

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "rota = [[10, -5], [40, -25], [70, -45], [95, -65]]\n\nfor aci in rota:\n    robot.movej(aci)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-donguyle-liste-birlikte-v1",
  )).toBe(true);
});

test("Kod Akademisi: Değişken gölgeleme modülü bozuk kodla yanlış hedefte kalır, isim çakışması çözülünce predicate'i geçirir ve Quiz doğru geri bildirim verir", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-degisken-golgeleme");
  await expect(page.getByRole("heading", { name: "Hata avcılığı: değişken gölgeleme" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "hedef = [90, -60]\n\nara_noktalar = [[20, -10], [50, -30]]\n\nfor ara in ara_noktalar:\n    robot.movej(ara)\n\nrobot.movej(hedef)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-degisken-golgeleme-v1",
  )).toBe(true);

  await page.getByRole("button", { name: /for döngüsü, hedef değişkenini/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();
});

test("Kod Akademisi: Fonksiyon tanımlama modülü pass ile geçmez, gövde tamamlanınca predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-fonksiyon-tanimla");
  await expect(page.getByRole("heading", { name: "Kendi hareket fonksiyonunu yaz" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "def git(j1, j2):\n    robot.movej([j1, j2])\n\ngit(90, -60)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-fonksiyon-tanimla-v1",
  )).toBe(true);
});

test("Kod Akademisi: Fonksiyon ve döngüyü birleştir modülü boş gövdeyle geçmez, tamamlanınca predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-fonksiyonla-liste");
  await expect(page.getByRole("heading", { name: "Fonksiyon ve döngüyü birleştir" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "def rotayi_izle(noktalar):\n    for aci in noktalar:\n        robot.movej(aci)\n\nrotayi_izle([[15, -5], [45, -25], [80, -55]])",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-fonksiyonla-liste-v1",
  )).toBe(true);
});

test("Kod Akademisi: Güvenli bölge kontrolü modülü boş editörle açılır, sıfırdan yazılan fonksiyon predicate'i geçirir", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-kosullu-fonksiyon");
  await expect(page.getByRole("heading", { name: "Güvenli bölge kontrolü" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toHaveValue(/^# Buraya kendi kodunu yaz\.?\s*$/);

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "def guvenli_git(j1):\n    if -90 <= j1 <= 90:\n        robot.movej([j1, -30])\n    else:\n        robot.movej([0, 0])\n\nguvenli_git(120)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-kosullu-fonksiyon-v1",
  )).toBe(true);
});

test("Kod Akademisi: İleri hata avcılığı modülü parametre yerine dış değişken kullanan bozuk kodla yanlış hedefte kalır, düzeltilince predicate'i geçirir ve Quiz doğru geri bildirim verir", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-hata-avcisi");
  await expect(page.getByRole("heading", { name: "Hata avcılığı: parametre mi, dış değişken mi?" })).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "varsayilan_j1 = 0\n\ndef git(j1, j2):\n    robot.movej([j1, j2])\n\ngit(70, -40)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-hata-avcisi-v1",
  )).toBe(true);

  await page.getByRole("button", { name: /Fonksiyonun içindeki movej\(\) çağrısı/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();
});

test("Kod Akademisi: Üç noktayı sırayla ziyaret et (Usta) modülü boş editörle açılır, sıfırdan yazılan kod üç adımlık izle predicate'i geçirir", async ({ page }) => {
  await page.goto("/kod-akademisi/usta/koda-usta-uc-nokta-sirayla");
  await expect(page.getByRole("heading", { name: "Üç noktayı sırayla ziyaret et" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toHaveValue(/^# Buraya kendi kodunu yaz\.?\s*$/);

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "noktalar = [[20, -10], [55, -35], [90, -60]]\n\nfor aci in noktalar:\n    robot.movej(aci)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-usta-uc-nokta-sirayla-v1",
  )).toBe(true);

  // İkinci derinlik turu (docs/15 "Kişisel optimizasyon"): rekabetsiz bilgi
  // kutusu, geçtikten SONRA görünür. Predicate'i etkilemez, sadece bilgi.
  const resultSekmesi = page.getByRole("tab", { name: "Sonuç" });
  if (await resultSekmesi.isVisible()) await resultSekmesi.click();
  const metrik = page.getByTestId("optimization-metric");
  await expect(metrik).toBeVisible();
  await expect(metrik).toContainText("3 satır, 3 robot hareketi");
  await expect(metrik).toContainText("Karşılaştırma yok");
});

test("Kod Akademisi: Güvenli adayları süz (Usta) modülü boş editörle açılır, yalnız güvenli adaylara uğrayan kod predicate'i geçirir", async ({ page }) => {
  await page.goto("/kod-akademisi/usta/koda-usta-kosullu-hareket");
  await expect(page.getByRole("heading", { name: "Güvenli adayları süz" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toHaveValue(/^# Buraya kendi kodunu yaz\.?\s*$/);

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "def guvenli_rotayi_izle(adaylar):\n    for aci in adaylar:\n        if -90 <= aci[0] <= 90:\n            robot.movej(aci)\n\nguvenli_rotayi_izle([[150, -20], [40, -15], [100, -40], [60, -30]])",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-usta-kosullu-hareket-v1",
  )).toBe(true);

  const resultSekmesi = page.getByRole("tab", { name: "Sonuç" });
  if (await resultSekmesi.isVisible()) await resultSekmesi.click();
  await expect(page.getByTestId("optimization-metric")).toContainText("5 satır, 2 robot hareketi");
});

test("Kod Akademisi: Usta finali iki bağımsız hatayı adım adım gösterir, ikisi de düzelince predicate'i kanıtlar ve Quiz doğru geri bildirim verir", async ({ page }) => {
  await page.goto("/kod-akademisi/usta/koda-usta-hata-avcisi-final");
  await expect(page.getByRole("heading", { name: "Hata avcılığı: iki hatayı birden bul" })).toBeVisible();

  // İlk hata: eksik parametre, öğretici mesaj gösterir (ham traceback değil).
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText(/2 eklemli olduğu için movej\(\) 2 eklem açısı bekliyor/)).toBeVisible({ timeout: 30_000 });
  const preText = await page.locator("pre").textContent();
  expect(preText).not.toContain("Traceback");

  let kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // Yalnız ilk hatayı düzelt: ikinci hata (yanlış index) hâlâ orada,
  // predicate hâlâ geçmemeli.
  await page.getByLabel("Python kodu").fill(
    "def rotayi_yap(noktalar):\n    robot.movej([0, 0])\n\n    for aci in noktalar:\n        robot.movej([noktalar[0][0], aci[1]])\n\nrotayi_yap([[30, -10], [60, -30], [90, -50]])",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });
  const araKanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(araKanit.some((event: { stage?: string; predicateId?: string }) =>
    event.stage === "passed" && event.predicateId === "koda-usta-hata-avcisi-final-v1",
  )).toBe(false);

  kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  // İkinci hatayı da düzelt: şimdi predicate geçmeli.
  await page.getByLabel("Python kodu").fill(
    "def rotayi_yap(noktalar):\n    robot.movej([0, 0])\n\n    for aci in noktalar:\n        robot.movej(aci)\n\nrotayi_yap([[30, -10], [60, -30], [90, -50]])",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-usta-hata-avcisi-final-v1",
  )).toBe(true);

  await page.getByRole("button", { name: /Çünkü Python bu satırda hiçbir hata vermiyordu/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();

  // Kişisel optimizasyon retrofiti yalnız iki "Yaz" modülüne uygulandı
  // (docs/15) — bu Hata avcılığı modülünde hiç görünmemeli.
  const resultSekmesi = page.getByRole("tab", { name: "Sonuç" });
  if (await resultSekmesi.isVisible()) await resultSekmesi.click();
  await expect(page.getByTestId("optimization-metric")).toHaveCount(0);
});

test("Kod Akademisi: Teşhis modu (Orta) önce günlüğü/Quiz'i gösterir, sonra bozuk kodu düzeltince predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-teshis-modu");
  await expect(page.getByRole("heading", { name: "Teşhis modu: günlüğü oku" })).toBeVisible();
  await expect(page.getByText(/Gerçekleşen:\s*J1=90\.0°\s*J2=0\.0°/)).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: /hedef_j2 değişkeni var ama movej/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill("hedef_j1 = 90\nhedef_j2 = -60\n\nrobot.movej([hedef_j1, hedef_j2])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-teshis-modu-v1",
  )).toBe(true);
});

test("Kod Akademisi: Teşhis modu (İleri) günlükteki sıra karışıklığını teşhis edip fonksiyonu düzeltince predicate'i kanıtlar", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-teshis-modu");
  await expect(page.getByRole("heading", { name: "Teşhis modu: sıra karışıklığı" })).toBeVisible();
  await expect(page.getByText(/Gerçekleşen:\s*J1=-30\.0°\s*J2=90\.0°/)).toBeVisible();

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: /j1 ve j2'yi ters sırada listeye yazmış/ }).click();
  await expect(page.getByText(/^Doğru\./)).toBeVisible();

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill("def git(j1, j2):\n    robot.movej([j1, j2])\n\ngit(90, -30)");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-teshis-modu-v1",
  )).toBe(true);
});

test("Kod Akademisi: Kod incelemesi (Orta) en sade çözümü seçtirir, sonra kullanıcıya kendi çözümünü sadeleştirtir", async ({ page }) => {
  await page.goto("/kod-akademisi/orta/koda-orta-kod-incelemesi");
  await expect(page.getByRole("heading", { name: "Kod incelemesi: en iyisini seç" })).toBeVisible();

  await page.getByRole("button", { name: /robot\.movej\(duraklar\[-1\]\)/ }).click();
  await expect(page.getByText(/^Doğru\./).first()).toBeVisible();
  await page.getByRole("button", { name: /gereksiz yere iki ekstra hareket yapıyor/ }).click();
  await expect(page.getByText(/^Doğru\./)).toHaveCount(2);

  // Başlangıç kodu (üç ayrı çağrı) doğru poza ulaşır ama sadeleştirilmemiştir — geçmemeli.
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill("duraklar = [[15, -5], [50, -25], [85, -55]]\n\nrobot.movej(duraklar[-1])");
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-orta-kod-incelemesi-v1",
  )).toBe(true);
});

test("Kod Akademisi: Kod incelemesi (İleri) sınır hatasını teşhis ettirir, sonra kullanıcıya düzelttirir", async ({ page }) => {
  await page.goto("/kod-akademisi/ileri/koda-ileri-kod-incelemesi");
  await expect(page.getByRole("heading", { name: "Kod incelemesi: sınır durumu" })).toBeVisible();

  await page.getByRole("button", { name: /-90 <= j1 <= 90/ }).click();
  await expect(page.getByText(/^Doğru\./).first()).toBeVisible();
  await page.getByRole("button", { name: /< işareti sınır değerini/ }).click();
  await expect(page.getByText(/^Doğru\./)).toHaveCount(2);

  // Başlangıç kodu (< sınırı dışlıyor) j1=90 çağrısında yanlış dala gider — geçmemeli.
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tekrar dene", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  if (await kodSekmesi.isVisible()) await kodSekmesi.click();

  await page.getByLabel("Python kodu").fill(
    "def guvenli_git(j1):\n    if -90 <= j1 <= 90:\n        robot.movej([j1, -30])\n    else:\n        robot.movej([0, 0])\n\nguvenli_git(90)",
  );
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Tamamlandı ✓", { exact: true })).toBeVisible({ timeout: 30_000 });

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { stage?: string; verification?: string; predicateId?: string }) =>
    event.stage === "passed" &&
    event.verification === "registry-predicate" &&
    event.predicateId === "koda-ileri-kod-incelemesi-v1",
  )).toBe(true);
});

test("Kod Akademisi: ipucu açma Evidence'a hintLevel ile kaydedilir", async ({ page }) => {
  await page.goto("/kod-akademisi/temel/koda-temel-degisken-degistir");
  await page.getByRole("button", { name: /İpucu göster/ }).click();
  await expect(page.getByText(/İpucu 1:/)).toBeVisible();

  const kanit = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(kanit.some((event: { lessonId?: string; stage?: string; metrics?: { hintLevel?: number } }) =>
    event.lessonId === "koda-temel-degisken-degistir" &&
    event.stage === "observed" &&
    event.metrics?.hintLevel === 1,
  )).toBe(true);
});

test("Kod Akademisi: mobilde çalıştırma sonrası otomatik Sonuç sekmesine geçer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Sekme davranışı yalnız lg: eşiğinin altında var.");
  await page.goto("/kod-akademisi/temel/koda-temel-ilk-calistirma");
  const kodSekmesi = page.getByRole("tab", { name: "Kod" });
  const sonucSekmesi = page.getByRole("tab", { name: "Sonuç" });
  await expect(kodSekmesi).toHaveAttribute("aria-selected", "true");
  await expect(sonucSekmesi).toHaveAttribute("aria-selected", "false");

  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(sonucSekmesi).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });
  await expect(page.getByText("Tamamlandı", { exact: true })).toBeVisible();
});

test("Kod Akademisi: 768px'de (md:) hâlâ sekmeli görünüm var, tam ekran ayrımı yok", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-768", "Bu test özellikle ölçülen lg: (1024px) eşiğinin tablet-768'de henüz devreye girmediğini kanıtlıyor.");
  await page.goto("/kod-akademisi/temel/koda-temel-ilk-calistirma");
  await expect(page.getByRole("tablist", { name: "Kod Akademisi görünümü" })).toBeVisible();
  await expect(page.getByLabel("Python kodu")).toBeVisible();
  // 768px'de (lg:'in altı) "Sonuç" paneli sekmeye basılmadan görünmemeli —
  // 1024px eşiğinin altında hâlâ sekmeli davranış olduğunun kanıtı.
  await expect(page.locator("#koda-mobile-panel-sonuc")).toBeHidden();
});

test("Kod Akademisi: masaüstünde (1440px) kod ve sonuç aynı anda görünür, sekme yok", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "lg: (1024px) eşiğinin üstünde sekme mekanizması devre dışı kalmalı.");
  await page.goto("/kod-akademisi/temel/koda-temel-ilk-calistirma");
  await expect(page.getByRole("tablist", { name: "Kod Akademisi görünümü" })).toBeHidden();
  await expect(page.getByLabel("Python kodu")).toBeVisible();
  // "Sonuç" paneli sekmeye hiç basılmadan da görünür olmalı — masaüstü ayrımının aslı bu.
  await expect(page.locator("#koda-mobile-panel-sonuc")).toBeVisible();
});

test("SignalTimeline state'i paylaşılır ve doğru el sıkışma sırası kanıtlanır", async ({ page }) => {
  await page.goto("/ders/e-lise-el-sikisma");
  await page.getByRole("button", { name: /Dolum robotu: Tepsi hazır — adım 2:/ }).click();
  await page.getByRole("button", { name: /Kapaklama PLC: Aldım — adım 4:/ }).click();
  await page.getByRole("button", { name: "Oynat" }).click();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { stage?: string; predicateId?: string }) =>
    event.stage === "passed" && event.predicateId === "handshake-signal-order-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("button", { name: /Dolum robotu: Tepsi hazır — adım 2: AÇIK/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Kapaklama PLC: Aldım — adım 4: AÇIK/ })).toHaveAttribute("aria-pressed", "true");
});

test("SafetyZone iki sınır ölçümünü kanıtlar ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/h-universite-guvenli-durus-hiz-ve-mesafe");
  const sliders = page.getByRole("slider");
  await expect(sliders).toHaveCount(3);

  await sliders.nth(0).fill("1150");
  await page.getByRole("button", { name: "Bu ölçümü kaydet" }).click();
  await sliders.nth(2).fill("0.6");
  await sliders.nth(0).fill("1900");
  await page.getByRole("button", { name: "Bu ölçümü kaydet" }).click();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "safety-braking-distance-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider").nth(0)).toHaveValue("1900");
  await expect(page.getByRole("slider").nth(2)).toHaveValue("0.6");
});

test("PixelToWorld aynı çevresel hücrede distorsiyonu kanıtlar ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/f-lise-olcek-perspektif-hatasi");
  const grid = page.getByRole("button", { name: /Piksel ızgarası/ });
  await grid.press("ArrowRight");
  await grid.press("ArrowRight");
  for (let step = 0; step < 5; step++) await grid.press("ArrowDown");
  await page.getByRole("checkbox", { name: "Perspektif hatasını göster" }).check();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "camera-distortion-comparison-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("checkbox", { name: "Perspektif hatasını göster" })).toBeChecked();
  await expect(page.getByRole("button", { name: /Seçili hücre: sütun 7, satır 7/ })).toBeVisible();
});

test("JacobianViz gerçek tekillik commit'iyle kanıtlanır ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/b-universite-jacobian");
  const sliders = page.getByRole("slider");
  await expect(sliders).toHaveCount(2);
  await sliders.nth(1).fill("0");
  await sliders.nth(1).evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })));
  await expect(page.getByText("Tekillik:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /O yönde hız üretilemeyebilir/ }).click();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "jacobian-singularity-observation-v2",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider").nth(1)).toHaveValue("0");
  await expect(page.getByText("Tekillik:", { exact: false })).toBeVisible();
});

test("ScanPath iki tamamlanmış yoğunluğu kanıtlar ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/f-universite-tarama-yolu-uretimi");
  const rows = page.getByRole("slider");
  const scan = page.getByRole("button", { name: /^(Tara|Taranıyor…)$/ });

  await rows.fill("2");
  await scan.click();
  await expect(scan).toBeEnabled({ timeout: 5_000 });
  await expect(page.getByRole("status").filter({ hasText: "Toplanan nokta sayısı" })).toHaveText(/24 \/ 24/);

  await rows.fill("3");
  await scan.click();
  await expect(scan).toBeEnabled({ timeout: 6_000 });
  await expect(page.getByRole("status").filter({ hasText: "Toplanan nokta sayısı" })).toHaveText(/36 \/ 36/);

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "scan-row-density-comparison-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider")).toHaveValue("3");
  await expect(page.getByRole("status").filter({ hasText: "Toplanan nokta sayısı" })).toHaveText(/36 \/ 36/);
});

test("BlockEditor limit-içi farklı duruşları kanıtlar ve programı paylaşır", async ({ page }) => {
  await page.goto("/ders/d-ortaokul-blok-komutlar");
  await page.getByRole("button", { name: "+ Hareket ekle" }).click();
  await page.getByRole("button", { name: "+ Hareket ekle" }).click();
  const degrees = page.getByRole("spinbutton");
  await expect(degrees).toHaveCount(2);
  await degrees.nth(1).fill("90");
  const run = page.getByRole("button", { name: /^(Çalıştır|Çalışıyor…)$/ });
  await run.click();
  await expect(run).toBeEnabled({ timeout: 2_000 });
  await expect(page.getByRole("status").filter({ hasText: "Görev kanıtı oluştu" })).toBeVisible();

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "block-sequence-trace-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("spinbutton")).toHaveCount(2);
  await expect(page.getByRole("spinbutton").nth(1)).toHaveValue("90");
});

test("ThresholdViewer üç eşik rejimini kanıtlar ve ayıran eşiği paylaşır", async ({ page }) => {
  await page.goto("/ders/f-lise-esikleme-nesne-bulma");
  const slider = page.getByRole("slider");
  const commit = async (value: string) => {
    await slider.fill(value);
    await slider.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })));
  };

  await commit("30");
  await commit("230");
  await commit("128");

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((item: { stage?: string; predicateId?: string }) =>
    item.stage === "passed" && item.predicateId === "threshold-three-regimes-v1",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider")).toHaveValue("128");
  await expect(page.getByRole("status").filter({ hasText: "Eşiğin üstünde kalan hücre sayısı" })).toHaveText(/21 \/ 96/);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
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

test("TransformOrderLab iki gerçek sonucu kanıtlar ve state'i paylaşır", async ({ page }) => {
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

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).first().click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).first().getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("button", { name: /Önce döndür, sonra ötele/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("slider").first()).toHaveValue("90");
  await expect(page.getByText("orijin (1.000, 0.000) m · seçtiğin sıra", { exact: false }).first()).toBeVisible();

  const editor = page.getByLabel("Python kodu");
  const correctedCode = (await editor.inputValue()).replace("compose = matmul(T, R)", "compose = matmul(R, T)");
  await editor.fill(correctedCode);
  await page.getByRole("button", { name: "Çalıştır" }).click();
  await expect(page.getByText("Otomatik test geçti.", { exact: false })).toBeVisible({ timeout: 30_000 });

  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) =>
    event.stage === "passed" && event.predicateId === "transform-order-comparison-v2",
  )).toBe(true);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("DlsTraceLab aynı hedefte iki bandı kanıtlar ve iz state'ini paylaşır", async ({ page }) => {
  await page.goto("/ders/b-universite-ters-kinematik");
  const damping = page.getByRole("slider", { name: /Sönümleme λ/ });
  const solve = page.getByRole("button", { name: "80 adıma kadar çöz" });

  await expect(damping).toHaveValue("0.08");
  await solve.click();
  await expect(page.getByText(/Yakınsadı · \d+ iterasyon/)).toBeVisible();
  await damping.fill("0.02");
  await solve.click();
  await expect(page.getByText(/Yakınsadı · \d+ iterasyon/)).toBeVisible();
  await expect(page.getByRole("img", { name: "DLS hata normunun iterasyonlara göre azalışı" })).toBeVisible();
  await expect(page.getByRole("slider", { name: /İz adımı/ })).toBeVisible();

  await page.getByRole("button", { name: /Eklem güncellemeleri daha fazla bastırılır/ }).click();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) =>
    event.stage === "passed" && event.predicateId === "dls-damping-comparison-v2",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider", { name: /Sönümleme λ/ })).toHaveValue("0.02");
  await expect(page.getByText(/Yakınsadı · \d+ iterasyon/)).toBeVisible();
  await expect(page.getByRole("img", { name: "DLS hata normunun iterasyonlara göre azalışı" })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("CspaceLab fiziksel sınıf çiftini kanıtlar ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/c-universite-c-space");
  await page.getByRole("button", { name: /Serbest örneğe git/ }).click();
  await expect(page.getByText(/Serbest: bu nokta/)).toBeVisible();
  await page.getByRole("button", { name: "Bu konfigürasyonu kaydet" }).click();
  await page.getByRole("button", { name: /Çarpışan örneğe git/ }).click();
  await expect(page.getByText(/Çarpışma: bu nokta/)).toBeVisible();
  await page.getByRole("button", { name: "Bu konfigürasyonu kaydet" }).click();
  await expect(page.getByText(/Serbest ✓ · Çarpışan ✓/)).toBeVisible();

  await page.getByRole("button", { name: /Altı; her dönel eklem/ }).click();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) =>
    event.stage === "passed" && event.predicateId === "configuration-space-boundary-v2",
  )).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("slider").nth(0)).toHaveValue("20");
  await expect(page.getByRole("slider").nth(1)).toHaveValue("0");
  await expect(page.getByText(/Çarpışma: bu nokta/)).toBeVisible();
  await expect(page.getByText(/Serbest ✓ · Çarpışan ✓/)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("ana sayfa ve ders kritik WCAG ihlali üretmez", async ({ page }) => {
  // On altı ayrı sayfada tam Axe taraması, tam paralel CI yükünde varsayılan
  // 30 saniyeyi aşabiliyor; uygulama bekleme sınırlarını değil bu denetimi uzat.
  test.setTimeout(60_000);
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
    "/kod-akademisi",
    "/kod-akademisi/temel/koda-temel-ilk-calistirma",
    "/kod-akademisi/temel/koda-temel-acikla-sonra-uygula",
    "/kod-akademisi/orta/koda-orta-hata-avcisi",
    "/ogretmen",
    "/ogretmen/hat-c",
    "/ogretmen/kod-akademisi",
  ];
  for (const url of denetlenen) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
    expect(blocking, `${url}: ${blocking.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});

test("RobotSelectionTable dört ölçülü kararı kanıtlar ve state'i paylaşır", async ({ page }) => {
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
  expect(evidence.some((event: { predicateId?: string; stage?: string }) => event.stage === "passed" && event.predicateId === "robot-selection-four-criteria-v2")).toBe(true);

  await page.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  await expect(page.getByRole("button", { name: /Hat içi malzeme taşıma/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel(/Yerleşim sık değişiyor/)).toBeChecked();
  await expect(page.locator('[data-candidate-id="mir250"]')).toContainText("Seçildi");
  await expect(page.getByLabel(/Karar notu/)).toHaveValue(/Dört sayısal sınırı karşılıyor/);
  await expect(page.getByText(/Kararın kanıtlandı/)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("FourLensTraceLab dört senkron örneği kanıtlar ve state'i paylaşır", async ({ page }) => {
  await page.goto("/ders/b-lise-ileri-kinematik");
  let lab = page.locator("section").filter({ has: page.getByRole("heading", { name: "İleri kinematik İz Laboratuvarı" }) });
  await lab.getByRole("button", { name: "Azalır" }).click();
  await lab.getByRole("button", { name: "Programı çalıştır" }).click();
  for (let step = 0; step < 3; step++) await lab.getByRole("button", { name: "Sonraki örnek" }).click();
  await expect(lab.getByText(/Tahminin ölçümle uyuştu/)).toBeVisible();
  await expect(lab.getByRole("img", { name: /Örnek 3: uç nokta/ })).toBeVisible();
  await expect(lab.locator('[aria-current="step"]')).toContainText("q[0] = 75");
  // Faz 2 hardening: predicate artık aynı sayfadaki TransferChallenge'ın da
  // (challengeRevision doğrulamalı) doğru cevaplanmasını istiyor — bkz.
  // lib/evidence.ts "four-lens-fk-trace-v2". Şık metni sabit, karıştırılmış
  // sırada göründüğü konum değil.
  await page.getByRole("button", { name: "Birinci bağlantının dünya yönü" }).click();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem("robotik-platform:evidence:v2") ?? "[]"));
  expect(evidence.some((event: { predicateId?: string; stage?: string }) => event.stage === "passed" && event.predicateId === "four-lens-fk-trace-v2")).toBe(true);

  await lab.getByRole("button", { name: "Bu deneyi paylaş" }).click();
  const href = await lab.getByRole("link", { name: "Paylaşılan görünümü aç" }).getAttribute("href");
  expect(href).not.toBeNull();
  await page.goto(href!);
  lab = page.locator("section").filter({ has: page.getByRole("heading", { name: "İleri kinematik İz Laboratuvarı" }) });
  await expect(lab.getByRole("slider")).toHaveValue("3");
  await expect(lab.locator('[aria-current="step"]')).toContainText("q[0] = 75");
  await expect(lab.getByText(/Tahminin ölçümle uyuştu/)).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
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
