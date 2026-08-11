# content/ — ders yazma kuralları

Şablon ve tam süreç: `docs/04-icerik-rehberi.md`. Burada sadece bu klasöre
özel, sık unutulan noktalar.

- Her dosya `<hat>/<seviye>/<id>.mdx` yolunda, şablondaki frontmatter ile başlar.
- `sira` alanı aynı hat+seviye içindeki öğretim sırasını belirler (1'den başlar).
  Ön koşul zinciri ve önceki/sonraki gezinmesi buna göre kurulur.
- `kaynaklar` boşken `durum: yayinda` olamaz. İnsan gözden geçirmesi yayın
  için opsiyoneldir; legacy `incelendi_tarafindan` / `incelendi_tarih`
  alanlarını yayın şartı gibi doldurma. Gerçek bir inceleme yapılırsa sürüme
  bağlı Review Receipt ile kaydedilir — bkz. `docs/06-kalite-ve-topluluk.md`.
- Sadece `components/interactive/` altında zaten tanımlı bileşenler kullanılır.
  Yeni bir bileşeni MDX içinde icat etme; önce bileşeni yaz, ayrı incelensin
  (bkz. `docs/08-guvenlik-sertlestirme.md`).
- Seviye kalibrasyonu: ortaokulda formül yok, lisede formül var ama türetme
  yok, üniversitede türetme ve sınırlar var. Aynı kavramı üç kez farklı
  derinlikte anlat, kopyalayıp hafifletme.
- İş yerinden hiçbir bilgi girmez; kaynağı gösterilemeyen iddia yazılmaz
  (bkz. `docs/00-vizyon.md` "kritik kısıt").
