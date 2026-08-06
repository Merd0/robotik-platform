import { describe, expect, it } from "vitest";
import { AStarPlanner } from "./astar";
import { RrtPlanner } from "./rrt";
import { RrtStarPlanner } from "./rrtStar";
import { createCollisionChecker, isSegmentFree, type Obstacle } from "../collision";
import type { Vec3 } from "../transform";

/**
 * Planlayıcı çıktısının TEMEL değişmezi: "başarılı" dönen bir yolun HER
 * segmenti çarpışmasız olmalı.
 *
 * Bu dosya üç gerçek hatanın regresyon testi:
 *
 * 1. RRT/RRT* son sıçrama: hedefe `goalTolerance` kadar yaklaşan düğümden
 *    goal'e uzanan segment hiç kontrol edilmiyordu — engelin içinden geçen
 *    bir yol "başarılı" dönebiliyordu.
 * 2. A* köşe kesme: çapraz hamlelerde yalnızca hedef hücrenin merkezi
 *    kontrol ediliyordu; iki dolu hücrenin arasından geçen hamle engelin
 *    köşesini kesiyordu.
 * 3. Düzlemsel sızıntı: 2B sahnelerde planlayıcı z ekseninde de arıyordu,
 *    yol kullanıcının göremediği üçüncü boyuttan dolaşıp engeli deliyordu.
 *
 * Denetim çözünürlüğü hakkında — bu testin ölçüsü bilinçli seçildi.
 * Çarpışma kontrolü bir NOKTA yüklemi üzerinden yapılıyor, dolayısıyla
 * sürekli bir segment ancak örneklenerek kontrol edilebilir. Örnekleme
 * adımından KISA bir "köşe yalaması" her zaman iki örnek arasına sığabilir;
 * bu, örneklemeye dayalı her çarpışma kontrolünün yapısal sınırıdır, bir
 * mantık hatası değil. Denetimi planlayıcının kendi ilan ettiği adımdan
 * daha ince yaparsak test tanım gereği tatmin edilemez hale gelir.
 *
 * Bu yüzden her planlayıcı KENDİ ilan ettiği adımda denetlenir: soru
 * "planlayıcı kendi sözleşmesini tutuyor mu" — ve yukarıdaki üç hata bu
 * sözleşmenin ihlalleriydi (hiç örneklenmeyen son sıçrama, yalnızca hücre
 * merkezine bakan kenar kontrolü, hiç kısıtlanmayan z ekseni). Yapısal
 * sınırın kendisi dosyanın sonunda ayrıca kayda geçiriliyor.
 */

/** RRT/RRT* segmentleri bu adımla kontrol eder; denetim de aynı adımda. */
const RRT_SEGMENT_COZUNURLUGU = 0.002;
const RRT_DENETIM = RRT_SEGMENT_COZUNURLUGU;
/** A* kenarları resolution/2 adımla kontrol eder; denetim de aynı adımda. */
const ASTAR_COZUNURLUK = 0.02;
const ASTAR_DENETIM = ASTAR_COZUNURLUK / 2;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Yolun her ardışık nokta çiftini ince adımla tarar; ihlal eden ilk segmenti döndürür. */
function ihlalEdenSegment(
  path: readonly Vec3[],
  obstacles: readonly Obstacle[],
  denetimCozunurlugu: number,
): string | null {
  for (let i = 1; i < path.length; i++) {
    if (!isSegmentFree(path[i - 1], path[i], obstacles, denetimCozunurlugu)) {
      const a = path[i - 1];
      const b = path[i];
      return `segment ${i - 1}→${i}: (${a.x.toFixed(3)}, ${a.y.toFixed(3)}, ${a.z.toFixed(3)}) → (${b.x.toFixed(3)}, ${b.y.toFixed(3)}, ${b.z.toFixed(3)})`;
    }
  }
  return null;
}

/**
 * Köşe kesmeyi zorlayan sahne: iki kutu köşegen olarak yerleşik, aralarında
 * yalnızca köşe teması var. Düz bir çapraz hamle tam o köşeden geçmek ister.
 */
const KOSEGEN_BOSLUK: Obstacle[] = [
  { kind: "box", center: { x: 0.15, y: 0.15, z: 0 }, size: [0.05, 0.05, 0.2] },
  { kind: "box", center: { x: 0.25, y: 0.05, z: 0 }, size: [0.05, 0.05, 0.2] },
];

/** Hedefin hemen önünde duran ince engel — son sıçramayı tuzağa düşürür. */
const HEDEF_ONUNDE_DUVAR: Obstacle[] = [
  { kind: "box", center: { x: 0.27, y: 0, z: 0 }, size: [0.012, 0.25, 0.2] },
];

const SAHNELER: { ad: string; start: Vec3; goal: Vec3; obstacles: Obstacle[] }[] = [
  { ad: "köşegen boşluk", start: { x: 0, y: 0, z: 0 }, goal: { x: 0.3, y: 0.3, z: 0 }, obstacles: KOSEGEN_BOSLUK },
  { ad: "hedef önünde duvar", start: { x: 0, y: 0, z: 0 }, goal: { x: 0.3, y: 0, z: 0 }, obstacles: HEDEF_ONUNDE_DUVAR },
  {
    ad: "küre etrafından",
    start: { x: 0, y: 0, z: 0 },
    goal: { x: 0.3, y: 0, z: 0 },
    obstacles: [{ kind: "sphere", center: { x: 0.15, y: 0, z: 0 }, size: [0.08] }],
  },
];

describe("başarılı dönen her yol çarpışmasızdır", () => {
  for (const sahne of SAHNELER) {
    it(`A* — ${sahne.ad}`, () => {
      const planner = new AStarPlanner({ planar: true, resolution: ASTAR_COZUNURLUK });
      const sonuc = planner.plan(sahne.start, sahne.goal, createCollisionChecker(sahne.obstacles));
      if (!sonuc.success) return; // Başarısızlık meşru; yanlış "başarı" değil.
      expect(ihlalEdenSegment(sonuc.path, sahne.obstacles, ASTAR_DENETIM)).toBeNull();
    });

    it.each([1, 42, 1337])(`RRT — ${sahne.ad}, tohum=%i`, (seed) => {
      const planner = new RrtPlanner({
        random: seededRandom(seed),
        maxIterations: 8000,
        planar: true,
        segmentResolution: RRT_SEGMENT_COZUNURLUGU,
      });
      const sonuc = planner.plan(sahne.start, sahne.goal, createCollisionChecker(sahne.obstacles));
      if (!sonuc.success) return;
      expect(ihlalEdenSegment(sonuc.path, sahne.obstacles, RRT_DENETIM)).toBeNull();
    });

    it.each([1, 42])(`RRT* — ${sahne.ad}, tohum=%i`, (seed) => {
      const planner = new RrtStarPlanner({
        random: seededRandom(seed),
        maxIterations: 4000,
        planar: true,
        segmentResolution: RRT_SEGMENT_COZUNURLUGU,
      });
      const sonuc = planner.plan(sahne.start, sahne.goal, createCollisionChecker(sahne.obstacles));
      if (!sonuc.success) return;
      expect(ihlalEdenSegment(sonuc.path, sahne.obstacles, RRT_DENETIM)).toBeNull();
    });
  }
});

describe("A* köşe kesmiyor", () => {
  /**
   * Köşegen bir duvar: hücreler yalnızca köşeden temas ediyor, yani
   * ORTOGONAL olarak geçilebilir bir boşluk YOK. Köşe kesme serbest
   * bırakılırsa A* bu köşegen temas noktasından "sızarak" hedefe ulaşır;
   * engellenirse geçemez ve başarısız döner.
   *
   * Bu test bilinçli olarak sonucun kendisine bakıyor (geçti/geçemedi),
   * yola değil: köşe kesmenin ihlali geometrik olarak ölçülemeyecek kadar
   * ince (iki kutunun tek bir noktada temas etmesi), ama davranış farkı
   * nettir.
   */
  const R = 0.02;
  const hucre = (i: number, j: number): Obstacle => ({
    kind: "box",
    center: { x: i * R, y: j * R, z: 0 },
    size: [R / 2, R / 2, 0.1],
  });
  // i+j = 5 köşegeni boyunca dizili hücreler: aralarında ortogonal boşluk
  // yok, yalnızca köşe teması var. Duvar, aramanın erişebildiği tüm
  // kutuyu (padding dahil) kapatacak kadar uzun.
  const KOSEGEN_DUVAR: Obstacle[] = Array.from({ length: 12 }, (_, k) => hucre(k - 3, 5 - (k - 3)));

  it("köşegen duvarı köşe kesme ile geçemez", () => {
    const planner = new AStarPlanner({ planar: true, resolution: R, padding: 2 * R });
    const sonuc = planner.plan(
      { x: 0, y: 0, z: 0 },
      { x: 5 * R, y: 5 * R, z: 0 },
      createCollisionChecker(KOSEGEN_DUVAR),
    );
    expect(sonuc.success).toBe(false);
  });
});

describe("RRT/RRT* son sıçramayı kontrol ediyor", () => {
  /**
   * Hedefin hemen önünde, örnekleme kutusunun tamamını kapatan bir duvar.
   * Duvar goalTolerance mesafesinin içinde kaldığı için, son sıçrama
   * kontrol edilmezse RRT duvarın berisindeki bir düğümden hedefe
   * "atlayarak" başarı döner. Kontrol varken geçiş yoktur.
   */
  const KAPALI_DUVAR: Obstacle[] = [
    { kind: "box", center: { x: 0.28, y: 0, z: 0 }, size: [0.015, 0.3, 0.2] },
  ];
  const start: Vec3 = { x: 0, y: 0, z: 0 };
  const goal: Vec3 = { x: 0.3, y: 0, z: 0 };

  it.each([1, 42, 1337])("RRT duvarın içinden atlayamaz, tohum=%i", (seed) => {
    const planner = new RrtPlanner({ random: seededRandom(seed), maxIterations: 4000, planar: true });
    const sonuc = planner.plan(start, goal, createCollisionChecker(KAPALI_DUVAR));
    expect(sonuc.success).toBe(false);
  });

  it.each([1, 42])("RRT* duvarın içinden atlayamaz, tohum=%i", (seed) => {
    const planner = new RrtStarPlanner({ random: seededRandom(seed), maxIterations: 2500, planar: true });
    const sonuc = planner.plan(start, goal, createCollisionChecker(KAPALI_DUVAR));
    expect(sonuc.success).toBe(false);
  });
});

describe("düzlemsel mod z ekseninden kaçışı kapatır", () => {
  // Engel z'de sınırlı: 3B planlayıcı üstünden dolaşabilir, düzlemsel olan
  // dolaşamaz. 2B sahnede kullanıcı bunu "engeli deldi" diye görür.
  const ALCAK_DUVAR: Obstacle[] = [
    { kind: "box", center: { x: 0.15, y: 0, z: 0 }, size: [0.02, 0.3, 0.05] },
  ];
  const start: Vec3 = { x: 0, y: 0, z: 0 };
  const goal: Vec3 = { x: 0.3, y: 0, z: 0 };

  it("A* düzlemsel modda yolu z = start.z düzleminde tutar", () => {
    const planner = new AStarPlanner({ planar: true, resolution: ASTAR_COZUNURLUK });
    const sonuc = planner.plan(start, goal, createCollisionChecker(ALCAK_DUVAR));
    if (sonuc.success) {
      for (const nokta of sonuc.path) expect(nokta.z).toBeCloseTo(start.z, 10);
    }
  });

  it("RRT düzlemsel modda yolu z = start.z düzleminde tutar", () => {
    const planner = new RrtPlanner({ random: seededRandom(42), maxIterations: 8000, planar: true });
    const sonuc = planner.plan(start, goal, createCollisionChecker(ALCAK_DUVAR));
    if (sonuc.success) {
      for (const nokta of sonuc.path) expect(nokta.z).toBeCloseTo(start.z, 10);
    }
  });

  it("düzlemsel OLMAYAN A* aynı sahnede z'yi kullanır (kapatılan açığın kanıtı)", () => {
    const planner = new AStarPlanner({ resolution: ASTAR_COZUNURLUK });
    const sonuc = planner.plan(start, goal, createCollisionChecker(ALCAK_DUVAR));
    expect(sonuc.success).toBe(true);
    const zKullandi = sonuc.path.some((nokta) => Math.abs(nokta.z - start.z) > 1e-9);
    expect(zKullandi).toBe(true);
  });
});

describe("bilinen yapısal sınır: örnekleme adımından kısa köşe yalaması", () => {
  /**
   * Bu test bir hatayı değil, KABUL EDİLMİŞ bir sınırı kayda geçirir.
   *
   * Çarpışma kontrolü nokta yüklemi olduğu için segment örneklenerek
   * kontrol edilir. Örnekleme adımından kısa süren bir engel teması iki
   * örnek arasına sığar ve görülmez. Aşağıda bu durum kasıtlı olarak
   * kurulmuştur: segment engelin köşesini adım boyundan kısa bir mesafe
   * boyunca kesiyor, kaba örnekleme "serbest" diyor, ince örnekleme
   * "dolu" diyor.
   *
   * Gerçek çözümü engelleri bir güvenlik payıyla şişirmektir (obstacle
   * inflation); bu, `CollisionChecker` sözleşmesini değiştirdiği için
   * docs/02 güncellenmeden yapılmamalı. Sahnelerdeki engeller ızgara ve
   * segment adımlarından çok daha kalın olduğu için pratikte etkisi yok.
   */
  // Kutunun köşesi x+y = 0.30'da; segment x+y = 0.298 doğrusunda ilerliyor,
  // yani köşenin yalnızca 0.0014 içinden geçiyor.
  const KOSE: Obstacle[] = [{ kind: "box", center: { x: 0.1, y: 0.1, z: 0 }, size: [0.05, 0.05, 0.1] }];
  const a: Vec3 = { x: 0.05, y: 0.248, z: 0 };
  const b: Vec3 = { x: 0.248, y: 0.05, z: 0 };

  it("kaba adım köşe temasını göremez, ince adım görür", () => {
    expect(isSegmentFree(a, b, KOSE, 0.02)).toBe(true);
    expect(isSegmentFree(a, b, KOSE, 0.0002)).toBe(false);
  });
});
