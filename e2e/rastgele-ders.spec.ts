import { expect, test } from "@playwright/test";

test("Rastgele ders: ana sayfadaki düğme gerçek bir ders sayfasına gider", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "🎲 Rastgele bir ders dene" }).click();
  await expect(page).toHaveURL(/\/ders\/[a-z0-9-]+$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
