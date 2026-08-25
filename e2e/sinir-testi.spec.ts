import { expect, test } from "@playwright/test";

test("Sınır Testi: doğru tahmin gerçek sonuçla eşleşir, tüm round'lar bitince skor gösterilir", async ({ page }) => {
  await page.goto("/sinir-testi");
  await expect(page.getByRole("heading", { level: 1, name: "Sınır Testi" })).toBeVisible();

  let roundCount = 0;
  while (roundCount < 10) {
    const bitti = await page.getByText(/^Bitti —/).isVisible().catch(() => false);
    if (bitti) break;
    roundCount += 1;

    // "Çok uzak" round'unu tanı ve doğru tahmin et: gerçek sonucun "Doğru tahmin." demesini bekle.
    const cokUzakGorunur = await page.getByText("Azami erişimin epey ötesinde bir nokta").isVisible().catch(() => false);
    if (cokUzakGorunur) {
      await page.getByRole("button", { name: "Ulaşılamaz" }).click();
      await expect(page.getByTestId("sinir-testi-sonuc")).toContainText("Doğru tahmin.");
    } else {
      await page.getByRole("button", { name: "Ulaşılabilir" }).click();
      await expect(page.getByTestId("sinir-testi-sonuc")).toBeVisible();
    }

    const sonrakiVarMi = await page.getByRole("button", { name: /Sıradaki round|Bitir/ }).isVisible();
    if (sonrakiVarMi) await page.getByRole("button", { name: /Sıradaki round|Bitir/ }).click();
  }

  await expect(page.getByText(/^Bitti — \d+ \/ \d+ doğru tahmin\.$/)).toBeVisible();
  await page.getByRole("button", { name: "Yeniden dene" }).click();
  await expect(page.getByText("Round 1 / 5")).toBeVisible();
});
