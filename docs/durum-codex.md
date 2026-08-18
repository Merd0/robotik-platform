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

# Sonraki faz — bağımsız analiz

> Denetim tarihi: 2026-08-11
>
> İncelenen sürüm: `main@48a8d2fded7e063357bedad54f26bbfb6e3fc175`
>
> Kapsam: `docs/00-vizyon.md`, `docs/12-buyume-plani.md`, iki durum belgesi,
> `docs/fikirler.md`, `app/`, `components/`, `lib/robotics/`, `content/`, CI,
> review ve Evidence zinciri. Uygulama kodu değiştirilmedi.

## Yönetici kararı

Platformun bir sonraki büyük fazı **“daha çok ders”**, genel bir oyun alanı
veya öğretmen paneli olmamalı. Bir sonraki fazın adı ve amacı şu olmalı:

> **Rota ve Kanıt — 89 sayfalık kataloğu, doğru başlangıçtan ölçülebilir
> başarıya ve geri dönüşe uzanan bir öğrenme ürününe dönüştür.**

Bugünkü en büyük eksik içerik miktarı değil, şu döngünün tamamlanmamış olması:

`keşfet → doğru yerden başla → bir şey başardığını gör → sıradakini bil → geri dön`

Platform ilk üç adımın parçalarına sahip; bunları tek ürün döngüsü olarak
birleştirmiyor. Kullanıcı yaş seviyesini seçtikten sonra 18, 25 veya 46 derslik
bir katalogla karşılaşıyor. Geri geldiğinde ana sayfada kaldığı yer yok. Ders
sonunda 89 dersin 79'unda ölçülebilir başarı tanımı hiç yok; tanımı olan
derslerden birinin olay sözleşmesi de mevcut UI ile geçilemez durumda.

Bu nedenle `docs/12-buyume-plani.md` güncel yol haritası olarak kullanılmamalı:

- 6-DOF yerleşim, J6 ekseni ve tool yönelimi `b240f45` ile düzeltildi;
- 50 taslağın tamamı yayımlandı; bugün 89/89 ders `yayinda`;
- Review Receipt v2 kuruldu ve insan review'u kalıcı kararla opsiyonel oldu;
- sözlük terim rotaları, ders OG görselleri ve JSON-LD gibi SEO derinleştirmesi
  de temel seviyenin ötesine geçti.

Dolayısıyla eski plandaki iki “hemen” işi ve “50 taslağı aç” orta-vade işi
tamamlanmış/stale kabul edilmeli. Oyun alanı iyi bir vitrin fikri olmaya devam
ediyor, fakat devam döngüsünden önce yapılırsa ziyaret üretip öğrenme ilişkisi
kuramayan ayrı bir oyuncak olma riski yüksek.

## 1. Mevcut durum — doğrulanan gerçek envanter

| Alan | Güncel gerçek | Yorum |
|---|---:|---|
| Ders | **89/89 yayında** | Ortaokul 18, lise 25, üniversite 46; taslak 0 |
| Müfredat | **8 hat × 3 seviye** | 24 hat-seviye hücresinin tamamı dolu; toplam 1.269 dakika |
| Ön koşul grafiği | **89 kenar** | 81 dersin ön koşulu var; 17 kenar seviye değiştiriyor |
| Sözlük | **72 terim + 72 tekil rota** | DefinedTerm JSON-LD ve sitemap kayıtları var |
| MDX etkileşimi | **19 izinli bileşen** | 18 tür frontmatter'da fiilen kullanılıyor; ayrı capstone da var |
| Ders deneyimi | **78 temel etkileşimli, 11 okuma+Quiz** | 11'in 10'u üniversite dersi |
| Quiz | **79 ders** | Yaygın, fakat tek başına performans kanıtı sayılmıyor |
| Evidence | **11 predicate / 10 benzersiz ders** | Bir predicate mevcut UI ile geçilemez; gerçek kapsam daha da dar |
| Kaynak | **156 kayıt** | 140 legacy string, yalnız 16 yapılandırılmış SourceRef |
| Review v2 | **3 kapsam makbuzu / 1 ders** | 88 dersin tam güncel v2 insan makbuzu yok; review opsiyonel |
| SEO | **yaklaşık 192 sitemap URL'si** | Ders OG, Course/LearningResource JSON-LD, terim JSON-LD, robots ve canonical var |
| Gizlilik | Hesap/çerez/profil yok | Evidence yalnız localStorage'da; dışa aktarma kullanıcı eylemiyle |

Kullanıcının özetindeki sözlük, arama, capstone, 4+ laboratuvar, dark mode,
cesur tasarım, CI/güvenlik ve SEO ifadeleri doğru. İki düzeltme gerekli:

1. “4+ bileşen” mevcut ürünü küçük gösteriyor: allowlist 19 bileşen, beş derin
   dikey laboratuvar ve ayrı robot hücresi capstone'u var.
2. “89 ders tamamlandı” yalnız yayın durumunu anlatır. Pedagojik performans,
   kaynak biçimi ve insan doğrulaması bakımından 89 ders eşit olgunlukta değil.

İçerik hacmi yaklaşık 29.900 kelime. Bununla birlikte 89 dersin tamamı aynı
ana başlık ritmini kullanıyor: `Kanca`, `Ne oldu`, `Gerçek dünyada`, `Sonraki`;
87 derste ayrıca `Dene` var. Bu tutarlılık gezinmeyi kolaylaştırıyor, fakat
art arda kullanımda “aynı şablonun yeniden doldurulması” hissi doğurabilir.
Sonraki içerik turu yalnız cümle çeşitlendirmek değil; vaka, hata ayıklama,
tasarım savunusu, karşı-örnek ve kaynak okuma gibi farklı öğrenme eylemleri
üretmek zorunda.

## 2. Boşluk analizi

### En büyük eksik

**89 yayınlık kataloğun keşif → doğru başlangıç → ölçülebilir başarı → kaldığın
yerden dönüş döngüsü yok.** Bu yorum değil, kodun birlikte gösterdiği sonuçtur:

| Döngü adımı | Kodda bugün olan | Kullanıcıda oluşan kırılma |
|---|---|---|
| Keşif | Ana sayfa üç yaş seviyesi sunuyor | Amaç, süre veya meraka göre başlangıç yok |
| Rota | 89 ön koşul kenarı var | Ana sayfadaki 8 hat kutusu link değil; ön koşullar dersin en sonunda |
| İlk başarı | Etkileşim ve Quiz var | 79 derste predicate yok; panel “Kanıt tanımsız” diyor |
| Dönüş | Evidence localStorage'da tutuluyor | Ana sayfa onu okumuyor; “Devam et” yok |
| İlerleme görünürlüğü | Hat sayfasında rozet var | Üç seviye sayfasında rozetler `sr-only`; gören kullanıcıdan gizli |
| Taşınabilirlik | JSON dışa aktarma var | JSON'u içe alan/okuyan/doğrulayan hiçbir ürün yüzeyi yok |
| Seviye değişimi | Vizyon aynı kavramı üç derinlikte vaat ediyor | Ders düzeyinde “aynı kavramın diğer seviyesi” eşlemesi yok |

Ana sayfadaki “Müfredat haritası” sekiz `div` üretir; kullanıcı bir hatta doğrudan
giremez. Derslerin 81'inde en az bir ön koşul olmasına rağmen bu uyarı,
`LessonCompletionPanel` sonrasındaki alt navigasyonda görünür. Aramayla ileri
bir derse inen öğrenci, yanlış yerden başladığını dersi bitirdikten sonra öğrenir.

### Ortaokul öğrencisi

- 18 dersin 17'sinde temel bir etkileşim var; ürünün en güçlü persona yüzeyi bu.
- Buna rağmen yalnız 2 ders predicate registry'sinde. Bunlardan
  `b-ortaokul-eklemleri-oynat` için predicate J1/J2 `observed` olayı ister,
  revolute `JointSliders` ise yalnız `tried` yazar. Bu ders mevcut UI ile dürüst
  biçimde `Kanıtlandı` olamaz.
- `h-ortaokul-temel-guvenlik-kurallari` okuma+Quiz'dir; vizyondaki “önce oyna”
  ilkesinin tek ortaokul istisnasıdır.
- Global “Canlı lab” aynı mm/piksel, fikstür, mm/s ve ayrım mesafesi dilini tüm
  yaşlara sunar; ortaokul çerçevesi yoktur.

Muhtemel bırakma noktası: 8 hat/18 kart arasından “bugün benim için doğru olan
hangisi?” sorusuna cevap alamamak; deneyi yaptıktan sonra da başarının ve
sıradaki küçük adımın görünmemesi.

### Lise öğrencisi

- 25/25 derste temel etkileşim var ve üç gerçek Pyodide/Python laboratuvarı
  bulunuyor. “Kod çalıştıramıyorum” artık doğru boşluk değildir.
- Yalnız 2 lise dersi predicate kapsamındadır. Birçok derste sahne değişir ve
  Quiz çözülür, ancak ürün bunun hedef beceriye dönüştüğünü söyleyemez.
- Ortaokul sezgisinden üniversite matematiğine aynı deney durumu üzerinden
  geçiş yok; kullanıcı yeniden seviye ana sayfasına ve kart listesine döner.

Muhtemel bırakma noktası: tek tek iyi deneylerin bir proje/rota hissi vermemesi.
Öğrenci “bunu denedim; şimdi ne yapabiliyorum?” sorusuna ürün düzeyinde cevap
alamıyor.

### Üniversite öğrencisi / mühendis

- 46 dersin 10'u yalnız okuma+Quiz: hız-ivme profilleri, ABB RAPID, FANUC,
  KUKA KRL, ROS 2, endüstriyel protokoller ve dört güvenlik dersi bu kümede.
- Yalnız 6 üniversite dersi predicate registry'sinde.
- 156 kaynak kaydının 140'ı legacy string; yalnız 16'sı yapılandırılmıştır.
  89 dersin sadece 23'ünde kullanıcıyı açılabilir bir URL'ye götüren en az bir
  kaynak bulunur. Kaynak sürümü, sayfa/konum ve iddia-kaynak eşlemesi çoğunlukla
  makinece doğrulanamaz.
- Trust paneli yalnız tam `verified` makbuzu gösterir; 88 dersin missing,
  legacy veya untracked durumu kullanıcıdan bilinçli olarak saklanır. Buna
  karşılık “her teknik iddia kaynaklara dayanır” cümlesi mevcut otomatik
  garantiden daha güçlüdür.

Muhtemel bırakma noktası: ileri düzey kullanıcı formülü ve sonucu görür, fakat
sayının hangi fixture/model/sürümden geldiğini ve hangi kaynağın hangi iddiayı
desteklediğini izleyemez. Bu, platformun üniversite düzeyindeki en büyük güven
ve farklılaşma fırsatıdır.

### Öğretmen

- `/ogretmen`, `/odev`, `/ilerleme`, çalışma kâğıdı veya çıktı rotası yoktur.
- Öğrenci Evidence JSON'u indirebilir; platform onu geri içe alamaz ve insan
  dilinde özetleyemez. Öğretmen dosyayı alsa bile ürün içinde anlamlandıramaz.
- Görev durumu/seed'i içeren kalıcı link, beklenen yanılgı, süre planı ve
  cevap/kanıt açıklaması yoktur.
- 79 derste ölçülebilir bitiş olmadığı için “şu görevi yap ve kaydı getir”
  akışı yalnız küçük bir ders alt kümesinde dürüstçe kurulabilir.

Muhtemel bırakma noktası: öğretmen iyi bir sayfa bulur, fakat onu 40 dakikalık
ders akışına dönüştürmek, öğrenciye aynı görevi vermek ve sonucu okumak için
platform dışı işi kendisi yapmak zorunda kalır. Büyük bir panelden önce gereken
ürün **hesapsız görev paketi + yerel Evidence okuyucu**dur.

### İkinci derecede ama somut keşif hataları

- Her sözlük teriminin “İlgili dersler” bölümü terimin gerçekten geçtiği
  dersleri değil, aynı hattaki bütün dersleri listeler. JSON-LD `subjectOf` da
  aynı kaba eşlemeyi tekrarlar. 72 SEO giriş sayfası var, ancak semantik huni
  gerçek terim-ders ilişkisine dayanmıyor.
- `/ara` sayfası hâlâ taslakları “henüz insan gözden geçirmesinden geçmemiş”
  diye açıklıyor. Review artık opsiyonel ve taslak sayısı sıfır; bu güven kıran
  bir ürün metni borcudur.
- Aynı bileşen çok sayıda derste tekrar kullanılıyor: örneğin JointSliders 17,
  PlannerRace 12 derste. Yeniden kullanım teknik olarak doğru; her dersin farklı
  bir gözlem/görev üretip üretmediği ayrıca denetlenmediğinde pedagojik çeşitlilik
  yalnız farklı metinden ibaret kalabilir.

## 3. Platforma yeni boyut katacak sekiz fikir

Aşağıdaki liste; oyun alanı, DH/birim araçları, URDF yükleme, sesli komut,
çoklu robot, AGV hattı, İngilizce, forum ve büyük öğretmen paneli gibi daha önce
belgelenen fikirleri bilerek tekrar etmez.

| Fikir | Ne? | Neden değerli? | Efor | En büyük risk |
|---|---|---|---|---|
| **1. Robotik Yol Bulucu** | Yaş testi değil; hareket tahmini, sinyal sırası ve güvenli karar gibi üç 30 saniyelik mikro görevden sonra yalnız tarayıcıda “şuradan başla, çünkü…” diyen 3 derslik rota | 18/25/46 kartlık soğuk başlangıcı çözer; Hero, Signal, Planner, Safety, `onkosul`, `sure` ve Evidence'ı yeniden kullanır | Orta | Sonucu sınav/seviye etiketi gibi sunmak; her zaman manuel seçim ve “öneridir” dili olmalı |
| **2. Kavram Asansörü** | Aynı deney durumu için “gör → hesapla → sınırını kanıtla” geçişi; örneğin aynı iki-eklem pozu ortaokul, lise ve üniversite açıklamalarında korunur | Vizyonun üç derinlik vaadini gerçek bir ürün özelliğine çevirir; kullanıcı seviye ana sayfasında kaybolmaz | Orta–büyük | Kavramları zorla eşlemek ve state sözleşmelerini standartlaştırırken bileşenleri katılaştırmak |
| **3. Deney Kaydı Okuyucu** | Evidence v2 JSON'u sürükle-bırakla tarayıcıda açar; şema, contentVersion ve predicate'i kontrol edip “denendi / kanıtlandı / eski sürüm” raporu verir | Bugünkü tek yönlü export'u hesapsız öğretmen iş akışına dönüştürür; sunucuya dosya göndermez | Küçük–orta | JSON düzenlenebilir; asla sertifika veya kişi doğrulaması iddia etmemeli, “imzasız yerel kayıt” demeli |
| **4. Haftanın Robotik Vakası** | 5–8 küratörlü şablondan hafta+seed ile statik build'de üretilen ortak arıza/rota/kinematik vakası; aynı vaka linki ve OG kartı | Blog yazmadan geri dönüş ve paylaşım nedeni üretir; öğretmen aynı vakayı sınıfa atabilir | Orta | Az şablonla hızla tekrar hissi; streak/leaderboard kurmadan haftalık ve küratörlü kalmalı |
| **5. “Bu sayı nereden geldi?” hesap izi** | Kritik çıktıya tıklanınca formül kimliği, girdiler, birimler, yuvarlama, robot/fixture, motor sürümü ve kaynak görünür | Üniversite ve öğretmen güveninde gerçek farklılaşma; Dört Mercek yaklaşımını platform sözleşmesine yükseltir | Orta–büyük | Elle instrumentasyonun eskimesi; descriptor şeması ve varsayılan kapalı ayrıntı katmanı gerekir |
| **6. Hassasiyet Radarı** | Bir senaryoda parametreleri güvenli alanlarında tek tek pertürbe edip sonucu en çok oynatan varsayımları sıralar; safety, DLS, piksel-mm ve planner pilotları | Formül uygulamaktan robustluk/sistem düşüncesine geçirir; mevcut saf motorları kullanır | Orta | Kör ±%10 karşılaştırması yanlış öğretebilir; alan bazlı aralık, birim ve süreksizlik uyarısı şart |
| **7. Kaynak Dedektifi** | Bir teknik iddia ve 2–3 kamu kaynağı üzerinden “doğrudan destek / çıkarım / belirtilmemiş” görevi | Datasheet, standart ve kanıt sınırı okuryazarlığı öğretir; SourceRef dönüşümünü kullanıcı değerine bağlar | Orta | Link rot, sürüm ve telif; yalnız kısa paraphrase ve kesin sayfa/sürüm referansı kullanılmalı |
| **8. Mini-Lab Embed Kit** | Seçilmiş üç hafif 2B laboratuvar için kaynak, disclaimer ve tam derse dönüş linki taşıyan izole embed rotaları | Öğretmen/LMS/blog üzerinde ürünü bizzat deneyimletir; doğal backlink ve dağıtım yüzeyi üretir | Orta | Global CSP `frame-ancestors 'none'`; tüm siteyi açmadan yalnız allowlist embed rotasına ayrı politika ve performans bütçesi gerekir |

Moonshot adayı: **“Bir sayı değişince ne kırılır?”** sistem etkisi laboratuvarı.
Payload, erişim, ayrım mesafesi veya cycle-time değiştiğinde robot seçimi, rota,
hız ve program kararlarının hangilerinin yeniden açıldığını gösterir. Robot
Seçim Masası ve capstone state'ini gerçek sistem mühendisliği düşüncesine taşır;
ancak yanlış dependency modeli öğretme riski nedeniyle ilk faz işi değildir.

## 4. Gerçek kullanıcı kazanımı

### Öncelik 1 — indekslemeyi doğrula; yeni “SEO sayfası” üretme

Kodda teknik temel zaten güçlü: yaklaşık 192 URL'lik sitemap, robots, canonical,
ders OG görselleri, Course/LearningResource ve DefinedTerm JSON-LD var. Dışarıdan
2026-08-11'de yapılan sınırlı `site:` örneklemi alan adını sonuçlarda göstermedi;
bu **Search Console kanıtı değildir**, yalnız alarmdır.

İlk iş:

1. Kalıcı canonical alan adını seç; ileride özel alan adına geçilecekse backlink
   toplamadan önce geç. `SITE_URL` bugün kodda Vercel alan adına sabit.
2. Google Search Console ve Bing Webmaster üzerinden sitemap/coverage/URL
   inspection kontrolü yap. Siteye izleyici script eklemek gerekmez.
3. En değerli 10 URL'nin index durumu, canonical seçimi ve gerçek sorgusunu
   kaydet. Sitemap göndermek yalnız ipucudur, indeks garantisi değildir
   ([Google Search Central](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)).
4. Sözlük “ilgili ders” eşlemesini gerçek terim geçişine/küratörlü ilişkiye
   çevir; ince ve yanlış iç link ağıyla daha fazla sayfa üretme.

### Öncelik 2 — dar öğretmen/BİLSEM/meslek lisesi/robot kulübü pilotu

Büyük panel yapma. 5–8 eğitimciye ana sayfa değil, tek 15 dakikalık görev linki,
bir paragraf uygulama yönergesi ve Deney Kaydı Okuyucu ver. Başarı sinyali
“beğendim” değil; en az üç eğitimcinin aynı görevi ikinci kez gerçek grupta
kullanmasıdır.

Bu kanal projeye özellikle uygundur:

- tek öğretmen bir oturumda çok kullanıcı getirir;
- hesap/kurulum gerektirmeyen mimari okul ortamındaki sürtünmeyi düşürür;
- öğretmen geri bildirimi, 89 dersin hangisinin gerçekten öğretilebilir olduğunu
  genel web trafiğinden daha hızlı gösterir.

### Öncelik 3 — konu SEO'su değil, görev niyeti

“Ters kinematik nedir?” sayfası kullanıcıyı bütün kinematik hattına bırakmamalı;
doğrudan erişilebilir hedef veya çoklu çözüm deneyine götürmeli. İlk beş yüksek
niyetli girişte akış şu olmalı:

`30 saniyelik cevap → canlı görev → şaşırtıcı sonuç → neden → uygun seviye`

Yeni blog fabrikası yerine mevcut en iyi laboratuvarların sorgu niyetine göre
paketlenmesi daha güçlü ve daha az bakım ister.

### Öncelik 4 — sosyal medya ürün çıktısı olsun

Haftanın Vakasından 10–20 saniyelik tek şaşırtıcı sonuç ve aynı `caseId`'ye
giden link üret. Genel robotik haber, motivasyon sözü ve her ağ için günlük
takvim bu proje için zaman kaybıdır. Bir öğrenci odaklı kısa video kanalı;
üniversite/mühendis vitrini gerekiyorsa ikincil LinkedIn yeterlidir.

### Öncelik 5 — dağıtımı platform dışında kur, forumu platform içine alma

Mini-lab embed, öğretmen materyali ve GitHub katkı akışı yararlı topluluktur.
Site içi forum/Discord benzeri çocuk moderasyonu ise vizyonla çelişir ve asıl
üründen daha ağır bir operasyon doğurur. GitHub güven/katkıcı kanalıdır; 12–18
yaş öğrenci ediniminin ana kanalı değildir.

### Ölçüm, veri toplamama ilkesini bozmadan

- Ürüne analytics/session replay/kişisel profil ekleme.
- Arama görünürlüğünü Search Console'un toplulaştırılmış sorgu ve index raporuyla
  izle; siteye üçüncü taraf tracker koyma.
- Öğrenme kalitesini moderasyonlu 10/30/120 saniye testleri, küçük sınıf pilotu
  ve kullanıcının bilinçli gönderdiği Evidence dosyasıyla ölç.
- Kampanya başarısını kişi takibiyle değil, belirli görev linkinin sınıfta ikinci
  kullanım sayısıyla değerlendir.

### Şimdilik zaman kaybı

- sürekli blog/haber operasyonu;
- site içi forum veya çocuk topluluğu;
- talep doğrulanmadan öğretmen paneli;
- Türkçe ürünün geri dönüşü çözülmeden İngilizce çeviri;
- ilk başarı/geri dönüş ölçülmeden ücretli reklam ve influencer bütçesi;
- daha fazla ders ve yüzlerce ince sözlük/SEO sayfası;
- her sosyal ağ için genel içerik takvimi.

## 5. Teknik borç — ilerlemeyi yavaşlatacak gerçek riskler

### P0 — yeni ürün fazından önce

#### 1. Review yokluğu ile bozuk review verisi aynı şekilde “uyarı”

İnsan review'unun opsiyonel olması doğrudur; fakat mevcut makbuzun sahte/bozuk
olması opsiyonel bir konu değildir. Buna rağmen CI `REVIEW_STRICT=1` kullanmaz.
`check-review-integrity` şu durumlarda da exit 0 verir:

- makbuz hash/sourceCommit/rol/şema uyuşmazlığı;
- append-only kaydın silinmesi/değiştirilmesi;
- baseline dışı veya tahrif edilmiş review debt;
- yeni yayında yapılandırılmamış legacy kaynak.

Salt-okunur çalıştırma bugün **47 yeni-yayın/legacy-kaynak sözleşme uyarısı**
üretti ama başarılı çıktı. Çözüm: “makbuz yok” bilgi olarak kalmalı; **var olan
makbuz/debt bütünlüğü ve kaynak şeması ihlali koşulsuz fatal** olmalı. 47 mevcut
kayıt ayrı dondurulmuş migration baseline'ına alınmalı veya topluca
yapılandırılmalı; her CI'da aynı 47 uyarıyı basmak yeni hatayı görünmez yapar.

#### 2. `interactionHash` yok

`teachingHash` MDX gövdesi ve öğretim frontmatter'ını kapsar; kullanılan
`JointSliders`, `RobotArm`, robot spec, planner, worker, predicate veya başka
robotik motor uygulamasını kapsamaz. Çalışan matematik değişse bile:

- teknik/pedagojik/safety receipt güncel görünebilir;
- öğrencinin eski `Kanıtlandı` kaydı yeni davranışta geçerli sayılabilir.

Çözüm yönü: MDX AST'den kullanılan bileşenleri çıkaran deterministik bir
dependency manifest; bileşen + ilgili saf motor/robot spec/worker + predicate
sürümünden `interactionHash` ve gerekirse `fixtureHash`. Teknik/safety receipt
ve Evidence sürüm kökü bunu taşımalı; tarih/mtime kullanılmamalı.

#### 3. Evidence sözleşmesi bugün hem false negative hem false positive üretiyor

- `b-ortaokul-eklemleri-oynat` predicate'i J1/J2 `observed` ister. Revolute
  JointSliders her değişimde yalnız `tried` yazar; `observed` yalnız prismatic
  dalda pointer-up'ta var. Mevcut UI ile hedef geçilemez.
- `b-lise-ileri-kinematik` için eski `forward-kinematics-formula` predicate'i
  yeni FourLens olay adlarıyla artık bağdaşmaz; aynı dersin yeni predicate'i
  çalıştığı için ölü sözleşme sessizce kalır.
- Planner predicate'i algoritma adını sayarken `result === success` aramaz.
  Üç başarısız/timeout `observed + retry` olayı ve başarılı kavram yanıtı yanlış
  `passed=true` üretebilir.

Çözüm yönü: bileşen → event → predicate için tek tipli `LabContract` registry ve
conformance testi. Planner yalnız başarılı sonucu saymalı; slider pointer-up,
blur ve klavye commit'inde semantik `observed` üretmeli; ölü predicate
kaldırılmalı veya açıkça sürümlenmeli.

#### 4. Slider olayı localStorage'ı ve geçmiş ilerlemeyi aşındırıyor

JointSliders, IkTarget ve JacobianViz hareket sırasında çok sık event yazar.
Her event bütün diziyi senkron JSON.stringify + localStorage.setItem ile tekrar
yazar; sonra global son 1.000 olayı tutar. Uzun sürükleme:

- mobil ana thread/frame bütçesini tüketebilir;
- eski derslerin `read/passed` olaylarını sessizce FIFO dışına atabilir.

Çözüm yönü: görsel state anlık, kalıcı olay pointer-up/idle/onBlur/keyboard
commit'inde; observation'lar lesson/skill bazlı compact/dedupe; achievement ve
read kayıtları ayrı korunmuş store; global 1.000-event FIFO yerine semantik
kota ve performans testi.

### P1 — Rota ve Kanıt fazıyla birlikte

#### 5. Pyodide cold-load ile kullanıcı kodu aynı 8 saniyeye sıkışıyor

İlk CodeRunner çalıştırması yaklaşık **13.522.699 byte raw** Pyodide çekirdeğini
indirip başlatır. 8 saniyelik timer worker yaratılır yaratılmaz başlar; yalnız
kullanıcı kodunu değil cold-load'u da sayar. Yavaş ağda kod başlamadan timeout
olabilir. Dokuz CodeRunner dersi var; E2E gerçek cold-run yapmıyor.

Çözüm: worker `ready` handshake; indirme/başlatma ile kullanıcı kodu CPU
timeout'unu ayır; sürümlü immutable asset/cache; yükleme ilerlemesi ve retry;
cold-cache + yavaş ağ E2E.

#### 6. Performans kapısı yanlış yüzeyi ölçüyor

Mevcut script yalnız `out/index.html` başlangıç varlıklarına ve 650 KB
sıkıştırılmamış sınıra bakıyor. Oysa hedef dokümanda 200 KB sıkıştırılmış ve
asıl risk ders/3D/CodeRunner rotalarıdır. Aynı commit artifact ölçümünde home
yaklaşık 184 KB gzip, en basit ders yaklaşık 219 KB gzip ve lazy 3D chunk ayrıca
yaklaşık 242 KB gzip'tir. R3F canvas'lar animasyon olmadığı halde varsayılan
sürekli frameloop ve DPR 2 kullanır.

Çözüm: home + 3D'siz ders + 3D ders + CodeRunner için gzip/brotli ve lazy chunk
bütçesi; düzenli Lighthouse/INP; `frameloop="demand"`, adaptif DPR ve görünmez
canvas pause; gerçek orta sınıf telefon profili.

#### 7. Test matrisi viewport'u cihaz sanıyor

Üç Playwright projesi de `Desktop Chrome`; yalnız viewport 390/768/1440 olur.
Gerçek touch/hasTouch, WebKit/Safari, Firefox ve ekran okuyucu yoktur. Vitest
yalnız `lib/**/*.test.ts` toplar; kritik React interaction event sözleşmeleri
component testine sahip değildir. Canvas için piksel/screenshot doğrulaması yok.

Çözüm: kritik LabContract component testleri; en az bir gerçek mobile/touch
emülasyonu, WebKit/Firefox smoke, cold CodeRunner ve deterministik WebGL
screenshot; erişilebilirlikte yalnız axe değil klavye/duyuru akışı.

#### 8. Python oracle kapsamı vaat edilen yüzeyden dar

`reference-python/fixtures/` yalnız 2-DOF FK ve A* fixture'ı taşır. CI Python
test/generator çalıştırmaz. 6-DOF FK/yönelim, DLS sınırları ve safety için
bağımsız oracle yoktur; J6 gibi konvansiyon hataları ilişkisel TS testiyle yine
kaçabilir.

Çözüm: çoklu 6-DOF poz/yönelim, DLS normal/tekil/erişilemez ve safety sınır
fixture'ları; Python test + fixture drift CI kapısı; derlenmiş worker/Pyodide
smoke testi.

#### 9. Kaynak ve content şeması yarı yapılandırılmış

`gray-matter` verisi runtime doğrulama olmadan `as DersFrontmatter` cast edilir.
`check-content` bazı zorunlu alanları/kaynağı kontrol eder; enum, pozitif süre,
dosya yolu ↔ id/hat/seviye, sıra benzersizliği, gerçek JSX ↔ `etkilesimli`
manifesti ve component prop şeması tam bir sözleşme değildir. Quiz'in
frontmatter etkileşimine sayılıp sayılmadığı da açık tanımlı değil; ana sayfa
pazarlama sayısını bu metadata'dan üretir.

Çözüm: tek runtime içerik şeması + path/sıra kontrolleri; interaction manifestini
AST'den türet veya Quiz hariç kuralını açıkça kodla; izinli component prop'larına
build-time şema. 140 legacy kaynak string'ini SourceRef'e geçir; claim→source
bağı ve tıklanabilir sürüm/konum ekle.

#### 10. İçerik kataloğu build sırasında tekrar tekrar diskten okunuyor

`getAllLessons()` her çağrıda 89 MDX'i yeniden bulur, okur ve parse eder. Bir ders
sayfası lesson, prerequisite ve adjacent için 3–5 tam tarama yapabilir. 72 terim
sayfası yalnız ilgili dersleri kurmak için en az 72 × 89 = 6.408 MDX okuması
üretir. Bugün geçer; içerik büyüdükçe build süresi sayfa×ders ölçeğinde artar.

Çözüm: build-scope memoized katalog + id/hat/seviye/terim indeksleri; dev'de
dosya değişimini güvenli invalidation; ilişkileri her sayfada yeniden taramak
yerine önceden kurmak.

### P2 — güven ve bakım

#### 11. Policy split-brain

Root `CLAUDE.md` review'u opsiyonel der; daha özel `content/CLAUDE.md` reviewer
ve tarih zorunlu der. `lib/content.ts` yorumları, arama metni ve bazı build
yorumları eski “taslak = insan incelemedi” politikasını taşır. Ajanlar için daha
özel dosya kazanacağı için bu yalnız dokümantasyon kusuru değil, gelecekte
yanlış içerik değişikliği üreten bir talimat çatışmasıdır.

Çözüm: tek karar belgesi; “yayında” ve “insan doğrulamalı” durumlarını ayrı
isimlendir; instruction/comment/UI metinlerini aynı commit'te hizala. Trust
paneli “her teknik iddia kaynaklıdır” yerine gerçekten otomatik doğrulanan şeyi
söylesin.

#### 12. Sözlük ilişkisi ve canonical yapı semantik borç

Terim rotası aynı hattaki bütün dersleri “ilgili” sayar ve JSON-LD'ye yazar.
`SITE_URL`, layout, robots ve release check Vercel URL'sine ayrı ayrı sabittir.

Çözüm: küratörlü/gerçek metin eşleşmeli terim→ders bağı; canonical için tek
build-time config; alan adı değişiminde sitemap/OG/robots/release testinin tek
kaynaktan güncellenmesi.

## 6. Önerilen faz planı

### Faz 0 — gerçeklik ve bütünlük kapısı (küçük, önce)

1. Evidence'in imkânsız FK ve false-positive planner predicate'lerini düzelt.
2. Review yokluğunu bilgi, mevcut review/debt bütünlük ihlalini fatal yap.
3. Eski review/taslak/search/trust metinlerini tek politikayla hizala.
4. Sözlük “ilgili dersler” ve JSON-LD bağını gerçek ilişkiye geçir.
5. 47 legacy-source uyarısı için açık migration baseline/planı oluştur.

Bu işler kullanıcıya yeni özellik gibi görünmez; fakat sonraki fazın ilerleme ve
güven verisini yanlış temel üzerine kurmasını engeller.

### Faz 1 — Rota ve Kanıt çekirdeği (asıl büyük faz)

1. Ana sayfada yerel, görünür **“Kaldığın yerden devam et”** ve son anlamlı
   başarının ardından tek önerilen adım.
2. Seviye kartlarında görünür progress; ön koşulu ders başında gösteren “bu ders
   sana uygun mu?” kutusu.
3. Robotik Yol Bulucu: üç mikro görevden 3 derslik açıklamalı rota; hesap/veri yok.
4. 24 hat×seviye hücresinin her birinde en az bir **Evidence anchor**. Bugünkü
   10 benzersiz registry dersi körlemesine 89'a yaymak yerine önce 24 güvenilir
   merkez ders hedeflenmeli.
5. `LabContract` + `interactionHash`; event/predicate conformance testleri.
6. Evidence JSON Okuyucu; başka cihazda “güncel/eski/geçersiz” görünümü ve
   açık “sertifika değildir” sınırı.

### Faz 2 — dağıtım ürünleri (çekirdek çalışınca)

1. Beş–sekiz eğitimciyle tek görev + Evidence Okuyucu pilotu.
2. İlk beş görev-niyetli SEO girişinin canlı deneye doğrudan bağlanması.
3. Haftanın Robotik Vakası; önceden üretilmiş caseId ve paylaşım kartı.
4. Üç hafif 2B laboratuvarla güvenli Mini-Lab Embed pilotu.
5. Search Console coverage ve öğretmenin ikinci kullanım sinyaline göre devam.

### Faz 3 — derin mühendislik farkı

1. “Bu sayı nereden geldi?” provenance sözleşmesi.
2. Hassasiyet Radarı pilotları.
3. Kaynak Dedektifi ve claim-level SourceRef.
4. Sistem etkisi moonshot'ı; ancak dependency modeli bağımsız teknik/pedagojik
   incelemeden geçerse.

## 7. Bu fazın kabul ölçütleri

- İlk ziyaretçi 90 saniye içinde neden önerildiği açıklanan bir göreve ulaşır;
  isterse rota önerisini reddedip manuel seçer.
- Geri gelen kullanıcı ana sayfada tek tıkla son anlamlı yerine döner; progress
  gören kullanıcıdan gizli değildir.
- 24 hat×seviye hücresinin her birinde en az bir geçilebilir, false-positive
  üretmeyen Evidence anchor vardır.
- Component/robotik motor/predicate değişikliği ilgili review ve öğrenci kanıtını
  deterministik olarak eskitir.
- Evidence dosyası başka tarayıcıda yerel olarak açılır; eski sürüm ve imzasız
  kayıt açıkça ayrılır; hiçbir dosya sunucuya gitmez.
- “Makbuz yok” CI'ı bozmaz; bozuk/sahte/değiştirilmiş mevcut makbuz mutlaka bozar.
- Cold-cache CodeRunner yavaş ağ senaryosunda yükleme ve çalışma timeout'unu
  ayırır; kullanıcı kod başlamadan “kod timeout” görmez.
- En az üç eğitimci aynı görev paketini ikinci gerçek oturumda kullanır.
- Index coverage, Search Console ile doğrulanır; sitemap varlığı başarı diye
  sayılmaz.

## 8. Doğrulanamayanlar

- Production analytics olmadığı için gerçek bırakma/geri dönüş oranı bilinmiyor.
- Search Console ve Bing Webmaster hesaplarına erişim olmadığı için index
  coverage doğrulanmadı; dış `site:` örneklemi kesin ölçüm değildir.
- Gerçek ortaokul/lise/üniversite öğrencisi ve öğretmen gözlemi yapılmadı.
- Gerçek touch telefon, Safari/WebKit, ekran okuyucu ve düşük bant genişliği
  matrisi bu turda çalıştırılmadı.
- Robotik/safety iddialarının tamamı bağımsız uzman tarafından incelenmedi;
  güncel tam Review Receipt yalnız bir derste var.
- Gerçek robot, üretici koşullarının eşdeğerliği ve saha güvenliği bu eğitim
  platformundan doğrulanamaz.

## Sprint 4 — laboratuvar kanıt deseni rollout günlüğü

### 2026-08-12 · CodeRunner (9 ders)

- Bulgu: otomatik değerlendirme `error === null`, beklenen çıktı/poz ve sonuç
  toleransını doğru denetliyordu; olay yalnız koşu sonunda yazıldığı için her
  karede kayıt veya başarısız koşuda false-positive yoktu. Ancak bu başarıyı
  `passed` olayına yükseltecek registry predicate'i, dependency manifest kaydı
  ve paylaşılabilir state sözleşmesi yoktu.
- Düzeltme: `CodeRunner` bileşeni; `codeLab`, kinematik, Pyodide worker ve
  çalışma limitleri interactionHash kapsamına alındı. `python-command-trace-v1`
  yalnız başarılı otomatik poz testi + en az iki iz adımıyla geçiyor. Kod ve
  robot kimliğini taşıyan `code-runner/v1` state'i uzunluk/robot doğrulamasıyla
  eklendi ve paylaşım bağlantısı bileşene bağlandı.
- Test: 12 yeni kontrol (interaction/predicate bağlantısı, state golden ve
  negatifleri, predicate golden + üç negatif ve paylaşım E2E'si).

### 2026-08-12 · SignalTimeline (8 ders)

- Bulgu: bileşen hiçbir kanıt üretmiyor, el sıkışma sırasını ölçmüyor ve
  oynatma zamanlayıcılarını unmount sırasında temizlemiyordu. Bu yüzden mevcut
  dersteki doğru/yanlış düzen registry tarafından doğrulanamıyordu; eski bir
  false-positive predicate yoktu çünkü predicate hiç yoktu.
- Düzeltme: ilk istek ve onay adımlarını saf motorda karşılaştıran görev yalnız
  `Oynat` commit'inde değerlendirilir; ters, eşzamanlı veya eksik sıra başarı
  sayılmaz. `handshake-signal-order-v1`, bileşen+motor manifesti,
  `signal-timeline/v1` boyut/doğrulama sözleşmesi, paylaşım/geri yükleme ve
  zamanlayıcı temizliği eklendi.
- Test: 16 yeni kontrol (motor golden + üç negatif, state round-trip ve dört
  negatif/geçerlilik kontrolü, interaction/predicate bağlantısı, predicate
  golden + üç negatif ve paylaşım+kanıt E2E'si).

### 2026-08-12 · SafetyZone (5 ders)

- Bulgu: kanıt/predicate/state zinciri yoktu. Ayrıca ders ve görsel bantlar,
  adaptif hız motorundaki `requiredSeparation` değerini “robotun durduğu
  mesafe” diye yorumluyordu; bu değer gerçekte tam hızdan yavaşlamaya geçiş
  sınırıydı. Kırmızı duruş bandı da motorun sıfır hız eşiğiyle uyuşmuyordu.
- Düzeltme: dur/yavaşla/tam hız bantları `allowedSpeed` ile aynı eşiklere
  bağlandı ve ders dili “tam hız sınırı” olarak düzeltildi. Yalnız açık
  `Bu ölçümü kaydet` commit'leri yazılır; `safety-braking-distance-v1`, aynı
  robot hızında iki farklı frenleme süresinin iki gerçek sınır ölçümünü ister.
  Bileşen+güvenlik motoru manifesti ile doğrulanan `safety-zone/v1` paylaşım
  state'i eklendi.
- Test: 12 yeni kontrol (motor eşik regresyonu, state round-trip/negatifleri,
  interaction/predicate bağlantısı, predicate golden + üç negatif ve
  paylaşım+kanıt E2E'si).

### 2026-08-12 · PixelToWorld (5 ders)

- Bulgu: kanıt/predicate/state zinciri ve ayrı bir saf dönüşüm motoru yoktu.
  Ayrıca perspektif dersi, sapmanın sol üst başlangıçtan uzaklaştıkça arttığını
  ve sol üstte görünmediğini söylüyordu; bileşenin hesabı doğru biçimde görüntü
  merkezine uzaklığı kullanıyordu, yani ders metni motorla çelişiyordu.
- Düzeltme: piksel→mm ve merkez-uzaklığı distorsiyon hesabı saf motora
  çıkarıldı; metin dört köşede artan sapmayı doğru anlatacak şekilde düzeltildi.
  `camera-distortion-comparison-v1` aynı çevresel hücrenin bozulma kapalı/açık
  iki commit'inde gerçek konum değişimi ister. Bileşen+motor manifesti ve
  seçili hücre/kalibrasyon/özellik bayraklarını doğrulayan `pixel-to-world/v1`
  paylaşım state'i eklendi.
- Test: 14 yeni kontrol (motor golden/mesafe karşılaştırmaları, state
  round-trip/negatifleri, interaction/predicate bağlantısı, predicate golden +
  üç negatif ve paylaşım+kanıt E2E'si).

### 2026-08-12 · JacobianViz (3 ders)

- Bulgu: mevcut `jacobian-singularity-observation-v1`, slider'ın her değişim
  karesinde yazılan olayı kabul ediyor; bileşen gerçek `isNearSingularity`
  sonucunu kullanmak yerine `|J2| < 8°` kestirmesini koşulsuz success olarak
  kaydediyordu. Predicate de `result` ve manipülabilite eşiğini denetlemiyordu.
- Düzeltme: olay yazımı pointer-up/blur/klavye commit'ine taşındı ve doğrudan
  kinematik motorunun tekillik sonucu + ham manipülabilite değeri kaydedildi.
  `jacobian-singularity-observation-v2` yalnız gerçek başarılı tekillik commit'i
  ile transfer değerlendirmesini birlikte ister. Bileşen+kinematik+robot spec
  manifesti ve limit doğrulamalı `jacobian-viz/v1` paylaşım state'i eklendi.
- Test: 11 yeni kontrol (state round-trip/negatifleri,
  interaction/predicate bağlantısı, predicate golden + üç negatif ve
  paylaşım+kanıt E2E'si).

### 2026-08-12 · ScanPath (3 ders)

- Bulgu: kanıt/predicate/state zinciri yoktu; animasyon zamanlayıcıları
  unmount'ta temizlenmiyor ve 12 sütunlu ızgara dar ekranda kart dışına
  taşıyordu. Boustrophedon sıra motoru bileşenin içinde doğruydu.
- Düzeltme: sıra üretimi ve yön doğrulaması saf motora çıkarıldı. Kanıt yalnız
  taramanın son zamanlayıcısı tamamlandıktan sonra bir kez yazılır; resetlenen
  veya yarım kalan tarama olay üretmez. `scan-row-density-comparison-v1`, iki
  farklı satır sayısında eksiksiz ve yönleri dönüşümlü taramayı karşılaştırır.
  `scan-path/v1` kısmi ziyaret kümesini doğrular/paylaşır; dar ekranda ızgara
  kendi yatay kaydırma alanına alındı.
- Test: 14 yeni kontrol (motor golden/negatifleri, state
  round-trip/negatifleri, interaction/predicate bağlantısı, predicate golden +
  üç negatif ve paylaşım+kanıt E2E'si).

### 2026-08-12 · BlockEditor (2 ders)

- Bulgu: görev olayları yalnız `Çalıştır` commit'inde yazılıyordu; her karede
  kayıt sorunu yoktu. Ancak iki koşul dalı aynı pozu üretse bile yalnız ziyaret
  bayraklarıyla görev geçiyor, limit dışı açı başarıyı engellemiyor ve 200 adım
  sınırı yorumlayıcı dev izi ürettikten sonra `slice` ile uygulanıyordu.
- Düzeltme: yorumlayıcı artık yürütme sırasında 200 adımda duruyor. Sıra görevi
  en az iki hareket bloğu + iki farklı limit-içi duruş; koşul görevi iki ayrı,
  limit-içi dal sonucu istiyor. Program değişince eski dal sonuçları sıfırlanır.
  İki ders için ayrı registry predicate'leri, bileşen+yorumlayıcı+robot spec
  manifesti ve derinlik/sayı/id/tür/eklem limiti doğrulamalı `block-editor/v1`
  paylaşım state'i eklendi; zamanlayıcılar unmount'ta temizleniyor.
- Test: 15 yeni kontrol (yorumlayıcı sınır/yardımcıları, state
  round-trip/negatifleri, interaction/predicate bağlantısı, iki predicate için
  golden + negatifler ve paylaşım+kanıt E2E'si).

### 2026-08-12 · ThresholdViewer (2 ders)

- Bulgu: bileşenin deterministik parlaklık hesabı dersin tarif ettiği ayırma
  aralığıyla tutarlıydı; ancak kanıt/predicate/state zinciri yoktu. Slider yalnız
  görünümü değiştiriyor, düşük eşikteki false positive ile yüksek eşikteki false
  negative sonuçları ölçülebilir bir deneye dönüşmüyordu. 12 sütunlu sabit ızgara
  da dar ekranda kart dışına taşıyabiliyordu.
- Düzeltme: parlaklık, nesne maskesi ve hata sayımları saf `threshold` motoruna
  çıkarıldı. Olay yalnız pointer-up/blur/klavye commit'inde yazılır;
  `threshold-three-regimes-v1` düşük, hatasız ayıran ve yüksek eşik rejimlerinin
  üçünü de gerçek false-positive/false-negative ölçüleriyle ister. Bileşen+motor
  manifesti, tema ve 0–255 tam sayı sınırı doğrulamalı `threshold-viewer/v1`
  paylaşım state'i ve dar ekranda yerel yatay kaydırma eklendi. Ders kabuğunun
  mobildeki örtük `auto` grid sütunu da `minmax(0,1fr)` yapılarak geniş deney
  içeriğinin tüm sayfayı taşırması engellendi.
- Test: 14 yeni kontrol (motor golden/negatifleri, state round-trip/negatifleri,
  interaction/predicate bağlantısı, predicate golden + üç negatif ve üç
  viewportta çalışan paylaşım+kanıt E2E senaryosu).

### 2026-08-12 · TransformOrderLab (1 ders)

- Bulgu: olay yalnız `Dönüşümü uygula` commit'inde yazıldığı için her karede
  kayıt yoktu; ancak `transform-order-comparison-v1` olay sonucunu ve sayısal
  çıktıyı denetlemiyordu. İki yanlış tahminin ürettiği iki `retry` olayı, yalnız
  order etiketleri farklı olduğu için CodeRunner değerlendirmesiyle birlikte
  yanlışlıkla başarı sayılabiliyordu.
- Düzeltme: `transform-order-comparison-v2` yalnız doğru tahminli iki `success`
  ölçümünü kabul eder; ölçümler aynı açıda, farklı sırada olmalı ve iki çıktıdan
  yeniden hesaplanan mesafe her iki olayın raporladığı ayrımla uyuşmalıdır.
  Bileşen+öğrenme motoru+matris motoru manifesti ile sıra/açı/tahmin/görünür
  sonuç alanlarını doğrulayan `transform-order/v1` paylaşım state'i eklendi.
  Aynı dersteki geniş matris kod bloğu mobilde sayfayı taşırıyordu; ders kod
  bloklarına sayfa yerine kendi içinde yatay kaydırma verildi.
- Test: 10 yeni kontrol (state round-trip/negatifleri, interaction/predicate
  bağlantısı ve predicate golden + üç negatif); mevcut üç-viewport E2E senaryosu
  paylaşım geri yükleme, gerçek Pyodide kod değerlendirmesi ve v2 başarı kaydıyla
  genişletildi.

### 2026-08-12 · DlsTraceLab (1 ders)

- Bulgu: bileşen yalnız `80 adıma kadar çöz` commit'inde olay yazıyordu; her
  karede kayıt yoktu ve motor yakınsama sonucunu doğru üretiyordu. Ancak
  `dls-damping-comparison-v1` yalnız iki serbest metin bant etiketini sayıyor;
  farklı hedefler, λ ile çelişen etiketler, eksik iz ve `converged/result`
  çelişkisi de transfer yanıtıyla birlikte yanlışlıkla başarı olabiliyordu.
- Düzeltme: `dls-damping-comparison-v2`, aynı hedefte düşük ve sönümlü iki
  tamamlanmış koşu ister; λ-bandı, iterasyon/iz uzunluğu ve yakınsama-sonuç
  ilişkisini doğrular. Dersin açık talebine uygun olarak, 80 adımlık tam izi
  `retry` olarak dürüstçe kaydedilen yakınsamama da karşılaştırma gözlemidir.
  Bileşen+sayısal IK+`generic-2dof` spec manifesti ile hedef/λ/çözüm/iz adımını
  doğrulayıp deterministik olarak yeniden kuran `dls-trace/v1` state'i eklendi.
- Test: 11 yeni kontrol (state round-trip/negatifleri, interaction/predicate
  bağlantısı, iki golden + üç negatif predicate testi); mevcut üç-viewport E2E
  aynı hedefte iki bandı, transfer başarısını ve iz paylaşımını kapsayacak şekilde
  genişletildi.

### 2026-08-12 · CspaceLab (1 ders)

- Bulgu: fiziksel temas `configurationCollides` ile doğru hesaplanıyor ve olay
  yalnız açık `Bu konfigürasyonu kaydet` commit'inde yazılıyordu. Buna karşılık
  `configuration-space-boundary-v1` yalnız `safe/collision` etiketlerini sayıyor;
  olay sonucu, motorun `collides` sınıfı, açı ızgarası, robot ve engel imzası
  doğrulanmıyordu.
- Düzeltme: `configuration-space-boundary-v2` yalnız success olaylarını kabul
  eder; sınıf etiketi fiziksel `collides` sonucuyla, açılar UI sınırı/5° adımıyla,
  deney ise `generic-2dof` ve sabit dairesel engel imzasıyla uyuşmalıdır. Serbest
  ve çarpışan kayıtlar farklı açılarda olmalı ve transfer de geçmelidir.
  Bileşen+çarpışma/kinematik+robot spec manifesti ile açıları ve iki gözlem
  bayrağını doğrulayan `cspace/v1` paylaşım state'i eklendi.
- Test: 10 yeni kontrol (state round-trip/negatifleri, interaction/predicate
  bağlantısı, predicate golden + üç negatif); mevcut üç-viewport E2E fiziksel
  sınıf çifti, transfer, v2 başarı ve paylaşım geri yüklemeyle genişletildi.

### 2026-08-12 · RobotSelectionTable (1 ders)

- Bulgu: karar motoru hard constraint, en az dört kriter ve 40 karakter notu UI
  tarafında doğru denetliyordu; olaylar yalnız aday seçimi/karar submit'inde
  yazılıyordu. Ancak `robot-selection-four-criteria-v1`, aynı görev/aday için
  geçmiş bir `retry` gözlemini de eşleştirebiliyor; dört kriterin ayrı ve seçilen
  adayın uygun sayısal havuzu içinde olduğunu doğrulamıyordu.
- Düzeltme: `robot-selection-four-criteria-v2`, nötr ve sıfır hard-fail aday
  gözlemini aynı görev/aday/status'taki başarılı kararla eşleştirir. Assessment
  ayrıca ayrı kriter bayrağı, uygun kriter kapasitesi, sıfır fail ve gerekçe
  sınırlarını taşır. Bileşen+aday/kısıt motoru manifesti ile görev, yerleşim
  varyantı, aday, uygun kriterler, not ve deneme sayısını motor kataloğuna karşı
  doğrulayan `robot-selection/v1` paylaşım state'i eklendi.
- Test: 10 yeni kontrol (state round-trip/negatifleri, interaction/predicate
  bağlantısı, predicate golden + üç negatif); mevcut üç-viewport E2E kararın
  v2 kanıtını ve tüm form state'inin paylaşım geri yüklemesini kapsıyor.

### 2026-08-12 · FourLensTraceLab (1 ders)

- Bulgu: olaylar yalnız `Programı çalıştır` ve örnek değiştirme commit'lerinde
  yazılıyor; her-kare yazma yok. Ancak `four-lens-fk-trace-v1`, örnek 0'dan
  doğrudan 3'e atlanınca geçebiliyor; ara örnekleri, kod/eklem eşleşmesini,
  sahne-matris senkronunu ve ölçülen son yönü doğrulamıyordu.
- Düzeltme: `four-lens-fk-trace-v2`, dört örneğin tamamında satır, eklem,
  motor uç konumu ve matris son sütununu birlikte doğrular; başarılı son olayda
  tahmin/gerçek yön eşleşmesini ve x'in gerçekten azaldığını zorunlu kılar.
  Bileşen+ileri kinematik iz motoru manifesti ile lens, tahmin, çalışma, örnek
  ve assessment alanlarını tutarlı doğrulayan `four-lens-trace/v1` paylaşım
  state'i eklendi.
- Test: 9 yeni birim kontrolü (state round-trip/negatifleri,
  interaction/predicate bağlantısı, predicate golden + üç negatif); mevcut
  üç-viewport E2E v2 başarı ve son örnek paylaşım geri yüklemeyle genişletildi.

### 2026-08-12 · Değerlendirme bileşenleri ve yarım kalan kanıt sürüm kökü

- Kalıcı kapsam düzeltmesi: `Quiz`, `PredictionPrompt` ve
  `TransferChallenge` motorlu/paylaşılabilir laboratuvar state'i değildir;
  ancak Evidence mekanizmasının dışında da değildir. Üçü de aynı
  `LessonEvidenceProvider -> appendEvidence` yolunu kullanır. `QuizSorusu`
  `observed/success|retry`, `PredictionPrompt` `predicted/neutral`,
  `TransferChallenge` ise `assessed/success|retry` olayı yazar.
- Predicate etkisi: genel quiz olaylarının kayıtlı bir başarı predicate'i yoktur;
  doğru quiz yanıtı tek başına `passed` üretemez. Mevcut predicate'ler tahmin
  olaylarını okumaz. Buna karşılık `TransferChallenge`, aynı `skillId` için
  başarılı assessment arayan sekiz laboratuvar predicate'inin kavram kontrolü
  ayağıdır; bu nedenle kanıt zincirinin aktif ve güvenlik açısından anlamlı bir
  parçasıdır.
- Sertleştirme açığı: `TransferChallenge` olayı yalnız görüntülenen `selected`
  indexini taşır; predicate bileşenin yazdığı `result: success` değerine güvenir.
  Karıştırma/cevap semantiğini belirleyen bileşenler ve `lib/quiz.ts` bugün
  `LAB_DEPENDENCY_REGISTRY` içinde değildir. Paylaşım state'i bu kişisel ve
  geçici cevaplar için zorunlu değildir; fakat Evidence üreticisi oldukları için
  interaction sürüm kapsamı dışında kalmaları doğru değildir.
- **Yanlış tamamlanmışlık izlenimi:** `interactionHash`, `predicateHash` ve
  bunları `teachingHash` ile birleştiren `computeEvidenceVersionRoot` altyapısı
  vardır; fakat canlı ders sayfası `contentVersion` olarak hâlâ yalnız
  `computeTeachingHash(lesson)` kullanır. Bu nedenle motor, worker, robot spec,
  değerlendirme bileşeni veya predicate kodu değiştiğinde mevcut öğrenci kanıtı
  otomatik olarak eskimez. Hash katmanı hazırlanmıştır ama kanıt koruması
  **tamamlanmış değildir; entegrasyon yarımdır.** Sonraki iş
  `docs/03-yol-haritasi.md` içindeki “contentVersion entegrasyonu +
  TransferChallenge predicate sertleştirmesi” maddesidir.

### 2026-08-18 · Kod Akademisi — mimari teklif (uygulama değil, plan)

Kaynak: `docs/15-kod-akademisi.md` (vizyon/kapsam, aynı gün eklendi).
Bu bölüm o vizyonun üstüne kurulan mimari teklif — kod yazılmadı,
mevcut kod tabanı (`lib/evidence.ts`, `CodeRunner.tsx`,
`lib/interactionManifest.ts`, `app/ders/[slug]/page.tsx`,
`app/oyun-alani/page.tsx`) okunup gerçek sözleşmelere bağlandı.

#### 1. Sayfa/route yapısı

Mevcut iki desenin (`/seviye/[seviye]/hat/[hat]` liste + `/ders/[slug]`
içerik) aynısı, üç kademeye ayrılmış:

- `app/kod-akademisi/page.tsx` — statik giriş: 4 aşama kartı
  (Temel/Orta/İleri/Usta), her kartta localStorage'dan hesaplanan
  ilerleme özeti. `/oyun-alani/page.tsx` ile aynı üslupta sabit sayfa.
- `app/kod-akademisi/[asama]/page.tsx` — bir aşamanın modül listesi,
  `generateStaticParams` ile içerikten üretilir (asama =
  `temel|orta|ileri|usta`).
- `app/kod-akademisi/[asama]/[modul]/page.tsx` — asıl alıştırma sayfası:
  kod editörü + sahne + ipucu paneli + tamamlama durumu.

İçerik: `content/kod-akademisi/<asama>/<modul-id>.mdx` —
`content/<hat>/<seviye>/<id>.mdx` ile birebir aynı fikir (içerik
koddan ayrı kalır). Frontmatter, ders şemasını AYNEN kopyalamaz:
`hat`/`seviye`/`onkosul` üçlüsü yok çünkü Kod Akademisi'nin ilerlemesi
bir graph değil, aşama-içi DOĞRUSAL bir sıra (modül N, N-1'i gerektirir).
Bunun yerine: `asama`, `sira` (aşama içi sıra), `kazanimlar`, `kaynaklar`
(gizlilik kuralı burada da geçerli — Python/robotik referansı varsa
gösterilir), `ipuclari` (3 elemanlı dize dizisi), `cozum`, `durum`.
`scripts/validate-content-graph.ts`'in tam graph doğrulayıcısı yerine
çok daha basit bir doğrusal-sıra kontrolü yeterli — yeni script değil,
mevcut script'e küçük bir mod eklenir.

Gövdede aynı `<CodeRunner ... />` çağrısı kalır (Hat D derslerinde
zaten kullanılan bileşen, `mdxComponents` listesine yeni bir bileşen
eklenmez — docs/08'in "MDX kendi bileşenini icat edemez" kuralı).

#### 2. İlerleme + ipucu veri modeli — `lib/evidence.ts` ile entegrasyon

Öneri: **yeni bir depolama/şema icat etme, mevcut `EvidenceEvent`
akışını aynen kullan.**

- `lessonId` = modül id'si (`koda-temel-degisken-degistir` gibi).
- `skillId` = modül içindeki tekil alıştırma/beceri id'si — bugün Hat D
  derslerinde zaten aynı desen var (`d-lise-degiskenlerle-hareket` dersi
  → `movej-degiskenlerle-hareket` skillId'si).
- Başarı: `EVIDENCE_PREDICATES` dizisine modül başına yeni kayıtlar
  eklenir — somut örnek madde 3'te. Yeni bir doğrulama sistemi
  icatı yok, mevcut predicate mimarisi genişler (docs/15'in kendi
  sözü zaten buydu).
- **İpucu açma da bir Evidence olayıdır, ayrı bir depolama anahtarı
  DEĞİL.** Kullanıcı bir ipucu açtığında `appendEvidence({ stage:
  "observed", skillId, result: "neutral", metrics: { hintLevel: 1|2|3
  } })` yazılır (`kind: "observation"`, `verification:
  "component-observed"` zaten otomatik). Gerekçe: `evidence.ts`'in
  saklama/retention/migration/export makinesini (bkz. `applyRetentionPolicy`,
  `serializeEvidence`, iki-adımlı silme) ikinci kez yazmamak. Yan
  faydası: "kaç ipucu açıldı" ölçülebilir bir sinyal olarak zaten
  kayıtlı duruyor — bir predicate isterse ileride "ipucu almadan
  çözdü" gibi bir metrik bile türetebilir (v1'de ZORUNLU değil, sadece
  altyapı bunu bedavaya veriyor).
- Aşama/modül ilerleme özeti (`Temel · 2/3 tamamlandı` gibi) yeni bir
  saf fonksiyon: `lib/kodAkademisiProgress.ts` içinde
  `summarizeStage(events, asama, moduleIds)` — mevcut
  `summarizeEvidence`'ı modül başına çağırıp toplar, evidence.ts'e
  dokunmaz.

**Karar (2026-08-18, onaylandı):** `lib/kodAkademisiArtifact.ts` — ayrı,
TEK hash'li modül. Üç köklü source/teaching/presentation ayrımı
KOPYALANMADI; o ayrım Review Receipt kapsam sorununu çözüyor (bir
kaynağın erişim tarihini tazelemenin pedagojik incelemeyi eskitmemesi),
Kod Akademisi'nin `kaynaklar` alanı yok ve Review Receipt sistemine hiç
girmiyor — o problem burada yok. Modül içeriği (frontmatter'ın öğretim
alanları: `baslik`/`asama`/`sira`/`kazanimlar`/`ipuclari`/`cozum` + gövde)
+ başlangıç kodu + bağlı `EVIDENCE_PREDICATES` id kümesinden TEK bir
`computeModuleHash` üretiliyor; bu `lib/evidence.ts`'e verilen
`contentVersion` olacak. `lib/lessonArtifact.ts`'teki `canonicalize`/
`digest` yardımcıları export edilip PAYLAŞILDI, yeniden yazılmadı — hash
biçimi ve anahtar sıralama iki sistemde de aynı. Uygulandı ve test edildi:
`lib/kodAkademisiArtifact.ts` + `lib/kodAkademisiArtifact.test.ts` (7
test: satır sonu kanonikleştirme, gövde/başlangıç kodu/ipucu/çözüm/sıra/
aşama değişince hash değişir, predicate kümesi değişince hash değişir ama
sırası önemsiz, deterministik).

#### 3. "Yaz" tipi alıştırma — somut davranışsal değerlendirme örneği

Modül: `koda-usta-uc-nokta-rotasi` (Usta aşaması).
skillId: `usta-uc-nokta-rotasi`.

Görev metni: "Robotun TCP'si sırasıyla üç noktayı ziyaret etsin:
(0.3, 0.1), (0.3, -0.1), (0.1, 0.0). Editör boş — nasıl yazacağın sana
kalmış (döngüyle veya üç ayrı çağrıyla)."

Değerlendirme **kod metnine hiç bakmaz** — proje genelinde zaten
kurulu ilke ("kod tam olarak şöyle mi yazıldı değil, robot doğru yere
gitti mi"). Mevcut `d-lise-donguyle-cok-nokta` dersinin
`movel-donguyle-rota-v1` predicate'i neredeyse aynı deseni zaten
kullanıyor (traceSteps + poseMatches) — bu, tekerleği yeniden icat
etmiyor, onu genelliyor:

1. `CodeRunner`'a yeni bir prop: `expectedWaypoints?: {x:number;
   y:number; z:number}[]` (bugünkü `expectedFinalDegrees` tek hedef
   için var, bu çoklu hedef için doğal genişlemesi).
2. Worker zaten her çalıştırmada TCP/eklem izini (trace) topluyor
   (mimari dokümanındaki 500 örnek sınırıyla). Çalıştırma bitince
   component, iz üzerindeki noktalardan her `expectedWaypoints`
   öğesine (sırayla, tolerans içinde) en az bir kez yaklaşılıp
   yaklaşılmadığını kontrol eder.
3. Sonuç `assessed` olayı olarak yazılır: `metrics: { waypointsVisited:
   3, waypointsRequired: 3, orderCorrect: true }`.
4. Predicate:

```ts
{
  id: "usta-uc-nokta-rotasi-v1",
  lessonId: "koda-usta-uc-nokta-rotasi",
  skillId: "usta-uc-nokta-rotasi",
  evaluate: (events) => ({
    passed: events.some((event) =>
      event.skillId === "usta-uc-nokta-rotasi" &&
      event.stage === "assessed" &&
      event.result === "success" &&
      event.metrics?.waypointsVisited === 3 &&
      event.metrics?.orderCorrect === true,
    ),
    metrics: { requiredWaypoints: 3 },
  }),
}
```

Kod nasıl yazıldığına (for döngüsü mü, üç `movel()` mi, değişken adı
ne) hiç bakılmıyor — bilinçli olarak. Statik AST kontrolü (döngü
kullanıldı mı gibi) ÖNERMİYORUM; davranış zaten doğru sırayla doğru
yere gitmeyi kanıtlıyorsa yazım şekli önemsiz, ekstra kontrol
karmaşıklık katar, değer katmaz.

#### 4. Dikey dilim önerisi — Temel aşamasının ilk 2-3 modülü

1. **`koda-temel-ilk-calistirma`** (Gözlem). Hazır kod, hiç değişiklik
   yok, sadece Çalıştır'a bas, TCP'nin hareket ettiğini gör. Yazım
   gerektirmez — amaç yazım değil, tüm boru hattını (route → içerik →
   CodeRunner → Evidence "tried/observed" → tamamlama) uçtan uca
   kanıtlamak, en düşük içerik yazım maliyetiyle.
2. **`koda-temel-degisken-degistir`** (Değiştir). Tek bir sayısal
   değeri (bir açı veya hedef koordinat) değiştir, çalıştır, farkı gör.
   İlk kez gerçek bir `assessed` yazımı + predicate + İpucu 1
   (yönlendirici soru) devreye girer.
3. **`koda-temel-parametre-gonder`** (Değiştir→Tamamla sınırı).
   `robot.movej([...])` çağrısına kendi açılarını gir (tek hedef,
   `expectedFinalDegrees` — çoklu waypoint değil, dilimi minimal tutmak
   için Usta'daki örnek 4. maddeye saklandı). İlk kez ipucu sisteminin
   ÜÇ kademesinin de anlamlı olduğu modül (kullanıcı gerçekten
   takılabilir).

Neden bu üçü ve bu sıra: hiçbiri yeni motor kodu gerektirmiyor —
üçü de bugünkü `CodeRunner` + `pythonBridge.ts` + `evidence.ts`
yüzeyiyle karşılanıyor (madde 3'teki `expectedWaypoints` genişlemesi
dilimde YOK, sonraki içerik genişlemesine bırakıldı). Dikey dilim
"sistem gerçekten uçtan uca çalışıyor mu" sorusunu üç küçük, ucuz
modülle kanıtlıyor; büyük patlama yok (docs/15'in kendi kapanış
ilkesi).

#### 5. Görünürlük ve yönelim ilkesi'nin somut uygulaması

**Masaüstü** — `app/kod-akademisi/[asama]/[modul]/page.tsx`:
`lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`. Sol sütun normal akışta
kaydırılır (kod editörü + Çalıştır/Sıfırla + ipucu accordion'u — kod
uzun olabilir). Sağ sütun `lg:sticky lg:top-20` (navbar yüksekliği +
boşluk) ile SABİTLENİR: 3D sahne + çalışma izi (trace scrubber) +
çıktı konsolu + değerlendirme durumu. Kod ne kadar uzasa da sağ panel
ekranda kalır — bugünkü `CodeRunner`'ın dikey istiflemesinden (docs/15'in
kaynak sorunu) TEK fark bu.

**Mobil** — `lg:` eşiğinin altında (768 değil 1024 — bir Python
editörü + 3D sahne yan yana 768px'de bile sığmaz) iki sekmeli yapı:
"Kod" / "Sonuç", `role="tablist"`/`"tab"`/`"tabpanel"`, ok tuşu
gezintili. Bu deseni sıfırdan yazmıyoruz —
`components/playground/CustomRobotPlayground.tsx`'teki (ve
`RobotCellStudio.tsx`'teki) "üç sekmeli konsol" ile AYNI erişilebilir
model. **Yapıldı (2026-08-18):** `components/ui/Tabs.tsx` ortak bileşen
olarak çıkarıldı, her iki mevcut çağrı yeri (`CustomRobotPlayground`,
`RobotCellStudio`) buna geçirildi — üçüncü bağımsız kopya açılmadı. Yan
bulgu: orijinal deferred-focus deseni (`requestAnimationFrame` içinde
`.focus()`) bu ortam gibi arka planda/gizli bir sekmede rAF hiç
ateşlenmezse çalışmıyor; tüm sekme düğmeleri her zaman DOM'da olduğu için
(aktif panel koşuluna bağlı değil) buna gerek yoktu — SENKRON `.focus()`'a
geçirildi, hem daha sağlam hem daha basit. `RobotCellStudio`'nun sekmeleri
bu geçişle ayrıca ok tuşu gezintisi KAZANDI (öncesinde yalnız tıklama
vardı). Çalıştır'a
basınca sonuç geldiğinde mobilde OTOMATİK "Sonuç" sekmesine geçilir —
kullanıcı sonucu görmek için sekmeyi elle aramaz (docs/05'in "neden ve
sonuç aynı anda görünür" gereksinimi, mobildeki somut karşılığı).

**Yönelim (neredeyim/sırada ne var):**
- Sabit kırıntı + ilerleme: "Temel · Modül 2/3", tıklanabilir aşama/modül
  seçici.
- Sabit yükseklikli durum şeridi (Oyun alanı'ndaki "Durum şeritleri
  sabit yükseklikte kaldığı için yeni metin sahneyi itmez" deseninin
  aynısı): Hazır → Çalışıyor → Değerlendiriliyor → Tamamlandı/Tekrar
  dene, sessiz başarısızlık yok.
- Sayfa altında her zaman "Sonraki modül" bağlantısı — `LessonNav`
  bileşeninin ders sayfalarında zaten yaptığı previous/next deseni
  aynen tekrar kullanılır, yeni bileşen yazılmaz.

**Karar (2026-08-18, ölçülerek doğrulandı):** mobil eşik `lg:` (1024px).
Varsayımla değil, gerçek `CodeRunner` içeriğiyle (JetBrains Mono 14px kod
editörü + `aspect-video` 3D sahne) mobil navbar düzeltmesindeki iframe
genişlik tekniğiyle ölçüldü — d-universite-python-fk-ik dersindeki gerçek
DOM düğümleri, önerilen `1fr 1fr` masaüstü ızgarasına canlı olarak
yeniden dizilip `max-w-7xl` bir kapta (Kod Akademisi sayfasının kendi
kapsayıcısı, ders sayfasının `lg:` kenar panelinden bağımsız) çeşitli
genişliklerde ölçüldü:

| Kap genişliği | Kod editörü (karakter/satır) | 3D sahne yüksekliği |
|---|---|---|
| 640px | 28 | 148px |
| 768px | 36 | 184px |
| 850px | 41 | 207px |
| 900px | 44 | 221px |
| 950px | 47 | 236px |
| **1024px** | **51** | **256px** |
| 1100px | 55 | 278px |

768px'de (`md:`) kod editörü yalnız 36 karakter/satıra düşüyor — bu
depodaki gerçek Python satırları için (ör. `hesaplanan_acilar =
robot.inverse_kinematics(x=poz.x, y=poz.y, z=poz.z)`, 73 karakter) sürekli
sarma demek, ve 184px'lik sahne küçük/güç okunur kalıyor. 1024px'de
(`lg:`) her iki taraf da kullanılabilir eşiği aşıyor (51 karakter, 256px).
Ölçüm sırasında bir yan bulgu da düzeltildi: ilk ölçüm turu 1024px'de
düşüşe düşüyordu (456→276px) çünkü ders sayfasının KENDİ `lg:grid-cols-
[minmax(0,1fr)_320px]` yan paneli araya giriyordu — Kod Akademisi
sayfasının böyle bir yan paneli olmayacağı için ölçüm CodeRunner kökünü
bağımsız bir `max-w-7xl` kaba taşıyarak tekrarlandı (tablodaki sayılar bu
düzeltilmiş turdan).

#### Onay bekleyen adım

Bu plan onaylanırsa sıradaki iş: madde 4'teki 3 modülle dikey dilim —
route iskeleti, `content/kod-akademisi/temel/` altında 3 MDX, 2 yeni
predicate (`koda-temel-degisken-degistir-v1`,
`koda-temel-parametre-gonder-v1`), ipucu UI bileşeni, masaüstü
sticky-panel + mobil sekme yerleşimi. `koda-temel-ilk-calistirma`
predicate gerektirmez (yalnız "tried" kanıtı yeterli, docs/15'in
Gözlem tanımıyla tutarlı).

### 2026-08-19 · Kod Akademisi — dikey dilim uygulandı (`feat/kod-akademisi-vertical-slice`)

Yukarıdaki plan onaylandıktan sonra uygulandı. `main`'e merge EDİLMEDİ —
kullanıcının açık isteğiyle dal olarak kalıyor, inceleme bekliyor.

**Kurulan altyapı:**
- `lib/kodAkademisiArtifact.ts` — tek hash'li modül sürüm kökü (`computeModuleHash`),
  `lib/lessonArtifact.ts`'ten paylaşılan `canonicalize`/`digest` üzerine. 7 birim testi.
- `lib/kodAkademisi.ts` — içerik yükleyici. `content-kod-akademisi/` bilinçli
  olarak `content/` DIŞINDA (gerekçe dosyanın kendi başlığında): `lib/content.ts`
  `content/` altındaki her `.mdx`'i `DersFrontmatter` sayıp `hat`/`seviye`'ye göre
  indeksliyor, ayrı şema oraya karışırsa katalog `undefined` anahtarlı hayalet
  kayıtla kirlenir. `scripts/check-sensitive-terms.ts` yine de yeni dizini tarar
  (`ICERIK_KOKLERI` genişletildi) — gizlilik/ton taraması dışarıda kalmasın diye.
- `components/ui/Tabs.tsx` — ayrı commit'te çıkarıldı, iki mevcut çağrı yeri
  (`CustomRobotPlayground`, `RobotCellStudio`) buna geçirildi.
- `components/interactive/useCodeRunnerEngine.ts` — CodeRunner'ın worker/durum
  mantığı saf "extract hook" ile ayrıldı; `CodeRunner.tsx`'in çıktısı öncesi/
  sonrası birebir aynı. Kod Akademisi'nin yan yana/sekmeli yerleşimi
  (`components/kod-akademisi/KodAkademisiCodeLab.tsx`) aynı hook'u kullanıyor —
  worker/pythonBridge/evidence mantığı hiç tekrar yazılmadı.
- `lib/evidence.ts`'e 2 yeni predicate (`koda-temel-degisken-degistir-v1`,
  `koda-temel-parametre-gonder-v1`) — mevcut `movej-degiskenlerle-hareket-v1`
  ile AYNI desen (poseMatches), yeni motor kodu yok.
- `app/kod-akademisi/`, `app/kod-akademisi/[asama]/`, `app/kod-akademisi/[asama]/[modul]/`
  — üç route, `content-kod-akademisi/temel/` altında 3 modül
  (`koda-temel-ilk-calistirma` Gözlem/predicate'siz,
  `koda-temel-degisken-degistir` ve `koda-temel-parametre-gonder`
  Değiştir/Tamamla tipi, predicate'li). Navbar'a "Kod Akademisi" eklendi.

**Gerçek regresyon bulundu ve düzeltildi (`Tabs.tsx` çıkarımı sırasında):**
Tam e2e paketi ilk çalıştırmada `[mobile-390]` projesinde 7 test
(`e2e/oyun-alani.spec.ts`, hepsi `CustomRobotPlayground`'ın "Deney
kumandaları" sekmelerine dokunuyor) `getByRole("tab", { name: "Eklemleri
sür" })` bulamayıp 30s zaman aşımına uğradı. Kök neden: orijinal
`CustomRobotPlayground` her sekme düğmesinde açık `aria-label={panel.label}`
taşıyordu; bu, `hidden sm:inline` / `sm:hidden` ile viewport'a göre değişen
GÖRÜNEN metinden BAĞIMSIZ, erişilebilir adı sabitliyordu. `Tabs.tsx`'e
çıkarırken bu `aria-label` unutuldu — sonuç: dar viewport'ta (`sm:` altı)
erişilebilir ad sessizce yalnız `shortLabel`'e ("Eklemler") düştü, testler
tam etiketi ("Eklemleri sür") arıyordu. Düzeltme: `Tabs.tsx`'teki her tab
düğmesine `aria-label={item.label}` eklendi (davranış CustomRobotPlayground'ın
orijinaliyle birebir eşleşiyor). Bu, otomatik testin yakaladığı gerçek bir
erişilebilirlik regresyonuydu — ekran okuyucu kullanıcıları da dar ekranda
sekmeleri yalnız kısaltılmış adla duyacaktı, sadece Playwright'ın değil,
gerçek kullanıcıların da etkileneceği bir hataydı.

**Doğrulama (hepsi bu dalda, main'e dokunmadan):**
- `npx tsc`, `npm run lint`, `npx vitest run` (643/643) — temiz.
- `npm run build` (308 sayfa, 8 yeni Kod Akademisi rotası dahil),
  `check-content`/`validate-content-graph`/`check-quiz-dagilimi`/
  `check-mdx-guvenlik` hâlâ 94 ders görüyor (yeni dizin kataloğu
  kirletmedi), `check-sensitive-terms` 97 ders/modül (94+3) görüyor,
  `check-performance-budget` bütçede, `npm audit` 0 açık.
- `npm run test:e2e` (regresyon düzeltmesinden SONRA, rakip `next dev`
  süreci kapatılmış temiz ortamda): **156 geçti, 0 başarısız, 12
  atlandı** (viewport-özel testler). Yeni eklenen 6 Kod Akademisi testi:
  predicate geç/kal (düzeltmeden geçmez, düzeltmeyle geçer), ipucu →
  Evidence `hintLevel` kaydı, mobilde çalıştırma sonrası "Sonuç"
  sekmesine otomatik geçiş, 768px'de hâlâ sekmeli (1024 eşiğinin ALTINDA
  olduğunun kanıtı), 1440px'de sekme yok/ikisi de görünür. WCAG axe
  taraması `/kod-akademisi` ve ilk modüle genişletildi, kritik/ciddi
  ihlal yok.
- Canlı tarayıcıda manuel doğrulama (ekran görüntüleriyle): masaüstü
  yan yana bölünmüş görünüm + 3D sahne gerçekten render oluyor, kod
  çalıştırma gerçekten robotu hareket ettiriyor, predicate gerçekten
  pass/fail ayrımı yapıyor, ipucu sistemi gerçekten kademeli açılıyor.
