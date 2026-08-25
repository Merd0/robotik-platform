/**
 * "Kırık Kod Laboratuvarı" (docs/16 FAZ 5) için sabit arıza kartları
 * kataloğu — saf veri, hesap yok. Her kart `CodeRunner`ın (aynı Pyodide
 * worker, aynı `eklem_ac`/`movej` köprüsü, aynı `expectedFinalDegrees`
 * doğrulaması) ZATEN çalışan motorunu tüketir; yeni bir çalıştırma/kontrol
 * mekanizması icat edilmez. Kod Akademisi'nin müfredat içi "hata avcılığı"
 * modüllerinden farkı: burası sıralı bir ders değil, bağımsız bir arıza
 * galerisi — istediğin kartı seç, düzelt, sıradakine geç.
 */

export interface BrokenCodeCard {
  id: string;
  title: string;
  scenario: string;
  robot: string;
  initialCode: string;
  expectedFinalDegrees: number[];
  toleranceDegrees: number;
  skillId: string;
  /** `LessonEvidenceProvider`ın `contentVersion`i — kart mantığı değişirse elle sürümle. */
  contentVersion: string;
}

export const BROKEN_CODE_CARDS: readonly BrokenCodeCard[] = [
  {
    id: "yanlis-isaret",
    title: "Yanlış işaret",
    scenario: "Robot (50°, -30°)'a gitmesi gerekirken ilk ekleminin işareti ters dönüyor.",
    robot: "generic-2dof",
    initialCode: [
      "def git(j1, j2):",
      "    robot.movej([-j1, j2])",
      "",
      "git(50, -30)",
    ].join("\n"),
    expectedFinalDegrees: [50, -30],
    toleranceDegrees: 1,
    skillId: "kirik-kod-yanlis-isaret",
    contentVersion: "v1",
  },
  {
    id: "son-nokta-atlaniyor",
    title: "Son nokta atlanıyor",
    scenario: "Rota üç nokta içeriyor ama robot son noktaya hiç gitmiyor, ikinci noktada duruyor.",
    robot: "generic-2dof",
    initialCode: [
      "rota = [(20, -10), (40, -20), (60, -30)]",
      "",
      "for j1, j2 in rota[:-1]:",
      "    robot.movej([j1, j2])",
    ].join("\n"),
    expectedFinalDegrees: [60, -30],
    toleranceDegrees: 1,
    skillId: "kirik-kod-son-nokta-atlaniyor",
    contentVersion: "v1",
  },
  {
    id: "yanlis-eklem-indeksi",
    title: "Yanlış eklem indeksi",
    scenario: "İkinci eklemi ayarlamak isteyen satır, kopyala-yapıştır hatasıyla yine ilk eklemi ayarlıyor.",
    robot: "generic-2dof",
    initialCode: [
      "robot.eklem_ac(0, 30)",
      "robot.eklem_ac(0, -60)",
    ].join("\n"),
    expectedFinalDegrees: [30, -60],
    toleranceDegrees: 1,
    skillId: "kirik-kod-yanlis-eklem-indeksi",
    contentVersion: "v1",
  },
  {
    id: "sirasi-karismis",
    title: "Parametre sırası karışmış",
    scenario: "Fonksiyon j1 ve j2 alıyor ama gövdesi onları ters sırada robota gönderiyor.",
    robot: "generic-2dof",
    initialCode: [
      "def git(j1, j2):",
      "    robot.movej([j2, j1])",
      "",
      "git(50, -30)",
    ].join("\n"),
    expectedFinalDegrees: [50, -30],
    toleranceDegrees: 1,
    skillId: "kirik-kod-sirasi-karismis",
    contentVersion: "v1",
  },
];
