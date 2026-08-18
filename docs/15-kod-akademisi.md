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
