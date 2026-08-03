---
paths:
  - "content/**/*.mdx"
---

# İçerik kuralları (content/**/*.mdx)

Tam süreç ve şablon: `docs/04-icerik-rehberi.md`, `docs/06-kalite-ve-topluluk.md`,
`content/CLAUDE.md`. Burada sadece MDX dosyasıyla çalışırken bağlama girmesi
gereken, sık unutulan noktalar.

- Şablon: Kanca → etkileşimli sahne → Ne oldu → Gerçek dünyada → Dene → Sonraki.
- `kaynaklar` boş olamaz. `durum: yayinda` için ayrıca `incelendi_tarafindan`
  ve `incelendi_tarih` dolu olmalı — hook bunu zaten otomatik reddediyor,
  ama yeni yazarken baştan doldurmaya çalışma, boş taslak (`durum: taslak`)
  olarak bırak.
- Sadece `components/interactive/index.ts` içindeki `mdxComponents` listesinde
  olan bileşenler kullanılabilir. Yeni bileşen gerekiyorsa önce onu yaz ve
  listeye ekle, MDX içinde icat etme.
- Seviye kalibrasyonu: ortaokulda formül yok, lisede formül var ama türetme
  yok, üniversitede türetme ve sınırlar var.
- Kanca çeşitliliği: aynı hat+seviyedeki bir önceki 2-3 dersin kanca
  cümlesine bak, **hangi olursa olsun** aynı retorik iskeleti tekrarlama.
  Aşınmış iki kalıp özellikle dikkat ister: "[durum kur] → Ama/Ancak →
  Peki...?" ve "Çoğu kişi X sanır, aslında Y". Kalıbın adını koyamıyorsan
  ilk cümlelerin gramer iskeletini yan yana karşılaştır (bkz. `04` "Kanca
  çeşitliliği").
- `sira` alanı 1'den başlar, aynı hat+seviye içindeki öğretim sırasını verir.
- İş yerinden hiçbir bilgi girmez; kaynağı gösterilemeyen iddia yazılmaz.
