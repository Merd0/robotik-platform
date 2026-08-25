import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface RedirectRule {
  source: string;
  destination: string;
  statusCode: number;
}

describe("yayın URL sözleşmesi", () => {
  const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")) as {
    redirects?: RedirectRule[];
  };

  it("eski kavram haritası URL'sini kalıcı yönlendirmeyle korur", () => {
    expect(config.redirects).toContainEqual({
      source: "/kavram-haritasi",
      destination: "/bilgi-haritasi",
      statusCode: 301,
    });
  });

  it("paylaşılan ders ve laboratuvar URL ailelerini yeniden yazmaz", () => {
    const sources = config.redirects?.map((redirect) => redirect.source) ?? [];
    expect(sources.some((source) => source.startsWith("/ders") || source.startsWith("/laboratuvar") || source.startsWith("/oyun-alani"))).toBe(false);
  });
});
