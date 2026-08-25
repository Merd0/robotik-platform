import { expect, test } from "@playwright/test";

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

test("Zaman Kapsülü: hiç kayıt yoksa yönlendirici boş durum gösterir", async ({ page }) => {
  await page.goto("/zaman-kapsulu");
  await expect(page.getByRole("heading", { level: 1, name: "Zaman Kapsülü" })).toBeVisible();
  await expect(page.getByText("Henüz bir kaydın yok.")).toBeVisible();
});

test("Zaman Kapsülü: tam 30 gün önceki gerçek bir olayı 'ay' çapasıyla gösterir, gerçek metrikleriyle", async ({ page }) => {
  const otuzGunOnce = isoDaysAgo(30);
  await page.addInitScript((createdAt) => {
    const event = {
      schemaVersion: 2,
      id: "e2e-zaman-kapsulu-ay",
      lessonId: "b-lise-ileri-kinematik",
      skillId: "forward-kinematics",
      kind: "observation",
      stage: "observed",
      result: "success",
      verification: "component-observed",
      contentVersion: "v1",
      metrics: { aci: 45, mesafe: 1.2 },
      createdAt,
    };
    window.localStorage.setItem("robotik-platform:evidence:v2", JSON.stringify([event]));
  }, otuzGunOnce);

  await page.goto("/zaman-kapsulu");
  await expect(page.getByText("Tam bir ay önce")).toBeVisible();
  await expect(page.getByText(/aci: 45/)).toBeVisible();
  await expect(page.getByRole("link", { name: /İki eklemli kolda ileri kinematik/i })).toBeVisible();
});

test("Zaman Kapsülü: hiçbir olay çapaya yakın değilse yönlendirici 'henüz dolmadı' mesajı gösterir", async ({ page }) => {
  const ikiGunOnce = isoDaysAgo(2);
  await page.addInitScript((createdAt) => {
    const event = {
      schemaVersion: 2,
      id: "e2e-zaman-kapsulu-yeni",
      lessonId: "b-lise-ileri-kinematik",
      skillId: "forward-kinematics",
      kind: "observation",
      stage: "read",
      result: "neutral",
      verification: "self-reported",
      contentVersion: "v1",
      createdAt,
    };
    window.localStorage.setItem("robotik-platform:evidence:v2", JSON.stringify([event]));
  }, ikiGunOnce);

  await page.goto("/zaman-kapsulu");
  await expect(page.getByText("henüz hiçbir olay")).toBeVisible();
});
