export const HERO_ARM = {
  shoulder: { x: 104, y: 116 },
  link1: 62,
  link2: 54,
} as const;

/**
 * Tek kaydırıcı, iki eklem. Komut arttıkça önce OMUZ döner; omuz kendi
 * limitine dayandığında kontrol kendiliğinden DİRSEĞE geçer ve uç hedefe
 * doğru uzanmayı sürdürür.
 *
 * Bu, gerçek bir kolun bir eksen sınırına dayanınca bir sonraki ekseni
 * devreye sokmasının en sade hâli. Sahnedeki asıl ders de bu ayrımda:
 * omuz TEK BAŞINA uzanımı değiştiremez, çünkü tek bir dönme eklemi uç
 * noktayı omuz çevresinde bir DAİRE üzerinde gezdirir — yarıçapı değil
 * yönü değiştirir. Uzanımı büyüten şey ikinci eklemin açılmasıdır.
 */
export const HERO_JOINTS = {
  /** Omuz açısı komutun başında `start`, limitinde `limit` (derece). */
  shoulder: { start: 64, limit: 8 },
  /** Dirsek komut devredilene kadar `rest`te bekler, sonra `limit`e açılır. */
  elbow: { rest: 118, limit: 18 },
  /** Komut yüzdesinin kaçıncı noktasında omuz sınıra dayanıp devri yapıyor. */
  handoffAt: 65,
} as const;

export type ActiveJoint = "omuz" | "dirsek";

interface Point {
  x: number;
  y: number;
}

const DEG = Math.PI / 180;

export function heroArmPoints(q1Degrees: number, q2Degrees: number) {
  const a1 = -q1Degrees * DEG;
  const a2 = -(q1Degrees + q2Degrees) * DEG;
  const elbow = {
    x: HERO_ARM.shoulder.x + HERO_ARM.link1 * Math.cos(a1),
    y: HERO_ARM.shoulder.y + HERO_ARM.link1 * Math.sin(a1),
  };
  const end = {
    x: elbow.x + HERO_ARM.link2 * Math.cos(a2),
    y: elbow.y + HERO_ARM.link2 * Math.sin(a2),
  };
  return { elbow, end };
}

/**
 * Hedef nokta elle yazılmaz: komut sonuna kadar çekildiğinde kolun fiilen
 * durduğu yerdir. Böylece "hedefe varılabilir mi" sorusunun cevabı
 * geometriden gelir, uydurulmuş bir koordinattan değil.
 */
export const HERO_TARGET: Point = heroArmPoints(HERO_JOINTS.shoulder.limit, HERO_JOINTS.elbow.limit).end;

export interface HeroPose {
  /** Omuz açısı (derece). */
  q1: number;
  /** Dirsek açısı (derece). */
  q2: number;
  activeJoint: ActiveJoint;
  /** Omuz limitine dayandı mı — görsel uyarının ve devrin tetikleyicisi. */
  shoulderAtLimit: boolean;
  elbow: Point;
  end: Point;
  /** Omuzdan uç noktaya olan mesafe; yalnız dirsek açısına bağlıdır. */
  reach: number;
  distanceToTarget: number;
}

const lerp = (from: number, to: number, ratio: number) => from + (to - from) * ratio;

/** `command` 0-100 arası tek bir kullanıcı girdisidir; aralık dışı değer kırpılır. */
export function heroPose(command: number): HeroPose {
  const clamped = Math.min(100, Math.max(0, command));
  const { shoulder, elbow: elbowLimits, handoffAt } = HERO_JOINTS;

  const shoulderRatio = Math.min(clamped, handoffAt) / handoffAt;
  const elbowRatio = Math.max(0, clamped - handoffAt) / (100 - handoffAt);
  const q1 = lerp(shoulder.start, shoulder.limit, shoulderRatio);
  const q2 = lerp(elbowLimits.rest, elbowLimits.limit, elbowRatio);

  const { elbow, end } = heroArmPoints(q1, q2);
  return {
    q1,
    q2,
    activeJoint: clamped < handoffAt ? "omuz" : "dirsek",
    shoulderAtLimit: clamped >= handoffAt,
    elbow,
    end,
    reach: Math.hypot(end.x - HERO_ARM.shoulder.x, end.y - HERO_ARM.shoulder.y),
    distanceToTarget: Math.hypot(end.x - HERO_TARGET.x, end.y - HERO_TARGET.y),
  };
}
