# Gömülü yazı tipleri

Bu klasördeki `.woff2` dosyaları depoya bilinçli olarak commit edildi
(`docs/08-guvenlik-sertlestirme.md`: "fontlar ve kütüphaneler kendi
build'imize gömülür, harici CDN'e hiç bağımlı olunmaz"). Çalışma zamanında
hiçbir üçüncü taraf alan adına istek gitmez; CSP `font-src 'self'` bunu
zorlar. Derleme sırasında da ağ gerekmez — dosyalar hazır.

| Dosya | Aile | Lisans | Kaynak |
|---|---|---|---|
| `big-shoulders-display-latin.woff2`, `big-shoulders-display-latin-ext.woff2` | Big Shoulders Display (değişken, ağırlık 600–900) | SIL Open Font License 1.1 | Google Fonts, `bigshouldersdisplay/v24` |
| `jetbrains-mono-latin.woff2`, `jetbrains-mono-latin-ext.woff2` | JetBrains Mono (değişken, ağırlık 500–700) | SIL Open Font License 1.1 | Google Fonts, `jetbrainsmono/v24` |

SIL OFL 1.1 metni: <https://openfontlicense.org/open-font-license-official-text/>

## Neden bu iki aile, neden gövde metni için font yok

Görsel kimliğin taşıyıcısı iki uçtur: sıkışık büyük başlık (Big Shoulders
Display) ve teknik veri (JetBrains Mono). Gövde metni sistem sans ailesinde
kalıyor — `docs/07-tasarim-sistemi.md`'nin ilk çekirdek kararı buydu ve
değiştirmenin bedeli faydasından büyük: Inter'in Latin-Ext alt kümesi tek
başına 85 KB ve Türkçe metinde (ş, ğ, İ) her sayfada yükleniyor, oysa gövde
boyutlarında sistem sans'tan görsel farkı ihmal edilebilir.

## Alt küme ve ağırlık seçimi

Her aile için yalnız `latin` ve `latin-ext` alt kümeleri var. Türkçe ikisini
birden gerektiriyor: `ı` (U+0131) latin içinde, ama `İ`, `ğ`, `Ğ`, `ş`, `Ş`
latin-ext'te. Diğer alt kümeler (kiril, yunan, vietnamca) indirilmedi.

İkisi de değişken font: tek dosya tüm ağırlık aralığını taşır, ağırlık başına
ayrı dosya yok.

## Ölçülen etki

Toplam 108 KB, dördü de `font-display: swap` ile tanımlı — ilk boyamayı
bloklamaz. Yalnız `big-shoulders-display-latin.woff2` preload edilir (ilk
ekranda görünen tek font dosyası odur); kalan üçü tarayıcı ilgili glifi
gerçekten isteyince çekilir. Başlangıç JS/CSS bütçesi
(`npm run check-performance-budget`) fontlardan etkilenmez, bütçe script
ve stil baytlarını ölçer.
