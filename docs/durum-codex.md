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
# Codex çalışma durumu — vizyon genişletme

Tarih: 2026-08-07

Dal: `codex-vizyon-genisletme`

Özellik commit'i: `4907824` (`feat: kanit tabanli robotik laboratuvari deneyimi`)

Başlangıç zinciri: `18c39c7` (P0) → `e4e30f5` (P1 erişilebilirlik)

Main baseline: `26b040f` — main değiştirilmedi, merge/push/PR yapılmadı.

## Kapsam ve eşzamanlı çalışma notu

`docs/guncel-fikirler.md` içindeki “yalnız beş şey” kararının tamamı bu dalda
uygulandı. P0 üretim bütünlüğü ve P1 mobil/erişilebilirlik commit'i başlangıç
katmanı olarak bu dala alındı.

Dal hazırlanırken başka bir oturum `docs/durum-denetim.md` üzerinde iki commit
oluşturdu: `45250fb` ve `b2c9765`. Bu commit'ler korundu; Codex bu dosyayı
düzenlemedi. Entegrasyonda bu iki commit'in Claude Code tarafındaki güncel
durum belgesiyle karşılaştırılması gerekir.

## Beş kararın uygulaması

### 1. İlk ekranda gerçek “wow” deneyi

- Ana sayfa “İz Laboratuvarı” kimliğiyle yeniden tasarlandı.
- WebGL kullanmayan, hafif SVG iki-eklem robot kolu eklendi. Kullanıcı sonucu
  önce tahmin ediyor, sonra hareketi ve uç nokta izini görüyor.
- Global header/footer, laboratuvar panel dili, ızgara/iz animasyonu ve
  platformun gerçek yayın/etkileşim/hat sayıları eklendi.
- Ana sayfa artık uzun ders listesi yerine seviye seçimi, hat haritası ve
  capstone çağrısı kuruyor.

### 2. Seviye → Hat → Ders ve güven katmanı

- Seviye sayfaları düz, `sira` ile karışan liste yerine yayınlı dersleri hat
  bazında grupluyor.
- Yeni `/seviye/[seviye]/hat/[hat]` rotası hat içi sırayı, kazanımı, süreyi ve
  yerel ilerleme durumunu gösteriyor.
- Ders sayfası geniş laboratuvar düzenine geçti; masaüstünde kaynak/güven
  paneli sabit yan kolon, mobilde içerik sonrası tek kolon.
- Güven panelinde süre, seviye, hat, kazanım, kaynak, inceleyen kişi/tarih ve
  yerel veri politikası görünür.

### 3. EvidenceEvent tabanlı öğrenme çekirdeği

- Sürümlü, tarayıcı-local `EvidenceEvent` şeması eklendi: ders, beceri,
  aşama, sonuç, metrik, deneme sayısı, seed, içerik sürümü ve tarih.
- “Bu dersi tamamladım” öz-beyanı kaldırıldı. `Okundu`, `Denendi` ve
  `Kanıtlandı` ayrı durumlar; yalnız başarılı transfer görevi kanıt üretir.
- JointSliders, IkTarget, JacobianViz, PlannerRace ve quizler gerçek
  deneme/gözlem olayı üretiyor.
- Quiz ilk yanlışta cevabı açıklamıyor; genel ipucu veriyor. Ayrıntılı açıklama
  ikinci yanlışta veya doğru cevapta açılıyor.
- İlerleme hesabı için regresyon testi eklendi; başarısız transfer başarı
  sayılmıyor.

### 4. Altı pilot ders + çapraz-hat capstone

Altı yayınlı pilot ders `PredictionPrompt` ve `TransferChallenge` ile
Merak → Tahmin → Deney → Gözlem → Açıklama → Transfer → Kanıt döngüsüne
taşındı:

1. `b-ortaokul-eklemleri-oynat`
2. `b-ortaokul-birden-fazla-yol`
3. `b-lise-ileri-kinematik`
4. `b-lise-geometrik-ters-kinematik`
5. `b-universite-jacobian`
6. `c-universite-algoritma-karsilastirma-deneyi`

Yeni `/laboratuvar/robot-hucresi` amiral gemisi dikey dilimi dört kararı aynı
iki boyutlu hücrede birleştiriyor:

- kamera ölçeği/kalibrasyon,
- fikstüre çarpmayan yol,
- algıla → yaklaş → tut → bırak program sırası,
- insan yaklaşırken fizik modelinden hesaplanan güvenli hız.

Sahne sabit seed (`240807`) kullanıyor. Dört kanıt tamamlanınca sürümlü,
kişisel veri içermeyen JSON beceri kanıtı indirilebiliyor.

### 5. P0/P1 + SEO, güvenlik ve yayın bütünlüğü

- P0 taslak izolasyonu, planlayıcı doğruluğu, quiz karıştırma ve MDX AST
  allowlist tabanı; P1 mobil/erişilebilirlik ve seviye temaları bu dalda.
- `robots.txt`, yalnız yayınlı dersleri içeren canonical sitemap ve web app
  manifesti eklendi.
- Vercel için CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy ve
  frame yasağı eklendi. CSP yerel worker/Pyodide gereksinimleri için
  `worker-src blob:` ve `wasm-unsafe-eval` ile daraltılmış durumda.
- Node sürümü `.nvmrc` ve `engines` ile 20.x'e sabitlendi.
- GitHub Actions `checkout`/`setup-node` SHA'ya pinlendi; workflow izni
  `contents: read` ile sınırlandı.
- Build sonuna gerçek `out/` içinde robots/sitemap/manifest ve canonical
  bağlantıları doğrulayan release gate eklendi.

## Dokunulan dosyalar

### Yeni

- `.nvmrc`, `vercel.json`
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`
- `app/laboratuvar/robot-hucresi/page.tsx`
- `app/seviye/[seviye]/hat/[hat]/page.tsx`
- `components/home/HeroExperiment.tsx`
- `components/lab/RobotCellCapstone.tsx`
- `components/lesson/LessonEvidenceProvider.tsx`
- `components/lesson/LessonCompletionPanel.tsx`
- `components/lesson/LessonTrustPanel.tsx`
- `components/interactive/PredictionPrompt.tsx`
- `components/interactive/TransferChallenge.tsx`
- `components/ui/SiteHeader.tsx`, `components/ui/SiteFooter.tsx`
- `lib/evidence.ts`, `lib/evidence.test.ts`
- `scripts/check-release-output.ts`
- `docs/guncel-fikirler.md`

### Değiştirilen

- `.github/workflows/ci.yml`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/seviye/[seviye]/page.tsx`, `app/ders/[slug]/page.tsx`
- `components/interactive/{index,JointSliders,IkTarget,JacobianViz,PlannerRace,QuizSorusu}.tsx`
- `components/ui/LessonProgressBadge.tsx`
- `lib/content.ts`, `lib/izinliBilesenler.ts`
- `package.json`, `package-lock.json`
- Yukarıda listelenen altı pilot `.mdx` dosyası
- Bu durum belgesi: `docs/durum-codex.md`

P1 baseline commit'i ayrıca `AGENTS.md`, `.github/CODEOWNERS`,
`.github/dependabot.yml` ve P1 bulgularına ait mevcut bileşenleri değiştirir;
ayrıntısı önceki durum belgesi geçmişinde ve `e4e30f5` commit'indedir.

## Doğrulama

Son özellik durumu için:

- `npx tsc --noEmit`: geçti.
- `npm run lint`: geçti.
- `npm test`: 12 test dosyası, 145/145 test geçti.
- `npm run check-content`: 89 ders, hata yok.
- `npm run validate-content-graph`: 89 ders, eksik referans/döngü yok.
- `npm run check-mdx-guvenlik`: 89 ders, AST güvenlik denetimi temiz.
- `npm run build`: geçti; 61 statik sayfa üretildi.
- Taslak release gate: 50 taslak slug'ın hiçbiri `out/ders/` altında yok.
- Release-output gate: robots, sitemap, manifest ve canonical adresler temiz.
- `git diff --check`: geçti.

Tarayıcıyla yapılan görsel/erişilebilirlik denetimi:

- 1440 CSS px ana sayfa: belge yatay taşması yok; laboratuvar ve açıklama iki
  kolon, hero 1232 px genişlikte ve ilk viewport içinde.
- 390 CSS px ana sayfa: yatay taşma yok; hero tek kolon, header sadeleşiyor,
  deney mobilde dikey akıyor.
- 390 CSS px öğrenme hattı, pilot ders ve capstone: yatay taşma yok.
- Pilot ders ve hat sayfasında görünür 44 px altı etkileşim hedefi yok.
- Capstone denetiminde bulunan küçük breadcrumb hedefi tüm yeni breadcrumb
  bağlantılarında `min-h-11` ile düzeltildi.
- DOM snapshot'larında başlık hiyerarşisi, fieldset/legend, slider adları,
  `aria-live` durumları ve capstone görev ilerlemesi erişilebilir adlarla var.

## Claude Code entegrasyon kontrol listesi

1. Dalı `26b040f..codex-vizyon-genisletme` aralığında incele; P0/P1 tabanını
   mevcut Claude dallarıyla commit bazında eşleştir, aynı düzeltmeleri iki kez
   uygulama.
2. `45250fb` ve `b2c9765` içindeki `docs/durum-denetim.md` değişikliklerini
   güncel Claude belgesiyle karşılaştır; bu dosyada Codex uygulama değişikliği
   yok.
3. Önce `4907824` özellik commit'ini ayrı incele. Özellikle
   `lib/evidence.ts`, altı pilot MDX ve CSP/Pyodide worker uyumuna bak.
4. `npm ci`, `npm test`, `npm run build` ve 390/1440 responsive smoke testini
   entegrasyon dalında yeniden çalıştır.
5. Vercel preview'da Pyodide CodeRunner, planner worker, `/robots.txt`,
   `/sitemap.xml`, `/manifest.webmanifest` ve response header'larını doğrula.
6. Branch protection GitHub üzerinde repo ayarıdır; bu dal main'e dokunmadığı
   için ayrıca etkinleştirilmelidir.

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

---

# Codex çalışma durumu — Dark mode ve yazarlık örneklemesi

Tarih: 2026-08-08
Dal: `codex-yazarlik-cesitlilik`
İlk çalışma tabanı: `c13ee16`
Son rebase tabanı: `29befe0` (`main`; istenen `5c5dd3a` commit'ini içerir)

## Kapsam ve sınır

- Mert'in geri bildirimi `docs/11-yazarlik-kalitesi.md` olarak, istenen 116
  satırla oluşturuldu ve ayrı yerel commit'e alındı: `98e7233`.
- Dark mode 1. bölüm uyarınca platform genelinde tamamlandı.
- Yazarlık, örnek ve interaktif çeşitliliği **yalnızca A-H hatlarının her
  birinden iki ders olmak üzere 16 derste** örneklendi. Kalan 73 ders toplu
  olarak değiştirilmedi; Mert'in ton onayı bekleniyor.
- Formül, kaynak ve doğrulanmış sayılar değiştirilmedi. Yeni sektörler bağlam
  olarak kullanıldı; kaynaksız tolerans, performans veya ürün özelliği
  eklenmedi.
- `lib/robotics/` altında hiçbir dosya değiştirilmedi. Dal ayrı worktree'de
  tutuldu ve `main`e merge edilmedi.

## Dark mode

- İlk yüklemede `prefers-color-scheme` okunuyor; kullanıcı header'daki
  ay/güneş düğmesiyle seçimini değiştirebiliyor. Manuel tercih
  `robotik-tema` anahtarıyla yalnız `localStorage`da tutuluyor.
- Tema betiği boyamadan önce çalışıyor. Genel yüzeyler ile ortaokul, lise ve
  üniversite renk aileleri için ayrı koyu token'lar var; seviye kişilikleri
  korunuyor.
- Robot kolu, hedef, Jacobian vektör/elipsi, planlama ızgarası, engeller,
  başlangıç/hedef ve A*/RRT/RRT* yol izleri açık/koyu sahne paletlerini
  kullanıyor.
- Testler normal metinde en az 4,5:1, işlevsel 3B çizgi/işaretlerde en az
  3:1 kontrastı koruyor. Header düğmesi 44 × 44 px ve erişilebilir adı tema
  durumuna göre değişiyor.

## 16 derslik örneklem

| Hat | Örnek dersler | Önce | Sonra / görev çeşitliliği |
|---|---|---|---|
| A — Temeller | `a-ortaokul-robot-nedir`, `a-lise-koordinat-sistemleri` | Jenerik fabrika kolu, ev robotu ve kaynak robotu çevresinde dönüyordu. | Sera aracı/konveyör karşılaştırması, hastane ve tarım bağlamları; elektronik montaj tornavidasında alet çerçevesi. Tahmin et ve tanımı sınama görevleri eklendi. |
| B — Kinematik | `b-ortaokul-eklemleri-oynat`, `b-universite-jacobian` | “Fabrikalardaki robot kolları (ABB, KUKA, Mecademic)” gibi geniş bir liste ve yine iki eklemli soyut kol vardı. | Sera hasadı, elektronik montaj ve laboratuvar numunesi ayrıştırıldı; işbirlikçi kol bağlamı ürün özelliği uydurmadan kullanıldı. Jacobian tekilliği **Kır** görevi oldu. (Bu satırda başlangıçta iş yeri kaynaklı bir saha bağlamı vardı; `docs/00-vizyon.md` kaynak gizliliği kuralı gereği `feb6404` ile kaldırıldı.) |
| C — Planlama | `c-ortaokul-labirentte-yol-bulma`, `c-universite-algoritma-karsilastirma-deneyi` | Gözü kapalı arkadaş ve jenerik mobil robot hücresi anlatılıyordu. | Kütüphane teslim aracı ile havalimanı bagaj aracı iki ayrı senaryoya dönüştü. Engel düzeni **Kır**, çoklu planlayıcı deneyi **Optimize et** çerçevesi kazandı. |
| D — Programlama | `d-lise-hareket-komutlari`, `d-universite-offline-programlama` | Arkadaşa “omzunu/dirseğini döndür” benzetmesi ve genel üretim hattı kullanılıyordu. | Elektronik montaj, batarya kapağı sızdırmazlık hattı ve gıda paketleme OLP bağlamları ayrıldı. CodeRunner değişikliği açık bir **Yaz** görevine çevrildi. |
| E — Haberleşme | `e-ortaokul-makineler-nasil-konusur`, `e-lise-el-sikisma` | “Sinyal” ile “Robot: Hazırım / PLC: Aldım” etiketleri bağlamsızdı. | Fırın çıkışı tepsi sensörü ile ilaç dolum/kapaklama el sıkışması kullanıldı. `SignalTimeline` 10 adıma çıkarıldı; yanlış sırayı kurup düzeltme **Kır** görevi olarak netleştirildi. |
| F — Algılama | `f-ortaokul-robot-nasil-gorur`, `f-universite-lazer-profil-sensoru` | Kamera, mobil robot ve paketleme örnekleri tek paragrafta genel geçiyordu; tarama satırı sabitti. | Elektronik soket, sera arabası ve ekmek tepsisi sensör görevlerine ayrıldı. Lazer profil sensörü, teknik özellik eklenmeden ve kamuya açık üretici dokümantasyonuna dayanarak anıldı. `ScanPath adjustableRows` ile **Optimize et** deneyi eklendi. (Bu satırdaki iş yeri kaynaklı saha bağlamı ve model adı `feb6404` ile kaldırıldı.) |
| G — Simülasyon | `g-ortaokul-simulasyon-nedir`, `g-universite-dijital-ikiz` | Bir başka `generic-2dof` kol ve “her simülasyon dijital ikiz değildir” açıklaması vardı. | Döner + doğrusal `generic-prismatic` paketleme düzeneğine geçildi. NASA uçuş aracı kaynağı dijital ikiz ayrımını taşıyor; sahnede canlı veri bağını arama **Tahmin et/iddia denetimi** oldu. |
| H — Güvenlik | `h-ortaokul-robotlar-neden-tehlikeli`, `h-universite-guvenli-hucre-tasarimi` | Jenerik metal parça ve üç maddelik düz anlatım baskındı. | Depo paletleme bağlamı, sahada sorulacak üç soruluk kontrol biçimi ve SafetyZone üzerinde parametreleri zorlayan **Tahmin et / Optimize et** görevleri eklendi. Güvenlik uyarıları korunuyor. |

Örneklerde yeni MDX bileşeni eklenmedi. Yalnız mevcut allowlist bileşenleri
ve desteklenen prop'ları kullanıldı: `JointSliders` robot varyantı,
`SignalTimeline` sinyal/adım varyantı ve `ScanPath adjustableRows`.

## Doğrulama

Node `v24.19.0` ile:

- `npx tsc --noEmit`: geçti.
- `npm run lint`: geçti.
- `npm test`: 14 test dosyası, 152/152 test geçti.
- `npm run check-content`: 89 ders, hata yok.
- `npm run validate-content-graph`: 89 ders, döngü/eksik referans yok.
- `npm run check-quiz-dagilimi`: geçti; görünen en yüksek şık konumu %36,7.
- `npm run check-mdx-guvenlik`: 89 ders, allowlist temiz.
- `npm run build`: geçti; 61 statik sayfa üretildi. 50 taslak dersin hiçbiri
  üretim çıktısına veya sitemap'e girmedi.
- `git diff --check`: geçti.

Tarayıcı denetimi:

- Sistemden gelen koyu tema yüklendi; manuel açık/koyu geçişi ve yeniden
  yüklemede tercih kalıcılığı doğrulandı.
- Ana sayfa, ortaokul dersi ve capstone koyu temada denetlendi. 3B robot
  sahnesi yüklendi; planlama deneyinde A*, RRT ve RRT* başarılı sonuç ve
  görünür yol izi üretti.
- Lazer profil örneğinde satır sayısı 6'dan 2'ye indirildi ve tarama 24/24
  noktayla tamamlandı.
- Dar mobil kırılımda yatay taşma yok; marka metni gizleniyor ve tema düğmesi
  44 × 44 px kalıyor.
- Tarayıcı konsolunda çalışma zamanı hatası yok. Three.js bağımlılığından
  gelen iki `THREE.Clock` kullanım-dışı uyarısı görev öncesi kodla ilişkili.

### Rebase sonrası tedarik zinciri durumu

Dal, `5c5dd3a` commit'ini içeren güncel `main` (`29befe0`) üzerine
çakışmasız rebase edildi. Main'deki `postcss@8.5.26` ve lockfile'daki
`nanoid@3.3.18` korundu. Temiz `npm ci` sonrasında
`npm audit --audit-level=high` sonucu: **0 zafiyet**.

## Sözlük açıklama derinliği

Tek cümle kuralı, ilk kez karşılaşılan soyut kavramları açıklamak için
yetersizdi. Sözlükteki 70 terimin Türkçe/İngilizce karşılığı ve hat
ataması korunarak 66 tanım iki veya üç kısa cümleye genişletildi. `eklem`,
`döner eklem`, `doğrusal eklem` ve `çalışma uzayı` tek cümlede zaten açık
olduğu için uzatılmadı.

Genişletilen maddelerde ilk cümle tanımı, sonraki cümle ise zihinsel modeli,
somut örneği veya sık karıştırılan kavramdan farkı veriyor. Özellikle şu
ayrımlar açık hâle getirildi:

- ileri/ters kinematik, yol/yörünge ve eklem/doğrusal hareket;
- gerçek zamanlılık/hız, döngü süresi/seğirme ve el sıkışma/yarış
  durumu;
- iç/dış kamera parametreleri, tekrarlanabilirlik/doğruluk ve simülasyon/
  dijital ikiz;
- acil/koruyucu durdurma, geçici/yarı-statik temas, kategori/performans
  seviyesi ve `kobot`/işbirlikçi uygulama ayrımı.

Sözlük sayfasının metadata ve giriş metni yeni yapıyla eşlendi. Yeni terim,
ders veya kaynak eklenmedi; kaynağı olmayan tolerans, sınır değeri ya da
ürün özelliği yazılmadı. Bu değişiklikten sonra TypeScript,
lint, 152 test, içerik/graph/quiz/MDX kapıları, `npm audit` ve 61 sayfalık
production build yeniden temiz geçti.

---

# Büyüme planı — bağımsız değerlendirme

Tarih: 2026-08-09

İncelenen taban: main, 7e0f213. Bu bölüm docs/12-buyume-plani.md içindeki
taslağı aynen uygulama planı olarak kabul etmez; mevcut kod, yayın durumu ve
canlı kullanıcı davranışıyla karşılaştırılmış bağımsız görüştür. Uygulama
kodu değiştirilmedi.

## Kısa hüküm

Planın genel yönü doğru: yeni ders yığmak yerine kalite borcunu azaltmak,
hesapsız etkileşimi büyütmek, öğretmen paneli ve topluluk gibi pahalı
alanları talep kanıtlanana kadar bekletmek mantıklı. Ancak iki “hemen”
maddesinin tanımı düzeltilmeli:

1. 6-DOF problemi öncelikle kamera veya zoom problemi değildir. Asıl acil
   sorun, altı kontrolün tek dikey kolonda birikmesi ve daha önemlisi J6
   yöneliminin sahnede hiç görünmemesidir.
2. Review sistemini akıllandırmak düşük eforlu tek iş değildir. Otomasyon
   insan incelemesini hızlandırabilir ve sıraya koyabilir; insanın yapmadığı
   bir inceleme için insan makbuzu üretemez.

Plan ayrıca özellikleri sıralıyor fakat büyümeyi ölçen ve kendi kendini
besleyen bir döngü tanımlamıyor. En önemli eksik, gizlilik sınırını bozmadan
ölçülebilir ve paylaşılabilir deney durumlarıdır.

## 1. Önceliklendirme değerlendirmesi

| Taslaktaki madde | Bağımsız karar | Önerilen yer | Gerekçe |
|---|---|---|---|
| 6-DOF sahnesini sığdırma | Önceliğe katılıyorum, teşhise katılmıyorum | Hemen / P0 | Canlı altı derste doğrudan kullanım sorunu var. Kamera auto-fit tek başına çözmez; J6 yönelimi görünmediği için ders görevi kanıtlanamıyor. Semantik renderer düzeltmesi, yerleşimden bile önce gelmeli. |
| Review makbuzunu akıllandırma | Hemen başlanmalı, fakat aşamalı ve orta eforlu | Hemen: tasarım ve report-only; yakın/orta: zorunlu v2 ve borç eritme | Mevcut v1 dürüst bir kapı fakat makbuz listesi boş. Dependency manifesti, reviewer policy ve gerçek insan iş akışı küçük bir kamera düzeltmesiyle aynı efor sınıfında değil. |
| İçerik kalitesi turu | Yakından hemen/sürekliye çekilmeli | Hemen, risk tabanlı | Önce 39 yayın içindeki değişmiş, merkezi önkoşul ve yüksek riskli dersler ele alınmalı. 89 dersi eşit sırada okumak verimsizdir. |
| Oyun alanı | Koşullu olarak katılıyorum | Yakın vade, önce üç bileşenli pilot | “En çok paylaşılan sayfa olur” bir hipotezdir, kanıt değildir. Mevcut motorları kullanan ince bir kabukla pilotlanmalı; yeni ve büyük bir sandbox motoruna dönüşmemeli. |
| Küçük araçlar | Liste hâliyle fazla yüksek | Yakın/orta, yalnız ders ve paylaşım döngüsüne bağlanırsa | Açı çevirici kolay fakat ayırt edici değildir. Robot karşılaştırmanın önemli bir sürümü zaten RobotSelectionTable içinde var. DH aracı ancak bir görevi çözüyor, sonucu sahnede doğruluyor ve derse geri bağlıyorsa değerli olur. |
| 50 taslağı yayına açma | Toplu hedefe katılmıyorum | Yakın ve orta vadeye yayılan dikey dilimler | “50 yayın” kalite ölçütü değildir. Önkoşulu, etkileşimi, kaynağı ve gerçek receipt'i tamamlanan küçük hat dilimleri sırayla açılmalı. Hat H uzman safety onayı olmadan ayrı tutulmalı. |
| 89 bitmeden yeni ders eklememe | Genel ilkeye katılıyorum, mutlak yasa olmamalı | Orta vade | Kritik bir önkoşul boşluğu veya mevcut dersi çalışamaz yapan içerik açığı varsa tek ve ölçülebilir yeni ders istisna olabilir. Toplu içerik üretimi ise beklemeli. |
| SEO derinleştirme | İki parçaya ayrılmalı | Arama niyeti testi yakın; büyük ölçek uzak | Teknik temel var. Fakat hangi Türkçe robotik sorgularının araç veya ders talebi taşıdığını ölçmek ucuzdur ve uzak vadeye atılmamalı. Blog fabrikası ve geniş içerik operasyonu uzak kalabilir. |
| Öğretmen kullanımı | Panel uzak, keşif hemen/yakın | Hemen 5–8 görüşme; ürün yatırımı uzak | Planın kendi önerdiği manuel talep testi düşük eforludur. Bunu uzak vadeye koymak, en güçlü dağıtım kanalını gereksiz yere geciktirir. |
| Blog/haber | Katılıyorum | Uzak / şimdilik yapma | Sürekli editoryal yük üretir ve etkileşimli laboratuvar farkını güçlendirmez. |
| Forum/topluluk | Katılıyorum | Yapmama kararı korunmalı | Çocuk güvenliği, moderasyon ve kişisel veri yükü mevcut ürün sınırına ters düşer. Topluluk ihtiyacı önce hesap gerektirmeyen paylaşılabilir deneylerle test edilebilir. |

### Önerdiğim sıra

**Hemen**

1. 6-DOF için yönelim/eksen doğruluğu ve ardından responsive kontrol
   yerleşimi.
2. Review v2 subject manifesti ve review kuyruğunu report-only üretmek;
   otomatik sonuç ile insan onayını kesin ayırmak.
3. Yayındaki 39 ders için risk tabanlı kalite kuyruğu: değişmiş 13 ders,
   merkezi önkoşullar ve güvenlikle ilişkili iddialar önce.
4. Büyüme ölçüm sözleşmesi ve küçük kullanıcı testi: ilk anlamlı etkileşim,
   ilk kanıt, görevi terk etme nedeni ve geri dönme sinyali.

**Yakın vade**

1. Üç gerçek ders üzerinde uçtan uca v2 receipt pilotu.
2. Üç mevcut laboratuvarda paylaşılabilir, deterministik deney durumu.
3. Mevcut bileşenlerden kurulan küçük Oyun Alanı pilotu.
4. Beş ila sekiz öğretmenle görev-linki ve sınıf akışı testi.
5. Hazır olan taslakları “hat tamamı” yerine küçük, tutarlı dikey dilimler
   olarak yayınlama.

**Orta vade**

1. Review v2'yi yeni/değişen yayınlarda zorunlu kılmak ve 39 derslik borcu
   risk sırasıyla azaltmak.
2. Öğrenme ve paylaşım verisi değer gösterirse Oyun Alanı ile araçları
   genişletmek.
3. D–G hatlarını kaynak, görev ve kanıt ölçütleri tamamlandıkça açmak.
   Hat H için bağımsız safety uzmanı kapısı korunmalı.

**Uzak vade**

Talep kanıtlanırsa öğretmen ürünü, geniş SEO/içerik operasyonu ve offline
okul paketi. Blog ancak sürdürülebilir editoryal sahibi oluşursa; forum ise
mevcut güvenlik sınırı altında önerilmez.

## 2. Planın kaçırdığı somut fırsat

### Ölçülebilir, paylaşılabilir deney döngüsü

Plan Oyun Alanı ve küçük araçları ayrı özellikler olarak görüyor; bunların
nasıl kullanıcı getireceğini veya geri dönüş üreteceğini tanımlamıyor.
Platformun gerçek büyüme fırsatı, her laboratuvarın aynı deneyi başka bir
kişiye hesap açmadan aktarabilmesidir:

- Durum şeması; lab kimliği, şema sürümü, robot, parametreler, seed ve aktif
  adımı taşır. Öğrenci adı veya cihaz kimliği taşımaz.
- “Deneyi paylaş” eylemi kısa URL/QR ya da yerel JSON üretir. Alıcı aynı
  başlangıç durumunu görür, sonucu yeniden çalıştırır ve kendi dalını
  oluşturabilir.
- Öğretmen paneli kurulmadan öğretmen bir görev durumunu paylaşabilir;
  öğrenci kanıt JSON'unu geri verebilir.
- Seed'li planlama ve hata enjeksiyonu deneyleri tekrar üretilebilir olur.
  Bu hem bilimsel kalite hem dağıtım avantajıdır.
- Küçük araç, ders ve Oyun Alanı birbirinden kopuk sayfalar olmaktan çıkar;
  paylaşılan durum ilgili kavrama ve derse geri bağlanır.

Bu döngünün önünde gizlilik ölçüm sözleşmesi kurulmalı. Hesap, reklam kimliği
ve kişisel profil olmadan yalnız toplu ürün sinyalleri izlenmeli:

- ilk 30 saniyede anlamlı kontrol kullanıldı mı;
- bir ders içinde ilk “observed/passed” kanıtına ulaşıldı mı;
- deney durumu paylaşıldı mı ve paylaşılan durum açıldı mı;
- kullanıcı testi sırasında nerede ve neden bırakıldı.

İlk pilotun kabul ölçütleri:

1. Üç farklı laboratuvarda aynı durum URL'den deterministik geri yüklenir.
2. Mobilde paylaş/kopyala geri bildirimi ve klavye akışı çalışır.
3. URL/JSON kişisel veri, serbest kullanıcı metni veya gizli kaynak taşımaz.
4. Şema sürümü eski bağlantıları kontrollü biçimde migrate eder ya da açıkça
   uyumsuz der.
5. Beş öğrenci ve üç öğretmen testinde alıcı, açıklama almadan aynı deneyi
   yeniden çalıştırabilir.

Bu fırsat, genel bir açı çeviriciden daha değerlidir: hem öğrenme kanıtını
güçlendirir hem platformun doğal paylaşım kanalını oluşturur.

## 3. Review makbuzu sistemini akıllandırma — bağımsız tasarım

### Mevcut v1'in doğru yaptığı şey

- lib/lessonArtifact.ts:22-43 ders gövdesi ile frontmatter'ı kanonikleştirip
  SHA-256 artifact'ına bağlıyor.
- lib/reviewReceipts.ts:55-91 içerik değiştiğinde eski makbuzu güncel insan
  onayı gibi göstermiyor.
- scripts/check-review-integrity.ts:28-43 yeni bir yayını güncel makbuz
  olmadan engelliyor.
- scripts/check-review-debt.ts:5-30 legacy borç kümesini donduruyor; yeni
  ders sessizce borç listesine eklenemiyor.

Bu dürüst bir v1 tabanıdır. Ancak content/review-receipts.json şu anda
0 makbuz içeriyor; content/review-debt.json ise 13 değişiklik-sonrası eski
ve 26 legacy olmak üzere 39 açık kayıt taşıyor. Sistem bugün tamamlanmış bir
review operasyonu değil, sahte güveni engelleyen bir iskeledir.

### Kritik boşluk

Artifact yalnız MDX gövdesi ve frontmatter'ı kapsar. Öğrencinin kullandığı
JointSliders, RobotArm, robot tanımı, worker, matematik motoru veya fixture
değiştiğinde ders hash'i aynı kalabilir. Dolayısıyla v1 “metin aynı”yı
kanıtlar; “öğrencinin deneyimi aynı ve doğru”yu kanıtlamaz.

Diğer eksikler:

- sourceCommit yalnız 40 hex karakter biçiminde kontrol ediliyor; commit'in
  varlığı, main'in atası olması ve artifact'ı gerçekten üretmesi
  doğrulanmıyor.
- Reviewer adı ve rolü dolu mu diye bakılıyor; kimlik, yetki ve scope-role
  eşleşmesi doğrulanmıyor.
- Tek kişi tek receipt içindeki bütün scope'ları üstleniyor; farklı uzmanlar
  bağımsız karar veremiyor.
- Approved, changes-requested, conditional ve supersedes kararları yok.
- Safety kapsamı yalnız h-guvenlik hattından çıkıyor; başka hatlardaki
  çarpışma, kuvvet, gerçek robot hareketi ve vendor limitleri kaçabilir.
- Tek JSON dosyası append-only değil; eski kayıt sessizce değiştirilebilir
  ve paralel review işlerinde çakışma üretir.

### Önerilen v2: subject + attestation + policy

**Review subject**

Her ders sürümü aşağıdaki bağımsız köklerden oluşmalı:

- contentHash: öğrenciye görünen metin, kazanım, soru ve öğretim metadatası;
- sourceManifestHash: yapılandırılmış kaynaklar ve ileride claim-source
  bağları;
- interactionManifestHash: MDX AST'den gerçekten kullanılan bileşenler,
  canonical prop'lar ve bunların transitive kaynak bağımlılıkları;
- fixtureManifestHash: oracle, tolerans, robot spec'i, worker ve kullanılan
  doğrulama fixture'ları;
- policyHash: uygulanan review checklist/risk politikasının sürümü;
- sourceCommit ve bütün bunlardan türetilen revisionRoot.

Yayın durumu ve eski reviewer alanları contentHash'e karıştırılmamalı.
“İncelemeden yayına” geçişi, öğrenciye görünen içerik değişmediyse gereksiz
review invalidation üretmemeli.

**Scope başına immutable attestation**

Her kayıt tek subject, tek scope ve tek reviewer kararı olmalı:

- scope: source, technical, pedagogical veya safety;
- decision: approved, changes-requested ya da conditional;
- reviewerId, public rol, reviewedAt ve checklistVersion;
- evidence referansları ve kısa gerekçe;
- gerekiyorsa supersedes ile önceki kaydı geçersiz kılan yeni kayıt.

Eski dosya düzenlenmemeli veya silinmemeli; düzeltme yeni attestation ile
yapılmalı. Genel “güncel” durumu, gerekli scope'ların policy'ye göre güncel
attestation'larından hesaplanmalı.

**Reviewer policy**

Reviewer registry, hangi kişinin hangi scope için yetkili olduğunu açıkça
tanımlamalı. Safety ve yüksek riskli içerikte yazarın tek başına onayı
yeterli sayılmamalı; gerçek uzman yoksa arayüz dürüstçe “uzman incelemesi
bekliyor” demeli.

### Akıllı invalidation, otomatik onay değil

| Değişiklik | Varsayılan olarak eskiyecek kapsam |
|---|---|
| Kazanım, soru veya MDX gövdesi | source + technical + pedagogical; riskliyse safety |
| Kaynak/claim bağı | source + technical; riskliyse safety |
| Bileşen, robot spec'i veya worker | technical + pedagogical; riskliyse safety |
| Fixture, oracle veya tolerans | technical; riskliyse safety |
| CSS, klavye veya ekran okuyucu davranışı | pedagogical + otomatik erişilebilirlik sonucu |
| Checklist/policy | Yalnız policy'nin etkilediği scope |

AI veya diff sınıflandırıcısı “yalnız yazım düzeltmesi olabilir” diyebilir;
önceki insan onayını kendi başına taşıyamaz. Reviewer değişikliği görüp açık
bir carry-forward kararı verirse yeni subject için yeni attestation oluşur.

Örnekleme de aynı sınıra tabidir. Örnekleme, corpus genelindeki yazım
kalıpları ve hata oranı için güven sinyali üretir; okunmayan tekil bir dersi
“insan onaylı” yapmaz. Otomatik testler machine evidence üretir, human
receipt üretmez.

### Deterministik review kuyruğu

Elle tutulan genel liste yerine CI şu alanlarla review kuyruğu üretmeli:

- hangi ders ve revisionRoot;
- hangi dependency'nin değiştiği;
- hangi scope'ların eski olduğu;
- gereken reviewer rolü/quorum;
- önceki karar ve tarih;
- kaynak tazeliği/link uyarısı;
- yayın engeli ve risk önceliği.

Kuyruk sırası:

1. changes-requested veya safety/yüksek riskli yayın;
2. değişmiş ve hâlen production'da olan ders;
3. yeni yayın adayı;
4. önkoşul grafiğinde merkezi ders;
5. 13 stale legacy ders;
6. kalan 26 legacy ders.

Kaynak linkinin ölmesi veya yeni sürüm çıkması, içerik değişikliğinden ayrı
refresh-due durumu olmalı.

### CI ve arayüz

CI:

- TypeScript type cast yerine strict JSON Schema doğrulaması;
- gerçek tarih, enum, duplicate ve supersession zinciri kontrolü;
- sourceCommit'in Git nesnesi ve main atası olduğunu doğrulama, manifesti o
  commit'ten yeniden hesaplama;
- reviewer-scope yetki matrisi;
- mevcut attestation'ın değiştirilmesini/silinmesini base branch'e karşı
  engelleme;
- insan ve makine kanıtını ayrı tutma;
- PR'a okunabilir review queue artifact'ı ekleme.

Arayüz tek bir yeşil “doğrulandı” yerine scope başına şunları gösterebilmeli:

- güncel insan onayı;
- otomatik kontrol geçti;
- koşullu/kısmi onay;
- ders metni değişti;
- etkileşim motoru değişti;
- kaynak yenilemesi gerekiyor;
- değişiklik istendi;
- uygulanmaz.

Örnek açıklama: “Ders metni değişmedi; JointSliders deney motoru değiştiği
için teknik ve pedagojik inceleme yenilenmeli.” Bu, hash'i kullanıcıya
göstermekten daha anlaşılırdır.

### Geçiş planı

1. V1 kapısını koru; v2 manifest ve kuyruğu önce report-only çalıştır.
2. Strict şema, reviewer policy ve scope başına immutable dosyaları ekle.
3. Bir yayın, bir merkezi önkoşul ve uzman bulunabiliyorsa bir yüksek riskli
   ders üzerinde gerçek insan pilotu yap. Boş receipt listesine sahte
   migration verisi yazma.
4. Interaction/fixture dependency hash'lerini ve stale nedenlerini arayüze
   aç.
5. Yeni/değişen yayınlarda v2'yi zorunlu kıl.
6. Önce 13 stale, sonra risk sırasına göre 26 legacy borcu erit.

Temel ilke: sistem insanın neyi incelemesi gerektiğini küçültsün ve kanıtı
bağlasın; insanın yapmadığı incelemeyi yapılmış gibi göstermesin.

## 4. 6-DOF ekrana sığmama — kapsam ve kök neden

### Kesin sayım

Kod tabanında generic-6dof kullanan toplam **8 ders embed'i** var ve hepsi
ortak RobotArm renderer'ına gider:

| Kullanım | Yayında | Taslak | Toplam |
|---|---:|---:|---:|
| JointSliders | 6 | 1 | 7 |
| CodeRunner | 0 | 1 | 1 |
| Toplam 6-DOF embed | 6 | 2 | 8 |

Yayındaki altı JointSliders dersi:

- a-lise-koordinat-sistemleri.mdx:29
- a-lise-serbestlik-derecesi.mdx:28
- a-lise-tcp-kavrami.mdx:29
- a-universite-dh-parametreleri.mdx:30
- a-universite-kinematik-zincir.mdx:29
- a-universite-poz-gosterimleri.mdx:30

Taslaklar:

- g-universite-urdf-modelleme.mdx:34 — JointSliders;
- d-universite-mecademic-python.mdx:54-55 — CodeRunner.

Bu nedenle:

- “altı kaydırıcı tek ekrana sığmıyor” kusurunun kapsamı **7 JointSliders
  sahnesi**, production etkisi **6 sahne**;
- ortak 6-DOF görselleştirme kusurunun kapsamı **8 embed / tek renderer**;
- CodeRunner altı kaydırıcıyı taşımadığı için aynı yerleşim kusuruna dahil
  değildir, fakat aynı yönelim renderer'ını kullandığı için pedagojik
  görselleştirme kusuruna dahildir.

### Ölçülen davranış

Canlı production'da 390 × 844 viewport ile altı yayın rotasının her birinde:

- 6 range input bulundu;
- JointSliders kutusu **902 px** yüksekliğinde;
- 3B sahne **324 px** yüksekliğinde;
- yatay taşma yok.

1440 × 900'de kutu yaklaşık **1049 px** oluyor; genişleyen 16:9 sahne
yüksekliği artırdığı için sorun masaüstünde de “tek viewport” açısından
çözülmüyor. Mevcut E2E kontrolü ana sayfa yatay taşmasını ölçüyor; 6-DOF
widget yüksekliğini veya J6'nın gözlemlenebilir sonucunu ölçmüyor.

### Kök neden 1: kamera değil, dikey yerleşim

- components/interactive/JointSliders.tsx:38 dış kabı flex-column kuruyor.
- :45 sahneyi mobilde tam genişlik kare, daha genişte 16:9 gösteriyor.
- :49-82 robotun bütün eklemlerini tek dikey listede map ediyor.
- :56 ve :74 her range kontrolünü erişilebilir biçimde 44 px yüksek tutuyor.

44 px hedef doğru karardır; problem bu hedefleri küçültmek değil, altı
kontrolü sahnenin altına tek kolonda yığmaktır. Kamera uzaklığını artırmak
widget yüksekliğini hiç azaltmaz.

RobotArm.tsx:84-85 kamerayı [0, 0.4, 4.6] ve 50° FOV ile sabitliyor. Mevcut
robot boyutlarıyla yasal açı örneklerinde geometri canvas dışına taşmadı.
Bounds tabanlı deterministik auto-fit dayanıklılık için eklenebilir, ancak
ölçülen “ekrana sığmama” sorununu tek başına çözmez.

### Kök neden 2: J6 ve yönelim görünmüyor — daha önemli pedagojik eksik

components/scene/RobotArm.tsx:59-73 yalnız forwardKinematics sonucundaki
jointPositions noktalarını silindir ve kürelerle çiziyor. Joint transform,
eksen oku, taban/tool frame'i veya TCP yönelimi render edilmiyor.

genericSixDof.ts:28-30 ve :40-42 içindeki wrist dönüşümlerinde ardışık
eklemlerin konumları çakışabiliyor. J6 kendi ekseni etrafında yönelimi
değiştirir; eklem noktalarının konumunu değiştirmez. Renderer yalnız konum
çizdiği için J6 kaydırıcısı hareket ettirildiğinde sahnede hiçbir görünür
sonuç oluşmaz. JointSliders.tsx:85-88 de yalnız uç x/y değerini gösterir;
z ve yönelim metin özetinde yoktur.

Bu doğrudan ders hedefini bozar:

- a-lise-serbestlik-derecesi.mdx:56-58 öğrenciden altıncı eklemden
  başlayarak “konum mu, yönelim mi?” tahmini yapmasını ve kaydırıcıyla
  kontrol etmesini istiyor. J6 sonucu görünmediği için görev doğrulanamaz.
- a-universite-poz-gosterimleri.mdx:30 sonrasında Euler açıları, dönme
  matrisi ve kuaterniyon anlatılıyor; fakat etkileşim yönelimi hiç
  göstermiyor.
- a-lise-tcp-kavrami.mdx:33-46 TCP'nin konum kadar alet yönüne bağlı
  olduğunu anlatırken sahnede tool frame veya gerçek alet yönü yok.

Bu yüzden doğru öncelik “kamerayı sığdır” değil:

1. **Semantik doğruluk:** aktif eklem ekseni, base/tool-frame triadı ve TCP
   yönelimi; x/y/z ile uygun orientation özeti. J6 döndüğünde TCP konumu
   sabit kalabilir ama tool triadı açıkça dönmelidir.
2. **Yerleşim:** mobilde J1–J3 “kol” ve J4–J6 “bilek” grupları; geniş
   ekranda sticky sahne + iki kolon kontrol. 44 px hedefler korunmalı,
   iç içe dikey scroll yapılmamalı.
3. **Görsel okunabilirlik:** aktif joint'i renkle vurgulamak, üst üste binen
   wrist eklemlerini eksen halkalarıyla ayırmak ve sıfır pozundan daha
   okunur bir öğretim pozu sunmak.
4. **Kamera dayanıklılığı:** robot bounds'undan padding'li deterministik
   fit; rastgele sabit zoom değişikliği değil.

Kabul matrisi 7 JointSliders embed'ini 390, 768 ve 1440 px'te; ortak
renderer nedeniyle CodeRunner embed'ini de kapsamalı. Her J1–J6 kontrolü
konum veya yönelim üzerinden gözlemlenebilir sonuç üretmeli; özellikle J6
tool triadını döndürmeli. Klavye, touch, reset, metin özeti ve yatay taşma
test edilmelidir.
