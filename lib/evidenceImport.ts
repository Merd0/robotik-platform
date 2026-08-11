import {
  EVIDENCE_KINDS,
  EVIDENCE_PREDICATES,
  EVIDENCE_RESULTS,
  EVIDENCE_STAGES,
  EVIDENCE_VERIFICATIONS,
  type EvidenceEvent,
} from "./evidence";

/**
 * Sprint 2 "Kanıt Dikey Dilimi" — kullanıcı tarafından dışa aktarılmış bir
 * deney kaydını (bkz. `serializeEvidence`) analiz eder. Saf: dosya sistemi,
 * ağ veya tarayıcı API'sine dokunmaz — girdi zaten okunmuş bir dize.
 * `components/tools/EvidenceJsonReader.tsx` bu modülü çağırıp sonucu
 * gösterir; kendisi hiçbir yere veri göndermez (docs/05 "kişisel veri
 * toplanmaz" ilkesiyle aynı doğrultuda: dosya yalnız kullanıcının kendi
 * tarayıcısında kalır).
 */

export const EVIDENCE_EXPORT_SCHEMA = "robotik-platform/evidence-export/v2";

export type LessonFreshness = "current" | "stale" | "unknown";

export interface LessonImportSummary {
  lessonId: string;
  eventCount: number;
  /** Bu ders için görülen ve GÜNCEL predicate kümesinde karşılığı olan geçerli "passed" id'leri. */
  passedPredicateIds: string[];
  /** "passed" olarak işaretli ama predicateId artık güncel predicate kümesinde YOK (bkz. Sprint 0). */
  stalePredicateIds: string[];
  /** Bu derse ait olaylarda görülen, birbirinden farklı contentVersion değerleri. */
  contentVersions: string[];
  /** `currentTeachingHashes` verildiyse: kayıt güncel ders sürümüyle mi yazılmış. Verilmediyse "unknown". */
  freshness: LessonFreshness;
}

export interface EvidenceImportIssue {
  severity: "error" | "warning";
  message: string;
}

export interface EvidenceImportReport {
  /** Üst düzey biçim (JSON + şema + her olayın asgari geçerliliği) sağlam mı. */
  valid: boolean;
  schema: string | null;
  exportedAt: string | null;
  eventCount: number;
  validEventCount: number;
  issues: EvidenceImportIssue[];
  lessons: LessonImportSummary[];
}

const STAGE_SET = new Set<string>(EVIDENCE_STAGES);
const RESULT_SET = new Set<string>(EVIDENCE_RESULTS);
const KIND_SET = new Set<string>(EVIDENCE_KINDS);
const VERIFICATION_SET = new Set<string>(EVIDENCE_VERIFICATIONS);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Bir olayın asgari şekil doğruluğu — `EvidenceEvent`'in gerçek alan sözleşmesiyle birebir. */
function validateEventShape(value: unknown, index: number): { event: EvidenceEvent | null; issues: EvidenceImportIssue[] } {
  const issues: EvidenceImportIssue[] = [];
  const prefix = `olay #${index}`;
  if (typeof value !== "object" || value === null) {
    return { event: null, issues: [{ severity: "error", message: `${prefix}: obje değil` }] };
  }
  const record = value as Record<string, unknown>;

  if (record.schemaVersion !== 2) issues.push({ severity: "error", message: `${prefix}: schemaVersion 2 olmalı` });
  if (!isNonEmptyString(record.id)) issues.push({ severity: "error", message: `${prefix}: id eksik` });
  if (!isNonEmptyString(record.lessonId)) issues.push({ severity: "error", message: `${prefix}: lessonId eksik` });
  if (!isNonEmptyString(record.skillId)) issues.push({ severity: "error", message: `${prefix}: skillId eksik` });
  if (!isNonEmptyString(record.contentVersion)) issues.push({ severity: "error", message: `${prefix}: contentVersion eksik` });
  if (!isNonEmptyString(record.createdAt) || Number.isNaN(Date.parse(record.createdAt))) {
    issues.push({ severity: "error", message: `${prefix}: createdAt geçerli bir tarih değil` });
  }
  if (typeof record.kind !== "string" || !KIND_SET.has(record.kind)) issues.push({ severity: "error", message: `${prefix}: kind geçersiz` });
  if (typeof record.stage !== "string" || !STAGE_SET.has(record.stage)) issues.push({ severity: "error", message: `${prefix}: stage geçersiz` });
  if (typeof record.result !== "string" || !RESULT_SET.has(record.result)) issues.push({ severity: "error", message: `${prefix}: result geçersiz` });
  if (typeof record.verification !== "string" || !VERIFICATION_SET.has(record.verification)) {
    issues.push({ severity: "error", message: `${prefix}: verification geçersiz` });
  }
  if (record.predicateId !== undefined && !isNonEmptyString(record.predicateId)) {
    issues.push({ severity: "error", message: `${prefix}: predicateId varsa dize olmalı` });
  }

  if (issues.some((issue) => issue.severity === "error")) return { event: null, issues };
  return { event: record as unknown as EvidenceEvent, issues };
}

/**
 * Dışa aktarılmış bir deney dosyasını analiz eder.
 *
 * `currentTeachingHashes`: lessonId → o dersin GÜNCEL `teachingHash`'i.
 * Verilirse tazelik ("güncel"/"eski sürüm") gerçekten hesaplanır; verilmezse
 * (ör. tarayıcıda derleme-zamanı manifesti henüz yüklenmediyse) her ders
 * "bilinmiyor" olarak işaretlenir — YANLIŞ "güncel" bilgisi asla üretilmez.
 */
export function analyzeEvidenceExport(raw: string, currentTeachingHashes: Record<string, string> = {}): EvidenceImportReport {
  const issues: EvidenceImportIssue[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, schema: null, exportedAt: null, eventCount: 0, validEventCount: 0, lessons: [], issues: [{ severity: "error", message: "Dosya geçerli bir JSON değil." }] };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { valid: false, schema: null, exportedAt: null, eventCount: 0, validEventCount: 0, lessons: [], issues: [{ severity: "error", message: "Dosya bir obje içermiyor." }] };
  }

  const root = parsed as Record<string, unknown>;
  const schema = isNonEmptyString(root.schema) ? root.schema : null;
  const exportedAt = isNonEmptyString(root.exportedAt) ? root.exportedAt : null;

  if (schema !== EVIDENCE_EXPORT_SCHEMA) {
    issues.push({
      severity: "error",
      message: schema
        ? `Beklenmeyen şema: "${schema}" (beklenen "${EVIDENCE_EXPORT_SCHEMA}"). Bu dosya robotik-platform'un kendi dışa aktarımı olmayabilir.`
        : `"schema" alanı eksik — bu dosya robotik-platform'un kendi dışa aktarımı olmayabilir.`,
    });
  }

  if (!Array.isArray(root.events)) {
    issues.push({ severity: "error", message: `"events" bir dizi olmalı.` });
    return { valid: false, schema, exportedAt, eventCount: 0, validEventCount: 0, lessons: [], issues };
  }

  const rawEvents = root.events;
  const validEvents: EvidenceEvent[] = [];
  rawEvents.forEach((rawEvent, index) => {
    const { event: parsedEvent, issues: eventIssues } = validateEventShape(rawEvent, index);
    issues.push(...eventIssues);
    if (parsedEvent) validEvents.push(parsedEvent);
  });

  const currentPredicatesByLesson = new Map<string, Set<string>>();
  for (const predicate of EVIDENCE_PREDICATES) {
    const set = currentPredicatesByLesson.get(predicate.lessonId) ?? new Set<string>();
    set.add(predicate.id);
    currentPredicatesByLesson.set(predicate.lessonId, set);
  }

  const lessonIds = [...new Set(validEvents.map((event) => event.lessonId))].sort();
  const lessons: LessonImportSummary[] = lessonIds.map((lessonId) => {
    const lessonEvents = validEvents.filter((event) => event.lessonId === lessonId);
    const currentPredicateIds = currentPredicatesByLesson.get(lessonId) ?? new Set<string>();
    const passedEvents = lessonEvents.filter(
      (event) => event.stage === "passed" && event.result === "success" && event.verification === "registry-predicate" && Boolean(event.predicateId),
    );
    const passedPredicateIds = [...new Set(
      passedEvents.filter((event) => currentPredicateIds.has(event.predicateId!)).map((event) => event.predicateId!),
    )].sort();
    const stalePredicateIds = [...new Set(
      passedEvents.filter((event) => !currentPredicateIds.has(event.predicateId!)).map((event) => event.predicateId!),
    )].sort();
    const contentVersions = [...new Set(lessonEvents.map((event) => event.contentVersion))].sort();

    let freshness: LessonFreshness = "unknown";
    const currentHash = currentTeachingHashes[lessonId];
    if (currentHash) {
      freshness = contentVersions.includes(currentHash) && contentVersions.length === 1 ? "current" : "stale";
    }

    return { lessonId, eventCount: lessonEvents.length, passedPredicateIds, stalePredicateIds, contentVersions, freshness };
  });

  const hasErrors = issues.some((issue) => issue.severity === "error");
  return {
    valid: !hasErrors && schema === EVIDENCE_EXPORT_SCHEMA,
    schema,
    exportedAt,
    eventCount: rawEvents.length,
    validEventCount: validEvents.length,
    issues,
    lessons,
  };
}
