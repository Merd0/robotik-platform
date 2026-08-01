# Robotik Öğrenme Platformu

Robotiği tarayıcıda oynayarak öğreten, ortaokuldan mühendis seviyesine kadar
kademeli ilerleyen, açık ve ücretsiz bir Türkçe kaynak.

Planlama dokümanları — çalışmaya başlamadan önce oku:
- @docs/00-vizyon.md — ne yapıyoruz, ne yapmıyoruz
- @docs/01-mufredat.md — 8 konu hattı, 3 seviye
- @docs/02-mimari.md — teknik kararlar ve değişmez sözleşmeler
- @docs/03-yol-haritasi.md — fazlar ve görev listesi
- @docs/04-icerik-rehberi.md — ders nasıl yazılır
- @docs/05-deneyim-ve-guvenlik.md — eğlence tasarımı, gizlilik, güvenlik, hız hedefleri
- @docs/06-kalite-ve-topluluk.md — içerik doğrulama süreci, açık kaynak ilkesi
- @docs/07-tasarim-sistemi.md — görsel kimlik, tipografi, mobil uyarlama yolu
- @docs/08-guvenlik-sertlestirme.md — tedarik zinciri, PR güvenliği, HTTP başlıkları
- @docs/09-ai-muhendisligi.md — katmanlı CLAUDE.md, subagent/hook/skill planı, faz faz devreye alma

## Değişmez kurallar

- **İçerik koddan ayrı.** Ders eklemek `content/` altına MDX dosyası eklemektir.
  Ders metnini asla React bileşenine gömme.
- **Hesaplama tarayıcıda.** Etkileşimli matematik TypeScript'te, `lib/robotics/`
  altında. Sunucuya istek atma.
- **Her ders `kaynaklar` alanı dolu olmadan `durum: yayinda` olamaz.**
  Bu bir gizlilik koruması, atlanamaz.
- **Yapay zeka üretimi bir ders, insan gözden geçirmesi olmadan yayınlanamaz.**
  `incelendi_tarafindan` ve `incelendi_tarih` alanları dolu olmalı. Bu proje
  "yapay zeka her şeyi yazdı, güvenip yayınladık" olmayacak — bkz.
  `docs/06-kalite-ve-topluluk.md`.
- **Proje en baştan açık kaynak.** Sonradan açılan bir repo değil.
- `lib/robotics/` içine asla `window`, `document`, veya React'e özel import
  girmez — ileride mobil (React Native) portu için bu katman saf kalmalı.
- Jenerik "yapay zeka sitesi" görünümünden kaçın (bej+serif, siyah+asit yeşili,
  gazete-tipi gibi kalıplar). Görsel kimlik `docs/07-tasarim-sistemi.md`'de
  tanımlı: seviyeyle olgunlaşan renk ailesi, mühendislik çizimi + canlı
  hareket karşıtlığı, tek imza öğesi (iz çizgisi).
- Yeni bağımlılık eklemeden önce `docs/08-guvenlik-sertlestirme.md`'deki
  PR kontrol listesini uygula. `package-lock.json` her zaman commit edilir.
- İçerikte sadece önceden tanımlı `components/interactive/` bileşenleri
  kullanılır; MDX kendi bileşenini icat edemez.
- Bağlam verimliliği: bu dosyayı 200 satırın altında tut. Sadece belirli bir
  klasörde geçerli kurallar oraya (o klasörün kendi `CLAUDE.md`'sine) gider,
  buraya değil. Detay: `docs/09-ai-muhendisligi.md`.
- `lib/robotics/` içindeki `RobotSpec`, `PlanResult`, `Planner` sözleşmeleri
  değiştirilmeden önce `docs/02-mimari.md` güncellenmeli.
- Kod ve değişken isimleri İngilizce; docstring, yorum ve tüm kullanıcı arayüzü
  metni Türkçe.
- Matematik kodu test edilmeden birleştirilmez. `reference-python/` altındaki
  fixture'lara karşı doğrula.
- Mobil ilk sınıf vatandaş. Her sahne dokunmatikle çalışmalı.
- **Kişisel veri toplanmaz.** Hesap, giriş, e-posta, çerez, üçüncü taraf
  izleyici yok. İlerleme sadece localStorage'da. Hedef kitlede çocuklar var;
  bu karar tartışmaya kapalı.
- Her ders bir görevle biter, soruyla değil. Kullanıcı okuduğunu değil
  yaptığını hatırlar.
- **Oyunlaştırma dozu seviyeyle azalır:** ortaokulda yüksek (oyun hissi),
  lisede orta (keşif hissi), üniversitede düşük (referans/araç hissi, sade
  ve ciddi ton). Alttaki etkileşim aynı kalır, üstteki çerçeveleme ve dil
  değişir. Detay: `docs/05-deneyim-ve-guvenlik.md` Bölüm 1.
- Etkileşimde gecikme 16 ms'yi geçerse o özellik bitmiş sayılmaz.

## Kod ve arayüz dili

Arayüz metinleri, hata mesajları, düğme etiketleri Türkçe ve cümle düzeninde
("Sıfırla", "Sonraki ders"), başlık düzeninde değil.

## Komutlar

```bash
npm run dev
npm run build
npm run test
npm run lint
npx tsx scripts/check-content.ts    # frontmatter ve kaynak doğrulaması
```

## Çalışma biçimi

- Rutin işlerde onay için durma: kod yaz, test et, commit at, devam et.
- Varsayılan tutum: kendi başına makul bir karar ver, kısaca not düş, devam
  et. Soru sormak istisna olmalı, alışkanlık değil.
- **Şunlar için ASLA sorma, kendin karar ver:** hangi kütüphane sürümü,
  hangi font/renk tonu (docs/07'deki ilkelere uy, tam hex değeri kendin seç),
  değişken/dosya isimlendirmesi, klasör içi düzenleme, hangi test
  framework'ü, hata mesajı metni, küçük UI detayları, hangi npm paketi
  (docs/08'deki minimum bağımlılık ilkesine uy, seç ve devam et).
- **Sadece şu 4 durumda dur ve sor:** (1) `RobotSpec`/`PlanResult`/`Planner`
  gibi docs/02'deki çekirdek sözleşmelerden birini değiştirmen gerekiyorsa,
  (2) docs/03'teki mevcut faz listesine yeni bir madde/kapsam eklenecekse,
  (3) geri alınamaz bir işlem varsa (dosya/klasör silme, force push),
  (4) iki seçenek de makul ve sonuçları gerçekten farklıysa (ör. "3D
  kütüphanesi X mi Y mi" gibi, "hangi hex tonu" gibi değil).
- Bir fazı (docs/03-yol-haritasi.md içindeki bir başlık) bitirince dur,
  3-4 cümleyle özetle.
- Yeni fikirler `docs/fikirler.md` dosyasına yazılır, mevcut faza sokulmaz.