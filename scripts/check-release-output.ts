import fs from "node:fs";
import path from "node:path";

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

console.log(`Yayın çıktısı temiz: ${required.join(", ")} mevcut ve canonical adresler doğrulandı.`);
