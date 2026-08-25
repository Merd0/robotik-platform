import { expect, test } from "@playwright/test";

const CRITICAL_ROUTES = [
  "/",
  "/ders/a-lise-tcp-kavrami",
  "/seviye/lise/hat/b-kinematik",
  "/sozluk/ters-kinematik",
  "/laboratuvar",
  "/laboratuvar/robot-hucresi",
  "/kod-akademisi",
] as const;
const externalBaseUrl = process.env.RELEASE_SMOKE_BASE_URL?.replace(/\/$/, "");

function isKnownBrowserDiagnostic(type: string, text: string, url: string): boolean {
  if (type === "warning" && text.startsWith("THREE.Clock: This module has been deprecated.")) return true;
  if (type === "warning" && text.includes("GPU stall due to ReadPixels")) return true;
  // Statik test sunucusu Next'in istemci-prefetch `*.txt?_rsc=` uçlarını
  // sunmaz. Gerçek `<a href>` hedefleri build kapısında ayrıca bütünüyle
  // taranır; burada yalnız bu sentetik prefetch 404'leri görmezden gelinir.
  return type === "error" && text.startsWith("Failed to load resource:") && (/__next|_rsc=/.test(url) || !externalBaseUrl);
}

test("kritik yayın rotaları mobilde taşmaz ve konsolu kirletmez", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "mobile-390", "Yayın smoke denetimi tek mobil yüzeyde yeterli.");
  const browserIssues: string[] = [];

  page.on("console", (message) => {
    const type = message.type();
    const url = message.location().url;
    if ((type === "error" || type === "warning") && !isKnownBrowserDiagnostic(type, message.text(), url)) {
      browserIssues.push(`${type}: ${message.text()}${url ? ` · ${url}` : ""}`);
    }
  });
  page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "bilinmiyor";
    if (failure === "net::ERR_ABORTED" || /__next|_rsc=/.test(request.url())) return;
    browserIssues.push(`requestfailed: ${request.url()} · ${failure}`);
  });

  for (const route of CRITICAL_ROUTES) {
    const target = externalBaseUrl ? `${externalBaseUrl}${route}` : route;
    const response = await page.goto(target, { waitUntil: "domcontentloaded" });
    expect(response?.ok(), `${route} HTTP yanıtı`).toBe(true);
    await page.locator("main#ana-icerik").last().waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${route} yatay taşma`).toBeLessThanOrEqual(1);
  }

  expect(browserIssues, browserIssues.join("\n")).toEqual([]);
});
