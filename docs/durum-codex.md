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
