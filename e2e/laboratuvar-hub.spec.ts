import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("laboratuvar hub'ı 4 kategoride tüm 11 laboratuvarı listeler", async ({ page }) => {
  await page.goto("/laboratuvar");
  await expect(page.getByRole("heading", { level: 1, name: "Robotik kararlarını çalışan deneylerde sınayabilirsin." })).toBeVisible();

  for (const category of ["Teşhis laboratuvarları", "Kinematik deneyleri", "Karşılaştırma ve keşif araçları", "Kendi ilerlemen"]) {
    await expect(page.getByRole("heading", { level: 2, name: category })).toBeVisible();
  }

  // Önceden yalnız navbar'da tekil link olan 5 laboratuvar artık burada kart olarak var.
  for (const [name, href] of [
    ["Robot Röportajı", "/robot-roportaji"],
    ["Zaman Kapsülü", "/zaman-kapsulu"],
    ["Sınır Testi", "/sinir-testi"],
    ["Kırık Kod Laboratuvarı", "/kirik-kod-laboratuvari"],
    ["Bilgi Haritası", "/bilgi-haritasi"],
  ] as const) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toHaveAttribute("href", href);
  }

  // Önceden zaten hub'da olan laboratuvarlar da korunuyor.
  for (const [name, href] of [
    ["Arıza Kliniği", "/laboratuvar/ariza-klinigi"],
    ["Hata Müzesi", "/laboratuvar/hata-muzesi"],
    ["Dijital İkiz Kayması", "/laboratuvar/dijital-ikiz-kaymasi"],
    ["Ters Problem Modu", "/laboratuvar/ters-problem"],
    ["Dil Karşılaştırıcı", "/laboratuvar/dil-karsilastirici"],
    ["Robot hücresini devreye al", "/laboratuvar/robot-hucresi"],
  ] as const) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toHaveAttribute("href", href);
  }

  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});

test("kategori kısayolları ilgili bölüme çapa bağlantısı taşır", async ({ page }) => {
  await page.goto("/laboratuvar");
  await expect(page.getByRole("navigation", { name: "Kategoriye atla" }).getByRole("link", { name: "Kendi ilerlemen" })).toHaveAttribute("href", "#ilerleme");
  await expect(page.getByRole("heading", { level: 2, name: "Kendi ilerlemen" })).toHaveAttribute("id", "ilerleme-baslik");
});

test("navbar artık tekil laboratuvar sayfalarını ayrı ayrı listelemiyor, yalnız 'Laboratuvarlar' hub linkini taşır", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Ana menü" });
  // Dar viewport'ta (< lg) ana kategori linkleri hamburger menüsüne taşınır (bkz. MobileNavMenu,
  // panel içindeki bağlantılar role="menuitem" taşır — role="link" ile eşleşmez). Açık olsun ki
  // olmasın, `<a href>` elemanları DOM'da kalıyor; rol yerine href'e göre ara.
  const menuButton = nav.getByRole("button", { name: "Menüyü aç" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
  await expect(nav.locator('a[href="/laboratuvar"]:visible')).toHaveCount(1);
  for (const href of ["/robot-roportaji", "/zaman-kapsulu", "/sinir-testi", "/kirik-kod-laboratuvari", "/bilgi-haritasi"]) {
    await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(0);
  }
});

test("konsolide edilen laboratuvar sayfaları 'Laboratuvarlar' ile hub'a geri dönüş sağlar", async ({ page }) => {
  for (const [path, heading] of [
    ["/robot-roportaji", "Robot Röportajı"],
    ["/zaman-kapsulu", "Zaman Kapsülü"],
    ["/sinir-testi", "Sınır Testi"],
    ["/kirik-kod-laboratuvari", "Kırık Kod Laboratuvarı"],
    ["/bilgi-haritasi", "Robotikte hangi kavramın nereye bağlandığını gör."],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const breadcrumbLink = page.getByRole("link", { name: "Laboratuvarlar" }).first();
    await expect(breadcrumbLink).toHaveAttribute("href", "/laboratuvar");
  }
});

test("laboratuvar hub'ı kritik WCAG ihlali üretmez", async ({ page }) => {
  await page.goto("/laboratuvar");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blocking = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
