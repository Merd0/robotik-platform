import { createFourLensTrace } from "./robotics/fourLensTrace";

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
    // v1 → v2: bileşen her slider karesinde olay yazıyor ve gerçek motor
    // sonucuna bakmadan |J2| < 8° kestirmesini observed/success sayıyordu.
    // Artık yalnız commit anındaki isNearSingularity sonucu kabul edilir.
    id: "jacobian-singularity-observation-v2",
    lessonId: "b-universite-jacobian",
    skillId: "jacobian-singularity",
    evaluate: (events) => ({
      passed:
        events.some((event) =>
          event.skillId === "jacobian-singularity" &&
          event.stage === "observed" &&
          event.result === "success" &&
          event.metrics?.singular === true &&
          typeof event.metrics?.manipulability === "number" &&
          event.metrics.manipulability < 0.001,
        ) &&
        hasSuccessfulAssessment(events, "jacobian-singularity"),
      metrics: { singularityObserved: true },
    }),
  },
  {
    id: "python-command-trace-v1",
    lessonId: "d-lise-python-komut-dizisi",
    skillId: "python-command-trace",
    evaluate: (events) => {
      const successfulRun = events.find((event) =>
        event.skillId === "python-command-trace" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 2,
      );
      return { passed: Boolean(successfulRun), metrics: { requiredTraceSteps: 2 } };
    },
  },
  {
    id: "movej-degiskenlerle-hareket-v1",
    lessonId: "d-lise-degiskenlerle-hareket",
    skillId: "movej-degiskenlerle-hareket",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "movej-degiskenlerle-hareket" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Kod Akademisi, Temel aşama dikey dilimi (bkz. docs/durum-codex.md
    // "Kod Akademisi — mimari teklif"). Aynı desen: CodeRunner'ın kendi
    // evaluateCodeLab/poseMatches mekanizması, yeni motor kodu yok.
    id: "koda-temel-degisken-degistir-v1",
    lessonId: "koda-temel-degisken-degistir",
    skillId: "koda-temel-degisken-degistir",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-temel-degisken-degistir" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "koda-temel-parametre-gonder-v1",
    lessonId: "koda-temel-parametre-gonder",
    skillId: "koda-temel-parametre-gonder",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-temel-parametre-gonder" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Açıkla-sonra-uygula (docs/15 "Ek alıştırma türleri" 2026-08 kararı):
    // editör boş açılır, öğrenci sıfırdan yazar. Aynı desen — poseMatches.
    id: "koda-temel-acikla-sonra-uygula-v1",
    lessonId: "koda-temel-acikla-sonra-uygula",
    skillId: "koda-temel-acikla-sonra-uygula",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-temel-acikla-sonra-uygula" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Hata avcılığı (docs/15 aynı karar): başlangıç kodu bilerek bozuk,
    // birden fazla doğru düzeltme olabilir — bu yüzden davranışsal
    // (poseMatches), string eşleşmesi DEĞİL.
    id: "koda-orta-hata-avcisi-v1",
    lessonId: "koda-orta-hata-avcisi",
    skillId: "koda-orta-hata-avcisi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-hata-avcisi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Orta müfredat planı (docs/15 "Müfredat planı — Orta/İleri/Usta").
    // movel-donguyle-rota-v1'le aynı desen: poseMatches YETMEZ, döngünün
    // gerçekten üç kere çalıştığını (traceSteps >= 3) da ister — aksi halde
    // öğrenci pass'ı silip tek bir movej([90, -60]) yazarak da geçebilirdi.
    id: "koda-orta-donguyle-uc-nokta-v1",
    lessonId: "koda-orta-donguyle-uc-nokta",
    skillId: "koda-orta-donguyle-uc-nokta",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-donguyle-uc-nokta" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 3,
      ),
      metrics: { requiredTraceSteps: 3 },
    }),
  },
  {
    id: "koda-orta-liste-ile-aci-dizisi-v1",
    lessonId: "koda-orta-liste-ile-aci-dizisi",
    skillId: "koda-orta-liste-ile-aci-dizisi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-liste-ile-aci-dizisi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "koda-orta-kosul-ile-dal-v1",
    lessonId: "koda-orta-kosul-ile-dal",
    skillId: "koda-orta-kosul-ile-dal",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-kosul-ile-dal" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Açıkla-sonra-uygula: editör boş, öğrenci liste + döngüyü sıfırdan
    // yazar. koda-orta-donguyle-uc-nokta-v1 ile aynı desen — traceSteps >= 4
    // döngünün gerçekten dört kez çalıştığını ister, tek movej yetmez.
    id: "koda-orta-donguyle-liste-birlikte-v1",
    lessonId: "koda-orta-donguyle-liste-birlikte",
    skillId: "koda-orta-donguyle-liste-birlikte",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-donguyle-liste-birlikte" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 4,
      ),
      metrics: { requiredTraceSteps: 4 },
    }),
  },
  {
    id: "koda-orta-degisken-golgeleme-v1",
    lessonId: "koda-orta-degisken-golgeleme",
    skillId: "koda-orta-degisken-golgeleme",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-degisken-golgeleme" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // İleri müfredat planı (docs/15 "Müfredat planı — Orta/İleri/Usta").
    id: "koda-ileri-fonksiyon-tanimla-v1",
    lessonId: "koda-ileri-fonksiyon-tanimla",
    skillId: "koda-ileri-fonksiyon-tanimla",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-fonksiyon-tanimla" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Fonksiyon + döngü birlikte: traceSteps>=3 fonksiyonun listenin
    // TAMAMINI gezdiğini ister (koda-orta-donguyle-uc-nokta-v1 ile aynı desen).
    id: "koda-ileri-fonksiyonla-liste-v1",
    lessonId: "koda-ileri-fonksiyonla-liste",
    skillId: "koda-ileri-fonksiyonla-liste",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-fonksiyonla-liste" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 3,
      ),
      metrics: { requiredTraceSteps: 3 },
    }),
  },
  {
    id: "koda-ileri-kosullu-fonksiyon-v1",
    lessonId: "koda-ileri-kosullu-fonksiyon",
    skillId: "koda-ileri-kosullu-fonksiyon",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-kosullu-fonksiyon" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "koda-ileri-hata-avcisi-v1",
    lessonId: "koda-ileri-hata-avcisi",
    skillId: "koda-ileri-hata-avcisi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-hata-avcisi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // Usta müfredat planı (docs/15 "Müfredat planı — Orta/İleri/Usta"),
    // docs/01-mufredat.md'deki örnek görevle aynı: "üç noktayı sırayla
    // ziyaret eden bir hareket yaz". Editör tamamen boş — Yaz tipi.
    id: "koda-usta-uc-nokta-sirayla-v1",
    lessonId: "koda-usta-uc-nokta-sirayla",
    skillId: "koda-usta-uc-nokta-sirayla",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-usta-uc-nokta-sirayla" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 3,
      ),
      metrics: { requiredTraceSteps: 3 },
    }),
  },
  {
    // Üç kavram birlikte (fonksiyon + döngü + koşul). traceSteps>=2 iki
    // güvenli adaya da UĞRANDIĞINI ister — doğrudan son adaya atlamak
    // yetmez, koşulun listenin TAMAMINI süzdüğü kanıtlanmalı.
    id: "koda-usta-kosullu-hareket-v1",
    lessonId: "koda-usta-kosullu-hareket",
    skillId: "koda-usta-kosullu-hareket",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-usta-kosullu-hareket" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 2,
      ),
      metrics: { requiredTraceSteps: 2 },
    }),
  },
  {
    // Kapanış modülü: iki bağımsız hata (eksik parametre + yanlış liste
    // index'i). traceSteps>=4 ısınma hareketi + üç nokta gerçekten
    // gerçekleştiğini ister.
    id: "koda-usta-hata-avcisi-final-v1",
    lessonId: "koda-usta-hata-avcisi-final",
    skillId: "koda-usta-hata-avcisi-final",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-usta-hata-avcisi-final" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 4,
      ),
      metrics: { requiredTraceSteps: 4 },
    }),
  },
  {
    // İkinci derinlik turu (docs/15 "Teşhis modu"): modül önce bir günlük/
    // çalışma izi anomalisi gösterir, öğrenci nedeni Quiz'le tahmin eder,
    // SONRA kodu görüp düzeltir. Predicate mekanizması hata avcılığı
    // modülleriyle birebir aynı (poseMatches) — yeni olan sadece anlatı
    // sırası, davranışsal doğrulama değil.
    id: "koda-orta-teshis-modu-v1",
    lessonId: "koda-orta-teshis-modu",
    skillId: "koda-orta-teshis-modu",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-teshis-modu" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "koda-ileri-teshis-modu-v1",
    lessonId: "koda-ileri-teshis-modu",
    skillId: "koda-ileri-teshis-modu",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-teshis-modu" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    // İkinci derinlik turu (docs/15 "Kod incelemesi"): doğru poza ulaşmak
    // YETMEZ, çözüm de sadeleştirilmiş olmalı — en fazla tek robot.movej()
    // çağrısı (traceSteps <= 1). Var olan traceSteps>=N (alt sınır) deseninin
    // TERSİ — aynı mekanizmanın (poseMatches + traceSteps) genişlemesi.
    id: "koda-orta-kod-incelemesi-v1",
    lessonId: "koda-orta-kod-incelemesi",
    skillId: "koda-orta-kod-incelemesi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-orta-kod-incelemesi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps <= 1,
      ),
      metrics: { maxTraceSteps: 1 },
    }),
  },
  {
    id: "koda-ileri-kod-incelemesi-v1",
    lessonId: "koda-ileri-kod-incelemesi",
    skillId: "koda-ileri-kod-incelemesi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "koda-ileri-kod-incelemesi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "movel-donguyle-rota-v1",
    lessonId: "d-lise-donguyle-cok-nokta",
    skillId: "movel-donguyle-rota",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "movel-donguyle-rota" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true &&
        typeof event.metrics?.traceSteps === "number" &&
        event.metrics.traceSteps >= 3,
      ),
      metrics: { requiredTraceSteps: 3 },
    }),
  },
  {
    id: "kosullu-tcp-kontrolu-v1",
    lessonId: "d-lise-kosullu-robot-durumu",
    skillId: "kosullu-tcp-kontrolu",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "kosullu-tcp-kontrolu" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.outputMatches === true,
      ),
      metrics: { requiresOutputMatch: true },
    }),
  },
  {
    id: "fonksiyonla-hareket-dizisi-v1",
    lessonId: "d-lise-fonksiyonla-hareket-dizisi",
    skillId: "fonksiyonla-hareket-dizisi",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "fonksiyonla-hareket-dizisi" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresMovejPoseMatch: true },
    }),
  },
  {
    id: "python-fk-ik-round-trip-v1",
    lessonId: "d-universite-python-fk-ik",
    skillId: "python-fk-ik-round-trip",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "python-fk-ik-round-trip" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.poseMatches === true,
      ),
      metrics: { requiresRoundTripPoseMatch: true },
    }),
  },
  {
    id: "handshake-signal-order-v1",
    lessonId: "e-lise-el-sikisma",
    skillId: "handshake-order",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "handshake-order" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.complete === true &&
        event.metrics?.correctOrder === true &&
        typeof event.metrics?.requestStep === "number" &&
        typeof event.metrics?.acknowledgementStep === "number" &&
        event.metrics.requestStep < event.metrics.acknowledgementStep,
      ),
      metrics: { requiresRequestBeforeAcknowledgement: true },
    }),
  },
  {
    id: "safety-braking-distance-v1",
    lessonId: "h-universite-guvenli-durus-hiz-ve-mesafe",
    skillId: "safety-braking-distance",
    evaluate: (events) => {
      const measurements = events.filter((event) =>
        event.skillId === "safety-braking-distance" &&
        event.stage === "observed" &&
        event.result === "success" &&
        event.metrics?.atSpeedLimitBoundary === true &&
        typeof event.metrics?.robotSpeed === "number" &&
        typeof event.metrics?.brakingTime === "number" &&
        typeof event.metrics?.requiredSeparation === "number",
      );
      const comparisonFound = measurements.some((first) => measurements.some((second) =>
        first !== second &&
        first.metrics!.robotSpeed === second.metrics!.robotSpeed &&
        (first.metrics!.brakingTime as number) < (second.metrics!.brakingTime as number) &&
        (first.metrics!.requiredSeparation as number) < (second.metrics!.requiredSeparation as number),
      ));
      return { passed: comparisonFound, metrics: { requiredBoundaryMeasurements: 2 } };
    },
  },
  {
    id: "camera-distortion-comparison-v1",
    lessonId: "f-lise-olcek-perspektif-hatasi",
    skillId: "camera-distortion-comparison",
    evaluate: (events) => {
      const observations = events.filter((event) =>
        event.skillId === "camera-distortion-comparison" &&
        event.stage === "observed" &&
        event.result === "success" &&
        typeof event.metrics?.cell === "string" &&
        typeof event.metrics?.distortion === "boolean" &&
        typeof event.metrics?.worldX === "number" &&
        typeof event.metrics?.worldY === "number" &&
        typeof event.metrics?.distanceFromCenter === "number" &&
        event.metrics.distanceFromCenter >= 3,
      );
      const comparisonFound = observations.some((plain) => observations.some((distorted) =>
        plain !== distorted &&
        plain.metrics!.cell === distorted.metrics!.cell &&
        plain.metrics!.distortion === false &&
        distorted.metrics!.distortion === true &&
        (
          plain.metrics!.worldX !== distorted.metrics!.worldX ||
          plain.metrics!.worldY !== distorted.metrics!.worldY
        ),
      ));
      return { passed: comparisonFound, metrics: { requiredSameCellStates: 2 } };
    },
  },
  {
    id: "scan-row-density-comparison-v1",
    lessonId: "f-universite-tarama-yolu-uretimi",
    skillId: "scan-row-density",
    evaluate: (events) => {
      const completed = events.filter((event) =>
        event.skillId === "scan-row-density" &&
        event.stage === "observed" &&
        event.result === "success" &&
        event.metrics?.directionAlternates === true &&
        typeof event.metrics?.rows === "number" &&
        Number.isSafeInteger(event.metrics.rows) &&
        typeof event.metrics?.pointCount === "number" &&
        event.metrics.pointCount === event.metrics.rows * 12,
      );
      const comparisonFound = completed.some((fewer) => completed.some((more) =>
        fewer !== more &&
        (fewer.metrics!.rows as number) < (more.metrics!.rows as number) &&
        (fewer.metrics!.pointCount as number) < (more.metrics!.pointCount as number),
      ));
      return { passed: comparisonFound, metrics: { requiredCompletedScans: 2 } };
    },
  },
  {
    id: "block-sequence-trace-v1",
    lessonId: "d-ortaokul-blok-komutlar",
    skillId: "block-sequence",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "block-sequence" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.withinLimits === true &&
        typeof event.metrics?.moveBlockCount === "number" &&
        event.metrics.moveBlockCount >= 2 &&
        typeof event.metrics?.distinctTraceSteps === "number" &&
        event.metrics.distinctTraceSteps >= 2,
      ),
      metrics: { requiredDistinctTraceSteps: 2 },
    }),
  },
  {
    id: "block-condition-branches-v1",
    lessonId: "d-ortaokul-sirali-tekrar-kosul",
    skillId: "block-condition",
    evaluate: (events) => ({
      passed: events.some((event) =>
        event.skillId === "block-condition" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.withinLimits === true &&
        event.metrics?.trueBranch === true &&
        event.metrics?.falseBranch === true &&
        event.metrics?.distinctBranchOutcomes === true,
      ),
      metrics: { requiredDistinctBranches: 2 },
    }),
  },
  {
    id: "threshold-three-regimes-v1",
    lessonId: "f-lise-esikleme-nesne-bulma",
    skillId: "threshold-regimes",
    evaluate: (events) => {
      const observations = events.filter((event) =>
        event.skillId === "threshold-regimes" &&
        event.stage === "observed" &&
        event.result === "success" &&
        typeof event.metrics?.falsePositiveCount === "number" &&
        typeof event.metrics?.falseNegativeCount === "number" &&
        typeof event.metrics?.detectedCount === "number" &&
        typeof event.metrics?.objectCellCount === "number",
      );
      const hasTooLow = observations.some((event) =>
        event.metrics!.regime === "too-low" &&
        (event.metrics!.falsePositiveCount as number) > 0 &&
        event.metrics!.falseNegativeCount === 0,
      );
      const hasSeparating = observations.some((event) =>
        event.metrics!.regime === "separating" &&
        event.metrics!.falsePositiveCount === 0 &&
        event.metrics!.falseNegativeCount === 0 &&
        event.metrics!.detectedCount === event.metrics!.objectCellCount,
      );
      const hasTooHigh = observations.some((event) =>
        event.metrics!.regime === "too-high" &&
        (event.metrics!.falseNegativeCount as number) > 0 &&
        event.metrics!.falsePositiveCount === 0,
      );
      return {
        passed: hasTooLow && hasSeparating && hasTooHigh,
        metrics: { requiredRegimes: 3 },
      };
    },
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
    // v1 → v2: eski predicate yalnız iki order etiketinin varlığına bakıyordu;
    // yanlış tahminlerin ürettiği retry olayları ve sayısal olarak aynı sonuçlar
    // da karşılaştırma sayılabiliyordu. Artık aynı açıdaki iki gerçek başarılı
    // ölçümün çıktı koordinatları ve raporlanan ayrımı birbiriyle uyuşmalı.
    id: "transform-order-comparison-v2",
    lessonId: "a-universite-homojen-donusum",
    skillId: "transform-order",
    evaluate: (events) => {
      const observations = events.filter((event) =>
        event.skillId === "transform-order" &&
        event.stage === "observed" &&
        event.result === "success" &&
        event.metrics?.correctPrediction === true &&
        (event.metrics?.order === "translation-then-rotation" || event.metrics?.order === "rotation-then-translation") &&
        typeof event.metrics?.angleDegrees === "number" &&
        typeof event.metrics?.outputX === "number" &&
        typeof event.metrics?.outputY === "number" &&
        typeof event.metrics?.comparisonDistance === "number" &&
        event.metrics.comparisonDistance > 0.01,
      );
      const compared = observations.some((first) => observations.some((second) => {
        if (
          first === second ||
          first.metrics!.order === second.metrics!.order ||
          first.metrics!.angleDegrees !== second.metrics!.angleDegrees
        ) return false;
        const measuredDistance = Math.hypot(
          (first.metrics!.outputX as number) - (second.metrics!.outputX as number),
          (first.metrics!.outputY as number) - (second.metrics!.outputY as number),
        );
        return measuredDistance > 0.01 &&
          Math.abs((first.metrics!.comparisonDistance as number) - measuredDistance) < 0.005 &&
          Math.abs((second.metrics!.comparisonDistance as number) - measuredDistance) < 0.005;
      }));
      return {
        passed: compared && hasSuccessfulAssessment(events, "transform-order"),
        metrics: { comparedOrders: compared ? 2 : 0 },
      };
    },
  },
  {
    // v1 → v2: eski predicate yalnız iki elle yazılan bant etiketini sayıyordu;
    // farklı hedefler, damping ile uyuşmayan etiketler veya converged/result
    // çelişkisi de karşılaştırma sayılabiliyordu. Yakınsamayan tamamlanmış koşu
    // hâlâ geçerli gözlemdir, fakat sayısal iz ve retry sonucu tutarlı olmalıdır.
    id: "dls-damping-comparison-v2",
    lessonId: "b-universite-ters-kinematik",
    skillId: "dls-convergence",
    evaluate: (events) => {
      const completed = events.filter((event) => {
        const metrics = event.metrics;
        if (
          event.skillId !== "dls-convergence" || event.stage !== "observed" || !metrics ||
          typeof metrics.damping !== "number" ||
          typeof metrics.targetX !== "number" || typeof metrics.targetY !== "number" ||
          typeof metrics.converged !== "boolean" ||
          typeof metrics.iterations !== "number" || !Number.isSafeInteger(metrics.iterations) ||
          typeof metrics.traceLength !== "number" || !Number.isSafeInteger(metrics.traceLength) ||
          typeof metrics.initialError !== "number" || metrics.initialError < 0 ||
          typeof metrics.finalError !== "number" || metrics.finalError < 0
        ) return false;
        const expectedBand = metrics.damping <= 0.02 ? "dusuk" : metrics.damping >= 0.08 ? "sonumlu" : "orta";
        const expectedResult = metrics.converged ? "success" : "retry";
        const expectedTraceLength = metrics.converged ? metrics.iterations + 1 : metrics.iterations;
        return metrics.dampingBand === expectedBand &&
          event.result === expectedResult &&
          metrics.iterations >= 0 && metrics.iterations <= 80 &&
          metrics.traceLength === expectedTraceLength && metrics.traceLength > 0;
      });
      const compared = completed.some((low) => completed.some((damped) =>
        low !== damped &&
        low.metrics!.dampingBand === "dusuk" &&
        damped.metrics!.dampingBand === "sonumlu" &&
        low.metrics!.targetX === damped.metrics!.targetX &&
        low.metrics!.targetY === damped.metrics!.targetY,
      ));
      return {
        passed: compared && hasSuccessfulAssessment(events, "dls-convergence"),
        metrics: { comparedDampingBands: compared ? 2 : 0 },
      };
    },
  },
  {
    // v1 → v2: eski predicate yalnız iki configuration etiketini sayıyordu;
    // result, motorun collides sınıfı, açı ızgarası, robot ve sabit engel imzası
    // doğrulanmıyordu. Artık iki sınıf da aynı fiziksel deney sözleşmesine bağlı.
    id: "configuration-space-boundary-v2",
    lessonId: "c-universite-c-space",
    skillId: "configuration-space",
    evaluate: (events) => {
      const observations = events.filter((event) => {
        const metrics = event.metrics;
        if (
          event.skillId !== "configuration-space" || event.stage !== "observed" || event.result !== "success" || !metrics ||
          (metrics.configuration !== "safe" && metrics.configuration !== "collision") ||
          typeof metrics.collides !== "boolean" ||
          typeof metrics.q1 !== "number" || !Number.isSafeInteger(metrics.q1) ||
          typeof metrics.q2 !== "number" || !Number.isSafeInteger(metrics.q2)
        ) return false;
        return metrics.configuration === (metrics.collides ? "collision" : "safe") &&
          metrics.q1 >= -180 && metrics.q1 <= 180 && metrics.q1 % 5 === 0 &&
          metrics.q2 >= -180 && metrics.q2 <= 180 && metrics.q2 % 5 === 0 &&
          metrics.robotId === "generic-2dof" &&
          metrics.obstacleX === 0.72 && metrics.obstacleY === 0.28 && metrics.obstacleRadius === 0.24;
      });
      const compared = observations.some((safe) => observations.some((collision) =>
        safe !== collision &&
        safe.metrics!.configuration === "safe" &&
        collision.metrics!.configuration === "collision" &&
        (safe.metrics!.q1 !== collision.metrics!.q1 || safe.metrics!.q2 !== collision.metrics!.q2),
      ));
      return {
        passed: compared && hasSuccessfulAssessment(events, "configuration-space"),
        metrics: { observedConfigurationClasses: compared ? 2 : 0 },
      };
    },
  },
  {
    // v1 → v2: aynı görev/adayın retry gözlemi de assessment ile eşleşebiliyor,
    // seçilen ölçütlerin ayrı ve gerçekten uygun havuzdan geldiği doğrulanmıyordu.
    // Artık gözlem ve karar aynı status'ta, sıfır hard-fail ile eşleşmelidir.
    id: "robot-selection-four-criteria-v2",
    lessonId: "a-universite-robot-mimarileri",
    skillId: "robot-selection",
    evaluate: (events) => {
      const successfulDecision = events.find((event) =>
        event.skillId === "robot-selection" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        (event.metrics?.decisionStatus === "fit" || event.metrics?.decisionStatus === "review") &&
        event.metrics?.failedConstraints === 0 &&
        event.metrics?.distinctCriteria === true &&
        typeof event.metrics?.numericCriteria === "number" && Number.isSafeInteger(event.metrics.numericCriteria) && event.metrics.numericCriteria >= 4 &&
        typeof event.metrics?.eligibleNumericCriteria === "number" && Number.isSafeInteger(event.metrics.eligibleNumericCriteria) &&
        event.metrics.numericCriteria <= event.metrics.eligibleNumericCriteria &&
        typeof event.metrics?.rationaleLength === "number" && event.metrics.rationaleLength >= 40 &&
        event.metrics.rationaleLength <= 4_000,
      );
      const observedSameCandidate = Boolean(successfulDecision && events.some((event) =>
        event.skillId === "robot-selection" &&
        event.stage === "observed" &&
        event.result === "neutral" &&
        event.metrics?.taskId === successfulDecision.metrics?.taskId &&
        event.metrics?.candidateId === successfulDecision.metrics?.candidateId &&
        event.metrics?.decisionStatus === successfulDecision.metrics?.decisionStatus &&
        event.metrics?.failedConstraints === 0,
      ));
      return {
        passed: Boolean(successfulDecision && observedSameCandidate),
        metrics: { requiredNumericCriteria: 4, requiredRationaleLength: 40 },
      };
    },
  },
  {
    // v2: v1 yalnız örnek 0 ve 3'ü görmeyi yeterli sayıyordu; ara örnekleri,
    // sahne-matris eşitliğini ve ölçülen son yönü doğrulamıyordu.
    id: "four-lens-fk-trace-v2",
    lessonId: "b-lise-ileri-kinematik",
    skillId: "four-lens-forward-kinematics",
    evaluate: (events) => {
      const expectedTrace = createFourLensTrace();
      const samples = new Set<number>();
      for (const event of events) {
        if (event.skillId !== "four-lens-forward-kinematics" || event.stage !== "observed" || event.result !== "neutral") continue;
        const sampleIndex = event.metrics?.sampleIndex;
        if (typeof sampleIndex !== "number" || !Number.isSafeInteger(sampleIndex) || sampleIndex < 0 || sampleIndex > 3) continue;
        const expected = expectedTrace[sampleIndex];
        const endX = event.metrics?.endX;
        const endY = event.metrics?.endY;
        const matrixX = event.metrics?.matrixX;
        const matrixY = event.metrics?.matrixY;
        if (
          event.metrics?.codeLine === sampleIndex + 1 &&
          event.metrics?.q1 === expected.jointDegrees[0] &&
          event.metrics?.q2 === expected.jointDegrees[1] &&
          typeof endX === "number" && Number.isFinite(endX) &&
          typeof endY === "number" && Number.isFinite(endY) &&
          typeof matrixX === "number" && Number.isFinite(matrixX) &&
          typeof matrixY === "number" && Number.isFinite(matrixY) &&
          Math.abs(endX - matrixX) < 0.001 &&
          Math.abs(endY - matrixY) < 0.001 &&
          Math.abs(endX - expected.end.x) < 0.001 &&
          Math.abs(endY - expected.end.y) < 0.001
        ) samples.add(sampleIndex);
      }
      const assessedFinal = events.some((event) =>
        event.skillId === "four-lens-forward-kinematics" &&
        event.stage === "assessed" &&
        event.result === "success" &&
        event.metrics?.prediction === "decrease" &&
        event.metrics?.actual === "decrease" &&
        event.metrics?.directionMatches === true &&
        event.metrics?.finalSample === 3 &&
        typeof event.metrics?.previousX === "number" &&
        typeof event.metrics?.finalX === "number" &&
        event.metrics.finalX < event.metrics.previousX,
      );
      return {
        passed: [0, 1, 2, 3].every((sampleIndex) => samples.has(sampleIndex)) && assessedFinal,
        metrics: { observedSamples: samples.size, requiredSamples: 4, requiredFinalSample: 3 },
      };
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
