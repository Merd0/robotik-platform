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
  /**
   * Kademeli ipucu — en belirsizden en somuta. Kullanıcı isterse birini
   * açar, sonraki tıklamada bir öncekini gizlemeden yenisi eklenir. Cevabı
   * doğrudan söylemez, dikkati doğru satıra çeker.
   */
  hints: readonly string[];
  /**
   * Çözüldükten SONRA görünen "neden" açıklaması — hatanın kök nedenini
   * ve genel dersini anlatır. Çözülmeden önce gösterilmez (ipucuyla karışmasın).
   */
  explanation: string;
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
    hints: [
      "Fonksiyona 50 veriyorsun ama robota giden değer başka. `git` fonksiyonunun gövdesini satır satır oku.",
      "`robot.movej([-j1, j2])` satırındaki eksi işaretine bak — j1'e ne oluyor?",
      "İlk eklem için -50° gönderiliyor ama hedef +50°. `-j1` yerine `j1` yazman gerekiyor.",
    ],
    explanation:
      "Kopyala-yapıştır veya elle yazarken bir değişkenin önüne yanlışlıkla eksi işareti eklemek yaygın bir hata türü. Python bunu hata olarak görmez — sözdizimi geçerlidir, sadece matematiksel olarak yanlış sonuç üretir. Bu yüzden \"çalışıyor ama yanlış\" durumları, hiç çalışmayan koddan daha sinsi: hata mesajı yok, sadece robot yanlış yere gidiyor. Kontrol yöntemi: her satırda \"bu değişken robota giderken hangi işlemlerden geçti\" diye takip etmek.",
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
    hints: [
      "Döngünün gezdiği liste ile `rota`nın kendisi aynı mı? `rota[:-1]` ne anlama geliyor?",
      "Python'da `liste[:-1]`, listenin SON elemanı hariç hepsini alır. Bu döngüde kaç nokta gezilir?",
      "Üç noktalık rotada `rota[:-1]` yalnız ilk iki noktayı verir. Son noktaya (60, -30) hiç `movej` çağrısı yapılmıyor — dilimlemeyi kaldırıp `rota`nın tamamını gezmen gerekiyor.",
    ],
    explanation:
      "`liste[:-1]` dilimlemesi Python'da çok sık \"son elemanı çıkar\" anlamında kasıtlı kullanılır (örn. bir başlığı atlarken) — ama burada rotanın TAMAMI gezilmesi gerekirken yanlışlıkla kalmış bir dilimleme. Dilimleme hata fırlatmaz, sessizce daha kısa bir liste üretir; bu yüzden \"neden son noktaya gitmedi\" sorusunun cevabı çalışma zamanında değil, döngünün üzerinde gezdiği veride saklı. Kontrol yöntemi: döngüden önce `print(len(rota))` ile kaç eleman beklediğini, döngü içinde de kaç kez çalıştığını karşılaştırmak.",
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
    hints: [
      "İki satır da `eklem_ac` çağırıyor. İlk parametre hangi eklemi seçtiğini belirtiyor — ikisi de aynı mı?",
      "`eklem_ac(0, ...)` her zaman İLK eklemi (indeks 0) hedefler. İkinci satırın da indeksi 0.",
      "İkinci satır ikinci eklemi (indeks 1) ayarlamalıydı: `robot.eklem_ac(1, -60)` olmalı, `eklem_ac(0, -60)` değil.",
    ],
    explanation:
      "Kopyala-yapıştır sonrası ikinci satırdaki indeksin güncellenmeyi unutulması — kod düzenlerken çok sık atlanan bir adım, çünkü iki satır neredeyse aynı görünüyor ve göz farkı fark etmiyor. Sonuç: ilk eklem iki kez ayarlanıyor (ikinci çağrı ilkini eziyor), ikinci eklem hiç dokunulmamış kalıyor. Kontrol yöntemi: her `eklem_ac`/`movej` çağrısının hangi eklemi hedeflediğini elle sayıp, hedeflenmesi gereken eklem sayısıyla karşılaştırmak.",
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
    hints: [
      "Fonksiyon `git(j1, j2)` diye tanımlanmış. Gövdesinde `j1` ve `j2` hangi sırayla kullanılıyor?",
      "`robot.movej([j2, j1])` satırına bak — parametre isimleri fonksiyon tanımıyla aynı sırada mı gönderiliyor?",
      "`movej([j2, j1])`, j2'yi birinci ekleme, j1'i ikinci ekleme gönderiyor — tanımdaki sırayla ters. `movej([j1, j2])` olmalı.",
    ],
    explanation:
      "Bir fonksiyonun parametre isimleri (`j1`, `j2`) ile onları kullandığı sıra birbirinden bağımsızdır — Python isimleri hatırlamaz, sadece listedeki konumu önemser. `[j2, j1]` yazmak sözdizimsel olarak tamamen geçerlidir, sadece anlamsal olarak istenenin tersini yapar. Bu hata özellikle fonksiyon uzun olduğunda veya çağrıldığı yerden uzakta tanımlandığında fark edilmesi zor olur. Kontrol yöntemi: fonksiyonun gövdesindeki her parametrenin, tanımdaki sırayla mı kullanıldığını satır satır izlemek.",
  },
];
