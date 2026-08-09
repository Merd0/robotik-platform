import fs from "node:fs";
import path from "node:path";
import { getPublishedLessons } from "../lib/content";
import { getSozluk, terimSlug } from "../lib/sozluk";

const out = path.join(process.cwd(), "out");
const required = ["robots.txt", "sitemap.xml", "manifest.webmanifest"];
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

console.log(`Yayın çıktısı temiz: ${lessons.length} ders OG/JSON-LD kartı ve ${terms.length} tekil sözlük sayfası doğrulandı.`);
