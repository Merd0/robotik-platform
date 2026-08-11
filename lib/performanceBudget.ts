import fs from "node:fs";
import path from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const fileMeasurementCache = new Map<string, TransferSize>();

export interface TransferSize {
  raw: number;
  gzip: number;
  brotli: number;
}

export function extractInitialLocalAssets(html: string): string[] {
  const urls: string[] = [];
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/g) ?? []) {
    if (tag.startsWith("<link") && !/\brel=["']stylesheet["']/.test(tag)) continue;
    const match = tag.match(/\b(?:src|href)=["']([^"']+)["']/);
    if (match?.[1].startsWith("/")) urls.push(match[1]);
  }
  return [...new Set(urls)];
}

export function compressedSize(content: Buffer): TransferSize {
  return {
    raw: content.byteLength,
    gzip: gzipSync(content, { level: 9 }).byteLength,
    brotli: brotliCompressSync(content, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
    }).byteLength,
  };
}

export function sumTransferSizes(sizes: readonly TransferSize[]): TransferSize {
  return sizes.reduce(
    (total, current) => ({
      raw: total.raw + current.raw,
      gzip: total.gzip + current.gzip,
      brotli: total.brotli + current.brotli,
    }),
    { raw: 0, gzip: 0, brotli: 0 },
  );
}

export function measureFiles(outDir: string, relativePaths: readonly string[]): TransferSize {
  return sumTransferSizes(
    [...new Set(relativePaths)].map((relativePath) => {
      const absolutePath = path.join(outDir, relativePath.replace(/^\//, ""));
      const cached = fileMeasurementCache.get(absolutePath);
      if (cached) return cached;
      const measured = compressedSize(fs.readFileSync(absolutePath));
      fileMeasurementCache.set(absolutePath, measured);
      return measured;
    }),
  );
}

export function referencedLazyChunks(outDir: string, initialAssets: readonly string[]): string[] {
  const initial = new Set(initialAssets);
  const references = new Set<string>();
  for (const asset of initialAssets.filter((url) => url.endsWith(".js"))) {
    const source = fs.readFileSync(path.join(outDir, asset.replace(/^\//, "")), "utf8");
    for (const match of source.matchAll(/["'](?:\/?_next\/)?(static\/chunks\/[^"']+\.js)["']/g)) {
      const url = `/_next/${match[1]}`;
      if (!initial.has(url) && fs.existsSync(path.join(outDir, "_next", match[1]))) references.add(url);
    }
  }
  return [...references].sort();
}
