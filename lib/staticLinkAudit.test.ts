import { describe, expect, it } from "vitest";
import { extractInternalPaths } from "./staticLinkAudit";

describe("statik dahili bağlantı ayrıştırma", () => {
  it("query ve fragment'i kaldırıp yalnız site içi yolları döndürür", () => {
    const html = `
      <a href="/ders/robot-nedir?ref=hat#deney">Ders</a>
      <a href="/sozluk/ileri-kinematik">Sözlük</a>
      <a href="#icerik">Atla</a>
      <a href="https://example.com">Dış</a>
      <a href="mailto:ornek@example.com">E-posta</a>
    `;

    expect(extractInternalPaths(html)).toEqual([
      "/ders/robot-nedir",
      "/sozluk/ileri-kinematik",
    ]);
  });

  it("aynı bağlantıyı bir kez döndürür ve HTML entity'lerini çözer", () => {
    const html = '<a href="/ara?q=tcp&amp;hat=a">Ara</a><a href="/ara?q=ik">Yine ara</a>';
    expect(extractInternalPaths(html)).toEqual(["/ara"]);
  });
});
