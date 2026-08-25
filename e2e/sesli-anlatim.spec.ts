import { expect, test } from "@playwright/test";

test("Sesli anlatım: bir ders sayfasında oynat/duraklat/durdur durum geçişleri çalışır", async ({ page }) => {
  await page.goto("/ders/b-ortaokul-eklemleri-oynat");

  await expect(page.getByText("Sesli anlatım")).toBeVisible();
  await expect(page.getByRole("button", { name: "▶ Oku" })).toBeVisible();

  await page.getByRole("button", { name: "▶ Oku" }).click();
  await expect(page.getByRole("button", { name: "⏸ Duraklat" })).toBeVisible();
  await expect(page.getByRole("button", { name: "⏹ Durdur" })).toBeVisible();

  await page.getByRole("button", { name: "⏸ Duraklat" }).click();
  await expect(page.getByRole("button", { name: "▶ Devam et" })).toBeVisible();

  await page.getByRole("button", { name: "⏹ Durdur" }).click();
  await expect(page.getByRole("button", { name: "▶ Oku" })).toBeVisible();
});
