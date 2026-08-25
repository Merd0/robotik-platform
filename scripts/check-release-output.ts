import fs from "node:fs";
import path from "node:path";
import { getPublishedLessons } from "../lib/content";
import { auditHtmlSeo, extractHtmlSeoIdentity, htmlContainsVisibleText } from "../lib/htmlSeoAudit";
import { extractInternalPaths } from "../lib/staticLinkAudit";
import { NOINDEX_STATIC_ROUTES } from "../lib/staticRoutes";
import { getSozluk, terimSlug } from "../lib/sozluk";

const out = path.join(process.cwd(), "out");
const required = ["404.html", "icon.svg", "opengraph-image", "twitter-image", "robots.txt", "sitemap.xml", "manifest.webmanifest"];
const missing = required.filter((file) => !fs.existsSync(path.join(out, file)));

if (missing.length > 0) {
  console.error(`Yayın bütünlüğü hatası: eksik çıktı: ${missing.join(", ")}`);
  process.exit(1);
}

const robots = fs.readFileSync(path.join(out, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap: https://robotik-platform.vercel.app/sitemap.xml")) {
  console.error("Yayın bütünlüğü hatası: robots.txt canonical sitemap adresini içermiyor.");
  process.exit(1);
}
if (!sitemap.includes("/laboratuvar/robot-hucresi") || !sitemap.includes("/ders/")) {
  console.error("Yayın bütünlüğü hatası: sitemap ders veya capstone adreslerini içermiyor.");
  process.exit(1);
}

const canonicalUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const seoIdentities = new Map<string, string[]>();
const releaseSeoIssues: string[] = [];
const internalLinkSources = new Map<string, string[]>();

for (const canonicalUrl of canonicalUrls) {
  const pathname = new URL(canonicalUrl).pathname;
  const htmlPath = pathname === "/"
    ? path.join(out, "index.html")
    : path.join(out, `${decodeURIComponent(pathname.slice(1))}.html`);
  if (!fs.existsSync(htmlPath)) {
    releaseSeoIssues.push(`${pathname}: sitemap URL'si için HTML çıktısı yok.`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  releaseSeoIssues.push(...auditHtmlSeo(html, canonicalUrl).map((issue) => `${pathname}: ${issue}`));
  for (const internalPath of extractInternalPaths(html)) {
    internalLinkSources.set(internalPath, [...(internalLinkSources.get(internalPath) ?? []), pathname]);
  }

  const identity = extractHtmlSeoIdentity(html);
  for (const [kind, value] of Object.entries(identity)) {
    if (!value) continue;
    const key = `${kind}:${value.toLocaleLowerCase("tr-TR")}`;
    seoIdentities.set(key, [...(seoIdentities.get(key) ?? []), pathname]);
  }
}

for (const [internalPath, sources] of internalLinkSources) {
  const decodedPath = decodeURIComponent(internalPath.slice(1));
  const candidates = internalPath === "/"
    ? [path.join(out, "index.html")]
    : [path.join(out, `${decodedPath}.html`), path.join(out, decodedPath)];
  if (!candidates.some((candidate) => fs.existsSync(candidate))) {
    releaseSeoIssues.push(`Kırık dahili bağlantı ${internalPath}; kaynak: ${[...new Set(sources)].slice(0, 5).join(", ")}.`);
  }
}

for (const [identity, routes] of seoIdentities) {
  if (routes.length > 1) {
    releaseSeoIssues.push(`Tekrarlanan ${identity.startsWith("title:") ? "title" : "description"}: ${routes.join(", ")}.`);
  }
}

for (const route of NOINDEX_STATIC_ROUTES) {
  const htmlPath = path.join(out, `${route.slice(1)}.html`);
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";
  if (!html || !/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
    releaseSeoIssues.push(`${route}: statik HTML'de noindex robots etiketi yok.`);
  }
}

const notFoundHtml = fs.readFileSync(path.join(out, "404.html"), "utf8");
if (!htmlContainsVisibleText(notFoundHtml, "404") || !/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(notFoundHtml)) {
  releaseSeoIssues.push("404.html görünür 404 açıklaması ve noindex etiketi taşımıyor.");
}

if (releaseSeoIssues.length > 0) {
  console.error(`Yayın SEO bütünlüğü hatası:\n- ${releaseSeoIssues.join("\n- ")}`);
  process.exit(1);
}

const lessons = getPublishedLessons();
const terms = getSozluk();
const missingLessonSeo = lessons.flatMap((lesson) => {
  const htmlPath = path.join(out, "ders", `${lesson.slug}.html`);
  const imagePath = path.join(out, "ders", lesson.slug, "opengraph-image");
  if (!fs.existsSync(htmlPath) || !fs.existsSync(imagePath)) return [lesson.slug];

  const html = fs.readFileSync(htmlPath, "utf8");
  const imageHeader = fs.readFileSync(imagePath).subarray(0, 8).toString("hex");
  return html.includes('property="og:image"')
    && html.includes('type="application/ld+json"')
    && html.includes("LearningResource")
    && htmlContainsVisibleText(html, lesson.frontmatter.baslik)
    && htmlContainsVisibleText(html, lesson.frontmatter.kazanimlar[0])
    && imageHeader === "89504e470d0a1a0a"
    ? []
    : [lesson.slug];
});

if (missingLessonSeo.length > 0) {
  console.error(`Yayın bütünlüğü hatası: ders OG/JSON-LD çıktısı eksik: ${missingLessonSeo.join(", ")}`);
  process.exit(1);
}

const missingTermPages = terms.flatMap((term) => {
  const slug = terimSlug(term.tr);
  const htmlPath = path.join(out, "sozluk", `${slug}.html`);
  if (!fs.existsSync(htmlPath)) return [slug];
  const html = fs.readFileSync(htmlPath, "utf8");
  return html.includes('type="application/ld+json"')
    && html.includes("DefinedTerm")
    && sitemap.includes(`/sozluk/${slug}`)
    ? []
    : [slug];
});

if (missingTermPages.length > 0) {
  console.error(`Yayın bütünlüğü hatası: tekil sözlük/JSON-LD/sitemap çıktısı eksik: ${missingTermPages.join(", ")}`);
  process.exit(1);
}

console.log(`Yayın çıktısı temiz: ${canonicalUrls.length} canonical sayfa, ${lessons.length} ders OG/JSON-LD kartı ve ${terms.length} tekil sözlük sayfası doğrulandı.`);
