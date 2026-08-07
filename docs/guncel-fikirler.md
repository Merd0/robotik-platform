# Güncel ürün ve tasarım master planı

> **Analiz tarihi:** 6 Ağustos 2026, Europe/Istanbul  
> **Yerel inceleme:** `p0-kalan-duzeltmeler`, commit `18c39c7` (`Quiz sik yanliligi ve MDX AST allowlist`)  
> **GitHub `main`:** `26b040f` — yerel P0 branch'inden ve canlı deployment'tan geride  
> **Canlı production:** [robotik-platform.vercel.app](https://robotik-platform.vercel.app/), 6 Ağustos 2026 16:09:24 GMT yanıtı; ETag `40fdf3c757d24f14e90c7c3da88f3fc1`, Vercel isteği `fra1::4rsh2-1786032827799-e3ac5a7c7dde`. Vercel yanıtı Git SHA vermediği için deployment commit'i kesin eşlenemedi.  
> **Ayrı Codex branch'i:** `codex-p1-erisilebilirlik`, commit'ler `1d49dfb` ve `8b03979`; mobil/erişilebilirlik, seviye teması, CODEOWNERS/Dependabot ve harici denetim belgesi burada, fakat mevcut branch/GitHub main/canlı production'da değil.  
> **Kapsam:** 1440×900 masaüstü ve 390×844 mobil canlı test; ana sayfa, seviye sayfası, arama, ortaokul ve üniversite dersleri, Jacobian ve PlannerRace etkileşimleri; 89 MDX ders, 139 soru, uygulama bileşenleri, ürün/tasarım/güvenlik dokümanları, GitHub ve HTTP yüzeyi.  
> **Bu turda değişiklik:** Yalnızca bu rapor oluşturuldu; uygulama kodu, içerik, yapılandırma ve diğer kullanıcı değişiklikleri değiştirilmedi.

**Durum etiketleri:** `[UYGULANDI]` mevcut branch veya production'da doğrulandı; `[BRANCH'TE]` ayrı branch'te hazır ama yayınlanmadı; `[BELGEDE VAR]` daha önce belgelenmiş fikir; `[YENİ]` bu denetimde üretilen karar/fikir.

---

## 1. Yönetici özeti ve temel ürün teşhisi

Acımasız ama adil teşhis: altyapı, matematik motoru ve içerik disiplini bir hobi projesinden belirgin biçimde daha iyi; ancak kullanıcının gördüğü ürün hâlâ bu değeri saklayan, 672 px'lik dar bir metin kolonunda 39 bağlantı sıralayan bir dokümantasyon sitesi gibi davranıyor. Canlı robot kolu, gerçek planlayıcılar, Pyodide, seviye kademesi, kaynak doğrulaması ve gizlilik yaklaşımı ürünün asıl sermayesi olmasına rağmen ana sayfada tek canvas, hareket, görev veya sonuç yok; seviye sayfası A1→B1→C1→A2 diye pedagojik sırayı karıştırıyor; ders tamamlama öğrencinin kendine “tamamladım” demesinden ibaret; kaynaklar ve inceleme kanıtı arayüzde görünmüyor. Sonuçta platform “ne kadar çok şey yaptığı” ile “ilk 30 saniyede ne kadar değer hissettirdiği” arasında büyük bir uçurum taşıyor. Öncelik daha fazla ders değil: ana sayfada anında neden-sonuç gösteren hafif bir laboratuvar, hat-temelli öğrenme yolu, standart görev kanıtı ve bir adet kusursuz çapraz-hat capstone dikey dilimi. Bunlar yapılırsa ürünün cevabı net olur: **sıradan içerik sitesi bir kavramı anlatır; bu ürün aynı kavramı tahmin ettirir, çalıştırır, ölçer, yanlış modeli görünür kılar ve kullanıcıya yaptığı işi kanıt olarak geri verir.**

### Denetimin sayısal fotoğrafı

| Gözlem | Gerçek durum | Ürün anlamı |
|---|---:|---|
| Ders korpusu | 89 dosya; 39 yayın, 50 taslak | Kapsam güçlü, fakat ziyaretçi canlıda yalnız A-C hatlarını görebiliyor. |
| Alıştırma | 139 soru; 45 ders tek sorulu, 5 ders sorusuz | Genişlik var, ölçme gücü ve transfer kanıtı zayıf. |
| İçerik medyanı | Ortaokul 271, lise 328, üniversite 542 kaba kelime; medyan 1 etkileşim | Seviye farkı metin miktarında var, görev derinliğinde tutarlı değil. |
| Kaynak | Medyan ortaokul/lise 1, üniversite 2 | Güven üretme hammaddesi var; kullanıcıya gösterilmiyor. |
| Ana sayfa | 1440 px ekranda 672 px ana kolon; 0 canvas; 44 bağlantı | Masaüstünde büyük boşluk, ilk ekranda ürün kanıtı yok. |
| Mobil | Ana sayfa taşmıyor; çok sayıda ders bağlantısı 19-43 px yükseklikte | Temel responsive var; tek elle kullanım ve 44 px tabanı tutarsız. |
| 3B performans | Proje denetiminde 3B'siz sayfalar 98-99, 3B'li ders 73-76 | 3B yalnız anlam ürettiği yerde kullanılmalı; ilk ekran 2B olmalı. |
| Canlı güven yüzeyi | Taslak D dersi 404 `[UYGULANDI]`; `robots.txt`, `sitemap.xml`, `manifest.json` 404 | En kritik sızıntı kapanmış; keşfedilebilirlik ve profesyonel yayın yüzeyi eksik. |

---

## 2. Mevcut güçlü yönler — mutlaka korunmalı

1. **Gerçek, istemci tarafı robotik motoru.** Kaydırıcıya klavyeyle bir kez basıldığında eklem değeri 0°→1° aynı anda değişti; PlannerRace gerçek A*/RRT/RRT* sonuç tablosu üretti. Bu “etkileşimli görünümlü içerik” değil, gerçek hesaplama. Görsel yeniden tasarım motoru dekoratif bir demo seviyesine düşürmemeli.
2. **Kurulumsuz ve hesapsız mimari.** Statik export, tarayıcı içi hesaplama ve localStorage; çocuklardan kişisel veri toplamama kararı hem etik hem ticari olarak güven yaratıyor. Premium plan bu çekirdeği bozacak hesap zorunluluğu getirmemeli.
3. **Türkçe + üç seviye + endüstriyel gerçeklik kesişimi.** Modern Robotics akademik olarak güçlü, RoboDK/UR Academy ürün ve endüstri uygulamasında güçlü, The Construct tarayıcı laboratuvarında güçlü; bu proje ise aynı yerde Türkçe, yaşa göre derinlik ve cross-vendor kavram öğretimini birleştirebilir. Bu konum korunmalı ve görünür yapılmalı.
4. **Kaynak ve insan incelemesi disiplini.** Frontmatter, yayın durumu, kaynak zorunluluğu, inceleme kaydı ve taslakların production dışında tutulması güvenilir bir temel. `[UYGULANDI]` Canlıda taslak `d-universite-mecademic-python` artık 404.
5. **Açık kaynak ve içerik/kod ayrımı.** MDX korpusu, saf `lib/robotics/`, MIT + CC BY-SA ayrımı ve katkı rehberi sürdürülebilirlik avantajı. Bu, öğretmen ve üniversite iş birliklerinde gerçek bir satış/güven argümanı olabilir.
6. **Arama ve sözlük çekirdeği.** Mobil aramada “tekillik” sorgusu anında dört anlamlı sonuç, hat/seviye/süre ve bağlam parçası verdi. Sözlükte 72 terim var. Bunlar bilgi grafiği için iyi bir başlangıç.
7. **Yanlış cevap tonunun cezalandırıcı olmaması.** “Yanlış” yerine “Şuna dikkat et” dili doğru. Sorun ton değil; açıklamanın ilk denemede cevabı fazla açması.
8. **İmza öğesi için doğru fikir.** İz çizgisi favicon'da ve 3B sahnelerde var. Kimlik sıfırdan icat edilmeyecek; bu işlevsel motifi ürünün omurgasına taşımak gerekiyor.
9. **Test ve içerik kapıları.** 89 ders içerik ve graph kontrolünden geçiyor; şık konumu yerel branch'te kararlı karıştırmayla dengelenmiş; MDX allowlist ve planlayıcı regresyonları P0 branch'lerinde çözülmüş. Ürün cila çalışması bu doğruluk tabanını gevşetmemeli.
10. **Bazı üniversite derslerinde doğru deney zihniyeti.** PlannerRace “varsayımla değil deneyle cevapla” diyor ve çalıştırma sonrası süre, düğüm ve yol uzunluğu üretiyor. Aranan öğrenme modelinin tohumu zaten var.

### Rakip bağlamı — konumu doğru kurmak için

- [Modern Robotics](https://hades.mech.northwestern.edu/index.php/Modern_Robotics) ücretsiz kitap/MOOC ve capstone ile akademik derinlikte ölçüt; fakat ilk saniyede kurcalanan, yaşa göre katmanlanan Türkçe mikro-lab değil.
- [RoboDK Academy](https://robodk.com/academy) hands-on simülasyon projeleri ve sertifika sunuyor; ders kabuğu web'de olsa da temel akış RoboDK indirmeyi ve ürün ortamını öğrenmeyi istiyor.
- [Universal Robots Academy](https://academy.universal-robots.com/) gerçek görev ve simulator training sunuyor; güçlü ama hesaplı ve vendor-merkezli.
- [The Construct](https://www.theconstruct.ai/home/) tarayıcı içi ROS simülasyonu, öğrenme yolları ve ücretli planlar sunuyor; güçlü referans, fakat ROS/ileri kullanıcı odağı ve hesap/abonelik modeli bu projenin hesapsız Türkçe kavram laboratuvarından farklı.

Bu tablo “rakiplerde hiç etkileşim yok” gibi yanlış bir iddiayı engeller. Savunulabilir fark: **hesapsız + Türkçe + ortaokuldan mühendise aynı kavram omurgası + cross-vendor + yerel kanıt üretimi.**

---

## 3. Kullanıcıların “vay be” demesini engelleyen en önemli 10 problem

### 3.1 İlk ekran iddiayı kanıtlamıyor — P0 ürün

- **Problem/fırsat:** Ana sayfada 0 sahne ve 0 görev var; kullanıcı “tarayıcıda oynayarak” vaadini yalnız metinden okuyor.
- **Etkisi/değeri:** İlk 30 saniye ders dizini izlenimi veriyor; YouTube/PDF'den neden üstün olduğu anlaşılmıyor.
- **Somut çözüm:** Ana sayfanın üst katına 2-DOF SVG “Tahmin et → oynat → farkı gör” mini deneyi; aşağıya “Bu neden oldu?” ve seviyeye göre başlangıç CTA'sı.
- **Sayfa/bileşen:** `/`, yeni `HeroExperiment`, mevcut `forwardKinematics`.
- **Teknik yaklaşım:** WebGL yok; erişilebilir SVG, iki 44 px tahmin düğmesi, range/arrow desteği, tek reducer durum makinesi.
- **Risk/bağımlılık:** Hero'nun oyuncağa dönüşmesi; çözüm, sonucu koordinat ve iz çizgisiyle öğretici bağlamak.
- **Kabul kriteri:** İlk boyamadan ≤1,5 sn sonra hazır; ek gzip JS ≤25 KB; 8 kişilik testte 6 kişi yönlendirme olmadan 10 sn içinde ilk deneyi yapar ve “açı değişince uç konum değişti”yi söyler.
- **Öncelik:** P0.

### 3.2 Öğrenme yolu hatlar arasında karışıyor — P0 öğrenme

- **Problem/fırsat:** Canlı ortaokul sayfası A1→B1→C1→A2→B2→C2 sıralıyor; hat başlığı, hedef, ön koşul özeti veya geri dönüş yok.
- **Etkisi/değeri:** Öğrenci nereden başlayacağını, neyi tamamladığını ve bir sonraki anlamlı adımı bilemiyor.
- **Somut çözüm:** Seviye→Hat→Ders hiyerarşisi; her hat kartında kazanım, süre, yayınlanan/planlanan ders, yerel ilerleme; serbest gezinme korunur.
- **Sayfa/bileşen:** `/seviye/[seviye]`, yeni `/hat/[hat]?seviye=...`, `TrackCard`, `PathRail`.
- **Teknik yaklaşım:** `getLessonsByLevel` global `sira` sıralamasını bırakır; `(hat, seviye, sira)` gruplar. Sonraki önerisi graph + hat sırası üzerinden hesaplanır.
- **Risk/bağımlılık:** 50 taslağı yanlışlıkla görünür yapmak; yalnız yayın sayısı göster, taslak slug/link üretme.
- **Kabul kriteri:** Aynı hat içindeki sıra kesintisiz; hiçbir yayın kartı 404'e gitmez; kullanıcı bir seviyeden iki tıkta seçtiği hatta ve ilk derse ulaşır.
- **Öncelik:** P0.

### 3.3 “Tamamlandı” öğrenme kanıtı değil — P0 ürün çekirdeği

- **Problem/fırsat:** `CompleteLessonButton` tek tıklamayla localStorage'a slug yazıyor; sahne/quiz/görev sonucu ile bağlantısı yok.
- **Etkisi/değeri:** İlerleme işareti güvenilmez; portföy, öğretmen paketi ve premium rapor için temel oluşmuyor.
- **Somut çözüm:** Üç ayrı durum: `okundu`, `denendi`, `ölçüt karşılandı`; manuel düğme yalnız `okundu` işaretler, başarı bileşen olayından türetilir.
- **Sayfa/bileşen:** Tüm interaktifler, `CompleteLessonButton`, `LessonProgressBadge`, `lib/progress.ts`.
- **Teknik yaklaşım:** `onEvidence({lessonId, skillId, result, metrics, attempts, seed, version})`; sürümlü yerel kayıt ve JSON dışa aktarım.
- **Risk/bağımlılık:** Her sahneye farklı özel mantık yazmak; önce ortak `EvidenceEvent` ve yalnız amiral gemisi 6 derste pilot.
- **Kabul kriteri:** Kullanıcı görevi yapmadan “başarı” alamaz; kayıtlar offline çalışır; içerik veya ölçüt sürümü değişince eski kanıt “eski sürüm” olarak görünür, sessizce geçerli sayılmaz.
- **Öncelik:** P0.

### 3.4 Ders döngüsü çoğunlukla “sahne → metin → tek soru” — P0 öğrenme

- **Problem/fırsat:** 45 ders tek sorulu; ilk yanlışta verilen `aciklama` çoğu zaman tam gerekçeyi açıyor; transfer ve yeniden deneme durumu standart değil.
- **Etkisi/değeri:** Öğrenci kurcalıyor ama önce tahmin kurmadığı için sürpriz ölçülmüyor; başarı sahneye bağlanmıyor.
- **Somut çözüm:** Her ders için Merak→Tahmin→Deney→Gözlem→Açıklama→Transfer→Kanıt şablonu; ilk yanlış ipucu, ikinci yanlış/kabul sonrası açıklama.
- **Sayfa/bileşen:** MDX şeması, `QuizSorusu`, `LabFrame`, içerik linter.
- **Teknik yaklaşım:** `attemptCount`, `hint`, `explanation`, `criterion`; transfer görevi ilk deneyden farklı parametre/robot/engel kullanır.
- **Risk/bağımlılık:** 89 dersi topluca yeniden yazmak; önce 6 derslik dikey dilim, sonra yayınlanan derslerde risk bazlı dönüşüm.
- **Kabul kriteri:** Pilot derslerin her birinde tahmin kaydı, en az iki deneme hakkı, gözlem metriği, farklı koşullu transfer ve makinece doğrulanmış kanıt var.
- **Öncelik:** P0.

### 3.5 Görsel kimlik belgede var, üründe hissedilmiyor — P1 tasarım

- **Problem/fırsat:** Tüm canlı sayfalar sıcak beyaz + turkuaz + aynı dar kolon; üniversite sayfasının hesaplanan arka planı da ortaokul rengi. CSS font adları var ama font dosyası/import yok; sistem fallback olası. İz çizgisi yalnız favicon/sahnede.
- **Etkisi/değeri:** Ortaokul/lise/üniversite farklı derinlikte görünmüyor; marka jenerik utility-CSS hissi veriyor.
- **Somut çözüm:** Seçilen “İz Laboratuvarı” token sistemi; self-hosted değişken sans + mono; iz çizgisini ilerleme ve deney geçmişi olarak işlevsel kullanma.
- **Sayfa/bileşen:** `layout`, global header/footer, tüm sayfa shell'leri, kart/panel token'ları.
- **Teknik yaklaşım:** `[data-seviye]` CSS değişkenleri, ortak `PageShell`, font subset; ayrı branch'teki `seviyeTheme.ts` başlangıç kabul edilir `[BRANCH'TE]`.
- **Risk/bağımlılık:** Üç ayrı ürün hissi; geometri, spacing ve component API aynı kalır, yalnız doygunluk/yoğunluk/etiket dili değişir.
- **Kabul kriteri:** Renk kapatıldığında bile seviye başlık/yoğunluk farkı anlaşılır; WCAG AA; 3 sayfada görsel regression; font isteği üçüncü tarafa gitmez.
- **Öncelik:** P1.

### 3.6 Masaüstünde laboratuvar değil uzun makale; mobilde hedefler tutarsız — P1 UX

- **Problem/fırsat:** 1440 px ekranda ana içerik 672 px; sahne ve açıklama alt alta. Mobilde ana sayfa/seviye/ders bağlantılarının bir kısmı 19-43 px; mevcut branch'te `touch-none` 10 kullanımda kaydırmayı engelleyebilir.
- **Etkisi/değeri:** Sahne, ölçüm ve açıklama eşzamanlı okunamıyor; telefon kullanıcısı yanlış kaydırma/tap yaşıyor.
- **Somut çözüm:** Masaüstünde 7/5 bölünmüş sticky lab + açıklama; mobilde sahne→kontrol→gözlem tek kolon, alt eylem çubuğu ve 44 px hedef.
- **Sayfa/bileşen:** Ders shell'i, nav, seviye kartları, tüm range/canvas etkileşimleri.
- **Teknik yaklaşım:** `touch-action: pan-y`, lokal yatay scroll yalnız zorunlu tablo/timeline'da, container queries; P1 Codex branch düzeltmeleri birleştirme adayı `[BRANCH'TE]`.
- **Risk/bağımlılık:** Sticky sahnenin küçük laptopta alan kaplaması; yalnız ≥1024 px ve sahne bölümü boyunca sticky.
- **Kabul kriteri:** 320/390/768/1440 genişlikte document overflow 0; tüm tıklanabilir hedefler ≥44×44; sahne yanında açıklama 1024+; klavye ile tüm görevler yapılır.
- **Öncelik:** P1.

### 3.7 Kaynak ve güven sermayesi görünmez — P1 güven/ticari

- **Problem/fırsat:** Ders page'i başlık ve seviye dışında süre, hat, kazanım, kaynak, inceleme tarihi/kapsamı göstermiyor; kaynaklar tıklanabilir panel değil.
- **Etkisi/değeri:** Kullanıcı içeriğin neden güvenilir olduğunu anlayamıyor; öğretmen/üniversiteli satın alma veya tavsiye gerekçesi bulamıyor.
- **Somut çözüm:** Başlık altında “Ders kimliği”; yan/alt panelde kaynaklar, inceleme türü/kapsamı/commit/tarih, simülasyon sınırı ve açık kaynak kodu.
- **Sayfa/bileşen:** Ders page, `TrustPanel`, `SourceList`, review frontmatter.
- **Teknik yaklaşım:** Kaynakları `{title,url,type,accessedAt}` nesnesine kademeli geçir; eski string biçimi geriye uyumlu render edilir.
- **Risk/bağımlılık:** İnceleme metadata'sı olduğundan daha güçlü güven iddiası üretmek; “satır-satır / örneklem / otomatik” ayrımı zorunlu.
- **Kabul kriteri:** Her yayın dersinde en az bir açılabilir kaynak veya açıkça kitap/standart künyesi; inceleme kapsamı görünür; kırık URL CI'da yakalanır.
- **Öncelik:** P1.

### 3.8 Üniversite derinliği tutarsız ve matematik sunumu zayıf — P1 içerik

- **Problem/fırsat:** Üniversite medyanı daha uzun ve iki kaynaklı, fakat birçok ders tek sorulu; KaTeX mimaride yazmasına rağmen kurulu değil; Jacobian formülleri inline `code`, türetme/çalışılmış sayı/karşı örnek her derste yok.
- **Etkisi/değeri:** “Mühendis seviyesine kadar” iddiası bazı derslerde referans aracına, bazılarında kısa özete dönüşüyor.
- **Somut çözüm:** Üniversite kalite rubriği: tanım + türetme veya gerekçeli formül + sayısal örnek + sınır durum/karşı örnek + çalışan kod/deney + transfer.
- **Sayfa/bileşen:** Üniversite MDX, matematik pipeline, CodeRunner/PlannerRace/JacobianViz.
- **Teknik yaklaşım:** Ya `remark-math`/KaTeX'i gerçekten ekle ve güvenlik allowlist'ini güncelle ya da docs/02'den kaldır; öneri gerçek KaTeX, yalnız ders parçasında lazy CSS.
- **Risk/bağımlılık:** İçeriği akademik olarak ağırlaştırmak; “derinlik çekmeceleri” ile ana akışı kısa tut.
- **Kabul kriteri:** Amiral gemisi üniversite derslerinin %100'ünde en az bir sayısal doğrulama, bir başarısızlık/sınır örneği ve çalışan implementasyon bağlantısı; formüller erişilebilir MathML/metin alternatifiyle render edilir.
- **Öncelik:** P1.

### 3.9 Etkileşimler ortak laboratuvar dili ve anlamlı varsayılan üretmiyor — P1 ürün

- **Problem/fırsat:** PlannerRace ilk açılışta neredeyse boş beyaz bir sahne; sonuç ancak engel ekleyip “Yarıştır” denince anlamlı. Beş taslak üniversite dersi hiç sahnesiz. Sahne/metin uyumu geçmiş denetimde yedi derste sorun olmuş.
- **Etkisi/değeri:** Kullanıcı neyi denemesi gerektiğini kendi keşfetmek zorunda; “önce oyna” ilkesi bazı derslerde çalışmıyor.
- **Somut çözüm:** Her interaktif için ortak `LabFrame`: görev cümlesi, hazır örnek senaryo, kontrol, canlı metrik, sıfırla, paylaş/kanıt; boş varsayılan yasak.
- **Sayfa/bileşen:** Tüm `components/interactive`, özellikle PlannerRace, CodeRunner ve vendors/protocol dersleri.
- **Teknik yaklaşım:** Bileşen manifesti `defaultScenario`, `observable`, `evidenceCriterion`, `supportsKeyboard`; içerik linter kullanılan sahne-kazanım eşleşmesini kontrol eder.
- **Risk/bağımlılık:** Fazla kabuk etkileşimi boğabilir; LabFrame 3 yoğunluk moduna sahip olur.
- **Kabul kriteri:** Kullanıcı dokunmadan sahne bir başlangıç durumu ve “şunu değiştir” daveti gösterir; her kazanım en az bir gözlenebilir metriğe eşlenir.
- **Öncelik:** P1.

### 3.10 Release/profesyonellik yüzeyi parçalı — P0 güven

- **Problem/fırsat:** GitHub main `26b040f`, yerel P0 `18c39c7`, production exact SHA belirsiz; `robots.txt`, `sitemap.xml`, `manifest.json` 404; HSTS dışında CSP/nosniff/Referrer/Permissions yok; CODEOWNERS/Dependabot yalnız ayrı branch'te.
- **Etkisi/değeri:** Güçlü iç kalite süreci dışarıdan izlenemiyor; SEO, tedarik zinciri ve “hangi sürüm yayında?” sorusu zayıf.
- **Somut çözüm:** Tek release commit'i, footer'da kısa build SHA; yayın sonrası smoke; SEO/PWA dosyaları; güvenlik başlıkları; branch protection + CODEOWNERS + Dependabot.
- **Sayfa/bileşen:** GitHub, Vercel config, root layout/footer, CI.
- **Teknik yaklaşım:** Static-friendly metadata routes; `NEXT_PUBLIC_BUILD_SHA`; `curl` header testleri; Actions SHA pinleme.
- **Risk/bağımlılık:** CSP'nin Pyodide/worker'ı kırması; önce report-only, sonra allowlist testli enforcement.
- **Kabul kriteri:** GitHub main = production build SHA; dört URL 200; zorunlu başlıklar smoke testte; taslak slug hâlâ 404; P1 branch kapsamı kontrollü merge edilir.
- **Öncelik:** P0.

---

## 4. Üç alternatif tasarım ve görsel kimlik yönü

### Yön A — **İz Laboratuvarı / Canlı Teknik Çizim** — önerilen

| Boyut | Karar |
|---|---|
| Atmosfer | Açık teknik çizim kâğıdı + canlı ölçüm cihazı. Sakin yüzeyde yalnız robot hareketi ve iz çizgisi renklenir. “Müze vitrini” değil, çalışan laboratuvar. |
| Renk | Zemin `#F7F9F8`, yüzey `#FFFFFF`, mürekkep `#102523`, çizgi `#C8D4D1`, ana iz `#00A39A`, veri mavisi `#2563EB`, uyarı `#C46A12`. Üniversitede iz `#334155`, veri mavisi düşük doygunluk. |
| Tipografi | Self-hosted Inter Tight/Inter; sayısal veri JetBrains Mono. Başlıkta 600, gövdede 400; teknik sayılarda tabular numerals. Mevcut doküman yönü korunur ama gerçekten yüklenir. |
| Kart/panel | 1 px teknik sınır, 12-16 px radius, gölge yerine katman ve ince koordinat tick'leri. Kartın sol üstünde amaç, sağ üstünde durum; dekoratif numara yok. |
| 2B/3B | Kavramın grafiği/koordinatı 2B SVG/canvas; uzamsal sezgi gerektiğinde lazy 3B. Aynı iz çizgisi hem hero'da hem gerçek uç yolunda. |
| Hareket | 180-350 ms mekanik easing; değer değişince kısa iz “çizilir”, sonuç hücresi pulse değil tek kontrast geçişi yapar. Scroll parallax yok; reduced-motion'da anlık durum. |
| Ortaokul | Daha doygun iz, daha büyük kontrol, görev kartı ve görsel geri bildirim; metin kısa. |
| Lise | Koordinat/vektör overlay'i, tahmin alanı ve ölçüm tablosu; doygunluk azalır. |
| Üniversite | Grafik/matris/kod sekmeleri açık, panel yoğunluğu artar; renk yalnız veri ayrımı için. |
| Avantaj | Mevcut docs/07 ve favicon/sahne motifiyle uyumlu; hafif, özgün, güvenilir; tüm yaşlara esneyebilir. |
| Risk | Fazla beyaz kalırsa bugünkü sadeliğe geri döner. Çözüm, iz çizgisini dekor değil ilerleme/karşılaştırma/kanıt işlevine bağlamak. |

### Yön B — **Gece Vardiyası / Kontrol Odası**

| Boyut | Karar |
|---|---|
| Atmosfer | Fabrika HMI'sı ile bilimsel kontrol odası arasında; düşük ışık, parlak sinyal, olay kaydı. |
| Renk | `#08121E` zemin, `#102235` panel, `#DCE8F3` metin, `#25D0C8` canlı sinyal, `#FFB454` uyarı, `#EF6262` duruş. |
| Tipografi | Space Grotesk benzeri geometrik sans + IBM Plex Mono; başlıklar sıkı, metrikler güçlü. |
| Kart/panel | Kareye yakın modüller, scope çizgileri, olay zaman şeridi, sağ kenarda status rail. |
| 2B/3B | 2B sinyal/grafik mükemmel uyum; 3B robot koyu sahnede ışıkla ayrılır. |
| Hareket | Scan-line değil; gerçek veri update'i gibi sweep, playhead ve trace. 120-240 ms. |
| Seviye uyarlaması | Ortaokulda “görev kontrolü”, lisede “deney konsolu”, üniversitede “engineering console”. |
| Avantaj | İlk anda güçlü “vay be”; haberleşme, güvenlik, arıza lab için doğal. |
| Risk | Uzun okumada göz yorgunluğu; jenerik siber/neon estetiğe ve çocukça oyun UI'ına kayma. Ana ürün yerine opsiyonel “lab focus mode” olarak daha güvenli. |

### Yön C — **Modüler Deney Tezgâhı**

| Boyut | Karar |
|---|---|
| Atmosfer | Okul/atölye tezgâhında düzenlenmiş ölçü aletleri: her kartın giriş, işlem ve çıktı alanı belli. |
| Renk | Soğuk gri `#F1F4F5`, beyaz panel, grafit `#182327`, mekanik mavi `#2C6EBA`, pirinç yerine güvenli amber `#B86B14`. Bej/serif “not defteri” klişesinden kaçınır. |
| Tipografi | IBM Plex Sans + Plex Mono; etiketler küçük ama yüksek kontrastlı. |
| Kart/panel | Birbirine bağlanan modüller, fiziksel cihaz paneli gibi net giriş/çıkış; ders akışı kartları sürüklenmez, sırayla akar. |
| 2B/3B | Her sahne “alet yuvası” içinde; ölçüm probu, grafik, kod modülleri yan yana takılır. |
| Hareket | Panel takma/çıkarma değil; değerlerin kablo/ok hattı boyunca ilerlemesi. |
| Seviye uyarlaması | Ortaokulda az modül ve büyük kontrol; lisede formül kartı eklenir; üniversitede ham veri/log/kod görünür. |
| Avantaj | Öğretmen paketi, sınıf ve offline kullanım için sistematik; dört lens fikrine yapısal zemin verir. |
| Risk | Kart bolluğu ve dashboard hissi. İçerik hiyerarşisi net kurulmazsa laboratuvar yerine yönetim paneli görünür. |

### Seçim

**Yön A seçilmeli; Yön C'nin modüler panel mantığı yalnız ders içindeki LabFrame'e alınmalı.** A, projenin zaten sahip olduğu iz çizgisi ve mühendislik çizimi kararını kuvvetlendirir, 2B-first performans hedefiyle uyumludur ve seviye olgunlaşmasını en doğal biçimde taşır. Yön B, arıza enjeksiyonu veya “odak modu” için ikincil tema olabilir; tüm siteyi koyu kontrol odasına çevirmek içerik okunabilirliği ve jenerik neon riski taşır.

---

## 5. Ana sayfa, seviye, hat ve ders sayfası önerileri

### 5.1 Ana sayfa — ilk 10 saniyelik “wow moment”

**Hero deneyi: “Sence robotun ucu nereye gidecek?”**

1. Kullanıcı sayfa açıldığında 2 eklemli robotu, mevcut uç noktasını, iki yarı saydam tahmin noktasını ve tek “Dirseği +20° döndür” kontrolünü görür.
2. Önce A/B tahminine dokunur veya klavyeyle seçer. Tahmin yapmadan “Göster” aktif olmaz.
3. Robot 320 ms'de hareket eder; eski yol soluk, gerçek yol turkuaz çizilir; tahmin ile gerçek arasındaki mesafe görünür.
4. Tek cümle açıklama çıkar: “Eklem açısı değişti; uç nokta bir yay çizdi. Bunun adı ileri kinematik.”
5. CTA üçe ayrılır: “Görerek keşfet / Formülle çöz / Matris ve kodla incele”. Bunlar yaş kilidi değil derinlik tercihi olarak ilgili seviyeye gider.

**Yerleşim:** 1280 px container; masaüstünde sol 5 kolon değer önerisi + güven işaretleri, sağ 7 kolon deney. Mobilde başlık→deney→CTA; deney ilk viewport'ta tamamen görünür. Hero altında üç kanıt şeridi: “89 ders dosyası / 39 insan incelemeli yayın / hesap ve izleyici yok”; rakamlar build'den üretilir, elle eskimez.

**Kabul:** 390 px'te yatay taşma yok; robot SVG'si ekran okuyucudan gizli ama sonuç canlı bölgede; WebGL/Three hero paketine girmez; ilk etkileşim INP <200 ms; görev fare, dokunma ve klavyeyle tamamlanır.

### 5.2 Ana sayfanın devamı

- **“Bir kavram, üç derinlik” karşılaştırması:** Ters kinematik örneğinin ortaokul görseli, lise kosinüs formülü ve üniversite Jacobian/DLS görünümü aynı satırda; “aynı site, daha derin lens” mesajını somutlaştırır.
- **Hat haritası:** Sekiz hattı alfabe sırasıyla listelemek yerine robot hücresi şeması üzerinde bağla: Temeller→Hareket→Planlama→Programlama→Haberleşme→Algılama→Simülasyon→Güvenlik. Yayınlanmamış hatlar bağlantısız “incelemede” etiketi taşır.
- **Canlı örnekler:** Üç kart değil, üç oynanabilir 10 saniyelik mikro görev: hedefe uzan, engel ekle, sinyal zamanını değiştir. Sayfada aynı anda yalnız biri hydrate edilir.
- **Güven bölümü:** Kaynaklı içerik, açık kod, insan incelemesi ve veri toplamama; süslü rozet yerine her iddiayı ilgili açık belgeye bağla.
- **Global navigasyon:** Logo/iz, “Öğrenme yolları”, “Laboratuvar”, “Sözlük”, arama; mobilde tek menü ve görünür “Devam et” yerel ilerleme CTA'sı.

### 5.3 Seviye sayfası

**Bugünkü problem:** Tek başlık + karışık dokuz kart; seviye tonu dışında bağlam yok.

**Yeni düzen:**

- Üstte “Bu seviyede ne yapacaksın?” üç somut yetenek ve toplam yayınlanan süre.
- Altında hat kartları; her kartta amaç, 1 cümle gerçek dünya bağı, ders sayısı, tamamlanan/denenen/kanıtlanan durumları.
- “Önerilen yol” ve “İstediğim yerden gezeceğim” eşit görünür; seviye kilit değildir.
- Yetişkin kullanıcı için “hızlı referans modu”: yaş seçmek yerine konu/iş ihtiyacına gider.

### 5.4 Hat sayfası

- Hat için bir “neden önemli?” mini sahne; ders listesi ön koşul zinciri olarak dikey rayda.
- Her ders kartı başlık + görev + süre + kanıt ölçütü + review durumu gösterir; yalnız başlık linki olmaz.
- Aynı kavramın üst/alt seviye görünümü sağ panel veya mobil bottom sheet'te açılır.
- Taslaklar slug vermeden “incelemede” sayacı olarak gösterilebilir; güvenlik hattında insan onayı açıklaması görünür.

### 5.5 Ders sayfası — laboratuvar düzeni

**Masaüstü ≥1024 px:**

```text
[ breadcrumb + hat/seviye + süre + review ]
[ başlık + bu dersin kanıt ölçütü          ]
[ sticky sahne / grafik 7 kolon ][ adım rayı 5 kolon ]
[ canlı metrikler + deney geçmişi          ]
[ açıklama + türetme + gerçek dünya        ]
[ transfer görevi + kanıt makbuzu          ]
[ kaynak/güven paneli + sonraki             ]
```

Sahne yalnız kendi deney bölümünde sticky kalır; tüm sayfayı işgal etmez. Sağ ray Merak/Tahmin/Deney/Gözlem adımlarını yönetir. Açıklama açıldığında sahne son durumu korur; kullanıcı metin ile sonuç arasında gözünü kaybetmez.

**Mobil:** başlık ve kanıt hedefi→4:3 sahne→kontroller→canlı gözlem→kısa açıklama; derin matematik accordion değil erişilebilir `<details>` bölümleri; en altta 56 px'lik “Sonraki adım” çubuğu. Sahnenin üzerinde iki parmak/kaydırma tuzağı yok; `pan-y`; tüm kontroller 44 px.

**Ders kimliği/güven paneli:** süre, hat, kazanımlar, kullanılan laboratuvar, kaynaklar, inceleyen, inceleme kapsamı, tarih/commit, “simülasyonun göstermediği şey”. Üniversite kod linki ayrı “çalışan implementasyon” satırı.

---

## 6. Mobil ve masaüstü deneyimi

| Konu | Masaüstü kararı | Mobil kararı | Ölçülebilir kabul |
|---|---|---|---|
| Ana container | Pazarlama/hat 1280 px; okuma metni 680 px; lab split 1180-1280 px | 16-20 px yan boşluk; tek kolon | 1440'ta ana deney genişliği ≥960 px; 390'ta document overflow 0 |
| Sahne | 7 kolon, 4:3 veya 16:9; metrik paneli yanında | 4:3, kontroller hemen altında; gerekirse tam ekran “odak” | Canvas/SVG görünürken açıklama başlangıcı aynı viewport'ta |
| Kontroller | Metrik ve ayar ayrı; hover yalnız ek ipucu | Tek elle erişilen alt yarı; slider tam genişlik | Tüm hedefler ≥44×44; kaydırma sırasında yanlış sahne hareketi yok |
| Tablolar/timeline | Geniş panel, sabit ilk kolon | Lokal `overflow-x:auto`, başlık ve satır hizası ortak grid | Document değil yalnız panel scroll eder; başlık hücreleri ilişkili |
| Navigasyon | Kalıcı header, breadcrumb, öğrenme rayı | Kompakt header, geri/sonraki ve yerel ilerleme | Her sayfadan seviye/hat'a ≤1 eylem |
| Hareket | İz çizgisi ve sonuç geçişi; sahneye odak | Aynı, daha kısa; enerji tasarrufunda 30 fps hedefi | `prefers-reduced-motion`; orta telefon ≥30 fps |
| 3B | Yalnız uzamsal kavram; görünür alana yakın lazy | “2B hızlı görünüm” varsayılan, 3B isteğe bağlı olabilir | İlk paket <200 KB gzip; 3B init ana akışı kilitlemez |
| Erişilebilirlik | Klavye kısa yolları ve görünür focus | Screen reader özeti, dokunma ve switch uyumu | axe/Playwright matrisinde kritik ihlal 0; manuel klavye görev tamamlama |

**Mevcut duruma uygulanacak not:** PixelToWorld, SignalTimeline, `touch-none`, tap target, CodeRunner label/live region, 64 tab-stop ve seviye teması düzeltmeleri `codex-p1-erisilebilirlik` branch'inde hazır `[BRANCH'TE]`; tekrar tasarlanmamalı, kapsamlı görsel shell'den önce kontrollü biçimde taşınmalı.

---

## 7. Öğrenme modeli ve içerik kalitesi

### 7.1 Zorunlu ders standardı

| Adım | Öğrenci davranışı | Arayüz çıktısı | Kanıt |
|---|---|---|---|
| Merak | Gerçek bir çelişki/görev görür | 1-2 cümle + hazır sahne | Yok; yalnız giriş |
| Tahmin | Sonucu çalıştırmadan seçer/çizer/sayı girer | Tahmin ghost'u veya değer | `prediction` |
| Deney | Tek bir değişkeni değiştirir veya kodu çalıştırır | Robot/grafik anlık tepki | `attempt` + seed/parametre |
| Gözlem | Sonucu sözel veya sayısal işaretler | “Ne değişti?” seçimi + metrik | `observation` |
| Açıklama | Sistem tahmin-sonuç farkını kavrama bağlar | Seviye uygun açıklama/formül | Kısa kontrol sorusu |
| Transfer | Farklı robot/ölçek/engel/arıza koşulunda tekrarlar | Yeni deterministic senaryo | `transferResult` |
| Kanıt | Başarı ölçütü makinece doğrulanır | Yerel kanıt makbuzu | `passed`, metrics, attempts, version |

**Kural:** Quiz yardımcı ölçüm; kanıtın kendisi çoğu derste sahne/kod görevidir. “Bu dersi tamamladım” yalnız okuma öz-beyanı olarak kalabilir, fakat başarı rengi/işareti alamaz.

### 7.2 Ortak kanıt sözleşmesi

```ts
interface EvidenceEvent {
  lessonId: string;
  skillId: string;
  stage: "tried" | "observed" | "transferred" | "passed";
  result: "success" | "retry" | "incomplete";
  metrics: Record<string, number | string | boolean>;
  attempts: number;
  seed?: string;
  contentVersion: string;
}
```

Kayıt varsayılan olarak cihazda; dışa aktarma kullanıcı eylemiyle JSON/PNG/QR. Kimlik, e-posta veya bulut zorunlu değil. Öğretmen paketi öğrenciden yalnız dosya/QR alabilir.

### 7.3 Aynı kavramın üç seviyedeki örneği — ters kinematik

**Ortaokul**

- Merak: “Aynı hedefe dirseği yukarı ve aşağı kırarak ulaşabilir misin?”
- Tahmin: İki ghost pozdan birini seç.
- Deney: Hedefi sürükle; açı sayısı yerine yön okları.
- Transfer: Kol uzunluğu değişmiş ikinci robotta iki hedefe ulaş.
- Kanıt: İki farklı pozla aynı hedefe ≤5 cm hata; ulaşılamaz bir hedefi doğru sınıflandır.
- Formül yok; başarının açıklaması görsel yol ve “iki çözüm” dili.

**Lise**

- Tahmin: Hedef için dirsek yukarı/aşağı ve yaklaşık açı aralığı seç.
- Deney: Kosinüs teoremi panelinde değerleri doldur, robotla doğrula.
- Transfer: Bağ uzunluğu ve eklem limiti değişince çözüm var mı hesapla.
- Kanıt: İki açıyı ±2° veya uç konumu ±2 cm toleransla bul; eklem limitinin bir çözümü neden elediğini açıkla.

**Üniversite**

- Analitik 2-DOF ve sayısal DLS'yi aynı hedef/seed üzerinde karşılaştır.
- Tekillik yakınında residual/iteration/condition metric'i izle; λ=0 karşı örneğini çalıştır.
- Transfer: 6-DOF için kapalı form varsayımının neden geçersiz olabileceğini ve başlangıç tahmininin etkisini göster.
- Kanıt: Residual toleransı, joint-limit uyumu, başarısızlık sınıflandırması; kod ve metrik export.

### 7.4 İçerik kalite kapısı

- Frontmatter'a `concept_id`, `misconceptions`, `evidence`, `transfer_task`, `related`, `project_ids`, sürümlü `review` ekle.
- Üniversite rubriği otomatik/yazar kontrolü: türetme veya gerekçe, sayısal örnek, sınır durum, çalışan deney/kod, kaynak.
- `aciklama` iki alana bölünsün: `ipucu` ve `tam_aciklama`; ikinci deneme veya doğru sonrası tam açıklama.
- Kullanılan bileşen ile beyan edilen `etkilesimli` ve kazanım-gözlem eşleşmesi CI'da doğrulansın.
- “Hayal et/zihninde düşün” etkileşim yerine kullanılıyorsa anti-pattern; ancak gerçek zihinsel tahmin adımında, ardından çalıştırma geliyorsa kabul edilir.
- Kaynak paneli için URL/tarih/type doğrulaması; standart erişim kısıtı açıkça belirtilir.

---

## 8. Ortaokul, lise, üniversite ve yetişkin kullanıcı yolculukları

### Ortaokul — “Önce hareketi kontrol edeyim”

`Hero tahmini (30 sn)` → `Görerek keşfet` → `Hareket ve kinematik hattı` → `8 dakikalık hedef görevi` → `iz makbuzu` → `aynı kavramın lise görünümüne merak bağlantısı`.

- Metin bloğu en fazla 3 cümle; tek görev; sayısal puan yerine somut “iki yolla ulaştın”.
- Başarısızlık dili “başka bir yol dene”; sınırsız deneme; sosyal leaderboard yok.
- Kabul: 12-14 yaş pilotunda yardım almadan ilk hedefi bulma medyanı <3 dk.

### Lise — “Sezgiyi formülle bağlayayım”

`Hero formül CTA` → `kısa seviye tanısı` → `ön koşul önerisi` → `tahmin + formül + sahne doğrulaması` → `değişmiş parametreyle transfer` → `yerel proje kartı`.

- Formül tek başına değil her zaman sahne metriğine bağlanır.
- Python zorunlu olmayan başlangıç; ilerleyen D hattında kod.
- Kabul: öğrenci sahnedeki sonucu formülle ±tolerans içinde yeniden üretir.

### Üniversite — “Sınırları ve karşı örneği test edeyim”

`Konu/araç araması` → `ders kimliği + ön koşul` → `deney konsolu` → `matris/grafik/kod senkron lensleri` → `seed'li tekrar` → `counterexample` → `notebook export`.

- Varsayımlar, failure mode, complexity ve kaynak kodu görünür.
- “Başarılı” sonuç tek metrik değil; residual, süre, yol geçerliliği gibi doğrulanır.
- Kabul: amiral gemisi dersinde kullanıcı iki yöntemin hangi koşulda başarısız olduğunu deney verisiyle savunur.

### Yetişkin/öğretmen — yaş seviyesi değil niyet

Ana sayfada ikincil girişler: “Bir kavramı hızlı öğren”, “Dersimde kullan”, “İşimde referans al”.

- **Meraklı yetişkin:** kısa tanı, görsel hat, terim köprüleri; yaş etiketi hissettirmez.
- **Öğretmen:** 40 dakikalık ders akışı, QR/URL-fragment seed, yazdırılabilir görev/rubrik, offline paket; hesap yok.
- **Saha çalışanı:** vendor karşılaştırma, hızlı arama, kaynak ve sürüm; “öğrenci oyunu” çerçevesi yok.
- Kabul: aynı kavram sayfası rol değişince içerik kilitlemez; yalnız önerilen akış ve dil değişir.

---

## 9. Gerçekten yeni ve farklılaştırıcı fikirler

### 9.1 Önceden belgelenmiş fikirler — korunuyor ama “yeni” sayılmıyor

`docs/05`, `docs/fikirler.md` ve `codex-p1-erisilebilirlik` branch'indeki `docs/10-harici-denetim-bulgulari.md` şu fikirleri zaten içeriyor: oyun alanı, tek robot hücresi capstone, arıza enjeksiyonu, dört senkron lens, tahmin→çalıştır→fark→geri sar, paylaşılabilir state, seed'li deney, yerel defter, beceri portföyü, Türkçe bilgi grafiği, vendor Rosetta Stone, öğretmen paketi ve offline kullanım.

| Mevcut fikir | Projeye uygunluk | Geliştirilmiş karar | Bağımlılık / kabul |
|---|---|---|---|
| Dört senkron lens `[BELGEDE VAR]` | Çok yüksek; motor+grafik+kod zaten parçalı var | Önce tek “ileri kinematik” dersinde sahne/matris/grafik/kod ortak timeline | Bir değer değişince dört lens aynı frame/version'ı gösterir |
| Tahmin→çalıştır→fark→geri sar `[BELGEDE VAR]` | En yüksek, hemen | Ortak `ExperimentRun` ve ghost trace; yalnız animasyon değil metrik diff | İki run seçilip parametre/sonuç farkı okunur |
| Seed + paylaşılabilir state `[BELGEDE VAR]` | Çok yüksek; statik mimariye doğal | Sunucu yerine URL fragment; içerik sürümü dahil | Link kişisel veri taşımaz; aynı build'de aynı sonuç |
| Yerel defter + beceri kanıtı `[BELGEDE VAR]` | Çok yüksek; premium temel | Hesap yerine “kanıt makbuzu”; ücretsiz JSON export | Offline, silinebilir, sürümlü |
| Tek robot hücresi capstone `[BELGEDE VAR]` | Yüksek ama kapsam riski büyük | Tüm 8 hattı birden değil, önce D-G'den 4 görevli dikey dilim | 30-45 dk; her görev bağımsız testli |
| Arıza enjeksiyonu `[BELGEDE VAR]` | Yüksek; gerçek farklılaştırıcı | Rastgele kaos değil, tanımlı hata modeli + belirti + teşhis ölçütü | bias/jitter/backlash için deterministik test |
| Vendor Rosetta Stone `[BELGEDE VAR]` | Orta-yüksek; Hat D güçlü | UI kopyalamak yerine ortak hareket sözleşmesine syntax adapter | Resmi kaynak, marka/versiyon, IP kontrolü |
| Türkçe bilgi grafiği `[BELGEDE VAR]` | Orta; önce veri omurgası | İlk sürüm görsel graph değil `concept_id` + terim/kavram/yanılgı ilişkisi | 20 çekirdek kavramda bağlantısız düğüm 0 |
| Öğretmen + offline `[BELGEDE VAR]` | Çok yüksek; etik premium | Genel PWA yerine seçili dersleri sürümleyen “Sınıf Paketi” | İnternet kesik 30 cihaz senaryosu |
| Oyun alanı `[BELGEDE VAR]` | Orta; tek başına öğrenme kanıtı üretmez | Serbest mod + isteğe bağlı görev kartları; “boş sandbox” olmasın | İlk açılışta 3 hazır senaryo |

### 9.2 Bu denetimde yeni üretilen fikirler

1. **Robotik Nabız — 60 saniyelik beceri/niyet tanısı `[YENİ]`.** Üç mini durum: erişilebilir hedef, engelli yol, dijital sinyal. Sonuca göre yaş değil başlangıç yolu önerir. Veri cihazda kalır. Kabul: 60 sn içinde biter, “başlangıç önerisi” en az iki gözleme dayanır.
2. **Run Delta Lens — iki deney arasındaki farkı açıklayan diff `[YENİ]`.** Parametre, iz, metrik ve sonuç değişimini aynı tabloda gösterir. Dört lens fikrinden farklı olarak “iki koşulu karşılaştırma”yı ürün primitive'i yapar. Kabul: kullanıcı iki run seçer, değişen tek parametre otomatik vurgulanır.
3. **Kural tabanlı “Bu sonuç neden oldu?” açıklayıcı `[YENİ]`.** LLM çağrısı yok; bileşen ölçümlerinden kısa nedensel cümle üretir: “λ azaldı, iterasyon düştü ama tekillik yakınında residual büyüdü.” Offline ve denetlenebilir. Kabul: her cümle kaynak metric/rule ID'sine bağlıdır.
4. **İdeal ↔ gerçek dünya kaydırıcısı `[YENİ]`.** Aynı sahnede gürültü, backlash, gecikme veya kalibrasyon bias'ı kademeli açılır; sim-to-real ayrı ders değil her uygun kavramın ikinci lensi olur. Kabul: ideal durumda eski test sonucu birebir, nonideal seed'li tekrar üretilebilir.
5. **Yanılgı parmak izi `[YENİ]`.** Sadece doğru/yanlış yerine hata biçimini sınıflandırır: derece-radyan, frame karışıklığı, köşe kesme, tekillikte ters alma. Kullanıcıya yanılgıya özgü karşı örnek verir. Kabul: amiral gemisi 6 derste en az iki yanlış model deterministic yakalanır.
6. **Robotik olay rekonstrüksiyonu `[YENİ]`.** Güvenlik/entegrasyon derslerinde kurgusal ama kaynaklı olay timeline'ı; öğrenci “hangi sinyal/varsayım kırıldı?” diye kök neden ağacı kurar. Gerçek firma/olay ayrıntısı kopyalanmaz. Kabul: olay her adımda gözlenebilir log ve resmi standarda bağlı açıklama taşır.
7. **Gözlem bütçesi görevi `[YENİ]`.** Öğrenci teşhis için yalnız üç sensör/log metriği seçebilir; fazla veri değil doğru veri öğretilir. Algılama+haberleşme+güvenlik çapraz-hat değeri üretir. Kabul: en az iki geçerli strateji ve bir gereksiz sensör tuzağı.
8. **Kısıt mutasyon motoru `[YENİ]`.** Bir görevin robot uzunluğu, limit, engel veya noise değerini seed'le değiştirerek ezberlenemeyen transfer varyantı üretir. Kabul: her varyant çözülebilir/çözülemez sınıfını property testle korur.
9. **Hareket sözleşmesi test tezgâhı `[YENİ]`.** Kullanıcı RAPID/KRL/FANUC/Mecademic komutunu soyut `MoveIntent`e eşler; simülasyon syntax benzerliğini değil semantik farkı (frame, blend, speed, configuration) karşılaştırır. Vendor UI taklidi riskini azaltır. Kabul: aynı görevde dört adapter'ın açık fark tablosu.
10. **Derinlik sürgüsü `[YENİ]`.** Aynı deneyde “sezgi → geometri → matris → kod” katmanları açılır; farklı yaş sayfalarını kopyalamak yerine kavram durumu korunarak derinlik artar. Dört lens eşzamanlı görünümden farklı olarak kademeli açıklama aracıdır. Kabul: seviye değişiminde sahne state'i kaybolmaz.
11. **Sınıf orkestrasyon kartı `[YENİ]`.** Öğretmen tek QR ile aynı kavramın üç seed'ini gruplara dağıtır; hesap/merkezi öğrenci takibi yok. Sonuçlar renkli kanıt kartlarıyla sınıfta karşılaştırılır. Kabul: öğretmen 2 dk içinde paket üretir; QR kişisel veri içermez.
12. **Sürüm duyarlı kanıt makbuzu `[YENİ]`.** Kanıt JSON'unda içerik commit'i, motor sürümü ve ölçüt bulunur; değişen algoritmadan sonra eski başarı sessizce “geçerli” görünmez. Ticari portföy değerinin güven tabanı. Kabul: eski sürüm açıkça “yeniden doğrula” etiketi alır.

### Fikir seçim filtresi

Bir fikir ancak şu dördünü sağlıyorsa backlog'a girsin: (1) öğrenci bir değişkeni kontrol ediyor, (2) gözlenebilir sonuç üretiyor, (3) mevcut motor/veri mimarisiyle taşınabilir, (4) ders videosu/PDF'nin kolay yapamayacağı bir şey yapıyor. Sadece yeni konu başlığı veya dekoratif 3B bu filtreden geçmez.

---

## 10. Ücretsiz ve gelecekte ücretli olabilecek değer katmanları

### Ücretsiz çekirdek — zayıflatılmamalı

- Tüm temel kavram dersleri, standart mikro-lab'lar, arama, sözlük, kaynaklar.
- Ana öğrenme yolu, okundu/denendi/başarı durumları ve temel yerel ilerleme.
- Temel güvenlik içeriği; asla premium arkasına konmaz.
- Serbest laboratuvarın temel robot/engel/algoritma seti.
- Kanıtın temel JSON dışa aktarımı ve kişisel verisiz çalışma.
- Açık kaynak motor ve katkı süreci.

### Bireysel ileri paket — etik premium

**İnsan neden öder:** daha fazla metin için değil, hazırlanması pahalı ve yeniden kullanılabilir deney düzenekleri için.

- Seed'li ileri arıza laboratuvarları ve ayrıntılı run diff.
- Tam capstone görevleri, rubrik, çözüm stratejisi ve yeniden oynatma.
- Gelişmiş deney defteri: grafik export, çoklu run karşılaştırma, rapor şablonu.
- Vendor semantik karşılaştırma lab'ları ve sürüm notları.
- Portföy sunumu: kullanıcı seçerek dışa aktarır; doğrulama/sürüm bilgili statik paket.

Temel ders anlatımı, güvenlik ve tekil kavram deneyleri ücretsiz kalır.

### Öğretmen paketi — en güçlü erken gelir adayı

- 40/80 dakikalık hazır sınıf akışları, öğretmen notu, yanlış model rehberi.
- Seed/QR grup görevleri, yazdırılabilir çalışma kâğıdı ve cevap/rubrik.
- İnternetsiz okul paketi, tek öğretmen bilgisayarından yerel ağ veya cihaz başına kurulum.
- Toplu kişisel veri toplamadan öğrenci kanıt dosyalarını yerelde birleştiren masaüstü raporu.
- Sınıf senaryoları: “20 cihaz, düşük internet, tek projeksiyon” varyantları.

### Okul/kurum paketi

- Sürümlü offline dağıtım, yıllık içerik/uyumluluk güncellemesi, kurulum desteği.
- Meslek lisesi/üniversite için vendor karşılaştırma ve capstone lisansı.
- Kuruma özel **içerik yazma değil**, herkese açık kaynaklara dayalı paketleme/uygulama desteği; gizlilik kuralı korunur.
- İsteğe bağlı self-host; hesap sistemi zorunlu değil.

### Kaçınılacak modeller

- Güvenlik, temel matematik veya öğrencinin kendi verisini premium duvarına koymak.
- Streak, süre baskısı, kayıp korkusu, çocuklara upsell ve yapay kıtlık.
- “Sertifika”yı öğrenme kanıtı olmadan satmak.
- Ücretsiz laboratuvarı bilerek yavaşlatmak veya seed/export'u bütünüyle kilitlemek.

**Ticari doğrulama kriteri:** kodlamadan önce 5 öğretmenle paket prototipi; en az 3'ü bir ders planında kullanmayı, 2'si okul bütçesinden ödeme sürecini başlatmayı kabul ederse ürünleştirme.

---

## 11. Teknik altyapı, performans, erişilebilirlik ve güven önerileri

| Konu | Mevcut durum | Somut iş | Risk/bağımlılık | Kabul / öncelik |
|---|---|---|---|---|
| Release izi | Main, P0 branch ve prod farklı | Build SHA footer + deployment smoke + main tabanlı release | Vercel env | Prod SHA GitHub'da bulunur; P0 |
| P1 erişilebilirlik | Düzeltmeler ayrı branch'te | `1d49dfb` kapsamını current branch'e conflict kontrollü taşı | Paralel değişiklikler | 320-1440 matris, axe+klavye; P0 |
| SEO | robots/sitemap/manifest 404 | Next metadata route'ları; yalnız yayın slug'ları | Taslak sızıntı | Taslak slug sitemap'te 0; P0 |
| Güvenlik başlıkları | Yalnız HSTS | CSP report-only→enforce, nosniff, referrer, permissions | Pyodide/worker | Header smoke + CodeRunner E2E; P0 |
| Yönetişim | Main'de CODEOWNERS/Dependabot yok | Codex branch dosyalarını taşı, main protection, Actions SHA pin | Repo ayarı | Zorunlu review/check; P0 |
| PWA/offline | Manifest yok | Önce shell+seçili ders pack; tüm 10 MB Pyodide'ı varsayılan cache'leme | Cache boyutu/sürüm | 6 derslik pack uçak modunda; P2 |
| 3B performans | Mobil Lighthouse 73-76 | 2B preview, görünürken init, focus mode, raw-three benchmark | Görsel kalite | Etkileşim hazır <3 sn hedef cihaz; P1 |
| Font/ikon | CSS isimleri, asset yok; favicon var | Self-hosted subset + icon set yalnız SVG sprite | Paket boyutu | Font swap CLS 0, harici istek 0; P1 |
| Matematik | KaTeX dokümanda, yok | Gerçek pipeline + sanitization ve a11y | MDX allowlist | Ham `$$` görünmez; P1 |
| Kanıt depolama | Slug listesi | Sürümlü schema, migration, export/delete | Eski localStorage | Kullanıcı veriyi görür/siler; P1 |
| E2E/visual | Birim/CI güçlü, UI matris yok | Playwright: hero, görev, draft 404, mobile overflow, keyboard; screenshot diff | CI süresi | Kritik akışlar PR'da; P1 |
| İçerik gözlenebilirliği | Bileşen/kazanım sözleşmesi yok | Manifest + linter + `EvidenceEvent` | 89 ders göçü | Pilot 6, sonra yayınlananlar; P1 |
| Gizlilik ölçümü | Analytics yok | Önce moderasyonlu usability; gerekirse cookiesiz toplu olay ve açık event sözlüğü | Çocuk verisi | Kalıcı ID/çerez yok; DNT; P2 |

---

## 12. Hızlı kazanımlar — 1-2 hafta

1. **Release bütünlüğü:** P0/P1 branch'lerini ayrı commitlerle main'e taşı; production build SHA'yı görünür yap; taslak 404 smoke testini koru.
2. **Seviye sırasını düzelt:** Dersleri hatlara grupla; A1/B1/C1 karışmasını kapat; geri/ana navigasyon ekle.
3. **Ana sayfayı listeden ürün vitrini hâline getir:** Henüz full hero deneyi değilse bile yayınlanan 39 dersi uzun listelemek yerine üç oynanabilir örnek + hat haritası + güven kanıtı.
4. **Kaynak/güven paneli v0:** Var olan string kaynakları render et; süre, hat, kazanım, review kişi/tarih göster.
5. **Quiz deneme durumu:** İlk yanlışta kısa ipucu; tam açıklama ikinci deneme/doğru sonrası; yeniden dene.
6. **PlannerRace anlamlı varsayılan:** 2 engelli hazır örnek, başlangıçta görünür start/goal/legend ve “Yarıştır”.
7. **SEO/profesyonellik:** robots, sitemap, manifest, canonical/OG; yalnız yayınlanan slug.
8. **Mobil hedefler:** Codex P1 düzeltmelerini taşı; ana/seviye/ders linklerini 44 px satır/karta dönüştür.

Her hızlı kazanım tek risk grubunda commit edilmeli; görsel shell ile algoritma/güvenlik değişikliği aynı commit'e girmemeli.

---

## 13. Orta vadeli geliştirmeler — 3-8 hafta

1. **`PageShell` + `LabFrame` + seviye token'ları:** İz Laboratuvarı tasarım sisteminin ürünleşmesi.
2. **Öğrenme kernel'i:** EvidenceEvent, üç durumlu ilerleme, content version, yerel export.
3. **Yedi adımlı ders şablonu:** Önce altı amiral gemisi derste; içerik linter/manifest.
4. **2B-first sahne altyapısı:** Hero ve basit kavramlar SVG; 3B yalnız gerektiğinde.
5. **Matematik sunumu:** KaTeX + erişilebilir alternatif; üniversite depth drawer.
6. **Run history + seed + URL fragment:** Tahmin/çalıştır/diff/geri sar için ortak `ExperimentRun`.
7. **Hat ve concept spine:** `concept_id`, related/misconceptions/project links; henüz büyük graph UI yok.
8. **Öğretmen paket prototipi:** İki 40 dakikalık ders, QR seed ve PDF/JSON rubrik; beş öğretmen pilotu.

---

## 14. Amiral gemisi özellikler

### 14.1 Birinci amiral gemisi: **Robot Hücresi — “Gör, planla, çalıştır, doğrula”**

Tam sekiz hattı tek seferde inşa etmek yerine dört görevli dikey dilim:

1. **Algılama:** Pixel→world ile parçanın konumunu kalibre et.
2. **Planlama:** Engel ekle, A*/RRT seçeneklerini seed'li karşılaştır.
3. **Programlama:** Soyut hareketi Python veya vendor adapter ile çalıştır.
4. **Güvenlik/doğrulama:** Güvenli bölge ve hız koşulunu sağla; simülasyon sınırını belirt.

Ortak robot hücresi state'i görevler arasında taşınır. Sonuç “bitirdin” değil: kalibrasyon hatası, yol geçerliliği, süre ve güvenlik metriği içeren kanıt makbuzu.

**Kabul:** 30-45 dk; yeni kullanıcı yönergesiz ilk göreve <2 dk; her alt görev deterministic test; tüm capstone offline; mobilde alternatif 2B görünüm.

### 14.2 İkinci amiral gemisi: **Arıza Parmak İzi Laboratuvarı**

Bias, jitter, backlash, drift, paket kaybı ve tekillik ayrı “hata modeli” olarak eklenir. Öğrenci önce belirti grafiğine bakar, gözlem bütçesiyle ölçüm seçer, arızayı enjekte eder ve teşhisini test eder. “Rastgele bozuldu” değil, her modelin resmi kaynak/denklem/sınırı vardır.

**Kabul:** Her arıza için seed, beklenen imza ve property test; iki arızanın benzer göründüğü en az bir karşı örnek; kullanıcı yalnız renge bakmadan teşhis yapabilir.

### 14.3 Üçüncü amiral gemisi: **Dört Lens + Run Delta**

Aynı hareketi sahne, matris, grafik ve kodda aynı zaman ekseninde göster; iki çalıştırmayı ghost/diff olarak karşılaştır. Önce ileri kinematik/Jacobian; sonra vendor adapter.

**Kabul:** Playhead 60 fps; dört lens aynı `runId/frame`; bir lens kapatılsa state kaybolmaz; reduced-motion'da scrubber çalışır.

### 14.4 Ticari amiral gemisi: **Hesapsız Sınıf Paketi**

Öğretmen görev seçer, üç seed'li QR üretir, offline zip/PWA pack indirir; öğrenci kanıt dosyasını geri verir. Merkezi çocuk hesabı veya izleme yok.

**Kabul:** 30 cihaz, internet kesik, tek öğretmen bilgisayarı; kurulum <15 dk; kanıt birleştirme kişisel isim zorunlu olmadan çalışır.

---

## 15. Etki × efor × risk içeren öncelikli backlog

Etki: 1 düşük–5 çok yüksek. Efor: S ≤1 hafta, M 2-4 hafta, L 1-2 ay, XL >2 ay. Risk: Düşük/Orta/Yüksek.

| # | İş | Etki | Efor | Risk | Bağımlılık | Bitti sayılma ölçütü |
|---:|---|:---:|:---:|:---:|---|---|
| 1 | Main/production/P0/P1 release hizası | 5 | S | Orta | Branch inceleme | Prod SHA görünür; taslak 404; smoke yeşil |
| 2 | Seviye→Hat→Ders bilgi mimarisi | 5 | S | Düşük | Content selector | A/B/C karışması yok; 2 tıkta ilk ders |
| 3 | Ana sayfa 2B hero deneyi | 5 | M | Orta | FK motoru, tasarım token | ≤25 KB ek gzip; 6/8 kullanıcı 10 sn içinde oynar |
| 4 | Kaynak/review güven paneli v0 | 5 | S | Düşük | Mevcut frontmatter | 39 yayında görünür kaynak+inceleme |
| 5 | P1 mobil/a11y branch'inin taşınması | 5 | S | Orta | Conflict çözümü | 320-1440 overflow 0, target 44, keyboard görev |
| 6 | EvidenceEvent + üç durumlu ilerleme | 5 | M | Orta | Schema/version | 6 pilot derste başarı sahneden türetilir |
| 7 | Quiz ipucu/deneme durumu | 4 | S | Düşük | İçerik alanı göçü | İlk yanlış tam cevabı açmaz; 2. deneme var |
| 8 | İz Laboratuvarı shell/token/font | 4 | M | Orta | Tasarım yönü | Home/level/lesson görsel regression, AA |
| 9 | `LabFrame` ve anlamlı varsayılan manifesti | 5 | M | Orta | EvidenceEvent | Pilot sahnelerin tamamında görev+metrik+reset |
| 10 | SEO/manifest/security headers | 4 | S | Orta | Vercel/Pyodide CSP | 4 endpoint 200, header ve CodeRunner E2E |
| 11 | E2E + mobil + visual regression matrisi | 4 | M | Düşük | Shell | Kritik 6 akış PR'da otomatik |
| 12 | KaTeX ve üniversite rubriği pilotu | 4 | M | Orta | MDX security | 6 derste formula+a11y+counterexample |
| 13 | ExperimentRun + seed + fragment state | 5 | M | Orta | LabFrame | Aynı link aynı state/run, kişisel veri yok |
| 14 | Run Delta Lens | 5 | M | Orta | ExperimentRun | İki run parametre/iz/metrik diff |
| 15 | Concept spine (`concept_id`) | 4 | M | Orta | Content schema | 20 kavram, orphan 0, cross-level link |
| 16 | İlk dört görevli robot hücresi capstone | 5 | L | Yüksek | 6,9,13 | 30-45 dk uçtan uca kanıt |
| 17 | Arıza modeli kütüphanesi + lab | 5 | L | Yüksek | Seed/run/property test | 6 deterministic arıza, karşı örnek |
| 18 | Vendor MoveIntent adapter pilotu | 4 | L | Yüksek | Resmi doküman/review | 3 vendor, semantik test, sürüm etiketi |
| 19 | Yerel notebook + sürümlü kanıt export | 4 | M | Orta | EvidenceEvent/ExperimentRun | JSON+PNG export, delete/migrate |
| 20 | Hesapsız öğretmen/offline pilot | 5 | L | Yüksek | Capstone/notebook/PWA | 5 öğretmen, 30 cihaz offline test |

**Sıralama ilkesi:** 1-10 bitmeden yeni içerik hattı veya büyük 3B sahne yok. 16-20 ticari/flagship işler; öğrenme kernel'i olmadan yapılırsa yalnız pahalı demo üretir.

---

## 16. Aşamalı uygulama yol haritası

### Aşama 0 — Bütünlük ve güven tabanı

1. Remote main, production ve denetlenmiş P0/P1 commit'lerini hizala.
2. Draft 404, MDX allowlist, planlayıcı invariant, quiz shuffle testlerini koru.
3. Build SHA, robots/sitemap/manifest ve güvenlik başlıklarını yayınla.
4. CODEOWNERS/Dependabot/branch protection/Actions SHA pinleme.

**Çıkış kapısı:** Kullanıcıya gösterilen sürüm tek commit'e izlenebiliyor; kritik güven testleri CI ve deployment smoke'ta.

### Aşama 1 — İlk 30 saniye ve bilgi mimarisi

1. İz Laboratuvarı token + shell.
2. 2B hero deneyi.
3. Seviye→Hat→Ders akışı ve global nav.
4. Kaynak/review paneli v0.
5. P1 mobil/a11y düzeltmeleri.

**Çıkış kapısı:** Yeni kullanıcı ilk viewport'ta bir neden-sonuç deneyini bitirir; 390/1440 görünüm kabul testleri geçer.

### Aşama 2 — Learning kernel

1. EvidenceEvent, ExperimentRun ve sürümlü local store.
2. LabFrame, tahmin/deney/gözlem/transfer.
3. Quiz attempt/hint.
4. Altı pilot ders: iki ortaokul, iki lise, iki üniversite.
5. Content manifest/linter ve E2E.

**Çıkış kapısı:** Pilot derslerde tamamlanma öz-beyan değil gözlenebilir görev; export/import çalışır.

### Aşama 3 — Amiral gemisi dikey dilim

1. Robot hücresi capstone'un dört görevi.
2. Dört Lens + Run Delta'yı en az bir görevde kullan.
3. İdeal↔gerçek ve iki arıza modeli pilotu.
4. Notebook/kanıt raporu.

**Çıkış kapısı:** 30-45 dakikalık, paylaşılabilir ve offline çalışabilen tek bütün deney; dış kullanıcı testinde değer farkı açıkça ifade edilir.

### Aşama 4 — Öğretmen ve premium doğrulama

1. İki sınıf paketi, QR seed, rubrik, offline dağıtım.
2. Beş öğretmen pilotu; ödeme niyeti ve okul kurulum engelleri.
3. Vendor MoveIntent pilotu; ileri notebook/diff paketi.
4. Yalnız doğrulanan değeri ücretli katmana dönüştür.

**Çıkış kapısı:** En az üç gerçek sınıf kullanımı ve iki bütçe/ödeme süreci; kişisel veri/hesap zorunluluğu yok.

---

## 17. Her aşama için ölçülebilir kabul kriterleri

| Aşama | Ürün | Öğrenme | Tasarım/erişilebilirlik | Teknik/güven | Ticari |
|---|---|---|---|---|---|
| 0 | Prod sürümü SHA ile görünür | Taslak/güvenlik içeriği kapalı | Kritik UI regression yok | Main=prod; smoke/header/CI yeşil | Güven iddiası doğrulanabilir |
| 1 | 8 test kullanıcısının ≥6'sı 10 sn içinde hero'yu oynar | ≥6'sı neden-sonucu bir cümleyle söyler | 320/390/768/1440 overflow 0; AA; 44 px | FCP <1 sn hedef, hero ready <1,5 sn, WebGL yok | ≥5 kullanıcı “video/PDF'den farkını” doğru tarif eder |
| 2 | Pilot 6 derste okundu/denendi/başarı ayrımı | ≥80% kullanıcı transfer görevine ulaşır; başarı ölçütü makinece | Klavye/screen-reader ana görevleri tamamlar | Evidence migration/export ve version testli | Notebook/kanıt için ödeme görüşmesi yapılabilir somut demo |
| 3 | Capstone tek state ile dört görevi bağlar | Kullanıcı en az iki hat arasında neden-sonuç kurar | Mobil 2B ve masaüstü lab eşdeğer görev | Her run seed'li, offline, property testli | 10 hedef kullanıcıdan ≥4'ü ileri paket için fiyat görüşmesine açık |
| 4 | Öğretmen 2 dk içinde paket hazırlar | Öğretmen rubriği kanıtla eşleşir | Projeksiyon/telefon/klavye kullanım senaryosu | 30 cihaz uçak modu; kişisel veri yok | 5 pilot, 3 gerçek sınıf kullanımı, 2 ödeme/bütçe adımı |

### Sürekli kalite metrikleri

- Her yayın dersinde gözlenebilir kazanım oranı; hedef önce 39 yayının %50'si, sonra %100.
- Tek sorulu ders oranı tek başına başarı metriği değil; transfer görevi olmayan ders oranı hedef 0.
- Kaynak paneli kapsama oranı %100; review kapsamı belirsiz ders 0.
- 3B sahne başlatma süresi ve ana thread bloklama; 3B gerektirmeyen derslerde Three chunk 0.
- Mobil document overflow 0; küçük tap target 0; klavye ile bitmeyen pilot görev 0.
- Production'da draft slug 0; sitemap'te draft 0; güvenlik başlığı smoke başarısı %100.
- Kullanıcı araştırması notu: kişisel analytics yerine düzenli 8-10 kişilik görev testi; analytics eklenirse kalıcı kimlik/çerez yok.

---

## 18. “Yalnız beş şey yapacaksak” özeti

1. **Ana sayfaya 2B Tahmin→Oynat→Fark hero'su koy.** Ürünün farkını kullanıcı ilk 10 saniyede elleriyle görsün.
2. **Seviye→Hat→Ders yolunu düzelt ve güven panelini görünür yap.** 89 dosya yerine anlamlı rota ve doğrulanabilir kaynak sat.
3. **Manuel tamamlama yerine EvidenceEvent tabanlı öğrenme kernel'i kur.** Okundu, denendi ve başarı birbirine karışmasın.
4. **Altı dersi yedi adımlı döngüyle kusursuzlaştır; sonra tek robot hücresi capstone'a bağla.** 89 dersi aynı anda cilalamaya çalışma.
5. **P0/P1 branch'lerini release bütünlüğüyle birleştir; mobil/a11y/SEO/güvenlik tabanını kapat.** Güzel demo, güvenilir ürün tabanı olmadan ticari değer üretmez.

**En önemli sorunun cevabı:** Bu ürün sıradan bir robotik içerik sitesinden daha değerli olacak çünkü kullanıcı yalnız doğru bilgiyi okumayacak; bir tahmin kuracak, gerçek robotik motorunu çalıştıracak, kendi yanılgısını ölçümde görecek, başka koşula transfer edecek ve yaptığı işi sürümlü bir kanıt olarak alacak. Kullanıcı bunu ilk birkaç dakikada ana sayfadaki mikro deney, hat sayfasındaki görünür görev ölçütü ve ilk dersteki tahmin-sonuç farkı sayesinde anlayacak — pazarlama cümlesi sayesinde değil.

### Claude/Codex için doğrudan ilk görev paketi

1. `release-integrity`: P0/P1 commit envanteri, conflict planı, main/prod SHA ve smoke test; kod değişikliği ayrı PR.
2. `learning-path-ia`: Seviye sayfasını hat gruplarına ayır, yayın filtrelerini koru, route/unit/E2E testi ekle.
3. `trust-panel-v0`: Mevcut frontmatter'dan süre/hat/kazanım/kaynak/review render et; schema değiştirmeden başla.
4. `hero-experiment-spec`: SVG wireframe, durum makinesi, erişilebilir isimler, FK giriş/çıktısı ve performans bütçesi; önce component test.
5. `evidence-rfc`: `EvidenceEvent`, local schema/version/migration, privacy ve altı pilot dersin başarı ölçütü; uygulamadan önce kısa RFC.
6. `lab-frame-pilot`: `b-ortaokul-eklemleri-oynat` üzerinde Merak→Tahmin→Deney→Gözlem→Açıklama→Transfer→Kanıt.
7. `quiz-attempts`: ipucu/tam açıklama ayrımı ve corpus migration raporu; içerik ile UI değişikliği ayrı commit.
8. `visual-foundation`: İz Laboratuvarı token/font/PageShell; home/level/lesson screenshot regression.
9. `seo-security`: robots/sitemap/manifest + CSP report-only ve Pyodide/worker E2E.
10. `flagship-rfc`: Dört görevli robot hücresi için state, seed, kanıt ve offline sınırları; yeni ders yazmadan önce kabul kriterleri.
