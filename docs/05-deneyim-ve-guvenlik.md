# Deneyim ve güvenlik

Bu doküman, `00-vizyon.md` içindeki ilkelerin iki eksik sütununu doldurur:
platform güvenliği ve öğrenme deneyiminin "eğlenceli" tarafı.

---

# Bölüm 1 — Eğlence nasıl tasarlanır

"Eğlenceli olsun" bir dilek değil, tasarım kararlarının toplamıdır. Bu bölüm
o kararları somutlaştırır.

## Seviyeye göre doz

Eğlence/oyunlaştırma dozu sabit değil, seviye yükseldikçe azalır. Üçü de
öğreticidir, ama "eğlenceli" olmanın görünürlüğü farklıdır:

| Seviye | Ton | Ne kadar oyunlaştırma |
|---|---|---|
| Ortaokul | Oyun gibi hissettirsin | Yüksek — görevler, tatmin edici animasyon, "kır ve gör", ödül hissi veren ama puan olmayan anlar |
| Lise | Meraklı ve keşfedici | Orta — hâlâ görev var ama dili daha teknik, süsleme azalır |
| Üniversite | Referans ve araç gibi hissettirsin | Düşük — sade, ciddi, hızlı; deneysel kurcalama var ama "oyun" hissi verilmez |

Bunun somut karşılığı:

- **Kanca cümlesi:** ortaokulda meraklandıran bir soru ("Robot nasıl bilir
  dirseğini nereye kıracağını?"), üniversitede doğrudan teknik çerçeve
  ("Bu ders, ters kinematiğin sayısal çözümünü ele alır").
- **Görsel dil:** ortaokulda renkli, oyuncu bir 3D sahne; üniversitede sade,
  teknik çizim gibi (ince çizgiler, nötr renk paleti, mühendislik çizimi hissi).
- **Bulmaca çerçevesi** (aşağıda) ortaokul ve lisede ağırlıklı; üniversitede
  "görev" yerine "deney" ve "doğrulama" diliyle sunulur — aynı etkileşim,
  farklı çerçeveleme.
- **"Kendinle yarış" özeti** ortaokul/lisede belirgin bir kutu; üniversitede
  sonuç tablosunun sıradan bir satırı, öne çıkarılmaz.
- **Serbest mod (oyun alanı)** tüm seviyelerde var ama üniversite sürümünün
  adı "deney ortamı" — aynı araç, farklı sunum.

Kısacası: **alttaki etkileşim motoru aynı, üstündeki çerçeveleme ve dil
seviyeyle birlikte ciddileşir.** Bu, `04-icerik-rehberi.md`'deki seviye
kalibrasyonu ilkesinin (formül yok → formül var → türetme var) deneyim
tarafındaki karşılığıdır.

## Neyi yapmıyoruz

Önce tuzakları eleyelim. Bunlar eğlence sanılır, değildir:

- **Rozet ve puan yağmuru.** Dışsal ödül, içsel merakı öldürür. Bir öğrenci
  rozet için tıklamaya başladığında öğrenmeyi bırakmıştır.
- **Zorunlu seri (streak) baskısı.** "3 gündür girmedin" bildirimi suçluluk
  üretir, motivasyon değil.
- **Çizgi film maskotu.** Ortaokul seviyesinde bile gereksiz; robot zaten ilginç.
- **Ses efekti bombardımanı.** Sessiz varsayılan; ses varsa kapatılabilir olmalı.

## Eğlencenin gerçek kaynağı: kontrol hissi

Bu platformdaki eğlence tek bir şeyden gelir: **sen bir şey yapıyorsun ve
robot anında tepki veriyor.** Bu döngü ne kadar sıkı olursa o kadar bağlayıcı.

Somut kurallar:

- **Gecikme 16 ms altında.** Kaydırıcıyı çektiğinde robot aynı karede hareket
  etmeli. Bu yüzden hesaplama tarayıcıda (bkz. `02-mimari.md`).
- **Sürekli geri bildirim, kesikli değil.** Sürüklerken robot takip etsin;
  bıraktığında hesaplansın değil.
- **Yumuşak hareket.** Robot ışınlanmasın, eklemler yumuşayarak (easing)
  gitsin. Hareketin kendisi bilgi taşır.
- **İz bırak.** Uç noktanın geçtiği yol soluk bir çizgi olarak kalsın.
  Kullanıcı ne yaptığını görsün.
- **Bozamasın.** Robot ekrandan çıkamaz, kamera kaybolmaz, "sıfırla" her zaman
  var. Güvenli kum havuzu, korku yok.

## Bulmaca çerçevesi

Her dersin sonunda bir **görev** var, soru değil. Fark önemli:

- Soru: "Ters kinematik nedir?" → ezber
- Görev: "Robotun ucunu şu kırmızı noktaya götür. Ama 2. eklem 45 dereceden
  fazla dönemez." → deneme, sezgi, kavrama

Görev tipleri:

| Tip | Örnek | Hangi seviye |
|---|---|---|
| Ulaş | Hedefe uzan | Hepsi |
| Kaçın | Engele değmeden ulaş | Lise+ |
| Optimize et | En az eklem hareketiyle ulaş | Lise+ |
| Tahmin et | Açıları gir, nereye gideceğini önce söyle | Hepsi |
| Kır | Robotu tekilliğe sok, ne olduğunu gör | Üniversite |
| Yaz | Kodla aynı sonucu üret | Üniversite |

"Kır" tipi özellikle değerli: bir sistemi kasten bozmak, onu anlamanın en
hızlı yolu ve en eğlenceli olanı.

## Kendinle yarış, başkasıyla değil

Sıralama tablosu yok (rekabet, geride kalanı kaçırır). Bunun yerine:

> Senin çözümün: 14 adım · En verimli bilinen çözüm: 9 adım · Tekrar dene

Kendi skorunu yenmek, başkasını yenmekten daha uzun süre motive eder ve kimseyi
küçük düşürmez.

## Serbest mod (kum havuzu)

Derslerden bağımsız bir `/oyun-alani` sayfası: robot seç, engel koy, algoritma
seç, ne olacağını gör. Ders yok, hedef yok, ölçüm yok.

Bu sayfa muhtemelen sitenin en çok paylaşılan bağlantısı olacak. Öğrenciler
buraya arkadaşlarını getirir, sonra derslere sızarlar.

**Gerçekleşen V1 (2026-08-12):** `/oyun-alani` artık "Kendi Robotun" deney
ortamı olarak çalışır. Kullanıcı 1–6 dönel eklemli düzlemsel bir robotun
bağlantı uzunluklarını ve açı limitlerini tanımlar; aynı ekranda FK
kaydırıcılarını, IK hedefini ve TCP izini dener. Son geçerli robot tanımı
localStorage'da kalır ve sürümlü `labState` URL fragment'ıyla hesapsız
paylaşılır. Bu sayfada ders ilerlemesi, puan veya başarı predicate'i yoktur.
İlk paragraftaki engel yerleştirme ve planlayıcı seçimi daha geniş kum havuzu
vizyonunun sonraki kapsamıdır; V1 bunları yapılmış gibi göstermez.

**Hareket öğretme genişlemesi (2026-08-13):** Kullanıcı TCP'yi sahnede
sürükleyerek canlı IK ile robota poz gösterebilir, tek tek poz öğretebilir veya
hareket ederken ayırt edici pozları kaydedebilir. Sistem öğretilen yolu
oynatmadan önce eklem limitleri, idealize merkez çizgisi öz-çarpışması ve
`maxVelocity` açısından prova eder. Mor önizleme, öğretilmiş TCP noktalarını
düz çizgiyle birleştirmez; kübik eklem-uzayı hareketinin gerçekten ürettiği TCP
yoludur. Böylece kullanıcı “hangi noktaları öğrettim?” ile “robotun ucu arada
nereden geçti?” farkını görür. Program yerel kayda ve paylaşım URL'sine dahildir.

Deney kumandaları sahnenin yanındaki üç sekmeli konsolda tutulur: eklemler,
hedef ve hareket öğretme arasında sayfayı aşağı-yukarı kaydırmadan geçilir;
sekme grubu ok tuşlarıyla da çalışır ve tüm hedefler en az 44 pikseldir. Yol
kaydı olay sayısına göre kota tüketmez. Yavaş/mikro hareket geometrik farka göre
daha ayrıntılı, hızlı hareket yaklaşık saniyelik aralıklarla örneklenir; iç
temsil bütçesi dolduğunda eski düz ara örnekler seyreltilerek kayıt sürer.
Geniş ekranda tasarım ve deney, imlecin bulunduğu sütunda bağımsız kaydırılan
bir çalışma tezgâhıdır; uzun sütunlar belgeyi sürükleyen `sticky` davranışına
ihtiyaç duymaz. İç panel rayları görünmez; ince, site renkli kaydırma göstergesi
yalnız sayfanın dış kenarında kalır.
Canlı TCP sürüklemesi en son işaretçi konumunu ekran yenileme karesinde bir kez
çözer; durum şeritleri sabit yükseklikte kaldığı için yeni metin sahneyi itmez.

Bu genişleme tam fizik iddiasında bulunmaz. Tork, yerçekimi, yük, ivme/jerk,
denetleyici gecikmesi, gerçek bağlantı kalınlığı, motor gövdesi ve çevre
engelleri modellenmez; arayüz bunu sürekli görünür bir “Gerçeklik kapsamı”
kutusunda söyler ve gerçek robota komut dışa aktarmaz.

## Mikro-kazanç ilkesi

Her ders, kullanıcının **yaptığı** bir şeyle bitmeli, okuduğu bir şeyle değil.
15 dakikalık ders, 15 dakika okuma değil: 5 dakika okuma, 10 dakika kurcalama.

## Ortaokul seviyesinde farklar

- Sayı yerine görsel: açı derecesi yerine dönen ok
- Metin bloğu 3 cümleyi geçmesin
- Her ders tek kavram
- "Yanlış" kelimesi hiç geçmesin; "hmm, şunu dene" olsun
- Robot komik olmasın ama hareketi tatmin edici olsun

---

# Bölüm 2 — Güvenlik

"Güvenlik" bu projede üç ayrı şey demek. Üçü de karşılanmalı.

## 2.1 Kullanıcı verisi güvenliği (en kritik)

**Hedef kitlemizde çocuklar var.** Ortaokul seviyesi 12-14 yaş demek. Bu,
Türkiye'de KVKK kapsamında hassas bir alan: çocuklardan veri toplamak,
veli rızası, özel kategoriler gibi ciddi yükümlülükler doğurur.

**Karar: hiç kişisel veri toplamıyoruz.**

- Hesap yok, giriş yok, e-posta yok, isim yok.
- İlerleme takibi tarayıcının kendi belleğinde (`localStorage`), sunucuya
  hiçbir şey gitmiyor.
- Yerel kayıt; ad, hesap veya sertifika değildir. Kullanıcı JSON kopyasını
  indirebilir ve arayüzden tüm kaydı silebilir. `localStorage` engellenirse
  uygulama olayları yalnız açık sekmenin belleğinde tutar ve kalıcıymış gibi
  göstermez.
- Çerez yok (dolayısıyla çerez banner'ı da yok).
- Üçüncü taraf izleyici yok. Analitik istenirse Plausible gibi kişisel veri
  toplamayan bir araç, ya da hiç.
- Yorum, forum, mesajlaşma yok — çocukların olduğu bir platformda moderasyon
  yükü ve risk taşınamaz.

Bu karar aynı zamanda mimariyi sadeleştiriyor: veri yoksa sızdırılacak veri de
yok. En güvenli veri, toplanmayan veridir.

Site bir gizlilik sayfası taşımalı ve bu politikayı açıkça yazmalı.

## 2.2 Uygulama güvenliği

Statik site olduğu için saldırı yüzeyi zaten küçük, ama:

- **CSP (Content Security Policy)** başlıkları tanımlı olsun.
- **Bağımlılık hijyeni:** `npm audit` CI'da koşsun; kullanılmayan paket
  tutulmasın. Her bağımlılık bir risk.
- **Pyodide izolasyonu:** kullanıcının yazdığı Python kendi tarayıcısında,
  WebAssembly kum havuzunda çalışır. Sunucuda kod çalıştırmıyoruz — bu
  bilinçli bir karar, uzaktan kod çalıştırma riskini tamamen ortadan kaldırır.
- **Dış kaynak yok:** yazı tipleri ve kütüphaneler kendi alan adımızdan
  sunulsun; üçüncü taraf CDN'i hem gizlilik hem tedarik zinciri riski.
- **Bağımlılık kilidi:** `package-lock.json` commit edilsin, sürümler sabit.

## 2.3 İçerik güvenliği

İki katman:

**Kaynak gizliliği** (bkz. `00-vizyon.md`): iş yeri kaynaklı hiçbir bilgi
yayınlanmaz. `kaynaklar` alanı zorunlu, CI kontrol eder.

**Fiziksel güvenlik sorumluluğu:** platform gerçek robot programlamayı
öğretiyor. Gerçek bir robotun yanlış programlanması insan yaralayabilir.
Bu yüzden:

- Robot kontrolüyle ilgili her ileri seviye ders, güvenlik uyarısı taşımalı.
- Hat H (güvenlik) sonraya bırakılan bir hat olmamalı; en azından temel
  uyarılar en baştan var olmalı.
- Site hiçbir yerde "bu kodu gerçek robotunda çalıştır" demez. Simülasyon
  simülasyondur; gerçek robot eğitimli personel ve risk analizi ister.
- Bu duruş bir sorumluluk reddi metniyle değil, derslerin içine yedirilerek
  kurulur.

---

# Bölüm 3 — Hız (ölçülebilir hedefler)

"Hızlı olsun" demek yetmez, sayı lazım:

| Ölçüt | Hedef |
|---|---|
| İlk anlamlı boyama (FCP) | < 1.0 sn (3G'de < 2.5 sn) |
| Etkileşime hazır (TTI) | < 2.0 sn |
| İlk yükleme JS boyutu | < 200 KB (sıkıştırılmış) |
| 3D sahne kare hızı | 60 FPS (orta seviye telefonda ≥ 30) |
| Kaydırıcı → görsel tepki | < 16 ms |
| Lighthouse performans | ≥ 90 (mobil) |

Bunları sağlamanın yolları: statik üretim, 3D ve Pyodide'nin tembel yüklenmesi,
basit geometri (yüksek çokgenli mesh yok), uzun hesapların Web Worker'a
taşınması, görsellerin modern formatta ve boyutlandırılmış olması.

Her fazın sonunda Lighthouse koşulur; hedefin altına düşerse faz kapanmaz.

## Bilinen ödünleşim: 3D'li ders sayfaları Lighthouse hedefinin altında

**Bu bilinen ve kabul edilmiş bir durum, gözden kaçmış bir eksiklik değil.**
Faz 5 denetiminde (2026-08-04) ölçüldü:

| Sayfa türü | Lighthouse performans (mobil) |
|---|---|
| Ana sayfa, `/ara`, `/sozluk`, 3D'siz ders | 98-99 ✔ |
| **3D sahnesi olan ders sayfası** | **73-76** ✘ (hedef ≥ 90) |

Yapılabilecekler yapıldı: 3D `next/dynamic` ile ayrı parçaya alındı (ilk
yükleme JS'i 434 → 197 KB, bütçenin altına indi), sahne görünür alana
yaklaşana kadar hiç bağlanmıyor, tembel parça tekilleştirildi (three.js her
sahne için ayrı kopyalanıyordu).

Kalan maliyet **bayt değil, çalıştırma**: emüle mobil CPU'da three.js'in
modül başlatması + WebGL bağlamı kurulumu ~1,2 sn ana thread tutuyor. FCP
(0,8 sn) ve CLS (0) hedefte — sayfa hızlı boyanıyor, kaymıyor; geciken şey
yalnızca etkileşime hazır olma.

Bunu aşmanın kalan tek yolu `@react-three/drei`'yi tamamen çıkarıp three'nin
çıplak ilkellerine dönmek. **Bilinçli olarak yapılmadı:** drei'nin `Line`
bileşeni, çizgiye kalınlık verebilen tek yol (WebGL'in kendi çizgisi her
zaman 1 piksel) ve **iz çizgisi `07-tasarim-sistemi.md`'de projenin imza
öğesi.** Onu hairline'a düşürmek, ölçülebilir bir puan için görünür bir
kimlik kaybı olurdu.

Bu ödünleşim Faz 5 sonrası "cila" fazının maddesi. O zaman yeniden
değerlendirilir: ya iz çizgisi için drei dışında bir yol bulunur, ya da
3D'li sayfalar için hedef ayrıca tanımlanır (bu tablodaki tek sayı, bir
WebGL sahnesiyle açılan sayfa için gerçekçi olmayabilir).

Ölçüm ayrıntısı ve yapılan üç optimizasyon: `docs/durum-denetim.md`,
"Faz 5 tamamlandı" bölümü.
