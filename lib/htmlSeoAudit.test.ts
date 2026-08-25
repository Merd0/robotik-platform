import { describe, expect, it } from "vitest";
import { auditHtmlSeo, extractHtmlSeoIdentity, htmlContainsVisibleText } from "./htmlSeoAudit";

const COMPLETE_HTML = `<!doctype html>
<html lang="tr"><head>
  <title>Robotik laboratuvarları · Robotik Laboratuvarı</title>
  <meta name="description" content="Tarayıcıda çalışan robotik deneylerini keşfet.">
  <link rel="canonical" href="https://robotik-platform.vercel.app/laboratuvar">
  <meta property="og:title" content="Robotik laboratuvarları">
  <meta property="og:description" content="Tarayıcıda çalışan robotik deneylerini keşfet.">
  <meta property="og:url" content="https://robotik-platform.vercel.app/laboratuvar">
  <meta property="og:image" content="https://robotik-platform.vercel.app/opengraph-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Robotik laboratuvarları">
  <meta name="twitter:description" content="Tarayıcıda çalışan robotik deneylerini keşfet.">
  <meta name="twitter:image" content="https://robotik-platform.vercel.app/twitter-image.png">
</head><body><main><h1>Robotik laboratuvarları</h1><h2>Deneyler</h2><h3>Robot hücresi</h3><p>Gerçek kinematik hesapları tarayıcıda çalışır.</p></main></body></html>`;

describe("statik HTML SEO denetimi", () => {
  it("eksiksiz ve semantik bir sayfayı temiz kabul eder", () => {
    expect(auditHtmlSeo(COMPLETE_HTML, "https://robotik-platform.vercel.app/laboratuvar")).toEqual([]);
  });

  it("eksik sosyal metadata, yanlış canonical ve heading atlamasını birlikte raporlar", () => {
    const html = `<!doctype html><html><head><title>Jenerik</title><meta name="description" content="Kısa"><link rel="canonical" href="https://example.com/yanlis"></head><body><main><h1>Başlık</h1><h3>Atlanan başlık</h3></main></body></html>`;
    const issues = auditHtmlSeo(html, "https://robotik-platform.vercel.app/ders/ornek");

    expect(issues).toContain("Canonical beklenen URL ile eşleşmiyor.");
    expect(issues).toContain("Open Graph alanları eksik: title, description, url, image.");
    expect(issues).toContain("Twitter alanları eksik: card, title, description, image.");
    expect(issues).toContain("Heading sırası H1 → H3 atlıyor.");
  });

  it("birden fazla H1 ve main öğesini reddeder", () => {
    const html = COMPLETE_HTML.replace("</main>", "<h1>İkinci başlık</h1></main><main>İkinci ana alan</main>");
    const issues = auditHtmlSeo(html, "https://robotik-platform.vercel.app/laboratuvar");

    expect(issues).toContain("Sayfada tam olarak bir H1 olmalı; bulunan: 2.");
    expect(issues).toContain("Sayfada tam olarak bir main olmalı; bulunan: 2.");
  });

  it("React payload'ındaki etiket metnini semantik DOM öğesi saymaz", () => {
    const html = COMPLETE_HTML.replace("</body>", '<script>self.__next_f.push(["<main><h1>Payload</h1></main>"])</script></body>');
    expect(auditHtmlSeo(html, "https://robotik-platform.vercel.app/laboratuvar")).toEqual([]);
  });

  it("kritik ders metnini script payload'ında değil görünür HTML'de arar", () => {
    const onlyInScript = `<main><h1>Ders</h1><script>self.__next_f.push(["Kritik kazanım"])</script></main>`;
    expect(htmlContainsVisibleText(onlyInScript, "Kritik kazanım")).toBe(false);
    expect(htmlContainsVisibleText(`${onlyInScript}<p>Kritik kazanım burada görünür.</p>`, "Kritik kazanım")).toBe(true);
  });

  it("title ve description kimliğini HTML entity'lerini çözerek çıkarır", () => {
    expect(extractHtmlSeoIdentity(COMPLETE_HTML)).toEqual({
      title: "Robotik laboratuvarları · Robotik Laboratuvarı",
      description: "Tarayıcıda çalışan robotik deneylerini keşfet.",
    });
  });
});
