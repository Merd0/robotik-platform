export type RobotFamily = "articulated" | "scara" | "collaborative" | "agv" | "amr";
export type ApplicationKind = "stationary-manipulation" | "intralogistics";
export type ConstraintStatus = "pass" | "fail" | "review";

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
  documentNo: string;
  revision: string;
  location: string;
  accessedAt: string;
}

export interface SourcedMetric {
  value: number;
  unit: string;
  label: string;
  sourceId: string;
  /** Vendor test conditions are not assumed to be interchangeable. */
  comparisonNeedsSiteValidation?: boolean;
}

export interface RobotCandidate {
  id: string;
  model: string;
  family: RobotFamily;
  application: ApplicationKind;
  facts: {
    payloadKg: SourcedMetric;
    reachMm?: SourcedMetric;
    repeatabilityMm?: SourcedMetric;
    cycleTimeSeconds?: SourcedMetric;
    dof?: SourcedMetric;
    maxSpeedMps?: SourcedMetric;
    bodyWidthMm?: SourcedMetric;
    positioningMm?: SourcedMetric;
  };
  collaborationFeatures?: boolean;
  navigation?: "fixed-guidance" | "adaptive";
  sourceIds: string[];
}

export interface TaskSpec {
  id: "electronics" | "shared-assembly" | "intralogistics";
  title: string;
  brief: string;
  application: ApplicationKind;
  candidateIds: string[];
  requirements: {
    minPayloadKg: number;
    minReachMm?: number;
    maxRepeatabilityMm?: number;
    minDof?: number;
    minSpeedMps?: number;
    maxBodyWidthMm?: number;
    maxPositioningMm?: number;
    sharedWorkspace?: boolean;
    layoutChangesOften?: boolean;
  };
}

export interface ConstraintResult {
  key: string;
  label: string;
  status: ConstraintStatus;
  measured: string;
  required: string;
  explanation: string;
  sourceId?: string;
  quantitative: boolean;
}

export interface CandidateEvaluation {
  candidate: RobotCandidate;
  constraints: ConstraintResult[];
  status: "fit" | "review" | "fail";
}

export const ROBOT_SOURCES: Record<string, SourceRef> = {
  "epson-gx4-page": {
    id: "epson-gx4-page",
    title: "GX4 SCARA Robot — 350 mm",
    publisher: "Epson",
    url: "https://epson.com/For-Work/Robots/SCARA/GX4-SCARA-Robot---350mm/p/RGX4-A351SSTSD",
    documentNo: "RGX4-A351SSTSD product page",
    revision: "live product page",
    location: "Core Specifications",
    accessedAt: "2026-08-09",
  },
  "epson-catalog-r4": {
    id: "epson-catalog-r4",
    title: "Robot Specifications Catalog",
    publisher: "Epson",
    url: "https://files.support.epson.com/far/docs/epson_robot_specification_catalog_cpd-54833r4.pdf",
    documentNo: "CPD-54833R4",
    revision: "R4",
    location: "GX series specification table",
    accessedAt: "2026-08-09",
  },
  "abb-irb1100-spec": {
    id: "abb-irb1100-spec",
    title: "Product specification — IRB 1100",
    publisher: "ABB",
    url: "https://library.e.abb.com/public/6bf82ab9fa474c1a827cf216ddc254a3/3HAC064993%20PS%20IRB%201100-en.pdf",
    documentNo: "3HAC064993-001",
    revision: "A",
    location: "p. 43, ISO 9283 performance table",
    accessedAt: "2026-08-09",
  },
  "ur10e-manual": {
    id: "ur10e-manual",
    title: "UR10e User Manual",
    publisher: "Universal Robots",
    url: "https://www.universal-robots.com/manuals/EN/PDF/SW5_25/user-manual-UR10e-PDF_online/711-039-00_UR10e_User_Manual_en_Global.pdf",
    documentNo: "711-039-00",
    revision: "SW 5.25",
    location: "p. 18, technical specifications",
    accessedAt: "2026-08-09",
  },
  "abb-gofa-datasheet": {
    id: "abb-gofa-datasheet",
    title: "GoFa CRB 15000 datasheet",
    publisher: "ABB",
    url: "https://new.abb.com/docs/librariesprovider89/default-document-library/GoFa_crb15000-datasheet_digital_es",
    documentNo: "GoFa CRB 15000 digital datasheet",
    revision: "live document snapshot",
    location: "Specifications table",
    accessedAt: "2026-08-09",
  },
  "mir250-specs": {
    id: "mir250-specs",
    title: "MiR250 specifications",
    publisher: "Mobile Industrial Robots",
    url: "https://mobile-industrial-robots.com/products/robots/mir250/specifications",
    documentNo: "MiR250 web specification",
    revision: "live product page",
    location: "Payload, dimensions, speed and positioning",
    accessedAt: "2026-08-09",
  },
  "kivnon-k05": {
    id: "kivnon-k05",
    title: "K05 Twister technical specifications",
    publisher: "Kivnon",
    url: "https://www.kivnon.com/en-uk/k05-model/",
    documentNo: "K05 product page",
    revision: "live product page",
    location: "Technical Specifications",
    accessedAt: "2026-08-09",
  },
};

const metric = (value: number, unit: string, label: string, sourceId: string, comparisonNeedsSiteValidation = false): SourcedMetric => ({
  value,
  unit,
  label,
  sourceId,
  comparisonNeedsSiteValidation,
});

export const ROBOT_CANDIDATES: RobotCandidate[] = [
  {
    id: "epson-gx4-350",
    model: "Epson GX4-A351",
    family: "scara",
    application: "stationary-manipulation",
    facts: {
      payloadKg: metric(4, "kg", "Azami payload", "epson-gx4-page"),
      reachMm: metric(350, "mm", "Erişim", "epson-gx4-page"),
      repeatabilityMm: metric(0.01, "mm", "J1+J2 repeatability (±)", "epson-gx4-page"),
      cycleTimeSeconds: metric(0.35, "s", "Standart çevrim", "epson-gx4-page", true),
      dof: metric(4, "eksen", "Eksen sayısı", "epson-catalog-r4"),
    },
    sourceIds: ["epson-gx4-page", "epson-catalog-r4"],
  },
  {
    id: "epson-gx8-450",
    model: "Epson GX8-A451",
    family: "scara",
    application: "stationary-manipulation",
    facts: {
      payloadKg: metric(8, "kg", "Azami payload", "epson-catalog-r4"),
      reachMm: metric(450, "mm", "Erişim", "epson-catalog-r4"),
      repeatabilityMm: metric(0.015, "mm", "J1+J2 repeatability (±)", "epson-catalog-r4"),
      cycleTimeSeconds: metric(0.28, "s", "Standart çevrim", "epson-catalog-r4", true),
      dof: metric(4, "eksen", "Eksen sayısı", "epson-catalog-r4"),
    },
    sourceIds: ["epson-catalog-r4"],
  },
  {
    id: "abb-irb1100",
    model: "ABB IRB 1100-4/0.58",
    family: "articulated",
    application: "stationary-manipulation",
    facts: {
      payloadKg: metric(4, "kg", "Payload", "abb-irb1100-spec"),
      reachMm: metric(580, "mm", "Erişim", "abb-irb1100-spec"),
      repeatabilityMm: metric(0.01, "mm", "Poz repeatability (±)", "abb-irb1100-spec", true),
      dof: metric(6, "eksen", "Eksen sayısı", "abb-irb1100-spec"),
    },
    sourceIds: ["abb-irb1100-spec"],
  },
  {
    id: "ur10e",
    model: "Universal Robots UR10e",
    family: "collaborative",
    application: "stationary-manipulation",
    facts: {
      payloadKg: metric(12.5, "kg", "Azami payload", "ur10e-manual"),
      reachMm: metric(1300, "mm", "Erişim", "ur10e-manual"),
      repeatabilityMm: metric(0.05, "mm", "Poz repeatability (±)", "ur10e-manual", true),
      dof: metric(6, "eksen", "Eksen sayısı", "ur10e-manual"),
    },
    collaborationFeatures: true,
    sourceIds: ["ur10e-manual"],
  },
  {
    id: "abb-gofa",
    model: "ABB GoFa CRB 15000",
    family: "collaborative",
    application: "stationary-manipulation",
    facts: {
      payloadKg: metric(5, "kg", "Payload", "abb-gofa-datasheet"),
      reachMm: metric(950, "mm", "Erişim", "abb-gofa-datasheet"),
      repeatabilityMm: metric(0.05, "mm", "Poz repeatability (±)", "abb-gofa-datasheet", true),
      dof: metric(6, "eksen", "Eksen sayısı", "abb-gofa-datasheet"),
    },
    collaborationFeatures: true,
    sourceIds: ["abb-gofa-datasheet"],
  },
  {
    id: "mir250",
    model: "MiR250",
    family: "amr",
    application: "intralogistics",
    facts: {
      payloadKg: metric(250, "kg", "Azami payload", "mir250-specs"),
      maxSpeedMps: metric(2, "m/s", "Azami hız", "mir250-specs", true),
      bodyWidthMm: metric(580, "mm", "Gövde genişliği", "mir250-specs"),
      positioningMm: metric(3, "mm", "VL işaretine yanaşma (±X/Y)", "mir250-specs", true),
    },
    navigation: "adaptive",
    sourceIds: ["mir250-specs"],
  },
  {
    id: "kivnon-k05",
    model: "Kivnon K05 Twister",
    family: "agv",
    application: "intralogistics",
    facts: {
      payloadKg: metric(450, "kg", "Gövde üstü yük", "kivnon-k05"),
      maxSpeedMps: metric(0.7, "m/s", "Azami hız", "kivnon-k05", true),
      bodyWidthMm: metric(800, "mm", "Gövde genişliği", "kivnon-k05"),
      positioningMm: metric(10, "mm", "Duruş doğruluğu (±)", "kivnon-k05", true),
    },
    navigation: "fixed-guidance",
    sourceIds: ["kivnon-k05"],
  },
];

export const ROBOT_TASKS: TaskSpec[] = [
  {
    id: "electronics",
    title: "Hassas elektronik yerleştirme",
    brief: "3 kg toplam parça+gripper, 340 mm erişim ve ±0,05 mm veya daha iyi repeatability isteyen kapalı hücre.",
    application: "stationary-manipulation",
    candidateIds: ["epson-gx4-350", "epson-gx8-450", "abb-irb1100"],
    requirements: { minPayloadKg: 3, minReachMm: 340, maxRepeatabilityMm: 0.05, minDof: 4 },
  },
  {
    id: "shared-assembly",
    title: "İnsana yakın değişken montaj",
    brief: "4 kg toplam yük, 900 mm erişim ve altı eksen isteyen; insanla alan paylaşma ihtimali bulunan montaj istasyonu.",
    application: "stationary-manipulation",
    candidateIds: ["ur10e", "abb-gofa", "abb-irb1100"],
    requirements: { minPayloadKg: 4, minReachMm: 900, maxRepeatabilityMm: 0.1, minDof: 6, sharedWorkspace: true },
  },
  {
    id: "intralogistics",
    title: "Hat içi malzeme taşıma",
    brief: "200 kg yükü, 1.000 mm fiziksel geçiş açıklığından en az 0,6 m/s ile taşıyan ve yanaşmada ±10 mm hedefleyen iç mekân görevi.",
    application: "intralogistics",
    candidateIds: ["mir250", "kivnon-k05"],
    requirements: { minPayloadKg: 200, minSpeedMps: 0.6, maxBodyWidthMm: 1000, maxPositioningMm: 10, layoutChangesOften: false },
  },
];

function compareMinimum(key: string, label: string, metricValue: SourcedMetric | undefined, minimum: number): ConstraintResult {
  if (!metricValue) return { key, label, status: "review", measured: "Belirtilmemiş", required: `≥ ${minimum}`, explanation: "Eksik üretici verisi varsayımla tamamlanmadı.", quantitative: true };
  const meets = metricValue.value >= minimum;
  return {
    key,
    label,
    status: meets ? "pass" : "fail",
    measured: `${metricValue.value} ${metricValue.unit}`,
    required: `≥ ${minimum} ${metricValue.unit}`,
    explanation: meets ? "Sayısal alt sınırı karşılıyor." : `${minimum - metricValue.value} ${metricValue.unit} yetersiz.`,
    sourceId: metricValue.sourceId,
    quantitative: true,
  };
}

function compareMaximum(key: string, label: string, metricValue: SourcedMetric | undefined, maximum: number): ConstraintResult {
  if (!metricValue) return { key, label, status: "review", measured: "Belirtilmemiş", required: `≤ ${maximum}`, explanation: "Eksik üretici verisi varsayımla tamamlanmadı.", quantitative: true };
  const meets = metricValue.value <= maximum;
  const status = meets && metricValue.comparisonNeedsSiteValidation ? "review" : meets ? "pass" : "fail";
  return {
    key,
    label,
    status,
    measured: `${metricValue.value} ${metricValue.unit}`,
    required: `≤ ${maximum} ${metricValue.unit}`,
    explanation: !meets
      ? `${metricValue.value - maximum} ${metricValue.unit} sınırın üzerinde.`
      : metricValue.comparisonNeedsSiteValidation
        ? "Sayısal eşiği karşılıyor; üretici test koşulları farklı olabileceği için saha doğrulaması gerekir."
        : "Sayısal üst sınırı karşılıyor.",
    sourceId: metricValue.sourceId,
    quantitative: true,
  };
}

export function evaluateCandidate(task: TaskSpec, candidate: RobotCandidate): CandidateEvaluation {
  const constraints: ConstraintResult[] = [];
  constraints.push({
    key: "application",
    label: "Görev sınıfı",
    status: candidate.application === task.application ? "pass" : "fail",
    measured: candidate.application === "intralogistics" ? "Mobil intralojistik" : "Sabit manipülasyon",
    required: task.application === "intralogistics" ? "Mobil intralojistik" : "Sabit manipülasyon",
    explanation: candidate.application === task.application ? "Görev ailesiyle uyumlu." : "Bu robot ailesi görevin hareket yapısına uymuyor.",
    quantitative: false,
  });
  constraints.push(compareMinimum("payload", "Payload", candidate.facts.payloadKg, task.requirements.minPayloadKg));
  if (task.requirements.minReachMm !== undefined) constraints.push(compareMinimum("reach", "Erişim", candidate.facts.reachMm, task.requirements.minReachMm));
  if (task.requirements.maxRepeatabilityMm !== undefined) constraints.push(compareMaximum("repeatability", "Repeatability", candidate.facts.repeatabilityMm, task.requirements.maxRepeatabilityMm));
  if (task.requirements.minDof !== undefined) constraints.push(compareMinimum("dof", "Eksen/DOF", candidate.facts.dof, task.requirements.minDof));
  if (task.requirements.minSpeedMps !== undefined) constraints.push(compareMinimum("speed", "Azami hız", candidate.facts.maxSpeedMps, task.requirements.minSpeedMps));
  if (task.requirements.maxBodyWidthMm !== undefined) constraints.push(compareMaximum("width", "Gövde genişliği", candidate.facts.bodyWidthMm, task.requirements.maxBodyWidthMm));
  if (task.requirements.maxPositioningMm !== undefined) constraints.push(compareMaximum("positioning", "Yanaşma/duruş doğruluğu", candidate.facts.positioningMm, task.requirements.maxPositioningMm));

  if (task.requirements.sharedWorkspace) {
    constraints.push({
      key: "shared-workspace",
      label: "İnsanla alan paylaşımı",
      status: candidate.collaborationFeatures ? "review" : "fail",
      measured: candidate.collaborationFeatures ? "İşbirlikçi özellikler var" : "İşbirlikçi uygulama için tasarlanmamış",
      required: "Uygulamaya özel risk değerlendirmesi",
      explanation: candidate.collaborationFeatures
        ? "Cobot etiketi tek başına güvenli uygulama kanıtı değildir; uç ekipman, parça, hız ve temas senaryosu değerlendirilmelidir."
        : "İnsanla paylaşılan alan için bu seçim ek koruyucu önlemler olmadan savunulamaz.",
      quantitative: false,
    });
  }

  if (task.application === "intralogistics") {
    const dynamicRequired = task.requirements.layoutChangesOften === true;
    constraints.push({
      key: "navigation",
      label: "Rota altyapısı",
      status: dynamicRequired && candidate.navigation === "fixed-guidance" ? "fail" : "pass",
      measured: candidate.navigation === "adaptive" ? "Harita/algı tabanlı AMR" : "Manyetik kılavuz + RFID",
      required: dynamicRequired ? "Sık değişen yerleşime uyum" : "Sabit rota kabul edilebilir",
      explanation: dynamicRequired && candidate.navigation === "fixed-guidance"
        ? "Yerleşim değişince fiziksel kılavuz altyapısının da değiştirilmesi gerekir."
        : "Seçilen yerleşim varsayımıyla uyumlu.",
      quantitative: false,
    });
    constraints.push({
      key: "mobile-safety",
      label: "Mobil robot saha doğrulaması",
      status: "review",
      measured: "Ürün sayfası verisi",
      required: "Zemin, trafik, koruyucu alan ve devreye alma incelemesi",
      explanation: "Gövde genişliği güvenli koridor genişliği değildir; gerçek koruyucu alanlar ve trafik senaryosu sahada doğrulanmalıdır.",
      quantitative: false,
    });
  }

  const status = constraints.some((constraint) => constraint.status === "fail")
    ? "fail"
    : constraints.some((constraint) => constraint.status === "review") ? "review" : "fit";
  return { candidate, constraints, status };
}

export function evaluateTask(task: TaskSpec, candidates = ROBOT_CANDIDATES): CandidateEvaluation[] {
  return task.candidateIds
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is RobotCandidate => Boolean(candidate))
    .map((candidate) => evaluateCandidate(task, candidate))
    .sort((a, b) => ({ fit: 0, review: 1, fail: 2 })[a.status] - ({ fit: 0, review: 1, fail: 2 })[b.status]);
}

export function withLayoutChange(task: TaskSpec, layoutChangesOften: boolean): TaskSpec {
  return { ...task, requirements: { ...task.requirements, layoutChangesOften } };
}
