import { expect, test } from "@playwright/test";

test("Kırık Kod Laboratuvarı: galeriden bir arıza seçilir, düzeltme gerçek çalıştırmayla doğrulanır, çözüldü rozeti görünür", async ({ page }) => {
  await page.goto("/kirik-kod-laboratuvari");
  await expect(page.getByRole("heading", { level: 1, name: "Kırık Kod Laboratuvarı" })).toBeVisible();

  await page.getByRole("button", { name: /Yanlış işaret/ }).click();
  await expect(page.getByText("Robot (50°, -30°)'a gitmesi gerekirken")).toBeVisible();

  const duzeltilmisKod = ["def git(j1, j2):", "    robot.movej([j1, j2])", "", "git(50, -30)"].join("\n");
  await page.getByLabel("Python kodu").fill(duzeltilmisKod);
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Çalıştır", exact: true }).click();
  await expect(page.getByText("Tamamlandı ✓")).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: "← Galeriye dön" }).click();
  await expect(page.getByText("Çözüldü ✓")).toBeVisible();
});
