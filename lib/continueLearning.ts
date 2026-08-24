import type { EvidenceEvent } from "./evidence";
import type { Seviye } from "./content";

export interface ContinueLesson {
  slug: string;
  baslik: string;
  seviye: Seviye;
  seviyeEtiketi: string;
  /** HAT_ETIKET sırasındaki konumu — müfredat sırasını hesaplamak için. */
  hatIndex: number;
  hatEtiketi: string;
  /** Aynı hat + seviye içindeki öğretim sırası. */
  sira: number;
  /** Yalnız yayımlı ön koşullar (getPrerequisites ile aynı filtre). */
  onkosul: readonly string[];
}

export interface ContinueRoute {
  seviye: Seviye;
  steps: readonly ContinueLesson[];
}

export interface ContinueState {
  lastLesson: ContinueLesson;
  lastEventLabel: string;
  recommendation: {
    href: string;
    baslik: string;
    detail: string;
  };
}

function eventLabel(event: EvidenceEvent): string {
  if (event.stage === "passed") return "Ölçüt doğrulandı";
  if (event.stage === "assessed") return "Kavram kontrolü kaydedildi";
  if (event.stage === "observed") return "Deney gözlemi kaydedildi";
  if (event.stage === "tried") return "Deneme kaydedildi";
  if (event.stage === "predicted") return "Tahmin kaydedildi";
  return "Okuma kaydedildi";
}

function curriculumOrder(a: ContinueLesson, b: ContinueLesson): number {
  return a.hatIndex - b.hatIndex || a.sira - b.sira;
}

/**
 * Bir dersin önkoşulları, bilinen `visited` kümesinde mi (veya hiç
 * bilinmiyor mu — bkz. aşağıdaki not) diye bakar.
 *
 * `lessonsBySlug`'ta BULUNMAYAN bir önkoşul id'si engelleyici sayılmaz:
 * `lessons` her zaman TÜM yayımlı dersleri taşımayabilir (ör. tam indeks
 * `/devam-index.json` inmeden önceki küçük başlangıç kümesi). Bilinmeyen
 * bir önkoşulu "eksik" sayıp öneriyi bloke etmek, eksik veriyi yanlış
 * kullanıcı sinyaline çevirir — bu yüzden bilinmiyorsa karşılanmış kabul
 * edilir, aksi hâlde `visited` içinde olması gerekir.
 */
function isReady(lesson: ContinueLesson, visited: ReadonlySet<string>, lessonsBySlug: ReadonlyMap<string, ContinueLesson>): boolean {
  return lesson.onkosul.every((id) => visited.has(id) || !lessonsBySlug.has(id));
}

/**
 * Son yer, yerel kayıt dizisindeki en son yayımlı ders olayıdır. Sonraki
 * adım, aynı seviyedeki TÜM yayımlı dersler üzerinden müfredat sırasıyla
 * (hat sırası, sonra `sira`) hesaplanır — elle seçilmiş sabit bir rotayla
 * sınırlı değildir (bkz. docs/durum-denetim.md FAZ 2: eski sürüm yalnız
 * 3 derslik bir başlangıç rotasını biliyordu, öğrenci bunun ötesine
 * geçtiğinde öneri konudan kopuyordu). Aday, önkoşulları tamam olan
 * İLK sıradaki ders; hiçbiri hazır değilse (döngüsel/karşılıksız önkoşul
 * gibi nadir bir durum) müfredat sırasındaki ilk adaya düşülür — öğrenci
 * hiçbir zaman önerisiz bırakılmaz.
 */
export function getContinueState(
  events: readonly EvidenceEvent[],
  lessons: readonly ContinueLesson[],
): ContinueState | null {
  const lessonsBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  let lastEvent: EvidenceEvent | undefined;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (lessonsBySlug.has(events[index].lessonId)) {
      lastEvent = events[index];
      break;
    }
  }

  if (!lastEvent) return null;
  const lastLesson = lessonsBySlug.get(lastEvent.lessonId)!;

  const visited = new Set(events.map((event) => event.lessonId));
  const sameSeviye = lessons.filter((lesson) => lesson.seviye === lastLesson.seviye).sort(curriculumOrder);
  const unvisited = sameSeviye.filter((lesson) => !visited.has(lesson.slug));

  // Önce son yerden MÜFREDAT SIRASINDA SONRAKİ, ziyaret edilmemiş dersler
  // arasından ara — yalnız bu havuzda "hazır" (önkoşulu tamam) bir aday
  // yoksa (nadiren), ileri atlanmış bir öğrenciyi yakalamak için müfredat
  // sırasında ÖNCEKİ ziyaret edilmemiş derslere düş. Bu iki katmanlı havuz
  // olmadan algoritma her seferinde seviyenin en baştaki (genelde Hat A)
  // ziyaret edilmemiş dersine dönerdi — kullanıcı hangi hatta olursa olsun.
  const sonraki = unvisited.filter((lesson) => curriculumOrder(lesson, lastLesson) > 0);
  const havuz = sonraki.length > 0 ? sonraki : unvisited;

  const ready = havuz.find((lesson) => isReady(lesson, visited, lessonsBySlug));
  const nextStep = ready ?? havuz[0];

  return {
    lastLesson,
    lastEventLabel: eventLabel(lastEvent),
    recommendation: nextStep
      ? {
          href: `/ders/${nextStep.slug}`,
          baslik: nextStep.baslik,
          detail: `${nextStep.seviyeEtiketi} · ${nextStep.hatEtiketi} hattındaki müfredat sırasında sonraki durak`,
        }
      : {
          href: `/seviye/${lastLesson.seviye}`,
          baslik: `${lastLesson.seviyeEtiketi} derslerini aç`,
          detail: `${lastLesson.seviyeEtiketi} seviyesindeki tüm derslerde yerel kaydın var`,
        },
  };
}
