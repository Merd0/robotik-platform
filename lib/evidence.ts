// `as const` dizileri: hem tip (aşağıda türetilir) hem çalışma zamanı
// doğrulaması (bkz. lib/evidenceImport.ts) AYNI kaynaktan gelsin diye.
// docs/02-mimari.md'deki `REVIEW_SCOPES` deseniyle aynı.
export const EVIDENCE_STAGES = ["read", "predicted", "tried", "observed", "assessed", "passed"] as const;
export type EvidenceStage = (typeof EVIDENCE_STAGES)[number];
export type RecordableEvidenceStage = Exclude<EvidenceStage, "passed">;
export const EVIDENCE_RESULTS = ["success", "retry", "neutral"] as const;
export type EvidenceResult = (typeof EVIDENCE_RESULTS)[number];
export const EVIDENCE_KINDS = ["observation", "assessment", "achievement", "legacy"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export const EVIDENCE_VERIFICATIONS = ["self-reported", "component-observed", "registry-predicate", "legacy-unverified"] as const;
export type EvidenceVerification = (typeof EVIDENCE_VERIFICATIONS)[number];

export interface EvidenceEvent {
  schemaVersion: 2;
  id: string;
  lessonId: string;
  skillId: string;
  kind: EvidenceKind;
  stage: EvidenceStage;
  result: EvidenceResult;
  verification: EvidenceVerification;
  predicateId?: string;
  metrics?: Record<string, number | string | boolean>;
  attempts?: number;
  seed?: number;
  contentVersion: string;
  createdAt: string;
}

export interface EvidenceInput {
  lessonId: string;
  skillId: string;
  stage: RecordableEvidenceStage;
  result: EvidenceResult;
  metrics?: Record<string, number | string | boolean>;
  attempts?: number;
  seed?: number;
  contentVersion: string;
}

export interface EvidenceSummary {
  read: boolean;
  tried: boolean;
  passed: boolean;
  hasPredicate: boolean;
  assessmentCount: number;
  eventCount: number;
  lastEvent?: EvidenceEvent;
}

export type EvidencePersistence = "local" | "memory";

export const EVIDENCE_STORAGE_KEY = "robotik-platform:evidence:v2";
export const LEGACY_EVIDENCE_STORAGE_KEY = "robotik-platform:evidence:v1";
export const LEGACY_PROGRESS_STORAGE_KEY = "robotik-platform:tamamlanan-dersler";
export const EMPTY_EVIDENCE: readonly EvidenceEvent[] = [];

interface LegacyEvidenceEvent {
  id?: string;
  lessonId?: string;
  skillId?: string;
  stage?: string;
  result?: EvidenceResult;
  metrics?: Record<string, number | string | boolean>;
  attempts?: number;
  seed?: number;
  contentVersion?: string;
  createdAt?: string;
}

interface EvidencePredicate {
  id: string;
  lessonId: string;
  skillId: string;
  evaluate: (events: readonly EvidenceEvent[]) => { passed: boolean; metrics?: Record<string, number | string | boolean> };
}

const hasSuccessfulAssessment = (events: readonly EvidenceEvent[], skillId: string) =>
  events.some((event) => event.stage === "assessed" && event.skillId === skillId && event.result === "success");

const hasObservedJoints = (events: readonly EvidenceEvent[], required: readonly number[]) => {
  const joints = new Set(
    events
      .filter((event) => event.skillId === "forward-kinematics" && event.stage === "observed")
      .map((event) => event.metrics?.joint)
      .filter((joint): joint is number => typeof joint === "number"),
  );
  return required.every((joint) => joints.has(joint));
};

/**
 * Başarı üretebilen tek liste. Predicate'ler aynı ders artifact sürümündeki
 * ölçülebilir gözlem + kavram kontrolünü birlikte ister; UI'dan gelen tek bir
 * `success` olayı hiçbir zaman doğrudan başarı değildir.
 */
export const EVIDENCE_PREDICATES: readonly EvidencePredicate[] = [
  {
    // v1 → v2: JointSliders'ın revolute eklemleri yalnız "tried" yazıyordu,
    // "observed" hiç üretilmiyordu; bu predicate hiçbir zaman geçilemiyordu
    // (false negative). Bileşen artık pointer-up/blur/klavye commit'inde
    // "observed" yazıyor. Mantık aynı ama besleyen olay akışı değişti;
    // sürüm atlamak, hiçbir zaman gerçekleşmemiş olsa da eski id altında
    // birikmiş olabilecek kaydı yeni id ile karıştırmaz.
    id: "forward-kinematics-dual-joint-v2",
    lessonId: "b-ortaokul-eklemleri-oynat",
    skillId: "forward-kinematics",
    evaluate: (events) => ({
      passed: hasObservedJoints(events, [1, 2]) && hasSuccessfulAssessment(events, "forward-kinematics"),
      metrics: { requiredJoints: 2 },
    }),
  },
  {
    // v1 → v2 (Sprint 2): İki düzeltme birlikte.
    // (a) Predicate yalnız metrics.elbow'un VARLIĞINA bakıyordu, result'a
    //     bakmıyordu — IkTarget'ın dirsek değiştirme olayı ÇÖZÜMSÜZ bir
    //     konumda bile koşulsuz kaydediliyordu (bkz. component düzeltmesi),
    //     bu yüzden predicate de result === "success" şartı almalı.
    // (b) IkTarget artık kaydı yalnız commit anında (pointer-up/blur/klavye)
    //     yazıyor; eski sürümde her sürükleme karesi ayrı kayıttı, bu yüzden
    //     iki farklı dirseği "denemek" fiilen daha kolaydı. Besleyen davranış
    //     değiştiği için id sürümlendi (bkz. Sprint 0 "predicate id'lerini
    //     sürümle" ilkesi).
    id: "multiple-ik-solutions-v2",
    lessonId: "b-ortaokul-birden-fazla-yol",
    skillId: "multiple-ik-solutions",
    evaluate: (events) => {
      const elbows = new Set(
        events
          .filter((event) => event.skillId === "multiple-ik-solutions" && event.stage === "observed" && event.result === "success")
          .map((event) => event.metrics?.elbow)
          .filter((elbow): elbow is string => typeof elbow === "string"),
      );
      return { passed: elbows.size >= 2 && hasSuccessfulAssessment(events, "multiple-ik-solutions"), metrics: { observedElbows: elbows.size } };
    },
  },
  {
    // v1 → v2 (Sprint 2): mantık zaten doğruydu (result === "success" zaten
    // aranıyordu), ama IkTarget artık sürüklemenin HER karesinde değil yalnız
    // commit anında kaydediyor — eskiden tek bir sürükleme hareketiyle hem
    // erişilebilir hem erişilemez bölgeden geçmek predicate'i tetikleyebilirdi,
    // artık kullanıcı iki ayrı noktaya bilerek commit etmeli. Besleyen
    // davranış değiştiği için sürümlendi.
    id: "geometric-ik-boundary-v2",
    lessonId: "b-lise-geometrik-ters-kinematik",
    skillId: "geometric-ik",
    evaluate: (events) => {
      const ikEvents = events.filter((event) => event.skillId === "inverse-kinematics");
      return {
        passed:
          ikEvents.some((event) => event.result === "success") &&
          ikEvents.some((event) => event.metrics?.unreachable === true) &&
          hasSuccessfulAssessment(events, "geometric-ik"),
        metrics: { requiresReachableAndUnreachable: true },
      };
    },
  },
  {
    id: "jacobian-singularity-observation-v1",
    lessonId: "b-universite-jacobian",
    skillId: "jacobian-singularity",
    evaluate: (events) => ({
      passed:
        events.some((event) => event.skillId === "jacobian-singularity" && event.stage === "observed" && event.metrics?.nearStraight === true) &&
        hasSuccessfulAssessment(events, "jacobian-singularity"),
      metrics: { singularityObserved: true },
    }),
  },
  {
    // v1 → v2: predicate yalnız "algoritma denendi mi"yi sayıyordu (metrics.algorithm
    // hem başarılı hem başarısız/timeout koşularda yazılıyor), result alanına hiç
    // bakmıyordu — üç başarısız koşu bile passed=true üretiyordu (false positive).
    // Artık yalnız gerçekten yol bulmuş (result === "success") koşular sayılıyor.
    id: "planner-three-way-comparison-v2",
    lessonId: "c-universite-algoritma-karsilastirma-deneyi",
    skillId: "planner-comparison",
    evaluate: (events) => {
      const successfulAlgorithms = new Set(
        events
          .filter((event) => event.skillId === "planner-comparison" && event.stage === "observed" && event.result === "success")
          .map((event) => event.metrics?.algorithm)
          .filter((algorithm): algorithm is string => typeof algorithm === "string"),
      );
      return {
        passed: ["astar", "rrt", "rrt_star"].every((algorithm) => successfulAlgorithms.has(algorithm)) && hasSuccessfulAssessment(events, "planner-comparison"),
        metrics: { comparedAlgorithms: successfulAlgorithms.size },
      };
    },
  },
  {
    id: "transform-order-comparison-v1",
    lessonId: "a-universite-homojen-donusum",
    skillId: "transform-order",
    evaluate: (events) => {
      const orders = new Set(events
        .filter((event) => event.skillId === "transform-order" && event.stage === "observed")
        .map((event) => event.metrics?.order)
        .filter((order): order is string => typeof order === "string"));
      return {
        passed: orders.has("translation-then-rotation") && orders.has("rotation-then-translation") && hasSuccessfulAssessment(events, "transform-order"),
        metrics: { comparedOrders: orders.size },
      };
    },
  },
  {
    id: "dls-damping-comparison-v1",
    lessonId: "b-universite-ters-kinematik",
    skillId: "dls-convergence",
    evaluate: (events) => {
      const bands = new Set(events
        .filter((event) => event.skillId === "dls-convergence" && event.stage === "observed")
        .map((event) => event.metrics?.dampingBand)
        .filter((band): band is string => typeof band === "string"));
      return {
        passed: bands.has("dusuk") && bands.has("sonumlu") && hasSuccessfulAssessment(events, "dls-convergence"),
        metrics: { comparedDampingBands: bands.size },
      };
    },
  },
  {
    id: "configuration-space-boundary-v1",
    lessonId: "c-universite-c-space",
    skillId: "configuration-space",
    evaluate: (events) => {
      const configurations = new Set(events
        .filter((event) => event.skillId === "configuration-space" && event.stage === "observed")
        .map((event) => event.metrics?.configuration)
        .filter((configuration): configuration is string => typeof configuration === "string"));
      return {
        passed: configurations.has("safe") && configurations.has("collision") && hasSuccessfulAssessment(events, "configuration-space"),
        metrics: { observedConfigurationClasses: configurations.size },
      };
    },
  },
  {
    id: "robot-selection-four-criteria-v1",
    lessonId: "a-universite-robot-mimarileri",
    skillId: "robot-selection",
    evaluate: (events) => {
      const successfulDecision = events.find((event) =>
        event.skillId === "robot-selection" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        typeof event.metrics?.numericCriteria === "number" && event.metrics.numericCriteria >= 4 &&
        typeof event.metrics?.rationaleLength === "number" && event.metrics.rationaleLength >= 40 &&
        event.metrics?.decisionStatus !== "fail",
      );
      const observedSameCandidate = Boolean(successfulDecision && events.some((event) =>
        event.skillId === "robot-selection" &&
        event.stage === "observed" &&
        event.metrics?.taskId === successfulDecision.metrics?.taskId &&
        event.metrics?.candidateId === successfulDecision.metrics?.candidateId,
      ));
      return {
        passed: Boolean(successfulDecision && observedSameCandidate),
        metrics: { requiredNumericCriteria: 4, requiredRationaleLength: 40 },
      };
    },
  },
  {
    id: "four-lens-fk-trace-v1",
    lessonId: "b-lise-ileri-kinematik",
    skillId: "four-lens-forward-kinematics",
    evaluate: (events) => {
      const samples = new Set(events
        .filter((event) => event.skillId === "four-lens-forward-kinematics" && event.stage === "observed")
        .map((event) => event.metrics?.sampleIndex)
        .filter((sample): sample is number => typeof sample === "number"));
      const assessedFinal = events.some((event) =>
        event.skillId === "four-lens-forward-kinematics" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.finalSample === 3,
      );
      return { passed: samples.has(0) && samples.has(3) && assessedFinal, metrics: { observedSamples: samples.size, requiredFinalSample: 3 } };
    },
  },
] as const;

const listeners = new Set<() => void>();
let initialized = false;
let cachedEvents: readonly EvidenceEvent[] = EMPTY_EVIDENCE;
let persistence: EvidencePersistence = "local";

/**
 * Saklama politikası: kör global 1000-olay FIFO'nun yerini alır.
 *
 * `read` ve `passed` milestone'lardır — bir öğrencinin "bu dersi okudum" ve
 * "bunu kanıtladım" kaydı, ne kadar sürükleme/deneme olayı birikirse
 * birikisin asla silinmemeli. Geri kalan her şey (tried/observed/assessed)
 * "gözlem": sürekli sürüklemede aynı (ders, beceri, aşama, sonuç, metrik)
 * onlarca kez tekrar edebilir (bkz. JointSliders/PlannerRace commit'leri),
 * bu yüzden önce tekrar edenler tek kayda iner, sonra ders+beceri başına ve
 * son olarak toplamda en yeniler kalacak şekilde kotalanır.
 */
const MAX_OBSERVATIONS_PER_SKILL = 30;
const MAX_TOTAL_OBSERVATIONS = 500;

function isMilestoneEvent(event: EvidenceEvent): boolean {
  return event.stage === "read" || event.stage === "passed";
}

function observationFingerprint(event: EvidenceEvent): string {
  const metricsKey = event.metrics
    ? Object.keys(event.metrics).sort().map((key) => `${key}=${String(event.metrics![key])}`).join("&")
    : "";
  return [event.lessonId, event.skillId, event.stage, event.result, event.attempts ?? "", metricsKey].join("::");
}

function applyRetentionPolicy(events: readonly EvidenceEvent[]): EvidenceEvent[] {
  const milestones = events.filter(isMilestoneEvent);
  const observations = events.filter((event) => !isMilestoneEvent(event));

  // 1) Tam tekrarı yalnız son örneğiyle tut (göreli kronolojik sıra korunur,
  //    çünkü `observations` zaten orijinal ekleme sırasında).
  const latestByFingerprint = new Map<string, EvidenceEvent>();
  for (const observation of observations) latestByFingerprint.set(observationFingerprint(observation), observation);
  const survivingFingerprintIds = new Set([...latestByFingerprint.values()].map((event) => event.id));
  const dedupedObservations = observations.filter((event) => survivingFingerprintIds.has(event.id));

  // 2) Ders+beceri başına kota: yalnız en yeni N kayıt kalır.
  const bucketsBySkill = new Map<string, EvidenceEvent[]>();
  for (const event of dedupedObservations) {
    const key = `${event.lessonId}::${event.skillId}`;
    const bucket = bucketsBySkill.get(key);
    if (bucket) bucket.push(event);
    else bucketsBySkill.set(key, [event]);
  }
  const perSkillSurvivorIds = new Set<string>();
  for (const bucket of bucketsBySkill.values()) {
    const kept = bucket.length > MAX_OBSERVATIONS_PER_SKILL ? bucket.slice(bucket.length - MAX_OBSERVATIONS_PER_SKILL) : bucket;
    for (const event of kept) perSkillSurvivorIds.add(event.id);
  }
  const quotaedObservations = dedupedObservations.filter((event) => perSkillSurvivorIds.has(event.id));

  // 3) Global semantik kota: milestone'lar hariç toplam gözlem sayısı sınırlı, en yeniler kalır.
  const boundedObservations = quotaedObservations.length > MAX_TOTAL_OBSERVATIONS
    ? quotaedObservations.slice(quotaedObservations.length - MAX_TOTAL_OBSERVATIONS)
    : quotaedObservations;

  const keep = new Set([...milestones.map((event) => event.id), ...boundedObservations.map((event) => event.id)]);
  return events.filter((event) => keep.has(event.id));
}

const safeArray = (raw: string | null): unknown[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isV2Event = (value: unknown): value is EvidenceEvent => {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<EvidenceEvent>;
  return event.schemaVersion === 2 && typeof event.id === "string" && typeof event.lessonId === "string" && typeof event.skillId === "string";
};

export function migrateLegacyEvidence(
  legacyEvents: readonly LegacyEvidenceEvent[],
  completedLessonIds: readonly string[],
  migratedAt = new Date().toISOString(),
): EvidenceEvent[] {
  const migrated = legacyEvents
    .filter((event) => typeof event.lessonId === "string" && typeof event.skillId === "string")
    .map((event, index): EvidenceEvent => ({
      schemaVersion: 2,
      id: `legacy-v1:${event.id ?? index}`,
      lessonId: event.lessonId!,
      skillId: event.skillId!,
      kind: "legacy",
      stage: event.stage === "passed" || event.stage === "transferred" ? "assessed" : (["read", "predicted", "tried", "observed", "assessed"].includes(event.stage ?? "") ? event.stage as RecordableEvidenceStage : "observed"),
      result: event.result ?? "neutral",
      verification: "legacy-unverified",
      metrics: event.metrics,
      attempts: event.attempts,
      seed: event.seed,
      contentVersion: event.contentVersion ?? "legacy-unknown",
      createdAt: event.createdAt ?? migratedAt,
    }));

  const lessonsAlreadyPresent = new Set(migrated.map((event) => event.lessonId));
  for (const lessonId of completedLessonIds.filter((id) => typeof id === "string")) {
    if (lessonsAlreadyPresent.has(lessonId)) continue;
    migrated.push({
      schemaVersion: 2,
      id: `legacy-progress:${lessonId}`,
      lessonId,
      skillId: "legacy-manual-completion",
      kind: "legacy",
      stage: "read",
      result: "neutral",
      verification: "legacy-unverified",
      contentVersion: "legacy-unknown",
      createdAt: migratedAt,
    });
  }
  return migrated;
}

function initializeEvidence(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const storedV2 = safeArray(window.localStorage.getItem(EVIDENCE_STORAGE_KEY)).filter(isV2Event);
    if (storedV2.length > 0 || window.localStorage.getItem(EVIDENCE_STORAGE_KEY) !== null) {
      cachedEvents = storedV2;
      persistence = "local";
      return;
    }

    const legacy = safeArray(window.localStorage.getItem(LEGACY_EVIDENCE_STORAGE_KEY)) as LegacyEvidenceEvent[];
    const completed = safeArray(window.localStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY)).filter((id): id is string => typeof id === "string");
    const migrated = migrateLegacyEvidence(legacy, completed);
    cachedEvents = migrated;
    if (legacy.length > 0 || completed.length > 0) {
      window.localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(migrated));
      // Eski anahtarlar yalnız v2 yazımı başarıyla tamamlandıktan sonra silinir.
      window.localStorage.removeItem(LEGACY_EVIDENCE_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
    }
    persistence = "local";
  } catch {
    persistence = "memory";
  }
}

export function getEvidenceEvents(): readonly EvidenceEvent[] {
  if (typeof window === "undefined") return EMPTY_EVIDENCE;
  initializeEvidence();
  return cachedEvents;
}

export function getEvidencePersistence(): EvidencePersistence {
  if (typeof window !== "undefined") initializeEvidence();
  return persistence;
}

function persistEvidence(events: readonly EvidenceEvent[]): void {
  cachedEvents = applyRetentionPolicy(events);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(cachedEvents));
      persistence = "local";
    } catch {
      persistence = "memory";
    }
  }
  listeners.forEach((listener) => listener());
}

function achievementsFor(events: readonly EvidenceEvent[], input: EvidenceInput, createdAt: string): EvidenceEvent[] {
  const currentVersionEvents = events.filter(
    (event) => event.lessonId === input.lessonId && event.contentVersion === input.contentVersion && event.verification !== "legacy-unverified",
  );
  return EVIDENCE_PREDICATES
    .filter((predicate) => predicate.lessonId === input.lessonId)
    .flatMap((predicate) => {
      const alreadyPassed = currentVersionEvents.some(
        (event) => event.stage === "passed" && event.predicateId === predicate.id && event.verification === "registry-predicate",
      );
      const evaluation = predicate.evaluate(currentVersionEvents);
      if (alreadyPassed || !evaluation.passed) return [];
      return [{
        schemaVersion: 2,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        lessonId: input.lessonId,
        skillId: predicate.skillId,
        kind: "achievement",
        stage: "passed",
        result: "success",
        verification: "registry-predicate",
        predicateId: predicate.id,
        metrics: evaluation.metrics,
        contentVersion: input.contentVersion,
        createdAt,
      } satisfies EvidenceEvent];
    });
}

export function appendEvidence(input: EvidenceInput): EvidenceEvent | null {
  if (typeof window === "undefined" || (input as { stage: string }).stage === "passed") return null;
  const createdAt = new Date().toISOString();
  const event: EvidenceEvent = {
    ...input,
    schemaVersion: 2,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    kind: input.stage === "assessed" ? "assessment" : "observation",
    verification: input.stage === "read" ? "self-reported" : "component-observed",
    createdAt,
  };
  const withEvent = [...getEvidenceEvents(), event];
  persistEvidence([...withEvent, ...achievementsFor(withEvent, input, createdAt)]);
  return event;
}

export function clearEvidenceEvents(): void {
  cachedEvents = EMPTY_EVIDENCE;
  initialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(EVIDENCE_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_EVIDENCE_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
      persistence = "local";
    } catch {
      persistence = "memory";
    }
  }
  listeners.forEach((listener) => listener());
}

export function serializeEvidence(events: readonly EvidenceEvent[]): string {
  return JSON.stringify({
    schema: "robotik-platform/evidence-export/v2",
    exportedAt: new Date().toISOString(),
    privacy: "Yalnız bu tarayıcıdaki deney olayları; ad, hesap veya sertifika içermez.",
    events,
  }, null, 2);
}

export function subscribeEvidence(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if ([EVIDENCE_STORAGE_KEY, LEGACY_EVIDENCE_STORAGE_KEY, LEGACY_PROGRESS_STORAGE_KEY].includes(event.key ?? "")) {
      initialized = false;
      cachedEvents = EMPTY_EVIDENCE;
      listener();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function summarizeEvidence(events: readonly EvidenceEvent[], lessonId: string, contentVersion?: string): EvidenceSummary {
  const lessonEvents = events.filter(
    (event) => event.lessonId === lessonId && (!contentVersion || event.contentVersion === contentVersion),
  );
  // Bir predicate düzeltilip id'si sürümlenince (ör. v1 → v2), o dersin GÜNCEL
  // predicate kümesinde artık v1 yok. Eski koşuldan üretilmiş "passed" kaydı
  // arşivde durur (append-only ruhu) ama burada sayılmaz — aksi halde
  // düzeltilmiş bir hatanın ürettiği hatalı başarı sessizce geçerli kalırdı.
  const currentPredicateIds = new Set(
    EVIDENCE_PREDICATES.filter((predicate) => predicate.lessonId === lessonId).map((predicate) => predicate.id),
  );
  return {
    read: lessonEvents.some((event) => event.stage === "read"),
    tried: lessonEvents.some((event) => event.stage === "tried" || event.stage === "observed"),
    passed: lessonEvents.some(
      (event) =>
        event.stage === "passed" &&
        event.result === "success" &&
        event.verification === "registry-predicate" &&
        Boolean(event.predicateId) &&
        currentPredicateIds.has(event.predicateId!),
    ),
    hasPredicate: EVIDENCE_PREDICATES.some((predicate) => predicate.lessonId === lessonId),
    assessmentCount: lessonEvents.filter((event) => event.stage === "assessed").length,
    eventCount: lessonEvents.length,
    lastEvent: lessonEvents.at(-1),
  };
}
