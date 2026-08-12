import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("oyun alanı geçersiz robotu reddeder, geçerli robotu kaydeder ve paylaşır", async ({ page }) => {
  await page.goto("/oyun-alani");
  await expect(page.getByRole("heading", { level: 1, name: "Kendi robotunu tasarla." })).toBeVisible();

  await page.getByLabel("Robot etiketi").fill("Öğretmenin üç eksenli kolu");
  await page.getByLabel("Eklem sayısı").selectOption("3");
  await page.getByLabel("J1 bağlantı uzunluğu").fill("0");
  await page.getByRole("button", { name: "Tasarımı uygula" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Robot uygulanamadı" }))
    .toContainText("J1 bağlantı uzunluğu 0,05 ile 2 metre arasında olmalı.");

  await page.getByLabel("J1 bağlantı uzunluğu").fill("0.8");
  await page.getByRole("button", { name: "Tasarımı uygula" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Robot tarayıcıya kaydedildi" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Robot deneyi" }).getByRole("slider", { name: /^J/ })).toHaveCount(3);

  const firstJoint = page.getByRole("slider", { name: "J1 açısı" });
  await firstJoint.focus();
  await firstJoint.press("ArrowRight");
  await page.getByRole("button", { name: "Hedefe çöz" }).click();
  await expect(page.getByRole("region", { name: "Robot deneyi" }).getByRole("status").filter({ hasText: "IK çözümü" })).toBeVisible();

  await page.getByRole("button", { name: "Bu robotu paylaş" }).click();
  const sharedLink = page.getByRole("link", { name: "Paylaşılan robotu aç" });
  const href = await sharedLink.getAttribute("href");
  expect(href).toContain("#lab=");

  await page.evaluate(() => localStorage.clear());
  await page.goto(href!);
  await expect(page.getByLabel("Robot etiketi")).toHaveValue("Öğretmenin üç eksenli kolu");
  await expect(page.getByLabel("Eklem sayısı")).toHaveValue("3");
  await expect(page.getByRole("region", { name: "Robot deneyi" }).getByRole("slider", { name: /^J/ })).toHaveCount(3);
  expect(await page.evaluate(() => localStorage.getItem("robotik-platform:custom-robot:v1"))).not.toBeNull();

  await page.goto("/oyun-alani#lab=bozuk");
  await expect(page.getByRole("alert").filter({ hasText: "Paylaşım bağlantısı açılamadı" })).toBeVisible();
  await expect(page.getByLabel("Robot etiketi")).toHaveValue("Öğretmenin üç eksenli kolu");
  await expect(page.getByLabel("Eklem sayısı")).toHaveValue("3");

  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  for (const buttonName of ["Tasarımı uygula", "Hedefe çöz", "Bu robotu paylaş"]) {
    const box = await page.getByRole("button", { name: buttonName }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});
