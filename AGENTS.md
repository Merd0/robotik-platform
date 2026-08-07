# Codex onboarding

Bu depoda çalışmaya başlamadan önce kökteki `CLAUDE.md` dosyasını ve görevin
kapsamına giren kanonik belgeleri oku. Proje kararlarının tek kaynağı
`docs/` dizinidir; kuralları bu dosyada yeniden tanımlama veya kopyalama.

## Kanonik belgeler

- Vizyon ve kapsam: `docs/00-vizyon.md`
- Müfredat: `docs/01-mufredat.md`
- Mimari ve değişmez sözleşmeler: `docs/02-mimari.md`
- Yol haritası: `docs/03-yol-haritasi.md`
- İçerik yazımı: `docs/04-icerik-rehberi.md`
- Deneyim, gizlilik ve performans: `docs/05-deneyim-ve-guvenlik.md`
- Kalite ve topluluk: `docs/06-kalite-ve-topluluk.md`
- Tasarım sistemi ve mobil uyarlama: `docs/07-tasarim-sistemi.md`
- Güvenlik sertleştirme: `docs/08-guvenlik-sertlestirme.md`
- AI ile çalışma düzeni: `docs/09-ai-muhendisligi.md`
- Harici denetim bulguları: `docs/10-harici-denetim-bulgulari.md`

Alt dizinlerde daha özel bir `AGENTS.md` veya `CLAUDE.md` varsa o kapsamda
önce onu uygula. Eşzamanlı ajanların değişikliklerini sahiplenme, geri alma
veya biçimlendirme; yalnızca görevde açıkça ayrılan dosyalara dokun.

## Teslim öncesi

İlgili kanonik belgedeki doğrulamaları çalıştır. Asgari kod kapısı:
`npm test`, `npm run build` ve değişen alanı kapsayan ek kontrollerdir.
Başarısızlık görev dışı mevcut bir değişiklikten kaynaklanıyorsa kanıtıyla
raporla; sessizce düzeltme kapsamını genişletme.
