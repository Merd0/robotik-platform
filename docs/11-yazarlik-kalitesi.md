# Yazarlık kalitesi ve deneyim çeşitliliği

Kalite denetimlerimizin hiçbiri bunu ölçmedi: hepsi DOĞRULUK'a baktı
(kaynak doğru mu, formül doğru mu). Bu dosya farklı bir eksen: İLGİ
ÇEKİCİLİK. Doğru ama sıkıcı bir ders de başarısızlıktır.

Bakım geri bildirimindeki temel sorun: "yazılar çok yapay chatgpt genel... hep aynı 3
eklem 6 eklem kullanılmış, koymak için koyulmuş... çok tek düze... dark
plan da olsun beyaz gözü yoruyor."

---

## 1. Dark mode — ilk yap, net ve mekanik

Şu an sadece açık (beyaz) tema var. Koyu tema ekle:
- Sistem tercihine göre varsayılan (prefers-color-scheme), + manuel
  toggle (header'da, ay/güneş ikonu).
- docs/07-tasarim-sistemi.md'deki üç seviyeli renk ailesi (ortaokul
  canlı, üniversite sade) dark modda da korunmalı — sadece zemin/metin
  tersine dönmüyor, her iki modda da aynı "kişilik" hissi olmalı.
- Kontrast: dark modda da WCAG AA (docs/07'nin "pazarlıksız" dediği
  kural). Özellikle 3D sahnelerin arka planı ve iz çizgisi rengi dark
  modda görünür kalmalı — sınamadan geçme.
- Tercih localStorage'a yazılsın (sunucuya gitmesin, docs/05'teki
  "veri toplanmaz" ilkesi).

## 2. Yazı tonu — "yapay/ChatGPT gibi" hissi

Mert'in dediği şey gerçek ve isim verilebilir bir problem: LLM-üretimi
metin, belirli kalıplara yaslanır (bkz. docs/04'teki "kanca çeşitliliği"
bölümü — aynı sorun orada da vardı, kancada çözüldü ama gövde metinde
hâlâ var).

Somut kontrol listesi — her dersin AÇIKLAMA ve GERÇEK DÜNYA
bölümlerinde ara:
- Formülcü geçiş cümleleri: "Bu bizi şu soruya getirir:", "Şimdi gelelim
  ...'a", "Peki ... nasıl olur?" — bunlar bilgi taşımıyor, dolgu.
  Kaldır, direkt söyle.
- Gereksiz özetleyici cümleler: bir paragraf zaten söylediği şeyi
  "Kısacası..." diye tekrar özetliyorsa, o cümle gereksiz.
- Aşırı dengeli/nötr ton: her cümle aynı uzunlukta, aynı ciddiyette
  ilerliyorsa (insan yazımında olmayan bir düzgünlük) — cümle
  uzunluğunu bilerek çeşitlendir, bazen kısa/çarpıcı, bazen daha uzun.
- Boş sıfatlar: "önemli", "ilginç bir şekilde", "dikkat çekici" gibi
  kelimeler kendi başına bilgi taşımıyor — ya somut bir şey söyle
  (neden önemli, ne kadar ilginç) ya da kaldır.
- docs/04'teki dil kurallarını (kısa cümle, sen dili, pasif çatıdan
  kaçınma) yeniden, bu sefer GÖVDE metnine uygulayarak tara — şu ana
  kadar bu kurallar çoğunlukla kancaya uygulandı, gövdeye tam
  uygulanmamış olabilir.

Yöntem: Her dersi yüksek sesle okur gibi tara (docs/04'ün kendi
kuralı zaten bu — "yüksek sesle oku, takıldığın cümle yeniden
yazılmalı"). Otomatik bir "daha iyi yaz" komutu değil, gerçek bir
editoryal geçiş yap.

## 3. Örnek çeşitliliği — EN ÇOK VURGULANAN ŞİKAYET

Mert'in netleştirdiği nokta: hep aynı senaryo/robot kullanılıyor
("3 eklem, 6 eklem hep aynı, koymak için konulmuş"). Farklı robotlar,
farklı sektörler istiyor.

Somut yönler:
- Şu an muhtemelen çoğu örnek jenerik "2-DOF kol" veya soyut sayılar
  kullanıyor. Bunun yerine gerçek, isimli bağlam kullan: otomotiv
  kaynak hattı, gıda paketleme, ilaç dolum hattı, elektronik montaj,
  depo/lojistik (AGV), tarım robotu, cerrahi robot — konuya göre
  değişen, somut bir sektör/senaryo.
- Aynı hat (örn. Hat B) içinde ardışık derslerde aynı senaryo tekrar
  etmesin — tıpkı kanca çeşitliliği kuralı gibi, senaryo çeşitliliği de
  komşu derslere bakılarak kontrol edilsin.
- Somutluğu kişisel işyeri veya staj ayrıntılarından değil; kamuya açık üretici
  dokümanı, akademik çalışma ya da açık eğitim senaryosundan kur. Şirket içi
  proje, ekipman envanteri ve kişisel çalışma geçmişi ders bağlamı değildir.
  İsimli bir robot veya sensör kullanılıyorsa teknik iddiaları birincil kaynağa
  bağla; kaynak yoksa vendor-neutral bir senaryo kullan.
- Sayısal değerler: aynı 2-DOF kol hep aynı a1=1.0/a2=0.8 gibi sabit
  değerlerle mi anlatılıyor? Ders ders farklı, gerçekçi ölçek/birim
  kullan (mm yerine bazen m, farklı bağlantı uzunlukları) — ama
  fixture'larla senkron kalmalı, uydurma sayı yazma, gerçekten
  hesaplanmış olsun.

## 4. İnteraktif çeşitliliği ve derinliği

Şu an her derste muhtemelen benzer bir kaydırıcı/sahne kalıbı
kullanılıyor. Nerede genişletilebilir, değerlendir:
- Aynı bileşen (örn. JointSliders) art arda derslerde hiç varyasyonsuz
  mu kullanılıyor? Aynı bileşenin farklı mode/prop kombinasyonlarıyla
  (docs/05'teki "seviyeye göre doz" ilkesi gibi) daha çeşitli
  hissettirilip hissettirilemeyeceğine bak.
- docs/05'teki "görev tipleri" tablosunu (Ulaş / Kaçın / Optimize et /
  Tahmin et / Kır / Yaz) hatırla — dersler bu altı tipin sadece 1-2'sini
  mi kullanıyor? Kullanılmayan görev tiplerini nerede ekleyebileceğini
  değerlendir.
- Yeni bileşen İCAT ETME (docs/08'deki MDX allowlist kuralı — yeni
  bileşen ayrı, sıkı bir inceleme gerektirir). Var olan bileşenlerin
  prop'larını daha zengin/çeşitli kullanmaya odaklan.

## Yöntem ve kapsam

- ÖNCE bir örnekleme yap: her hattan (A-H) 2-3 ders seçip yukarıdaki 4
  maddeye göre elden geçir, sonucu göster (önce/sonra karşılaştırması).
  Mert'in onayı olmadan 89 dersin TAMAMINI değiştirme — bu bir zevk/ton
  meselesi, otomatik toplu uygulama riskli.
- İçerik/formül/kaynak DEĞİŞMEYECEK — sadece anlatım tonu, senaryo
  bağlamı ve (varsa) interaktif zenginliği değişecek. docs/06'daki
  kaynak zorunluluğu burada da geçerli: yeni bir sektör/senaryo
  eklerken teknik bir iddia da ekliyorsan (örn. "ilaç dolum hattında
  tolerans X mm'dir" gibi somut bir sayı), o iddia da kaynak ister —
  kaynak bulamıyorsan sadece bağlam/isim değiştir, teknik detay
  uydurma.
- Kendi branch'inde çalış (codex-yazarlik-cesitlilik). Test/build
  çalıştır. Main'e merge etme.
- Örnekleme sonucunu docs/durum-codex.md'ye ekle, Mert'in gözden
  geçirmesini bekle.
