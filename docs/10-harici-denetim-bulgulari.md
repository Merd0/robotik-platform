# Harici denetim bulguları (bağımsız oturum, salt-okunur)

Bu dosya, aynı repoda çalışan **ayrı, bağımsız bir Claude Code oturumunun**
(değişiklik yapmadan, sadece okuyarak) yaptığı derinlemesine denetimin
özeti. Mert'in kendi değerlendirmesi ve önceliklendirmesiyle birlikte.

**Genel teşhis:** Proje teknik olarak sağlam bir içerik/deney kütüphanesi
ama henüz güvenilir ölçme + görev kanıtı + öğrenme yolu olan tam bir
"öğrenme sistemi" değil. En büyük sıçrama daha fazla ders değil, mevcut
89 dersin gözlenebilir görev+kanıt modeline geçmesinden gelecek.

---

## P0 — ACİL, yeni işten önce (özellikle #1)

### 1. Taslak dersler production'da fiilen yayında — EN KRİTİK

`app/ders/[slug]/page.tsx` 89 dersin tamamını statik üretiyor, sadece
"ders bulunamadı" kontrolü yapıyor. Sonuç: 50 taslak ders (Hat H güvenlik
dersleri dahil) doğrudan URL'den açılıyor, `noindex` yok — arama motorları
indeksleyebilir. `durum: taslak` kuralı sadece LİSTELEME sayfasını
filtreliyor, sayfanın kendisini değil.

**Bunu hemen ve ayrı olarak düzelt, başka hiçbir işe başlamadan:**
- Production `generateStaticParams` sadece `yayinda` dönsün.
- Sayfa içinde ikinci bir durum kontrolü olsun (route seviyesinde
  filtrelense bile).
- Preview/staging ayrı build olsun, orada filigran + `noindex,nofollow`.
- Hat H, SME/insan incelemesi bitene kadar production'da 404 versin.
- Test: production `out/ders/` altında tek bir taslak slug bulunmamalı
  (CI'a otomatik kontrol ekle).

### 2. Planlayıcılarda gerçek algoritmik hatalar (karşı-örneklerle doğrulanmış)

- `lib/robotics/rrt.ts:138` — RRT/RRT*, hedefe ulaşınca son segmenti
  çarpışma kontrolü YAPMADAN ekliyor. "Başarılı" yol engelin içinden geçebilir.
- `lib/robotics/astar.ts:184` — sadece düğüm noktaları kontrol ediliyor,
  köşe kesme / diagonal edge kontrol edilmiyor.
- PlannerRace (2B olarak sunulan), planlayıcılara Z ekseni örnekletiyor —
  doğrulanan örnekte yol z=-0.4'te, yani "2B" iddiası yanlış.
- Segment örneklemede `round` kullanımı küçük engelleri kaçırabilir,
  `ceil` olmalı.
- `SafetyZone.tsx` — "robot yavaşladı" diyor ama formül hızı fiilen
  düşürmüyor.

**Düzeltme:** RRT/RRT* final segment de collision-free olmalı. A* her
komşu kenarı + iki köşe bağlantısını segment bazlı doğrulamalı. 2B
planlayıcılarda z=0 invariant olmalı (gerçek 3B ayrı mod). SafetyZone hızı
monoton azaltmalı. **Property/invariant testleri ekle:** yolun her
segmenti çarpışmasız, 2B modda tüm Z=0, güvenlik hızı monoton.
Yayındaki "A*'ta bu risk yok" iddiası motor düzelene kadar yanlış.

### 3. Quiz sistemi tahmin edilerek çözülebiliyor

139 sorunun 124'ünde doğru cevap 2. şık (%89,2); 121 soruda doğru cevap
benzersiz biçimde en uzun (%87,1). Klasik LLM-üretimi MCQ tuzağı.
45 ders tek soruyla ölçülüyor. İlk yanlışta çoğu zaman cevap açıklamada
doğrudan görünüyor.

**Düzeltme:** Soru-ID tabanlı kararlı şık karıştırma. CI linter (doğru
konum dağılımı, uzunluk farkı kontrolü). İlk yanlışta sadece ipucu, tam
açıklama 2. deneme/doğru cevap sonrası.

### 4. Ders ile sahne arasında uyumsuzluklar + "hayal et" anti-pattern'i

Örnekler: ölçüm belirsizliği dersi rastgele tekrar anlatıyor ama
ThresholdViewer deterministik; "PyBullet fizik" dersi aslında A*
PlannerRace çalıştırıyor; "ekranda göremesen de düşün" gibi ifadeler
docs/05'in "önce oyna sonra oku" ilkesiyle doğrudan çelişiyor.

**Düzeltme:** Kalite kontrolüne "öğrenci kazanımı sahnede gerçekten
gözlenebiliyor mu?" sorusu eklensin. "Hayal et/zihninde düşün" ifadeleri
anti-pattern olarak işaretlensin, docs/04'e kural olarak eklensin.

### 5. İnceleme kaynağı yeterince granüler değil

docs/durum-denetim.md 9 dersin bizzat, 30'unun toplu onaylandığını
söylüyor (bu doğru ve şeffaf) — ama tüm 39 dersin frontmatter'ında aynı
incelendi_tarafindan görünüyor, bu ayrım metadata'ya yansımıyor.

**Düzeltme:** Tek alan yerine: inceleme türü (teknik/pedagojik/güvenlik),
kapsam (satır-satır/örneklem/otomatik-denetim), kaynak commit, tarih.
Standart (Hat H) içeriğinde review_due alanı.

### 6. MDX güvenlik açığı — policy var, uygulama yok

docs/08'in "sadece önceden tanımlı bileşenler" kuralı derleyici
seviyesinde uygulanmıyor. Script/iframe/dış kaynak derlenebiliyor (test
edilip doğrulanmış). Açık katkı modelinde bu risk gerçek.

**Düzeltme:** MDX AST allowlist, tehlikeli HTML tag/attribute yasağı,
sadece kayıtlı bileşenler + JSON-benzeri prop'lar, CSP, içerik PR'ları
için otomatik güvenlik testi.

---

## P1 — platform katmanına dönüşüm (P0 sonrası)

- **Öğrenme yolu:** lib/content.ts sadece sira kullanıyor, her hatta
  sıfırlanıyor → seviye sayfasında A1→B1→C1→A2 karışıyor. Yeniden yapı:
  Seviye→Hat→Ders→ilgili kavram/proje, concept_id/related/
  misconceptions/project_ids alanları.
- **Görev kanıtı:** CompleteLessonButton şu an manuel öz-beyan.
  Bileşenler onEvidence({skillId, result, metrics, attempts}) gibi
  standart bir olay üretmeli. Üç aşama: okundu / denendi / başarı
  ölçütü karşılandı.
- **Kaynak/güven paneli:** Ders sayfası süre/hat/kazanım/kaynak/inceleme
  durumunu göstermiyor. 39 dersin 32'si tek kaynaklı, kaynaklar
  tıklanabilir değil.
- **Mobil/erişilebilirlik (1440px + 390px gerçek testte bulunmuş):**
  masaüstünde dar kolon + boş alan, PixelToWorld yatay taşma,
  SignalTimeline hizasız kırılma, touch-none mobil kaydırmayı
  engelliyor, tap-target'lar 44px altında, CodeRunner'da etiket/aria-live
  yok, tema seviyeyle değişmiyor (docs/05'in istediği gibi).
- **CodeRunner/Pyodide:** gerçek timeout yok, reset namespace'i
  sıfırlamıyor. Worker sadece fetch/XHR siliyor — Pyodide JS globals'a
  erişebiliyor, yani worker izolasyonu **performans** için, **güvenlik
  sandbox'ı değil** (bu docs/08'deki ifadeyi biraz düzeltmeli). Gerekli:
  loading→ready→running→success/error/timeout durum makinesi, her
  çalıştırmada temiz namespace.
- **CI/doküman tutarsızlığı:** README "build dahil" izlenimi veriyor ama
  CI'da E2E/visual regression/a11y matrisi yok. docs/08'de istenen
  CSP/HSTS/nosniff/Permissions-Policy/sensitive-term-scanner/Dependabot
  repoda fiilen yok — doküman ile gerçek durum eşitlenmeli (ya CI'a
  ekle, ya dokümanı düzelt).
- **check-content.ts yetersiz:** sadece 5 zorunlu alan kontrol ediyor;
  enum/tip uyumu, pozitif süre, benzersiz sıra, kaynak URL/tarih,
  önkoşulun yayın durumu, kullanılan/beyan edilen bileşen uyumu, quiz
  istatistikleri, tehlikeli MDX de kontrol edilmeli.

---

## Farklılaştırma fikirleri (gelecek vizyon, ŞİMDİ AKSİYONA GEÇME)

Mert'in önceliklendirmesiyle, en makul→en iddialı:

1. **Dört senkron lens** — aynı hareketi sahne+matris+grafik+kod'da
   eşzamanlı gösterme. Ortak zaman çizgisi altyapısı zaten var
   gibi, orta efor.
2. **Tahmin→çalıştır→fark→geri sar** — önce tahmin ettir, sonra çalıştır,
   farkı göster. Mevcut sahnelere eklenebilir, orta efor.
3. **Vendor Rosetta Stone** — RAPID/KRL/FANUC/ROS karşılaştırması, Hat
   D'nin doğal uzantısı, Mert'in stajıyla örtüşüyor.
4. **Tekrarlanabilir deney defteri** — seed/N-tekrar/güven aralığı/export,
   üniversite seviyesini gerçek laboratuvara yaklaştırır.
5. **Arıza enjeksiyon laboratuvarı** — jitter/bias/backlash/drift/paket
   kaybı/tekillik senaryoları.
6. **Yerel beceri pasaportu** — hesapsız, kanıta dayalı JSON/QR portföy.
7. **Türkçe robotik bilgi grafiği** — concept_id tabanlı terim/komut/
   yanılgı graph'ı.
8. **Tek robot hücresi capstone** — 8 hattı büyüyen tek senaryoda
   birleştirme. En iddialı, en büyük kapsam — uzak vadeli vizyon.
9. Hata Müzesi, paylaşılabilir deney (URL fragment state) — daha
   spekülatif, sonraya.

(/oyun-alani, sesli komut, URDF, çoklu robot, AGV, öğretmen paneli zaten
docs/fikirler.md'de var, yeni değil.)

---

## Önerilen uygulama sırası

1. **Integrity gate** (P0'nın tamamı, özellikle #1 hemen ve izole)
2. **Learning kernel** (öğrenme yolu, görev kanıtı, kaynak paneli)
3. **Kalite matrisi** (CI'a E2E/a11y/mobil/içerik-corpus testleri)
4. **Flagship dikey dilim** — D-G'den birer güçlü ders + bunları
   bağlayan mini bir capstone denemesi (tam değil, kanıt niteliğinde)
5. **Farklılaştırma** (dört lens, tahmin döngüsü, arıza lab, deney defteri)
6. **Dağıtım** (SEO, sadece-yayınlanan sitemap, PWA/offline)

## Kritik disiplin kuralı

Her algoritma düzeltmesi önce mevcut hatayı üreten bir regresyon testiyle
sabitlensin (önce kırmızı test, sonra düzeltme). Her PR/commit tek bir
risk grubunu çözsün — birden fazla P0 maddesini aynı commit'e karıştırma.
Taslak statülerini topluca değiştirme. Hat H, SME/insan onayı olmadan
asla yayına gitmesin.

---

## EK — canlı production doğrulaması (aynı denetimin ikinci turu)

**Doğru canonical adres:** https://robotik-platform.vercel.app (bu
kullanılmalı). İki diğer Vercel adresi QA için KULLANILMASIN:
...git-main-... alias'ı anonim kullanıcıyı girişe yönlendiriyor,
...g8rli6u8o... deployment'ı **6 commit ve 84 dosya geride, stale**.

**P0-1 canlıda doğrulandı:** /ders/d-universite-mecademic-python
(taslak) canonical production'da gerçekten 200 OK, uyarısız. Bu artık
teorik bir bulgu değil, şu an gerçek sitede yaşanıyor.

**Ek confirmed bulgular:**
- /robots.txt, /sitemap.xml, /manifest.json → hepsi 404.
- Mobil: 390px viewport'ta bir Hat F dersi ~423px'e taşıyor (overflow
  canlıda doğrulandı).
- Güvenlik başlıkları: sadece Vercel'in varsayılan HSTS'i var. docs/08'in
  istediği CSP/nosniff/Referrer-Policy/Permissions-Policy **hiçbiri
  uygulanmamış** — doküman ile gerçek durum arasında fark var.
- **Node sürüm uyuşmazlığı:** Vercel build Node 24.x kullanıyor, GitHub
  Actions CI Node 20 kullanıyor, engines/.nvmrc gibi sabitleyen bir
  şey yok. CI'ın geçmesi production'ın aynı davranacağını garantilemiyor.
- **GitHub yönetişim boşlukları:** main branch protected değil, imzasız
  commit'ler, CODEOWNERS yok, Dependabot config yok, Actions @v4 gibi
  floating tag'e bağlı (SHA'ya pinlenmemiş — tedarik zinciri riski).

**ÖNEMLİ — eşzamanlı oturum uyarısı:** Bu denetim sırasında çalışma
ağacında 24 adet D-G MDX dosyasında commit'lenmemiş değişiklik bulundu —
başka bir Claude Code oturumu muhtemelen o an içerik düzenliyordu. Bu
denetimin baseline'ı commit 594b306 ve o anki production'dır. **Bu 24
dosyanın değişikliği commit'lenmeden içerik/Quiz/sahne uyumu denetimini
tekrar çalıştırma** — çakışan/yarım bilgiye göre yanlış sonuç çıkabilir.
