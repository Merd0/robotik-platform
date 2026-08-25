import { chromium, type Page } from "playwright";

interface MetricStore {
  lcp: number;
  cls: number;
  interactions: Record<string, number>;
}

const baseUrl = (process.env.CWV_BASE_URL ?? "http://127.0.0.1:3102").replace(/\/$/, "");
const surfaces = [
  { name: "Ana sayfa", path: "/", selector: 'input[type="range"]' },
  { name: "TCP dersi", path: "/ders/a-lise-tcp-kavrami", selector: 'input[type="range"]' },
  { name: "3B robot hücresi", path: "/laboratuvar/robot-hucresi", selector: 'button:has-text("Eksenleri göster")' },
] as const;

async function installObservers(page: Page) {
  await page.addInitScript(() => {
    const store: MetricStore = { lcp: 0, cls: 0, interactions: {} };
    Object.defineProperty(window, "__robotikCwv", { value: store, configurable: false });

    if (PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) store.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) store.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("event")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; interactionId: number }>) {
          if (!entry.interactionId) continue;
          const key = String(entry.interactionId);
          store.interactions[key] = Math.max(store.interactions[key] ?? 0, entry.duration);
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit & { durationThreshold: number });
    }
  });
}

const browser = await chromium.launch({ headless: true });

for (const surface of surfaces) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await installObservers(page);
  await page.goto(`${baseUrl}${surface.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const control = page.locator(surface.selector).first();
  await control.waitFor({ state: "visible", timeout: 15_000 });
  await control.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const store = (window as typeof window & { __robotikCwv: MetricStore }).__robotikCwv;
    const durations = Object.values(store.interactions).sort((left, right) => left - right);
    const index = Math.max(0, Math.ceil(durations.length * 0.98) - 1);
    return { lcp: store.lcp, cls: store.cls, inp: durations[index] ?? 0, interactionCount: durations.length };
  });
  console.log(`${surface.name}: LCP ${metrics.lcp.toFixed(0)} ms · INP-lab ${metrics.inp > 0 ? `${metrics.inp.toFixed(0)} ms` : "<16 ms"} · CLS ${metrics.cls.toFixed(3)} · ${metrics.interactionCount} etkileşim`);
  await context.close();
}

await browser.close();
