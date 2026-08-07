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

---

# Codex çalışma durumu — Node, SEO ve kaynak şeffaflığı

Tarih: 2026-08-07
Dal: `codex-node-seo-kaynak`
Başlangıç commit'i: `5798631` (`origin/main`)

## Kapsam notu

Çalışmaya başlamadan önce `CLAUDE.md`, `docs/09-ai-muhendisligi.md` ve
`docs/10-harici-denetim-bulgulari.md` okundu. Görevin içerik, statik dağıtım
ve tedarik zinciri kapsamı için ayrıca `docs/02-mimari.md`,
`docs/04-icerik-rehberi.md`, `docs/06-kalite-ve-topluluk.md`,
`docs/07-tasarim-sistemi.md`, `docs/08-guvenlik-sertlestirme.md` ve
`content/CLAUDE.md` uygulandı.

Eşzamanlı `codex-buyuk-mimari-onerisi` çalışma ağacındaki kullanıcı
değişikliklerine dokunulmadı; dal güncel `origin/main` üzerinden ayrı bir Git
worktree'de oluşturuldu. Görevde korumalı olduğu belirtilen `app/page.tsx`,
`app/laboratuvar/`, `components/lab/`, `lib/evidence.ts` ve `app/globals.css`
değiştirilmedi.

## Yapılanlar

- Node ana sürümü LTS `24.x` olarak `package.json` engines alanında ve
  `.nvmrc` dosyasında sabitlendi. GitHub Actions artık sabit bir `20` değeri
  yerine `.nvmrc` dosyasını okuyor; Vercel ve CI aynı ana sürümü kullanıyor.
- Statik `/robots.txt` ve `/sitemap.xml` metadata rotaları eklendi. Canonical
  adres `https://robotik-platform.vercel.app` olarak kullanıldı.
- Sitemap dersleri ortamdan bağımsız `getPublishedLessons()` kümesinden
  alıyor. Taslak önizlemesi açık olsa bile yalnızca `durum: yayinda` dersler
  ekleniyor; birim testi ve build-sonrası çıktı kontrolü bu sözleşmeyi
  koruyor.
- `/manifest.json` eklendi ve kök metadata üzerinden bağlandı. Var olan
  `app/icon.svg` simgesi ile tasarım sisteminin zemin/tema renkleri yeniden
  kullanıldı.
- KUKA KSS ve FANUC TP kaynak kayıtları, doğrulanmış bir numara uydurulmadan
  `kaynak: ..., doküman numarası doğrulanamadı` biçiminde açıkça işaretlendi.

## Doğrulama

Kontroller Node `v24.19.0` ile çalıştırıldı:

- `npx tsc --noEmit`: geçti.
- `npm run lint`: geçti.
- `npm test`: 12 test dosyası, 144/144 test geçti.
- `npm run check-content`: 89 ders, hata yok.
- `npm run validate-content-graph`: 89 ders, döngü/eksik referans yok.
- `npm run check-quiz-dagilimi`: geçti; görünen en yüksek şık konumu %36,7.
- `npm run check-mdx-guvenlik`: 89 ders, hata yok.
- `npm audit --audit-level=high`: 0 zafiyet.
- `npm run build`: geçti; 50 statik rota üretildi.
- Build çıktısı: `robots.txt`, `sitemap.xml` ve `manifest.json` mevcut;
  sitemap'te 39 yayınlanmış ders var, 50 taslak dersten sızıntı yok.
- `git diff --check`: geçti.

Build sırasında yalnızca worktree'nin ana deponun altında bulunmasına bağlı
Next.js “birden fazla lockfile / workspace root” uyarısı görüldü; sonuçları
etkilemedi. Dal main'e merge edilmedi.
