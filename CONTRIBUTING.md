# Katkı rehberi

Bu proje ilk commit'inden beri açık kaynak ve dış katkıya açık yapıda kuruldu
(bkz. `docs/06-kalite-ve-topluluk.md` §2). Bu dosya, o yapıyı resmi bir sürece
bağlar: ne katkı yapabilirsin, hangi kapılardan geçer, ne zaman birleştirilir.

Kısa hâli: **ders eklemek dosya eklemektir**, kod yazmak değil. Bir dersin
yayınlanması içinse üç kapı var ve üçü de atlanamaz.

---

## Ne tür katkı yapabilirsin

| Tür | Nereye | Ne kadar inceleme |
|---|---|---|
| Yeni ders / mevcut dersi düzeltme | `content/<hat>/<seviye>/<id>.mdx` | İçerik kapısı (aşağıda) |
| Sözlüğe terim | `content/sozluk.json` | Hafif — kaynak/tanım kontrolü |
| Yeni etkileşimli bileşen | `components/interactive/` | **Sıkı** — kod incelemesi + içerik kapısı ayrı ayrı |
| Robotik matematiği | `lib/robotics/` | Test zorunlu, fixture'a karşı doğrulama |
| Hata düzeltme / altyapı | herhangi | Normal kod incelemesi |
| Yeni fikir | `docs/fikirler.md` | Tartışma; mevcut faza sokulmaz |

Yeni bir konu hattı veya faz kapsamı önerisi önce bir issue olarak açılmalı —
doğrudan PR gönderme.

---

## Başlamadan önce oku

Uzun görünüyor ama hepsini okuman gerekmiyor; yaptığın işe göre:

- **Her katkıcı:** `CLAUDE.md` (kök) — projenin değişmez kuralları.
- **Ders yazacaksan:** `docs/04-icerik-rehberi.md` (şablon, seviye
  kalibrasyonu, kanca çeşitliliği, kaynak kuralı) ve `content/CLAUDE.md`.
- **Kod yazacaksan:** `docs/02-mimari.md` (değişmez sözleşmeler) ve
  `docs/08-guvenlik-sertlestirme.md` (bağımlılık ve PR güvenlik listesi).
- **Tasarıma dokunacaksan:** `docs/07-tasarim-sistemi.md`.

---

## Yerel kurulum

```bash
npm ci          # npm install değil — kilitli sürümler kullanılır
npm run dev
```

Göndermeden önce şunların hepsi temiz geçmeli:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run check-content            # frontmatter + kaynaklar doğrulaması
npm run validate-content-graph   # ön koşul grafiği: döngü, eksik referans
npm run build
```

CI de aynılarını koşar. Bu otomatik kapılar temiz geçmeden hiçbir PR
birleştirilmez.

---

## Ders katkısı: iki zorunlu kapı, bir opsiyonel inceleme

`docs/06-kalite-ve-topluluk.md`'deki kaynak ve sayısal doğrulama dış katkıda
da zorunludur. İnsan gözden geçirmesi aynı araçlarla yapılabilir ama yayın
şartı değildir.

### Kapı 1 — Kaynak (otomatik kontrol edilir)

Her dersin `kaynaklar` alanı dolu olmalı. Kabul edilen kaynaklar:

- Üretici teknik veri sayfaları ve resmi dokümantasyon (URL ile)
- Ders kitapları (yazar, kitap, bölüm)
- Akademik yayınlar (DOI veya arXiv)
- Standart metinleri (ISO numarası)

**Kabul edilmeyen:** "iş yerinde gördüm", "bize öyle anlattılar", kaynağı
belirsiz bloglar, forum gönderileri.

Bu kural aynı zamanda bir gizlilik korumasıdır: kaynağı gösterilemeyen bilgi
yayınlanmaz. İşyerine/kuruma özel hiçbir bilgi (kurulum detayı, hat
konfigürasyonu, iç sistem adı, proje kod adı) bu depoya giremez.

Kaynağa erişemediysen ama konuyu biliyorsan, iddiayı yazma — ya da derste
görünür bir `> **Doğrulama notu.**` bloğuyla neyin teyit edilmediğini
okuyucuya açıkça söyle (Hat H dersleri bunun örneği).

### Kapı 2 — Sayısal doğruluk

Derste geçen her sayısal örnek (açı, mesafe, süre, sonuç) **kodla üretilmiş**
olmalı, elle uydurulmuş değil. Platformda çalışan bir implementasyona
karşılık geliyorsa `lib/robotics/` içindeki fonksiyonla veya
`reference-python/fixtures/` altındaki veriyle doğrula.

Üniversite seviyesinde, dersin anlattığı formülün arkasında gerçekten çalışan
bir kod varsa tek satırlık "Kaynak kodu" bağlantısı eklenir. **Uydurma link
yazma** — implementasyon yoksa satır hiç eklenmez.

### Opsiyonel — İnsan gözden geçirmesi

Bir bakımcı dersi kaynaklarıyla satır satır karşılaştırmayı seçerse inceleme
`npm run review` ile güncel ders sürümüne bağlı Review Receipt olarak
kaydedilir. Legacy `incelendi_tarafindan` / `incelendi_tarih` alanları yeni
bir yayının kanıtı değildir ve yayın şartı gibi doldurulmaz.

İnceleme yapılmaması yayını engellemez. Bunun dürüst sonucu şudur: otomatik
kapılar kaynak alanının varlığını ve sayısal kodu denetler, ders metnindeki
her iddianın kaynakla uyuştuğunu garanti etmez. Ayrıntılı kapsam tablosu
`docs/06-kalite-ve-topluluk.md` içindedir.

---

## Kod katkısı: nelere dikkat edilir

`docs/08-guvenlik-sertlestirme.md`'deki PR kontrol listesi her PR'a uygulanır:

- **Yeni bağımlılık mı ekliyorsun?** Gerekçesini PR açıklamasına yaz.
  "Bunu 50 satır kendimiz yazabilir miyiz" sorusu soruluyor. `package-lock.json`
  her zaman commit edilir.
- **`lib/robotics/` içine `window`, `document` veya React importu girmez.**
  Bu katman saf kalmalı (ileride React Native portu için). Ağ isteği de girmez.
- **Dış URL'e istek atan kod** statik site felsefesiyle çelişir, ekstra
  gerekçe ister. Üçüncü taraf CDN kullanılmaz — fontlar ve kütüphaneler
  kendi build'imize gömülür.
- **`eval`, `dangerouslySetInnerHTML` gibi desenler** gerekçesiz kabul
  edilmez.
- **Matematik kodu test edilmeden birleştirilmez.** `reference-python/`
  fixture'larına veya bilinen analitik sonuçlara karşı doğrula.
- **MDX yalnızca `components/interactive/index.ts` içindeki bileşenleri
  kullanabilir.** Ders dosyası kendi bileşenini icat edemez. Bir PR hem yeni
  bileşen hem yeni ders getiriyorsa, bileşen ayrı ve daha sıkı incelenir.
- **Etkileşim gecikmesi 16 ms'yi geçmemeli**, sahne mobilde çalışmalı,
  klavyeyle kullanılabilir bir alternatifi olmalı ve metin özeti bulunmalı.

---

## PR açarken

1. `main`'den bir dal aç. Dal adı işi anlatsın (`hat-h-kobot-dersi`,
   `arama-turkce-normalizasyon`).
2. Küçük ve tek konulu tut. "Ders ekle + bileşen yaz + refactor" tek PR'a
   sığmaz.
3. `.github/pull_request_template.md` doldurulmuş gelir — kontrol listesini
   gerçekten işaretle, süs değil.
4. Arayüz metni Türkçe ve cümle düzeninde ("Sıfırla", "Sonraki ders").
   Kod ve değişken isimleri İngilizce; yorum ve docstring Türkçe.

### İlk PR'ın

İlk kez katkı yapanlarda CI otomatik tetiklenmez, bir bakımcı onayı ister
(`docs/08` §2). Bu sana karşı bir güvensizlik değil, CI ortamının kötü
niyetli kodla sırf PR açılarak kullanılmasını engelleyen standart bir önlem.

---

## Ne zaman birleştirilir

Bakımcılar için geçerli kural `docs/09-ai-muhendisligi.md` §7'de: otomatik
kontroller temiz geçtiyse dal doğrudan `main`'e birleştirilir. **İstisna:**
bu dosya, `SECURITY.md`, PR şablonları, `CLAUDE.md` ve `docs/` altındaki
kural dokümanları — yani kuralın kendisini değiştiren dosyalar — elle onay
ister.

Dış katkılarda ayrıca en az bir bakımcı incelemesi gerekir.

---

## Lisans — depoda iki ayrı lisans var

Katkı göndermeden önce bilmen gereken tek hukuki ayrıntı bu.

| Ne | Lisans | Dosya |
|---|---|---|
| **Yazılım** — `app/`, `components/`, `lib/`, `scripts/`, `reference-python/`, yapılandırma | MIT | `LICENSE` |
| **İçerik ve dokümantasyon** — `content/` (dersler + `sozluk.json`), `docs/`, düzyazı metinler | CC BY-SA 4.0 | `LICENSE-CONTENT` |

Ölçüt: **çalıştırılan şey MIT, okunan şey CC BY-SA.** Bir dersin içindeki
`<JointSliders />` çağrısı içeriğin parçasıdır (CC BY-SA); o bileşenin kendi
kaynak kodu MIT'tir.

Neden ikisi ayrı: kodun serbestçe (kapalı projelerde bile) kullanılabilmesini
istiyoruz — MIT bunu sağlar. Ders içeriğinde ise **AynıLisanslaPaylaş** şartı
işimize yarıyor: birisi bu dersleri alıp geliştirirse, geliştirdiği hâli de
aynı lisansla paylaşmak zorunda kalır. Türkçe robotik kaynağının havuzu
böylece büyür, kapanmaz.

**PR gönderdiğinde**, katkının bulunduğu yola göre ilgili lisans altında
yayınlanmasını kabul etmiş olursun. Ayrı bir CLA imzalatmıyoruz.

Derslerin `kaynaklar` alanında atıf yapılan üçüncü taraf materyaller (ders
kitapları, standartlar, üretici dokümanları) bu lisansların dışındadır —
onlara yalnızca atıf yapılır, metinleri yeniden dağıtılmaz. Kaynaktan
kopyalanmış metin PR'a giremez.

## Davranış

Kısa tut: iyi niyetli ol, soruyu küçümseme, eleştiriyi işe yönelt kişiye
değil. Hedef kitlede çocuklar var; dil ve içerik buna uygun kalır.

Bir güvenlik açığı bulduysan issue açma — `SECURITY.md`'ye bak.
