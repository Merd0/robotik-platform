import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function tsxFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return tsxFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [fullPath] : [];
  });
}

describe("görsel erişilebilirlik ve SEO sözleşmesi", () => {
  it("içerik SVG'lerini açıklayıcı ya da dekoratif olarak işaretler", () => {
    const roots = [path.join(process.cwd(), "app"), path.join(process.cwd(), "components")];
    const issues: string[] = [];

    for (const filePath of roots.flatMap(tsxFiles)) {
      if (filePath.endsWith("opengraph-image.tsx") || filePath.endsWith("social-image.tsx") || filePath.endsWith("twitter-image.tsx")) continue;
      const source = fs.readFileSync(filePath, "utf8");
      for (const match of source.matchAll(/<svg\b[\s\S]*?>/g)) {
        const openingTag = match[0];
        if (!/aria-hidden\s*=|role\s*=\s*["']img["']/i.test(openingTag)) {
          const line = source.slice(0, match.index).split("\n").length;
          issues.push(`${path.relative(process.cwd(), filePath)}:${line}`);
        }
      }
    }

    expect(issues, `Anlamı belirtilmemiş SVG: ${issues.join(", ")}`).toEqual([]);
  });
});
