# Codex çalışma durumu — P1 mobil ve erişilebilirlik

Tarih: 2026-08-06  
Dal: `codex-p1-erisilebilirlik`  
Başlangıç commit'i: `26b040f`

## Kapsam notu

Çalışmaya başlamadan önce `CLAUDE.md`, `docs/00-vizyon.md`,
`docs/04-icerik-rehberi.md`, `docs/06-kalite-ve-topluluk.md` ve
`docs/08-guvenlik-sertlestirme.md` okundu.
`docs/10-harici-denetim-bulgulari.md` dosyası çalışma başlangıcında mevcut
değildi; tüm yerel dallar/Git geçmişi ve eşzamanlı Claude çalışma ağacı birkaç
kez kontrol edildi, dosya bulunamadı. Bu nedenle P1 kapsamı, görev mesajında
açıkça verilen yedi bulgu üzerinden uygulandı.

Claude Code'un kirli `p0-kalan-duzeltmeler` çalışma ağacına dokunmamak için bu
dal ayrı bir Git worktree'de geliştirildi. `lib/robotics/`, `content/` altındaki
MDX dosyaları, `.github/workflows/ci.yml` ve `docs/durum-denetim.md`
değiştirilmedi.

## Yapılanlar

- Kök `AGENTS.md` eklendi. Kurallar kopyalanmadı; kanonik `docs/` belgelerine
  ve alt dizin talimatlarına yönlendiren Codex onboarding dosyası oluşturuldu.
- `PixelToWorld` sabit genişlikli 64 düğme yerine genişliğe uyum sağlayan tek
  etkileşim yüzeyi kullanıyor. Dokunma/fare koordinatıyla seçim korunurken ok
  tuşu gezintisi eklendi; 64 ayrı sekme durağı teke indi ve sonuç canlı
  bölgede duyuruluyor.
- `SignalTimeline` satırları ortak sütunlu tek bir CSS grid'e taşındı.
  Hücreler 44×44 px kaldı; dar alanda bileşen içi yatay kaydırma var, satırlar
  bağımsız kırılıp hizadan çıkmıyor.
- Bileşenlerdeki `touch-none` kullanımları `touch-pan-y` yapıldı. Böylece
  kaydırıcı ve sahne üstünden başlayan dikey mobil sayfa kaydırması
  engellenmiyor.
- `SafetyZone` kaydırıcıları ve sıfırlama düğmesi 44 px hedef yüksekliğine
  getirildi. Ders/gezinme/arama bağlantılarındaki küçük hedefler de en az
  44 px yüksekliğe çıkarıldı.
- `CodeRunner` metin alanına bağlı `Python kodu` etiketi eklendi. Hazır,
  yükleniyor, çalışıyor, tamamlandı ve çıktı durumları kalıcı
  `aria-live="polite"` / `aria-atomic="true"` bölgesinden duyuruluyor.
- Ortaokul, lise ve üniversite sayfaları için ortak seviye tema eşlemesi
  eklendi. Ders sayfası, seviye listesi, tamamlama düğmesi, ilerleme rozeti,
  ders gezinmesi ve odak halkası aktif seviyenin zemin/metin/vurgu
  token'larını kullanıyor.
- `.github/CODEOWNERS` eklendi; varsayılan sahip ve hassas alanların sahibi
  `@Merd0` olarak tanımlandı.
- `.github/dependabot.yml` eklendi; npm ve GitHub Actions için haftalık,
  `main` hedefli ve açık PR sayısı sınırlı güncelleme akışı tanımlandı.
  Otomatik merge yapılandırılmadı.

## Doğrulama

Her mantıksal değişiklik paketinden sonra `npm test` ve `npm run build`
çalıştırıldı. Son durum:

- `npm test`: 8 test dosyası, 94/94 test geçti.
- `npm run build`: production build ve taslak sayfa kontrolü geçti; 48 statik
  rota üretildi, 50 taslak ders üretim çıktısına girmedi.
- `npm run lint`: geçti.
- `git diff --check`: geçti.
- `touch-none` kaynak taraması: eşleşme yok.
- Yerel tarayıcı denetimi:
  - `PixelToWorld`: belge yatay taşması 0, tek ızgara düğmesi/sekme durağı,
    ok tuşuyla seçim doğrulandı, küçük hedef bulunmadı.
  - `SignalTimeline`: iki sinyal satırının sekiz sütunu aynı x koordinatında;
    hücreler 44×44 px, belge yatay taşması 0.
  - `CodeRunner`: textarea etiketi `Python kodu`; canlı bölge `polite` ve
    atomic; küçük hedef bulunmadı.
  - Tema ölçümü: ortaokul `rgb(250, 249, 247)`, lise
    `rgb(247, 248, 250)`, üniversite `rgb(252, 252, 252)` zeminleri ve her
    seviyenin farklı metin/vurgu renkleri etkin.

Build sırasında yalnızca ayrı worktree'nin ana deponun altında bulunmasından
kaynaklanan Next.js “birden fazla lockfile / workspace root” uyarısı görüldü;
derleme sonucunu etkilemedi ve dalın dosyalarında ek lockfile değişikliği yok.
