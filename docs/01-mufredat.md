# Müfredat

Sekiz konu hattı (track), her biri üç seviyede. Hatlar birbirinden bağımsız
ilerleyebilir; seviyeler hat içinde birikimlidir.

Toplam hedef: ~70-90 ders. Bu, 1-2 yıllık bir içerik üretim işidir. Aşağıdaki
liste tam vizyondur; hangi sırayla üretileceği `03-yol-haritasi.md` içinde.

---

## Hat A — Temeller

**A / Ortaokul**
- Robot nedir, çevremizde nerede
- Eksen ne demek: bir robot kaç yöne hareket eder
- Robot türleri: kol, mobil, insansı, kartezyen
- Robot ile makine arasındaki fark

**A / Lise**
- Serbestlik derecesi (DOF) ve neden 6 eksenin özel olduğu
- Koordinat sistemleri: dünya, taban, alet
- Döner (revolute) ve doğrusal (prismatic) eklemler
- Alet merkez noktası (TCP) kavramı
- Çalışma uzayı (workspace): robot nereye uzanabilir

**A / Üniversite**
- Kinematik zincir, açık ve kapalı zincir
- Homojen dönüşüm matrisleri, dönme ve öteleme
- Denavit-Hartenberg (DH) parametreleri
- Robot mimarileri: seri, SCARA, delta, kartezyen, paralel
- Poz gösterimleri: Euler açıları, kuaterniyon, dönme matrisi

---

## Hat B — Hareket ve kinematik

**B / Ortaokul**
- Eklemleri oynat, ucun nereye gittiğini gör
- Robot bir noktaya birden fazla şekilde uzanabilir
- Neden bazı noktalara uzanamaz

**B / Lise**
- İki eklemli kolda ileri kinematik: trigonometri ile
- Geometrik ters kinematik: dirsek yukarı / dirsek aşağı
- Açı birimleri, radyan ve derece
- Eklem limitleri ve neden var oldukları

**B / Üniversite**
- DH ile ileri kinematik (genel çözüm)
- Analitik ve sayısal ters kinematik
- Jacobian matrisi: eklem hızı ile uç hızı ilişkisi
- Tekillik (singularity): nedir, neden tehlikelidir, nasıl kaçınılır
- Yörünge üretimi: nokta-nokta, doğrusal, dairesel hareket
- Hız ve ivme profilleri: yamuk profil, S-eğrisi
- MoveJ ve MoveL farkı, ne zaman hangisi

---

## Hat C — Yol planlama

**C / Ortaokul**
- Labirentte yol bulma: robot nasıl karar verir
- En kısa yol her zaman en iyi yol mudur

**C / Lise**
- Grid üzerinde arama, maliyet kavramı
- A* algoritması ve sezgisel (heuristic) fonksiyon
- Engelden kaçınmanın temel mantığı

**C / Üniversite**
- Konfigürasyon uzayı (C-space) ve neden gerekli
- Çarpışma kontrolü: nokta, segment, hacim
- RRT, RRT*, PRM: örneklemeli planlama
- Optimallik ve hız arasındaki ödünleşim
- Hangi görev için hangi algoritma: karşılaştırmalı deney
- Yol düzleştirme (path smoothing)

---

## Hat D — Robot programlama dilleri

**D / Ortaokul**
- Blok tabanlı komutlarla robotu hareket ettirme
- Sıralı komut, tekrar, koşul

**D / Lise**
- Python ile komut dizisi yazma
- Hareket komutları: eklem hareketi ve doğrusal hareket
- Koordinat girme, hız ve bekleme

**D / Üniversite**
- ABB RAPID: yapı, `MoveJ` / `MoveL`, hedef tanımlama, iş nesnesi
- KUKA KRL: temel yapı ve farkları
- Mecademic: TCP/IP üzerinden komut dizisi, Python API
- Fanuc TP ve karşılaştırmalı bakış
- Çevrim dışı programlama (offline programming) mantığı
- ROS 2 temelleri: düğüm, konu (topic), servis; robotik yazılımının ortak dili

---

## Hat E — Haberleşme ve entegrasyon

**E / Ortaokul**
- Robotlar birbirleriyle ve makinelerle nasıl "konuşur"
- Sinyal kavramı: var / yok

**E / Lise**
- Dijital giriş-çıkış (I/O), sinyal zamanlaması
- El sıkışma (handshake) mantığı: "hazırım" / "aldım"
- Neden zamanlama önemlidir

**E / Üniversite**
- TCP/IP soket haberleşmesi, komut-yanıt döngüsü
- Endüstriyel protokoller: EtherCAT, PROFINET, EtherNet/IP
- Gerçek zamanlılık, döngü süresi (cycle time), jitter
- PLC ile robot entegrasyonu, kim usta kim köle (master/slave)
- Hata durumları: zaman aşımı, bağlantı kopması, güvenli durma

---

## Hat F — Algılama: sensör ve görü

**F / Ortaokul**
- Robot nasıl "görür": kamera ve sensör türleri
- Neden robotun gözü olmadan iş yapması zordur

**F / Lise**
- Kamera görüntüsünden konum bulma: piksel ile milimetre ilişkisi
- Basit eşikleme ve nesne bulma
- Ölçek ve perspektif hatası

**F / Üniversite**
- Kamera kalibrasyonu: iç ve dış parametreler
- El-göz kalibrasyonu (hand-eye calibration)
- Lazer profil sensörü ile yüzey tarama: çalışma prensibi
- Nokta bulutu (point cloud) ve yüzey muayenesi iş akışı
- Tarama yolu üretimi: bir yüzeyi eksiksiz taramak için robot nasıl hareket etmeli
- Ölçüm belirsizliği ve tekrarlanabilirlik

---

## Hat G — Simülasyon ve dijital ikiz

**G / Ortaokul**
- Simülasyon nedir, neden gerçeğinden önce denenir

**G / Lise**
- Basit sahne kurma: robot, masa, engel
- Simülasyonda deneme yanılma yapmanın maliyeti neden sıfırdır

**G / Üniversite**
- URDF ile robot modelleme
- PyBullet ile sahne kurma ve fizik
- Dijital ikiz kavramı ve sınırları
- Sim-to-real farkı: simülasyonda çalışıp gerçekte çalışmayan şeyler
- Çevrim dışı programın doğrulanması

---

## Hat H — Güvenlik ve endüstriyel gerçeklik

**H / Ortaokul**
- Robotlar neden tehlikeli olabilir, temel güvenlik kuralları

**H / Lise**
- Kafesli robot ile işbirlikçi robot (kobot) farkı
- Acil durdurma, hız sınırlama, güvenli bölge

**H / Üniversite**
- ISO 10218 ve ISO/TS 15066: ne söylerler
- Risk değerlendirmesi nasıl yapılır
- Performans seviyesi (PL) ve kategori (Category) ne demek; gerekli
  seviyenin (PLr) risk değerlendirmesinden türetilmesi. ISO 10218'in 2011
  baskısındaki blok "PL d + Kategori 3" şartı 2025 revizyonunda büyük
  ölçüde terk edildi; yerine her güvenlik fonksiyonu için ayrı, riskine
  göre belirleme geldi — ders bu yöntem değişimini anlatır, sayısal
  tabloları değil (birincil metinler ücretli erişim arkasında)
- Güç ve kuvvet sınırlama (power and force limiting)
- Güvenli izlemeli duruş, hız ve mesafe izleme
- Bir hücre nasıl güvenli tasarlanır

---

## Ders yapısı (her ders aynı iskelet)

1. **Kanca** — bir soru veya şaşırtıcı gözlem (2-3 cümle)
2. **Etkileşimli sahne** — oku demeden önce oynat
3. **Açıklama** — ne olduğunu anlat, seviyeye uygun derinlikte
4. **Gerçek dünya** — bu kavram hangi robotta, nasıl karşımıza çıkar
5. **Alıştırma** — 2-4 soru veya görev, anında geri bildirim
6. **Sonraki adım** — ilgili dersler, bir üst seviye

## Ön koşul zinciri

Her ders frontmatter'ında `onkosul:` listesi tutar. Platform bunu okuyup
"bunu anlamak için önce şunu gör" bağlantısı gösterir. Bir ders en fazla
3 ön koşula sahip olmalı; daha fazlası dersin çok büyük olduğunu gösterir.
