function getAttribute(tag: string, attribute: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, "i"));
  return match?.[1];
}

function findMetaContent(html: string, key: "name" | "property", value: string): string | undefined {
  return html.match(/<meta\b[^>]*>/gi)
    ?.find((tag) => getAttribute(tag, key)?.toLocaleLowerCase("en-US") === value.toLocaleLowerCase("en-US"))
    ?.match(/\bcontent=["']([^"']*)["']/i)?.[1];
}

function findCanonical(html: string): string | undefined {
  const tag = html.match(/<link\b[^>]*>/gi)
    ?.find((candidate) => getAttribute(candidate, "rel")?.toLocaleLowerCase("en-US") === "canonical");
  return tag ? getAttribute(tag, "href") : undefined;
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => named[name.toLocaleLowerCase("en-US")] ?? entity);
}

function normalizedText(value: string): string {
  return decodeHtml(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

export function extractHtmlSeoIdentity(html: string): { title: string; description: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description = findMetaContent(html, "name", "description") ?? "";
  return {
    title: decodeHtml(title).replace(/\s+/g, " ").trim(),
    description: decodeHtml(description).replace(/\s+/g, " ").trim(),
  };
}

export function htmlContainsVisibleText(html: string, expected: string): boolean {
  const visible = html
    .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return normalizedText(visible).includes(normalizedText(expected));
}

export function auditHtmlSeo(html: string, expectedCanonical: string): string[] {
  const issues: string[] = [];
  const structuralHtml = html.replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!title || normalizedText(title).length === 0) issues.push("Title eksik.");

  const description = findMetaContent(html, "name", "description");
  if (!description?.trim()) issues.push("Meta description eksik.");

  const canonical = findCanonical(html);
  if (!canonical) issues.push("Canonical eksik.");
  else if (canonical !== expectedCanonical) issues.push("Canonical beklenen URL ile eşleşmiyor.");

  const openGraphFields = ["title", "description", "url", "image"]
    .filter((field) => !findMetaContent(html, "property", `og:${field}`));
  if (openGraphFields.length > 0) {
    issues.push(`Open Graph alanları eksik: ${openGraphFields.join(", ")}.`);
  }

  const twitterFields = ["card", "title", "description", "image"]
    .filter((field) => !findMetaContent(html, "name", `twitter:${field}`));
  if (twitterFields.length > 0) {
    issues.push(`Twitter alanları eksik: ${twitterFields.join(", ")}.`);
  }

  const h1Count = structuralHtml.match(/<h1\b/gi)?.length ?? 0;
  if (h1Count !== 1) issues.push(`Sayfada tam olarak bir H1 olmalı; bulunan: ${h1Count}.`);

  const mainCount = structuralHtml.match(/<main\b/gi)?.length ?? 0;
  if (mainCount !== 1) issues.push(`Sayfada tam olarak bir main olmalı; bulunan: ${mainCount}.`);

  const headingLevels = [...structuralHtml.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  if (headingLevels.length > 0 && headingLevels[0] !== 1) {
    issues.push(`İlk heading H1 olmalı; bulunan: H${headingLevels[0]}.`);
  }
  for (let index = 1; index < headingLevels.length; index += 1) {
    const previous = headingLevels[index - 1];
    const current = headingLevels[index];
    if (current > previous + 1) {
      issues.push(`Heading sırası H${previous} → H${current} atlıyor.`);
    }
  }

  return [...new Set(issues)];
}
