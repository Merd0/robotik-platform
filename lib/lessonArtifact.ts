import { createHash } from "node:crypto";
import type { DersFrontmatter, Lesson } from "./content";

type CanonicalValue = null | boolean | number | string | CanonicalValue[] | { [key: string]: CanonicalValue };

function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  throw new TypeError(`Ders artifact'ında kanonikleştirilemeyen değer: ${typeof value}`);
}

/**
 * Ders sürümü tek bir hash değil, üç bağımsız köke ayrılır.
 *
 * Gerekçe: v1'de tek `artifactHash` vardı ve frontmatter'ın TAMAMINI
 * kapsıyordu. Bunun iki somut sonucu vardı:
 *
 * 1. `durum: taslak → yayinda` çevirmek hash'i değiştirdiği için, incelenip
 *    makbuza bağlanan bir taslak yayına alındığı anda makbuzu geçersiz
 *    oluyordu. Yani "önce incele, sonra yayınla" sırası teknik olarak
 *    imkânsızdı (bkz. docs/durum-denetim.md, "yayına alma paradoksu").
 * 2. Bir kaynağın `accessedAt` tarihini tazelemek, dersin pedagojik
 *    incelemesini de eskitiyordu.
 *
 * v2'de her kök yalnız kendi ilgi alanını kapsar ve inceleme kapsamları
 * (`ReviewScope`) bu köklere ayrı ayrı bağlanır:
 *
 * - `sourceHash`       → yalnız `kaynaklar`
 * - `teachingHash`     → öğrenciye öğretilen şey: gövde metni + öğretim
 *                        metadatası. Öğrenci ilerleme kaydının sürüm
 *                        anahtarı da budur.
 * - `presentationHash` → yayın durumu ve sunum metadatası. HİÇBİR inceleme
 *                        kapsamını eskitmez; yalnız denetim izi için vardır.
 */
export const SOURCE_FIELDS = ["kaynaklar"] as const satisfies readonly (keyof DersFrontmatter)[];
export const TEACHING_FIELDS = [
  "baslik",
  "hat",
  "seviye",
  "onkosul",
  "kazanimlar",
  "etkilesimli",
] as const satisfies readonly (keyof DersFrontmatter)[];
export const PRESENTATION_FIELDS = [
  "id",
  "sure",
  "sira",
  "durum",
  "incelendi_tarafindan",
  "incelendi_tarih",
] as const satisfies readonly (keyof DersFrontmatter)[];

const PARTITIONED_FIELDS = new Set<string>([...SOURCE_FIELDS, ...TEACHING_FIELDS, ...PRESENTATION_FIELDS]);

/**
 * Hiçbir kökün kapsamadığı frontmatter alanlarını döndürür.
 *
 * Yeni bir frontmatter alanı eklendiğinde, o alanın hangi inceleme kapsamını
 * eskiteceği bilinçli olarak seçilmeli. Bu fonksiyon `check-content.ts` ve
 * birim testinden çağrılır; sessizce kapsam dışı kalan alan bırakmaz.
 */
export function findUnpartitionedFrontmatterKeys(frontmatter: DersFrontmatter): string[] {
  return Object.keys(frontmatter).filter((key) => !PARTITIONED_FIELDS.has(key));
}

function pick(frontmatter: DersFrontmatter, fields: readonly string[]): Record<string, unknown> {
  const source = frontmatter as unknown as Record<string, unknown>;
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

function digest(payload: string): string {
  return `sha256:${createHash("sha256").update(payload, "utf8").digest("hex")}`;
}

function normalizeBody(body: string): string {
  return body.replace(/\r\n?/g, "\n").trimEnd() + "\n";
}

export type LessonInput = Pick<Lesson, "frontmatter" | "body">;

export interface LessonSubjectHashes {
  sourceHash: string;
  teachingHash: string;
  presentationHash: string;
  /** Üç kökün birleşimi; tek satırda "bu tam olarak hangi ders sürümü" demek için. */
  revisionRoot: string;
}

export function createSourcePayload(lesson: LessonInput): string {
  return JSON.stringify(
    canonicalize({ schema: "lesson-source/v2", frontmatter: pick(lesson.frontmatter, SOURCE_FIELDS) }),
  );
}

export function createTeachingPayload(lesson: LessonInput): string {
  return JSON.stringify(
    canonicalize({
      schema: "lesson-teaching/v2",
      frontmatter: pick(lesson.frontmatter, TEACHING_FIELDS),
      body: normalizeBody(lesson.body),
    }),
  );
}

export function createPresentationPayload(lesson: LessonInput): string {
  return JSON.stringify(
    canonicalize({ schema: "lesson-presentation/v2", frontmatter: pick(lesson.frontmatter, PRESENTATION_FIELDS) }),
  );
}

export function computeSourceHash(lesson: LessonInput): string {
  return digest(createSourcePayload(lesson));
}

/**
 * Öğrenciye öğretilen içeriğin sürümü.
 *
 * Öğrenci ilerleme kaydı (`lib/evidence.ts` içindeki `contentVersion`) buna
 * bağlanır: ders metni veya kazanımları değişirse eski kanıt geçersiz olur,
 * ama bir kaynağın erişim tarihini güncellemek veya dersi yayına almak
 * öğrencinin kaydını silmez.
 */
export function computeTeachingHash(lesson: LessonInput): string {
  return digest(createTeachingPayload(lesson));
}

export function computePresentationHash(lesson: LessonInput): string {
  return digest(createPresentationPayload(lesson));
}

export function computeLessonSubjectHashes(lesson: LessonInput): LessonSubjectHashes {
  const sourceHash = computeSourceHash(lesson);
  const teachingHash = computeTeachingHash(lesson);
  const presentationHash = computePresentationHash(lesson);
  return {
    sourceHash,
    teachingHash,
    presentationHash,
    revisionRoot: digest(JSON.stringify({ schema: "lesson-revision/v2", sourceHash, teachingHash, presentationHash })),
  };
}
