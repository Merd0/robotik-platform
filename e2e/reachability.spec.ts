import { expect, test } from "@playwright/test";

test("IkTarget çalışma uzayını gerçek IK, mekanik limit ve Jacobian durumlarıyla gösterir", async ({ page }) => {
  await page.goto("/ders/b-ortaokul-erisemedigi-noktalar");

  const map = page.getByTestId("reachability-map");
  await expect(map).toBeVisible();
  for (const status of ["reachable", "near-limit", "unreachable", "singularity-risk"]) {
    await expect(map.locator(`[data-reachability-status="${status}"]`).first()).toBeVisible();
  }

  const status = page.getByTestId("reachability-status");
  await expect(status).toContainText("Ulaşılabilir");
  const sliders = page.getByRole("slider");

  // q1 ≈ −174°, q2 ≈ 57°: gerçek IK çözümü var ama J1 mekanik aralığının
  // son %10'unda. Harita yalnız yarıçapa bakarak yeşil diyemez.
  await sliders.nth(0).fill("-1.36");
  await sliders.nth(1).fill("-0.81");
  await expect(status).toContainText("Sınıra yakın — J1");

  // Tam uzatılmış 2R kol: çözüm var, fakat Jacobian manipülabilitesi sıfır.
  await sliders.nth(0).fill("1.8");
  await sliders.nth(1).fill("0");
  await expect(status).toContainText("Tekillik riski");
  await expect(status).toContainText("manipülabilite");

  // Kare slider alanının köşesi radyal erişimin dışında: analitik IK'deki
  // J2 kosinüs koşulu gerçek açı üretemiyor ve somut neden kullanıcıya dönüyor.
  await sliders.nth(1).fill("1.8");
  await expect(status).toContainText("Ulaşılamaz — J2 için gerçek bir açı yok");
  await expect(status).toContainText("azami erişim 1.8 m");
});
