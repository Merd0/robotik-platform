---
name: yeni-ders
description: Yeni bir ders dosyasi olusturur
disable-model-invocation: true
argument-hint: [hat] [seviye] [id] [baslik]
---

`$1` hattında (ör. `a-temeller`, `b-kinematik`, `c-planlama`), `$2` seviyesinde
(`ortaokul` | `lise` | `universite`), `$3` id'li, "$4" başlıklı yeni bir ders
dosyası oluştur.

## Adımlar

1. `content/$1/$2/$3.mdx` yolunu oluştur (klasör yoksa aç).
2. Aynı hat+seviye içindeki mevcut dersleri (`content/$1/$2/*.mdx`) tara,
   en yüksek `sira` değerini bul, yeni dersin `sira`sını bir fazlası yap.
3. `docs/04-icerik-rehberi.md`'deki şablonu kullan:

```mdx
---
id: $3
baslik: "$4"
hat: $1
seviye: $2
sure: 10
sira: <hesaplanan sıra>
onkosul: []
kazanimlar:
  - ...
kaynaklar:
  - ...
incelendi_tarafindan: ""
incelendi_tarih: ""
etkilesimli:
  - ...
durum: taslak
---

## Kanca

...

## Ne oldu

...

## Gerçek dünyada

...

## Dene

...

## Sonraki

...
```

4. `etkilesimli` alanına sadece `components/interactive/index.ts` içindeki
   `mdxComponents` listesinde zaten var olan bir bileşen adı yaz. Yoksa önce
   dur ve bileşenin ayrıca yazılması gerektiğini belirt.
5. `durum: taslak` olarak bırak, `incelendi_tarafindan`/`incelendi_tarih`
   alanlarını boş bırak — bunlar sadece gerçek insan gözden geçirmesinden
   sonra doldurulur (bkz. `docs/06-kalite-ve-topluluk.md`).
6. Seviye kalibrasyonuna uy: ortaokulda formül yok, lisede formül var ama
   türetme yok, üniversitede türetme ve sınırlar var.
7. Kanca çeşitliliğine dikkat et — aynı hat+seviyedeki bir önceki dersin
   kanca biçimini tekrar etme (bkz. `docs/04-icerik-rehberi.md` "Kanca
   çeşitliliği").
8. Dosyayı oluşturduktan sonra `npx tsx scripts/check-content.ts` çalıştır.
