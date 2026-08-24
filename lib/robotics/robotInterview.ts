import { computeJacobian, isNearSingularity, type RobotSpec } from "./kinematics";
import { formatReachMm, planarRevoluteMaxReachM } from "./robotMetadataDisplay";

/**
 * "Robot Röportajı" laboratuvarının saf cevap motoru (docs/16-urun-
 * denetimi.md FAZ 5). Yeni bir hesap İCAT ETMEZ — sabit bir soru listesini,
 * var olan `RobotSpec`/`RobotMetadata`/Jacobian hesaplarını okuyarak
 * yanıtlar. Hiçbir cevap uydurma değildir: jenerik bir robota marka
 * atfetmez, genel bir DH zincirinde tek sayı erişim üretmez (aynı dürüstlük
 * ilkesi `RobotInfoLine.tsx`'te de var).
 */

export type RobotInterviewQuestionId =
  | "kimlik"
  | "eksen-sayisi"
  | "erisim"
  | "en-hizli-eklem"
  | "en-dar-limit"
  | "tekillik"
  | "kaynak";

export interface RobotInterviewQuestion {
  id: RobotInterviewQuestionId;
  soru: string;
}

export const ROBOT_INTERVIEW_QUESTIONS: readonly RobotInterviewQuestion[] = [
  { id: "kimlik", soru: "Sen kimsin?" },
  { id: "eksen-sayisi", soru: "Kaç eksenin var?" },
  { id: "erisim", soru: "Azami erişimin ne kadar?" },
  { id: "en-hizli-eklem", soru: "En hızlı eklemin hangisi?" },
  { id: "en-dar-limit", soru: "En dar hareket aralığına sahip eklemin hangisi?" },
  { id: "tekillik", soru: "Şu anki tipik duruşunda tekilliğe yakın mısın?" },
  { id: "kaynak", soru: "Bilgilerinin kaynağı ne?" },
];

const RAD_TO_DEG = 180 / Math.PI;
const toDegrees = (value: number) => value * RAD_TO_DEG;
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

/** ~4 tam tur (±720°) üzerindeki bir aralık, "eklem limiti" anlamında pratikte sınırsız sayılır. */
const CONTINUOUS_RANGE_THRESHOLD_RAD = 4 * Math.PI * 2;

function jointUnit(joint: RobotSpec["joints"][number]): string {
  return joint.type === "revolute" ? "°/s" : "m/s";
}

function jointVelocityDisplay(joint: RobotSpec["joints"][number]): string {
  return joint.type === "revolute"
    ? `${round(toDegrees(joint.maxVelocity), 1)} ${jointUnit(joint)}`
    : `${round(joint.maxVelocity, 3)} ${jointUnit(joint)}`;
}

function jointRange(joint: RobotSpec["joints"][number]): number {
  return joint.limits.max - joint.limits.min;
}

function answerKimlik(robot: RobotSpec): string {
  if (robot.metadata) {
    return `Ben bir ${robot.metadata.manufacturer} ${robot.metadata.model}.`;
  }
  return `Ben belirli bir üretici modeline karşılık gelmeyen, öğretim amaçlı jenerik bir robotum (${robot.displayName}).`;
}

function answerEksenSayisi(robot: RobotSpec): string {
  const revolute = robot.joints.filter((joint) => joint.type === "revolute").length;
  const prismatic = robot.joints.filter((joint) => joint.type === "prismatic").length;
  const parts = [
    revolute > 0 ? `${revolute} döner` : null,
    prismatic > 0 ? `${prismatic} doğrusal` : null,
  ].filter((part): part is string => part !== null);
  return `${robot.joints.length} eksenim var: ${parts.join(", ")}.`;
}

function answerErisim(robot: RobotSpec): string {
  if (robot.metadata?.maxReachMm !== undefined) {
    return `Üreticime göre azami erişimim ${formatReachMm(robot.metadata.maxReachMm)} (kaynak: ${robot.metadata.source.publisher ?? robot.metadata.source.title}).`;
  }
  const computed = planarRevoluteMaxReachM(robot);
  if (computed !== null) {
    return `Resmî bir üretici sayfam yok ama bağlantı uzunluklarımdan hesaplanan azami erişimim ${computed.toFixed(2)} m.`;
  }
  return "Zincirimde ofset veya büküm olduğu için azami erişimimi tek bir sayı olarak güvenilir söyleyemem — bu, gerçek geometriyi yanlış temsil eder.";
}

function answerEnHizliEklem(robot: RobotSpec): string {
  const fastestIndex = robot.joints.reduce(
    (best, joint, index) => (joint.maxVelocity > robot.joints[best].maxVelocity ? index : best),
    0,
  );
  const joint = robot.joints[fastestIndex];
  return `En hızlı eklemim ${fastestIndex + 1}. eklemim — azami ${jointVelocityDisplay(joint)} dönebilir/hareket edebilir.`;
}

function answerEnDarLimit(robot: RobotSpec): string {
  const boundedJoints = robot.joints
    .map((joint, index) => ({ joint, index, range: jointRange(joint) }))
    .filter((entry) => entry.range < CONTINUOUS_RANGE_THRESHOLD_RAD);
  if (boundedJoints.length === 0) {
    return "Bütün eklemlerim pratikte sürekli dönebiliyor — anlamlı bir 'en dar' karşılaştırması yok.";
  }
  const narrowest = boundedJoints.reduce((best, entry) => (entry.range < best.range ? entry : best));
  const rangeDisplay = narrowest.joint.type === "revolute"
    ? `${round(toDegrees(narrowest.range), 1)}°`
    : `${round(narrowest.range, 3)} m`;
  return `En dar hareket aralığı ${narrowest.index + 1}. eklemimde — toplam ${rangeDisplay} dönebiliyor/kayabiliyor.`;
}

function answerTekillik(robot: RobotSpec): string {
  const representativeAngles = robot.joints.map((joint) => {
    const range = jointRange(joint);
    if (range >= CONTINUOUS_RANGE_THRESHOLD_RAD) return 0;
    return (joint.limits.min + joint.limits.max) / 2;
  });
  const { manipulability } = computeJacobian(robot, representativeAngles);
  const near = isNearSingularity(manipulability);
  return near
    ? `Eklem aralıklarımın ortasındaki tipik duruşumda manipülabilitem ${manipulability.toExponential(2)} — bu bir tekilliğe yakın sayılır.`
    : `Eklem aralıklarımın ortasındaki tipik duruşumda manipülabilitem ${manipulability.toExponential(2)} — tekillikten uzağım.`;
}

function answerKaynak(robot: RobotSpec): string {
  if (robot.metadata) {
    const { source } = robot.metadata;
    return `Geometrim ve limitlerim ${source.publisher ?? "üreticimin"} yayınladığı "${source.title}" belgesinden geliyor.`;
  }
  return "Gerçek bir üretici kaynağım yok — jenerik, öğretim amaçlı bir tanımım; kimseye ait bir ürünü temsil etmiyorum.";
}

const ANSWERERS: Record<RobotInterviewQuestionId, (robot: RobotSpec) => string> = {
  kimlik: answerKimlik,
  "eksen-sayisi": answerEksenSayisi,
  erisim: answerErisim,
  "en-hizli-eklem": answerEnHizliEklem,
  "en-dar-limit": answerEnDarLimit,
  tekillik: answerTekillik,
  kaynak: answerKaynak,
};

export function answerRobotInterviewQuestion(robot: RobotSpec, questionId: RobotInterviewQuestionId): string {
  return ANSWERERS[questionId](robot);
}
