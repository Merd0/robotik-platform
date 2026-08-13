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
  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  await experiment.getByRole("tab", { name: "Eklemleri sür" }).click();
  await expect(experiment.getByRole("slider", { name: /^J/ })).toHaveCount(3);

  const firstJoint = experiment.getByRole("slider", { name: "J1 açısı" });
  await firstJoint.focus();
  await firstJoint.press("ArrowRight");
  await experiment.getByRole("tab", { name: "Hedefe git" }).click();
  await experiment.getByRole("button", { name: "Hedefe çöz" }).click();
  await expect(page.getByRole("region", { name: "Robot deneyi" }).getByRole("status").filter({ hasText: "IK çözümü" })).toBeVisible();

  await page.getByRole("button", { name: "Bu robotu paylaş" }).click();
  const sharedLink = page.getByRole("link", { name: "Paylaşılan robotu aç" });
  const href = await sharedLink.getAttribute("href");
  expect(href).toContain("#lab=");

  await page.evaluate(() => localStorage.clear());
  await page.goto(href!);
  await expect(page.getByLabel("Robot etiketi")).toHaveValue("Öğretmenin üç eksenli kolu");
  await expect(page.getByLabel("Eklem sayısı")).toHaveValue("3");
  await page.getByRole("region", { name: "Robot deneyi" }).getByRole("tab", { name: "Eklemleri sür" }).click();
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

  for (const buttonName of ["Tasarımı uygula", "Bu robotu paylaş"]) {
    const box = await page.getByRole("button", { name: buttonName }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const experimentAfterRestore = page.getByRole("region", { name: "Robot deneyi" });
  await experimentAfterRestore.getByRole("tab", { name: "Hedefe git" }).click();
  expect((await experimentAfterRestore.getByRole("button", { name: "Hedefe çöz" }).boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test("öğreterek programlama yolu fiziksel provadan geçer, oynatılır ve paylaşılır", async ({ page }) => {
  await page.goto("/oyun-alani");
  await page.getByLabel("Eklem sayısı").selectOption("3");
  await page.getByRole("button", { name: "Tasarımı uygula" }).click();

  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  await experiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await expect(experiment.getByRole("heading", { name: "Hareketi öğret" })).toBeVisible();
  await expect(experiment.getByText("Gerçeklik kapsamı")).toBeVisible();
  await expect(experiment.getByText("Tork, yerçekimi, yük, ivme/jerk")).toBeVisible();

  await experiment.getByRole("button", { name: "Bu pozu öğret" }).click();
  await experiment.getByRole("tab", { name: "Eklemleri sür" }).click();
  const firstJoint = experiment.getByRole("slider", { name: "J1 açısı" });
  await firstJoint.focus();
  for (let step = 0; step < 15; step += 1) await firstJoint.press("ArrowRight");
  await experiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await experiment.getByRole("button", { name: "Bu pozu öğret" }).click();

  await expect(experiment.getByRole("status").filter({ hasText: "Prova hazır" })).toBeVisible();
  await expect(experiment.getByLabel("2 öğretilmiş poz")).toBeVisible();
  await experiment.getByRole("button", { name: "Programı oynat" }).click();
  await expect(experiment.getByRole("status").filter({ hasText: "Program tamamlandı" })).toBeVisible({ timeout: 8_000 });

  await page.getByRole("button", { name: "Bu robotu paylaş" }).click();
  const href = await page.getByRole("link", { name: "Paylaşılan robotu aç" }).getAttribute("href");
  await page.evaluate(() => localStorage.clear());
  await page.goto(href!);
  const restoredExperiment = page.getByRole("region", { name: "Robot deneyi" });
  await restoredExperiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await expect(restoredExperiment.getByLabel("2 öğretilmiş poz")).toBeVisible();
});

test("deney kumandaları sahnenin yanında tek dokunuşla değiştirilir", async ({ page }) => {
  await page.goto("/oyun-alani");
  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  const consoleTabs = experiment.getByRole("tablist", { name: "Deney kumandaları" });

  await expect(consoleTabs.getByRole("tab")).toHaveCount(3);
  await consoleTabs.getByRole("tab", { name: "Hareket öğret" }).click();
  await expect(experiment.getByRole("tabpanel", { name: "Hareket öğret" })).toBeVisible();
  await expect(experiment.getByRole("button", { name: "Yolu kaydet" })).toBeVisible();

  await consoleTabs.getByRole("tab", { name: "Hedefe git" }).click();
  await expect(experiment.getByRole("tabpanel", { name: "Hedefe git" })).toBeVisible();
  await expect(experiment.getByRole("button", { name: "Hedefe çöz" })).toBeVisible();
});

test("hızlı hareket olayları kayıt hakkını tüketmez", async ({ page }) => {
  await page.goto("/oyun-alani");
  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  await experiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await experiment.getByRole("button", { name: "Yolu kaydet" }).click();
  await experiment.getByRole("tab", { name: "Eklemleri sür" }).click();

  const firstJoint = experiment.getByRole("slider", { name: "J1 açısı" });
  await firstJoint.evaluate((element) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    for (let degrees = 1; degrees <= 20; degrees += 1) {
      setter?.call(input, String(degrees));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await experiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await experiment.getByRole("button", { name: "Kaydı bitir" }).click();

  const recordedPoseCount = Number(await experiment.locator('[aria-label$="öğretilmiş poz"] strong').textContent());
  expect(recordedPoseCount).toBeGreaterThanOrEqual(2);
  expect(recordedPoseCount).toBeLessThanOrEqual(3);
});

test("TCP sahnede sürüklenerek canlı IK ile güvenli bir poza yönlendirilir", async ({ page }) => {
  await page.goto("/oyun-alani");
  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  await experiment.getByRole("tab", { name: "Hareket öğret" }).click();
  await experiment.getByRole("button", { name: "TCP’yi elle yönlendir" }).click();

  const scene = experiment.locator('svg[role="img"]');
  await scene.scrollIntoViewIfNeeded();
  const box = await scene.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.92, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.74, box!.y + box!.height * 0.35, { steps: 8 });
  await page.mouse.up();

  await expect(experiment.locator('p[role="status"]').filter({ hasText: "TCP elle yönlendirildi" })).toBeVisible();
  await expect(experiment.getByText("TCP [1.62, 0]", { exact: true })).toHaveCount(0);
});

test("öz-çarpışmaya götüren eklem hareketini açıklanabilir biçimde reddeder", async ({ page }) => {
  await page.goto("/oyun-alani");
  await page.getByLabel("Eklem sayısı").selectOption("3");
  for (const joint of ["J1", "J2", "J3"]) {
    await page.getByLabel(`${joint} bağlantı uzunluğu`).fill("1");
  }
  await page.getByRole("button", { name: "Tasarımı uygula" }).click();

  const experiment = page.getByRole("region", { name: "Robot deneyi" });
  await experiment.getByRole("tab", { name: "Eklemleri sür" }).click();
  await experiment.getByRole("slider", { name: "J2 açısı" }).evaluate((element) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "120");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await experiment.getByRole("slider", { name: "J3 açısı" }).evaluate((element) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "120");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(experiment.getByRole("status").filter({ hasText: "Hareket reddedildi" }))
    .toContainText("L1 ile L3");
  await expect(experiment.getByRole("slider", { name: "J3 açısı" })).not.toHaveValue("120");
});
