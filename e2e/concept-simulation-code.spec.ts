import { expect, test } from "@playwright/test";

const matches = [
  {
    lesson: "d-lise-degiskenlerle-hareket",
    modulePath: "/kod-akademisi/temel/koda-temel-degisken-degistir",
    moduleTitle: "Değeri değiştir",
  },
  {
    lesson: "d-lise-donguyle-cok-nokta",
    modulePath: "/kod-akademisi/orta/koda-orta-donguyle-uc-nokta",
    moduleTitle: "Döngüyle üç noktayı ziyaret et",
  },
  {
    lesson: "d-lise-kosullu-robot-durumu",
    modulePath: "/kod-akademisi/orta/koda-orta-kosul-ile-dal",
    moduleTitle: "Konuma göre dallan",
  },
  {
    lesson: "d-lise-fonksiyonla-hareket-dizisi",
    modulePath: "/kod-akademisi/ileri/koda-ileri-fonksiyonla-liste",
    moduleTitle: "Fonksiyon ve döngüyü birleştir",
  },
] as const;

test("doğal ders, simülasyon ve kod üçlüleri görünür bir akıştan çalışan modüle gider", async ({ page }) => {
  for (const match of matches) {
    await page.goto(`/ders/${match.lesson}`);

    const bridge = page.getByRole("region", { name: "Kavram → Simülasyon → Kod" });
    await expect(bridge).toBeVisible();
    await expect(bridge.getByRole("listitem")).toHaveCount(3);
    await expect(bridge.getByText("1. Kavram", { exact: true })).toBeVisible();
    await expect(bridge.getByText("2. Simülasyon", { exact: true })).toBeVisible();
    await expect(bridge.getByText("3. Kod", { exact: true })).toBeVisible();

    const moduleLink = bridge.getByRole("link");
    await expect(moduleLink).toHaveAttribute("href", match.modulePath);
    await moduleLink.click();
    await expect(page).toHaveURL(new RegExp(`${match.modulePath}$`));
    await expect(page.getByRole("heading", { level: 1, name: match.moduleTitle })).toBeVisible();
  }
});
