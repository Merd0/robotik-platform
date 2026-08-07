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
Başlangıç commit'i: `c13ee16` (`main`)

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
| B — Kinematik | `b-ortaokul-eklemleri-oynat`, `b-universite-jacobian` | “Fabrikalardaki robot kolları (ABB, KUKA, Mecademic)” gibi geniş bir liste ve yine iki eklemli soyut kol vardı. | Sera hasadı, elektronik montaj ve laboratuvar numunesi ayrıştırıldı; ABB GoFa/ASELSAN MEOS bağlamı ürün özelliği uydurmadan kullanıldı. Jacobian tekilliği **Kır** görevi oldu. |
| C — Planlama | `c-ortaokul-labirentte-yol-bulma`, `c-universite-algoritma-karsilastirma-deneyi` | Gözü kapalı arkadaş ve jenerik mobil robot hücresi anlatılıyordu. | Kütüphane teslim aracı ile havalimanı bagaj aracı iki ayrı senaryoya dönüştü. Engel düzeni **Kır**, çoklu planlayıcı deneyi **Optimize et** çerçevesi kazandı. |
| D — Programlama | `d-lise-hareket-komutlari`, `d-universite-offline-programlama` | Arkadaşa “omzunu/dirseğini döndür” benzetmesi ve genel üretim hattı kullanılıyordu. | Elektronik montaj, batarya kapağı sızdırmazlık hattı ve gıda paketleme OLP bağlamları ayrıldı. CodeRunner değişikliği açık bir **Yaz** görevine çevrildi. |
| E — Haberleşme | `e-ortaokul-makineler-nasil-konusur`, `e-lise-el-sikisma` | “Sinyal” ile “Robot: Hazırım / PLC: Aldım” etiketleri bağlamsızdı. | Fırın çıkışı tepsi sensörü ile ilaç dolum/kapaklama el sıkışması kullanıldı. `SignalTimeline` 10 adıma çıkarıldı; yanlış sırayı kurup düzeltme **Kır** görevi olarak netleştirildi. |
| F — Algılama | `f-ortaokul-robot-nasil-gorur`, `f-universite-lazer-profil-sensoru` | Kamera, mobil robot ve paketleme örnekleri tek paragrafta genel geçiyordu; tarama satırı sabitti. | Elektronik soket, sera arabası ve ekmek tepsisi sensör görevlerine ayrıldı. Keyence LJ-X8080, ASELSAN MEOS saha bağlamı olarak ve teknik özellik eklenmeden anıldı. `ScanPath adjustableRows` ile **Optimize et** deneyi eklendi. |
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

### Kapsam dışı tedarik zinciri bulgusu

`npm audit --audit-level=high`, mevcut `postcss@8.5.25` geçişli bağımlılığı
`nanoid@3.3.16` için `GHSA-2v37-7h3g-55p8` yüksek önem dereceli bulgusuyla
başarısız oldu. Bu dal paket/lockfile güncellemesi yapmıyor; bulgu
genişletilmeden kayda geçirildi.
