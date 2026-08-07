import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveThemePreference, SCENE_PALETTES } from "./theme";

function cssBlock(css: string, marker: string) {
  const markerIndex = css.indexOf(marker);
  const openingBrace = css.indexOf("{", markerIndex);
  let depth = 0;

  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }

  throw new Error(`${marker} CSS bloğu kapanmıyor.`);
}

function colorVariables(block: string) {
  return Object.fromEntries(
    [...block.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [match[1], match[2]]),
  );
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("tema tercihi", () => {
  it("kayıtlı manuel tercihi sistem tercihinin önünde tutar", () => {
    expect(resolveThemePreference("dark", false)).toBe("dark");
    expect(resolveThemePreference("light", true)).toBe("light");
  });

  it("geçerli bir kayıt yoksa sistem tercihine döner", () => {
    expect(resolveThemePreference(null, true)).toBe("dark");
    expect(resolveThemePreference("gecersiz", false)).toBe("light");
  });
});

describe("tema kontrastı", () => {
  const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
  const themes = {
    light: colorVariables(cssBlock(css, "@theme")),
    dark: colorVariables(cssBlock(css, ':root[data-theme="dark"]')),
  };

  for (const [themeName, colors] of Object.entries(themes)) {
    it(`${themeName} temada metin ve seviye renkleri WCAG AA kontrastını korur`, () => {
      const pairs = [
        ["site-ink", "site-bg"],
        ["site-muted", "site-bg"],
        ["site-subtle", "site-bg"],
        ["site-accent-text", "site-bg"],
        ["site-ink", "site-surface"],
        ["site-muted", "site-surface"],
        ["ortaokul-ink", "ortaokul-bg"],
        ["ortaokul-accent-text", "ortaokul-bg"],
        ["lise-ink", "lise-bg"],
        ["lise-accent-text", "lise-bg"],
        ["universite-ink", "universite-bg"],
        ["universite-accent-text", "universite-bg"],
      ];

      for (const [foreground, background] of pairs) {
        expect(contrast(colors[foreground], colors[background]), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  for (const [themeName, colors] of Object.entries(SCENE_PALETTES)) {
    it(`${themeName} 3B sahnede işlevsel çizgiler zeminden ayırt edilir`, () => {
      for (const key of [
        "link",
        "accent",
        "obstacle",
        "ellipse",
        "start",
        "goal",
        "astar",
        "rrt",
        "rrtStar",
        "jointPrimary",
        "jointSecondary",
        "reachable",
        "unreachable",
      ] as const) {
        expect(contrast(colors[key], colors.background), key).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
