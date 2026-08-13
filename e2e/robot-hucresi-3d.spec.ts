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
  await studio.getByRole("button", { name: "Robotu öğret", exact: true }).click();
  const focusView = page.getByRole("dialog", { name: "Robot hücresi odak görünümü" });
  await expect(focusView).toBeVisible();
  await focusView.getByRole("tab", { name: "Yol provası" }).click();
  const motion = focusView.getByRole("region", { name: "Hareket prova laboratuvarı" });

  await expect(motion.getByRole("heading", { name: "Aynı hedefe iki farklı hareket" })).toBeVisible();
  await expect(motion.getByTestId("movej-result")).toContainText("Geçiş temiz");
  await expect(motion.getByTestId("movel-result")).toContainText("Geçiş temiz");

  await motion.getByRole("button", { name: "MoveL yolunu seç" }).click();
  await expect(motion.getByRole("button", { name: "MoveL yolunu seç" })).toHaveAttribute("aria-pressed", "true");
  await expect(motion.getByRole("slider", { name: "Hareket provası ilerlemesi" })).toBeVisible();

  await motion.getByRole("button", { name: "Dar geçiş hedefi" }).click();
  await expect(motion.getByText("Geçerli bir hedef, güvenli bir yol demek değildir", { exact: false })).toBeVisible();
  await expect(motion.getByTestId("movel-result")).toContainText("Fikstür");
  await expect(motion.getByRole("button", { name: "Çarpışmaya kadar göster" })).toBeEnabled();

  const play = focusView.getByRole("button", { name: "Çarpışmaya kadar oynat" });
  await play.scrollIntoViewIfNeeded();
  await expect(focusView.getByTestId("robot-cell-stage")).toBeInViewport();
  const stageBox = await focusView.getByTestId("robot-cell-stage").boundingBox();
  expect(stageBox?.width).toBeLessThanOrEqual((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) + 1);
  const closeBox = await focusView.getByRole("button", { name: "Sayfaya dön" }).boundingBox();
  expect((closeBox?.x ?? 0) + (closeBox?.width ?? 0)).toBeLessThanOrEqual((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) + 1);
  await play.click();
  await expect(focusView.getByRole("button", { name: "Duraklat" })).toBeVisible();

  await focusView.getByRole("button", { name: "Sayfaya dön" }).click();
  await expect(focusView).toBeHidden();
  await expect(page.getByRole("button", { name: "Robotu öğret" })).toBeFocused();

  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
});

test("robot pozlarını öğretir, programı ön kontrolden geçirir ve satır satır oynatır", async ({ page }) => {
  await page.goto("/laboratuvar/robot-hucresi");
  const studio = page.getByRole("region", { name: "3B dijital robot hücresi" });
  await studio.getByRole("button", { name: "Robotu öğret", exact: true }).click();
  const focusView = page.getByRole("dialog", { name: "Robot hücresi odak görünümü" });

  await focusView.getByRole("tab", { name: "İleri düzey" }).click();
  const teaching = focusView.getByRole("tabpanel", { name: "İşi öğret" });
  await expect(teaching.getByRole("heading", { name: "Robot işini adım adım öğret" })).toBeVisible();
  await expect(teaching.getByText("Önce robotu prova zaman çizgisinde bir poza getir", { exact: false })).toBeVisible();

  await teaching.getByRole("button", { name: "Örnek al-bırak işini yükle" }).click();
  await expect(teaching.getByText("6 hareket · ön kontrol temiz", { exact: false })).toBeVisible();
  await teaching.getByRole("button", { name: "Programı temizle" }).click();

  await teaching.getByRole("button", { name: "Geçerli pozu öğret" }).click();
  await expect(teaching.getByRole("list", { name: "Öğretilen robot programı" }).getByText("P1")).toBeVisible();
  await expect(teaching.getByText("1 hareket · ön kontrol temiz", { exact: false })).toBeVisible();

  await teaching.getByRole("button", { name: "Tutucuyu aç" }).click();
  await expect(teaching.getByRole("list", { name: "Öğretilen robot programı" }).getByText("Tutucuyu aç")).toBeVisible();
  await expect(focusView.getByRole("button", { name: "Programı oynat" })).toBeEnabled();

  const stage = focusView.getByTestId("robot-cell-stage");
  await focusView.getByRole("button", { name: "Programı oynat" }).click();
  await expect(focusView.getByRole("button", { name: "Programı duraklat" })).toBeVisible();
  await expect(stage).toBeInViewport();
  await expect(focusView.getByText(/Satır [12]\/2/)).toBeVisible();

  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
});

test("basit al ve bırak akışında gripper parçayı kavrar ve bırakma alanına taşır", async ({ page }) => {
  await page.goto("/laboratuvar/robot-hucresi");
  const studio = page.getByRole("region", { name: "3B dijital robot hücresi" });
  await studio.getByRole("button", { name: "Robotu öğret", exact: true }).click();
  const focusView = page.getByRole("dialog", { name: "Robot hücresi odak görünümü" });
  const direct = focusView.getByRole("tabpanel", { name: "Al ve bırak" });

  await expect(direct.getByRole("heading", { name: "Robotu adım adım sür" })).toBeVisible();
  await expect(direct.getByRole("button", { name: "Bu pozu programa kaydet" })).toBeVisible();
  await expect(direct.getByRole("button", { name: "Hazır kavrama" })).toHaveCount(0);
  await expect(direct.getByRole("button", { name: "Parçanın üstüne git" })).toHaveCount(0);
  await expect(direct.getByRole("slider")).toHaveCount(0);
  await direct.getByRole("button", { name: "Normal 5 cm" }).click();
  for (let index = 0; index < 3; index += 1) await direct.getByRole("button", { name: "X artı" }).click();
  for (let index = 0; index < 4; index += 1) await direct.getByRole("button", { name: "Y eksi" }).click();
  for (let index = 0; index < 4; index += 1) await direct.getByRole("button", { name: "Z eksi" }).click();
  await expect(direct.getByText("Kavrama noktasında", { exact: true })).toBeVisible();
  await expect(direct.getByRole("button", { name: "Gripper’ı kapat · kavra" })).toBeEnabled();
  await direct.getByRole("button", { name: "Gripper’ı kapat · kavra" }).click();
  await expect(direct.getByText("Parça kavrandı", { exact: false })).toBeVisible();

  for (let index = 0; index < 2; index += 1) await direct.getByRole("button", { name: "Z artı" }).click();
  for (let index = 0; index < 3; index += 1) await direct.getByRole("button", { name: "X eksi" }).click();
  for (let index = 0; index < 6; index += 1) await direct.getByRole("button", { name: "Y eksi" }).click();
  for (let index = 0; index < 7; index += 1) await direct.getByRole("button", { name: "Z eksi" }).click();
  await expect(direct.getByText("Bırakma noktasında", { exact: true })).toBeVisible();
  await direct.getByRole("button", { name: "Gripper’ı aç · bırak" }).click();
  await expect(direct.getByText("Parça mavi alana bırakıldı", { exact: false })).toBeVisible();
  const recordedSteps = direct.getByRole("list", { name: "Basit al ve bırak programı" }).getByRole("listitem");
  await expect(recordedSteps).toHaveCount(11);
  await expect(direct.getByRole("list", { name: "Basit al ve bırak programı" }).getByText("Bırakma konumu")).toBeVisible();
  const recordedLabels = await recordedSteps.allTextContents();
  expect(recordedLabels.findIndex((label) => label.includes("Parçayı bırak")))
    .toBe(recordedLabels.findIndex((label) => label.includes("Bırakma konumu")) + 1);
  await expect(focusView.getByRole("button", { name: "Programı oynat" })).toBeEnabled();
  await expect(direct.getByText("çalışmaya hazır", { exact: false })).toBeVisible();

  expect(await page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(false);
  const blocking = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(blocking).toEqual([]);
});

test("gripper havada açılmaz ve kullanıcı ara pozu açıkça kaydeder", async ({ page }) => {
  await page.goto("/laboratuvar/robot-hucresi");
  const studio = page.getByRole("region", { name: "3B dijital robot hücresi" });
  await studio.getByRole("button", { name: "Robotu öğret", exact: true }).click();
  const focusView = page.getByRole("dialog", { name: "Robot hücresi odak görünümü" });
  const direct = focusView.getByRole("tabpanel", { name: "Al ve bırak" });

  await direct.getByRole("button", { name: "Bu pozu programa kaydet" }).click();
  await expect(direct.getByRole("list", { name: "Basit al ve bırak programı" }).getByText("Kaydedilen ara konum")).toBeVisible();
  await direct.getByRole("button", { name: "Programı temizle" }).click();

  for (let index = 0; index < 3; index += 1) await direct.getByRole("button", { name: "X artı" }).click();
  for (let index = 0; index < 4; index += 1) await direct.getByRole("button", { name: "Y eksi" }).click();
  for (let index = 0; index < 4; index += 1) await direct.getByRole("button", { name: "Z eksi" }).click();
  await direct.getByRole("button", { name: "Gripper’ı kapat · kavra" }).click();
  for (let index = 0; index < 2; index += 1) await direct.getByRole("button", { name: "Z artı" }).click();
  for (let index = 0; index < 2; index += 1) await direct.getByRole("button", { name: "X artı" }).click();

  await expect(direct.getByText("Bırakma noktasında", { exact: true })).toHaveCount(0);
  await direct.getByRole("button", { name: "Gripper’ı aç · bırak" }).click();
  await expect(focusView.getByText("Tutucu kapalı · parça bağlı", { exact: true })).toBeVisible();
  await expect(direct.getByText("Parça havada bırakılamaz", { exact: false })).toBeVisible();
  await expect(direct.getByText("Parça bırakma tablasında", { exact: true })).toHaveCount(0);
  await expect(direct.getByRole("button", { name: "Al-bırak tamamlandı" })).toHaveCount(0);
  await expect(direct.getByText("Bırakma noktasına kalan", { exact: true })).toBeVisible();
  const manualReleaseSteps = direct.getByRole("list", { name: "Basit al ve bırak programı" }).getByRole("listitem");
  await expect(manualReleaseSteps.getByText("Elle bırakma konumu")).toHaveCount(0);
  await expect(manualReleaseSteps.getByText("Parçayı bırak")).toHaveCount(0);
});
