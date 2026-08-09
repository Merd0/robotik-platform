# Güncel ürün, öğrenme ve kalite master planı

> **İnceleme tarihi:** 8–9 Ağustos 2026, Europe/Istanbul
> **Karar durumu:** Bu belge bir denetim ve uygulama planıdır. Kanonik ürün
> kararlarının kaynağı `docs/00-11` dosyalarıdır; burada saptanan belge
> çatışmaları çözülene kadar daha katı olan gizlilik, güvenlik ve doğruluk
> kuralı geçerlidir.
> **Koruma notu:** Bu dosyanın önceki 708 satırlık sürümü bütünüyle okundu.
> İz Laboratuvarı, EvidenceEvent, Dört Lens, Run Delta, seed, yerel defter,
> capstone, arıza enjeksiyonu, öğretmen/offline paket ve sürüm duyarlı kanıt
> gibi değerli fikirler silinmedi; aşağıda kökenleri belirtilerek birleştirildi.

## Okuma anahtarı

- `KANIT` gözlenen canlı davranış, dosya, commit veya test sonucudur.
- `YORUM` kanıttan çıkarılan ürün/öğrenme değerlendirmesidir.
- `ÖNERİ` henüz uygulanmamış karardır. Kanıt gösterilmeyen iş tamamlanmış
  sayılmaz.
- `DOĞRULANAMADI` bu denetimde güvenilir biçimde ölçülemeyen noktadır.
- Karar etiketleri: `[KORU]`, `[DÜZELT]`, `[YENİDEN TASARLA]`,
  `[BİRLEŞTİR/KALDIR]`, `[YENİ]`.
- Köken etiketleri: `[DOKÜMANLARDA ZATEN VAR]`,
  `[CLAUDE TARAFINDAN EKLENDİ]`, `[BU DENETİMDE YENİ]`,
  `[MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`.
- Git kayıtları katkıyı ve zamanı kanıtlar; bir commit'i gerçekte hangi AI
  aracının ürettiği bağımsız olarak kanıtlanamaz. Kullanıcının adlandırmasına
  uyarak yakın AI çalışma kümesi tabloda “Claude değişikliği” diye anılmıştır.

---

## 1. İnceleme tarihi, commit, deployment ve kapsam

### 1.1 Baseline

| Alan | Doğrulanan durum | Kanıt |
|---|---|---|
| Yerel dal/commit | `main`, `deddffcd174aa9e1aeebbb753ee25a694433bdf2` (`deddffc`) | `git rev-parse HEAD` |
| GitHub | Uzak `main` aynı SHA; repo açık ve varsayılan dal `main` | `git ls-remote`; [GitHub](https://github.com/Merd0/robotik-platform) |
| GitHub CI | HEAD için push CI tamamlandı ve `success` | [Actions run 31275514925](https://github.com/Merd0/robotik-platform/actions/runs/31275514925) |
| Production | Canlı footer `sürüm deddffc`; Vercel commit durumu `success` | [robotik-platform.vercel.app](https://robotik-platform.vercel.app/) |
| Çalışma ağacı — başlangıç snapshot'ı | İzlenen dosyalarda değişiklik yoktu; yalnız önceden var olan `?? .agents/` ve `?? .codex/` vardı | Rapor yazılmadan önce `git status --short --branch` |
| İçerik | 89 MDX: 39 yayımlı, 50 taslak; production yalnız A-C hatlarını yayımlıyor | İçerik taraması ve build çıktısı |
| Yerel build | 61 statik sayfa üretildi; 50 taslak sayfa/sitemap sızıntısı 0 | `npm run build` |
| Canlı görünüm | Ana, seviye, hat, ders ve capstone 390×844'te; temsilî akış/sayfalar ayrıca 768×1024 ve 1440×900'de incelendi. Örneklerde yatay taşma görülmedi; bütün route×viewport matrisi çalıştırılmadı | Chrome canlı/yerel UI denetimi |

Denetim sonu status'unda rapora ek olarak `AGENTS.md` içinde kendisini Next.js
tarafından üretilen kural bloğu olarak tanımlayan bir fark belirdi; kapsam dışı
olduğu için geri alınmadı veya sahiplenilmedi. `.agents/` ve `.codex/` da
korundu. Bu turda bilinçli içerik düzenlemesi yalnız bu rapor dosyasıdır.

### 1.2 Bu turda çalıştırılan kapılar

| Kontrol | Sonuç |
|---|---|
| `npm test` | 14 dosya, **152/152 test geçti** |
| `npm run lint` | Geçti |
| `npx tsc --noEmit` | Geçti |
| `npm run check-content` | 89 ders, hata 0 |
| `npm run validate-content-graph` | 89 düğüm, döngü/eksik önkoşul 0 |
| `npm run check-quiz-dagilimi` | 139 soru; öğrencinin gördüğü doğru konumu %36,7 / %31,7 / %31,7 |
| `npm run check-mdx-guvenlik` | 89 dosya temiz |
| `npm run build` | Geçti; robots/sitemap/manifest/canonical ve taslak sızıntı kontrolleri temiz |

Bu kapılar derlenebilirlik, belirli matematik fonksiyonları ve içerik şemasını
kanıtlar. Ders ile sahnenin aynı kavramı öğretmesi, bir transfer sorusunun
gerçek beceri kanıtı olması veya review metadatasının hâlâ geçerli olması bu
kapılardan çıkarılamaz.

### 1.3 Beş katmanlı ayrım

| Katman | Mevcut gerçek |
|---|---|
| Dokümanda vaat edilen | 8 hat, üç seviye, oynayarak öğrenme, kaynak+sayısal test+insan review, kişisel verisiz çalışma, endüstriyel gerçeklik |
| Kodda uygulanmış | 89 ders altyapısı; 39 yayımlı A-C dersi; 15 etkileşim bileşeni; saf robotik çekirdek; yerel evidence; tema; arama/sözlük; beta capstone |
| Canlı kullanıcının gördüğü | Güçlü hero ve A-C öğrenme yolu; 39 ders; 38 “etkileşimli” ders; görünür güven paneli; Python/protokol vaadi fakat canlı kod/protokol dersi 0 |
| Yakın Claude/AI değişikliği | Planner/MDX/quiz sertleştirmesi, mobil erişilebilirlik, seviye→hat→ders, hero, EvidenceEvent, altı pilot, capstone, koyu tema, 16 anlatı örneği, sözlük derinleştirme |
| Hâlâ eksik/sorunlu | Hero sınır matematiği yanlış; evidence kolayca sahte; 10 yayının review'i stale; işyeri/gizlilik ihlali; ders–sahne yanlış eşleşmeleri; yayımlı kod öğretimi 0; D-H tamamen taslak |

### 1.4 İncelenen kaynaklar

Kök ve alt kapsam `CLAUDE.md`/`AGENTS.md` dosyaları; `docs/00-11`,
`docs/durum-denetim.md`, `docs/durum-codex.md`, eski bu dosya,
`docs/fikirler.md`, README/CONTRIBUTING/SECURITY; `content/`, `components/`,
`lib/robotics/`, testler, Git geçmişi/diff; canlı production, yerel statik build
ve GitHub durumu incelendi. Teknik önerilerde 8 Ağustos 2026 erişim tarihli
birincil kaynak başlangıçları kullanıldı: [Modern Robotics](https://modernrobotics.northwestern.edu/),
[ROS 2 Lyrical](https://docs.ros.org/en/kilted/Releases/Release-Lyrical-Luth.html),
[NumPy 2.5 dokümantasyonu](https://numpy.org/doc/stable/),
[ISO 9283](https://www.iso.org/standard/22244.html),
[ISO 10218-1:2025](https://www.iso.org/standard/73933.html),
[ABB robot portföyü](https://new.abb.com/products/robotics/en/robots),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/) ve
[Core Web Vitals](https://web.dev/articles/vitals).

### 1.5 Doğrulanamayanlar ve kanıt sınırı

- `[DOĞRULANAMADI]` Ortaokul, lise, üniversite, tekniker, öğretmen veya velilerle
  bu turda moderasyonlu kullanılabilirlik testi yapılmadı. “10 saniye”, “30
  saniye” ve “2 dakika” değerlendirmeleri uzman walkthrough'u ve tarayıcı
  ölçümüdür; hedef metrikler gerçek kullanıcı pilotu ister.
- `[DOĞRULANAMADI]` Production için gerçek kullanıcı p75 Core Web Vitals,
  retention, geri dönüş, ders tamamlama veya funnel analitiği yoktur/erişilemedi.
  Lighthouse sonuçları tek laboratuvar koşusudur.
- `[DOĞRULANAMADI]` Gerçek iOS/Android cihaz, Safari/Firefox matrisi ve NVDA,
  JAWS, VoiceOver/TalkBack ile insan testi yapılmadı. Chrome accessibility tree,
  keyboard ve responsive emülasyon bulguları bu testlerin yerini tutmaz.
- `[DOĞRULANAMADI]` Frontmatter'daki reviewer kimliğinin, uzmanlık kapsamının ve
  inceleme eyleminin bağımsız receipt/kayıtları yoktur. Git tarih karşılaştırması
  staleness'i kanıtlar; geçmişte kimin hangi satırı gerçekten incelediğini tam
  kanıtlayamaz.
- `[DOĞRULANAMADI]` 89 dersin her teknik cümlesi ve bütün D–H draft sayıları
  birincil kaynağa karşı tek tek yeniden hesaplanmadı. Etkileşim aileleri,
  kritik yayınlı örnekler, robotik motorlar ve kaynak şeması denetlendi; yayın
  öncesi claim-level review hâlâ gereklidir.
- `[DOĞRULANAMADI]` Önerilen Robot Seçim Masası için lisanslı/sürümlü vendor veri
  seti henüz oluşturulmadı; örnek birincil kaynaklar uygulanabilirliği gösterir,
  hiçbir ürün değeri bu raporla doğrulanmış veri haline gelmez.
- `[DOĞRULANAMADI]` Güvenlik penetrasyon testi, gerçek saha/robot donanımı ve
  safety uzmanı uygunluk incelemesi yapılmadı. Simülasyon sonuçları gerçek robot
  devreye alma kanıtı değildir.
- `[DOĞRULANAMADI]` Premium ödeme isteği, fiyat, kurum bütçesi ve offline 30 cihaz
  davranışı kullanıcı pilotu olmadan tahmindir. Bölüm 17 bunları karar değil
  doğrulanacak hipotez olarak tutar.
- “Claude değişikliği” atfı commit kümeleri ve kullanıcının adlandırmasına dayanır;
  AI aracının gerçek yazarlığına dair bağımsız telemetry yoktur.

---

## 2. Acımasız fakat adil yönetici özeti

Platform artık “amatör bir ders listesi” gibi görünmüyor. Ana sayfa, tema,
seviye→hat→ders mimarisi, statik/gizli çekirdek, robotik testleri ve kaynak
paneli ciddi bir ürün temeli oluşturuyor. Uzman desktop walkthrough'unda ilk on
saniyelik vaat okunaklıdır: yüzey bunun robot hareketini tahmin edip deneyerek
öğreten Türkçe bir laboratuvar olduğunu anlatıyor; gerçek kullanıcı anlayışı
henüz ölçülmedi.

Fakat ürünün en önemli vaadi olan **“kanıtla” bugün doğru değil**. İmza hero
deneyinin bir slider aralığında fiziksel sonucu ters sınıflanıyor. Bir pilot
derste sahneye dokunmadan bariz çoktan seçmeli cevaba tıklamak “Okundu,
Denendi, Kanıtlandı”nın üçünü de veriyor. 39 yayının 10'u review tarihinden
sonra değiştiği halde canlı panel “İnsan incelemesi … Yayınlanan sürüm” diyor.
Jacobiana eklenen kişisel işyeri/staj cümlesi hem kaynaksız hem projenin mutlak
gizlilik kuralına aykırı. Bunlar kozmetik açıklar değil; platformun teknik ve
etik güven sermayesini doğrudan bozan P0'lardır.

Müfredat sayıca dolu, öğrenme sistemi olarak dengesizdir. A-C'de 39 yayın
vardır; D-H'de programlama, haberleşme, algılama, simülasyon ve güvenliğin 50
dersi bütünüyle taslaktır. Yayında `CodeRunner` veya `BlockEditor` kullanan ders
yoktur. Buna rağmen ana sayfa lise için “basit Python”, üniversite için “gerçek
protokoller” sözü verir. Üniversite katmanında homojen dönüşüm matrisi ekranda
yok, nümerik IK dersi analitik solver çalıştırıyor, C-space dersi workspace
noktası gösteriyor, hız/ivme profili dersinde deney yoktur.

**Karar:** Yeni 30 ders veya ağır 3B yapılmamalı. Önce güven ve evidence
semantiği düzeltilmeli; sonra üç yayımlı ders gerçek performans laboratuvarına,
üç mevcut programlama taslağı da kod öğreten dikey pilotlara dönüştürülmeli.
Capstone görsel prototip olarak korunmalı, gerçek motor/seed/test paylaşmadan
“kanıtlı amiral gemisi” diye pazarlanmamalıdır.

### Ürün hedeflerine mevcut cevap

| Soru | Bugün | Karar verilen hedef |
|---|---|---|
| İlk 10 saniyede değer? | Uzman incelemesinde desktop/mobil metin açık; kullanıcı testi yok | “Tahmin et → çalıştır → farkı ölç → kanıt üret” tek cümle ve görünür mini deney |
| İlk 30 saniyede etkileşim? | Desktop varsayılan durumda evet; mobil/tablette kontrol aşağıda; sınır durumda yanlış | Tüm domain'i testli dinamik sonuç; 390/768 ilk viewport'ta seçim+çalıştır |
| İki dakikada ilk görev? | Ortaokul için mümkün; CTA herkesi ortaokula yollar | Sonuçtan birleşik amaç+derinlik seçimiyle en fazla iki eylemde yayınlı gerçek göreve; kod ancak review edilmiş lab canlıysa |
| Her yaş neden devam eder? | Yaş kartı var, rol/niyet yok | Yaş derinliği + öğrenci/öğretmen/saha/değerlendiren niyet yolları |
| Ölçülebilir öğrenme amacı? | Çoğunda success ve transfer yok | Her yayımlı labda Outcome→Action→Observable→Success→Feedback→Transfer manifesti |
| Neden sıradan siteden değerli? | Tarayıcı içi matematik ve Türkçe potansiyeli | Testli model + tekrarlanabilir deney + gerçek performans kanıtı + şeffaf review |
| Neye ücret ödenir? | Henüz ürünleşmiş premium yok | İleri seed/capstone, öğretmen/offline paket, sürümlü vendor labı ve ayrıntılı rapor; temel öğrenme ücretsiz |

---

## 3. Korunması gereken güçlü yönler

| Karar | Kanıt ve neden |
|---|---|
| `[KORU] [DOKÜMANLARDA ZATEN VAR]` Gizlilik mimarisi | Hesap, e-posta, üçüncü taraf izleyici ve sunucu veri tabanı yok; ilerleme yerel. Çocuk hedef kitle için güçlü farklılaştırıcı. |
| `[KORU]` Statik ve küçük saldırı yüzeyi | Next statik export, taslak sızıntı kontrolü, CSP/nosniff/referrer/permissions/HSTS ve MDX AST allowlist çalışıyor. |
| `[KORU] [CLAUDE TARAFINDAN EKLENDİ]` Seviye→Hat→Ders | Canlıda açık sıra, süre, kazanım ve ilerleme var; 390/768/1440'ta taşma yok. |
| `[KORU] [CLAUDE TARAFINDAN EKLENDİ]` Hero'nun temel ürün fikri | “Robotu izleme; önce tahmin et” platformu ilk ekranda farklılaştırıyor. Matematik ve mobil sıra düzeltilmeli, fikir atılmamalı. |
| `[KORU]` Robotik çekirdeğin UI'dan ayrılığı | `lib/robotics/` saf TS; A*/RRT collision ve düzlemsel regresyonları testli; Python referans fixture yaklaşımı doğru. |
| `[KORU]` PlannerRace'in gözlenebilirleri | Rota, süre, genişletilen düğüm ve yol uzunluğu aynı tabloda; klavye için engel X/Y alternatifi var. Seed/clearance/success ölçütü eklenmeli. |
| `[KORU] [CLAUDE TARAFINDAN EKLENDİ]` Açık/koyu tema | Kalıcı, erişilebilir ad taşıyor; sahne paletleri de değişiyor. Koyu görünüm “odak modu” olarak değerli. |
| `[KORU]` 2B-first karar | Hero ve capstone SVG ile anlaşılır; düzlemsel kavramlarda ağır 3B gerekmiyor. 3B yalnız uzamsal kazanım için lazy. |
| `[KORU]` Kaynak ve review yüzeyini görünür kılma | Trust panel kullanıcıya süre, seviye, kazanım, kaynak ve review gösteriyor. Veri modelinin doğruluğu yeniden kurulmalı. |
| `[KORU] [CLAUDE TARAFINDAN EKLENDİ]` Release izi | Footer canlı commit'i gösteriyor; production/GitHub eşleşmesi bağımsız doğrulanabildi. |
| `[KORU]` Sözlük ve arama | 70 civarı terim daha açıklayıcı hâle getirildi; Türkçe teknik dil için çekirdek var. Terim sürümü/kaynak ilişkisinin yapılandırılması sonraki adım. |
| `[KORU]` Güvenlik uyarısı | Capstone gerçek risk değerlendirmesinin yerine geçmediğini açıkça söylüyor; bu dil tüm fiziksel güvenlik içeriklerinde korunmalı. |

---

## 4. Claude değişiklikleri doğrulama tablosu

| Değişiklik / commit kümesi | Durum | Bağımsız doğrulama ve karar |
|---|---|---|
| `b6a4859` A*/RRT/RRT* collision ve z=0 | **Kısmen çözüldü** | Collision-free ve son segment testleri geçti; `[KORU]`. Ancak ayrık örnekleme ince köşe temasını kaçırabilir ve RRT* rewire alt-ağaç maliyetlerini yaymıyor; optimalite iddiası `[DÜZELT]`. |
| `b6a4859` quiz dağılımı | **Kısmen çözüldü** | 139 Quiz dengeli; fakat `TransferChallenge correct={...}` taranmıyor. Bariz transfer cevapları kalite kapısından kaçıyor. |
| `b6a4859` MDX allowlist | **Çözüldü** | 89 dosya güvenlik denetimi ve testler temiz. `[KORU]`. |
| `5798631` mobil/klavye erişilebilirlik | **Kısmen çözüldü** | Örneklenen lab kontrolleri 44 px, klavye alternatifleri ve touch davranışı var; yatay taşma 0. Mobil hero ve logosu/semantik progress ayrıca düzeltilmeli. |
| `4ce4c94` seviye→hat→ders | **Çözüldü** | Canlı akış güçlü ve tutarlı. `[KORU] [DOKÜMANLARDA ZATEN VAR]`. |
| `4ce4c94` ana sayfa hero | **Yeni sorun üretti** | Temel tahmin fikri değerlidir; fakat 390/768 ilk viewport'ta kontrol yok ve q1≈55–58°'de gerçek uç aşağı inerken metin yukarı der. `[YENİDEN TASARLA]`. |
| `4ce4c94` EvidenceEvent + altı pilot | **Yeni sorun üretti** | Doğru MCQ doğrudan `passed`; `passed` otomatik `tried/read`; 33/39 ders hiçbir yolla passed olamaz; contentVersion tarih tabanlı. `[YENİDEN TASARLA]`. |
| `4ce4c94` trust panel | **Yeni sorun üretti** | Yüzey doğru fikir; fakat stale review'i geçerli gösteriyor, review türlerini ayırmıyor. `[DÜZELT]`. |
| `4ce4c94` robot hücresi | **Kısmen çözüldü** | Görsel/akış/export güçlü; seed üretmiyor, rota/program string doğruluyor, 0 mm/s başarılı, reload UI ilerlemeyi geri kurmuyor. Beta etiketi korunmalı. |
| `014de62` Node/SEO/taslak sızıntı | **Çözüldü** | Node 24 CI, robots/sitemap/manifest ve taslak 0 build'de doğrulandı. README hâlâ “Node 20+” dediği için dokümantasyon `[DÜZELT]`. |
| `9437e0d` kalıcı koyu tema | **Çözüldü** | Tema toggle, persistence ve testler çalışıyor. `[KORU]`. CSS font adları gerçek asset değil; self-hosted tipografi çözülmedi. |
| `ca7335a` 16 ders anlatı çeşitlendirmesi | **Yeni sorun üretti** | Bazı kancalar somutlaştı; fakat altı yayımlı ders review sonrası değişti, Jacobian'a kaynaksız işyeri/vendor bağlamı girdi. Gizlilik ve review P0. |
| `deddffc` sözlük derinleştirme | **Çözüldü** | Tanım ve örnek ayrımı iyileşti; sayfa canlı ve build temiz. Kaynak/version alanı gelecekte yapılandırılmalı. |

### RRT* için dürüst teknik sınır

`lib/robotics/planners/rrtStar.ts` bir komşuyu yeniden bağladığında yalnız o
düğümün `cost` değerini değiştiriyor; torun maliyetleri stale kalabiliyor.
`rrt.test.ts` içindeki “cost tutarlı” testi yalnız yol uzunluğunun sonlu
olduğunu ölçüyor. Sonuç rota geçerliliğini bozmak zorunda değildir, fakat
RRT*'ın giderek iyileşen/optimal rota iddiasını kanıtlamaz. Alt ağaç maliyet
yayılımı, parent-child invariant'ı ve iterasyonla en iyi maliyetin monotonluğu
testlenene kadar canlı metin “RRT* her zaman daha iyi/optimal” dememelidir.

---

## 5. Kullanıcı heyecanını ve güvenini azaltan kritik sorunlar

### 5.1 P0 — Review, kaynak ve gizlilik zinciri kırık

`[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | Canlı güven paneli review tarihinden sonra değişmiş içeriği “Yayınlanan sürüm” diye gösteriyor; review kapsamı tek isim/tarihe indirgeniyor. |
| Kanıt | Git geçmişine göre **10/39** yayımlı MDX'in son değişikliği `incelendi_tarih`ten sonra. `b-universite-jacobian` kişisel işyeri bağlamı ve vendor modeli sayarken tek kaynak Modern Robotics; `docs/00` işyeri bilgisini mutlak biçimde yasaklıyor. `docs/11:72-77` ise bu yanlış yönü teşvik ediyor. |
| Hedef kullanıcı | Öğrenci, öğretmen, veli, teknik reviewer ve bakımcı. |
| Neden önemli | Güven panelinin yanlış olumlu vermesi, panel hiç olmamasından daha zararlı; teknik ve etik denetim izini sahteleştirir. |
| Davranış/görünüm | Tek “İnsan incelemesi” yerine Kaynak / Sayısal test / Teknik / Pedagojik / Güvenlik durumları; geçersizse amber “İçerik değişti, yeniden inceleme gerekli”. |
| Öğrenme katkısı | Öğrenci iddia ile kaynak/test arasındaki bağı görür; öğretmen materyalin hangi yönünün gerçekten incelendiğini seçebilir. |
| Teknik yaklaşım | Body/etkileşim sözleşmesinden deterministik `contentHash`; review kaydı hash+commit+scope taşır. Hash değişince ilgili review stale olur; `contentVersion` tarih değil hash+motor sürümü olur. Gizlilik linter'ı işyeri/kurum adlarını insan kapısına taşır. |
| Mobil/a11y/perf | Trust panel özet rozet+ayrıntı disclosure; semantik liste; ilk render'a ağ isteği eklemez. |
| Risk/bağımlılık | Mevcut 39 yayının yeniden review yükü; “toplu onay” geçmişinin dürüstçe ayrılması; `docs/00`–`docs/11` çatışmasının insan kararı. |
| Ölçülebilir kabul | Yayımlı MDX gövdesi değişince eşleşmeyen hash CI'da fail veya `inceleme gerekli`; stale içerik “incelendi” görünemez; 10 dosya yeniden sınıflanır; işyeri cümlesi kaldırılır; her review scope'u görünür. |
| Etki/efor/öncelik | Etki 5/5 · efor M · risk yüksek · **P0**. |
| Köken | Review/güven paneli mevcut fikrin geliştirilmesi; 10 stale dosya ve belge çatışması bu denetimde yeni kanıt. |

### 5.2 P0 — İlk 30 saniyelik imza deneyinin matematiği yanlış

`[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ] [BU DENETİMDE YENİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | Doğru cevap `prediction === "yukari"` sabitidir; gerçek FK sonucu omuz açısına bağlıdır. |
| Kanıt | Canlıda q1=58°: uç SVG y≈14'ten y≈18'e, yani ekranda aşağı iner; “Aşağı iner” yanlış sayılıp “ucu yukarı taşıdı” denir. Eşik yaklaşık 54°'dir. |
| Hedef kullanıcı | İlk kez gelen herkes; özellikle ortaokul ve değerlendiren yetişkin. |
| Neden önemli | İlk deney platformun doğruluk sözüdür; ilk yarım dakikadaki fiziksel çelişki bütün içeriğe güvensizlik taşır. |
| Davranış/görünüm | Gerçek `before.end.y - after.end.y` işaretinden dinamik sınıf; toleransta üçüncü “hemen hemen değişmez”; önce/sonra koordinat deltası ve yön oku. Mobilde başlık→soru→kompakt SVG→seçim→çalıştır aynı viewport. |
| Öğrenme katkısı | “Dirsek kapanırsa daima yukarı” ezberini değil, eklemlerin birleşik FK etkisini ve sınır durumu düşüncesini öğretir. |
| Teknik yaklaşım | `classifyMotion(before, after, epsilon)` saf fonksiyonu; q1 domain property testi; metin, renk, ok ve SVG aynı sonuç nesnesinden beslenir. Reset q1'i de 24°'ye döndürür. |
| Mobil/a11y/perf | 390×844 ve 768×1024'te seçim+çalıştır tam görünür; yön yalnız renk değil metin+ok; reduced-motion'da anlık önce/sonra; ek JS ≤25 KB gzip. |
| Risk/bağımlılık | SVG y ekseninin ekran yönü ile fiziksel y sözleşmesinin açık yazılması; eşik toleransı. |
| Ölçülebilir kabul | q1=-10…58 her tam derecede UI sınıfı gerçek Δy ile aynı; eşik testi; reset testi; yanlış seçenek doğru geri bildirim; iki viewport screenshot/E2E. |
| Etki/efor/öncelik | 5/5 · S · düşük · **P0**. |
| Köken | Hero mevcut/Claude eklemesi; sınır hatası bu denetimde yeni. |

### 5.3 P0 — “Kanıtlandı” bir beceri kanıtı değil

`[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | Bir MCQ doğru seçimi `passed`; `summarizeEvidence` passed'i otomatik tried/read yapar; sahne önkoşulu yoktur. |
| Kanıt | Canlı `b-ortaokul-birden-fazla-yol` dersinde tahmin/sahne kullanılmadan doğru transfer seçildi; üç rozet birden ✓ oldu. Yalnız 6 derste TransferChallenge var; 33/39 ders geçilemez. |
| Hedef kullanıcı | Tüm öğrenciler, öğretmen ve portföyü değerlendiren kişi. |
| Neden önemli | Yanlış kanıt gelecekte premium portföy/değerlendirme değerini temelinden çürütür. |
| Davranış/görünüm | `Okundu`, `Tahmin etti`, `Denedi`, `Gözledi`, `Transfer etti`, `Testi geçti` bağımsız; MCQ “açıklama kontrolü”, asla performans pass'i değil. Panel hangi metrik/testin geçtiğini gösterir. |
| Öğrenme katkısı | Başarı düğme tıklamaya değil ölçülebilir davranışa ve farklı koşul transferine bağlanır. |
| Teknik yaklaşım | `LabContract` success predicate; `runId`, seed, inputs, observable metrics, test results; `passed` yalnız makine testi+transfer run'ı. `contentHash/engineVersion` eski kanıtı stale yapar. |
| Mobil/a11y/perf | Rozetler metinli; live region cevabı deneyden önce sızdırmaz; kanıt özeti küçük JSON ve yerel; 500 kayıt sınırı yerine sürümlü migration/export/delete. |
| Risk/bağımlılık | 39 dersin contract göçü; pilot olmadan toplu göç yapılmamalı. Eski localStorage “geçersiz” değil “yeniden doğrula” olarak korunmalı. |
| Ölçülebilir kabul | MCQ tek başına pass üretmez; altı pilot gerçek metrik+ikinci koşul ister; eski contentHash rozetini stale yapar; 33 ders için dürüst `henüz kanıt görevi yok` görünür. |
| Etki/efor/öncelik | 5/5 · M · yüksek · **P0**. |
| Köken | EvidenceEvent ve sürüm duyarlı makbuz önceki planda; semantik çöküş canlı testle yeni doğrulandı. |

### 5.4 P0/P1 — Canlı vaat ile yayımlı kapsam ayrışıyor

`[DÜZELT] [CLAUDE TARAFINDAN EKLENDİ] [BU DENETİMDE YENİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | Ana sayfa “basit Python” ve “gerçek protokoller” sözü verir; yayında D-H ve CodeRunner/BlockEditor dersi yoktur. CTA “Seviyeni seç” deyip doğrudan ortaokula gider. |
| Kanıt | 39 yayın: A 14, B 14, C 11; D-H 50/50 taslak. Canlı seviye kartları ve `app/page.tsx`. |
| Hedef kullanıcı | Lise, üniversite, tekniker, öğretmen ve veli. |
| Neden önemli | Beklenti ihlali iki dakika içinde güven ve devam oranını düşürür; tekniker/öğretmen için çıkmaz yol yaratır. |
| Davranış/görünüm | Bugün: “A-C canlı; D-H uzman incelemesinde.” Hero sonucu sonrası iki ayrı seçim ekseni değil, tek **amaç+derinlik** grubu: “Hareketi keşfet / Formülle dene / Matrisle çöz / Dersimde kullan / Sahada karşılaştır”. Kod seçeneği ancak yayınlı CodeRunner manifestte varsa görünür. |
| Öğrenme katkısı | Kullanıcı hazır olmadığı veya henüz yayımlanmamış içeriğe değil, ölçülebilir ilk göreve gider. |
| Teknik yaklaşım | Ana sayfa copy'si yayımlı manifestten türetilir; CTA anchor/choice sheet; rol rotaları mevcut sayfalara filtre/landing, yeni hesap sistemi yok. |
| Mobil/a11y/perf | Bottom sheet yerine erişilebilir link grubu; JS zorunlu değil; iki eylem sınırı. |
| Risk/bağımlılık | Gelecek vizyonu görünmezleştirmemek; “yakında” tarih uydurmamak. |
| Ölçülebilir kabul | Yayın karşılığı olmayan iddia 0; 6 persona uygun ilk değere ≤2 eylem; 8 kullanıcıdan ≥7'si 2 dk'da doğru göreve gider. |
| Etki/efor/öncelik | 5/5 · S · düşük · **P0 copy / P1 yol**. |
| Köken | Niyet yolu eski planın geliştirilmesi; canlı vaat farkı bu denetimde yeni kanıt. |

### 5.5 P1 — Capstone güçlü bir prototip, henüz çapraz-hat kanıtı değil

`[DÜZELT] [DOKÜMANLARDA ZATEN VAR] [CLAUDE TARAFINDAN EKLENDİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | Dört sabit mini soru gerçek kamera, planner, program ve güvenlik motorunu ortak state'te birleştirmiyor. |
| Kanıt | `SEED=240807` yalnız etiket/kayıt; doğru rota literal `ust`; program sabit dizi; güvenlikte gösterilen üst sınırın altı ve 0 mm/s kabul; reload 0/4 UI. |
| Hedef kullanıcı | Lise üstü, üniversite, tekniker ve öğretmen. |
| Neden önemli | Görsel açıdan ürünün en güçlü yüzeyi gerçek mühendislik görevi olursa ödeme ve portföy değerinin çekirdeği olabilir. |
| Davranış/görünüm | İki ghost rota, gerçek collision sonucu; sensör→yaklaş→kavra→doğrula state machine; çevrim hedefini koruyarak maksimum güvenli hız; beş seeded varyant; failure log. |
| Öğrenme katkısı | Kalibrasyon, planlama, program sırası ve güvenlik kısıtlarını tek trade-off içinde uygular. |
| Teknik yaklaşım | Ortak `CellState`; PixelToWorld/planlayıcı/collision/state-machine/allowedSpeed adapter'ları; property-tested fixture; evidence'tan UI hydrate. |
| Mobil/a11y/perf | İlk görev kontrolü büyük sahneden önce; 2B SVG; route pattern+label; log tablo; yalnız etkin adım mount. |
| Risk/bağımlılık | D/H önkoşulları canlı değil; güvenlik modeli standart uygunluğu değildir; kapsam şişmesi. |
| Ölçülebilir kabul | 5 seed çözülebilir; çarpışan segment pass 0; sıfır hız optimum değil; reload ilerlemeyi geri kurar; kanıt collision, cycle, safety margin ve version içerir. |
| Etki/efor/öncelik | 5/5 · L · yüksek · **P1 dürüst beta/false-pass düzeltmesi; P2 learning kernel sonrası tam v2**. |
| Köken | Capstone belgelerde vardı ve Claude beta ekledi; bu v2 mevcut fikrin geliştirilmesi. |

### 5.6 İkincil fakat profesyonellik hissini aşındıran açıklar

- `[DÜZELT]` CSS “Inter / Inter Tight / JetBrains Mono” adlarını yazar ama
  font asset, `@font-face` veya `next/font` yoktur; kullanıcı sistem fallback'i
  görür.
- `[DÜZELT]` README “Node.js 20+” derken `.nvmrc` ve `package.json` 24.x'tir.
- `[DÜZELT]` Seviye kartlarında her dersin isimsiz `sr-only` progress rozeti
  okunur; ekran okuyucu “Başlanmadı”yı bağlamsız tekrarlar.
- `[DÜZELT]` `PredictionPrompt` tahmin kilitlendikten sonra fakat bağlı deney
  çalıştırılıp observable oluşmadan doğru açıklamayı `sr-only` içine koyar; ekran
  okuyucu kullanan öğrenci sonucu görsel kullanıcıdan erken alır.
- `[DÜZELT]` Ana sayfadaki “89 toplam içerik altyapısı” kullanıcı değeri değil
  vanity metriktir; 39 yayın/50 taslak ayrımı ve review durumu daha dürüsttür.

---

## 6. Yaş grubuna ve niyete göre kullanıcı yolculukları

`[YORUM + ÖNERİ] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` Aşağıdaki “ilk değer,
etkileşim, başarı, devam ve geri dönüş” hücreleri hedef yolculuktur; “kaybolma”
hücresi bugünkü canlı kanıtı taşır. Henüz olmayan seed, kod testi, Robot Seçim
Masası, rubrik ve offline paket uygulanmış gibi okunmamalıdır.

| Kullanıcı | Siteye geliş nedeni | İlk gördüğü değer | İlk etkileşim ve başarı | Devam nedeni | Kaybolma/sıkılma noktası | Geri dönme nedeni |
|---|---|---|---|---|---|---|
| Ortaokul | Merak, ödev, robot kulübü | Formülsüz hareket ve “önce tahmin et” | Hero yön tahmini → ölçülü hedefe ≤5 cm yaklaşma | Kısa görev, iz, yeni merak sorusu | Mobil kontrol aşağıda; sahnede metindeki biber/hedef yok; editoryal “Kanca” başlığı | “Devam et: Hareket 1/3”, yeni seeded hedef |
| Lise | Trigonometriyi robotla bağlamak, proje/Python | Aynı hareketin koordinat/formül karşılığı | `(x,y)` tahmini → toleranslı FK doğrulaması | FK→IK→limit→planlama→kod zinciri | Python vaadi canlı değil; CTA ortaokula yollar | Kaydedilmiş deney, kod testi, yeni parametre |
| Üniversite | Ders tekrarı, Jacobian/IK/planlama, portföy | Kaynak, çalışan model, failure mode | Tekillik üret → kaybolan hız yönünü metrikle kanıtla | Run diff, kod, sayısal hata, capstone | Matris görünmüyor; nümerik IK analitik; MCQ kanıt | Seed'li notebook, test geçmişi, teknik proje |
| Tekniker/meraklı | Robot seçimi, devreye alma, PLC/robot, arıza | Vendor-neutral hücre ve şartname | Kısıtları sağlayan robot/hücre çözümü ve gerekçe | Vendor semantiği, fault lab, commissioning log | D-H canlı değil; protokol sözü karşılıksız; capstone sabit | Saklanan hücre state'i ve yeni vaka |
| Öğretmen | 40/80 dk güvenilir Türkçe materyal | Hesapsız, kaynağı/review'i görünür, veri toplamayan yapı | Görevi öğrenci gibi geç → rubrik/kanıt eşleşmesini gör | QR seed, plan, yanlış model rehberi, offline paket | Öğretmen girişi, plan/rubrik, sınıf modu yok | Yeniden kullanılabilir ders paketi ve yerel kanıt birleştirme |
| Veli/değerlendiren | Yaşa uygunluk, güvenlik ve kalite | 30 sn gerçek öğrenme + şeffaf gizlilik | Hero → öğrencinin ölçülebilir çıktı ürettiğini gör | Dürüst yol haritası, review matrisi, cihazdaki ilerleme | “89 altyapı” metriği; tek isimli/stale review | Açık beceri özeti ve güncel review/sürüm |

Bugünkü rota ile hedef ilk görev arasındaki ayrım:

| Persona | Bugünkü canlı rota | Hedef rota — hero sonucu sonrası tek CTA | İlk başarı predicate'i |
|---|---|---|---|
| Ortaokul | `/` → seviye kartı → A/B/C hat → ders; mobil hero kontrolü aşağıda | `Hareketi keşfet` → `b-ortaokul-eklemleri-oynat#gorev` | Verilen hedefe uç nokta ≤5 cm ve ikinci eklem koşusu |
| Lise | `/seviye/lise` → hat → ders; Python yayında yok | `Formülle dene` → review edilmiş FK görevi | İki hedefte hesap–sahne hatası ≤tanımlı tolerans |
| Üniversite | `/seviye/universite` → hat → ders; matris/DLS eşleşmeleri yanlış | `Matrisle çöz` → review edilmiş homojen dönüşüm görevi | İki çarpım sırası fixture'ı + yeni frame transferi |
| Tekniker/meraklı | Ayrı niyet yolu yok; A–C içinden elle seçer | Bugün `Planlamayı karşılaştır`; P2 sonrası `Robot seç` | Collision-free iki rota karşılaştırması; sonra ≥4 seçim kriteri |
| Öğretmen | Öğrenci sayfalarını tek tek gezer; paket/rubrik yok | `Dersimde kullan` → tek review edilmiş ücretsiz görev+uygulama notu | Görevi öğrenci gibi geçirir ve predicate–rubrik bağını bulur |
| Veli/değerlendiren | Hero ve trust panel; stale kapsam görünmez | `Nasıl kanıtlanıyor?` → demo koşusu+review kapsamı | Koşu ölçümü ile insan/otomatik review farkını doğru söyler |

Hero tamamlandıktan sonra tek CTA doğrudan göreve açılır. Hero atlanırsa `İlk
görevi bul` bir birleşik amaç+derinlik seçimi ve bir görev açılışıyla toplam iki
eylemdir; ayrı “derinlik sonra niyet” ekranı kurulmaz.

Tüm yolculuklar için ortak iki dakikalık şablon:

```text
0-10 sn   Değer cümlesi + görünür robot davranışı
10-30 sn  Tahmin → çalıştır → ölçülen fark
30-60 sn  Sonuca göre derinlik/niyet seçimi
60-120 sn İlk gerçek görev + başarı ölçütü
```

---

## 7. Üç görsel yön ve seçilen tasarım

Bu üç yön `git show deddffc:docs/guncel-fikirler.md` içindeki “İz Laboratuvarı”,
“Dört Lens/Run Delta” ve odak modu fikirleri ile `docs/07-tasarim-sistemi.md`
üzerinden türetildi; burada birbirinden daha keskin ürün dilleri olarak
geliştirilmiştir. Yeni fikir diye sunulmazlar.

### 7.1 Yön A — İz Laboratuvarı / Canlı Teknik Çizim — **seçilen**

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ] [CLAUDE TARAFINDAN EKLENDİ]`

- **Fikir/duygu:** Sakin teknik güven; kullanıcı bir makineyi seyretmez,
  izinden ve ölçüsünden nedenini okur.
- **İlk 10/30 saniye:** Net değer cümlesi + küçük 2B kol; ardından seçim,
  hareket, gerçek Δx/Δy, ghost trace ve tek cümle nedensel açıklama.
- **Renk/tipografi:** Teknik kâğıt `#F7F9F8`, mürekkep `#102523`, iz
  `#00A39A`, veri mavisi `#2563EB`, uyarı amber. Self-hosted yüksek
  okunurluklu sans; heading aynı ailenin display kesiti; mono yalnız sayı,
  matris ve kodda.
- **Grid/kart/panel/nav:** 12 kolon, laboratuvar 7/5; 12–16 px radius, 1 px
  teknik sınır. Navigasyon: Öğrenme yolları, Canlı lab, Ara, Devam et, tema;
  mobil menüde Sözlük.
- **İkon/çizim:** Eksen, eklem, sensör, rota, kontrolör ve end-effector için
  ortak stroke kalınlıklı, etiketi olan işlevsel SVG; foto/dekor yerine teknik
  kesit.
- **İz/koordinat/telemetry/grafik/kod/şema:** İz her zaman önce/sonra/run
  verisi taşır. Koordinatlar birimli; metrik rayı ve kod aynı `runId/frame`;
  grafik ve matris yalnız kazanım gerektiğinde açılır.
- **2B/3B:** Hero, planlama, sinyal, grafik ve matris 2B; uzamsal yönelim,
  occlusion veya kamera gerektiren görevlerde lazy 3B. 3B hiçbir zaman başarı
  kriterinin tek erişim yolu değildir.
- **Mikro etkileşim:** 180–320 ms mekanik easing, sayı diff'i, tek trace çizimi,
  basılı/focus/başarı durumu; scroll-parallax, sürekli pulse ve dekoratif
  parçacık yok.
- **Açık/koyu:** Açık görünüm ana editoryal/lab yüzeyi; koyu görünüm aynı
  token'ların odak modu. Neon değil, kontrastlı veri rengi.
- **Seviye uyarlama:** Ortaokul büyük kontrol/tek metrik; lise vektör+grafik;
  üniversite matris+kod+condition; profesyonel log+failure+sürüm.
- **Mobil:** Başlık→tahmin→4:3 sahne→kontrol→sonuç ilk viewport; tek lens
  görünür, diğerleri erişilebilir tab; state korunur.
- **Performans/a11y sınırı:** Hero ek JS ≤25 KB gzip; 44 px proje hedefi;
  WCAG 2.2 AA; renk dışında desen/etiket; reduced-motion; harici font isteği
  0; 3B/WebAssembly ilk rotada yüklenmez.
- **Ana sayfa wireframe:** `Header → değer+mini deney → sonuçtan derinlik →
  niyet yolları → canlı hat haritası → güven/review → capstone beta`.
- **Ders wireframe:** `Kimlik/outcome → sahne+adım rayı → metrik/run history →
  açıklama → gerçek transfer → kanıt → kaynak/review`.
- **Avantaj/risk/maliyet:** Mevcut ürün ve `docs/07` ile en uyumlu. Yalnız token,
  shell ve tek hero prototipi 1–2 haftalık M efor; Learning Kernel ve altı gerçek
  pilot ayrı **XL/8–12+ hafta** programıdır. Risk: çok beyaz/jenerik kart; iz veri
  taşımıyorsa dekor olur. Etki 5/5, görsel shell P1; pilot programı P1–P2.

### 7.2 Yön B — Gece Vardiyası / Olay Kontrol Odası

`[DÜZELT] [DOKÜMANLARDA ZATEN VAR]`

- **Fikir/duygu:** Operasyonel ciddiyet ve arıza avı; ana nesne dashboard
  değil tek olay ve neden zinciridir.
- **İlk 10/30 saniye:** Koyu hücrede amber/kırmızı tek anomali ve “hangi
  sinyal kırıldı?”; play ile timeline, telemetry ve log aynı playhead'de
  değişir.
- **Renk/tipografi:** `#08121E`, `#102235`, açık metin, turkuaz canlı sinyal,
  amber uyarı, kırmızı duruş; self-hosted grotesk + mono.
- **Grid/panel/nav:** Sahne 6/12, olay timeline 4/12, kanıt rayı 2/12; KPI
  kartları yerine neden→olay→sonuç. Nav “Senaryo / Log / Şema / Kanıt”.
- **İkon/çizim:** Vendor-neutral sensör, PLC, robot, ağ, E-stop sembolleri;
  lisanslı HMI kopyası değil.
- **Koordinat/iz/telemetry/grafik/kod/şema dili:** Robot izi olay segmentlerine
  ayrılır; base/tool frame küçük eksen glyph'i ve birimiyle kalıcıdır. Osiloskop
  grafiği, bit/state timeline, sequence/state-machine şeması, log ve kod satırı
  aynı zaman imlecine bağlı; çizgi deseni+etiket kullanır.
- **2B/3B:** Haberleşme ve sinyal 2B; robot konumu için küçük 3B/2B twin;
  ağır hücre dekoru yok.
- **Mikro etkileşim/tema:** Sweep, pause, scrub, event highlight; sürekli
  neon/pulse yok. Açık tema olay analizi için basılabilir “incident sheet”.
- **Seviye:** Ortaokul görev kontrolü; lise deney konsolu; üniversite/pro
  commissioning ve kök neden.
- **Mobil:** Sahne/olay/log sekmeleri; her olay metin tablosunda okunur;
  playback tamamen durdurulabilir.
- **Performans/a11y:** Çizgi yalnız renk değil; canvas varsa veri tablosu;
  log virtualization; açık olmayan panel mount edilmez.
- **Ana sayfa wireframe:** `Aktif olay → müdahale seç → sonucu oynat → rol/hat`.
- **Ders wireframe:** `Olay brief → sahne+timeline → teşhis → counterfactual → test`.
- **Avantaj/risk/maliyet/kabul:** D-H ve fault lab için çok güçlü; tüm siteye
  yayılırsa göz yorar ve klişe HMI olur. XL maliyet; yalnız P2/P3 focus mode.
  Enjekte edilen üç fault'ta olay, log ve sahne aynı timestamp'i göstermeli;
  kullanıcıların ≥%75'i kök nedeni ve güvenli ilk eylemi bulmalı. Etki 4/5.

### 7.3 Yön C — Modüler Deney Tezgâhı / Derinlik Lensleri

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Fikir/duygu:** Bilimsel araç ve parçaları birleştirerek anlama; sabit
  giriş→işlem→çıktı akışı, sürüklenebilir SaaS dashboard'u değil.
- **İlk 10/30 saniye:** Bir hareket ve Sahne/Grafik/Matris/Kod lenslerinden
  biri; playhead sürüklenince ikinci lens aynı frame'i açıklar.
- **Renk/tipografi:** Soğuk gri, beyaz panel, mekanik mavi, ölçülü amber;
  IBM Plex benzeri self-hosted sans+mono.
- **Grid/kart/nav:** Tezgâh slotları; 8 kolon ana lens, 4 kolon görev/test;
  nav lens şeridi ve run seçici.
- **İkon/çizim:** Matris parantezi, grafik ekseni, kod, eklem, ölçüm probu;
  her ikon panel açar veya kavram öğretir.
- **Koordinat/robot izi/telemetry/grafik/kod/şema dili:** Base/tool/world eksenleri
  aynı frame rozetini taşır; robot izi before/after/run katmanlıdır. Matris hücresi,
  grafik örneği, kod satırı ve kinematik zincir şeması aynı `runId/frame/time`
  anahtarında vurgulanır; şema dekor değil frame dönüşümünü açıklar.
- **2B/3B:** 2B ana; 3B isteğe bağlı tek lens. Açık olmayan lens lazy.
- **Mikro etkileşim/tema:** Senkron scrubber ve before/after diff; kart takma
  animasyonu yok. Açık/koyu aynı veri paletini korur.
- **Seviye:** Ortaokul tek lens; lise iki; üniversite/pro dört lens ve hidden
  test/log.
- **Mobil/a11y:** Erişilebilir tablist; tek lens; state kaybolmaz; grafik/matris
  tablo alternatifi.
- **Performans:** Tek ortak trace; lensler hesaplamayı çoğaltmaz; 60 fps hedefi
  yalnız playhead, tüm DOM değil.
- **Ana sayfa wireframe:** `Tek hareket → lens değiştir → derinlik seç`.
- **Ders wireframe:** `Task brief → lens strip → run/diff → açıklama → transfer`.
- **Avantaj/risk/maliyet/kabul:** Kod öğretimi için en güçlü zemin; ortak timeline
  yoksa pahalı dashboard olur. XL/6–10+ hafta, önce tek homojen dönüşüm pilotu;
  dört lens invariant testinde aynı sample/birim/frame'i göstermeli ve temsil
  transferi ≥%80 olmalı. Etki 5/5, P1 pilot/P2 ölçek.

**768 px ortak reflow:** Üç yönde de hero/brief tam genişlik; sahne 5/8 ve görev
3/8 olur. İkinci veri lensi altta tam genişliğe iner; iki bağımsız yatay scrollbar
oluşmaz. 768×1024 kabulünde vaat, aktif kontrol ve observable ilk iki viewport
içinde; tab sırası görsel sırayla aynı; state breakpoint değişiminde korunur.

### 7.4 Seçim

**A ana ürün dili seçilmelidir.** C'nin senkron lensleri üniversite/kod
derslerinde, B'nin olay kontrol odası arıza–haberleşme–güvenlik odak modunda
kullanılmalıdır. Böylece marka tek kalır, öğrenme görevi gerektiğinde uzman
görünüm değişir; üç ayrı siteye dönüşmez.

Her görsel öğe yayın öncesi şu beş işlevden en az birini işaretlemelidir:
`yön buldurur | kavram öğretir | sonuç gösterir | geri bildirim verir | merak
uyandırır`. Hiçbirini karşılamayan grid, glow, 3B model veya animasyon kaldırılır.

---

## 8. Sayfa bazlı deney ve metinsel wireframe'ler

`[KANIT + ÖNERİ] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` Kanıt cümleleri bugünkü
sayfayı, code block'lar hedef wireframe'i gösterir.

### 8.1 Ana sayfa

`KANIT:` Mevcut desktop kompozisyon güçlü; mobil/tablette deney kontrolü ilk
viewport dışında. “Seviyeni seç” ortaokula gider. 39/38/3/89 sayaçlarında 89
kullanıcı değerini açıklamaz.

```text
[R° Robotik Laboratuvarı] [Yollar] [Canlı lab] [Ara] [Devam et] [Tema]

[Robotu izleme. Önce tahmin et.] [Soru + iki seçenek]
[tek cümle değer/gizlilik]        [kompakt 2B kol]
                                  [Çalıştır → Δx/Δy + neden]

[Tek birleşik amaç+derinlik grubu]
[Hareketi keşfet] [Formülle dene] [Matrisle çöz] [Dersimde kullan] [Sahada karşılaştır]
[Kodla dene yalnız manifestte review edilmiş CodeRunner dersi varsa]

[Canlı A-C hat haritası] [D-H: uzman incelemesinde, tarih vaadi yok]
[Gerçek kanıt örneği] [Kaynak/teknik/pedagojik review açıklaması]
[Robot hücresi beta: neyi gerçekten doğruladığı açık]
```

**Keşif prototipi kapısı:** 8 yeni kullanıcının ≥6'sı 10 saniyede farkı söyler,
≥6'sı 30 saniyede deneyi bitirir, ≥7'si 2 dakikada uygun göreve ulaşır. Bu küçük
örneklem tasarım eleme kapısıdır; Bölüm 24'teki ≥30 kişilik release kabulünün
yerine geçmez.

### 8.2 Seviye ve niyet sayfası

```text
[Breadcrumb]                         [Devam edilen görev]
[Bu yolda üreteceğin 3 somut beceri]
[Hat A: amaç | süre | denendi/kanıtlandı | İlk göreve başla]
[Hat B ...]
[Hat C ...]
[Başka derinliğe geç — aynı kavram/run state'i korunur]
```

`[DÜZELT]` Seviye kartındaki isimsiz `sr-only` rozetler kaldırılmalı; görünür
özet “1/4 denendi, 0/4 kanıtlandı” olarak link bağlamında okunmalıdır.

### 8.3 Hat sayfası

```text
[Neden önemli? + 10 saniyelik karşı örnek]
[1. Ders: ölçülebilir görev | önkoşul | süre | review | durum]
[2. Ders: ...]
[3. Ders: ...]
[Bu hattın capstone'a kattığı beceri]
```

Mevcut sıra ve kartlar `[KORU]`; her karta yalnız ilk kazanım değil “ne
üreteceksin/neyi kanıtlayacaksın” eklenmelidir.

### 8.4 Ders — desktop

```text
[Breadcrumb | süre | kaynak/review sürümü]
[Başlık] [Tek ölçülebilir outcome]

[7 kolon: sahne/trace/metrics] [5 kolon: Merak→Tahmin→Deney→Gözlem→Açıklama]
[Run history: önceki / şimdiki / diff]
[Formül, birim, varsayım, gerçek robotta ne değişir?]
[Hata ayıklama]
[Farklı koşullu gerçek transfer]
[Testli kanıt makbuzu]
[Kaynak claim'leri + teknik/pedagojik/güvenlik review]
```

### 8.5 Ders — 390 px mobil

```text
[Başlık + outcome]
[Tahmin]
[4:3 sahne]
[Kontrol + tek canlı metrik]
[Sonuç + kısa neden]
[Açıklama disclosure]
[Transfer]
[Kanıt ve sonraki görev]
```

Sticky 3B sahne tüm metni itmemeli; tek lens görünür, diğerleri tab. Başarı
CTA'sı klavye odağını çalmaz ve focus görünür kalır.

### 8.6 Robot hücresi beta

Mevcut 1440 split ve 390 tek kolon `[KORU]`. “0/4 kanıt” yerine beta aşamasında
“0/4 kontrol tamamlandı” denmeli. Gerçek evidence kernel gelince isim yeniden
“kanıt” olabilir. Aday rotalar seçilmeden ghost görünmeli; sonuç gerçek
collision motorundan gelmelidir.

### 8.7 Ortak ürün durumları

| Durum | Ortak sözleşme |
|---|---|
| Loading | Ne yükleniyor + süre beklentisi + iptal; 3B/WebAssembly için metin/2B fallback |
| Empty | Neden boş + ilk anlamlı preset; boş PlannerRace yerine iki engelli örnek |
| Error | Kısa başlık + neden + düzeltme eylemi + açılabilir teknik ayrıntı |
| Success | Yalnız gerçek predicate/test sonrası; ölçüm ve tolerans görünür |
| Offline | “Önbellekte ve çalışır” ile “bu paket indirilmemiş” ayrımı |
| Stale | İçerik/motor değişti; eski kanıt korunur ama “yeniden doğrula” |
| Review required | Kaynak var fakat insan scope'u stale/bekliyor; yeşil güven rozeti yok |

---

## 9. Etkileşimlerin pedagojik ve teknik denetimi

### 9.1 Ortak sözleşme

Bir etkileşim ancak şu zincirin her halkası görünürse “öğretici” sayılır:

```text
Outcome → Action → Observable → Success → Feedback → Transfer
```

Her kayıt ayrıca şu altı soruya cevap vermelidir: öğrenci hangi değişkeni
kontrol ediyor; hangi ölçülebilir sonucu görüyor; hangi yanlış modeli fark
ediyor; başarı ölçütü nedir; başarıyı hangi veri kanıtlıyor; bilgiyi farklı
koşula nasıl taşıyor? Aşağıdaki boş hücreler dekoratif veya eksik öğrenme
sözleşmesini gösterir.

### 9.2 Bileşen bazlı sözleşme denetimi

| Bileşen / yayın durumu | Kontrol → ölçülebilir gözlem | Yanlış model / mevcut success ve kanıt | Transfer | Karar |
|---|---|---|---|---|
| HeroExperiment / canlı | q1+tahmin → uç Δx/Δy ve iz | “Dirsek kapanınca hep yukarı”; success yanlış biçimde sabit `yukari`, evidence yok | Yok | `[YENİDEN TASARLA]` Dinamik FK predicate ve post-result görev |
| JointSliders / canlı | Eklem açısı/ötelemesi → kol ve uç x/y | Eklem etkisi; success yok; slider değişimi hemen `tried:success`, birim eksik | Yok | `[DÜZELT]` Hedef+tolerans+ikinci robot parametresi |
| IkTarget / canlı | Hedef x/y+dirsek → poz/erişilebilirlik | Çoklu çözüm; residual/iterasyon/tolerans yok; erişilebilir her nokta `tried:success` | Yok | `[DÜZELT]`; nümerik IK dersinde `[YENİDEN TASARLA]` |
| JacobianViz / canlı | q1/q2 → sütunlar, elips, manipulability | Tekillikte yön kaybı; öğrenci q̇ seçmiyor, v=Jq̇ görmüyor; açı “eklem hızı yönü” diye etiketleniyor | MCQ | `[YENİDEN TASARLA]` q̇→v görevi+rank/condition |
| PlannerRace / canlı | Engel+algoritma → rota, süre, düğüm, uzunluk | “Rota bulundu=iyi”; clearance, geçerlilik rozeti, seed/dağılım yok | Yalnız 1 derste MCQ | Motor `[KORU]`, lab `[DÜZELT]` |
| Quiz / canlı | Şık → doğru/yanlış açıklama | Kavram kontrolü; konum shuffle testli, fakat performans değil | Yok | `[KORU]` düşük riskli retrieval; `passed` üretmesin |
| PredictionPrompt / 6 canlı ders | Seçim → kayıt | Deney sonucu ile otomatik karşılaştırılmıyor; tahmin commit'inden sonra fakat run observable oluşmadan doğru açıklama `sr-only` sızıyor | Yok | `[DÜZELT]` Açıklama yalnız run sonucu sonrası; görsel ve ekran okuyucu sırası eşit |
| TransferChallenge / 6 canlı ders | Şık → feedback | Bariz MCQ doğruysa doğrudan `passed`; sahne önkoşulu yok | Adı transfer, davranışı transfer değil | `[YENİDEN TASARLA]` İkinci run/hidden test |
| CodeRunner / 8 taslak kullanım | Python → stdout, hata, son poz | Otomatik test, timeout, temiz namespace, satır izi ve evidence yok | Yok | `[YENİDEN TASARLA]` Kod Lab Shell |
| BlockEditor / 2 taslak | Blok sırası/koşul → son poz dizisi | Çalışan blok, trace ve iki koşul testi yok | Yok | `[DÜZELT]` İki seeded senaryo |
| SignalTimeline / 7 taslak | Bit hücreleri → 500 ms playhead | Bileşen doğruluğu değerlendirmiyor; timeout/jitter/illegal transition yok | Yok | `[YENİDEN TASARLA]` State-machine harness |
| PixelToWorld / 5 taslak | Piksel+ölçek → dünya koordinatı | Ground truth/residual yok; uzaklığa bağlı görsel çarpan fiziksel kamera modeli değil | Yok | `[DÜZELT]` Kalibrasyon ground truth+belirsizlik |
| ThresholdViewer / 2 taslak | Eşik → tespit sayısı | False positive/negative, precision/recall ve etiketli gerçek yok | Yok | `[DÜZELT]`; belirsizlik dersinde yanlışsa `[BİRLEŞTİR/KALDIR]` |
| ScanPath / 3 taslak | Satır sayısı → ziyaret edilen hücre | Satır azalınca örnek aralığı değil yüzey küçülüyor; coverage her zaman %100 | Yok | `[YENİDEN TASARLA]` Sabit yüzey+missed-feature metriği |
| SafetyZone / 5 taslak | Mesafe/hız/fren → izinli hız | Yön ve birim iyi; sabit varsayımlar pedagojik model, standart uygunluğu değil | Yok | `[DÜZELT]` Mevcut modeli koru; varsayım paneli+optimum görev ekle |
| RobotCellCapstone / canlı beta | 4 mini kontrol → 0/4 | Kalibrasyon gerçek; rota/program literal; güvenlik 0 hızla geçer; seed üretmez | Tek sabit hücre | `[DÜZELT]` Gerçek ortak state ve 5 seed |

### 9.3 Yayımlı derslerde kanıtlı yanlış eşleşmeler

| Ders | Kazanım ile sahne arasındaki açık | Karar |
|---|---|---|
| `a-ortaokul-robot-turleri` | Mafsallı/SCARA/delta/Cartesian ayrımı; yalnız generic 2-DOF seri kol | `[YENİDEN TASARLA]` Robot Seçim Masası'na bağla |
| `a-lise-koordinat-sistemleri` | World/base/tool kazanımı; sahnede frame yok | `[YENİDEN TASARLA]` Frame overlay ve dönüşüm görevi |
| `a-universite-homojen-donusum` | 4×4 matris kazanımı; öğrenciye matrisi “hayal et” deniyor | `[YENİDEN TASARLA]` Senkron sahne+matris |
| `a-universite-robot-mimarileri` | Beş mimari karşılaştırması; tek seri kol | `[YENİDEN TASARLA]` Görev/kısıt bazlı seçim |
| `b-universite-ters-kinematik` | DLS iterasyonu anlatıyor; 2-DOF olduğu için `IkTarget` daima analitik solver çalıştırıyor | `[YENİDEN TASARLA]` Gerçek DLS trace |
| `b-universite-yorunge-uretimi` | İnterpolasyon/zaman kazanımı; yalnız hedef sürükleme | `[YENİDEN TASARLA]` x(t), v(t), a(t) grafiği ve playback |
| `b-universite-hiz-ivme-profilleri` | Yamuk/S-eğrisi; etkileşim yok, “Dene” sonraki dersi oku diyor | `[YENİDEN TASARLA]` Profil karşılaştırma labı |
| `b-universite-movej-movel` | MoveJ/MoveL; sahnede mod/yol izi yok | `[YENİDEN TASARLA]` Joint/cartesian path diff |
| `c-lise-a-yildiz-sezgisel` | g/h/f ve açık/kapalı küme; sahnede gözlenmiyor | `[DÜZELT]` Adım adım frontier lensi |
| `c-universite-c-space` | θ1×θ2 C-space; x/y point planner gösterip “hayal et” deniyor | `[YENİDEN TASARLA]` Gerçek C-obstacle raster |
| `c-universite-rrt-rrt-star-prm` | Kazanım PRM içeriyor; PRM çalıştırılamıyor | `[DÜZELT]` PRM ekle veya kazanımı daralt |
| `c-universite-yol-duzlestirme` | Smoothing algoritması yok; kâğıtta çiz deniyor | `[BİRLEŞTİR/KALDIR]` Gerçek shortcut lab gelene dek planner deneyine birleştir |
| `b-ortaokul-eklemleri-oynat` | Metin kırmızı biber/sağ üst hedef söyler; sahnede hedef/tolerans yok | `[YENİDEN TASARLA]` Ölçülü hedef+ikinci koşul |

### 9.4 Üç yayımlı ders için ayrıntılı yeniden tasarım

#### A — Homojen dönüşüm: görünmeyen matrisi görünür yap

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

| Alan | Karar |
|---|---|
| Problem/kanıt | `a-universite-homojen-donusum`: JointSliders var, matris yok. |
| Hedef/neden | Üniversite; dönüşüm sırası ve frame yanılgısı robotik matematiğinin önkoşulu. |
| Davranış/görünüm | `Rz·Trans` ile `Trans·Rz` sırasını, θ ve ötelemeyi değiştir; 4×4 semantik tablo, world/tool eksenleri, nokta ve ghost iz aynı anda değişsin. |
| Öğrenme | Non-commutativity ve base→tool zinciri gözlenebilir olur. |
| Teknik | Mevcut saf transform fonksiyonları; column-vector/active-transform sözleşmesi; 2B SVG+table. |
| Mobil/a11y/perf | Sahne/matris tab; klavyeli sıra; matris semantik tablo; 3B yok. |
| Risk | Aktif/pasif dönüşüm terminolojisi; sözleşme panelde sabit görünür. |
| Kabul | Identity, yalnız R, yalnız T, sıra farkı; üç fixture `1e-6`; farklı base→tool transferi. |
| Etki/efor/öncelik | 5/5 · M · P0/P1. |
| Kaldırılırsa kayıp | Öğrenci formülün geometrik etkisini ve sıra hatasını ölçemez. |

#### B — Nümerik IK: analitik animasyon yerine yakınsama deneyi

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

| Alan | Karar |
|---|---|
| Problem/kanıt | Ders DLS anlatır; `IkTarget.solveIk` 2 eklemde analitik branch seçer. |
| Hedef/neden | Üniversite; q0, λ, tekillik ve erişilemez hedef ilişkisini öğrenmek. |
| Davranış/görünüm | Hedef, q0, λ, step/max iteration kontrolü; her iterasyon pozu, residual grafiği, joint-limit ve bitiş nedeni. Analitik referans yan yana. |
| Öğrenme | Yakınsama/kararlılık trade-off'u ve failure taxonomy. |
| Teknik | `inverseKinematicsNumerical` trace; deterministic start; position-only scope; fixture/property test. |
| Mobil/a11y/perf | 2B kol+SVG grafik+trace table; iterasyon üst sınırı; pause/step. |
| Risk | 6-DOF kontrolöre aşırı genelleme; orientation desteklenmiyorsa açık etiket. |
| Kabul | Analitik branch kullanılmadığı test; residual `<1e-3 m`; normal/tekil/erişilemez/limit fixture; ikinci q0 transfer. |
| Etki/efor/öncelik | 5/5 · M/L · P0. |
| Kaldırılırsa kayıp | DLS'nin neden çalıştığı/bozulduğu deneylenemez. |

#### C — Gerçek C-space laboratuvarı

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

| Alan | Karar |
|---|---|
| Problem/kanıt | `c-universite-c-space` workspace x/y gridini θ1/θ2 diye hayal ettiriyor. |
| Hedef/neden | Üniversite; fiziksel engelin konfigürasyon engeline dönüşümü planlamanın çekirdeği. |
| Davranış/görünüm | Solda 2-link robot+engel, sağda periyodik θ1×θ2 occupancy; seçili açı/link teması ve C-cell birlikte vurgulanır. |
| Öğrenme | Workspace ≠ C-space; wrap-around, joint limit ve robot geometry etkisi. |
| Teknik | 2-DOF offline/worker raster; gerçek link–engel collision; derece ekseni; path playback. |
| Mobil/a11y/perf | İki görünüm tab; seçili hücre metni; düşük çözünürlük ve cache. |
| Risk | Yüksek boyutlu C-space'e genelleme; “2-DOF kesiti” etiketi. |
| Kabul | −180/180 komşuluğu, limit, obstacle mutation property test; playback collision 0; ikinci engelde transfer. |
| Etki/efor/öncelik | 5/5 · L · P1. |
| Kaldırılırsa kayıp | Öğrenci robot geometrisini planlama uzayına dönüştüremez. |

---

## 10. Mevcut müfredat ve boşluk analizi

### 10.1 Sayısal harita

| Hat | Yayında | Taslak | Toplam | Baskın etkileşim | Kod derinliği / gerçek kanıt | Karar |
|---|---:|---:|---:|---|---|---|
| A Temeller | 14 | 0 | 14 | 13 JointSliders, 1 IkTarget | Kod 0; başarı predicate 0 | Aynı seri kolu robot türü/frame/matris için kullanmayı bırak |
| B Kinematik | 14 | 0 | 14 | 5 Joint, 6 IK, 2 Jacobian, 1 sahnesiz | Kod 0; 5 pilot+MCQ, gerçek performans 0 | IK/FK/Jacobian/profile üç pilotunu düzelt |
| C Planlama | 11 | 0 | 11 | 11 PlannerRace | Kod 0; bir MCQ “transfer” | Seed, validity, clearance; C-space/PRM/smoothing ayrışsın |
| D Programlama | 0 | 11 | 11 | 5 CodeRunner, 2 BlockEditor, 4 sahnesiz | Hazır snippet; test/evidence yok | Üç dikey kod pilotu; toplu yayın yok |
| E Haberleşme | 0 | 10 | 10 | 7 SignalTimeline, 2 CodeRunner, 1 sahnesiz | İki snippet; state validation yok | Handshake state machine/timeout pilotu |
| F Algılama | 0 | 11 | 11 | 5 PixelToWorld, 3 ScanPath, 2 Threshold, 1 Signal | Kod 0; ground truth yok | Grid/model hatalarını düzelt, seeded ölçüm |
| G Simülasyon | 0 | 8 | 8 | Başka hatların sahneleri tekrar | Bir snippet; sim-to-real metriği yok | Fizik/model sapması olmadan ayrı hat diye yayınlama |
| H Güvenlik | 0 | 10 | 10 | 5 SafetyZone, 5 sahnesiz | Kod 0; uzman review 0 | Uzman review ve açık model varsayımları şart |

Seviye dağılımı:

| Seviye | A | B | C | D | E | F | G | H | Yayın/taslak |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ortaokul | 4Y | 3Y | 2Y | 2T | 2T | 2T | 1T | 2T | 9/9 |
| Lise | 5Y | 4Y | 3Y | 3T | 3T | 3T | 2T | 2T | 12/13 |
| Üniversite | 5Y | 7Y | 6Y | 6T | 5T | 6T | 5T | 6T | 18/28 |

### 10.2 Önkoşul, eylem, kod ve review özeti

- Önkoşul grafiği 89 düğümde döngüsüzdür; bu yapısal doğrulama öğrenme
  boşluğunun olmadığı anlamına gelmez.
- A-C'de önkoşullar okunabilir sıradadır; ama aynı bileşen farklı kazanımlar
  için tekrarlandığından öğrencinin fiilî eylemi değişmez.
- D-H taslakları “içerik var” diye ürün vaadine sayılamaz; insan review ve
  semantik E2E yoktur.
- 39 yayının kaynak dağılımı: 32 ders tek, 6 ders iki, 1 ders üç kaynaklı.
  Yapılandırılmış `url/version/accessedAt/claim` şeması yoktur.
- Tarih+Git geçmişi karşılaştırması **10 yayımlı dosyanın** son değişikliğinin
  review tarihinden sonra olduğunu gösterdi. Bunların altısı `ca7335a`, üçü
  evidence pilot commit'i, biri sonradan kaynak kodu linki değişikliğidir.
- `docs/durum-denetim.md` yalnız 9 yayının Mert tarafından gerçekten
  açılıp/okunduğunu, kalan 30'un otomasyon/AI denetimi sonrası toplu
  onaylandığını kaydeder. Frontmatter bu farkı kaybetmiştir.

### 10.3 Gerçek boşluk ile tekrar ayrımı

| Alan | Mevcut boşluk | Yeni ders mi? |
|---|---|---|
| Python temelleri | D'de mevcut taslaklar var, fakat testli öğrenme yok | **Hayır**; üç taslağı yeniden tasarla |
| NumPy ve dönüşümler | Matris dersleri ile çalışan kod arasında kopukluk | **Evet, tek pilot lab** |
| FK/IK/Jacobian | İçerik var, etkileşim yanlış/eksik | **Hayır**; mevcut dersleri düzelt |
| A*/RRT | Motor ve ders var; seed/validation/debug eksik | **Hayır**; mevcut labı geliştir |
| PID/hareket kontrolü | Müfredatta gerçek sistem bileşeni eksik | **Evet, learning kernel sonrası tek pilot** |
| Sensör filtreleme | Eşik var; zaman serisi/gürültü/RMSE yok | **Evet, lise→üniversite köprü pilotu** |
| OpenCV | F taslakları var; runtime ve görev testi yok | Yeni konu ekleme; küçük array pilotundan sonra değerlendir |
| ROS 2 | Statik taslak var; rclpy çalışmıyor | Yeni ders değil; açık “semantik harness” olarak yeniden tasarla |
| PLC–robot handshake | E taslakları ve timeline var; state doğrulamıyor | Yeni ders değil; timeout/illegal transition ekle |
| RAPID/KRL/FANUC/Mecademic | D'de dört vendor taslağı var | `[BİRLEŞTİR/KALDIR]`; ortak MoveIntent adapter |
| Test/logging/debug | Tüm kod derslerinde yatay eksik | Ayrı hat değil; her labın zorunlu katmanı |

### 10.4 Ders-bazlı zorunlu müfredat haritası — 89/89

`[KANIT + YORUM]` Bu envanter 89 MDX frontmatter'ı, gövdedeki deney
etiketleri ve gerçek component evidence çağrılarından türetildi. Böylece her ders
için seviye/hat, ana kazanım, önkoşul, kullanılan etkileşim, öğrencinin fiilî
eylemi, kod derinliği, bugünkü başarı kanıtı, kaynak/review durumu ve baskın açık
aynı satırda görünür. Ana kazanım hücresi ilk kazanımı yazar; `(+n)` aynı
dosyadaki ek kazanım sayısıdır. Bu tablo claim-level teknik review değildir;
özellikle 50 taslak için yayın kararı vermez.

Her satırın `A-*`/`G-*` kodu Bölüm 9.2'deki kontrol→observable→yanlış
model→success→feedback→transfer aile sözleşmesine bağlanır; böylece aynı widget'ı
kullanan 13 dersin eksikliği 13 kez farklıymış gibi yorumlanmaz. Özel `M-*`
kodları ise ders kazanımı ile sahne arasındaki doğrudan uyuşmazlıktır.

Kısaltmalar:

- Seviye/durum: `O/L/U` ortaokul/lise/üniversite; `Y/T` yayın/taslak.
- Eylem: `A-JS` eklem sürgüsü→poz/iz; `A-IK` hedef+dirsek→IK pozu;
  `A-JAC` q sürgüsü→J/elips; `A-PLAN` engel+algoritma→rota/metrik;
  `A-CODE` kodu değiştir/çalıştır→çıktı/poz; `A-BLOCK` blok diz→son poz;
  `A-SIGNAL` bit+playhead→timeline; `A-PIXEL` piksel+ölçek→dünya noktası;
  `A-THRESH` eşik→tespit sayısı; `A-SCAN` satır sayısı→tarama/coverage;
  `A-SAFE` mesafe+hız+fren→izinli hız; `A-READ` okuma/quiz.
- Kanıt hücresi yalnız başarı/performance iddiasını etkileyen olayları listeler:
  `EP` tahmin kaydı; `EO` tried/observed etkinlik kaydı, performans predicate'i
  değil; `EX` transfer MCQ'sunun yanlış biçimde `passed` yazması; `E0` başarı
  kanıtı yok. 39 yayının 34'ündeki normal `Quiz` retrieval olayı başarı kanıtı
  olmadığı için satırlarda tekrarlanmadı.
- Kaynak/review: `nK` kaynak sayısı; `ST` review tarihinden sonra değişmiş;
  `MR` tarih/ad metadatası var fakat hash receipt yok; `DR` taslak.
- Aile açıkları: `G-JS` hedef/tolerans/transfer yok ve tekrar; `G-IK`
  residual/iterasyon/transfer yok; `G-JAC` q̇→v/rank görevi yok; `G-PLAN`
  seed/clearance/validity/transfer eksik; `G-CODE` timeout/trace/test/evidence
  yok; `G-BLOCK` aktif blok+iki seed yok; `G-SIGNAL` state/timeout/jitter
  doğrulaması yok; `G-PIXEL` kamera ground truth/residual yok; `G-THRESH`
  etiketli truth/FP/FN yok; `G-SCAN` yüzey değişiyor/coverage sahte;
  `G-SAFE` varsayım+safety review+transfer yok; `G-NONE` fiilî
  deney/success/transfer yok.
- Kanıtlı özel uyuşmazlıklar: `M-ROBOT-TYPE` tek generic kol; `M-FRAME`
  frame görünmüyor; `M-MATRIX` 4×4 görünmüyor; `M-DLS` analitik solver;
  `M-TRAJ` x/v/a-zaman yok; `M-PROFILE` deney yok; `M-MOVE` yol modu yok;
  `M-TARGET` anlatılan hedef yok; `M-ASTAR` g/h/f-frontier yok;
  `M-CSPACE` workspace gösteriliyor; `M-PRM` PRM yok/RRT* maliyet riski;
  `M-SMOOTH` smoothing motoru yok. Bu özel kodlar Bölüm 9.3'teki ayrıntılı
  kararlara bağlanır.


#### A — Temeller (14 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `a-ortaokul-robot-nedir` | O/Y | Bir robotu basit bir makineden ayıran temel özellikleri (algılama, karar, hareket) sayabilme (+1) | - | JointSliders / A-JS | 0 | EO | 1K-ST | G-JS |
| `a-ortaokul-eksen-ne-demek` | O/Y | Bir eksenin bağımsız bir hareket yönü olduğunu açıklayabilme (+1) | a-ortaokul-robot-nedir | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-ortaokul-robot-turleri` | O/Y | Kol, mobil, insansı ve kartezyen robot türlerini birbirinden ayırt edebilme (+1) | a-ortaokul-eksen-ne-demek | JointSliders / A-JS | 0 | EO | 1K-MR | M-ROBOT-TYPE |
| `a-ortaokul-robot-ile-makine-farki` | O/Y | Programlanabilirlik ve çok eksenli hareketin robotu sıradan makineden ayıran özellikler olduğunu açıklayabilme (+1) | a-ortaokul-robot-turleri | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-lise-serbestlik-derecesi` | L/Y | Serbestlik derecesini (DOF) bağımsız hareket sayısı olarak tanımlayabilme (+1) | a-ortaokul-robot-ile-makine-farki | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-lise-koordinat-sistemleri` | L/Y | Dünya, taban ve alet koordinat sistemlerini birbirinden ayırt edebilme (+1) | a-lise-serbestlik-derecesi | JointSliders / A-JS | 0 | EO | 2K-ST | M-FRAME |
| `a-lise-doner-dogrusal-eklemler` | L/Y | Döner ve doğrusal eklem arasındaki hareket farkını açıklayabilme (+1) | a-lise-koordinat-sistemleri | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-lise-tcp-kavrami` | L/Y | TCP'nin (tool center point) robotun son ekleminden farklı bir nokta olabileceğini açıklayabilme (+1) | a-lise-doner-dogrusal-eklemler | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-lise-calisma-uzayi` | L/Y | Çalışma uzayının bir robotun TCP'sinin ulaşabildiği tüm noktaların kümesi olduğunu açıklayabilme (+1) | a-lise-tcp-kavrami, b-ortaokul-erisemedigi-noktalar | IkTarget / A-IK | 0 | EO | 1K-MR | G-IK |
| `a-universite-kinematik-zincir` | U/Y | Kinematik zinciri, katı cisimleri birbirine bağlayan eklemler dizisi olarak tanımlayabilme (+1) | a-lise-calisma-uzayi | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `a-universite-homojen-donusum` | U/Y | Bir katı cismin pozunu (konum + yönelim) tek bir 4x4 matriste birleştirmenin nedenini açıklayabilme (+1) | a-universite-kinematik-zincir | JointSliders / A-JS | snippet | EO | 1K-MR | M-MATRIX |
| `a-universite-dh-parametreleri` | U/Y | DH'nin dört parametresini (a, alpha, d, theta) fiziksel anlamlarıyla tanımlayabilme (+1) | a-universite-homojen-donusum | JointSliders / A-JS | 0 | EO | 2K-MR | G-JS |
| `a-universite-robot-mimarileri` | U/Y | Beş yaygın robot mimarisini kinematik yapılarına göre ayırt edebilme (+1) | a-universite-dh-parametreleri | JointSliders / A-JS | 0 | EO | 2K-MR | M-ROBOT-TYPE |
| `a-universite-poz-gosterimleri` | U/Y | Üç yönelim gösteriminin (Euler açıları, kuaterniyon, dönme matrisi) sayı sayısı ve zayıf noktalarını karşılaştırabilme (+1) | a-universite-robot-mimarileri | JointSliders / A-JS | 0 | EO | 2K-MR | G-JS |

#### B — Kinematik (14 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `b-ortaokul-eklemleri-oynat` | O/Y | Bir robot kolunun eklemlerini oynatınca uç noktanın nasıl hareket ettiğini gözlemleyebilme (+1) | - | JointSliders+PredictionPrompt+TransferChallenge / A-JS | 0 | EP+EO+EX | 1K-ST | M-TARGET |
| `b-ortaokul-birden-fazla-yol` | O/Y | Aynı hedefe farklı eklem kombinasyonlarıyla ulaşılabileceğini gözlemleyebilme (+1) | b-ortaokul-eklemleri-oynat | IkTarget+PredictionPrompt+TransferChallenge / A-IK | 0 | EP+EO+EX | 1K-ST | G-IK |
| `b-ortaokul-erisemedigi-noktalar` | O/Y | Bir robot kolunun erişebildiği alanın sınırlı olduğunu gözlemleyebilme (+1) | b-ortaokul-birden-fazla-yol | IkTarget / A-IK | 0 | EO | 1K-MR | G-IK |
| `b-lise-ileri-kinematik` | L/Y | Eklem açılarından uç nokta konumunu trigonometri ile hesaplayabilme (+1) | b-ortaokul-eklemleri-oynat | JointSliders+PredictionPrompt+TransferChallenge / A-JS | snippet | EP+EO+EX | 1K-ST | G-JS |
| `b-lise-geometrik-ters-kinematik` | L/Y | Kosinüs teoremiyle iki eklemli bir kolun ters kinematiğini hesaplayabilme (+1) | b-lise-ileri-kinematik, b-ortaokul-birden-fazla-yol | IkTarget+PredictionPrompt+TransferChallenge / A-IK | snippet | EP+EO+EX | 1K-ST | G-IK |
| `b-lise-aci-birimleri` | L/Y | Radyan ve derece arasında dönüşüm yapabilme (+1) | b-lise-ileri-kinematik | JointSliders / A-JS | snippet | EO | 1K-MR | G-JS |
| `b-lise-eklem-limitleri` | L/Y | Eklem limitlerinin mekanik ve elektriksel nedenlerini açıklayabilme (+1) | b-lise-ileri-kinematik | JointSliders / A-JS | 0 | EO | 1K-MR | G-JS |
| `b-universite-dh-ileri-kinematik` | U/Y | Denavit-Hartenberg (DH) parametrelerinden homojen dönüşüm matrisini kurabilme (+2) | b-lise-ileri-kinematik | JointSliders / A-JS | snippet | EO | 1K-MR | G-JS |
| `b-universite-ters-kinematik` | U/Y | Genel bir robotun neden çoğunlukla kapalı form ters kinematik çözümü olmadığını açıklayabilme (+1) | b-universite-dh-ileri-kinematik, b-lise-geometrik-ters-kinematik | IkTarget / A-IK | snippet | EO | 1K-ST | M-DLS |
| `b-universite-jacobian` | U/Y | Geometrik Jacobian'ın sütunlarını eklem eksenlerinden kurabilme (+1) | b-universite-dh-ileri-kinematik | JacobianViz+PredictionPrompt+TransferChallenge / A-JAC | snippet | EP+EO+EX | 1K-ST | G-JAC |
| `b-universite-tekillik` | U/Y | Tekilliği Jacobian'ın rank kaybı olarak tanımlayabilme (+2) | b-universite-jacobian | JacobianViz / A-JAC | snippet | EO | 1K-MR | G-JAC |
| `b-universite-yorunge-uretimi` | U/Y | Eklem uzayı ve Kartezyen uzay yörünge üretimi arasındaki farkı açıklayabilme (+1) | b-universite-ters-kinematik | IkTarget / A-IK | snippet | EO | 1K-MR | M-TRAJ |
| `b-universite-hiz-ivme-profilleri` | U/Y | Yamuk hız profilinin üç aşamasını (hızlanma, sabit hız, yavaşlama) açıklayabilme (+1) | b-universite-yorunge-uretimi | - / A-READ | snippet | E0 | 1K-MR | M-PROFILE |
| `b-universite-movej-movel` | U/Y | MoveJ ve MoveL komutlarının hangi uzayda interpolasyon yaptığını ayırt edebilme (+1) | b-universite-yorunge-uretimi | IkTarget / A-IK | 0 | EO | 1K-MR | M-MOVE |

#### C — Planlama (11 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `c-ortaokul-labirentte-yol-bulma` | O/Y | Bir robotun engellerle dolu bir alanda hedefe giden bir yol aradığını gözlemleyebilme (+1) | - | PlannerRace / A-PLAN | 0 | EO | 1K-ST | G-PLAN |
| `c-ortaokul-en-kisa-yol-her-zaman-en-iyi-mi` | O/Y | En kısa yolu bulmakla en hızlı hesaplanan yolu bulmak arasındaki farkı fark edebilme (+1) | c-ortaokul-labirentte-yol-bulma | PlannerRace / A-PLAN | 0 | EO | 1K-MR | G-PLAN |
| `c-lise-grid-arama-maliyet` | L/Y | Sürekli bir alanın nasıl bir ızgaraya (grid) bölündüğünü açıklayabilme (+1) | c-ortaokul-en-kisa-yol-her-zaman-en-iyi-mi | PlannerRace / A-PLAN | snippet | EO | 1K-MR | G-PLAN |
| `c-lise-a-yildiz-sezgisel` | L/Y | A*'ın hangi hücreleri önce keşfedeceğine nasıl karar verdiğini açıklayabilme (+1) | c-lise-grid-arama-maliyet | PlannerRace / A-PLAN | snippet | EO | 1K-MR | M-ASTAR |
| `c-lise-engelden-kacinma` | L/Y | Bir hücrenin "engelli" sayılması için hangi kontrolün yapıldığını açıklayabilme (+1) | c-lise-a-yildiz-sezgisel | PlannerRace / A-PLAN | 0 | EO | 1K-MR | G-PLAN |
| `c-universite-c-space` | U/Y | İş uzayı (workspace) ile konfigürasyon uzayı (C-space) arasındaki farkı açıklayabilme (+1) | c-lise-engelden-kacinma | PlannerRace / A-PLAN | 0 | EO | 2K-MR | M-CSPACE |
| `c-universite-carpisma-kontrolu` | U/Y | Nokta ve segment çarpışma testleri arasındaki farkı açıklayabilme (+1) | c-universite-c-space | PlannerRace / A-PLAN | snippet | EO | 1K-MR | G-PLAN |
| `c-universite-rrt-rrt-star-prm` | U/Y | RRT'nin rastgele ağaç genişletmesinin nasıl çalıştığını açıklayabilme (+2) | c-universite-carpisma-kontrolu | PlannerRace / A-PLAN | 0 | EO | 3K-MR | M-PRM |
| `c-universite-optimallik-hiz-odunlesimi` | U/Y | Tam (complete), optimal ve asimptotik optimal terimlerini planlama bağlamında ayırt edebilme (+1) | c-universite-rrt-rrt-star-prm | PlannerRace / A-PLAN | 0 | EO | 2K-MR | G-PLAN |
| `c-universite-algoritma-karsilastirma-deneyi` | U/Y | Farklı engel yoğunluklarında algoritma performansını deneysel olarak ölçebilme (+1) | c-universite-optimallik-hiz-odunlesimi | PlannerRace+PredictionPrompt+TransferChallenge / A-PLAN | 0 | EP+EO+EX | 1K-ST | G-PLAN |
| `c-universite-yol-duzlestirme` | U/Y | RRT ailesinin ürettiği yolların neden doğası gereği zikzaklı olduğunu açıklayabilme (+1) | c-universite-algoritma-karsilastirma-deneyi | PlannerRace / A-PLAN | 0 | EO | 1K-MR | M-SMOOTH |

#### D — Programlama (11 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `d-ortaokul-blok-komutlar` | O/T | Bir robotu blok tabanlı komutlarla, hiç yazı yazmadan, sırayla hareket ettirebilme (+1) | b-ortaokul-eklemleri-oynat | BlockEditor / A-BLOCK | blok | E0-DRAFT | 1K-DR | G-BLOCK |
| `d-ortaokul-sirali-tekrar-kosul` | O/T | Tekrarla bloğuyla bir hareket grubunu birden çok kez tekrar ettirebilme (+2) | d-ortaokul-blok-komutlar | BlockEditor / A-BLOCK | blok | E0-DRAFT | 1K-DR | G-BLOCK |
| `d-lise-python-komut-dizisi` | L/T | Bir robotu sıralı Python komutlarıyla hareket ettirebilme (+1) | a-lise-doner-dogrusal-eklemler | CodeRunner / A-CODE | Python | E0-DRAFT | 1K-DR | G-CODE |
| `d-lise-hareket-komutlari` | L/T | `eklem_ac` (açı vererek) ile `hedefe_git` (nokta vererek) hareket ettirme arasındaki farkı ayırt edebilme (+2) | d-lise-python-komut-dizisi, b-lise-geometrik-ters-kinematik | CodeRunner / A-CODE | Python | E0-DRAFT | 2K-DR | G-CODE |
| `d-lise-koordinat-hiz-bekleme` | L/T | Bir hareket komutunda koordinatla birlikte hız ve bekleme süresinin de tanımlanabildiğini açıklayabilme (+2) | d-lise-hareket-komutlari | CodeRunner / A-CODE | Python | E0-DRAFT | 1K-DR | G-CODE |
| `d-universite-abb-rapid` | U/T | Bir RAPID modülünün temel yapısını (MODULE, PROC main) okuyabilme (+2) | b-universite-movej-movel | - / A-READ | snippet | E0-DRAFT | 1K-DR | G-NONE |
| `d-universite-kuka-krl` | U/T | KRL programlarının neden iki ayrı dosyaya (.src ve .dat) bölündüğünü açıklayabilme (+2) | d-universite-abb-rapid | - / A-READ | snippet | E0-DRAFT | 1K-DR | G-NONE |
| `d-universite-mecademic-python` | U/T | Mecademic robotlarının kendi bir programlama diline sahip olmadığını, düz metin (ASCII) komutları TCP/IP üzerinden aldığını açıklayabilme (+2) | d-lise-python-komut-dizisi, d-universite-abb-rapid | CodeRunner / A-CODE | Python | E0-DRAFT | 1K-DR | G-CODE |
| `d-universite-fanuc-karsilastirma` | U/T | FANUC TP programlarının satır numaralı, teach-pendant merkezli yapısını diğer üç yaklaşımdan ayırt edebilme (+1) | d-universite-abb-rapid, d-universite-kuka-krl, d-universite-mecademic-python | - / A-READ | snippet | E0-DRAFT | 1K-DR | G-NONE |
| `d-universite-offline-programlama` | U/T | Çevrim dışı programlamanın (OLP) çevrim içi (online, teach pendant üzerinde) programlamadan farkını açıklayabilme (+2) | d-universite-fanuc-karsilastirma | CodeRunner / A-CODE | Python | E0-DRAFT | 2K-DR | G-CODE |
| `d-universite-ros2-temelleri` | U/T | ROS 2'de düğüm (node) kavramını ve bir düğümün diğer düğümlerle nasıl haberleştiğini açıklayabilme (+2) | d-universite-offline-programlama | - / A-READ | snippet | E0-DRAFT | 3K-DR | G-NONE |

#### E — Haberleşme (10 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `e-ortaokul-makineler-nasil-konusur` | O/T | Makineler arasındaki "konuşmanın" kelime değil, açılıp kapanan bir sinyalle olduğunu açıklayabilme (+1) | - | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 1K-DR | G-SIGNAL |
| `e-ortaokul-sinyal-var-yok` | O/T | İki makinenin kendi sinyalini birbirinden bağımsız açıp kapatabildiğini gözlemleyebilme (+1) | e-ortaokul-makineler-nasil-konusur | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 1K-DR | G-SIGNAL |
| `e-lise-dijital-giris-cikis` | L/T | Dijital bir giriş ve çıkış sinyalinin sadece iki durumdan (açık/kapalı, 1/0) oluştuğunu açıklayabilme (+2) | e-ortaokul-sinyal-var-yok | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 3K-DR | G-SIGNAL |
| `e-lise-el-sikisma` | L/T | El sıkışma (handshake) protokolünde iki sinyalin hangi sırayla ilerlediğini açıklayabilme (+2) | e-lise-dijital-giris-cikis | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 2K-DR | G-SIGNAL |
| `e-lise-zamanlama-neden-onemli` | L/T | El sıkışma sırasının bozulmasının (ör. erken gelen "başla" sinyali) neden bir senkronizasyon hatasına yol açtığını açıklayabilme (+2) | e-lise-el-sikisma | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 2K-DR | G-SIGNAL |
| `e-universite-tcpip-soket` | U/T | TCP soketinde istemci-sunucu (client-server) modelinin temel adımlarını (connect, send, recv) açıklayabilme (+2) | e-lise-el-sikisma | CodeRunner / A-CODE | Python | E0-DRAFT | 2K-DR | G-CODE |
| `e-universite-endustriyel-protokoller` | U/T | EtherCAT, PROFINET ve EtherNet/IP'nin ortak noktasını (standart Ethernet donanımı üzerine kurulu olmaları) ve temel farkını (gerçek zamanlılığı nasıl sağladıkları) açıklayabilme (+2) | e-universite-tcpip-soket | - / A-READ | 0 | E0-DRAFT | 3K-DR | G-NONE |
| `e-universite-cycle-time-jitter` | U/T | 'Gerçek zamanlı' (real-time) teriminin 'hızlı' değil 'zaman garantili' anlamına geldiğini açıklayabilme (+2) | e-universite-endustriyel-protokoller | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 3K-DR | G-SIGNAL |
| `e-universite-plc-master-slave` | U/T | Bir PLC-robot hücresinde hangi tarafın (genelde PLC) döngüyü/veri alışverişini başlattığını, hangi tarafın (robot kontrolörü) buna yanıt verdiğini açıklayabilme (+2) | e-universite-cycle-time-jitter | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 2K-DR | G-SIGNAL |
| `e-universite-hata-durumlari` | U/T | Zaman aşımı (timeout), bağlantı kopması (connection loss) ve güvenli durma (safe stop) kavramlarını ayırt edebilme (+2) | e-universite-plc-master-slave | CodeRunner / A-CODE | Python | E0-DRAFT | 2K-DR | G-CODE |

#### F — Algılama (11 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `f-ortaokul-robot-nasil-gorur` | O/T | Robotların çevresini algılamak için kamera, mesafe sensörü (ör. ultrasonik) ve ışık huzmesi (fotoelektrik) sensörü gibi farklı araçlar kullandığını örnekleyebilme (+1) | - | PixelToWorld / A-PIXEL | 0 | E0-DRAFT | 3K-DR | G-PIXEL |
| `f-ortaokul-goz-olmadan-is-yapmak` | O/T | Sadece "var/yok" ya da "ne kadar uzakta" bilgisi veren bir sensörün, bir nesnenin tam konumunu ve yönünü söyleyemeyeceğini açıklayabilme (+1) | f-ortaokul-robot-nasil-gorur | SignalTimeline / A-SIGNAL | 0 | E0-DRAFT | 2K-DR | G-SIGNAL |
| `f-lise-piksel-milimetre` | L/T | Bir piksel konumunu, verilen bir ölçekleme oranıyla (mm/piksel) gerçek dünya konumuna çevirebilme (+2) | - | PixelToWorld / A-PIXEL | 0 | E0-DRAFT | 2K-DR | G-PIXEL |
| `f-lise-esikleme-nesne-bulma` | L/T | Bir görüntüdeki parlaklık değerlerine eşik uygulayarak nesneyi arka plandan ayırabilme (+2) | f-lise-piksel-milimetre | ThresholdViewer / A-THRESH | 0 | E0-DRAFT | 2K-DR | G-THRESH |
| `f-lise-olcek-perspektif-hatasi` | L/T | Aynı piksel-milimetre kalibrasyonunun görüntünün her noktasında aynı doğrulukla geçerli olmayabileceğini fark edebilme (+2) | f-lise-piksel-milimetre | PixelToWorld / A-PIXEL | 0 | E0-DRAFT | 2K-DR | G-PIXEL |
| `f-universite-kamera-kalibrasyonu` | U/T | Pinhole kamera modelindeki iç parametrelerin (odak uzaklığı fx/fy, optik merkez cx/cy) ve distorsiyon katsayılarının anlamını açıklayabilme (+3) | f-lise-olcek-perspektif-hatasi | PixelToWorld / A-PIXEL | snippet | E0-DRAFT | 2K-DR | G-PIXEL |
| `f-universite-el-goz-kalibrasyonu` | U/T | Göz-içi-el (eye-in-hand) ve göz-elde-sabit (eye-to-hand) montaj biçimlerini ayırt edebilme (+2) | f-universite-kamera-kalibrasyonu | PixelToWorld / A-PIXEL | snippet | E0-DRAFT | 2K-DR | G-PIXEL |
| `f-universite-lazer-profil-sensoru` | U/T | Lazer üçgenleme (triangulation) düzeneğinin temel bileşenlerini (lazer kaynağı, hedef yüzey, açılı konumlanmış detektör) tanımlayabilme (+2) | f-lise-piksel-milimetre | ScanPath / A-SCAN | snippet | E0-DRAFT | 2K-DR | G-SCAN |
| `f-universite-nokta-bulutu-yuzey-muayenesi` | U/T | Ardışık profil taramalarının birleşiminden bir nokta bulutunun nasıl oluştuğunu açıklayabilme (+2) | f-universite-lazer-profil-sensoru | ScanPath / A-SCAN | 0 | E0-DRAFT | 2K-DR | G-SCAN |
| `f-universite-tarama-yolu-uretimi` | U/T | Boustrophedon (gidip-gelen) tarama deseninin mantığını açıklayabilme (+2) | f-universite-lazer-profil-sensoru | ScanPath / A-SCAN | snippet | E0-DRAFT | 2K-DR | G-SCAN |
| `f-universite-olcum-belirsizligi-tekrarlanabilirlik` | U/T | Ölçüm belirsizliği (uncertainty) ile tekrarlanabilirlik (repeatability) arasındaki kavramsal farkı, doğruluk (trueness) kavramıyla karşılaştırarak açıklayabilme (+2) | f-universite-kamera-kalibrasyonu | ThresholdViewer / A-THRESH | snippet | E0-DRAFT | 2K-DR | G-THRESH |

#### G — Simülasyon (8 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `g-ortaokul-simulasyon-nedir` | O/T | Bir simülasyonun gerçek robotun kopyası olduğunu ve sonuçlarının gerçek bir bedeli olmadığını fark edebilme (+1) | - | JointSliders / A-JS | 0 | E0-DRAFT | 2K-DR | G-JS |
| `g-lise-basit-sahne-kurma` | L/T | Bir simülasyon sahnesinin robot, sabit nesneler (ör. masa) ve bir hedeften oluştuğunu açıklayabilme (+1) | g-ortaokul-simulasyon-nedir | PlannerRace / A-PLAN | 0 | E0-DRAFT | 1K-DR | G-PLAN |
| `g-lise-deneme-yanilma-maliyeti` | L/T | Simülasyonda tekrarlanan bir denemenin maliyetiyle gerçek bir robotta aynı denemenin maliyetini karşılaştırabilme (+1) | g-lise-basit-sahne-kurma | IkTarget / A-IK | 0 | E0-DRAFT | 2K-DR | G-IK |
| `g-universite-urdf-modelleme` | U/T | URDF'nin bir robotu link (bağlantı) ve joint (eklem) ağacı olarak nasıl tanımladığını açıklayabilme (+2) | a-universite-dh-parametreleri | JointSliders / A-JS | 0 | E0-DRAFT | 3K-DR | G-JS |
| `g-universite-pybullet-sahne-fizik` | U/T | PyBullet'in bir fizik motoru olarak neyi simüle ettiğini (katı cisim dinamiği, çarpışma, yerçekimi) tanımlayabilme (+2) | g-universite-urdf-modelleme | PlannerRace / A-PLAN | snippet | E0-DRAFT | 2K-DR | G-PLAN |
| `g-universite-dijital-ikiz` | U/T | 'Dijital ikiz' teriminin endüstride ne anlama geldiğini (fiziksel sistemle sürekli senkronize sanal kopya) tanımlayabilme (+1) | g-universite-pybullet-sahne-fizik | IkTarget / A-IK | 0 | E0-DRAFT | 1K-DR | G-IK |
| `g-universite-sim-to-real-farki` | U/T | Sim-to-real farkının (sim-to-real gap) hangi fiziksel etkenlerden kaynaklandığını sayabilme (+1) | g-universite-dijital-ikiz | JacobianViz / A-JAC | 0 | E0-DRAFT | 2K-DR | G-JAC |
| `g-universite-cevrimdisi-programin-dogrulanmasi` | U/T | Çevrim dışı programlamanın (offline programming, OLP) doğrudan robota yükleme yerine neden önce simülasyonda doğrulama gerektirdiğini açıklayabilme (+1) | g-universite-sim-to-real-farki | CodeRunner / A-CODE | Python | E0-DRAFT | 1K-DR | G-CODE |

#### H — Güvenlik (10 ders)

| Ders | Seviye/durum | Ana kazanım (ilk; ek sayısı) | Önkoşul | Etkileşim / fiilî eylem | Kod | Bugünkü kanıt | Kaynak/review | Açık/karar |
|---|---|---|---|---|---|---|---|---|
| `h-ortaokul-robotlar-neden-tehlikeli` | O/T | Bir endüstriyel robotun güçlü ve hızlı olmasının neden başlı başına bir tehlike kaynağı olduğunu açıklayabilme (+1) | - | SafetyZone / A-SAFE | 0 | E0-DRAFT | 2K-DR | G-SAFE |
| `h-ortaokul-temel-guvenlik-kurallari` | O/T | Bir robot hücresinin yanında uyulması gereken temel davranış kurallarını sıralayabilme (+1) | h-ortaokul-robotlar-neden-tehlikeli | - / A-READ | 0 | E0-DRAFT | 2K-DR | G-NONE |
| `h-lise-kafesli-robot-ve-kobot` | L/T | Kafesle ayırma ile işbirlikçi çalışma arasındaki temel güvenlik yaklaşımı farkını açıklayabilme (+2) | h-ortaokul-temel-guvenlik-kurallari | SafetyZone / A-SAFE | 0 | E0-DRAFT | 3K-DR | G-SAFE |
| `h-lise-acil-durdurma-ve-guvenli-bolge` | L/T | Acil durdurma ile koruyucu durdurma (protective stop) arasındaki amaç farkını açıklayabilme (+2) | h-lise-kafesli-robot-ve-kobot | SafetyZone / A-SAFE | 0 | E0-DRAFT | 3K-DR | G-SAFE |
| `h-universite-iso-10218-ve-ts-15066` | U/T | ISO 10218-1 ile ISO 10218-2'nin farklı muhatapları (üretici / entegratör) olduğunu açıklayabilme (+2) | h-lise-acil-durdurma-ve-guvenli-bolge | - / A-READ | 0 | E0-DRAFT | 4K-DR | G-NONE |
| `h-universite-risk-degerlendirmesi` | U/T | ISO 12100'ün risk değerlendirmesi adımlarını (tehlike tanımlama, risk kestirimi, risk değerlendirme) sırasıyla açıklayabilme (+2) | h-universite-iso-10218-ve-ts-15066 | - / A-READ | 0 | E0-DRAFT | 3K-DR | G-NONE |
| `h-universite-performans-seviyesi-ve-kategori` | U/T | Performans seviyesi (PL) ile kategorinin (Category) farklı şeyleri ölçtüğünü açıklayabilme (+2) | h-universite-risk-degerlendirmesi | - / A-READ | 0 | E0-DRAFT | 4K-DR | G-NONE |
| `h-universite-guc-ve-kuvvet-sinirlama` | U/T | Güç ve kuvvet sınırlamanın diğer işbirlikçi çalışma biçimlerinden farkını (temasa izin vermesi) açıklayabilme (+2) | h-universite-iso-10218-ve-ts-15066 | - / A-READ | 0 | E0-DRAFT | 3K-DR | G-NONE |
| `h-universite-guvenli-durus-hiz-ve-mesafe` | U/T | Güvenlik dereceli izlemeli duruşun sıradan bir duraklatmadan farkını açıklayabilme (+2) | h-universite-guc-ve-kuvvet-sinirlama | SafetyZone / A-SAFE | 0 | E0-DRAFT | 3K-DR | G-SAFE |
| `h-universite-guvenli-hucre-tasarimi` | U/T | Bir robot hücresinin güvenlik tasarımını, tek tek önlemler yerine bir sıralı süreç olarak kurgulayabilme (+2) | h-universite-risk-degerlendirmesi, h-universite-guvenli-durus-hiz-ve-mesafe | SafetyZone / A-SAFE | 0 | E0-DRAFT | 4K-DR | G-SAFE |


---

## 11. Kontrollü yeni içerik planı

Yeni ders yalnız gerçek önkoşul/sistem boşluğunu kapatıyorsa açılır. Aşağıdaki
üçü kontrollü adaydır; aynı anda “ilk dalga” değildir. **P1'de yalnız N1**, Bölüm
13'teki Lab 4 ile aynı eser olarak; mevcut taslaklardan Lab 1 ve Lab 2 yanında
pilotlanır. N1 kapısı geçerse N2, sonra N3 birer **P2** genişletme olarak açılır.
Mevcut 50 taslak topluca yayımlanmaz.

### 11.1 Pilot N1 — NumPy ile koordinat dönüşüm zinciri

`[YENİ] [BU DENETİMDE YENİ]`

| Alan | Tanım |
|---|---|
| Kapatacağı boşluk | Homojen dönüşüm anlatısı ile çalışan robotik Python arasında köprü yok. |
| Hedef/ana kazanım | Üniversite, 25 dk; “base→tool noktasını doğru çarpım sırası ve `1e-9` toleransla dönüştürür.” |
| Önkoşul | Homojen dönüşüm, Python fonksiyon/listesi; NumPy array giriş mikro ön çalışması. |
| Öğrenci görevi | `rotz`, `translation`, `compose` başlangıcındaki sıra hatasını düzelt; ikinci frame zincirine taşı. |
| Etkileşim/kod | Sahne+matris+kod aynı frame; küçük NumPy başlangıç kodu. |
| Success/kanıt | Identity, inverse round-trip, non-commutativity, shape/dtype testleri; transfer zinciri; run hash. |
| Kaynak/review | Modern Robotics Ch.3; kullanılan **runtime NumPy sürümü** ve erişim tarihi; teknik+pedagojik review. Web'deki güncel 2.5 otomatik olarak Pyodide sürümü kabul edilmez. |
| Efor/risk/bağımlılık | M; Pyodide cold start/offline boyutu; Code Lab Shell önce. |
| Bitti | Aynı seed/test sonucu; klavye+trace table; reference/alternatif çözüm; gerçek robot frame/calibration notu. |
| Kaldırılırsa kayıp | Öğrenci matris okur ama robotik hesap kodu üretemez. |

### 11.2 Pilot N2 — PID ve hareket kontrolü

`[YENİ] [BU DENETİMDE YENİ]`

| Alan | Tanım |
|---|---|
| Kapatacağı boşluk | Kinematikten hareket kontrolüne geçiş yok; gerçek robotik sistem bileşeni eksik. |
| Hedef/ana kazanım | Lise üstü/üniversite, 25–30 dk; “Kp/Ki/Kd'yi değiştirip overshoot `<10%`, settling `<2 s`, actuator limit ihlali 0 sağlar.” |
| Önkoşul | Grafik, hız/ivme, basit Python; önce profil dersi düzeltilmeli. |
| Öğrenci görevi | Aynı deterministic plantte önce P, sonra PI/PID; wind-up karşı örneğini teşhis et. |
| Etkileşim/kod | Setpoint, hata, kontrol çıkışı ve robot pozunu senkron grafik+sahne; küçük update fonksiyonu. |
| Success/kanıt | Overshoot `<10%`; ±%2 settling bandına `<2 s`; saturation ihlali 0; ikinci yük seed'i hidden transfer testi. |
| Kaynak/review | Modern Robotics Ch.11 + Åström/Murray [Feedback Systems](https://fbsbook.org/); plant varsayımı açık; kontrol+robotik+pedagojik+safety dil review'u bekliyor. Gerçek robota kazanç gönderme talimatı yok. |
| Efor/risk/bağımlılık | L; sayısal integrasyon/property test ve güvenlik dili. |
| Bitti | Setpoint, plant katsayıları, `dt`, süre ve actuator saturation sayıları `LabSpec` fixture'ında pinli; stable/unstable ve anti-windup sınır durumu; testli reference ve alternatif tuning. Bu değerler henüz seçilmedi `[DOĞRULANAMADI — yayın engeli]`. |
| Kaldırılırsa kayıp | Öğrenci hareket geometrisi ile geri beslemeli davranış arasındaki farkı uygulayamaz. |

### 11.3 Pilot N3 — Seed'li sensör filtreleme

`[YENİ] [BU DENETİMDE YENİ]`

| Alan | Tanım |
|---|---|
| Kapatacağı boşluk | F hattında eşik/görü var; gürültülü zaman serisi ve filtre trade-off'u yok. |
| Hedef/ana kazanım | Lise/üniversite köprüsü, 20 dk; “filtre penceresini seçip RMSE'yi azaltırken gerçek adım olayını kabul edilen gecikmede korur.” |
| Önkoşul | Ortalama, grafik, liste/fonksiyon; `ThresholdViewer` ground truth mantığı. |
| Öğrenci görevi | Hareketli ortalama/medyan parametresi; spike, bias ve step içeren seeded sinyalde yanlış filtreyi düzelt. |
| Etkileşim/kod | Raw/filtered/ground-truth grafik; pencere; küçük Python; gerçek olay işareti. |
| Success/kanıt | Filtre RMSE'si raw baseline'ın ≤%70'i; step algılama gecikmesi ≤3 sample; spike/step iki hidden seed; run/seed/test. |
| Kaynak/review | DSP/robot sensor kaynağı henüz seçilmedi `[DOĞRULANAMADI — yayın engeli]`; seçilen baskı/bölüm+erişim kaydı ve sinyal işleme+robotik+pedagojik review zorunlu. |
| Efor/risk/bağımlılık | M; “daha düz her zaman iyi” yanılgısı ve metrik seçimi. |
| Bitti | Sample rate, seri uzunluğu, noise dağılımı, spike/step ground truth ve eşikler `LabSpec` fixture'ında pinli; aynı seed aynı sinyal; iki filtre karşılaştırması; gerçek sensörde sampling/calibration notu. Fixture değerleri henüz seçilmedi `[DOĞRULANAMADI — yayın engeli]`. |
| Kaldırılırsa kayıp | Öğrenci gürültü azaltma ile olay gecikmesi trade-off'unu ölçemez. |

### 11.4 Ölçekleme kapısı

Önce N1 en az 8 hedef kullanıcıyla test edilir: ≥%80 ipucusuz görünür temel
test, ≥%60 farklı koşul transfer testi, median ilk anlamlı run ≤3 dk, yanlış
“passed” 0. N2 ve N3 aynı kapıyı ayrı ayrı geçer; biri başarısızken diğeri sayı
artırmak için yayımlanmaz. Bu üç kontrollü genişleme doğrulanmadan OpenCV, yeni
vendor dilleri veya onlarca kontrol dersi eklenmez.

---

## 12. Kod öğretim mimarisi

### 12.1 Bugünkü teşhis

Yayında kod öğretimi yoktur. D taslaklarındaki CodeRunner/BlockEditor başlangıç
kodları çalışsa bile model çoğunlukla “snippet'i değiştir, stdout/son pozu gör,
quiz çöz”dür. Çalıştırma, öğretme değildir. Otomatik timeout/test, temiz
namespace, satır izi, sınır durum, progressive hint, reference/alternatif çözüm
ve evidence bağlantısı yoktur.

### 12.2 Zorunlu ilerleme

1. Kodu ve görsel sonucu gözle.
2. Çalıştırmadan çıktıyı tahmin et.
3. Satır/blok adımını izle.
4. Tek parametreyi değiştir.
5. Eksik satırı tamamla.
6. Bilerek bozuk kodu trace ile düzelt.
7. Küçük fonksiyon yaz.
8. Teknik şartnameden çözüm geliştir.
9. Görünür ve hidden otomatik testleri geçir.
10. Sınır durum ve performans metriğini değerlendir.
11. Farklı robotik probleme transfer et.

### 12.3 Üç seviyede yeniden tasarlanmış kod dersi

| Ders | Bugünkü sorun | Yeni davranış ve success | Yaş derinliği / kabul |
|---|---|---|---|
| Ortaokul `d-ortaokul-sirali-tekrar-kosul` | Blok dizmek; aktif blok/iki girdi testi yok | `repeat`+`if/else` ile engel açık/kapalı iki seed; aktif blok, sensör, iz; her iki final hedef+limit testi | Syntax az; iki koşul geçmeden pass yok; trace metin tablosu |
| Lise `d-lise-python-komut-dizisi` | Hazır kod/son poz; yürütme sırası öğrenilmiyor | Ara pozları tahmin et, satır adımla, aynı eklemi yanlış yazan satırı düzelt; üç ara+final otomatik testi | 6–8 satır Python; derece/radyan edge; ikinci hedef transferi |
| Üniversite `d-universite-ros2-temelleri` | rclpy tarayıcıda çalışmıyor; statik kod+quiz | Açıkça “ROS 2 semantik modeli”: node/topic/service/action, QoS, timeout, cancel timeline | Gerçek DDS/rclpy iddiası yok; distro/revizyon/erişim tarihi; 3 deterministik iletişim testi |

8 Ağustos 2026 itibarıyla ROS 2 **Lyrical Luth** on ikinci ve LTS sürüm
olarak Mayıs 2031'e dek destekleneceğini resmi release sayfasında belirtir.
İçerik tek distroya kilitlenmeli ve erişim tarihi görünmelidir; “latest” gibi
zamana bağlı kelime kaynak/veri olmadan yazılmamalıdır. Topic sürekli akış,
service kısa request/response, action uzun/iptal edilebilir iş için resmi
[ROS 2 Lyrical arayüz rehberi](https://docs.ros.org/en/lyrical/How-To-Guides/Topics-Services-Actions.html)
ile doğrulanır; semantik harness gerçek middleware değildir.

### 12.4 Teknik sözleşme

```text
LabSpec
  id, outcome, level, prerequisites, units, safetyNote
  starterFiles, editableRegions, deterministicSeed
  observableChannels: scene | matrix | graph | trace | stdout
  tests: visible[] | hidden[] | tolerance | edgeCase
  hints[], referenceSolution, alternativeSolutions[]
  transferMutators[], realRobotDifference
  sources[], technicalReview, pedagogicalReview, safetyReview
  contentHash, engineVersion

RunRecord
  labId, runId, contentHash, engineVersion, seed
  inputs, prediction, traceHash, metrics
  testResults, attempts, transferResult, createdAt
```

Teknik bileşenler:

1. **Taze worker oturumu:** her run temiz Python globals; 10 sn varsayılan
   timeout, terminate/retry; worker load/runtime hatası kullanıcıya görünür.
2. **Seed enjeksiyonu:** `random`, sensör noise ve planner RNG dışarıdan gelir;
   request ID'deki `Math.random` deney seed'i değildir.
3. **Trace protokolü:** `{step,line,variables,robotPose,metrics}`; yalnız final
   poz/print değil.
4. **Senkron lens:** sahne, matris, grafik ve kod aynı time index.
5. **Test motoru:** görünür temel+hidden edge/transfer; stdout eşleşmesi pass
   sayılmaz.
6. **Kademeli ipucu:** önce yön, sonra ilgili trace; çözüm denemeden önce yok.
7. **Evidence adapter:** `passed` yalnız test+transfer; quiz `checked`.
8. **Sürüm/migration:** contentHash+engine; eski run “yeniden doğrula”.
9. **Güvenlik:** ağsız istemci worker, secret yok; `fetch/XHR` silmek “tam
   sandbox” diye pazarlanmaz; gerçek robot bağlantısı yok.
10. **Performans/a11y:** Pyodide yalnız kod rotasında lazy; textarea/editor
    klavyesi, step kontrolleri, trace table, sınırlı stdout, reduced-motion.

Kabul: aynı seed aynı trace/test; sonsuz döngü otomatik kesilir; reset sonrası
global kalmaz; throwing storage UI'ı çökertmez; en az bir edge ve transfer testi
olmadan lab yayımlanamaz.

---

## 13. Altı ayrıntılı kod laboratuvarı

### Lab 1 — İki durumda çalışan blok program

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` —
`d-ortaokul-sirali-tekrar-kosul` taslağının dikey pilotu.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Ortaokul, 12–15 dk; `d-ortaokul-blok-komutlar`, sıralı hareket blokları. |
| Başlangıç kodu | Eksik `repeat` + `if/else` blok iskeleti. |
| Görev | İki çevrim; engel varsa güvenli açıya sap, yoksa hedefe git. |
| Görsel çıktı | Aktif blok, Boolean sensör, robot izi, açı tablosu. |
| Test | Engel açık/kapalı; yürütülen blok ≤8; eklem limitleri; iki final hedef. |
| Success/kanıt | İki seed geçti + öğrenci hangi dalın neden çalıştığını açıkladı; run trace. |
| İpucu/çözüm/gerçek robot | Dalın sensör okumasını vurgula; reference+alternatif sıra; debounce/safety notu. |
| Kaynak/review | Repo blok-komut semantiği; harici öğretim kaynağı henüz seçilmedi `[DOĞRULANAMADI — yayın engeli]`; robotik teknik+pedagojik review bekliyor. |
| Kaldırılırsa kayıp | Öğrenci koşulu yalnız tanımlamakla kalır; aynı programın iki sensör durumunda farklı ve doğru çalıştığını trace ile kanıtlayamaz. |
| Risk/efor/bitti | Düşük/M; yalnız final poz değil block trace ve iki test görünür. |

### Lab 2 — Python: tahmin et, izle, düzelt

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` —
`d-lise-python-komut-dizisi` taslağının dikey pilotu.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Lise, 15–20 dk; `b-lise-aci-birimleri`, sıralama, değişken ve basit liste. |
| Başlangıç kodu | 6–8 satır; aynı ekleme yanlış son açı veren bir satır. |
| Görev | Final/ara pozları tahmin et, satır adımla, hatayı düzelt. |
| Görsel çıktı | Kod satırı–kol pozu–uç izi senkron. |
| Test | Üç ara poz ve finalde eklem başına ≤0,1°; geçersiz joint index kontrollü hata; derece/radyan karşı örneği. |
| Success/kanıt | Tüm testler + tahmin/final delta + ikinci hedef transferi. |
| İpucu/çözüm/gerçek robot | Önce trace farkı; iki çözüm; gerçek robotta limit, hız ve dry-run notu. |
| Kaynak/review | Çalışan Pyodide'ın CPython sürümüyle eşleşen [Python Language Reference](https://docs.python.org/3/reference/) + repo komut sözleşmesi; teknik+pedagojik review bekliyor. |
| Kaldırılırsa kayıp | Öğrenci Python snippet'ini okur ama satır sırasını robot davranışından hata ayıklayamaz ve ikinci hedefe transfer edemez. |
| Risk/efor/bitti | Syntax yükü/M; `print` değil davranıştan debug. |

### Lab 3 — ROS 2 iletişim deseni seçici

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` —
`d-universite-ros2-temelleri` taslağının semantik harness'i.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Üniversite, 20–25 dk; `d-lise-python-komut-dizisi`, `e-lise-el-sikisma`, callback/state temeli. |
| Başlangıç kodu | Kamera, planlayıcı, kol node'ları için eksik handler/model config. |
| Görev | Akış→topic, kısa hesap→service, uzun iptal edilebilir hareket→action. |
| Görsel çıktı | Node graph, message timeline, queue/drop/latency. |
| Test | 20 ms/tick deterministik trace; uyumlu/uyumsuz QoS; 200 ms service timeout; action cancel ≤1 simülasyon tick'i; iki subscriber/drop fixture'ı. |
| Success/kanıt | Üç deterministic trace + mekanizma gerekçesi; distro/source/version. |
| İpucu/çözüm/gerçek robot | Mesaj ömrü/iptal ihtiyacı ipucu; alternatif mimari; gerçek DDS farkı. |
| Kaynak/review | [ROS 2 Lyrical interface guide](https://docs.ros.org/en/lyrical/How-To-Guides/Topics-Services-Actions.html), distro/revizyon/erişim tarihi; ROS teknik+pedagojik review bekliyor. |
| Kaldırılırsa kayıp | Öğrenci topic/service/action adlarını sayar ama latency, timeout ve iptal ihtiyacına göre desen seçip trace ile savunamaz. |
| Risk/efor/bitti | Yüksek/L; “semantik model, gerçek ROS runtime değil” görünür. |

### Lab 4 — NumPy ile çerçeve zinciri

`[YENİ] [BU DENETİMDE YENİ]` — Bölüm 11'deki N1 ile aynı P1 eserdir;
ikinci bir backlog maddesi değildir.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Üniversite, 25 dk; `a-universite-homojen-donusum`, Python fonksiyon/listesi ve NumPy mikro ön çalışması. |
| Başlangıç kodu | `rotz`, `translation`, `compose`; bir çarpım sırası hatası. |
| Görev | Tool noktasını base/world'e dönüştür; sıra hatasını düzelt. |
| Görsel çıktı | Matris, eksenler, nokta ve aktif kod satırı. |
| Test | Identity, inverse round-trip, non-commutativity, shape/dtype, `1e-9`. |
| Success/kanıt | Test raporu+ikinci frame transferi+runtime version/hash. |
| İpucu/çözüm/gerçek robot | Değişen hücre; alternatif `@` zinciri; calibration/frame convention notu. |
| Kaynak/review | Modern Robotics Ch.3 + çalışan bundle ile aynı sürüm [NumPy dokümantasyonu](https://numpy.org/doc/stable/); runtime hash; kinematik+kod+pedagojik review bekliyor. |
| Kaldırılırsa kayıp | Öğrenci 4×4 matrisi okuyabilir ama çarpım sırasını çalışan kodda doğrulayıp yeni frame zincirine taşıyamaz. |
| Risk/efor/bitti | Pyodide/NumPy cold load/M; bu route dışında paket yüklenmez. |

### Lab 5 — DLS IK hata ayıklama

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` — yayınlı
`b-universite-ters-kinematik` yanlış eşleşmesinin gerçek kod laboratuvarı.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Üniversite, 30 dk; `b-universite-jacobian`, NumPy matris işlemi, norm ve iterasyon. |
| Başlangıç kodu | Yanlış işaret/transpoz içeren DLS update. |
| Görev | Hatayı düzelt; λ ve step sınırını seç. |
| Görsel çıktı | Kol, residual grafiği, iterasyon, condition/manipulability. |
| Test | Erişilebilir hedefte residual ≤1 mm ve ≤100 iterasyon; erişilemez hedefte false success 0; near-singular, joint-limit ve tüm adımlarda finite output. |
| Success/kanıt | Tüm testler + failure sınıfı + yeni q0 transferi. |
| İpucu/çözüm/gerçek robot | Residual trend; iki λ stratejisi; position-only ve controller safety notu. |
| Kaynak/review | Modern Robotics Ch.6 + repo dışında bağımsız referans hesap/fixture; kinematik/sayısal yöntem+pedagojik+safety dil review'u bekliyor. |
| Kaldırılırsa kayıp | Öğrenci DLS formülünü okur fakat yakınsama, tekillik ve erişilemez hedef failure'ını çalışan iteration trace'inde ayıramaz. |
| Risk/efor/bitti | Sayısal kapsam/L; analitik solver kullanılmadığı testli. |

### Lab 6 — Planlayıcı doğrulama ve köşe kesme hatası

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]` — C hattındaki
planlayıcı/çarpışma derslerinin debug dikey dilimi.

| Alan | Tanım |
|---|---|
| Seviye/süre/önkoşul | Üniversite, 25–30 dk; `c-universite-carpisma-kontrolu`, segment geometrisi ve Python fonksiyonu. |
| Başlangıç kodu | Son segmenti/ince engeli kontrol etmeyen `segment_free`. |
| Görev | Tüm segmentleri collision-free yap; z=0 invariant'ı ve clearance tut. |
| Görsel çıktı | Geçersiz segment kırmızı, temas noktası, düğüm/yol/clearance. |
| Test | 10 mm grid fixture; start/goal dolu; ince köşe; exact segment–AABB oracle; yol clearance ≥20 mm; tüm segment/son bağlantı; üç görünür+iki hidden seed. |
| Success/kanıt | Property testler + daha önce görülmeyen hidden seed; çözünürlük/motor version. |
| İpucu/çözüm/gerçek robot | Son segment ipucu; sampling ve obstacle inflation alternatifleri; endüstriyel validasyon değildir. |
| Kaynak/review | Repo collision fixtures + [Planning Algorithms](https://lavalle.pl/planning/) referansı; planlama/geometri+pedagojik+safety dil review'u bekliyor. |
| Kaldırılırsa kayıp | Öğrenci planlayıcının “success” bayrağına güvenir; bir rotayı bağımsız segment/clearance oracle ile doğrulayamaz. |
| Risk/efor/bitti | Ayrık/sürekli collision farkı/L; pass olan her rota yeniden doğrulanır. |

İlk uygulama dalgası yalnız Lab 1, 2 ve 4'tür. Lab 3, 5 ve 6; worker,
trace, test ve evidence çekirdeği pilotta doğrulandıktan sonra açılır.

---

## 14. Robotları profesyonelce tanıtan modül

### 14.1 Robot Seçim Masası / Hücre Teklif Simülatörü

`[YENİ] [BU DENETİMDE YENİ]`

| Zorunlu alan | Karar |
|---|---|
| Problem/fırsat | `a-ortaokul-robot-turleri` ve `a-universite-robot-mimarileri` tek generic kol çevresinde ansiklopedi; öğrenci seçim yapmıyor. |
| Kanıt | Kazanım birden çok mimariyi ayırt etmek; fiilî action yalnız iki joint slider. |
| Hedef | Lise sonu, üniversite, tekniker, öğretmen; ortaokul için sade görev modu. |
| Neden heyecan verici | Kullanıcı gerçek bir hücre brief'inden shortlist ve ölçülü gerekçe üretir; yanlış seçimin sahnede bedelini görür. |
| Davranış/görünüm | Şartname → hard constraint → aday kartları → trade-off → yanlış seçim simülasyonu → teklif/kanıt. Datasheet satırı her kararın yanında. |
| Öğrenme | Robot türünü ezberlemek yerine payload/reach/repeatability/accuracy/cycle/environment/safety kısıtlarıyla savunur. |
| Teknik | `TaskSpec`, `RobotCandidate`, `ConstraintResult`, `SourceRef{url,documentNo,revision,accessedAt,page}`; saf evaluator+2B workspace/cycle/failure. |
| Mobil/a11y/perf | Tablo için kart alternatifi; uygunsuzluk renk+kod+metin; klavye filtre; küçük JSON; lisanssız logo/görsel yok. |
| Risk/bağımlılık | Vendor test koşulları farklı; eksik veri “belirtilmemiş”; cobot=otomatik güvenli değildir; uzman review. |
| Kabul | Her sayı resmi belge/revizyon/sayfa/erişim tarihine izlenebilir; görevde ≥2 makul aday; tek kısıt değişince beklenen sıralama; öğrenci ≥4 nicel kriterle savunur. |
| Etki/efor/öncelik | 5/5 · L · **P2** (P1'de veri/kısıt prototipi; learning kernel sonrası tam yapım). |
| Ücretsiz/premium | Ücretsiz 3 vendor-neutral görev; premium sürümlü çoklu-vendor dataset, öğretmen rubriği ve teklif/capstone paketi. |
| Başarı metriği | Kullanıcıların ≥%80'i yeni görevde repeatability–accuracy farkını ve dört nicel gerekçeyi doğru uygular. |
| Kaldırılırsa kayıp | Robot özelliklerini okur ama bir iş için savunulabilir robot seçemez. |

### 14.2 Görev girdisi

Öğrenciye kart değil şartname verilir:

- taşınacak parça + end-effector + kablo kütlesi;
- erişilecek pozlar, orientation ve mesafe;
- repeatability ihtiyacı ile ayrı accuracy/kalibrasyon ihtiyacı;
- hedef çevrim süresi, duty ve hız kısıtı;
- zemin/duvar/tavan montajı ve çalışma hacmi;
- insanla çalışma durumu ve uygulama risk değerlendirmesi;
- IP/temizlik/sıcaklık/patlayıcı ortam gibi çevre koşulu;
- sabit hücre mi hareketli taşıma mı.

### 14.3 Aday aileleri ve yanlış seçimin gözlenebilir sonucu

| Aile | Öğrenilecek yapı | Uygun görev örneği | Yanlış seçim simülasyonu |
|---|---|---|---|
| Mafsallı | Seri döner eklemler; tipik endüstriyel kol 6 eksendir ama aile 4/5/7+ eksenli olabilir | Karmaşık erişim/kaynak/machine tending | DOF/reach/orientation/çevrim veya payload sınırı |
| SCARA | XY/yatay düzlemde seçici uyumluluk, Z yönünde rijitlik ve hızlı planar montaj | Elektronik pick-place/assembly | Z stroku/orientation/workspace yetersizliği |
| Delta | Paralel kinematik, düşük hareketli kütle | Çok hızlı hafif pick-place | Payload/reach/orientation yetersizliği |
| Cartesian | Prizmatik eksen, kutu workspace | CNC/gantry/doğrusal taşıma | Footprint veya karmaşık yönelim |
| Cobot/işbirlikçi uygulama | Tek kinematik mimari değildir; safety-rated monitored stop, hand guiding, speed/separation monitoring ve power/force limiting gibi yöntemler risk değerlendirmesiyle seçilir | Uygun risk değerlendirmeli paylaşılmış alan | “Cobot etiketi otomatik güvenlidir” varsayımı; yöntem/cycle/payload/risk fail |
| AGV | Tanımlı yol/güdüm altyapısı, görev ve fleet/şarj | Kararlı güzergâhlı iç lojistik | Yol/zemin/geçit/payload/trafik/şarj fail |
| AMR | Harita, localization ve algıyla daha dinamik rota planlama; yine operasyon sınırları vardır | Değişken koridorlu iç lojistik | Localization/sensör kapsaması/dinamik engel/fleet/şarj fail |

Gövde/eklemler, aktüatör/enkoder, controller, sensör, end-effector/gripper ve
güvenlik sınırı her adayın “sistem kesiti”nde gösterilir. Vendor komutları
ayrı sekmede ortak `MoveIntent`e bağlanır; syntax kartı robot seçiminin yerine
geçmez.

`[DOĞRULANAMADI]` Bu sınıflandırma modül sözleşmesidir; karşılaştırmada
kullanılacak lisanslı, sürümlü robot datasheet veri seti henüz oluşturulmadı.
Gerçek reach/payload/repeatability/speed/IP değerleri tabloya bu rapordan
kopyalanamaz; Bölüm 14.4 kaynak ve review kapısı geçilmeden aday kartı yayımlanmaz.

### 14.4 Teknik doğruluk ve kaynak politikası

- Repeatability accuracy değildir; ISO 9283 performans kriteri/test çerçevesi
  kaynak başlangıcıdır. Üretici değerleri test koşuluyla birlikte tutulur.
- Maksimum eksen hızı tek başına çevrim süresi değildir. Hızlanma, path,
  payload, controller ve dwell bilinmiyorsa sonuç “tahmini/karşılaştırılamaz”.
- Payload hesabı end-effector/kablo ve üretici load diagramını yok saymaz.
- Cobot etiketi uygulamayı risksiz yapmaz. Güvenlik iddiası için
  ISO 10218-1/-2:2025 kapsamı ve uzman review gerekir; platform uygunluk
  belgesi vermez.
- İlk veri seti yalnız resmi üretici ürün/datasheet sayfalarından, revizyon ve
  8 Ağustos 2026 erişim tarihiyle alınır. [ABB portföyü](https://new.abb.com/products/robotics/en/robots)
  farklı aile ve variant alanlarını; [ABB IRB 5710](https://new.abb.com/products/robotics/robots/articulated-robots/irb-5710)
  reach/payload/repeatability/accuracy ayrımını gösteren örnek birincil
  kaynaktır. Sayılar rapordan kopyalanıp veri seti yapılmaz; doküman/revizyon
  snapshot'ı ve lisans kontrolü gerekir.
- Sentetik görev değerleri “eğitim senaryosu” diye açık etiketlenir; uydurma
  robot modeli veya üretici logosu kullanılmaz.

### 14.5 İdeal görev döngüsü

```text
Brief'i oku → kısıtları sayıya çevir → iki adayı tahmin et
→ datasheet ile filtrele → yanlış adayı çalıştır → failure metriğini gör
→ trade-off'u savun → farklı tek kısıtla yeniden seç → kanıtı dışa aktar
```

MVP üç görevdir: hassas elektronik pick-place, insan yakınında değişken ürün
montajı ve depo içi taşıma. Her görevde tek “doğru marka” değil, kısıtlara göre
en az iki savunulabilir aday ve açık trade-off bulunmalıdır.

## 15. Mevcut fikirlerin güçlü biçimde geliştirilmiş halleri

Bu bölümdeki fikirler önceki `docs/guncel-fikirler.md`, kanonik belgeler veya
mevcut bileşenlerde zaten vardı. Adlarını değiştirip yeni fikir gibi sunmak
yerine, bu denetimin kanıtlarıyla uygulanabilir ürün sözleşmelerine dönüştürüldü.

### A1 — Dört Mercekli Deney + Tahmin/Çalıştır/Fark/Geri Sar

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Lise, üniversite ve tekniker. `ForwardKinematics`,
  `CoordinateTransformer`, `IkTarget` ve grafikler aynı kavramı ayrı widget'lar
  olarak gösteriyor; öğrencinin sahne, matris, grafik ve kod arasında nedensel
  bağ kurduğuna dair kanıt yok.
- **Neden heyecan verici / öğrenme değeri:** Tek zaman imleci hareket ettiğinde
  robot, dönüşüm matrisi, (x/y) grafiği ve çalışan kod satırı birlikte değişir.
  Öğrenci önce sonucu tahmin eder, sonra kendi tahminiyle gerçek koşunun farkını
  geri sararak inceler. Kaldırılırsa aynı robotik olayın dört temsilinin tutarlı
  olduğunu sınama fırsatı kaybolur.
- **MVP davranışı ve görünümü:** İlk dikey dilim yeniden tasarlanan ileri
  kinematik dersidir. Masaüstünde 2×2 mercek; mobilde aynı `runId` ve zaman
  imlecini koruyan dört sekme. Tahmin kartı çalıştırmadan önce kilitlenir;
  çalıştırma sonrası sayısal `Δx`, `Δy`, açı ve birim görünür; geri sarma gerçek
  hesap durumunu oynatır, dekoratif videoyu değil.
- **Teknik temel / bileşenler:** Saf `ExperimentModel<Input, Sample, Result>`,
  `RunTimeline`, `RepresentationAdapter` ve Web Worker'da hesap; SVG/Canvas 2B
  birincil, 3B yalnız uzamsal belirsizlik için lazy-load. Matris, grafik ve sahne
  aynı örnek dizisini tüketir; dört ayrı hesap motoru kurulmaz.
- **Mobil, erişilebilirlik, performans:** Sekmelerin erişilebilir adı ve ok
  tuşları; grafik için veri tablosu/özet; renk dışı seri kodu; zaman sürgüsüne
  sayı girdisi; `prefers-reduced-motion` durumunda adım adım ilerleme. İlk görev
  JS'si gzip ≤200 KB, etkileşime hazır olma ≤2,5 sn orta sınıf mobil hedefi.
- **Risk / bağımlılık:** Ortak deney çekirdeği ve birim/çerçeve sözleşmesi
  kurulmadan yalnızca görsel senkron yanılsaması oluşur. Math/scene invariant
  testleri ve Evidence v2 önkoşuldur.
- **Ücretsiz / premium:** Bir tam dört-mercek laboratuvarı ve temel geri sarma
  ücretsiz; uzun capstone oturumları, karşılaştırmalı koşu arşivi ve öğretmen
  değerlendirme paketi premium olabilir.
- **Kabul ve başarı metriği:** Aynı sample için dört görünüm aynı `runId`, zaman,
  birim ve çerçeveyi raporlar; otomatik invariant testleri geçer; pilotta
  öğrencilerin ≥%80'i yeni bir pozda matris işaretinin uç nokta yönüne etkisini
  doğru açıklar. Etki 5/5, efor XL, risk orta-yüksek, P1.

### A2 — Sürümlü, seed'li ve paylaşılabilir deney durumu

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Tüm öğrenciler ve öğretmen. Planlayıcı motor katmanı
  enjekte edilebilir RNG'yi destekliyor; fakat `PlannerRace` UI seed almıyor veya
  motor çağrısına RNG geçmiyor. `RobotCellCapstone` seed gösteriyor fakat kararları
  ondan türetmiyor; yeniden
  yükleme ve paylaşma aynı gözlemi güvenilir biçimde üretmiyor.
- **Neden heyecan verici / öğrenme değeri:** “Benim rotam neden farklı?” sorusu
  bir bağlantıyla tekrar açılabilir; iki öğrenci yalnızca değiştirdikleri değişkeni
  karşılaştırabilir. Kaldırılırsa hata ayıklama ve adil sınıf karşılaştırması
  tekrarlanabilir olmaz.
- **MVP davranışı ve görünümü:** `Deneyi paylaş` yalnız giriş, seed, model sürümü
  ve seçili zaman adımını URL parçasına veya indirilebilir küçük JSON'a yazar.
  Açılan bağlantı önce özet gösterir, kullanıcı onayıyla çalışır; kişisel veri,
  serbest metin ve sonuç iddiası taşımaz. Eski sürüm açılırsa “bu koşu v1 motoruyla
  üretildi” uyarısı verir.
- **Teknik temel / bileşenler:** `ExperimentStateEnvelope{schemaVersion,
  experimentId, modelVersion, seed, input, cursor, checksum}`; deterministik PRNG;
  Zod doğrulama; maksimum payload; migration tablosu; Golden-seed testleri.
- **Mobil/a11y/perf:** Native share varsa kullan, yoksa kopyala/indir; bağlantı
  düğmesi klavye ve canlı durum mesajına sahip; paket ≤8 KB hedefi; hesap sunucuya
  veya analitiğe gönderilmez.
- **Risk / bağımlılık:** Model sürümü pinlenmezse aynı URL farklı sonuç üretir;
  kötü niyetli büyük payload ve bozuk schema sınırlandırılmalı. Önkoşul deney
  çekirdeği ve açık gizlilik politikasıdır.
- **Değer / kabul:** Temel paylaşım ücretsiz; sınıf dağıtımı, toplu içe aktarma ve
  rubrik premium öğretmen değeridir. Aynı zarf iki temiz tarayıcıda bit düzeyinde
  aynı sonuç özeti üretir; 20 öğretmen denemesinin ≥%90'ı yardım almadan paylaşır.
  Etki 4/5, efor M, risk orta, P1.

### A3 — Yerel deney defteri ve dürüst beceri kanıtı

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Lise üstü öğrenci, tekniker, öğretmen. Bugünkü evidence
  özetinde `passed` otomatik olarak `tried+read`, `predicted` ise `read` sayılıyor;
  basit transfer çoktan seçmelisi sahne çalıştırılmadan “Kanıtlandı” üretebiliyor.
- **Neden heyecan verici / öğrenme değeri:** Defter bir rozet listesi değil;
  tahmin, koşu parametreleri, gözlem, başarısız test, düzeltme ve transfer sonucu
  ile küçük bir mühendislik günlüğüdür. Kaldırılırsa öğrenci neyi gerçekten
  çalıştırdığını ve nasıl düzelttiğini gösteremez.
- **MVP davranışı ve görünümü:** Her deney sonunda kullanıcı kendi gözlem
  cümlesini ve seçili koşuyu yerelde saklar. `Gördüm`, `denedim`, `başardım`,
  `transfer ettim` birbirinden bağımsız gerçek olaylardır; eksik kanıt açıkça
  eksik görünür. JSON/Markdown dışa aktarma ve tek tuşla silme ücretsizdir.
- **Teknik temel / bileşenler:** Evidence v2 event günlüğü;
  `EvidenceEvent{lessonVersion,experimentId,runId,type,predicateId,value,
  createdAt}`; yalnız modelin doğruladığı predicate `passed` yazabilir; içerik
  sürümü değişince eski kanıt “önceki sürüm” olur, silinmez. IndexedDB + güvenli
  localStorage fallback; sunucu hesabı MVP'de yok.
- **Mobil/a11y/perf:** Zaman çizelgesi yerine küçük kart özet; durumlar ikon+metin;
  canlı mesaj; veri boyutu kotası ve dışa aktarma; offline çalışır. Başlangıçta
  günlük lazy-load edilir.
- **Risk / bağımlılık:** Otomatik kanıtın gerçekte neyi ölçtüğü her ders için
  tanımlanmalı; öz-beyan otomatik başarı gibi gösterilmemeli. Veri kaybı ve ortak
  cihaz gizliliği için silme/cihaz uyarısı gerekir.
- **Değer / kabul:** Yerel defter, temel export ve silme ücretsiz; seçilmiş
  capstone portföyü, öğretmen rubriği ve imzalı değerlendirme premium olabilir.
  Sahne çalıştırmadan hiçbir performans rozeti üretilemez; olaylar yeniden
  oynatılabilir; pilotta yanlış pozitif kanıt oranı %0. Etki 5/5, efor L, risk
  yüksek, P0/P1.

### A4 — Çapraz-hat robot hücresi capstone'u 2.0

`[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Lise, üniversite, tekniker. Canlı capstone görsel olarak
  güçlü fakat rota seçilmeden rota görünmüyor, program sabit string sırasını,
  güvenlik testi ekranda verilen üst sınırı ve `0 mm/s` dahil herhangi bir alt
  değeri kabul ediyor; `attempts` pratikte hep 1 ve adımlar atlanabiliyor.
- **Heyecan / öğrenme:** Tek hücrede kinematik, planlama, sensör, program ve
  güvenlik kararları birbirini etkiler. Kaldırılırsa kullanıcı platformun
  parçalarını gerçek bir sistem kararı içinde birleştiremez.
- **MVP davranışı:** Üç gerçek motor yeterlidir: (1) engellerle collision-checked
  rota ve uzunluk/clearance, (2) seçilebilir komutlardan kurulan programın
  simülasyon trace'i, (3) duruş mesafesi/çevrim süresi trade-off'u. Hatalı seçim
  görünür fail üretir; kullanıcı geriye dönüp yalnız ilgili parametreyi değiştirir.
- **Teknik / bileşen:** `CellScenario` seed'den türetilir; her adım saf evaluator;
  durum zarfı yeniden yüklenir; `attempt` her değerlendirme çağrısıdır; geçiş
  kilidi gerçek predicate'e bağlıdır. 2B deterministik sahne birincil, 3B isteğe
  bağlı doğrulama merceğidir.
- **Mobil/a11y/perf:** Dikey görev rayı; sahne/veri sekmeleri; klavyeyle rota ve
  kod sıralama alternatifi; tüm grafiklerin metin özeti. 3B sonraki adımda yüklenir,
  düşük donanımda 2B aynı kanıtı üretir.
- **Risk / bağımlılık:** Bugünkü A–C yayın kapsamı dört disiplin vaadini
  karşılamıyor; D–H içerikleri review olmadan bağlanamaz. Ortak deney modeli,
  kanıt v2 ve doğrulanmış planlayıcı gerekir.
- **Değer / kabul:** Ücretsiz kısa bir hücre; premium çoklu senaryo, fault pack,
  öğretmen rubriği ve ayrıntılı rapor. Seed aynı hücreyi üretir; rota gerçekten
  collision-free; program trace'inden başarı; `0` sahte başarı vermez; öğrencinin
  en az bir başarısızlığı düzeltmesi kanıtlanır. Etki 5/5, efor XL, risk yüksek,
  P2.

### A5 — Arıza enjeksiyon laboratuvarı + Hata Müzesi

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Lise üstü, tekniker ve profesyonel. Mevcut deneylerin çoğu
  yalnız ideal mutlu yolu gösteriyor; sensör drift'i, encoder bias, gecikme,
  sıkışma veya çerçeve hatası teşhis ettirilmiyor.
- **Heyecan / öğrenme:** Kullanıcı arızayı seçmez; seed'li bir semptomu ölçümlerden
  teşhis eder, hipotez kurar, bir test ister ve yanlış müdahalenin bedelini görür.
  Hata Müzesi anonim koşunun trace'ini, yanlış zihinsel modeli ve doğru teşhis
  sırasını anlatır. Kaldırılırsa gerçek robotikte merkezi olan teşhis ve güvenli
  durdurma fırsatı kaybolur.
- **MVP:** Tek PID/sensör sahnesinde üç fault: sabit bias, paket gecikmesi,
  doygunluk. Öğrenci sınırlı üç gözlem kanalı seçer; kök neden + güvenli ilk eylem
  + doğrulama testi sunar. Müze, aynı trace'in yanlış ve doğru yorumunu yan yana
  gösterir.
- **Teknik / bileşen:** Deterministik discrete-time plant, `FaultInjector`,
  timestamp'li telemetry, hypothesis/test state machine, safety envelope ve
  golden traces. Gerçek robota komut yoktur; simülasyon etiketi kalıcıdır.
- **Mobil/a11y/perf:** Telemetry seri seçici ve veri tablosu; sonogram/renk tek
  ipucu değildir; hareket azaltıldığında adımlı trace. Worker içinde sabit bütçeli
  model.
- **Risk / bağımlılık:** Arıza imzaları aşırı temiz olursa oyuncaklaşır, aşırı
  gürültü öğretimi bozar; robotik/safety review ve açıklanmış model sınırları
  gerekir.
- **Değer / kabul:** Bir arıza ücretsiz; alan paketleri ve öğretmen vaka setleri
  premium. Öğrenci bilinmeyen seed'de doğru kök nedeni ve güvenli ilk eylemi ≥%75
  seçer; aynı trace tekrar üretilebilir. Etki 5/5, efor L, risk orta, P2.

### A6 — Vendor Rosetta: ortak hareket niyetinden komut farklarına

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Üniversite, tekniker, profesyonel. RAPID/KRL/FANUC/Mecademic
  syntax kartları tek tek eklenirse snippet mezarlığı oluşur ve marka bağımsız
  hareket kavramı kaybolur.
- **Heyecan / öğrenme:** Öğrenci önce vendor-neutral `MoveIntent` kurar; sonra aynı
  intent'in hedef/çerçeve/hız/blending/tool varsayımlarının vendor temsillerinde
  nerede ayrıştığını görür. Kaldırılırsa syntax ezberler ama taşınabilir mühendislik
  modeli kuramaz.
- **MVP:** `MoveJ` ve doğrusal hareket için iki sentetik görev; ortak semantik
  form, iki üretici dilinde salt-okunur çıktı, “eşdeğer değil” uyarıları ve trace.
  İndirilebilir/gerçek robota gönderilebilir program üretilmez.
- **Teknik / bileşen:** Sürümlü `MoveIntent` IR, vendor adapter'ları, resmi kılavuz
  referansları, parser/golden snippet testleri ve capability matrix. Lisans ve
  redistribüsyon izni doğrulanmadan kod metni çoğaltılmaz.
- **Mobil/a11y/perf:** Diff satır satır, ekran okuyucu özeti; yatay kod için wrap
  seçeneği; syntax motorları isteğe bağlı yüklenir.
- **Risk / bağımlılık:** Vendor sürümü, controller opsiyonu ve terminoloji
  farklıdır; “birebir çeviri” iddiası yasak. Uzman review ve erişilebilir resmi
  doküman gerekir.
- **Değer / kabul:** Ortak kavram dersi ücretsiz; sürümlü çoklu-vendor lab ve
  kurum senaryosu premium olabilir. Öğrenci yeni örnekte joint/linear, frame,
  speed ve blend farklarını ≥4 ölçütle doğru açıklar; her iddia doküman sürümüne
  izlenir. Etki 4/5, efor L, risk yüksek, P3.

### A7 — Türkçe robotik bilgi grafiği ve “neden bu ders?” yolu

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Özellikle yeni başlayan, öğretmen ve farklı seviyeden gelen
  yetişkin. Repo bağımlılık grafiğini build sırasında doğruluyor, fakat kullanıcı
  “bu dersten önce ne bilmeliyim, bunu nerede kullanacağım?” sorusuna görünür ve
  güvenilir cevap alamıyor.
- **Heyecan / öğrenme:** Bir kavram düğümü; önkoşul, yanlış kavrama, deney, gerçek
  sistem bileşeni ve kanıt üreten göreve bağlanır. Bu bir içerik haritası değil,
  öğrenme gerekçesi haritasıdır. Kaldırılırsa kullanıcı ders sayısından yol çıkarır.
- **MVP:** Yalnız yayınlanmış A–C için 20–30 editoryal düğüm; ders üstünde üç kısa
  bağlantı: “önce”, “bu derste kanıtla”, “sonra kullan”. Gizli draft bağlantısı
  gösterilmez; döngü ve kopuk düğüm CI'da hata olur.
- **Teknik / bileşen:** Kanonik `conceptId`, `prerequisite`, `evidencePredicate`,
  `misconception`, `application`; içerikten türetilmiş statik JSON; grafik
  doğrulayıcı ve kaynak bağlantısı.
- **Mobil/a11y/perf:** Büyük force graph yerine hiyerarşik liste birincil;
  klavyeyle açılır yol; canvas yalnız ek görünüm; statik route başına küçük slice.
- **Risk / bağımlılık:** Otomatik metin benzerliği yanlış pedagojik bağ kurmamalı;
  müfredat uzmanı her edge'i review eder.
- **Değer / kabul:** Kişisel olmayan yol ve arama ücretsiz; sınıf ilerleme/rubrik
  eşleme premium olabilir. Kullanıcıların ≥%90'ı iki dakika içinde uygun ilk
  görevi bulur; yayın grafiğinde görünmez/dangling edge sıfır. Etki 4/5, efor M,
  risk düşük-orta, P1.

### A8 — Hesapsız sınıf paketi ve doğrulanmış offline okul modu

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Öğretmen, interneti/cihazı sınırlı okul ve ortak cihaz
  kullanan öğrenci. Kayıt zorunluluğu olmaması güçlü; fakat bugün indirilebilir,
  sürümlü, aynı seed'le yürüyen ders paketi ve offline/error durumu yok.
- **Heyecan / öğrenme:** Öğretmen tek QR/dosya ile 30 cihaza aynı senaryoyu,
  süreyi ve rubriği dağıtır; öğrenciler hesapsız çalışır ve kanıt paketini yerel
  olarak teslim eder. Kaldırılırsa iyi web dersi sınıf koşullarında güvenilir bir
  uygulamaya dönüşmez.
- **MVP:** Üç yayınlı ders + bir öğretmen rehberi + seed listesi + cevap değil
  gözlem rubriği; önceden indirilen statik paket; bağlantı kesildiğinde açık
  “offline sürüm” banner'ı; yerel kanıt export'u.
- **Teknik / bileşen:** İmzalı paket manifest'i, asset hash'i, service worker veya
  taşınabilir statik bundle, storage quota check, güncelleme/rollback değil sürüm
  seçimi. İlk online açılışa bağımlı olmayan kurulum talimatı.
- **Mobil/a11y/perf:** Düşük RAM/CPU profili; 2B fallback; tüm klavye ve ekran
  okuyucu kontrolleri paketle aynı; 3G/çevrimdışı test matrisi.
- **Risk / bağımlılık:** İçerik lisansı, tarayıcı kota temizliği, ortak cihazda
  veri karışması ve eski güvenlik düzeltmeleri. Paket son kullanım/yenileme
  bilgisini gösterir.
- **Değer / kabul:** Öğrenci tarafındaki temel offline örnek ücretsiz tutulabilir;
  kurum paketi, güncelleme kanalı, öğretmen rubriği ve destek premium somut
  değerdir. Uçak modunda temiz kurulmuş pakette üç ders ve export çalışır; 30
  cihazlık pilotta görev başlatma ≥%95. Etki 5/5, efor XL, risk yüksek, P3.

### A9 — Aynı deneyde derinlik katmanları

`[DÜZELT] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Hedef ve sorun:** Ortaokuldan profesyonele aynı platform. Ayrı ayrı benzer
  dersler içerik tekrarına; tek ağır ders ise yaşa uymayan yoğunluğa yol açıyor.
- **Heyecan / öğrenme:** Aynı fiziksel olay dört derinlikte açılır: “hareketi
  tahmin et”, “koordinatı hesapla”, “Jacobian ile hassasiyeti incele”, “çevrim ve
  güvenli devreye alma sınırını değerlendir”. Kullanıcı büyüdükçe sahne değişmez,
  açıklama gücü derinleşir.
- **MVP:** İleri kinematik pilotunda `temel`, `kod`, `matematik`, `saha` katmanı;
  temel outcome ve ölçülen observable ortak, görev/rubrik farklı. Seviye seçimi
  öneridir; kullanıcı katmanı görebilir ve değiştirebilir.
- **Teknik / bileşen:** Ortak deney ID'si, katmanlı MDX slotları, katmana özel
  prerequisite/evidence predicate, aynı model için farklı representation adapter.
- **Mobil/a11y/perf:** Seçim küçük segmented control değil erişilebilir radio;
  seçilmeyen ağır kod/3B yüklenmez; okuma düzeyi açık fakat “çocuk modu” dili yok.
- **Risk / bağımlılık:** İçeriği CSS ile saklamak öğretim tasarımı değildir;
  katmanların ayrı pedagogik ve teknik review'u gerekir.
- **Değer / kabul:** Tüm temel katmanlar ücretsiz; ileri proje/rubrik paketleri
  premium olabilir. Pilot her katmanda tek ölçülebilir outcome'a ulaşır; farklı
  yaş pilotlarının ≥%80'i dili uygun bulur. Etki 4/5, efor L, risk orta, P2.

### A10 — Protokol Zaman Çizgisi ve Handshake Gecikme Bütçesi

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Köken kanıtı:** `SignalTimeline`, E hattındaki handshake/jitter dersleri ve
  kanonik yol haritasındaki zamanlama görselleştirmesi zaten vardır. Geliştirilen
  yeni katman; discrete-event yürütme, temporal assertion, duplicate mesaj ve
  idempotent recovery'dir; fikir bütünü yeni değildir.
- **Hedef ve sorun:** Üniversite, tekniker, profesyonel. ROS 2 topic/service/action
  veya PLC–robot handshake adı geçse bile mesaj sırası, timeout, duplicate,
  network jitter ve güvenli recovery görünür bir zamansal modelle öğretilmiyor.
- **Heyecan / öğrenme:** Robot, PLC, sensör ve güvenlik düğümlerinin swimlane'i
  üzerinde paketler akar; öğrenci timeout/jitter enjekte edip deadlock'u bulur,
  sonra idempotent recovery tasarlar. Kaldırılırsa protokol sözlüğü öğrenilir ama
  hücrenin neden beklediği/çift başlattığı teşhis edilemez.
- **MVP:** Vendor-neutral dört sinyalli pick request/ready/start/done handshake;
  normal, kayıp `done` ve geç duplicate; güvenli timeout state machine görevi.
  İkinci mercek aynı modeli ROS 2 service/action benzetmesiyle açıklar, gerçek ROS
  ağı çalıştırmaz.
- **Teknik / bileşen:** Deterministik discrete-event simulator, sequence diagram,
  event log, temporal assertions ve state-machine editor. ROS sürümü/sözleşmesi
  resmi dokümana pinlenir; Lyrical LTS takvimi kaynak metadatasına yazılır.
- **Mobil/a11y/perf:** Yatay diyagramın olay listesi eşdeğerdir; playback yerine
  adım; paket sayısı sınırlı; ses/renk tek bildirim değildir.
- **Risk / bağımlılık:** Vendor gerçek I/O güvenlik davranışı genellenemez;
  simülasyon ve güvenli devreye alma uyarısı kalıcı. D/E/F içeriklerinin insan
  review'u ve state-machine motoru gerekir.
- **Değer / kabul:** Vendor-neutral temel vaka ücretsiz; PLC/vendor/ROS vaka
  paketleri premium. Öğrenci üç seed'de deadlock nedenini, güvenli timeout'u ve
  yeniden başlatma koşulunu doğru kurar; temporal testlerin tamamını geçirir.
  Etki 5/5, efor L, risk yüksek, P3.

## 16. Repoda ve belgelerde bulunmayan gerçekten yeni fikirler

“Yeni” burada mutlak bir sektör yeniliği iddiası değildir. İncelenen repo, Git
geçmişi ve kanonik belgelerde aynı ürün davranışı ve öğrenme sözleşmesi
bulunamadığı anlamına gelir. Genel kavram benzerliği olan fikirler bu listeye
alınmadı.

### B1 — Robot Seçim Masası / Hücre Teklif Simülatörü

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef / sorun / heyecan:** Lise üstü, üniversite, tekniker. Mevcut robot türü
  dersleri öğrenciyi ölçülebilir bir seçime zorlamıyor. Kullanıcı gerçek bir
  brief'i okuyup uygun aile/aday seçer ve yanlış seçimin reach, payload,
  repeatability, cycle veya ortam fail'ini sahnede görür.
- **Öğrenme ve kayıp:** Datasheet okuma, hard constraint ile trade-off'u ayırma,
  accuracy–repeatability farkı ve güvenlik sınırını savunma. Kaldırılırsa
  ansiklopedik bilgi satın alma/mühendislik kararına transfer edilemez.
- **MVP / teknik / bileşen:** Bölüm 14'teki üç görev; sürümlü resmi datasheet
  kaynağı, saf constraint evaluator, 2B workspace/cycle/failure, karar raporu.
- **Mobil/a11y/perf / risk:** Kartlaştırılmış tablo, renk dışı fail kodu, keyboard
  filtre; küçük veri. Vendor test koşulları ve lisans riski; üretici belgesi ve
  uzman review zorunlu.
- **Değer / ölçüm:** Ücretsiz üç vendor-neutral görev; premium çoklu-vendor veri,
  öğretmen rubriği ve capstone paketi. Bilinmeyen görevde ≥4 nicel gerekçeyle
  savunulabilir seçim yapan kullanıcı ≥%80. Etki 5/5, efor L, risk yüksek, P2
  (P1'de yalnız veri/kısıt prototipi).

### B2 — Birim ve Çerçeve Dedektifi

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef ve sorun:** Lise, üniversite, tekniker. İçerikte derece/radyan, mm/m ve
  base/tool/world çerçeveleri açıklansa da kod çalışmadan önce bu tür hataları
  yakalayan bir öğrenme aracı yok; sayısal olarak “çalışan” yanlış sonuçlar
  tehlikeli bir alışkanlık oluşturur.
- **Neden heyecan verici / öğrenme:** Kod ve matris bağlantılarının üstünde
  `120 mm@tool`, `0.12 m@base`, `30 deg` gibi görünür tipler akar. Öğrenci hata
  mesajını kapatmaz; gerekli dönüşümü ekleyip trace'i düzeltir. Kaldırılırsa
  robotikteki en yaygın sessiz hata sınıflarından birini erken teşhis edemez.
- **MVP davranışı:** Dört küçük görev: mm+m toplama, deg'i `sin`e verme,
  tool vektörünü base pozuna doğrudan ekleme ve timestamp'siz hız. Dedektif yalnız
  hatalı yeri ve beklenen boyut/çerçeveyi söyler; çözümü ilk ipucunda vermez.
- **Teknik / bileşen:** Kısıtlı Python/ifade AST'si; `Quantity<Unit,Frame>` tip
  sistemi; frame graph; açıklanabilir diagnostic; golden valid/invalid örnekler.
  Tam Python çalıştırıcı güvenliğiyle karıştırılmaz.
- **Mobil/a11y/perf:** Satır ve bağlantı listesi; hata altı çizgi+ikon+metin;
  ekran okuyucu “satır, bulunan, beklenen”; parser worker'da ve küçük grammar.
- **Risk / bağımlılık:** Statik çıkarım her dinamik Python'u kapsamaz; “bu alt
  kümede doğrulandı/doğrulanamadı” ayrımı şart. Kinematik uzmanı ve kod editörü
  bağımlılığı.
- **Değer / kabul:** Temel dört vaka ücretsiz; proje linter'ı premium lab içinde.
  Kullanıcı yeni sekiz hatanın ≥7'sini düzeltir ve her dönüşümün nedenini açıklar;
  yanlış pozitif oranı test corpus'unda <%2. Etki 5/5, efor L, risk orta, P2.

### B3 — Şartnameden Otomatik Teste Stüdyo

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef ve sorun:** Üniversite, tekniker, profesyonel. Kod görevleri “çıktı
  göründü” düzeyinde kalabiliyor; teknik şartı ölçülebilir sınır durumuna ve teste
  dönüştürme becerisi öğretilmiyor.
- **Heyecan / öğrenme:** Kullanıcı “engel mesafesi hiçbir seed'de 80 mm altına
  inmeyecek, planlayıcı 100 ms'de sonuç vermeli” gibi şartı seçer; önce test
  üretir, sonra algoritmayı geçirir. Başarısız counterexample sahnede otomatik
  açılır. Kaldırılırsa çalışan demo ile doğrulanmış mühendislik arasındaki ayrım
  öğrenilemez.
- **MVP:** A* laboratuvarında üç zorunlu ve iki öğrenci-yazımlı assertion;
  normal, no-path ve dar geçit fixture'ı; bir kasıtlı bug; test sonucu ile sahne
  karesi arasında bağlantı.
- **Teknik / bileşen:** Güvenli assertion DSL, seed fixture registry, süre/memory
  bütçesi, worker kill/recreate, property-based küçük case üreticisi ve JUnit-benzeri
  yerel rapor. Serbest ana thread `eval` yok.
- **Mobil/a11y/perf:** Blok/forma dayalı test kurucu ve kod görünümü; sonuç özeti
  tablolu; her koşu katı zaman aşımı. Uzun fuzz paketi cihazda değil, seçili küçük
  vaka setiyle sınırlı.
- **Risk / bağımlılık:** Kötü test yanlış güven üretir; referans oracle ve teknik
  review gerekir. CodeRunner sandbox sertleştirmesi önkoşuldur.
- **Değer / kabul:** Bir temel test laboratuvarı ücretsiz; geniş doğrulama paketi,
  rapor ve rubrik premium. Öğrencilerin ≥%75'i daha önce görmediği sınır durumunu
  yakalayan test yazar; false pass %0. Etki 5/5, efor L, risk yüksek, P2.

### B4 — Pareto Hücre Tasarım Laboratuvarı

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef ve sorun:** Üniversite, tekniker, profesyonel. Hız, payload, enerji,
  hassasiyet, clearance ve maliyet çoğu derste tek tek geçiyor; “her şeyde en iyi”
  çözüm olmadığı ölçülebilir biçimde deneyimlenmiyor.
- **Heyecan / öğrenme:** Kullanıcı robot, hız profili ve gripper seçtikçe aday
  hücreler grafikte Pareto cephesine girer veya domine edilir; bir kısıtı değiştirmek
  cepheyi canlı değiştirir. Kaldırılırsa gerçek tasarım trade-off'u tek skorla
  ezilir.
- **MVP:** Sentetik, açık etiketli 12 aday; cycle, tahmini enerji, repeatability
  uygunluğu ve clearance; iki görev profili; öğrenci seçimini üç ölçütle savunur.
- **Teknik / bileşen:** Boyutlandırılmış scenario JSON, saf dominance evaluator,
  normalization açıklaması, scatter+erişilebilir tablo, seçimin decision record'u.
- **Mobil/a11y/perf:** Grafik yerine sıralı tablo tam işlevli; renk+şekil; 12 nokta
  nedeniyle hafif. Tooltip bilgisi focus/click ile de erişilir.
- **Risk / bağımlılık:** Sentetik maliyet/enerji gerçek vendor verisi gibi
  sunulamaz; ağırlıklı tek skor varsayımları gizlememeli. Robot Seçim Masası
  modelinden sonra gelir.
- **Değer / kabul:** Temel sentetik lab ücretsiz; doğrulanmış sektör vaka paketleri
  premium. Öğrenci iki farklı brief'te farklı Pareto-optimal seçim yapıp nedenini
  açıklar; dominated seçim “doğru” sayılmaz. Etki 4/5, efor M, risk orta, P2.

### B5 — Kalibrasyon Belirsizlik Bütçesi

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef ve sorun:** Üniversite ve profesyonel. Accuracy/repeatability ve
  kalibrasyon kavramları anlatılabilir, fakat sensör, fixture, tool center point ve
  model belirsizliklerinin sonuç pozuna nasıl yayıldığı görünür değil.
- **Heyecan / öğrenme:** Kullanıcı ölçüm belirsizliklerini birer birer açar;
  uç noktadaki hata elipsi ve tolerans dışı oran değişir. “Daha hassas robot al”
  seçiminin kötü fixture'ı her zaman çözmediğini görür. Kaldırılırsa tolerans
  zincirini tek datasheet sayısına indirger.
- **MVP:** 2B pick-place hücresi; dört bağımsız seed'li hata kaynağı; lineer küçük
  hata yaklaşımı ile Monte Carlo karşılaştırması; öğrencinin ölçüm bütçesi altında
  üç iyileştirme seçimi.
- **Teknik / bileşen:** Birimleri açık stochastic model, deterministik PRNG,
  covariance propagation, worker Monte Carlo, referans hesap ve hata sınırı.
  “Gerçek hücre tahmini değildir” etiketi.
- **Mobil/a11y/perf:** Hata elipsi yanında yüzde/tablo; animasyon gerektirmez;
  örnek sayısı cihaz profiline göre, sonuç güven aralığı görünür.
- **Risk / bağımlılık:** Bağımsız/normal dağılım varsayımı her saha için doğru
  değildir; varsayım paneli ve uzman review şart. NumPy/koordinat pilotundan sonra.
- **Değer / kabul:** Temel model ücretsiz; gelişmiş kalibrasyon vaka paketi premium.
  Öğrenci yeni senaryoda baskın iki belirsizlik kaynağını doğru sıralar ve bütçe
  içinde tolerans dışı oranı hedefe indirir. Etki 4/5, efor L, risk yüksek, P3.

### B6 — Deney Sözleşmesi Linter'ı ve Ders Röntgeni

`[YENİ] [BU DENETİMDE YENİ]`

- **Hedef ve sorun:** İçerik yazarı, robotik/pedagoji reviewer ve dolaylı olarak
  her öğrenci. 89 dosyanın şeması doğrulansa da Outcome → Action → Observable →
  Success → Feedback → Transfer zincirinin gerçekten bulunduğunu ve widget'ın
  kanıt ürettiğini CI doğrulamıyor.
- **Neden heyecan verici / öğrenme:** Reviewer dersin “röntgeninde” hangi outcome'un
  hangi kontrol, ölçüm, predicate, feedback ve transfer göreviyle bağlandığını
  görür; dekoratif etkileşim kırmızı kalır. Kaldırılırsa içerik sayısı artarken
  öğrenme boşlukları şema doğrulamasından geçer.
- **MVP:** Yayınlanmış altı transferli ders ve seçilen üç yeniden tasarım için
  makine-okunur `learningContract`; CI'da eksik/öksüz bağ uyarısı; iç review
  sayfasında kaynak ve test bağlantıları. Otomatik linter pedagojik onay vermez.
- **Teknik / bileşen:** MDX frontmatter/manifest uzantısı,
  `outcomeId→controlId→observableId→predicateId→feedbackId→transferId` graph;
  component registry; content-hash; test report artifact.
- **Mobil/a11y/perf:** Öğrenci arayüzüne yüklenmez; reviewer tablosu klavye ve
  filtrelenebilir; build süresini kontrollü tutmak için statik graph.
- **Risk / bağımlılık:** Alanları doldurmak kaliteyi garanti etmez ve sahte
  uyumluluk üretebilir; insan pedagojik/teknik review son kapıdır.
- **Değer / kabul:** İç kalite sistemi ücretsiz çekirdeğin güvenini korur;
  kurum içeriği için özel linter/rubrik premium hizmet olabilir. Yayınlanacak yeni
  deneyde altı bağın tamamı, yürütülen predicate testi ve reviewer kaydı olmadan
  CI geçmez; mevcut 39 ders için borç görünür, gizlenmez. Etki 5/5, efor M, risk
  düşük-orta, P0/P1.

## 17. Ücretsiz ve premium değer modeli

`[ÖNERİ] [DOKÜMANLARDA ZATEN VAR]` Ücretsiz çekirdek ve öğretmen/offline değer
fikri kanonik belgelerde vardır; aşağıdaki sınırlar bu denetimde ölçülebilir ve
gizlilik uyumlu hale getirilmiştir.

### 17.1 İlke ve kullanıcıya verilecek net cevap

Ücretsiz çekirdek bilerek eksik, sinir bozucu veya reklama boğulmuş olmayacaktır.
Ödeme duvarının cevabı şudur:

> Ücret, kilidi veya reklamı kaldırmak için değil; doğrulanmış ileri deney
> senaryoları, öğretmen tarafından uygulanabilir paketler, ayrıntılı test/rubrik,
> sürümlü sektör vaka verisi, capstone üretim yolu ve desteklenmiş offline dağıtım
> gibi hazırlanması ve sürekli doğrulanması pahalı üretim imkânları içindir.

Temel kavramın açıklaması, en az bir anlamlı deney, kaynak şeffaflığı, güvenlik
uyarısı, erişilebilirlik, yerel temel kanıt/export ve kişisel veriyi silme hakkı
premium yapılamaz. “Üç günlük seri bozulacak”, yanıltıcı geri sayım, sahte kıtlık,
önceden işaretli ödeme, temel sonucun bulanıklaştırılması veya erişilebilirliğin
satılması yasaktır.

### 17.2 Değer katmanları

| Katman | Kullanıcının somut olarak elde ettiği | Neden ödenebilir | Sınır / kanıt |
|---|---|---|---|
| Ücretsiz keşif ve temel öğrenme | A–C yayın yolunda güvenilir açıklama, kaynak, anlamlı mikro-deney, temel kod görevi, yerel defter/export, 2B düşük cihaz modu | Ürünün değerini gerçekten kanıtlar; yapay tadımlık değildir | Her ana kavram en az bir ölçülebilir ücretsiz başarı; ödeme istemeden önce sonucu görür |
| İleri laboratuvar | Daha çok içerik değil; fault pack, çoklu seed, sınır durumları, otomatik testler, karşılaştırmalı koşu ve ayrıntılı deney raporu | Hazırlama, referans hesap, robotik review ve bakım maliyeti yüksektir | Her lab için çalıştırılmış test, model sınırı, sürüm ve öğrenme kanıtı |
| Kontrollü capstone yolu | Brief, milestone, starter asset, test harness, hata enjeksiyonu, rubrik, portföy paketi | Öğrenci tüketmek yerine bitmiş mühendislik çıktısı üretir | İndirilebilir karar kaydı + geçen testler + transfer değerlendirmesi |
| Öğretmen/sınıf paketi | Hesapsız dağıtım, süre planı, seed listesi, rubrik, yanlış kavrama rehberi, toplu fakat gizlilik koruyan teslim alma | Öğretmenin hazırlık ve değerlendirme süresini doğrudan azaltır | Beş öğretmen pilotu: en az üçü derste kullanır, en az ikisi bütçe sürecine girer |
| Offline okul paketi | İmzalı/sürümlü statik bundle, düşük cihaz profili, güncelleme kanalı, kurulum rehberi ve destek | Bağlantı ve BT kısıtını operasyonel olarak çözer | 30 cihaz, uçak modu, ≥%95 görev başlatma; kaynak/sürüm görünür |
| Vendor/profesyonel vaka | Resmi sürümlü kaynaklara dayalı karşılaştırma, handshake/vaka verisi, güvenli devreye alma checklist'i | Genel syntax değil, bakımı yapılan karşılaştırmalı uygulama üretir | Lisans, erişim tarihi, expert review; gerçek robota doğrudan komut yok |
| Beceri portföyü/değerlendirme | Seçilmiş deney kaydı, otomatik test sonucu, açıklama/rubrik ve sürüm bağı; paylaşılabilir statik paket | İş/okul için savunulabilir üretim kanıtı sağlar | Ham yerel export ücretsiz kalır; “sertifika” yalnız tanımlı insan değerlendirmesi varsa |

### 17.3 Premium'a geçişin etik anı

Ödeme çağrısı ilk ekranda veya öğrenci hata yaparken değil, kullanıcı ücretsiz bir
kanıt ürettikten ve bir sonraki üretim imkânını açıkça seçtikten sonra gösterilir:

```text
Ücretsiz sonuç: “A* rotanı üç testle doğruladın ve raporu indirebilirsin.”
Premium teklif: “Aynı çözümü 12 seed, gecikmeli sensör ve öğretmen rubriğiyle
capstone'a dönüştürmek ister misin?”
```

### 17.4 Ticari doğrulama kapısı

Henüz fiyat veya dönüşüm iddiası için veri yoktur. Önce iki küçük pilot gerekir:

1. Beş öğretmene ücretsiz sınıf paketi ver; hazırlık süresi, derste başlatma oranı,
   rubrik kullanımı ve gerçek bütçe sürecini ölç.
2. 20 lise/üniversite öğrencisine bir ücretsiz ve bir ileri fault/capstone paketi
   kullandır; “hangi üretim imkânı için ödeme?” sorusunu davranış ve görüşmeyle
   ölç. Yalnız niyet anketi ödeme isteği kanıtı sayılmaz.

Premium geliştirmeye geçiş kriteri: temel ücretsiz akışın iki dakikada görev
başlatma ≥%90, ücretsiz görev tamamlama ≥%70 ve güven/doğruluk P0'larının sıfır
olmasıdır. Bozuk ücretsiz çekirdeğin üzerine fiyatlandırma kurulmaz.

### 17.5 Hesapsız model, kimlik, teslim ve çocuk ödeme sınırı

`[YENİ] [BU DENETİMDE YENİ]` Premium değer, gizlilik mimarisini sessizce hesaplı
bir SaaS'a dönüştüremez:

- Ücretsiz deney/run paylaşımı sürümlü, kişisel verisiz bir state zarfıdır. Serbest
  öğrenci adı, e-posta, okul veya yorum URL'ye yazılmaz; export kullanıcı eylemiyle
  oluşur ve cihazdan silinebilir.
- İlk sınıf pilotunda öğretmen otomatik öğrenci takibi yapmaz. Öğrenci rumuzlu
  kanıt dosyasını/QR paketini bilinçli olarak öğretmen cihazına aktarır; platform
  sunucusu aracı olmaz. Öğretmen cihazındaki saklama/silme süresi rehberde açık,
  varsayılan öneri ders bitimi+değerlendirme sonrası 30 gündür.
- “İmzalı/verified portföy” mevcut hesapsız mimaride varmış gibi satılamaz. İnsan
  kimliği doğrulanmış bir değerlendirme için ayrı opt-in identity, veli/okul
  yetkisi, retention/delete/export, tehdit modeli ve hukuki/gizlilik review'u
  gerekir. Bu sistem kurulana dek çıktı “sürümlü test ve rubrik raporu”dur,
  sertifika veya doğrulanmış kimlik değildir.
- Reşit olmayan öğrenciye ders içinde ödeme popup'ı, geri sayım veya seri kaybı
  gösterilmez. Satın alma teklifi öğretmen/veli tarafından açılan yetişkin
  bağlamında; kapsam, süre, yenileme ve iade bilgisi görünür olarak sunulur.
- Öğretmen pilotunda hazırlık süresi, aynı dersi paketsiz hazırlama baseline'ına
  göre median **≥%30 azalmalı**; aksi halde “öğretmen paketi zaman kazandırır”
  değer iddiası doğrulanmış sayılmaz.

Risk/bağımlılık: sınıf aktarım tehdit modeli, ortak cihaz silme testi, çocuk
gizliliği/hukuk review'u ve offline paket imzası. Kabul: network log'unda öğrenci
kanıtı/kimliği 0; export ve silme kullanıcı kontrollü; yetişkin ödeme bağlamı E2E;
30 günlük rehber görünür; beş öğretmen pilotunda hazırlık süresi hedefi ölçülür.

## 18. Teknik mimari, performans ve erişilebilirlik önerileri

### 18.1 Ölçülen istemci baseline'ı

`[KANIT]` Aşağıdaki sayılar production üzerinde Lighthouse CLI 13.4.1'in
varsayılan mobil simülasyon profiliyle, özel throttling olmadan yapılmış tek
navigation koşularıdır (3B ölçüm zamanı `2026-08-08T20:15:47Z`). Gerçek kullanıcı
p75 Core Web Vitals verisi değildir. JSON/HTML artifact kalıcı kaydedilmedi ve
71 puanlı temsilî `JointSliders` dersinin tam slug'ı kayıt altına alınmadı;
`[DOĞRULANAMADI]`. Sayılar yalnız eğilim gösterir, tekrar üretilebilir release
kanıtı veya saha performansı iddiası kurmaz.

| Production yüzeyi | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS / TTI |
|---|---:|---:|---:|---:|---:|---:|---|
| Ana sayfa `/` | 95 | 96 | 100 | 100 | 1,9 sn | 230 ms | 0 / — |
| Temsilî 3B `JointSliders` dersi — tam rota kaydedilmedi | 71 | 96 | 100 | 100 | 1,9 sn | **1.790 ms** | — / 5,1 sn |

İlk rota script transferleri (gzip, tek ölçüm): ana sayfa 181.679 B, seviye
180.570 B, ders 195.732 B, capstone 183.915 B. 3B derste yaklaşık 3,2 sn JS boot
ve yüksek TBT, “ilk etkileşim hızlı” hedefi için asıl performans borcudur. Ana
sayfanın 95 puanı 3B içeriğin otomatik olarak ucuz olduğu anlamına gelmez.

`[YENİ] [BU DENETİMDE YENİ]` Kabul bütçesi:

- gerçek kullanıcı p75: LCP ≤2,5 sn, INP ≤200 ms, CLS ≤0,1;
- CI mobil laboratuvarı: ana/seviye/ders ≥90, 3B ders ≥90 ve TBT <300 ms;
- ilk anlamlı 2B görev gzip JS ≤200 KB; Pyodide, Three.js ve ağır editör yalnız
  ihtiyaç anında;
- düşük donanım/2B yolu aynı başarı predicate'ini üretmeli; “hafif mod” daha az
  öğrenme anlamına gelmemeli;
- her bütçe 3 ardışık median ve bundle diff ile izlenmeli; tek Lighthouse puanı
  release kapısı değildir.

### 18.2 Öğrenme çekirdeği: etkileşimleri tek sözleşmeye bağla

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

Bugün `HeroExperiment`, `IkTarget`, `PlannerRace`, `TransferChallenge`, capstone ve
diğer bileşenler kendi hesap, storage ve başarı mantıklarını taşıyor. Bu durum ilk
deneyde hard-coded doğru yanıt, analitik çözücüyle nümerik IK anlatımı ve sahte
kanıt gibi farklı görünen ama aynı kökten gelen hatalar üretiyor.

```text
Lesson learningContract
        │
        ▼
ExperimentModel(input, seed, modelVersion)
        │ immutable samples/result
        ├── Scene adapter
        ├── Matrix/code/graph adapters
        ├── Success predicates + feedback
        └── Evidence v2 event + share envelope
```

Zorunlu tipler:

```ts
type ExperimentRun<I, S, R> = {
  runId: string;
  experimentId: string;
  modelVersion: string;
  lessonVersion: string;
  seed: string;
  input: I;
  samples: readonly S[];
  result: R;
  units: Record<string, string>;
  frames?: Record<string, string>;
};

type SuccessPredicate<R> = {
  id: string;
  evaluate: (result: R) => { passed: boolean; measurements: Record<string, number> };
};
```

Model React'tan bağımsız saf fonksiyon/worker modülü olmalı. Görünüm “başarı”
yazamaz; yalnız predicate sonucunu açıklar. Öğrenci kontrolü, observable, yanlış
kavrama, başarı, feedback ve transfer ID'leri `learningContract` içinde bağlanır.
Bir etkileşim bu zinciri kuramıyorsa registry'de `illustration` sayılır ve kanıt
üretemez.

### 18.3 Kod ve hesap çalıştırma sınırı

`[DÜZELT] [CLAUDE TARAFINDAN EKLENDİ]`

| Kanıtlanan risk | Önerilen davranış | Kabul kriteri |
|---|---|---|
| `CodeRunner` koşuları aynı worker/global namespace'i yeniden kullanıyor; kesin timeout/terminate yok | Her değerlendirmede temiz worker veya güvenli pool reset; süre/bellek/çıktı limiti; timeout'ta worker terminate+recreate; yalnız izinli köprü API | Sonsuz döngü UI'ı kilitlemez; sonraki temiz test kirlenmez; timeout ve 1 MB çıktı testi geçer |
| `PlannerRace` worker error/timeout akışı beklemede kalabilir | Abortable state machine: idle/running/succeeded/failed/timed-out; retry yeni worker; kullanıcıya ölçülebilir hata | Enjekte edilen worker error/timeout 2 sn içinde hata paneli ve çalışır retry üretir |
| Pyodide ağır başlangıç | Kod merceği seçilene kadar yükleme; küçük JS referans modeliyle tahmin aşaması; asset sürümü/hash'i | İlk sahne Pyodide indirmeden çalışır; kod labında progress+cancel+offline mesajı vardır |
| Serbest Python sonucu sahneden kopuk kalabilir | Yalnız tanımlı input/output şeması ve birim/çerçeve kontrolünden geçen veri adapter'a gider | Geçersiz shape, NaN/Infinity, yanlış birim ve eksik çıktı otomatik fail olur |

Bu bir güvenlik sandbox'ı olarak pazarlanmamalıdır. Tarayıcı izolasyonu, CSP ve
worker sınırı savunma katmanlarıdır; kullanıcı kodu backend'e veya gerçek robota
gönderilmez.

### 18.4 Render, state ve uygulama kabuğu

`[DÜZELT] [BU DENETİMDE YENİ]`

- `JointSliders` için 2B SVG özeti server-render edilir; Three.js Canvas viewport'a
  yaklaşınca veya kullanıcı `3B aç` dediğinde yüklenir. Gereksiz gölge/postprocess
  yok; DPR üst sınırı, görünmeyince render pause, context-loss fallback vardır.
- `localStorage`/IndexedDB okuma-yazmaları parse, quota, private-mode ve disabled
  storage hatalarını yakalar. Başarı storage yazılmasına bağlı değildir; yazılamazsa
  açık “yalnız bu oturum” durumu gösterilir.
- `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` ve offline state bugün
  yoktur. Türkçe, markalı ve geri dönüş eylemli ortak durum yüzeyleri eklenir;
  arama ve sözlükte skip hedefi gerçek `<main id="ana-icerik">` olur.
- CSS'te `Inter`, `Inter Tight`, `JetBrains Mono` adları bulunmasına karşın repo
  asset'i, `@font-face` veya `next/font` yüklemesi doğrulanmadı. Ya sistem font
  stack'i dürüstçe kullanılır ya da lisansı doğrulanmış self-hosted subset
  `next/font/local` ile eklenir; görünmeyen font varsayımı token sayılmaz.
- Yükleniyor, boş, hata, başarı, eski sürüm, storage kapalı ve offline durumları
  her laboratuvarın state machine'inde tanımlanır; yalnız spinner ile bırakılmaz.
- `[BİRLEŞTİR/KALDIR] [BU DENETİMDE YENİ]`
  `components/lesson/CompleteLessonButton.tsx` ile `lib/progress.ts` aktif import
  taşımayan eski ikinci ilerleme modelidir. Evidence v2 migration'ında davranışı
  gereken yerde kanonik API'ye alınmalı, sonra ölü bileşen/storage anahtarları
  kaldırılmalıdır. Kabul: tek progress/evidence yazma API'si, tek sürümlü storage
  şeması, repo import graph'ında eski modül 0 ve eski veriden kontrollü migration.

### 18.5 Erişilebilirlik bulgu ve düzeltme matrisi

| Sayfa/bileşen kanıtı | Durum | Öğrenmeye etkisi | Ölçülebilir düzeltme |
|---|---|---|---|
| `SiteHeader` mobil logo bağlantısı yaklaşık 32×44 px ve erişilebilir adı yok | `[DÜZELT]` | Ekran okuyucu navigasyon hedefini anlayamaz | Görünür/aria ad “Robotik Platform — ana sayfa”; iç hedef 44×44; axe name testi |
| Arama, sözlük ve varsayılan 404'te skip link hedefi yok | `[DÜZELT]` | Klavye kullanıcısı tekrarlı header'ı atlayamaz | Her route'ta tek `main#ana-icerik`, odak görünür; keyboard E2E |
| `PredictionPrompt` doğru açıklamayı tahmin commit'inden sonra fakat deney run'ından önce erişilebilir ağaçta sızdırıyor | `[YENİDEN TASARLA]` | Ekran okuyucu sonucu deneyden önce alır; tahmin–gözlem sırası eşitsizleşir | Cevap/feedback yalnız run observable oluşunca DOM'a girer; pre-run/post-run screen-reader snapshot testi |
| Quiz dinamik feedback'inde güvenilir live region yok | `[DÜZELT]` | Sonuç görsel kullanıcıya gelir, ekran okuyucuya gelmez | `aria-live="polite"`, odak korunur, tekrar duyuru testi |
| Capstone adım değişiminde odak `BODY`ye düşüyor; adımlar atlanabiliyor | `[YENİDEN TASARLA]` | Klavye kullanıcısı bağlamı kaybeder ve görevi yanlış sırada geçebilir | Yeni adım başlığına programatik odak; tamamlanmamış adım kilidi; Playwright focus assertion |
| `LessonProgressBadge` her kartta başlıktan kopuk `sr-only` “Başlanmadı” üretiyor | `[DÜZELT]` | Liste taramasında hangi dersin durumu olduğu belirsiz | Durum başlıkla `aria-describedby` bağlanır; screen-reader liste snapshot'ı |
| JS timer'ları `prefers-reduced-motion`u izlemiyor | `[DÜZELT]` | CSS animasyonu dursa da deney hareketi sürer | Tüm playback `useReducedMotion`/manual-step yoluna sahip; timer testi |
| Draft `ThresholdViewer` ve `ScanPath` 390 px'te taşabiliyor; `ScanPath` kodu uzun | `[DÜZELT]` | D–H yayınlandığında mobil görev kullanılamaz | Yayın öncesi 320/390/768 test; scroll yalnız kod içinde, sayfa overflow=0 |

Renk kontrastı otomatik skorla kapatılmaz. Grafik çizgileri renk+şekil+etiket;
joint kontrolleri slider yanında sayısal input; canvas yanında metin/tablo; drag
görevlerinde klavye alternatifi; tooltip'lerde hover dışında focus/click yolu
zorunludur. WCAG 2.2 AA minimumu tabandır; ürün içi dokunma hedefi mümkün olan
her yerde 44×44 px seçilir.

### 18.6 CI, release ve güvenlik sertleştirmesi

`[KANIT]` `.github/workflows/ci.yml` son GitHub koşusunda başarılıdır ve yerel
test/build de geçmiştir; fakat Playwright, axe, viewport/visual regression,
Lighthouse/bundle bütçesi, yasak hassas terim taraması ve review-hash kapısı yoktur.
GitHub `main` branch protection etkin değildir ve HEAD commit imzasızdır. Bunlar
canlıda kanıtlanmış bir exploit değildir; profesyonel değişiklik kontrolü
eksikliğidir.

Önerilen release sırası:

1. statik içerik şeması, kaynak/review hash ve hassas terim kapısı;
2. unit/property/golden-fixture testleri;
3. MDX güvenlik, typecheck, lint ve build;
4. Playwright ana→seviye→hat→ders→deney→kanıt, 390/768/1440;
5. axe + keyboard/focus + reduced-motion;
6. bundle/Lighthouse bütçesi ve 2B fallback testi;
7. preview insan teknik/pedagojik review ve açık imza;
8. protected `main`, gerekli check'ler ve mümkünse doğrulanmış commit/tag.

Global CSP'deki `unsafe-inline` ve `wasm-unsafe-eval` kapsamı ihtiyaç duyulan
route/worker ile daraltılmalıdır; Pyodide gereksinimi bütün siteye yayılmamalıdır.
Nonce/hash ve route'a özel header araştırılmadan direktif kaldırmak build'i
bozabilir. Bu nedenle önce report-only gözlem, sonra CSP regression testi yapılır.

## 19. Kalite, kaynak ve insan incelemesi sistemi

### 19.1 Bugünkü güven zincirindeki kritik kırık

`[KANIT] [YENİ SORUN ÜRETTİ]`:

- 39 yayınlı dersin 32'sinde tek, 6'sında iki, 1'inde üç kaynak kaydı var; hiçbiri
  yapılandırılmış URL, sürüm/revizyon ve erişim tarihi taşımıyor.
- Git geçmişi ile `incelendi_tarih` karşılaştırıldığında **10/39 yayınlı dersin**
  son içerik değişikliği görünen inceleme tarihinden sonra. Bunlar:
  `a-lise-koordinat-sistemleri`, `a-ortaokul-robot-nedir`,
  `b-lise-geometrik-ters-kinematik`, `b-lise-ileri-kinematik`,
  `b-ortaokul-birden-fazla-yol`, `b-ortaokul-eklemleri-oynat`,
  `b-universite-jacobian`, `b-universite-ters-kinematik`,
  `c-ortaokul-labirentte-yol-bulma` ve
  `c-universite-algoritma-karsilastirma-deneyi`.
- Canlı güven paneli bu değişikliklere rağmen `İnsan incelemesi: Mert ·
  2026-08-02 · Yayınlanan sürüm` gösteriyor; `incelendi_tarih` içerik sürümü gibi
  kullanılıyor, `summarizeEvidence`/review akışı hash'e bağlı değil.
- `docs/durum-denetim.md` kaydına göre yalnız dokuz ders gerçekten tek tek Mert
  tarafından okunmuş, kalan 30'u toplu AI/otomatik kontrolle onaylanmış; kullanıcı
  yüzeyi bu kapsam farkını göstermiyor.
- Yayınlı `b-universite-jacobian.mdx` kişisel işyeri ve vendor modeli deneyimini
  adlandırıyor. Bu, `docs/00-vizyon.md` içindeki mutlak işyeri/gizlilik kuralıyla
  çelişiyor; tek Modern Robotics kaynağı bu kişisel/vendor iddiayı desteklemiyor.
  `docs/11-yazarlik-kalitesi.md` ise bu yanlış kişiselleştirme biçimini teşvik
  ediyor. Kanonik belgelerin kendi aralarında güvenlik çelişkisi vardır.

`[YORUM]` Kullanıcıya “büyük ekip” hissi vermenin yolu tek kişinin adını her
değişiklikten sonra geçerli göstermek değildir. Güven, kapsamı açık ve yeniden
üretilebilir inceleme kaydıyla oluşur. Bugünkü yeşil panel içerikten daha güçlü
bir güven iddiası yaptığı için P0'dır.

### 19.2 Sürüme bağlı review modeli

`[YENİ] [BU DENETİMDE YENİ]`

İnceleme tarihi tek başına sürüm değildir. Üç ayrı hash gerekir:

```ts
type ReviewReceipt = {
  lessonId: string;
  contentHash: string;       // normalize edilmiş MDX gövdesi + öğretim metadatası
  interactionHash?: string;  // kullanılan model/component sürümleri
  fixtureHash?: string;      // sayısal referans/test paketi
  scope: "source" | "technical" | "pedagogical" | "safety" | "editorial";
  reviewerType: "human" | "automated";
  reviewerId: string;        // yayımlanmasına açık onaylı ad/rol veya kurum içi ID
  reviewedAt: string;
  decision: "approved" | "changes_requested";
  notes?: string;
};
```

MDX gövdesi değişirse content receipt, deney motoru değişirse technical/fixture
receipt otomatik eskir. Yazım düzeltmesinin hangi scope'u eskittiği normalize
edilmiş diff kuralıyla açıklanır; sistem sessizce tarihi yenilemez. CI veya AI
“human” receipt üretemez. Eski kayıt silinmez, “önceki sürüm” diye arşivlenir.

Kullanıcı paneli tek yeşil rozet yerine şunu gösterir:

```text
Kaynaklar        Kontrol edildi · 3 kaynak · erişim 2026-08-08
Sayısal model    Otomatik test geçti · fixture v2
Teknik inceleme  Yeniden inceleme gerekli · içerik sonradan değişti
Pedagojik        İnsan incelemesi · Ayşe / Müfredat · 2026-08-09
Güvenlik         Bu derste uygulanmaz / uzman incelemesi gerekli
Sürüm            içerik 8f3… · deney fk-2d-v3
```

Gerçekte tek reviewer varsa tek reviewer gösterilir. “Büyük ekip tarafından
kontrol edildi” gibi doğrulanamayan bir pazarlama cümlesi yazılmaz.

### 19.3 Kaynak ve iddia şeması

Her kaynak, serbest başlıktan yapılandırılmış kayda geçmelidir:

```ts
type SourceRef = {
  id: string;
  title: string;
  organizationOrAuthors: string;
  url: string;
  documentVersion?: string;
  publicationDate?: string;
  accessedAt: string;
  pagesOrSections?: string[];
  licenseOrUseNote?: string;
  sourceType: "datasheet" | "standard" | "official-doc" | "textbook" | "paper";
  supportsClaimIds: string[];
};
```

- Robot reach, payload, repeatability, accuracy, hız ve ortam değeri yalnız resmi
  üretici datasheet/ürün kılavuzuna; sayı ve test koşulu aynı claim'e bağlanır.
- NumPy, Python, OpenCV ve ROS içeriği kullanılan runtime sürümü ile resmi belge
  sürümünü ayırır. “Güncel” denmez; örneğin ROS 2 Lyrical'ın resmi Mayıs
  2026–Mayıs 2031 destek takvimi kaynak kaydında sürüm ve erişim tarihiyle bulunur.
- ISO 9283 veya ISO 10218-1/-2:2025 gibi standartlar özetlenirken kapsam ve
  erişilen baskı belirtilir; lisanslı standardın tam metni kopyalanmaz ve uygunluk
  hükmü verilmez.
- Sayısal örnek `fixtureId`, tolerans, referans yöntem ve test sonucu taşır. Kod
  snippet'i CI'da gerçekten çalıştırılır; yalnız syntax highlight kaynak kanıtı
  değildir.
- Görsel için üretici logosu/ürün fotoğrafı yerine lisanslı veya repo-native teknik
  çizim; kaynağı/lisansı doğrulanmayan görsel yayınlanmaz.

### 19.4 İnsan ve otomasyon görev ayrımı

| Kapı | Ne kontrol eder | Kim / ne yapabilir | Ne yapamaz |
|---|---|---|---|
| Şema/graph | Alan, ID, prerequisite, draft sızıntısı | CI | Pedagojik kalite onayı veremez |
| Sayısal fixture | Formül, tolerans, seed, edge case | CI + referans hesap | Gerçek robot güvenliğini kanıtlayamaz |
| Kaynak review | Claim–birincil kaynak bağı, sürüm, lisans | Teknik editör/uzman | Pedagojik transferi onaylayamaz |
| Robotik teknik review | Fizik, kinematik, planlama, birim/çerçeve | Robotik uzmanı | Sınıf kullanılabilirliğini tek başına onaylayamaz |
| Pedagojik review | Outcome–action–evidence–transfer, yaş dili | Müfredat/öğretim uzmanı | Vendor güvenlik hükmü veremez |
| Güvenlik review | Risk dili, sınırlar, gerçek donanım ayrımı | Yetkin güvenlik uzmanı | Ürüne uygunluk sertifikası veremez |
| Erişilebilirlik/editorial | Klavye/AT, terminoloji, Türkçe | A11y uzmanı/editör | Teknik sayıyı kaynak olmadan onaylayamaz |

Yayın kapısı ders riskine göre scope ister: salt kavram dersi en az kaynak+teknik+
pedagojik+editorial; hareket/güvenlik/vendor dersi bunlara safety receipt ekler.
Her reviewer açıkça yalnız kendi kapsamını imzalar.

### 19.5 Terim, sürüm ve kalite görünürlüğü

- Kanonik terim sözlüğü: `uç nokta/TCP`, `mafsal/eklem`, `erişim (reach)`,
  `yük kapasitesi (payload)`, `tekrarlanabilirlik`, `doğruluk`, `çalışma alanı`,
  `rota/yörünge`, `base/tool/world çerçevesi`. İlk kullanımda Türkçe + sektör
  karşılığı; dersler arasında rastgele eşanlam değişimi yok.
- İçerik footer'ı son Git commit'i değil kullanıcıya anlamlı `content version`,
  deney motoru sürümü, review kapsamı ve kaynak erişim tarihini gösterir.
- “Simülasyon” etiketi sahne içinde de kalır; gerçek robot controller'ı,
  safety-rated model veya uygunluk doğrulaması gibi sunulmaz.
- Hassas ad/işveren/vendor bağlamı için CI denylist tek başına yeterli değildir;
  `docs/00-vizyon.md` kuralı `docs/11` dahil bütün yazarlık talimatlarında tek
  yönlü olmalı ve insan release review'unda kontrol edilmelidir.

Kabul: yeni bir yayın content/interaction hash değiştiğinde yeşil human receipt
kalmaz; 10 mevcut stale ders doğru durum gösterir; her teknik claim bir kaynak
veya fixture'a bağlanır; review panelinde otomatik ve insan kontrolü karışmaz;
gizlilik ihlali taşıyan yayınlı metin sayısı sıfırdır.

## 20. Hızlı kazanımlar — P0/P1, ilk 1–2 hafta

| Sıra | Etiket/köken | Değişiklik ve kanıt | Kabul | Etki / efor / sahiplik |
|---:|---|---|---|---|
| 1 | `[DÜZELT] [CLAUDE TARAFINDAN EKLENDİ]` | `b-universite-jacobian.mdx` içindeki işveren/vendor kişisel bağlamını kaldır; `docs/11`i `docs/00` gizlilik kuralıyla uyumla; 10 stale derste yeşil review iddiasını durdur | Production ve repo hassas terim taraması temiz; review tarihi sahte güncellenmez; içerik “yeniden inceleme gerekli” | 5 / S–M / ürün+güven+editör |
| 2 | `[DÜZELT] [CLAUDE TARAFINDAN EKLENDİ]` | `HeroExperiment` doğru cevabı endpoint `before/after` ölçümünden türetsin; eşik/tolerans durumu olsun; 390/768'de kontroller ilk deney alanına taşınsın | q1=55–58° dahil parametrik testler gerçek SVG yönüyle aynı; 390×844'te kullanıcı scroll labirenti olmadan tahmin eder; keyboard test geçer | 5 / S / frontend+robotik |
| 3 | `[DÜZELT] [BU DENETİMDE YENİ]` | `b-universite-ters-kinematik` DLS/nümerik yakınsama anlatırken analitik `IkTarget`ı deney gibi sunmasın; tam redesign'e kadar interaction “analitik 2-DOF illüstrasyonu / yeniden inceleme gerekli” olsun ve kanıt üretmesin | Canlı metin analitik sonucu nümerik koşu diye adlandırmaz; DLS outcome için yeşil teknik review yok; gerçek DLS fixture gelmeden performans başarılamaz | 5 / S / robotik+editör |
| 4 | `[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ]` | `TransferChallenge` doğru MCQ'sunun performans `passed` yazmasını kes; `summarizeEvidence` evreleri bağımsız saysın; eski veriyi “eski model” olarak göster | Deney çalıştırmadan `tried/passed` oluşmaz; altı olay kombinasyonu unit testli; eski veri crash yaratmaz | 5 / M / frontend+öğretim |
| 5 | `[DÜZELT] [CLAUDE TARAFINDAN EKLENDİ]` | Ana sayfadaki dört disiplin/“gerçek protokoller” ve kod vaadini 39 yayınlı A–C/0 CodeRunner gerçeğiyle eşleştir; CTA seviye kartı yerine mini seçimden uygun ilk göreve gitsin | Canlı kopyadaki her kapsam claim'i yayın route'una bağlı; 6 persona testinin ≥%90'ı iki dakikada göreve varır | 5 / S / ürün+editör |
| 6 | `[DÜZELT] [BU DENETİMDE YENİ]` | Logo adı, gerçek skip hedefi, quiz live region, Prediction answer leak, capstone odak yönetimi ve progress badge ilişkisini düzelt | axe kritik/ciddi 0; yalnız klavyeyle ana→ders→kanıt; SR snapshot doğru açıklamayı run observable oluşmadan içermez | 4 / M / a11y+frontend |
| 7 | `[YENİ] [BU DENETİMDE YENİ]` | Türkçe `loading/error/not-found/offline/storage unavailable` kabuğu ekle | Her durum zorla tetiklenen testte neden+eylem+geri dönüş yolu gösterir; varsayılan İngilizce 404 yok | 3 / S–M / frontend+content |
| 8 | `[DÜZELT] [BU DENETİMDE YENİ]` | README Node 20+ ifadesini `engines`/`.nvmrc` Node 24 ile eşleştir; gerçek fontu yükle veya hayali aile adlarını kaldır | Temiz Node 24 kurulumunda build; network/font audit'te sessiz fallback yok | 2 / S / DX+design system |
| 9 | `[DÜZELT] [BU DENETİMDE YENİ]` | CI'ya hero/evidence unit regression, hassas terim ve review-staleness report'u ekle; ilk aşamada borcu görünür kıl | Yeni stale yayın veya yasak kişisel bağlam CI'ı durdurur; mevcut borç allowlist değil açık migration raporudur | 5 / M / quality+security |

Hızlı kazanım filtresi: görsel cila, yeni ders veya premium ekran bu dokuz maddeden
önce gelmez. Özellikle hero animasyonu “wow” olduğu için değil, doğru ölçüm yaptığı
ve mobilde erişildiği için korunur.

## 21. Orta vadeli sistemler — 3–8+ haftalık sıralı program

Bu süre tek tek ilk dikey dilimlerin kaba bandıdır; tablodaki bütün sistemlerin
aynı ekipçe sekiz haftada bitirileceği taahhüdü değildir. Review migration,
Learning Kernel ve altı pilot birlikte XL/8–12+ haftayı aşabilir; her satır kendi
kabul kapısından sonra sıradakini açar.

| Sistem | Kapsam ve bağımlılık | Ölçülebilir çıkış |
|---|---|---|
| Review Receipt v1 | Bölüm 19 hash/claim/source şeması; 39 yayın için migration; yalnız gerçek insan scope'u korunur | İçerik veya motor değişiminde otomatik invalidation; 39/39 panel dürüst; 10 stale çözülmeden onaylı görünmez |
| Evidence v2 + yerel defter | A3; `LessonEvidenceProvider`, `lib/evidence.ts`, completion panel ve 6 transfer dersi; privacy/storage fallback | Sahne koşusu olmadan performans yok; versioned export/delete; yanlış pozitif 0 |
| Learning Kernel v1 | Ortak run/seed/sample/predicate; ilk önce FK hero/dersi, sonra PlannerRace | Aynı run dört görünümde invariant; golden seed; model React'sız test edilir |
| İlk üç yayınlı dikey dilim | Bölüm 9.4'te ayrıntılandırılan `a-universite-homojen-donusum`, `b-universite-ters-kinematik` ve `c-universite-c-space`; kaynak+teknik+pedagojik review | Her biri Merak→Transfer döngüsünü, edge case'i ve performans kanıtını tamamlar |
| İlk üç kod pilotu | Bölüm 13'te seçilen Lab 1 (blok/koşul), Lab 2 (Python trace/debug) ve Lab 4 (NumPy/çerçeve); CodeRunner sertleştirmesi önkoşul | Tahmin→trace→değiştir→debug→test→transfer; timeout/namespace/edge testleri |
| Responsive/a11y E2E matrisi | 390, 768, 1440; keyboard, reduced motion, axe; ana→seviye→hat→ders→deney→kanıt | Her PR'da kritik akış; horizontal overflow 0; focus kaybı 0; ciddi axe 0 |
| 3B performans bütçesi | `JointSliders` lazy/fallback, DPR/pause; bundle analyzer ve Lighthouse | 3B mobil Performance ≥90, TBT <300 ms; 2B aynı predicate; context loss recovery |
| Bilgi grafiği v1 | Yalnız review edilmiş A–C concept/outcome/prerequisite/evidence edge'leri | 2 dakikada doğru ilk görev ≥90%; yayın grafiğinde dangling edge 0 |

Orta vade sonunda yayın sayısı artmak zorunda değildir. Başarı, 39 dersin en az
üçünde gerçeğe dayalı dikey kalite örneği ve geri kalanların dürüst durum/borç
haritasıdır. D–H'deki 50 draft toplu olarak yayınlanmaz.

## 22. Amiral gemisi özellikler

Amiral gemisi, büyük ekran görüntüsü üreten özellik değil; ücretsiz çekirdekte
kanıtlanan öğrenme motorunu daha karmaşık bir üretim problemine taşıyan sistemdir.
Review Receipt, Learning Kernel, Evidence v2 ve performans kapıları tamamlanmadan
bu bölüm geliştirmeye açılmaz.

### 22.1 Birinci amiral gemisi — Robot Seçim Masası

`[YENİ] [BU DENETİMDE YENİ]`

- **Ürün vaadi:** “Bir robotun adını değil, bir iş için neden uygun olduğunu
  datasheet ve ölçülebilir kısıtlarla savun.”
- **Neden ilk:** Ortaokulda sade robot ailesi seçimine, üniversite/teknikerde
  datasheet ve trade-off'a ölçeklenir; bugün ansiklopedik kalan robot tanıtımını
  doğrudan mühendislik kararına çevirir; pahalı 3B yerine doğrulanabilir 2B ve veri
  modeliyle pilotlanabilir.
- **Dikey MVP:** Bölüm 14'teki üç brief, en az altı aile, her görevde iki
  savunulabilir aday, yanlış seçimin ölçülü failure'ı ve dört ölçütlü karar raporu.
- **Giriş kapısı:** Tüm sayısal claim'ler resmi/sürümlü kaynağa; hard constraint
  evaluator golden testli; teknik+pedagojik+safety review receipt; lisans kontrolü.
- **Başarı:** Bilinmeyen brief'te kullanıcıların ≥%80'i doğru aile shortlist'i,
  en az dört nicel gerekçe ve accuracy–repeatability ayrımını üretir. Ücretsiz üç
  görev; premium çoklu-vendor veri/rubrik/capstone yolu.

### 22.2 İkinci amiral gemisi — Robot Hücresi Capstone 2.0

`[YENİDEN TASARLA] [CLAUDE TARAFINDAN EKLENDİ]`

- **Ürün vaadi:** “Tek doğru cevabı seçme; rota, program, sensör ve güvenlik
  kararlarının birbirini bozduğu hücreyi test ederek devreye al.”
- **MVP:** Seed'li collision-checked planlama, gerçek komut trace'i, cycle/safety
  trade-off'u; başarısızlık→teşhis→düzeltme zorunlu; paylaşılabilir karar kaydı.
- **Giriş kapısı:** Sabit string/testler kaldırılmış, step skip/focus hatası
  çözülmüş, A–C dışı iddialar review edilmeden görünmüyor, 2B fallback aynı kanıtı
  veriyor.
- **Başarı:** Her tamamlanan koşu en az bir düzeltilmiş failure, üç geçen otomatik
  test ve bir transfer savunusu taşır; aynı seed aynı fixture'ı üretir. Premium
  değer çoklu vaka, ayrıntılı rapor ve öğretmen rubriğidir; kısa hücre ücretsizdir.

### 22.3 Üçüncü amiral gemisi — Arıza Kliniği ve Hata Müzesi

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Ürün vaadi:** “Doğru grafiği izlemenin ötesine geç; sınırlı gözlemle arızayı
  teşhis et, güvenli ilk eylemi seç ve hipotezini test et.”
- **MVP:** Bias, gecikme ve doygunluk; üç telemetry kanalı; hipotez/test bütçesi;
  anonim karşı örneklerden oluşan müze.
- **Giriş kapısı:** Deterministik model, açıklanmış varsayım, golden trace,
  safety review ve gerçek robota komut olmadığını kalıcı gösteren UI.
- **Başarı:** Yeni seed'lerde kök neden+güvenli ilk eylem ≥%75; yanlış güvenli
  eylem “başarı” sayılmaz. Bir vaka ücretsiz; alan/öğretmen paketleri premium.

### 22.4 Dört Mercekli Canlı Teknik Çizim

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Ürün vaadi:** “Robotun hareketini, matrisi, grafiği ve çalışan kodu aynı
  zamanda gör; tahmininle ölçüm arasındaki farkı geri sar.”
- **Rol:** Seçilen “İz Laboratuvarı / Canlı Teknik Çizim” görsel yönünün işlevsel
  imzasıdır; dekorasyon değil ortak run modelinin görünür kanıtıdır.
- **MVP/giriş kapısı:** Tek FK dersi, dört adapter, bir timeline, invariant test,
  mobil sekmeler ve veri tablosu; 3B performans bütçesi. Bağımsız hesap motorları
  veya video replay kabul edilmez.
- **Başarı:** Yeni pozda temsil transferi ≥%80; dört görünümde run/sample/birim/
  çerçeve uyuşmazlığı sıfır. Bir tam örnek ücretsiz; ileri karşılaştırmalı koşu
  paketleri premium olabilir.

### 22.5 Hesapsız Sınıf Operasyon Paketi

`[YENİDEN TASARLA] [MEVCUT FİKRİN GELİŞTİRİLMİŞ HALİ]`

- **Ürün vaadi:** “Öğretmen 30 cihazda hesap açtırmadan, aynı seed ve rubrikle,
  internet kesilse de ölçülebilir robotik deney yaptırır.”
- **MVP:** Üç ders, seed/QR, yerel export, süre planı, yanlış kavrama rehberi,
  imzalı offline manifest ve düşük donanım profili.
- **Giriş kapısı:** Öğrenci ücretsiz akışı güvenilir; veri minimizasyonu, ortak
  cihaz silme davranışı, lisans ve güncelleme politikası review edilmiş.
- **Başarı/ticaret:** 30 cihaz pilotunda ≥%95 görev başlatma ve öğretmen hazırlık
  süresinde ölçülmüş düşüş; beş öğretmenden ≥3 gerçek ders kullanımı, ≥2 bütçe
  görüşmesi. Ödeme sınıf operasyonu ve desteğe, temel içeriğe değildir.

## 23. Etki × efor × risk × bağımlılık backlog'u

Ölçek: etki 1–5; efor `S` birkaç gün, `M` yaklaşık 1–2 hafta, `L` 3–6 hafta,
`XL` çoklu sistem/6+ hafta; risk `D/O/Y` düşük/orta/yüksek. Süreler taahhüt değil,
tek küçük çapraz fonksiyonlu ekip için kaba karşılaştırmadır.

| ID | Karar ve sınıflandırma | Köken | Etki | Efor | Risk | Ana bağımlılık | Öncelik |
|---|---|---|---:|---:|---:|---|---|
| B-01 | İşveren/vendor kişisel anlatısını kaldır, yazarlık kuralını düzelt `[DÜZELT]` | Claude + doküman çelişkisi | 5 | S | D | Editoryal/gizlilik onayı | **P0** |
| B-02 | 10 stale dersin review rozetini geçersiz göster `[DÜZELT]` | Bu denetim | 5 | S–M | O | Geçici status kuralı | **P0** |
| B-03 | Hero doğru yönü gerçek endpoint delta'sından hesapla `[DÜZELT]` | Claude | 5 | S | D | Robotik fixture | **P0** |
| B-04 | Hero kontrolünü 390/768 ilk deney akışına taşı `[YENİDEN TASARLA]` | Claude | 5 | S–M | O | Responsive content order | **P0** |
| B-05 | MCQ→`passed` ve evidence inference'ını kes `[YENİDEN TASARLA]` | Claude | 5 | M | Y | Migration/semantik karar | **P0** |
| B-06 | Ana sayfa kapsam/kod/protokol vaadini 39 A–C yayına eşleştir `[DÜZELT]` | Claude | 5 | S | D | Ürün metni | **P0** |
| B-07 | Hassas terim, hero ve evidence regression kapıları `[YENİ]` | Bu denetim | 5 | M | D | B-01/03/05 | **P0** |
| B-07A | DLS dersinde analitik widget'ı nümerik koşu gibi sunmayı durdur `[DÜZELT]` | Bu denetim | 5 | S | D | Teknik metin/status | **P0** |
| B-08 | Logo/skip/live-region/answer-leak/focus erişilebilirliği `[DÜZELT]` | Bu denetim | 4 | M | D | E2E altyapısı | **P0** |
| B-09 | Türkçe loading/error/404/offline/storage durumları `[YENİ]` | Bu denetim | 3 | M | D | App shell | P1 |
| B-10 | Review Receipt + content/interaction/fixture hash `[YENİ]` | Bu denetim | 5 | L | Y | Kaynak schema, reviewer policy | P1 |
| B-11 | Yapılandırılmış claim/source/version/access schema `[DÜZELT]` | Geliştirilmiş | 5 | L | O | Teknik editör, license | P1 |
| B-12 | Learning Kernel v1 `[YENİDEN TASARLA]` | Geliştirilmiş | 5 | L | Y | Tip/model sözleşmesi | P1 |
| B-13 | Evidence v2 + yerel defter/export/delete `[YENİDEN TASARLA]` | Geliştirilmiş | 5 | L | Y | B-10/12, storage | P1 |
| B-14 | CodeRunner temiz worker/timeout/output sınırı `[DÜZELT]` | Bu denetim | 5 | M | Y | Pyodide worker tasarımı | P1 |
| B-15 | PlannerRace error/timeout/collision oracle `[DÜZELT]` | Bu denetim | 5 | M | O | Worker state machine | P1 |
| B-16 | Responsive/axe/keyboard/visual CI matrisi `[YENİ]` | Bu denetim | 4 | M | D | Playwright altyapısı | P1 |
| B-17 | 3B lazy 2B fallback ve TBT bütçesi `[DÜZELT]` | Bu denetim | 4 | L | O | Bundle ölçümü | P1 |
| B-18 | Homojen dönüşüm dikey yeniden tasarım `[YENİDEN TASARLA]` | Bu denetim | 5 | L | O | B-12/13, frame fixtures | P1 |
| B-19 | Nümerik IK–DLS dikey yeniden tasarım `[YENİDEN TASARLA]` | Bu denetim | 5 | L | Y | Referans solver/fixtures | P1 |
| B-20 | Gerçek C-space dikey yeniden tasarım `[YENİDEN TASARLA]` | Bu denetim | 5 | L | Y | FK/collision oracle | P1 |
| B-21 | İlk üç kod pilotu: blok/koşul, Python trace ve NumPy/çerçeve `[YENİ]` | Bu denetim | 5 | XL | Y | B-14, B-18 ve frame fixtures | P1 |
| B-22 | Türkçe bilgi grafiği v1 `[DÜZELT]` | Geliştirilmiş | 4 | M | O | Review edilmiş edge'ler | P1 |
| B-23 | Seed'li sürümlü paylaşılabilir state `[DÜZELT]` | Geliştirilmiş | 4 | M | O | B-12, schema migration | P2 |
| B-24 | Birim ve Çerçeve Dedektifi `[YENİ]` | Bu denetim | 5 | L | O | AST/frame type modeli | P2 |
| B-25 | Robot Seçim Masası `[YENİ]` | Bu denetim | 5 | L | Y | Datasheet, safety review | P2 |
| B-26 | Capstone 2.0 gerçek evaluator'ları `[YENİDEN TASARLA]` | Claude + geliştirilmiş | 5 | XL | Y | B-12/13/15 | P2 |
| B-27 | Arıza Kliniği/Hata Müzesi `[YENİDEN TASARLA]` | Geliştirilmiş | 5 | L | O | Telemetry/fault model | P2 |
| B-28 | Aynı deneyde derinlik katmanları `[DÜZELT]` | Geliştirilmiş | 4 | L | O | İlk dikey dilimler | P2 |
| B-29 | Kontrollü PID ve filtre içerik genişletmeleri `[YENİ]` | Bu denetim | 4 | L–XL | Y | N1/Lab 4 kapısı + uzman review | P2 |
| B-30 | Şartnameden Otomatik Teste Stüdyo `[YENİ]` | Bu denetim | 5 | L | Y | B-14/20 | P2 |
| B-31 | Pareto Hücre Tasarımı `[YENİ]` | Bu denetim | 4 | M | O | B-25 veri modeli | P3 |
| B-32 | Kalibrasyon Belirsizlik Bütçesi `[YENİ]` | Bu denetim | 4 | L | Y | NumPy/fixture review | P3 |
| B-33 | Protokol Zaman Çizgisi/temporal assertion `[YENİDEN TASARLA]` | Geliştirilmiş | 5 | L | Y | D/E/F review, event engine | P3 |
| B-34 | Vendor Rosetta/MoveIntent `[DÜZELT]` | Geliştirilmiş | 4 | L | Y | Lisans, sürümlü kılavuz | P3 |
| B-35 | Hesapsız/offline sınıf paketi `[YENİDEN TASARLA]` | Geliştirilmiş | 5 | XL | Y | B-13, lisans, SW/BT | P3 |
| B-36 | Öğretmen/premium gerçek talep pilotu `[YENİ]` | Bu denetim | 4 | M | O | Güvenilir ücretsiz çekirdek | P3 |
| B-37 | `CompleteLessonButton` + `lib/progress` eski modeli tek evidence API'de birleştir/kaldır `[BİRLEŞTİR/KALDIR]` | Bu denetim | 3 | S–M | O | B-05/B-13 migration | P1 |
| B-38 | Protected `main`, required check ve doğrulanmış release/tag yönetişimi `[YENİ]` | Bu denetim | 4 | S | O | Repo admin yetkisi | P1 |
| B-39 | CSP `unsafe-inline`/`wasm-unsafe-eval` kapsamını route/worker ihtiyacına daralt `[DÜZELT]` | Bu denetim | 4 | M | Y | Report-only gözlem, Pyodide testi | P2 |

Backlog kararı: P2/P3'ten hiçbir madde, B-01–B-08 kapanmadan vitrin önceliği
alamaz. B-18–B-20 üç yayınlı dikey dilimi ve B-21 seçili üç kod pilotunu kendi
kabul kapılarında doğrulamadan D–H'deki 50 draft için toplu yayın işi açılmaz.

## 24. Her aşama için ölçülebilir kabul kriterleri

### Aşama 0 — Doğruluk ve güven acili (P0)

- Hero q1 sınırları dahil parametre uzayındaki fixture'larda ekrandaki hareket,
  sayısal delta ve feedback yönü %100 aynı; tolerans bölgesi açıkça “yaklaşık aynı”
  sonucuna sahip.
- Yayınlı içerik ve yazarlık belgelerinde yasak işveren/özel proje ifşası sıfır;
  silinen iddia yeni bir review tarihiyle aklanmıyor.
- `b-universite-ters-kinematik` canlı yüzeyi analitik 2-DOF çözümünü DLS/nümerik
  koşu diye sunmuyor; tam DLS motoru ve fixture gelene dek etkileşim illüstrasyon
  olarak etiketli, teknik review gerekli ve performans kanıtı üretemiyor.
- 10 stale yayın “yayınlanan sürüm insan incelemeli” göstermez; otomatik ve insan
  review ayrıdır.
- Transfer MCQ'su tek başına `tried/passed` üretmez; evidence unit test matrisi
  bütün olay kombinasyonlarını ve eski veriyi kapsar.
- Ana sayfadaki her içerik/kod/protokol claim'i tıklanabilir yayın kanıtına bağlı.
- `npm test`, lint, typecheck, içerik/graph/quiz/MDX kapıları ve build geçer.

### Aşama 1 — İlk 10 saniye, 30 saniye ve 2 dakika

- **10 saniye:** İlk viewport şu cümleyi ve işlevsel kanıtını taşır: “Robot
  hareketini tahmin et, ölçümle karşılaştır, nedenini bul.” Kod CTA'sı ancak
  review edilmiş CodeRunner dersi yayın manifestine girince eklenir. 390/768/1440'ta
  vaat ve sahne görünür; kullanıcı bunun ders arşivi değil deney laboratuvarı olduğunu
  moderatör yardımı olmadan doğru söyler (persona başına en az 5, toplam ≥30
  kullanıcıda ≥%80).
- **30 saniye:** Kullanıcı omuz/eklem açısını değiştirir, yukarı/aşağı/aynı tahmini
  commit eder, çalıştırır ve iz + `Δx/Δy` + doğru feedback görür. Tamamlama oranı
  ≥%85; yanlış fizik feedback'i 0; keyboard ve reduced-motion eşdeğer.
- **2 dakika:** Birleşik amaç+derinlik yönlendiricisi kullanıcıyı uygun yayınlı
  ilk göreve götürür; hero sonrası tek CTA, hero atlanırsa en çok iki eylem;
  görev başlatma median ≤120 sn ve ≥%90 başarı. “Seviyeni seç” tek başına
  ortaokula yönlenmez.
- 390/768/1440 ana, seviye, hat, ders ve deneyde horizontal overflow 0; axe
  kritik/ciddi 0; focus kaybı 0.

### Aşama 2 — Öğrenme ve kalite çekirdeği

- Ortak `ExperimentRun` en az hero, FK ve PlannerRace'te kullanılır; aynı seed ve
  model sürümü aynı sonucu üretir.
- Outcome→Action→Observable→Success→Feedback→Transfer zinciri üç pilotta linter ve
  insan review ile eksiksiz; illustration'lar kanıt yazamaz.
- Evidence olayları bağımsız, versioned ve replay edilebilir; export/delete/storage
  fallback testli; yanlış pozitif performans kanıtı 0.
- Review hash'i içerik/interaction/fixture değişiminde doğru scope'u invalid eder;
  AI/CI human receipt üretemez.
- CodeRunner sonsuz döngü, namespace sızıntısı, çok büyük çıktı, NaN ve yanlış
  shape testlerinde kontrollü fail verir.
- 3B ders mobil Performance ≥90/TBT <300 ms; 2B fallback aynı öğrenme predicate'ini
  geçirir.

### Aşama 3 — Üç yayınlı ders ve üç kod laboratuvarı pilotu

- Homojen dönüşümde öğrenci `R·T` ile `T·R` farkını sahne ve 4×4 matris üzerinde
  ölçer, yanlış frame karşı örneğini teşhis eder ve matris/sahne/kod invariant'ı
  geçer.
- Nümerik IK'de anlatılan DLS gerçekten çalışır; iteration trace, yakınsamayan/
  unreachable/singularity vakaları ve referans fixture'lar görünür; analitik çözüm
  “nümerik koşu” gibi sunulmaz.
- C-space'te eklem açıları ile workspace pozu gerçekten birlikte hareket eder;
  C-obstacle raster'ı FK+collision oracle'dan üretilir; ±180° komşuluğu, limit ve
  ikinci engel transferi geçer. Workspace noktası C-space diye sunulmaz.
- Kod ilerlemesi yaşa göre kademelidir: ortaokul Lab 1 basamak 1–6+transfer;
  lise Lab 2 basamak 1–9 ve en az bir edge test; üniversite Lab 4 basamak 1–11,
  şartname ve sayısal hata/performance değerlendirmesi. Küçük fonksiyon ortaokul
  blok laboratuvarına zorla eklenmez.
- Her pilotun sayısal fixture'ı CI'da çalışır ve kaynak+teknik+pedagojik receipt'i
  vardır; transfer başarısı kör yeni problemde ≥%70.

### Aşama 4 — Amiral gemisi pilotları

- Robot Seçim Masası üç görevde en az iki savunulabilir aday ve ölçülü yanlış seçim
  failure'ı üretir; tüm gerçek sayılar resmi belge/revizyon/sayfaya izlenir.
- Capstone her tamamlamada en az bir düzeltilmiş hata, collision-checked rota, gerçek
  program trace'i ve safety/cycle trade-off kanıtı taşır; step skip ve `0 mm/s`
  sahte geçiş yoktur.
- Arıza Kliniği üç bilinmeyen seed'de kök neden ve güvenli ilk eylem ölçer; model
  sınırı/simülasyon etiketi kalıcıdır.
- Dört Mercek'te dört temsil tek örnek akışından gelir; mobilde tam işlevli; görsel
  fark öğrenme metriğine dönüşür.
- Pilotlarda görev tamamlama ≥%70, transfer ≥%70, teknik yanlış pozitif 0 ve ciddi
  erişilebilirlik ihlali 0 olmadan ölçeklenmez.

### Aşama 5 — Sınıf ve premium doğrulaması

- Ücretsiz çekirdek Aşama 1–4 kalite kapılarını korur; ücretsiz export/silme,
  kaynak, erişilebilirlik ve bir tam deney geri alınmaz.
- Offline paket temiz cihazda uçak modunda üç dersi, kanıtı ve export'u çalıştırır;
  30 cihaz pilotunda ≥%95 başlatma.
- En az beş öğretmenden üçü paketi gerçek derste kullanır; en az ikisi somut bütçe/
  satın alma sürecine girer; median hazırlık süresi paketsiz baseline'a göre ≥%30
  azalır.
- Premium görüşmesinde kullanıcıların ≥%70'i satın alınan değeri “daha fazla ders”
  değil en az bir somut üretim imkânıyla (test paketi, rubrik, capstone, offline,
  vaka verisi) doğru ifade eder.
- Fiyatlandırma, retention veya dönüşüm hedefi ancak bu davranışsal kanıttan sonra
  konur; bu denetim fiyat önermez.

## 25. Yalnız beş şey yapılacaksa karar

1. **Güven iddiasını doğrula:** İşveren/özel proje ifşasını kaldır, çelişkili
   yazarlık kuralını düzelt ve content/interaction hash'e bağlı, kapsamı ayrılmış
   review receipt kur. 10 stale dersi dürüstçe işaretle.
2. **İlk 30 saniyeyi fiziksel olarak doğru ve mobilde erişilir yap:** Hero doğru
   sonucu gerçek endpoint değişiminden çıkarsın; eşik durumunu ölçsün; 390/768'de
   tahmin kontrolü ilk deney akışında olsun.
3. **Rozet yerine kanıt üret:** MCQ'nun performans başarısı yazmasını durdur;
   Learning Kernel + Evidence v2 ile tahmin, koşu, ölçüm, düzeltme ve transferi
   sürümlü ayrı olaylar yap.
4. **50 draft'ı beklet, üç dikey dilimi bitir:** Homojen dönüşüm, gerçek nümerik
   IK/DLS ve C-space'i; ardından seçilen blok/koşul, Python trace ve
   NumPy/çerçeve kod pilotlarını otomatik fixture ve insan teknik/pedagojik review
   ile amiral örnek yap.
5. **Farklılaştırıcı ilk ürünü doğru temel üzerinde çıkar:** Seçilen **İz
   Laboratuvarı / Canlı Teknik Çizim** dilinde Robot Seçim Masası'nı üç görevle
   pilotla; ücretsiz anlamlı çekirdeği koru, premium'u sürümlü vaka/rubrik/capstone
   üretim imkânına bağla.

Bu beş karar ilk 10 saniye değerini, ilk 30 saniye deneyini, iki dakikalık görevi,
öğrenme kanıtını, teknik güveni ve gelecekteki ödeme nedenini aynı omurgada çözer.
Yeni renk paleti veya ders sayısı bu omurganın yerine geçemez.

## 26. Bir sonraki uygulama turu için hazır görev promptu

Aşağıdaki prompt P0 uygulama turu için kopyalanabilir. Bu rapordaki P2/P3
özellikleri aynı tura gizlice eklenmemelidir.

```text
ROL
Bu repoda ürün güveni ve ilk deney için P0 uygulama turunu yürüt. Kıdemli
frontend, robotik doğruluk, öğretim tasarımı, erişilebilirlik ve içerik güveni
rollerini bağımsız kontrol kolları olarak kullan.

ÖNCE OKU
Kökteki CLAUDE.md ve AGENTS.md; docs/00-vizyon.md, 02-mimari.md,
04-icerik-rehberi.md, 05-deneyim-ve-guvenlik.md, 06-kalite-ve-topluluk.md,
07-tasarim-sistemi.md, 08-guvenlik-sertlestirme.md, 09-ai-muhendisligi.md,
11-yazarlik-kalitesi.md ve docs/guncel-fikirler.md bölümleri 4, 5, 18–25.
Git status/diff/history'yi incele; kullanıcı/ajan değişikliklerini koru. Stage,
commit, reset veya checkout yapma.

KAPSAM — YALNIZ P0
1. Gizlilik ve review doğruluğu
   - b-universite-jacobian.mdx içindeki kişisel işyeri ve vendor modeli deneyim
     iddiasını, teknik kazanımı koruyan vendor-neutral ve kaynaklı anlatımla değiştir.
   - docs/11-yazarlik-kalitesi.md içindeki kişisel işveren/özel proje teşvikini
     docs/00-vizyon.md mutlak gizlilik kuralıyla uyumla.
   - İnsan okumadan incelendi_tarih veya reviewer adını güncelleme. İçerik gövdesi
     review tarihinden sonra değişen 10 dersi en azından UI'da “yeniden inceleme
     gerekli” gösterecek deterministik bir geçiş çözümü kur; otomatik kontrolü
     insan incelemesi diye gösterme.
   - Review Receipt tam mimarisini bu turda kurabiliyorsan contentHash ve scope ile
     kur; kuramıyorsan ileri mimariyi taklit eden sahte receipt üretme, açık migration
     borcu ve test bırak.
   - b-universite-ters-kinematik DLS/nümerik yakınsama anlatırken analitik 2-DOF
     IkTarget'ı çalıştırılan yöntem gibi sunmasın. Tam DLS yeniden tasarımı bu turun
     dışında kalabilir; bu turda doğru “analitik illüstrasyon / teknik yeniden
     inceleme gerekli” sınırını koy, bu widget'tan performans evidence üretme.

2. Hero matematiği ve mobil ilk deney
   - components/home/HeroExperiment.tsx içinde doğru cevabı hard-code etme. Aynı
     forward-kinematics modelinin before/after endpoint ölçümünden, ekran/world
     ekseni açıkça dönüştürülerek türet; epsilon ile “yaklaşık aynı” durumunu işle.
   - q1=55°, 58° ve sınır çevresi dahil parametrik unit test ekle; feedback, iz ve
     sayısal delta aynı sonucu söylemeli.
   - 390×844 ve 768×1024'te vaat+sahne+tahmin kontrolünü ilk anlamlı deney akışına
     al. Masaüstü kompozisyonu koru; controls DOM sırası ve keyboard akışı mantıklı
     olsun. prefers-reduced-motion için adımlı sonuç ver.

3. Evidence yanlış pozitiflerini kes
   - components/interactive/TransferChallenge.tsx doğru çoktan seçmeli cevabının
     tek başına performans passed üretmesini durdur.
   - lib/evidence.ts içinde read, predicted, tried, passed ve transferred evrelerini
     birbirinden türetme; yalnız gerçek olay/predicate ile kaydet.
   - Eski localStorage verisini crash veya sessiz yeni başarı üretmeden “eski kanıt
     modeli” olarak ele al. Öz-beyan ile otomatik performans kanıtını UI'da ayır.
   - LessonCompletionPanel ve ilgili provider metinlerini yeni semantiğe uyarla.

4. P0 erişilebilirlik regresyonları
   - Mobil logo bağlantısına doğru erişilebilir ad; bütün route'larda gerçek
     main#ana-icerik skip hedefi; PredictionPrompt doğru açıklamasını run observable
     oluşana kadar erişilebilir ağaçtan çıkar; dinamik feedback live region;
     capstone adımında odak kaybını
     düzelt. Değişen yüzeyler için keyboard/axe testleri ekle.

5. Yayın kapsamıyla dürüst ana sayfa
   - A–C'deki 39 yayın ve sıfır yayınlı CodeRunner gerçeğine uymayan Python,
     gerçek protokol ve dört disiplin claim'lerini kaldır/daralt. Kopyayı yayın
     manifestinden türet; review edilmiş gerçek route yoksa “kodla dene” CTA'sı
     gösterme. “Seviyeni seç”i sessizce ortaokula göndermeyi bırak; en küçük güvenli
     çözüm birleşik amaç+derinlik seçimiyle yayınlı bir göreve en fazla iki eylemdir.

SINIRLAR
- Yeni ders, premium ekran, analytics, hesap sistemi veya görsel redesign ekleme.
- Simülasyonu gerçek robot kontrolü gibi sunma. İşveren, özel proje veya kişisel
  deney uydurma. İnsan review kaydı üretme.
- Mevcut doğrulanmış tasarım tokenlarını ve kullanıcı değişikliklerini koru.
- Yeni bağımlılık ancak mevcut araçlarla güvenli çözüm mümkün değilse ve gerekçesi
  kanıtlanırsa eklenebilir.

KABUL
- Hero fixture'larının tamamında gerçek hareket=feedback=delta; 390/768/1440
  screenshot/DOM testlerinde taşma yok ve mobil etkileşim erişilir.
- Sahne çalıştırmadan hiçbir performans passed/tried oluşmaz; evidence kombinasyon,
  migration ve storage-failure testleri geçer.
- 10 stale ders yeşil “yayınlanan sürüm insan incelemesi” iddiası taşımaz; hassas
  işveren/özel proje ifşası yayınlı içerik ve yazarlık örneğinde sıfırdır.
- DLS dersi analitik çözümü nümerik koşu diye sunmaz ve gerçek DLS fixture gelmeden
  bu kazanım için performance `passed` üretemez.
- Axe kritik/ciddi sıfır; keyboard ana→hero→ders akışı ve focus assertion geçer;
  PredictionPrompt doğru açıklaması run observable oluşmadan screen-reader
  snapshot'ında yoktur; sonuç sonrası görsel metinle aynı anda görünür.
- Ana sayfadaki kapsam iddiaları gerçekten yayınlı rotalara dayanır.

DOĞRULAMA
npm test
npm run lint
npx tsc --noEmit
npm run check-content
npm run validate-content-graph
npm run check-quiz-dagilimi
npm run check-mdx-guvenlik
npm run build
Ayrıca 390, 768 ve 1440 Playwright/axe/keyboard kontrolleri ile hero/evidence
parametrik testlerini çalıştır. Production'ı değiştirme/deploy etme; sonuçta
değişen dosyaları, testleri, kalan riskleri ve insan review gerektiren noktaları
kanıtlarıyla bildir.
```
