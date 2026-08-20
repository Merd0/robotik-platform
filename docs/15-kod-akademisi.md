# Kod Akademisi — bağımsız kod eğitim bölümü

## Bu ne, ne değil

/kod-akademisi — sitenin beşinci ana bölümü, Canlı lab ve Oyun alanı
ile aynı seviyede, navbar'da ayrı bir giriş. Hat D'ye eklenen 5 Python
dersi (docs/03'teki mevcut iş) kalıyor, dokunulmuyor — onlar "bir
kavramı Python'la göster" amaçlı, müfredatın parçası. Kod Akademisi
farklı bir şey: kodlamayı sıfırdan, aşama aşama, alıştırarak öğreten,
bağımsız bir müfredat. Robotik bağlamı hep korunuyor (docs/00'ın
temel ilkesi), ama amaç robotik kavramı değil, kodlama becerisi.

Analoji: Hat D'deki dersler "bu kavramı anlamak için biraz Python
göreceksin." Kod Akademisi "Python'u robotikle öğreneceksin, baştan
sona." İkisi farklı amaçlara hizmet ediyor, çakışmıyor.

## Seviye yapısı

Mevcut ortaokul/lise/üniversite üçlüsünü tekrarlamıyoruz — kodlama
becerisi yaş grubuna değil, önbilgiye bağlı. Dört aşama:

1. Temel — hiç kod yazmamış biri için. Değişken, fonksiyon çağrısı,
   parametre. Sadece hazır kodu ufak değiştirme (mevcut Hat D dersleri
   gibi).
2. Orta — döngü, koşul, liste. Küçük boşlukları doldurma (tam kod
   yazımı değil, "şu satırı tamamla" türü).
3. İleri — fonksiyon tanımlama, birden fazla kavramı birleştirme.
   Kısmi serbest yazım: iskelet verilir, kullanıcı mantığı yazar.
4. Usta — sıfırdan yazım. Bir görev tarif edilir (örn. "üç noktayı
   sırayla ziyaret eden bir hareket yaz"), kullanıcı komple kod yazar.
   Değerlendirme davranış bazlı (robotun doğru yere gitmesi), string
   eşleşmesi değil.

Her aşama kendi içinde birkaç modül/ders içerir (toplam sayı bu plan
aşamasında sabitlenmiyor — içerik üretimi ayrı bir iş, önce iskelet).

## Alıştırma modeli — "bazen yaz" nasıl çalışır

Üç alıştırma tipi, aşama arttıkça ağırlığı değişir:

- Gözlem (Temel'de baskın): hazır kod çalıştırılır, sonuç izlenir.
- Değiştir (Temel→Orta): bir/birkaç değeri veya satırı değiştir.
- Tamamla (Orta→İleri): kod parçalı verilir, boşluk doldurulur.
- Yaz (İleri→Usta): görev tarif edilir, kullanıcı sıfırdan yazar.

Değerlendirme her zaman davranışsal: "kod tam olarak şöyle mi
yazıldı" değil, "robot doğru yere gitti mi / doğru sırayla mı hareket
etti mi" — mevcut Evidence/predicate sistemiyle aynı felsefe.

## Yardım sistemi — kademeli, sabit, sunucusuz

Karar (2026-08 tarihli, kalıcı): AI destekli canlı yardım YOK.
Gerekçe: site mimarisi tamamen statik/sunucusuz (docs/02); AI yardımı
gerçek bir backend, API maliyeti, ve kullanıcı kodunun sunucuya gitmesini
gerektirir — bu docs/05'teki "hiçbir şey sunucuya gitmez" ilkesini
kırar, hedef kitlede çocuklar var. Bu fikir docs/fikirler.md'de "uzak
vadeli, mimari karar gerektirir" olarak saklı duruyor, bugün
uygulanmıyor.

Bunun yerine: üç kademeli, önceden yazılmış ipucu sistemi.

- İpucu 1 — yönlendirici soru: çözümü söylemez, doğru yöne
  düşündürür. ("Robotun kaç eklemi var, listede kaç sayı olmalı?")
- İpucu 2 — hangi araç: hangi komut/yapıya bakması gerektiğini
  söyler. ("Bunun için bir for döngüsü kullanabilirsin.")
- İpucu 3 — neredeyse çözüm: büyük ölçüde doğru yönlendirir ama
  son adımı kullanıcıya bırakır.
- Çözümü göster (opsiyonel, kullanıcı seçerse): tam çözüm + açıklama.

İpuçları buton butona açılır (hepsi baştan görünmez), her açılış
kullanıcının kararı. Bu, gerçek kodlama eğitim sitelerinin (freeCodeCamp
vb.) kanıtlanmış yöntemi — iyi yazılırsa AI'sız da güçlü hissettirir.

İçerik üretim yükü: her alıştırma için 3 ipucu + 1 çözüm yazılması
gerekiyor — bu, ders yazım sürecinin doğal bir uzantısı, mevcut
docs/04'teki disiplinle aynı.

## Yerleşim gereksinimi — kod, sonuç ve sahne AYNI ANDA görünmeli

Mevcut CodeRunner'da (Hat D dersleri) tespit edilen gerçek bir sorun:
kod editörü, çalıştırma izi (trace scrubber) ve 3D robot sahnesi dikey
olarak alt alta diziliyor — kullanıcı bir satırı değiştirip sonucu
görmek için sürekli yukarı/aşağı kaydırmak zorunda kalıyor. Bu,
platformun temel felsefesini (docs/00: "tahmin et, çalıştır, farkı
gör") zayıflatıyor; yazdığı kodla robotun tepkisi arasındaki bağ
kaydırma sırasında kopuyor.

Kod Akademisi'nde bu baştan doğru kurulmalı:

- Masaüstü (geniş ekran): yan yana bölünmüş görünüm — sol tarafta
  kod editörü + çalıştır/sıfırla + ipucu paneli, sağ tarafta 3D sahne +
  çalışma izi + çıktı konsolu üst üste ama SABİT (kod kaydırılsa bile
  sahne/sonuç görünür kalır — sticky/pinned panel).
- Mobil (dar ekran): yan yana sığmaz, bunun yerine SEKME (tab)
  yapısı: "Kod" / "Sonuç" iki sekme, tek dokunuşla geçiş — kaydırma
  yerine anlık geçiş. Çalıştırma sonrası otomatik "Sonuç" sekmesine
  geçilebilir (kullanıcı sonucu görmek için elle aramaz).
- Çalışma izi (trace scrubber) her zaman sahneyle birlikte, aynı
  görünür alanda kalmalı — θ1/θ2 gibi canlı değerler kod ile eş zamanlı
  okunabilmeli.

Bu gereksinim sadece Kod Akademisi'ne özel değil — mevcut CodeRunner
kullanan Hat D derslerine de retrofit edilmesi gereken bir iyileştirme.
Ama şimdi yalnız Kod Akademisi'nde doğru kurulacak; mevcut derslere
uygulama ayrı, sonraki bir görev (docs/fikirler.md'ye not düşülür).

## Teknik yaklaşım

- Mevcut CodeRunner/pyodideWorker/pythonBridge.ts altyapısı aynen
  kullanılır — yeni bir çalıştırma motoru gerekmiyor.
- Yeni olan: modül/aşama navigasyon yapısı, ilerleme takibi (mevcut
  Evidence sistemiyle aynı localStorage yaklaşımı — hesapsız), ipucu
  UI bileşeni.
- "Yaz" tipi alıştırmalar için davranışsal değerlendirme: mevcut
  predicate mimarisi (docs/06, lib/evidence.ts) genişletilir, yeni bir
  doğrulama sistemi icat edilmez.
- Robot bağlamı korunur — alıştırmalar hep bir robotik senaryosu
  içinde (docs/00'ın temel ilkesi, "soyut örnek yok").

## Kapsam sınırları (v1)

Yapılmayacaklar (docs/fikirler.md'ye not düşülür, bu faz değil):
- AI destekli yardım/geri bildirim
- Kullanıcı hesabı, sunucu tarafı ilerleme senkronu
- Diğer programlama dilleri (sadece Python)
- Sertifika/rozet sistemi (docs/05'in "dışsal ödül" karşıtı ilkesi)
- Sosyal/paylaşım özellikleri bu fazda değil (ileride Sprint 2'deki
  labState deseniyle eklenebilir, şimdi değil)

## Sıradaki adım

Bu plan onaylandıktan sonra: önce iskelet + Temel aşamasının ilk 2-3
modülü ile bir dikey dilim kurulur (tüm sistemin uçtan uca çalıştığı
kanıtlanır), sonra içerik genişletilir. Büyük patlama (tüm 4 aşamayı
tek seferde yazmak) YAPILMAZ — bu projenin genelindeki disiplin.

## Ek alıştırma türleri (2026-08 kararı)

Mevcut 4 alıştırma tipine (Gözlem/Değiştir/Tamamla/Yaz) ek olarak üç yeni
desen:

- Açıkla-sonra-uygula: kod editörü boş açılır, önce komutun ne yaptığı
  sözle anlatılır, sonra doğal dilde bir görev verilir ("şu açılara
  getir"), kullanıcı kodu sıfırdan yazar. İpuçları sözdizimine odaklı
  (hangi komut, kaç parametre, sözdizimi). Değiştir ile Tamamla arasına
  oturur.
- Hata avcılığı: başlangıç kodu bilerek bozuk (yaygın hata türü — eksik
  parametre, yanlış değişken, ters koordinat). Görev: bul ve düzelt.
  Birden fazla doğru düzeltme olabilir, string eşleşmesi DEĞİL, davranışsal
  değerlendirme. Worker seviyesindeki temiz hata mesajı sistemine dayanır
  (bkz. son düzeltme).
- Modül sonu "neden" sorusu: mevcut Quiz bileşenini modül sonuna ekle,
  sayı değil kavrayış ölçen sorular. docs/06'daki kural korunur: Quiz
  tek başına "geçti" üretmez, biçimlendiricidir.

Bununla birlikte alıştırma modeli artık 6 tip: Gözlem / Değiştir /
Tamamla / Yaz / Açıkla-sonra-uygula / Hata avcılığı. Bir modülün hangi
tipi kullanacağı aşamaya (yukarıdaki dört aşama) ve o modülün öğrettiği
kavrama göre seçilir — aynı aşamada modüller art arda aynı tipte
olmamalı (04-icerik-rehberi.md'deki kanca çeşitliliği ilkesiyle aynı
mantık: bir kalıbın art arda tekrarı öğrenciye "hep aynı numara"
hissi verir).

## Uzlaştırma: docs/guncel-fikirler.md §13 ile birleşik plan (2026-08-19 kararı)

`docs/guncel-fikirler.md` §13 ("Altı ayrıntılı kod laboratuvarı"), bu
dosyadan BAĞIMSIZ yazılmış, uygulanmamış bir alternatif plandı. İki
plan arasında bir kapsam kararı gerekiyordu (bkz. `docs/fikirler.md`
"Kod Akademisi — iki plan arasında uzlaştırma kararı" notu). Karar:

**İkisi aynı şey değil, birleştirilemez — farklı hedefe hizmet ederler.**
§13'teki 6 laboratuvar (Lab 1–6), Kod Akademisi'nin genel "Python'u
sıfırdan öğret" ilerleme hattı değil; her biri BELİRLİ bir mevcut hat
dersine bağlı, davranışsal hata ayıklama derinleştirmesi:

| Lab | Bağlı olduğu ders/hat | Neden Kod Akademisi değil |
|---|---|---|
| Lab 1 | `d-ortaokul-sirali-tekrar-kosul` (Hat D) | Blok programlama, belirli bir Hat D dersinin dikey pilotu |
| Lab 2 | `d-lise-python-komut-dizisi` (Hat D) | Belirli bir Hat D dersinin hata ayıklama harness'i |
| Lab 3 | `d-universite-ros2-temelleri` (Hat D) | ROS 2'ye özel, Hat D kapsamında |
| Lab 4 | `a-universite-homojen-donusum` (Hat A) | NumPy/çerçeve zinciri, Hat A kinematiğine bağlı |
| Lab 5 | `b-universite-ters-kinematik` (Hat B) | DLS IK hata ayıklama, Hat B'ye bağlı |
| Lab 6 | `c-universite-carpisma-kontrolu` (Hat C) | Planlayıcı/çarpışma, Hat C'ye bağlı |

Kod Akademisi (docs/15) ise kasıtlı olarak hattan bağımsız: "Bu ne, ne
değil" bölümündeki ayrım burada tekrar geçerli — Hat dersleri "bir
kavramı Python'la göster", Kod Akademisi "Python'u baştan öğret".
§13'ün 6 laboratuvarını Kod Akademisi'ne taşımak bu ayrımı bozar ve
güncel görev kapsamının dışına çıkar ("Hat D derslerine, diğer hatlara
dokunma" kısıtı) — bu yüzden **taşınmadı**, `docs/fikirler.md`'de
kendi başlığı altında, Hat bazlı bir gelecek fazı olarak duruyor.

**Taşınan şey mimari değil, PEDAGOJİK DESEN.** §13'ün her lab'ı aynı
iskeleti kullanıyor: önce tahmin/oku, sonra çalıştır, sonra kırık bir
şeyi düzelt, çoklu senaryoda (seed/dal) davranışsal doğrula, "kaldırılırsa
kayıp" ile neden önemli olduğunu gerekçelendir. Bu desen zaten Kod
Akademisi'nin **Hata avcılığı** tipiyle örtüşüyor (bkz. yukarıdaki
`koda-orta-hata-avcisi`) — aşağıdaki müfredat planında Orta/İleri/Usta
modülleri bu deseni genişletiyor: tek hata yerine bazen çok adımlı
mantık hatası, tek poz yerine bazen çoklu senaryo (örn. iki farklı
başlangıç durumu) davranışsal olarak sınanıyor. Bu, docs/15'in zaten
kurulu mimarisi (tek modül hash'i, `poseMatches` tabanlı predicate,
route yapısı) İÇİNDE yapılıyor — yeni bir test/worker/evidence çekirdeği
icat edilmiyor, tıpkı §13'ün kendisinin de vaat ettiği gibi ("mevcut
predicate mimarisi genişletilir").

## Müfredat planı — Orta/İleri/Usta (2026-08-19)

Temel aşaması dikey dilimle tamamlandı (4 modül). Aşağıdaki plan,
kalan üç aşamayı dolduruyor. Robot tutarlılık için `generic-2dof`
üzerinde kalıyor (mevcut 5 modülün hepsi bunu kullanıyor); yeni bir
robot tanımı bu plana dahil değil.

**Orta** (döngü, koşul, liste — küçük boşluk doldurma ağırlıklı,
Tamamla/Değiştir baskın, ara sıra Açıkla-sonra-uygula/Hata avcılığı):

1. `koda-orta-hata-avcisi` — var (eksik parametre). Hata avcılığı + Quiz.
2. `koda-orta-donguyle-uc-nokta` — `for` döngüsüyle 3 noktayı sırayla
   ziyaret et; döngü gövdesi eksik (Tamamla).
3. `koda-orta-liste-ile-aci-dizisi` — açı listesi index'leme, yanlış
   index'in ne kırdığını gözlemle (Değiştir).
4. `koda-orta-kosul-ile-dal` — `if/else` ile `get_tcp()` sonucuna göre
   iki farklı hedefe dallan (Tamamla).
5. `koda-orta-donguyle-liste-birlikte` — döngü + liste birlikte, N
   noktalık bir rotayı bir liste üzerinden gez (Açıkla-sonra-uygula).
6. `koda-orta-degisken-golgeleme` — döngü değişkeninin dışarıdaki bir
   değişkenle karıştırılması hatası (Hata avcılığı + Quiz).

**İleri** (fonksiyon tanımlama, kavramları birleştirme, kısmi serbest
yazım — iskelet verilir, kullanıcı gövdeyi yazar):

1. `koda-ileri-fonksiyon-tanimla` — `def` iskeleti verilir, gövde
   eksik; parametreyi kullanan bir hareket fonksiyonu yaz (Tamamla).
2. `koda-ileri-fonksiyonla-liste` — fonksiyon + döngü birleşimi, bir
   nokta listesini fonksiyona sararak gez (kısmi serbest yazım).
3. `koda-ileri-kosullu-fonksiyon` — fonksiyon içinde `if/else`,
   "hedef güvenli bölgede mi" kontrolü (Açıkla-sonra-uygula).
4. `koda-ileri-hata-avcisi` — fonksiyon parametre/gövde değişkeni
   karışıklığı (Hata avcılığı + Quiz).

**Usta** (sıfırdan yazım, davranışsal değerlendirme, editör boş açılır):

1. `koda-usta-uc-nokta-sirayla` — "Üç noktayı sırayla ziyaret eden bir
   hareket yaz" (docs/01-mufredat.md'deki örnekle aynı görev). Yaz.
2. `koda-usta-kosullu-hareket` — durum bilgisine göre (if/else +
   fonksiyon + liste, üç kavram birlikte) doğru hedefe git. Yaz.
3. `koda-usta-hata-avcisi-final` — çok adımlı, birden fazla küçük
   hatayı birlikte barındıran kod; hepsini bul ve düzelt (Hata avcılığı
   + Quiz, aşamanın kapanışı).

Bu üç aşamadaki toplam 12 yeni modül (Orta +5, İleri +4, Usta +3),
mevcut 5 modülle (Temel 4 + Orta 1) birlikte Kod Akademisi'ni 17
modüle çıkarır. Bu bir üst sınır değil, kuruluş taahhüdü — ileride
daha fazla modül eklenebilir, ama bu görev bu 18'i bitirmeyi hedefler.
Bir modül 3 denemeden sonra çözülemezse atlanır, `docs/durum-denetim.md`'ye
net not düşülür, sonraki modüle geçilir.

## İkinci derinlik turu (2026-08 kararı)

Üç yeni desen, mevcut 6 alıştırma tipine ek:

- Teşhis modu: modül, kod görünmeden önce gerçekçi bir log/hata çıktısı
  (traceback, sensör okuması, çalışma izi anomalisi) gösterir. Önce
  "ne oldu, neden" (Quiz ile, mevcut "neden" deseni), sonra kodu göster
  ve düzeltme iste (hata avcılığı deseni). İki var olan mekanizmanın
  birleşimi, yeni motor gerekmiyor.
- Kod incelemesi: 2-3 aday çözüm gösterilir (biri doğru, biri/ikisi
  incelikle şekilde yanlış veya verimsiz — okunabilirlik/performans
  farkı gibi). Kullanıcı en iyisini seçer VE nedenini kısaca işaretler
  (Quiz'in radio-select desenine benzer ama seçenekler kod bloğu).
  Yargı becerisi ölçer, tek doğru sözdizimi değil.
- Kişisel optimizasyon (rekabetsiz): "Yaz" tipi alıştırmalarda,
  kullanıcının çözümü geçtikten SONRA bilgilendirici bir metrik göster
  ("Çözümün: 4 satır, 6 robot hareketi") — geçme/kalma durumunu
  ETKİLEMEZ, sadece bilgi. Başkalarıyla kıyaslama YOK (docs/00'ın
  rekabetsizlik ilkesi), sadece kullanıcının kendi çözümü hakkında.

Ertelenenler (docs/fikirler.md'de dursun): zincirleme proje anlatısı
(az önce bitirdiğimiz senaryo çeşitliliği turuyla çelişiyor — komşu
modüllerin farklı bağlam kullanması bilinçli bir karardı, sürekli tek
anlatı bunu geri sarar; ileride YENİ bir aşamada, mevcut 17 modüle
dokunmadan denenebilir).

Uygulama: mevcut 17 modüle YENİ ÖRNEKLER olarak ekle (en az: 2 Teşhis
modu, 2 Kod incelemesi, ve mevcut Usta "Yaz" modüllerine kişisel
optimizasyon metriği retrofit). Var olan modüllerin predicate/behavioral
mantığına dokunma, sadece yeni modüller ekle veya (optimizasyon metriği
için) bilgilendirici bir ek katman koy.
