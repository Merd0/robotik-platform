import { encodeLabState, type IkTargetLabState, type PlannerRaceLabState } from "./labState";
import { SITE_URL } from "./seo";

export const TEACHER_PILOT_LESSON_SLUG = "b-lise-geometrik-ters-kinematik";

export const TEACHER_PILOT_LAB_STATE: IkTargetLabState = {
  kind: "ik-target",
  version: 1,
  robotId: "generic-2dof",
  target: { x: 0.9, y: 0.3 },
  elbow: "up",
  solver: "analytical",
};

/** Öğrenciye verilecek tek, önceden ayarlanmış ve hesapsız pilot bağlantısı. */
export const TEACHER_PILOT_TASK_URL = `${SITE_URL}/ders/${TEACHER_PILOT_LESSON_SLUG}#lab=${encodeLabState(TEACHER_PILOT_LAB_STATE)}`;

/**
 * Hat C pilotu (Faz 3, bkz. docs/durum-denetim.md). Aynı desen: tek,
 * hesapsız, önceden ayarlanmış görev bağlantısı — bu kez PlannerRace için.
 * Engel düzeni ve seed, bileşenin kendi dahili "planner-comparison"
 * meydan okumasındaki (`components/interactive/PlannerRace.tsx`
 * `CHALLENGE_INITIAL_OBSTACLES`/`CHALLENGE_SEED`) düzenin birebir aynısı —
 * uydurma bir engel yerleşimi değil, zaten dar-koridor senaryosu için
 * ayarlanmış, test edilmiş bir düzen.
 */
export const HAT_C_TEACHER_PILOT_LESSON_SLUG = "c-universite-algoritma-karsilastirma-deneyi";

export const HAT_C_TEACHER_PILOT_LAB_STATE: PlannerRaceLabState = {
  kind: "planner-race",
  version: 1,
  extent: 3,
  seed: 240807,
  algorithms: ["astar", "rrt", "rrt_star"],
  obstacles: [
    { kind: "sphere", center: { x: -0.3, y: 0.35, z: 0 }, size: [0.18] },
    { kind: "sphere", center: { x: 0.35, y: -0.25, z: 0 }, size: [0.18] },
  ],
};

export const HAT_C_TEACHER_PILOT_TASK_URL =
  `${SITE_URL}/ders/${HAT_C_TEACHER_PILOT_LESSON_SLUG}#lab=${encodeLabState(HAT_C_TEACHER_PILOT_LAB_STATE)}`;

/**
 * Kod Akademisi pilotu (Faz 3). Buradaki üç modül zaten sabit `initialCode`
 * ile açılıyor (bkz. content-kod-akademisi/temel/*.mdx) — Hat B/C'deki gibi
 * bir URL fragment'ına ihtiyaç yok, doğrudan modül linki yeterli. Sıra
 * modüllerin kendi `sira` alanıyla aynı: 1 (gözlem) → 2 (ilk düzenleme,
 * ölçülebilir kanıt) → 4 (sıfırdan yaz, ölçülebilir kanıt). 3. modül
 * (parametre gönder) 40 dakikaya sığdırmak için bilinçli olarak atlandı.
 */
export const KOD_AKADEMISI_TEACHER_PILOT_MODULES = [
  { asama: "temel", modul: "koda-temel-ilk-calistirma", baslik: "İlk çalıştırma", skillId: "koda-temel-ilk-calistirma" },
  { asama: "temel", modul: "koda-temel-degisken-degistir", baslik: "Değeri değiştir", skillId: "koda-temel-degisken-degistir" },
  { asama: "temel", modul: "koda-temel-acikla-sonra-uygula", baslik: "Açıkla, sonra uygula", skillId: "koda-temel-acikla-sonra-uygula" },
] as const;

export const KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS = KOD_AKADEMISI_TEACHER_PILOT_MODULES.map(
  (pilotModule) => `${SITE_URL}/kod-akademisi/${pilotModule.asama}/${pilotModule.modul}`,
);
