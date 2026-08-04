<!--
  Ayrıntılı süreç: CONTRIBUTING.md
  Kutuları gerçekten işaretle — bunlar süs değil, kalite ve gizlilik kapıları.
-->

## Ne yapıyor

<!-- Bir iki cümle. Neden gerektiğini de yaz. -->

## Tür

- [ ] Yeni ders / ders düzeltmesi (`content/`)
- [ ] Sözlük terimi (`content/sozluk.json`)
- [ ] Yeni etkileşimli bileşen (`components/interactive/`)
- [ ] Robotik matematiği (`lib/robotics/`)
- [ ] Hata düzeltme / altyapı
- [ ] Dokümantasyon

## Kontroller

Hepsi yerelde temiz geçti:

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run check-content`
- [ ] `npm run validate-content-graph`
- [ ] `npm run build`

## İçerik değiştiyse

- [ ] `kaynaklar` dolu ve kabul edilen türden (üretici dokümanı / ders kitabı /
      akademik yayın / standart numarası). "İş yerinde gördüm" yok.
- [ ] Derste geçen sayısal örnekler kodla üretildi, elle uydurulmadı.
- [ ] `durum: taslak` — yayınlama ayrı ve elle yapılan bir adım.
- [ ] Seviye kalibrasyonuna uygun (ortaokulda formül yok, lisede formül var
      türetme yok, üniversitede türetme ve sınırlar var).
- [ ] Kanca, aynı hat+seviyedeki önceki 2-3 dersle aynı retorik iskeleti
      tekrar etmiyor.
- [ ] Sadece `components/interactive/index.ts` içindeki bileşenler kullanıldı.
- [ ] İş yerine/kuruma özel hiçbir bilgi yok.

## Kod değiştiyse

- [ ] `lib/robotics/` içine `window` / `document` / React importu veya ağ
      isteği girmedi.
- [ ] Matematik değişikliği testle (veya `reference-python/` fixture'ıyla)
      doğrulandı.
- [ ] Yeni bağımlılık **yok** — varsa gerekçesi aşağıda ve `package-lock.json`
      commit edildi.
- [ ] Yeni sahne/kontrol klavyeyle kullanılabiliyor ve metin özeti var.
- [ ] Dokunmatikte çalışıyor, hedefler en az 44×44 piksel.

<!-- Yeni bağımlılık eklediysen gerekçe: -->

## Nasıl denendi

<!-- Hangi sayfayı açtın, ne yaptın, ne gördün. Ekran görüntüsü faydalı. -->
