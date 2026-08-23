import { describe, expect, it } from "vitest";
import {
  compressedSize,
  extractInitialLocalAssets,
  partitionAssetsBySourceMarker,
  sumTransferSizes,
} from "./performanceBudget";

describe("performans bütçesi ölçümü", () => {
  it("yalnız yerel başlangıç script ve stylesheet varlıklarını tekilleştirir", () => {
    const html = '<script src="/_next/a.js"></script><script src="/_next/a.js"></script>' +
      '<link href="/_next/a.css" rel="stylesheet"><link rel="preload" href="/_next/font.woff2">' +
      '<script src="https://example.com/harici.js"></script>';
    expect(extractInitialLocalAssets(html)).toEqual(["/_next/a.js", "/_next/a.css"]);
  });

  it("ham, gzip ve brotli toplamlarını ayrı tutar", () => {
    const first = compressedSize(Buffer.from("robotik ".repeat(100)));
    const second = compressedSize(Buffer.from("laboratuvar ".repeat(100)));
    expect(sumTransferSizes([first, second])).toEqual({
      raw: first.raw + second.raw,
      gzip: first.gzip + second.gzip,
      brotli: first.brotli + second.brotli,
    });
    expect(first.gzip).toBeLessThan(first.raw);
    expect(first.brotli).toBeLessThan(first.raw);
  });

  it("yalnız gerçekten ilgili lazy parçayı kaynak işaretine göre ayırır", () => {
    const sources = new Map([
      ["/_next/scene.js", "WebGLRenderer"],
      ["/_next/editor.js", "cm-python-errorLine"],
      ["/_next/shared.js", "ortak"],
    ]);
    expect(
      partitionAssetsBySourceMarker(
        [...sources.keys()],
        (asset) => sources.get(asset) ?? "",
        "cm-python-errorLine",
      ),
    ).toEqual({
      matching: ["/_next/editor.js"],
      other: ["/_next/scene.js", "/_next/shared.js"],
    });
  });
});
