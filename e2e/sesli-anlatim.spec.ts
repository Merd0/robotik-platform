import { expect, test } from "@playwright/test";

// CI çalıştırıcılarında (ve birçok headless Linux ortamında) sistemde kurulu
// TTS sesi bulunmuyor: gerçek `speechSynthesis.speak()` neredeyse anında
// "synthesis-failed" ile `onerror`'a düşüyor. Bu, `ReadAloud` bileşeninin
// "playing" durumunu React'in hiç boyamadığı, gözle görülmeyen tek bir
// render'a sıkışmasına yol açıyor — gerçek kullanıcıda (kurulu sesi olan bir
// tarayıcıda) hiç yaşanmayan, yalnızca ses motorunun yokluğuna bağlı bir CI
// ortam kısıtlaması. Test, ürünün oynat/duraklat/durdur durum makinesini
// sınıyor — gerçek ses motorunun var olup olmadığını değil — bu yüzden
// `speechSynthesis`'i burada deterministik biçimde sahteliyoruz.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeUtterance extends EventTarget {
      text: string;
      lang = "";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        super();
        this.text = text;
      }
    }
    const fake = {
      speaking: false,
      paused: false,
      pending: false,
      speak(utterance: FakeUtterance) {
        this.speaking = true;
        this.paused = false;
        utterance.onstart?.();
      },
      pause() {
        this.paused = true;
      },
      resume() {
        this.paused = false;
      },
      cancel() {
        this.speaking = false;
        this.paused = false;
      },
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
    // @ts-expect-error - testte gerçek tarayıcı sınıfının yerini alıyor
    window.SpeechSynthesisUtterance = FakeUtterance;
  });
});

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
