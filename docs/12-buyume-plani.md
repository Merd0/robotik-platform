# Büyüme ve olgunlaşma fazı — sonraki adımlar

Bu doküman, platformun içerik/altyapı iskeleti bittikten sonraki fazı
planlar: kalite, erişim, çeşitlilik, ve gerçek kullanıcı büyümesi.

## Öncelik sırası (etki/efor'a göre)

### Hemen — düşük efor, somut sorun

- **6 eksenli robot sahnesi ekrana sığmıyor.** Kamera auto-fit/zoom-to-fit,
  mobilde responsive ölçekleme, varsayılan kamera açısı gözden geçirilsin.
  Etkilenen tüm 6-DOF sahneler taranıp aynı düzeltme uygulanmalı.
- **Review makbuzu sistemini akıllandırma.** Mert tek tek 89 dersi
  okumayacak — bunun yerine örnekleme + otomatik denetim + "makbuz"
  sisteminin kendisini güçlendirme. Amaç: az insan efor, yüksek güven.

### Yakın vade — orta efor, doğrudan kullanıcı deneyimini iyileştirir

- **İçerik kalitesi turu** (devam ediyor — Codex'in yazarlık/çeşitlilik
  işi, docs/11'deki kapsam).
- **Oyun alanı / serbest deney modu** — docs/05'te zaten planlanmıştı,
  henüz yapılmadı. Ders dışı, hesap gerektirmeyen, "sadece dene" sayfası.
  Muhtemelen en çok paylaşılan sayfa olur (docs/05'in kendi tahmini).
- **Küçük araçlar:** DH parametresi hesaplayıcı, açı/birim çevirici,
  robot karşılaştırma tablosu. Ders içeriğinden bağımsız, tek başına
  değerli, düşük bakım yükü.

### Orta vade — daha büyük efor, dikkatli planlama ister

- **50 taslak dersin yayına açılması** — review sisteminin akıllandığı
  senaryoda mümkün olur. Hat H (güvenlik) hâlâ en temkinli ele alınması
  gereken kısım.
- **Ders çeşitliliği/sayısı** — mevcut 89'un review'ı bitmeden yeni ders
  eklemek önerilmez (üstüne üstüne borç birikir). Öncelik sırası:
  önce var olanı aç, sonra genişlet.

### Uzak vade — büyük efor veya belirsiz getiri, dikkatli değerlendirilmeli

- **SEO derinleştirme** — temel zaten var (sitemap, robots.txt), içerik
  arttıkça organik trafik potansiyeli büyür.
- **Öğretmen kullanımı** — docs/fikirler.md'de zaten not edilmiş
  ("öğretmen paneli"). Gerçek talep var mı önce küçük ölçekte test
  edilmeli (örn. birkaç öğretmene manuel ulaşıp geri bildirim almak),
  büyük özellik yatırımından önce.
- **Blog/haber içeriği** — düşük öncelik, sürekli bakım yükü yüksek,
  platformun asıl gücü (etkileşimli ders) değil.
- **Forum/topluluk özellikleri** — docs/05'teki bilinçli karara
  (moderasyon yükü, hedef kitlede çocuklar var) aykırı, önerilmiyor.

## Sıradaki somut adım

İki paralel iş başlatılabilir, birbirini engellemez:
1. Codex → 6-DOF ekran sığdırma düzeltmesi (hemen, düşük risk)
2. Claude Code → review makbuzu sisteminin nasıl akıllandırılacağını
   tasarlamak (örnekleme + otomatik denetim + makbuz üretimi akışı)
