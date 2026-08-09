import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getAllLessons, type Lesson, type SourceRef } from "../lib/content";
import { computeLessonSubjectHashes } from "../lib/lessonArtifact";
import { reviewDebt } from "../lib/reviewDebt";
import {
  findLegacyTextSources,
  getLessonReviewStatus,
  getRequiredReviewScopes,
  requiresStructuredSources,
  REVIEW_SCOPE_LABELS,
  REVIEW_SCOPES,
  REVIEWER_ROLES,
  reviewReceipts,
  SCOPE_SUBJECT_KEYS,
  type ReviewDecision,
  type ReviewerRole,
  type ReviewReceipt,
  type ReviewScope,
} from "../lib/reviewReceipts";
import { isGitAvailable, readLessonAtCommit, resolveCommit } from "./git-lesson";

/**
 * `npm run review` — insan incelemesini sıraya koyan ve makbuza bağlayan araç.
 *
 * Neden var: bir dersi onaylamak eskiden dört ayrı dosyaya elle dokunmayı
 * gerektiriyordu (makbuz JSON'u + borç JSON'u + governance script sabiti +
 * kaynak biçimi), üstelik artifact hash'ini hesaplayan hiçbir komut yoktu.
 * 39 ders için bu, okuma süresinden pahalı bir plumbing yüküydü. Bu araç o
 * yükü sıfıra indirir; okuma ve karar insanda kalır.
 *
 * Sınır: bu araç inceleme YAPMAZ. Yalnız neyin incelenmesi gerektiğini
 * sıralar, incelenecek malzemeyi tek ekranda toplar ve insanın verdiği kararı
 * doğrulanabilir biçimde kaydeder.
 */

const RECEIPTS_PATH = path.join(process.cwd(), "content", "review-receipts.json");
const DEBT_PATH = path.join(process.cwd(), "content", "review-debt.json");
const KAYNAK_TAZELIK_GUN = 365;

function git(args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return undefined;
  }
}

function bugun(): string {
  return new Date().toISOString().slice(0, 10);
}

function gunFarki(isoDate: string): number | undefined {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return undefined;
  return Math.floor((Date.now() - parsed) / 86_400_000);
}

function kisaHash(hash: string): string {
  return hash.replace("sha256:", "").slice(0, 12);
}

interface Args {
  komut: string;
  konum: string[];
  bayrak: Map<string, string | true>;
}

function parseArgs(argv: string[]): Args {
  const [komut = "yardim", ...rest] = argv;
  const konum: string[] = [];
  const bayrak = new Map<string, string | true>();
  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];
    if (!item.startsWith("--")) {
      konum.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) bayrak.set(key, true);
    else {
      bayrak.set(key, next);
      index += 1;
    }
  }
  return { komut, konum, bayrak };
}

function metin(bayrak: Map<string, string | true>, key: string): string | undefined {
  const value = bayrak.get(key);
  return typeof value === "string" ? value : undefined;
}

function dur(mesaj: string): never {
  console.error(`\nHATA: ${mesaj}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- risk sırası

interface RiskKaydi {
  lesson: Lesson;
  puan: number;
  nedenler: string[];
  bagimli: number;
  durum: string;
}

function bagimlilikSayaci(lessons: Lesson[]): Map<string, number> {
  const sayac = new Map<string, number>();
  for (const lesson of lessons) {
    for (const onkosul of lesson.frontmatter.onkosul ?? []) {
      sayac.set(onkosul, (sayac.get(onkosul) ?? 0) + 1);
    }
  }
  return sayac;
}

function eskiKaynakVar(lesson: Lesson): boolean {
  return lesson.frontmatter.kaynaklar.some((kaynak) => {
    if (typeof kaynak === "string") return false;
    const ref = kaynak as SourceRef;
    if (!ref.url || !ref.accessedAt) return false;
    const fark = gunFarki(ref.accessedAt);
    return fark !== undefined && fark > KAYNAK_TAZELIK_GUN;
  });
}

function riskSirasi(lessons: Lesson[]): RiskKaydi[] {
  const bagimlilik = bagimlilikSayaci(lessons);
  const kayitlar: RiskKaydi[] = [];

  for (const lesson of lessons) {
    const status = getLessonReviewStatus(lesson);
    if (status.state === "verified") continue;

    const yayinda = lesson.frontmatter.durum === "yayinda";
    const bagimli = bagimlilik.get(lesson.slug) ?? 0;
    const nedenler: string[] = [];
    let puan = 0;

    if (yayinda) {
      puan += 30;
      nedenler.push("yayında");
    }
    if (status.state === "changes-requested") {
      puan += 50;
      nedenler.push("değişiklik istendi");
    } else if (status.state === "receipt-stale") {
      puan += 35;
      nedenler.push("makbuz eskidi");
    } else if (status.state === "stale-after-content-change") {
      puan += 25;
      nedenler.push("içerik değişti");
    } else if (status.state === "legacy-unverified") {
      puan += 10;
      nedenler.push("legacy");
    }
    if (lesson.frontmatter.hat === "h-guvenlik") {
      puan += 20;
      nedenler.push("güvenlik hattı");
    }
    if (bagimli > 0) {
      puan += Math.min(bagimli * 3, 15);
      nedenler.push(`${bagimli} ders bağımlı`);
    }
    if (lesson.frontmatter.kaynaklar.some((kaynak) => typeof kaynak === "string")) {
      puan += 8;
      nedenler.push("kaynak düz metin");
    }
    if (eskiKaynakVar(lesson)) {
      puan += 5;
      nedenler.push("kaynak tazeliği");
    }
    if (status.verifiedScopes.length > 0) {
      nedenler.push(`${status.verifiedScopes.length}/${status.requiredScopes.length} kapsam hazır`);
    }

    kayitlar.push({ lesson, puan, nedenler, bagimli, durum: status.state });
  }

  return kayitlar.sort((left, right) => right.puan - left.puan || left.lesson.slug.localeCompare(right.lesson.slug));
}

function komutKuyruk(args: Args): void {
  const lessons = getAllLessons();
  const yalnizYayin = args.bayrak.has("yayin");
  const limit = Number(metin(args.bayrak, "limit") ?? "20");
  let kayitlar = riskSirasi(lessons);
  if (yalnizYayin) kayitlar = kayitlar.filter((kayit) => kayit.lesson.frontmatter.durum === "yayinda");

  const toplamYayin = lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda").length;
  const dogrulanan = lessons.filter((lesson) => getLessonReviewStatus(lesson).state === "verified").length;

  console.log(`\nİnceleme kuyruğu — risk sırasına göre (${kayitlar.length} açık kayıt, ilk ${Math.min(limit, kayitlar.length)} gösteriliyor)`);
  console.log(`Yayın: ${toplamYayin} ders · güncel makbuzlu: ${dogrulanan}\n`);
  console.log("  #  risk  ders".padEnd(48) + "neden");
  console.log("  " + "-".repeat(90));

  kayitlar.slice(0, limit).forEach((kayit, index) => {
    const sira = String(index + 1).padStart(3);
    const puan = String(kayit.puan).padStart(4);
    const slug = kayit.lesson.slug.padEnd(44);
    console.log(`${sira} ${puan}  ${slug}  ${kayit.nedenler.join(", ")}`);
  });

  console.log(`\nSıradaki: npm run review goster ${kayitlar[0]?.lesson.slug ?? "<ders-id>"}\n`);
}

// ------------------------------------------------------------------- göster

function bilesenBilgisi(ad: string): string {
  const aday = path.join(process.cwd(), "components", "interactive", `${ad}.tsx`);
  if (!fs.existsSync(aday)) return `${ad} (bileşen dosyası bulunamadı)`;
  const tarih = git(["log", "-1", "--format=%ad", "--date=short", "--", `components/interactive/${ad}.tsx`])?.trim();
  return `${ad} — son değişiklik: ${tarih || "bilinmiyor"}`;
}

function kaynakSatiri(kaynak: string | SourceRef): string {
  if (typeof kaynak === "string") return `    [düz metin — yayına almadan önce SourceRef'e çevrilmeli] ${kaynak}`;
  const ref = kaynak as SourceRef;
  const parcalar = [ref.kind, ref.publisher, ref.title, ref.version].filter(Boolean).join(" · ");
  if (!ref.url) return `    ${parcalar}`;
  const yas = ref.accessedAt ? gunFarki(ref.accessedAt) : undefined;
  const tazelik = yas === undefined ? "" : ` [erişim ${ref.accessedAt}, ${yas} gün önce${yas > KAYNAK_TAZELIK_GUN ? " — TAZELE" : ""}]`;
  return `    ${parcalar}${tazelik}\n      ${ref.url}`;
}

function komutGoster(args: Args): void {
  const slug = args.konum[0] ?? dur("ders id gerekli: npm run review goster <ders-id>");
  const lessons = getAllLessons();
  const lesson = lessons.find((candidate) => candidate.slug === slug) ?? dur(`Ders bulunamadı: ${slug}`);
  const status = getLessonReviewStatus(lesson);
  const hashes = computeLessonSubjectHashes(lesson);
  const bagimli = lessons.filter((candidate) => candidate.frontmatter.onkosul?.includes(slug));

  console.log(`\n${lesson.frontmatter.baslik}`);
  console.log(`${slug} · ${lesson.frontmatter.hat} · ${lesson.frontmatter.seviye} · ${lesson.frontmatter.sure} dk · durum: ${lesson.frontmatter.durum}`);
  console.log(`dosya: ${path.relative(process.cwd(), lesson.filePath)}`);

  console.log(`\nSürüm kökleri`);
  console.log(`  kaynak (sourceHash)       ${kisaHash(hashes.sourceHash)}`);
  console.log(`  ders metni (teachingHash) ${kisaHash(hashes.teachingHash)}`);
  console.log(`  sunum (presentationHash)  ${kisaHash(hashes.presentationHash)}   — hiçbir kapsamı eskitmez`);

  console.log(`\nKapsam durumu — ${status.label}`);
  for (const kapsam of status.scopeStatuses) {
    const detay = kapsam.changedSubjects.length ? ` (değişen: ${kapsam.changedSubjects.join(", ")})` : "";
    const kim = kapsam.receipt ? ` · ${kapsam.receipt.reviewer.displayName}, ${kapsam.receipt.reviewedAt}` : "";
    console.log(`  ${REVIEW_SCOPE_LABELS[kapsam.scope].padEnd(20)} ${kapsam.label}${detay}${kim}`);
  }

  console.log(`\nKazanımlar`);
  for (const kazanim of lesson.frontmatter.kazanimlar) console.log(`  - ${kazanim}`);

  console.log(`\nKaynaklar (${lesson.frontmatter.kaynaklar.length})`);
  for (const kaynak of lesson.frontmatter.kaynaklar) console.log(kaynakSatiri(kaynak));

  if (lesson.frontmatter.etkilesimli.length > 0) {
    console.log(`\nEtkileşimli bileşenler`);
    for (const bilesen of lesson.frontmatter.etkilesimli) console.log(`    ${bilesenBilgisi(bilesen)}`);
    console.log(`    not: bileşen değişikliği bugün teachingHash'i değiştirmez (interactionHash Aşama 2'de gelecek).`);
  }

  if ((lesson.frontmatter.onkosul ?? []).length > 0) console.log(`\nÖn koşul: ${lesson.frontmatter.onkosul.join(", ")}`);
  if (bagimli.length > 0) console.log(`Bu derse bağımlı ${bagimli.length} ders: ${bagimli.map((item) => item.slug).join(", ")}`);

  console.log(`\nİnsan incelemesi (docs/06 Katman 3)`);
  console.log(`  1. Kaynaklardaki orijinal metni aç, dersteki her teknik iddiayı satır satır karşılaştır.`);
  console.log(`  2. Etkileşimli sahneyi kendin oyna, sayıların mantıklı çıktığını gör.`);
  console.log(`  3. Şüpheli nokta varsa onaylama; önce netleştir.`);

  const kapsamlar = getRequiredReviewScopes(lesson).join(",");
  console.log(`\nOnay: npm run review onayla ${slug} --kapsam ${kapsamlar} --kim "Ad Soyad"${lesson.frontmatter.durum !== "yayinda" ? " --yayinla" : ""}\n`);
}

// ------------------------------------------------------------------- onayla

function durumuYayinaCevir(filePath: string): void {
  const raw = fs.readFileSync(filePath, "utf8");
  const eslesme = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!eslesme) dur(`Frontmatter bloğu bulunamadı: ${filePath}`);
  const blok = eslesme[1];
  if (!/^durum:\s*\S+/m.test(blok)) dur(`Frontmatter içinde durum alanı yok: ${filePath}`);
  const yeniBlok = blok.replace(/^durum:\s*\S+.*$/m, "durum: yayinda");
  fs.writeFileSync(filePath, raw.replace(blok, yeniBlok), "utf8");
}

function makbuzId(lessonId: string, scope: ReviewScope, tarih: string, mevcut: Set<string>): string {
  const taban = `${lessonId}.${scope}.${tarih.replace(/-/g, "")}`;
  if (!mevcut.has(taban)) return taban;
  for (let sayac = 2; sayac < 100; sayac += 1) {
    const aday = `${taban}.${sayac}`;
    if (!mevcut.has(aday)) return aday;
  }
  return dur(`Makbuz id üretilemedi: ${taban}`);
}

function komutOnayla(args: Args): void {
  const slug = args.konum[0] ?? dur("ders id gerekli: npm run review onayla <ders-id> --kapsam ... --kim ...");
  const lessons = getAllLessons();
  const lesson = lessons.find((candidate) => candidate.slug === slug) ?? dur(`Ders bulunamadı: ${slug}`);

  const kim = metin(args.bayrak, "kim") ?? dur('--kim "Ad Soyad" zorunlu: makbuz bir insana bağlanır.');
  const rol = (metin(args.bayrak, "rol") ?? "maintainer") as ReviewerRole;
  if (!REVIEWER_ROLES.includes(rol)) dur(`Geçersiz rol: ${rol}. Seçenekler: ${REVIEWER_ROLES.join(", ")}`);
  const karar = (metin(args.bayrak, "karar") ?? "approved") as ReviewDecision;
  if (karar !== "approved" && karar !== "changes-requested") dur(`Geçersiz karar: ${karar}`);
  const tarih = metin(args.bayrak, "tarih") ?? bugun();
  const not = metin(args.bayrak, "not");
  const yayinla = args.bayrak.has("yayinla");

  const gerekli = getRequiredReviewScopes(lesson);
  const kapsamGirdi = metin(args.bayrak, "kapsam") ?? dur(`--kapsam zorunlu. Bu ders için gerekli: ${gerekli.join(",")} (veya "hepsi")`);
  const kapsamlar = (kapsamGirdi === "hepsi" ? gerekli : kapsamGirdi.split(",").map((item) => item.trim())) as ReviewScope[];
  for (const kapsam of kapsamlar) {
    if (!REVIEW_SCOPES.includes(kapsam)) dur(`Geçersiz kapsam: ${kapsam}. Seçenekler: ${REVIEW_SCOPES.join(", ")}`);
  }
  if (kapsamlar.includes("safety") && rol !== "safety-sme") {
    dur("safety kapsamı yalnız --rol safety-sme ile onaylanabilir. Uzman yoksa bu kapsamı boş bırak; ders 'uzman incelemesi bekliyor' olarak görünür.");
  }

  // sourceCommit dürüst olmalı: makbuzun bağlandığı kökleri gerçekten üreten
  // commit HEAD olmalı. Ders dosyasında commit'lenmemiş bir içerik değişikliği
  // varsa bu kurulamaz.
  if (!isGitAvailable()) dur("git bulunamadı; makbuz sourceCommit'e bağlanamaz.");
  const head = resolveCommit("HEAD") ?? dur("HEAD çözümlenemedi.");
  const headSurumu = readLessonAtCommit(head, lesson.filePath);
  if (!headSurumu) dur(`Ders HEAD içinde yok. Önce dosyayı commit'le, sonra onayla: ${path.relative(process.cwd(), lesson.filePath)}`);

  const calismaHashleri = computeLessonSubjectHashes(lesson);
  const headHashleri = computeLessonSubjectHashes(headSurumu);
  if (calismaHashleri.sourceHash !== headHashleri.sourceHash || calismaHashleri.teachingHash !== headHashleri.teachingHash) {
    dur(
      "Ders dosyasında commit'lenmemiş içerik değişikliği var; sourceCommit dürüst kurulamaz.\n" +
        "  Önce değişikliği commit'le, sonra onayla. (Yalnız durum/süre gibi sunum alanları değiştiyse bu uyarı çıkmaz.)",
    );
  }

  // Onay dersi legacy borçtan düşürür; düşer düşmez yapılandırılmış kaynak
  // kuralı devreye girer. Bu yüzden kontrol yalnız --yayinla'ya değil, dersin
  // zaten yayında olmasına da bakmalı — yoksa onaydan hemen sonra CI kırılır.
  if (requiresStructuredSources(lesson, { yayinaAliniyor: yayinla })) {
    const duzMetin = findLegacyTextSources(lesson);
    if (duzMetin.length > 0) {
      dur(
        `Bu onay dersi legacy borçtan düşürür; önce ${duzMetin.length} düz metin kaynak yapılandırılmış SourceRef'e çevrilmeli.\n` +
          duzMetin.map((kaynak) => `    - ${kaynak}`).join("\n") +
          "\n  Biçim: kind / title, varsa publisher, url, version, accessedAt (bkz. docs/04-icerik-rehberi.md).",
      );
    }
  }

  if (yayinla) {
    const eksik = gerekli.filter((kapsam) => !kapsamlar.includes(kapsam));
    if (eksik.length > 0 || karar !== "approved") {
      dur(`--yayinla için gerekli her kapsam bu çağrıda onaylanmalı. Eksik: ${eksik.join(", ") || "(karar approved değil)"}`);
    }
  }

  const dosya = JSON.parse(fs.readFileSync(RECEIPTS_PATH, "utf8")) as typeof reviewReceipts & { aciklama?: string };
  const mevcutIdler = new Set(dosya.receipts.map((receipt) => receipt.id));
  const yeniMakbuzlar: ReviewReceipt[] = kapsamlar.map((kapsam) => {
    const subject: ReviewReceipt["subject"] = {};
    for (const key of SCOPE_SUBJECT_KEYS[kapsam]) subject[key] = calismaHashleri[key];
    const id = makbuzId(slug, kapsam, tarih, mevcutIdler);
    mevcutIdler.add(id);
    return {
      id,
      lessonId: slug,
      scope: kapsam,
      decision: karar,
      subject,
      sourceCommit: head,
      reviewedAt: tarih,
      reviewer: { displayName: kim, role: rol },
      ...(not ? { notes: not } : {}),
    };
  });

  dosya.receipts.push(...yeniMakbuzlar);
  fs.writeFileSync(RECEIPTS_PATH, JSON.stringify(dosya, null, 2) + "\n", "utf8");
  if (yayinla) durumuYayinaCevir(lesson.filePath);

  // Borç kaydı: yalnız gerekli her kapsam onaylandıysa düşer.
  const guncelDurum = getAllLessons().find((candidate) => candidate.slug === slug);
  const tamamlandi =
    karar === "approved" &&
    gerekli.every((kapsam) => kapsamlar.includes(kapsam) || durumHazir(guncelDurum, kapsam, calismaHashleri, dosya.receipts));
  let borctanDustu = false;
  if (tamamlandi) {
    const borc = JSON.parse(fs.readFileSync(DEBT_PATH, "utf8")) as typeof reviewDebt & { aciklama?: string };
    const oncekiSayi = borc.staleAfterContentChange.length + borc.legacyUnverified.length;
    borc.staleAfterContentChange = borc.staleAfterContentChange.filter((id: string) => id !== slug);
    borc.legacyUnverified = borc.legacyUnverified.filter((id: string) => id !== slug);
    borctanDustu = oncekiSayi > borc.staleAfterContentChange.length + borc.legacyUnverified.length;
    if (borctanDustu) fs.writeFileSync(DEBT_PATH, JSON.stringify(borc, null, 2) + "\n", "utf8");
  }

  console.log(`\n${slug} — ${yeniMakbuzlar.length} kapsam makbuzu yazıldı (${kapsamlar.join(", ")}), karar: ${karar}`);
  console.log(`  inceleyen: ${kim} (${rol}) · tarih: ${tarih}`);
  console.log(`  sourceCommit: ${head.slice(0, 12)}`);
  console.log(`  sourceHash: ${kisaHash(calismaHashleri.sourceHash)} · teachingHash: ${kisaHash(calismaHashleri.teachingHash)}`);
  if (yayinla) console.log(`  durum: yayinda olarak güncellendi`);
  if (borctanDustu) console.log(`  legacy review borcundan düşüldü`);
  console.log(`\nSonraki: npm run check-review-integrity && npm run check-review-debt\n`);
}

/** Bu çağrıda onaylanmayan bir kapsam, daha önceki bir makbuzla zaten güncel mi? */
function durumHazir(
  lesson: Lesson | undefined,
  kapsam: ReviewScope,
  hashler: ReturnType<typeof computeLessonSubjectHashes>,
  receipts: ReviewReceipt[],
): boolean {
  if (!lesson) return false;
  const sonuncu = receipts.filter((receipt) => receipt.lessonId === lesson.slug && receipt.scope === kapsam).at(-1);
  if (!sonuncu || sonuncu.decision !== "approved") return false;
  return SCOPE_SUBJECT_KEYS[kapsam].every((key) => sonuncu.subject[key] === hashler[key]);
}

// -------------------------------------------------------------------- yardım

function komutYardim(): void {
  console.log(`
npm run review <komut>

  kuyruk [--limit N] [--yayin]      İncelenmeyi bekleyen dersleri risk sırasıyla listeler
  goster <ders-id>                  Tek dersin inceleme malzemesini ve kapsam durumunu basar
  onayla <ders-id> --kapsam ... --kim "Ad"
                                    İnsan kararını kapsam makbuzuna bağlar

onayla bayrakları:
  --kapsam source,technical,pedagogical | hepsi
  --kim "Ad Soyad"                  zorunlu
  --rol maintainer|robotics-sme|educator|safety-sme   (varsayılan: maintainer)
  --karar approved|changes-requested                  (varsayılan: approved)
  --tarih YYYY-MM-DD                (varsayılan: bugün)
  --not "kısa gerekçe"
  --yayinla                         durum: yayinda yapar (gerekli tüm kapsamlar onaylanmışsa)

Bu araç inceleme yapmaz; incelenecek malzemeyi toplar ve insanın kararını
doğrulanabilir biçimde kaydeder.
`);
}

const args = parseArgs(process.argv.slice(2));
switch (args.komut) {
  case "kuyruk":
    komutKuyruk(args);
    break;
  case "goster":
    komutGoster(args);
    break;
  case "onayla":
    komutOnayla(args);
    break;
  default:
    komutYardim();
}
