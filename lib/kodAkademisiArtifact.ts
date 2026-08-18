import { canonicalize, digest } from "./lessonArtifact";

/**
 * Kod Akademisi modül sürümü — TEK bir içerik hash'i.
 *
 * Ders sisteminin üç köklü (source/teaching/presentation) bölünmesi (bkz.
 * `lib/lessonArtifact.ts`) BİLİNÇLİ olarak buraya taşınmadı: o bölünme
 * Review Receipt kapsam ayrımı (bir kaynağın erişim tarihini tazelemenin
 * pedagojik incelemeyi eskitmemesi) için var, ve Kod Akademisi modülleri o
 * sisteme hiç girmiyor — `kaynaklar` alanı yok, `content/review-receipts.json`
 * yalnız ders hatlarını kapsıyor. Burada tek soru var: "öğrencinin gördüğü
 * deney (modül metni + başlangıç kodu + davranışsal doğrulama) aynı mı,
 * değişti mi" — bu yüzden tek hash yeterli (bkz. docs/durum-codex.md
 * "Kod Akademisi — mimari teklif", 2026-08-18 kararı).
 *
 * `canonicalize`/`digest` `lib/lessonArtifact.ts`'ten paylaşılıyor — anahtar
 * sıralama ve hash biçimi iki sistemde de aynı, yeniden yazılmadı.
 */

export type KodAkademisiAsama = "temel" | "orta" | "ileri" | "usta";

export interface KodAkademisiModuleInput {
  frontmatter: {
    baslik: string;
    asama: KodAkademisiAsama;
    sira: number;
    kazanimlar: readonly string[];
    ipuclari: readonly string[];
    cozum: string;
  };
  /** Ders gövdesi (MDX), frontmatter olmadan. */
  body: string;
  /** Öğrencinin gördüğü başlangıç Python kodu. */
  initialCode: string;
  /** Bu modüle bağlı `EVIDENCE_PREDICATES` id'leri — sıralı küme olarak hash'e girer. */
  predicateIds: readonly string[];
}

function normalizeBody(body: string): string {
  return body.replace(/\r\n?/g, "\n").trimEnd() + "\n";
}

export function createModulePayload(module: KodAkademisiModuleInput): string {
  return JSON.stringify(
    canonicalize({
      schema: "kod-akademisi-module/v1",
      frontmatter: {
        baslik: module.frontmatter.baslik,
        asama: module.frontmatter.asama,
        sira: module.frontmatter.sira,
        kazanimlar: module.frontmatter.kazanimlar,
        ipuclari: module.frontmatter.ipuclari,
        cozum: module.frontmatter.cozum,
      },
      body: normalizeBody(module.body),
      initialCode: module.initialCode,
      predicateIds: [...module.predicateIds].sort(),
    }),
  );
}

/**
 * Modülün sürüm kökü. `lib/evidence.ts`'e verilen `contentVersion` budur —
 * modül metni, başlangıç kodu, kazanımlar/ipuçları/çözüm veya bağlı
 * predicate kümesi değişirse eski öğrenci kanıtı otomatik eskir.
 */
export function computeModuleHash(module: KodAkademisiModuleInput): string {
  return digest(createModulePayload(module));
}
