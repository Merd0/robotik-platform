import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("3B robot hücresi altı ekseni sürer ve erişilebilir bir metin karşılığı sunar", async ({ page }) => {
  await page.goto("/laboratuvar/robot-hucresi");
  const studio = page.getByRole("region", { name: "3B dijital robot hücresi" });

  await expect(studio.getByRole("heading", { name: "Hücreyi üç boyutta devreye al" })).toBeVisible();
  await expect(studio.getByRole("slider", { name: /^J/ })).toHaveCount(6);
  await expect(studio.getByRole("button", { name: "Üstten gör" })).toBeVisible();
  await expect(studio.getByTestId("tcp-position-3d")).toContainText(/X .+ Y .+ Z/);
  await expect(studio.getByText("gerçek robot komutu üretmez", { exact: false })).toBeVisible();

  const before = await studio.getByTestId("tcp-position-3d").textContent();
  const firstJoint = studio.getByRole("slider", { name: "J1 açısı" });
  await firstJoint.focus();
  await firstJoint.press("End");
  await expect(studio.getByTestId("tcp-position-3d")).not.toHaveText(before!);
  await expect(studio.getByText("Etkin eksen: J1", { exact: false })).toBeVisible();

  await studio.getByRole("button", { name: "Üstten gör" }).click();
  await expect(studio.getByRole("button", { name: "Üstten gör" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);

  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
});

test("MoveJ ve MoveL yollarını karşılaştırır, çarpışan provayı açıklayarak durdurur", async ({ page }) => {
  await page.goto("/laboratuvar/robot-hucresi");
  const studio = page.getByRole("region", { name: "3B dijital robot hücresi" });
  await studio.getByRole("button", { name: "Hareket provası", exact: true }).click();
  const motion = studio.getByRole("region", { name: "Hareket prova laboratuvarı" });

  await expect(motion.getByRole("heading", { name: "Aynı hedefe iki farklı hareket" })).toBeVisible();
  await expect(motion.getByTestId("movej-result")).toContainText("Geçiş temiz");
  await expect(motion.getByTestId("movel-result")).toContainText("Geçiş temiz");

  await motion.getByRole("button", { name: "MoveL yolunu seç" }).click();
  await expect(motion.getByRole("button", { name: "MoveL yolunu seç" })).toHaveAttribute("aria-pressed", "true");
  await expect(motion.getByRole("slider", { name: "Hareket provası ilerlemesi" })).toBeVisible();

  await motion.getByRole("button", { name: "Dar geçiş hedefi" }).click();
  await expect(motion.getByTestId("movel-result")).toContainText("Fikstür");
  await expect(motion.getByRole("button", { name: "Çarpışmaya kadar göster" })).toBeEnabled();

  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
});
