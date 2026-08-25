import { expect, test } from "@playwright/test";

test("Robot Röportajı: Meca500 seçilince gerçek marka/kaynak cevabı verir, jenerik robotta marka uydurmaz", async ({ page }) => {
  await page.goto("/robot-roportaji");
  await expect(page.getByRole("heading", { level: 1, name: "Robot Röportajı" })).toBeVisible();

  await page.getByLabel("Röportaj yapacağın robot").selectOption({ label: "Mecademic Meca500 R4" });
  await page.getByRole("button", { name: "Sen kimsin?" }).click();
  await expect(page.getByTestId("roportaj-cevap").last()).toContainText("Mecademic Meca500 R4");

  await page.getByRole("button", { name: "Bilgilerinin kaynağı ne?" }).click();
  await expect(page.getByTestId("roportaj-cevap").last()).toContainText("Mecademic");

  await page.getByLabel("Röportaj yapacağın robot").selectOption({ label: "Genel 2 eklemli kol" });
  await page.getByRole("button", { name: "Sen kimsin?" }).click();
  const genericAnswer = page.getByTestId("roportaj-cevap").last();
  await expect(genericAnswer).toContainText("jenerik");
  await expect(genericAnswer).not.toContainText("Mecademic");
});

test("Robot Röportajı: mühendislik gerekçesi genişletilebilir panelde görünür", async ({ page }) => {
  await page.goto("/robot-roportaji");
  await expect(page.getByText("Serbest deney · devreye alma mülakatı")).toBeVisible();
  await expect(page.getByText("saha mühendisi")).toBeVisible();

  const details = page.getByText("Bir mühendis bu soruları neden sorar?");
  await expect(page.getByText("Güvenlik: tekillik yakınında")).not.toBeVisible();
  await details.click();
  await expect(page.getByText("Güvenlik: tekillik yakınında")).toBeVisible();
});

test("Robot Röportajı: robot değiştirilince geçmiş sıfırlanır, 'Röportajı sıfırla' geçmişi temizler", async ({ page }) => {
  await page.goto("/robot-roportaji");
  await page.getByRole("button", { name: "Kaç eksenin var?" }).click();
  await expect(page.getByTestId("roportaj-cevap")).toHaveCount(1);

  await page.getByRole("button", { name: "Röportajı sıfırla" }).click();
  await expect(page.getByTestId("roportaj-cevap")).toHaveCount(0);

  await page.getByRole("button", { name: "Kaç eksenin var?" }).click();
  await page.getByLabel("Röportaj yapacağın robot").selectOption({ label: "Mecademic Meca500 R4" });
  await expect(page.getByTestId("roportaj-cevap")).toHaveCount(0);
});
