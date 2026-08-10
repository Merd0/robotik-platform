# Kaynak tasarım dosyaları

Bu klasör, Claude Design projesinden indirilmiş tasarım dosyalarının
değiştirilmemiş kopyasıdır. **Uygulamanın parçası değildir:** derlenmez,
sunulmaz, `content/` veya `components/` tarafından import edilmez. Burada
durmasının tek nedeni, uygulanan tasarımın kaynağının kaybolmaması.

| Dosya | Uygulandığı yer |
|---|---|
| `Ana Sayfa Yeniden Tasarım.dc.html` | `app/page.tsx` + `components/home/HeroExperiment.tsx` |
| `Seviye - Ortaokul.dc.html` | `components/seviye/OrtaokulSeviyesi.tsx` |
| `Seviye - Lise.dc.html` | `components/seviye/LiseSeviyesi.tsx` |
| `Seviye - Universite.dc.html` | `components/seviye/UniversiteSeviyesi.tsx` |

Ana sayfa dosyası üç seçenek içerir (`1a`, `1b`, `1c`). Uygulanan `1a`
("Kinetik Poster") — üç seviye sayfasıyla aynı tipografik aileyi ve aynı
teal/mavi/mor seviye renklerini paylaşan tek seçenek oydu.

## Uygulanan sürüm neden birebir aynı değil

Tasarım dosyaları statik HTML mockup'tır; uygulama üç noktada bilinçli
olarak ayrılır:

- **Kontrast.** Mockup'taki bazı renkler WCAG AA altında kalıyordu (ör.
  parlak teal başlık, krem zeminde 1.9:1). Ton değerleri ölçülerek
  koyulaştırıldı; gerekçeler `app/globals.css` içindeki token yorumlarında.
- **Hareket.** Mockup birkaç yerde opaklık animasyonu kullanıyor; yarı
  saydam metin, ölçülen kontrastı AA altına düşürdüğü için aynı etki
  genişlik/konum animasyonuyla üretildi.
- **Veri.** Mockup'taki ders sayıları, ders başlıkları ve açıklamalar
  örnektir. Uygulama bunları içerik manifestinden okur; sahnedeki her sayı
  gerçek içerikten gelir.

Bu dosyalar tasarımın **kaydıdır**, uygulamanın şartnamesi değil. Bir
çelişki görürsen geçerli olan koddur; nedeni yukarıdaki üç başlıktan
biridir.
