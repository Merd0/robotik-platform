# Ürün denetimi (2026-08-22, 2026-08-23'te güncellendi)

Bu doküman, Mert'in 68 maddelik "projeyi uçtan uca ele al" talebinin
kod tabanına karşı satır satır denetimidir. **Hiçbir uygulama yapılmadı** —
bu sadece analiz. `PROMPT-urun-denetimi.md`'deki talimata göre yazıldı.

**2026-08-23 güncellemesi:** Aşağıdaki A/B/C/D bölümleri 2026-08-22'deki
ORİJİNAL denetimin değişmemiş kaydıdır — tarihsel referans için olduğu gibi
bırakıldı. **Güncel durum için dosyanın SONUNDAKİ "E. Güncel durum" bölümüne
bakın** — 8 fazlık ilk uygulama turu (iskelet çeşitliliği, hesaplama paneli,
glossary, "Neden?" bileşeni, telemetry, RobotSpec metadata, command palette,
complexity mode) ve sonraki turun (Meca500 gerçek veri, complexity mode
yayılımı, zaman grafikleri) hangi maddeleri gerçekten kapattığını, hangilerinin
hâlâ kısmen/hiç ele alınmadığını tazeden bir denetimdir.

**Kapsam dışı (talimatla):** Madde 14, 15, 16 — kullanıcı hesabı, login,
"My Lab" kişisel workspace. Mert'in kararı: hesapsız ilke kalıcı
(`docs/00-vizyon.md`, `docs/05-deneyim-ve-guvenlik.md` Bölüm 2.1). Bu üç
maddeye dokunulmadı, aşağıda yalnız "kapsam dışı" olarak işaretlendi.

**Metodoloji notu:** Denetim doğrudan kod okunarak yapıldı (`lib/robotics/`,
`components/interactive/`, `app/`, `content/`, CI konfigürasyonu). Paralel
araştırma ajanları oturum limitine takılıp düştüğü için denetim tek oturumda,
hedefli dosya okumalarıyla tamamlandı — bu yüzden bazı maddelerde (özellikle
64, 63, 67) kanıt dosya-düzeyinde değil, makul çıkarımla işaretlendi; bunlar
metinde ayrıca belirtildi.

---

## A. ZATEN VAR

Aşağıdakiler kod tabanında gerçekten çalışan karşılığı olan maddeler.
Değiştirilmedi, sadece kanıtlandı.

**Madde 2 — Gerçek robotik hesaplama (FK/IK/Transform/Jacobian/Collision/vb).**
Bunların hepsi isim olarak değil, gerçek fonksiyon olarak var:
- `lib/robotics/kinematics.ts` — `forwardKinematics` (DH tabanlı, `kinematics.ts:33`), `inverseKinematicsAnalytical2Dof` (`:75`, kosinüs teoremi, dirsek yukarı/aşağı), `computeJacobian` (`:183`, geometrik Jacobian), `inverseKinematicsNumerical` (`:339`, sönümlü en küçük kareler/DLS, iterasyon trace'i döner), `isNearSingularity`/`SINGULARITY_THRESHOLD` (`:232-236`, Yoshikawa manipülabilitesi).
- `lib/robotics/transform.ts` — homojen dönüşüm matrisleri, DH transform.
- `lib/robotics/collision.ts` — nokta/segment çarpışma kontrolü (`isPointFree`, `isSegmentFree`).
- `lib/robotics/ikSolver.ts` — çoklu IK çözümü seçimi (`selectClosestIkSolution`), çoklu tohum arama (`solveIkTargetCandidates`).
- Joint/Cartesian space, TCP, joint limits, workspace — `RobotSpec`/`JointSpec` sözleşmesinin (`kinematics.ts:5-17`) doğrudan parçası.
Tek kısmi nokta: ivme/jerk profilleri ve tork/yerçekimi kasıtlı olarak modellenmiyor — bu bir eksiklik değil, `docs/02-mimari.md`'de "kinematik dijital prova" olarak açıkça sınırlanmış bir kapsam kararı.

**Madde 13 — Jenerik AI-site görünümünden kaçınma.**
`docs/07-tasarim-sistemi.md` bu kaçınmayı açık ilke olarak tanımlıyor (bej+serif, siyah+asit-yeşil, gazete-tipi kalıplar reddi). `app/page.tsx` bunu somutluyor: gradyan kart yok, sabit istatistik yok — ana sayfadaki sayılar (`page.tsx:28-31`) gerçek içerik manifestinden hesaplanıyor, uydurma değil.

**Madde 17 — Güvenlik genel çerçevesi.**
`docs/08-guvenlik-sertlestirme.md` tedarik zinciri, PR güvenliği, MDX güvenliği, HTTP başlıkları için somut kural seti tanımlıyor. CI (`.github/workflows/ci.yml`) bunu uyguluyor: `npm audit`, `check-mdx-guvenlik.ts`, `check-sensitive-terms` (işyeri/gizlilik terim taraması, `ci.yml` "İşyeri ve gizlilik terimleri denetimi" adımı), review makbuzu bütünlüğü.

**Madde 18 — Kod çalıştırma güvenliği.**
`lib/workers/pyodideWorker.ts:114-115` — `delete workerGlobal.fetch; delete workerGlobal.XMLHttpRequest;` — worker'da ağ erişimi kasıtlı olarak siliniyor. `components/playground/CustomRobotPlayground.tsx` ve `useCodeRunnerEngine.ts` içinde `MAX_CODE_RUNTIME_MS` (`lib/workers/executionLimits.ts`) ile 8 saniyelik `setTimeout` + `worker.terminate()` (`useCodeRunnerEngine.ts:241-250`) uygulanıyor. Her worker sonlandırılınca yeniden kurulabiliyor — bir kodun çökmesi tüm sayfayı çökertmiyor.

**Madde 19 — Robot programlama API'si.**
`lib/robotics/pythonBridge.ts` — `movej`/`movel`/`get_tcp`/`get_joints`/`forward_kinematics`/`inverse_kinematics` (docs/02'de tam liste) gerçek FK/IK fonksiyonlarını sarıyor, marka taklidi yapmıyor. "Gerçek robotlara karşılığı" içerik olarak var: `content/d-programlama/universite/d-universite-kuka-krl.mdx`, ayrıca RAPID/Mecademic/ROS2 dersleri (Hat D, 16 ders).

**Madde 22 — Singularity Lab.**
`components/interactive/JacobianViz.tsx` tam olarak bu: manipülabilite elipsi görselleştirme (`JacobianScene`), `isNearSingularity` uyarı göstergesi (`:131-136`, kırmızı kutu + açıklama metni), eklem hızı → uç hız ilişkisi canlı. "Condition number" yerine Yoshikawa manipülabilitesi kullanılıyor — eşdeğer amaç, farklı metrik.

**Madde 23 / 34 — Coordinate Frame Lab + Formül→Geometri→Robot bağlantısı.**
`components/interactive/TransformOrderLab.tsx` — "önce ötele sonra döndür" vs "önce döndür sonra ötele" (`R × T` vs `T × R`, `:23-30`) karşılaştırması, matris sırası değişince çerçeve canlı güncelleniyor. Bu iki madde aynı bileşende karşılanıyor.

**Madde 24 — FK/IK Lab.**
`JointSliders.tsx` (FK: açı→TCP), `IkTarget.tsx` (IK: TCP→açı) ayrı bileşenler. Çoklu IK çözümü: `ikSolver.ts` içindeki `solveIkTargetCandidates` (dirsek yukarı/aşağı + çoklu tohum arama).

**Madde 29 — Eğitici hata mesajları.**
`lib/robotics/pythonBridge.ts:58-61` — `"Eklem 0 için açı X° ile Y° arasında olmalı (verilen: Z°)."` gibi somut, Türkçe, sayısal mesajlar. `:105-109` — hedefe ulaşılamadığında iterasyon sayısı ve öneri veriyor. "Invalid position" tarzı jenerik mesaj yok.

**Madde 31 — Challenge sistemi.**
`components/interactive/LabChallengeUi.tsx` (paylaşılabilir metrik/görev çerçevesi), `TransferChallenge.tsx`, `CodeRunner`'daki `expectedFinalDegrees`/`toleranceDegrees` (CodeRunner.tsx:18-19) — kod çıktısı VE son eklem açıları birlikte doğrulanıyor, basit quiz değil ölçülebilir görev.

**Madde 32 — Sandbox modu.**
`app/oyun-alani` (`docs/05-deneyim-ve-guvenlik.md` Bölüm "Serbest mod"): robot seç (1-6 eklem, `lib/robotics/customRobot.ts`), joint değiştir, TCP hedef sürükle, hareket öğret/kaydet (`customRobotMotion.ts`). Eksik: tool seçimi ve kod yazma bu sayfada yok (bkz. B kategorisi madde 32).

**Madde 36 — Çocuksuz oyunlaştırma.**
`lib/evidence.ts` yetkinlik bazlı: `skillId` alanları `"forward-kinematics"`, `"multiple-ik-solutions"`, `"geometric-ik"`, `"jacobian-singularity"`, `"python-command-trace"` gibi (evidence.ts:220,241,266,284,302). XP/coin/badge yok — grep boş sonuç verdi. Docs/05 bunu zaten açık ilke olarak yasaklıyor.

**Madde 37 — Gerçek hayat bağlantısı.**
`## Gerçek dünyada` başlığı 94 MDX dersin **tamamında** sabit bölüm (doğrulandı — `content/**/*.mdx` üzerinde grep). `docs/04-icerik-rehberi.md` şablonunda zaten zorunlu.

**Madde 40 — Global search.**
`app/ara/page.tsx` + `lib/arama.ts` + `scripts/build-search-index.ts`. İndeks sadece başlık değil, `kazanımlar` VE derste MDX gövdesinin düz metni (`mdxDuzMetne`, arama.ts:50) dahil — yani ders içeriğinin tamamı aranabiliyor. Türkçe karakter normalizasyonu var (`aramaNormalize`, arama.ts:41-43).

**Madde 42 — "Next best step".**
`app/page.tsx` — `ContinueLearning` bileşeni + `CURATED_START_ROUTES` (`lib/learningRoutes.ts`) — rastgele değil, seviye başına 3 adımlık küratörlü rota. Ayrıca her dersin `onkosul` zinciri ön koşula göre "sonraki ders" öneriyor.

**Madde 43 — Session continuity (hesapsız).**
`ContinueLearning` bileşeni + `lib/evidence.ts` v2 şeması (localStorage, `robotik-platform:evidence:v2`), login gerektirmiyor — 14-16 kapsam dışı kararıyla tutarlı şekilde zaten uygulanmış.

**Madde 44 — Paylaşılabilir deneyler.**
`lib/labState.ts` (`encodeLabState`/`decodeLabState`) + `ExperimentShareButton` (`LabChallengeUi.tsx`) — `JacobianViz`, `TransformOrderLab`, `DlsTraceLab`, `CustomRobotPlayground`, `CodeRunner` dahil çoğu lab'da URL fragment ile hesapsız paylaşım zaten çalışıyor.

**Madde 45 — Performance.**
`docs/05-deneyim-ve-guvenlik.md` Bölüm 3 — ölçülmüş, dürüst kayıt: 3D'siz sayfalar Lighthouse 98-99, 3D'li ders sayfaları 73-76 (bilinçli, belgelenmiş ödünleşim — iz çizgisi imza öğesi için `drei` korunuyor). `scripts/check-performance-budget.ts` CI'da bütçe (265/245 KiB) uyguluyor.

**Madde 46 — Responsive.**
`docs/07-tasarim-sistemi.md` mobil-öncelikli strateji tanımlı; kodda `h-11` (44px dokunmatik hedef) düzinelerce yerde (`CodeRunner.tsx`, `JacobianViz.tsx` vb.), `xl:`/`lg:` breakpoint'leriyle masaüstü yan-panel / mobil sekme geçişi (`CodeRunner.tsx:152-165`).

**Madde 47 — Accessibility.**
`@axe-core/playwright` devDependency (package.json), `role="status" aria-live="polite"` düzenli kullanım (`CodeRunner.tsx:148,216`), `docs/05` Lighthouse a11y skorunun ölçülü sayfalarda 100 olduğunu kaydediyor.

**Madde 50 — Ölçü birimleri.**
`pythonBridge.ts:13-22` — `degreesToRadians`/`radiansToDegrees` merkezi dönüşüm; UI her yerde birim gösteriyor (`CodeRunner.tsx:211-212` — "m", "°" açık). Karışıklık kanıtı bulunamadı.

**Madde 51 — Sayısal girdi doğrulama.**
`lib/robotics/customRobot.ts:5-9` — link uzunluğu 0.05-2m, açı -180°..180° sabit sınırlar; `:72-107` her alan tek tek doğrulanıyor. `999999999 mm` gibi bir girdi bu sınırlarda reddediliyor.

**Madde 52 — Gerçeğe aykırı sonuç üretmeme.**
`components/playground/CustomRobotPlayground.tsx` içinde "Gerçeklik kapsamı" metni doğrulandı (grep). `docs/02-mimari.md` "kinematik dijital prova" bölümü tork/yerçekimi/ivme/jerk modellenmediğini açıkça yazıyor ve bunun arayüzde deneyin yanında göründüğünü belirtiyor.

**Madde 53 / 54 — Test altyapısı.**
`lib/` altında **57 adet** `.test.ts` dosyası (bash sayımıyla doğrulandı). `reference-python/` ile çapraz doğrulama `docs/02-mimari.md`'de tanımlı (tolerans 1e-6). `e2e/` + `playwright.config.ts` mevcut, CI'da çalışıyor.

**Madde 56 — Mimari uzun vadeye hazır.**
`lib/robotics/CLAUDE.md` — "asla window/document import etme" kuralı zorunlu tutuluyor (mobil port için). Robot kataloğu registry-tabanlı (`lib/robotics/robots/index.ts`) — yeni robot eklemek yeni dosya + registry satırı. Aşırı mühendislik yok: sadece 3 robot var, gereksiz soyutlama görülmedi.

**Madde 57 / 58 / 59 — İçerik kalitesi, ton, sahte istatistik yok.**
Ana sayfa istatistikleri (`page.tsx:130-136`) gerçek `publishedLessons`/`tracks`/`sourceCount` sayımından geliyor, sabit değer değil. `docs/04-icerik-rehberi.md` ton kuralları ("sen dili", abartı yasağı) somut ve CI'da olmasa da üretim süreci (`ders-yazari` subagent) bu şablona bağlı.

**Madde 60 — Özgün positioning.**
`docs/00-vizyon.md` "boşluk" analizi (MEB PDF / akademik slayt / satıcı sitesi karşılaştırması) ve `docs/07-tasarim-sistemi.md` "mühendislik çizimi + canlı hareket" kimliği zaten net bir konumlandırma taşıyor — Mert'in önerdiği "learn by experimenting" cümlesiyle örtüşüyor.

**Madde 62 — Her özellik için "neden?" sorusu.**
Kök `CLAUDE.md` zaten bunu süreç kuralı yapmış: "Sadece şu 4 durumda dur ve sor" + "Her özellik ekranı doldurmak için değil" ilkesi mevcut çalışma disiplini. Kod maddesi değil ama zaten uygulanan bir ilke.

**Madde 65 — Loading/error/success durumları.**
`app/loading.tsx`, `app/error.tsx` mevcut (docs/07'de tanımlı: `aria-busy`, sahte progress bar yok, hata ayrıntısı ekrana basılmıyor).

**Madde 66 — Teknik dokümantasyon.**
`docs/02-mimari.md` mimari/koordinat sözleşmesi/birimler/robot model formatını zaten kapsıyor. `content/CLAUDE.md`, `lib/robotics/CLAUDE.md` yeni içerik/robot eklemenin kurallarını taşıyor.

---

## B. KISMEN VAR

**Madde 3 — "Bu hareket neden oldu" katmanı.**
Var olan: `pythonBridge.ts` hata mesajları somut; `DlsTraceLab.tsx` HER iterasyonu gösteriyor (gizlemiyor); `JacobianViz.tsx` tekillik nedenini açıklıyor. Eksik olan: bunlar **her deneyde tek tip, açılıp kapanabilen bir "Nasıl hesaplandı?" paneli** değil — her lab kendi ad-hoc açıklamasını taşıyor. Genel/tutarlı bir "trace panel" sözleşmesi yok.

**Madde 5 — Fidelity sistemi (Conceptual/Kinematic/Advanced).**
Dürüstlük ilkesi zaten var ve güçlü (`docs/02` "kinematik dijital prova", `CustomRobotPlayground` "Gerçeklik kapsamı" kutusu) ama **etiketli, 3 seviyeli, her deneyde görünen bir sistem değil** — şu an serbest metin açıklaması. Somutlaştırmak (Conceptual/Kinematic/Advanced rozeti) ayrı bir iş.

**Madde 6 — Deney alanları "mühendislik laboratuvarı" derinliği.**
Bazı lab'lar zaten zengin (`JacobianViz` gözlem+açıklama+uyarı; `DlsTraceLab` tam iterasyon izi; `robot-hucresi` çok adımlı stüdyo) ama bu **tutarlı, adlandırılmış bir şablon değil** — her bileşen kendi yapısını icat etmiş. Mert'in önerdiği Amaç→Sistem→Playground→Observe→Inspect→Explain→Challenge iskeleti hiçbir yerde birebir yok.

**Madde 8 — Kod editörü.**
Var: run/stop/reset butonları, execution state (`yukleniyor`/`calisiyor`/`bitti`), console çıktısı, `jointTrace` step-through slider'ı (CodeRunner.tsx:239-246 — "Geri/İleri" ile adım adım gezinme, bu kısmen "step" karşılığı). **Yok:** syntax highlighting, line numbers, autocomplete, hover/documentation tooltip, format. Şu an düz `<textarea>` (CodeRunner.tsx:170-177).

**Madde 9 — Kodun robota dönüşümünü gösterme.**
`jointTrace` + `traceIndex` slider'ı komut-komut ilerlemeyi gösteriyor (CodeRunner.tsx:239-246) — kısmi karşılık. **Yok:** kod editöründe satır highlight'ı, "Target pose oluşturuldu → IK çözülüyor → Joint limits valid" gibi yan-panel anlatı akışı.

**Madde 10 — Learn/Engineering mode.**
Kod tabanında "mode"/"beginner"/"engineering" toggle'ı bulunamadı (grep boş). Var olan farklı eksen: üç **seviye** (ortaokul/lise/üniversite) — ama bu yaş/müfredat ekseni, aynı içerik üstünde açılıp kapanan bir "detay seviyesi" değil. Mert'in istediği "aynı sistemde complexity layer" kavramsal olarak yok.

**Madde 11 — Onboarding akışı.**
`CURATED_START_ROUTES` (3 seviye × 3 adım) var ve `ContinueLearning` bunu kullanıyor — bu, "Robotu Keşfet→...→Kendi Deneyini Tasarla" ruhuna yakın ama **açık, adlandırılmış bir onboarding sekansı** (adım göstergesi, "1/5" gibi) değil; küratörlü rota sessizce var.

**Madde 20 — Data-driven robot modeli.**
`RobotSpec` gerçekten veri-tabanlı (joints/limits/DH/maxVelocity) ve yeni robot eklemek dosya eklemek — ama alan seti minimal: `manufacturer`, `maxReach`, `toolFrame`, `baseFrame` gibi metadata alanları **yok** (`kinematics.ts:12-17` sadece `id`, `displayName`, `joints`, `meshUrl`). Katalog da küçük: yalnız 3 jenerik robot (`generic-2dof`, `generic-prismatic`, `generic-6dof`) — içerikte adı geçen Meca500 gibi markalı robotlar birer `RobotSpec` olarak yok, sadece metinsel referans.

**Madde 21 — Workspace/reachability görselleştirmesi.**
Metinsel geri bildirim var (IK başarısız olunca `pythonBridge.ts` neden açıklıyor). **Görsel** reachable/near-limit/unreachable/singularity-risk bölge boyaması bulunamadı — sahnede bu tür bir katman yok.

**Madde 25 — Path Planning Lab.**
`PlannerRace.tsx` gerçek A*/RRT/RRT* yarışı yapıyor (nokta-nokta planlama, engel etrafında). Ama Mert'in istediği "joint interpolation vs cartesian linear" (MoveJ/MoveL) karşılaştırması **ayrı bir kavram** — bu şu an sadece Hat B üniversite içeriğinde metin olarak var, interaktif yan-yana karşılaştırma yok. Joint-açısı/zaman grafiği de yok (madde 27'ye bağlı).

**Madde 28 — Robot state sistemi.**
`CodeRunner` kendi informal state'ini tutuyor (`"yukleniyor"|"calisiyor"|"bitti"`) ama bu tek bileşene özel — `IDLE/PLANNING/MOVING/PAUSED/COMPLETED/ERROR/COLLISION/UNREACHABLE` gibi paylaşılan, tüm robot bileşenlerinin uyduğu bir state machine yok (grep `robotCellStudio.ts` içinde bulunamadı).

**Madde 30 — "What if" deneyleri.**
Kavramsal olarak zaten mümkün (`/oyun-alani`'da link uzunluğu/limit değiştirilebiliyor, sonuç canlı gözlemleniyor) ama bu **"What if tool'u 20cm uzatırsan?" tarzı çerçevelenmiş bir soru-deney** olarak sunulmuyor — kullanıcı kendiliğinden keşfetmek zorunda, sistem soruyu sormuyor.

**Madde 33 — "Why?" butonu.**
Açıklayıcı metin dağınık olarak zaten var (JacobianViz tekillik paragrafı, pythonBridge hata mesajları) ama **tek, tekrar kullanılabilir bir "Neden?" bileşeni/deseni** yok — her yerde ayrı ayrı yazılmış statik metin.

**Madde 35 — Concept→Simulation→Code modeli.**
Hat D dersleri zaten kavram→simülasyon→kod bağını kuruyor (Python API, `movej`/`movel` içerik akışı) ama bu **açıkça 3 etiketli bölüm** olarak MDX şablonunda yok — docs/04'teki 5 sabit başlığa (Kanca/Ne oldu/Gerçek dünyada/Dene/Sonraki) gömülü, ayrı görünmüyor.

**Madde 39 — Command palette / hızlı erişim.**
Bulunamadı (`cmdk` paketi yok, `Ctrl+K` grep'i boş). Not: bu madde 14-16 kapsam dışı kararıyla **ilgisiz** — hesapsız mimariyle tamamen uyumlu bir özellik, sadece henüz yapılmamış.

**Madde 41 — Knowledge graph.**
Veri düzeyinde var: `onkosul` alanı + `scripts/validate-content-graph.ts` (döngü/kopuk düğüm kontrolü) gerçek bir graph. **Kullanıcıya görünen görsel graph** (TCP→Frames→Transform→FK gibi ilişki haritası) yok — sadece "ön koşul" tek yönlü linki var.

**Madde 48 / 49 — Design system / micro-interactions.**
`components/ui/` içinde 10 paylaşılan bileşen (Tabs, ThemeProvider, StatePage vb.) tutarlı bir taban oluşturuyor. Micro-interaction kısmen var: `JacobianViz` eklem rengi sahne ile eşleşiyor (`jointColors`), TCP izi çiziliyor (imza öğesi). Ama "hata olduğunda problemli joint'in vurgulanması" gibi sistematik bir kalıp her yerde doğrulanamadı.

**Madde 55 — Debug mode.**
`DlsTraceLab.tsx` iterasyon/hata/residual verisini **her kullanıcıya varsayılan olarak** gösteriyor (bu aslında madde 3/4'ün de bir parçası) — ama bu "geliştirici için opsiyonel, gizlenebilir bir debug modu" değil, her zaman açık bir öğretim aracı. Mert'in istediği "normal kullanıcı görmek zorunda değil" ayrımı yok.

**Madde 63 — Bilgi mimarisi / navigasyon.**
Navigasyon zaten var (`SiteHeader`, `MobileNavMenu`) ve `/ders`, `/oyun-alani`, `/laboratuvar`, `/kod-akademisi`, `/ogretmen`, `/sozluk`, `/ara` gibi ayrı, isimlendirilmiş alanlara sahip — bu Mert'in istediği Learn/Labs/Code/Sandbox/Challenges ayrımına kavramsal olarak yakın. Kullanıcının gerçekten kaybolup kaybolmadığı gerçek tarayıcı testi gerektirir, bu denetimde doğrulanmadı.

**Madde 64 — Empty state'ler.**
`components/ui/StatePage.tsx` paylaşılan bir durum bileşeni olarak var (dosya listesinde görüldü) — muhtemelen boş/hata/yükleniyor durumlarını kapsıyor, ama içeriği tek tek okunmadı; her "boş" senaryonun (örn. henüz deney kaydı yok) yönlendirici metin taşıyıp taşımadığı doğrulanmadı.

---

## C. YOK — gerçek boşluk

**Madde 7 — Aynı sayfa formatının sürekli tekrarı.**
**Doğrulandı, gerçek ve önemli bir boşluk.** `content/` altındaki **94 MDX dersin tamamı**, istisnasız aynı 5 başlığı taşıyor: `## Kanca` → `## Ne oldu` → `## Gerçek dünyada` → `## Dene` → `## Sonraki` (b-ortaokul, b-lise, h-universite, d-universite dosyalarından örneklendi — hepsi birebir aynı). `docs/04-icerik-rehberi.md` zaten "kanca çeşitliliği" kuralına sahip (retorik açılış tekrarını önlüyor) ama bu yalnız **açılış cümlesini** çeşitlendiriyor — sayfanın **yapısal iskeleti** (5 sabit başlık) hiçbir derste değişmiyor. Mert'in "Guided Discovery / Mission / Debug the Robot / Predict Before Run / Compare / Build It / Free Lab" önerisi tam olarak bu sabit iskeleti kırmayı hedefliyor. Bu, projenin kendi mimarisiyle çelişmiyor (docs/04 şablonu bir öneri, dogma değil) — gerçek, üretilebilir bir boşluk.

**Madde 4 — Progressive disclosure (Basit→Teknik→Formül).**
Grep'te "Basit Açıklama"/"Teknik Detay"/"Formülü Göster" gibi bir kademeli açılım deseni bulunamadı. Madde 5 ve 10 ile aynı kökten (complexity layer eksikliği) ama ayrı bir UI mekanizması istiyor.

**Madde 26 — Telemetry panel.**
Açılıp kapanabilen, TCP/orientation/joint/velocity/frame/trajectory-progress/distance-to-target'ı tek yerde toplayan bir panel yok. Bazı veriler dağınık olarak var (CodeRunner TCP satırı) ama toplu, gizlenebilir bir panel değil.

**Madde 27 — Zaman grafikleri.**
`package.json`'da hiçbir chart kütüphanesi yok (recharts/chart.js/d3/victory/nivo — hepsi grep'te boş). Joint-angle-vs-time, velocity-vs-time, TCP-position-vs-time grafiği hiçbir yerde yok. Bu, madde 25'in de (path planning karşılaştırması) neden eksik kaldığının bir parçası.

**Madde 38 — Teknik terimleri context içinde tıklanabilir hale getirme.**
`Tooltip`/`Glossary` bileşeni bulunamadı. `/sozluk` ayrı bir sayfa (72 terim, `content/sozluk.json`) ama derste geçen "TCP" veya "Jacobian" kelimesi tıklanıp içerik içinde açılmıyor — kullanıcı ayrı sayfaya gitmek zorunda, tam olarak Mert'in kaçınılmasını istediği şey.

**Madde 39 (tekrar, netlik için) — Command palette.**
Yukarıda B'de not edildi ama net YOK: hiçbir kod karşılığı yok, ekleme maliyeti düşük.

---

## D. ÇELİŞİYOR

Madde 14-16 dışında, mevcut `docs/00-15` ilkeleriyle doğrudan çelişen bir
madde **bulunamadı**. 68 maddenin geri kalanı ya zaten uygulanmış ilkelerle
örtüşüyor (statik site, hesapsız, kaynak zorunluluğu, minimum bağımlılık)
ya da bu ilkeleri ihlal etmeden eklenebilir boşluklar. Özellikle dikkat
edilen olası çelişki noktaları ve neden çelişmedikleri:

- **Madde 39/26/27 (yeni UI özellikleri)** — "minimum bağımlılık ilkesi"ni
  (docs/08) tetikleyebilir (chart kütüphanesi, command palette kütüphanesi
  gibi yeni paketler). Bu bir çelişki değil, bir **karar noktası**: herhangi
  bir uygulama fazında "50 satırda kendimiz yazabilir miyiz" sorusu
  sorulmalı (örn. basit SVG çizgi grafiği chart kütüphanesi olmadan
  yazılabilir — mevcut `TransformOrderLab`/`JacobianViz` zaten elle SVG
  çiziyor, presedan var).
- **Madde 8 (gerçek kod editörü — CodeMirror/Monaco)** — yine minimum
  bağımlılık ilkesiyle gerilimli ama çelişkili değil; docs/08 "50 satır
  kendimiz yazabilir miyiz" testini geçemeyecek kadar büyük bir özellik
  (syntax highlighting) için meşru bir istisna adayı.
- **Madde 43 (session continuity)** — orijinal madde metninde "Login olan
  kullanıcı..." diye başlıyor; bu literal haliyle 14-16 kapsam dışı kararıyla
  çelişirdi. Ama PROMPT-urun-denetimi.md zaten bunu düzeltmiş
  (`[NOT: hesapsız...]`) ve kod tabanı zaten hesapsız halde bu işlevi
  taşıyor (`ContinueLearning`). Çelişki daha talep aşamasında giderilmiş.

---

## Önerilen 5-8 sonraki adım (etki/risk sıralı)

Aşağıdakiler gerçek boşluklardan (B ve C kategorisi), en yüksek etki / en
düşük risk taşıyanlar. Sıralama: önce mimariyi değiştirmeyen, mevcut
desenleri genişleten işler; sonra yeni desen gerektirenler.

1. **Madde 7 — Ders sayfası iskeletini çeşitlendir.** En yüksek etki, çünkü
   Mert'in ana şikayetlerinden biri ("her yerde aynı yapı") doğrudan burada
   kanıtlandı. Risk düşük: `docs/04-icerik-rehberi.md` şablonunu tek bir
   zorunlu iskeletten, ders TÜRÜNE göre seçilebilen 3-4 iskelete
   (örn. "Standart", "Mission", "Debug the Robot", "Compare") genişletmek
   — mevcut MDX/frontmatter mimarisini bozmaz, sadece şablon çeşitliliği
   ekler. Var olan bileşenler (`PredictionPrompt`, `TransferChallenge`,
   `LabChallengeUi`) zaten bu farklı formatların çoğunu teknik olarak
   destekliyor; eksik olan içerik-yazım kuralı ve birkaç örnek ders.

2. **Madde 55/3/4 birleşik — "Nasıl hesaplandı?" ortak paneli.**
   `DlsTraceLab` ve `JacobianViz`'in zaten yaptığı şeyi (iterasyon/residual/
   neden açıklaması) tek, tekrar kullanılabilir bir bileşene çıkarmak.
   Orta risk: yeni bir `components/interactive/HesaplamaIzi.tsx` gibi
   paylaşılan bir bileşen gerektirir ama var olan iki lab'ın kodunu
   tekrar kullanabilir — sıfırdan tasarım değil, çıkarma (extraction) işi.

3. **Madde 38 — Terimleri context içinde açan mini-glossary.**
   `content/sozluk.json` zaten 72 terimlik veri kaynağı olarak hazır. Yeni
   bir `Terim` MDX bileşeni (`components/interactive/`'e eklenir, docs/08
   MDX allowlist kuralına uyar) sözlük verisini tıklanan terimin yanında
   popover olarak gösterebilir. Düşük risk, yüksek okunabilirlik kazancı.

4. **Madde 33 — "Neden?" butonu, tek bileşen olarak.** Madde 2 ile aynı alt
   yapıyı (JacobianViz, pythonBridge mesajları) kullanabilir; asıl iş
   dağınık açıklama metnini tek bir `<Neden acikla="...">` deseninde
   toplamak. Düşük risk, orta etki — mevcut metinleri yeniden bileşenleştirme.

5. **Madde 26/27 — Basit telemetry paneli + SVG zaman grafiği (chart
   kütüphanesi olmadan).** `TransformOrderLab`/`JacobianViz`'in zaten
   elle SVG çizdiği presedanı kullanarak, yeni bağımlılık eklemeden basit
   bir "joint açısı / zaman" çizgi grafiği ve açılıp kapanabilen bir
   telemetry paneli mümkün. Orta risk (yeni tasarım gerektirir) ama
   madde 25'i (path planning karşılaştırması) de kilitliyor — birlikte ele
   alınabilir.

6. **Madde 20 — RobotSpec metadata alanlarını genişlet
   (`manufacturer`, `maxReach`, opsiyonel).** `docs/02-mimari.md`
   güncellenmesi gerektiren bir çekirdek sözleşme değişikliği (kök
   `CLAUDE.md`'nin "dur ve sor" listesindeki 1. madde) — bu yüzden
   düşük öncelikli ama işaretlenmeli: mevcut `RobotSpec` içeriğe (Meca500
   gibi marka referansları) görsel/veri karşılığı vermiyor, sadece metin
   kalıyor.

7. **Madde 10/5 — Complexity layer (Learn/Engineering mod veya Fidelity
   etiketi).** En yüksek mimari risk: yeni bir global durum ekseni
   (mevcut seviye ekseninden bağımsız) gerektirir, çok sayıda bileşeni
   etkiler. Değerli ama en son ele alınmalı — önce yukarıdaki daha ucuz
   işler yapılıp deneyim birikince tasarlanmalı.

8. **Madde 39 — Command palette (Ctrl+K).** Bağımsız, izole bir özellik;
   diğerlerini beklemeden herhangi bir zamanda eklenebilir. Sıralamada son
   olmasının sebebi risk değil, göreli düşük etki (mevcut `/ara` sayfası
   zaten arama ihtiyacının çoğunu karşılıyor).

**Not:** Madde 20 hariç yukarıdakilerin hiçbiri `docs/02-mimari.md`'deki
çekirdek sözleşmeleri (`RobotSpec`/`PlanResult`/`Planner`) değiştirmiyor —
kök `CLAUDE.md`'deki "dur ve sor" eşiğinin altında kalıyorlar. Uygulama
fazına geçilirse her biri ayrı, küçük bir dal olarak ele alınabilir.

---

# E. Güncel durum (2026-08-23 taraması)

Yukarıdaki A/B/C/D bölümleri 2026-08-22'nin dondurulmuş kaydı. Bu bölüm,
o tarihten bu yana yapılan iki turu (`docs/durum-denetim.md`'deki "Faz 1-8"
ve "Faz A/B" girişleri, satır satır okunarak) her maddeye karşı yeniden
denetliyor. Metodoloji: her Faz'ın durum-denetim.md kaydı okundu (ne
yapıldı, ne BİLİNÇLİ OLARAK yapılmadı, hangi kapsam daraltıldı), sonra
kod tabanında `grep`/dosya sayımıyla iddialar doğrulandı (ör. glossary'nin
kaç derste kullanıldığı, complexity-mode desteğinin kaç bileşende olduğu
tek tek sayıldı, varsayılmadı).

## Yapılan iki tur — hangi madde hangi Faz'da ele alındı

| Faz | Ne yapıldı | docs/16 maddesi |
|---|---|---|
| Faz 1 (2026-08-22) | Ders sayfası şablon çeşitliliği — yalnız 10/94 derste (`sablon: gorev`/`karsilastirma`) | 7 |
| Faz 2 (2026-08-22) | Ortak "Nasıl hesaplandı?" paneli — yalnız DlsTraceLab+JacobianViz | 3, 4 |
| Faz 3 (2026-08-22) | Inline glossary bileşeni — yalnız 2/94 derste pilot | 38 |
| Faz 4 (2026-08-22) | "Neden?" bileşeni — yalnız IkTarget | 33 |
| Faz 5 (2026-08-22) | Zaman grafiği — yalnız oyun-alanı, yalnız eklem açısı | 26, 27 |
| Faz 6 (2026-08-23) | RobotSpec `metadata` alanı eklendi — **3 katalog robotunda da boş bırakıldı** (hiçbiri gerçek marka değil) | 20 |
| Faz 7 (2026-08-23) | Öğren/Mühendislik modu — dikey dilim → JacobianViz/DlsTraceLab'a yayıldı → kök `layout.tsx`de global toggle | 5, 10 |
| Faz 8 (2026-08-23) | Command palette (Ctrl+K) | 39 |
| *(Codex, 2026-08-23)* | Kaynaklı Meca500 R4 preseti (`meca500-r4`) katalog kaydına eklendi — **hiçbir derste/bileşende render edilmiyor** | 20 |
| Faz A (2026-08-23, bu oturum) | Complexity mode → PlannerRace/SafetyZone/CspaceLab'a yayıldı (toplam 6 bileşen) | 5, 10 |
| Faz B (2026-08-23, bu oturum) | Zaman grafiği → robot hücresi Yol provası'na (eklem açısı + hız + TCP konumu) | 26, 27 |

**Önemli düzeltme — docs/16'nın kendisi bir maddeyi eksik değerlendirmiş:**
Madde 25 ("MoveJ/MoveL — joint interpolation vs cartesian linear
karşılaştırması yok" diyordu) yanlıştı: `/laboratuvar/robot-hucresi`nin
"Yol provası" sekmesi bu karşılaştırmayı **2026-08-12'den beri** (docs/16
yazılmadan 10 gün önce) yapıyordu — `RobotCellMotionWorkbench.tsx`,
`MotionResultCard`, gerçek IK/çarpışma kontrollü iki ayrı yol. Denetim bunu
gözden kaçırmış (muhtemelen "Hat B içeriği" aramış, standalone `/laboratuvar`
sayfasına bakmamış). Bugün (Faz B) bu karta zaman grafiği de eklenince madde
tamamen kapandı.

## Tam tablo — her B+C maddesi tek tek

| # | Madde (kısa) | 2026-08-22 durumu | 2026-08-23 durumu | Kanıt |
|---|---|---|---|---|
| 3 | "Neden oldu" katmanı | Kısmen (ad-hoc) | **TAMAMLANDI** | `NasilHesaplandi.tsx` 6 bileşende: IkTarget, JacobianViz, DlsTraceLab, PlannerRace, SafetyZone, CspaceLab |
| 4 | Progressive disclosure | Yok | **TAMAMLANDI** | Aynı `NasilHesaplandi` — Madde 3 ile aynı kök, Faz 2'de netleşti |
| 5 | Fidelity (3 etiketli seviye) | Kısmen | **Kısmen — değişmedi** | Learn/Engineering 2 durumlu toggle var ama Mert'in istediği Conceptual/Kinematic/Advanced 3-etiketli sistem literal olarak yok |
| 6 | Lab derinliği tutarlı şablon | Kısmen | **Kısmen — güçlendi** | 6 lab artık aynı `NasilHesaplandi`/`Neden` desenini paylaşıyor ama Amaç→Sistem→Playground→Observe→Inspect→Explain→Challenge tam iskeleti hiçbir yerde yok |
| 7 | Ders sayfası iskelet çeşitliliği | Yok (gerçek boşluk) | **Kısmen — 10/94 ders** | `sablon: gorev` (7), `sablon: karsilastirma` (3); D (16 ders) ve E (11 ders) grupları BİLİNÇLİ OLARAK yapılmadı (D zaten farklı, E yeni içerik ister); ayrıca `docs/02-mimari.md`'nin `presentationHash` alan listesine `sablon` hâlâ eklenmedi (bekleyen governance borcu) |
| 8 | Kod editörü (syntax/autocomplete) | Kısmen (düz `<textarea>`) | **Kısmen — çoğu kapandı** | `PythonCodeEditor.tsx` (CodeMirror): syntax highlight ✓, satır numarası ✓, robot API autocomplete ✓, hata satırı vurgusu ✓ (bonus). Kalan: hover/dokümantasyon tooltip yok, format/otomatik biçimlendirme yok |
| 9 | Kod→robot dönüşüm izi (satır vurgusu) | Kısmen | **Kısmen — değişmedi** | `jointTrace`/`traceIndex` slider'ı var ama editördeki `errorLineField` yalnız HATA satırını vurguluyor; başarılı çalıştırmada geçerli/yürütülen satırı `traceIndex`'e senkron vuran bir vurgu yok |
| 10 | Learn/Engineering mode | Kısmen (yok, kavramsal) | **TAMAMLANDI** | Global toggle (`SiteHeader`), `ComplexityModeProvider` kök `layout.tsx`de, 6 bileşen destekliyor, `storage` olayıyla sekmeler arası senkron |
| 11 | Onboarding akışı (adım göstergeli) | Kısmen | **Kısmen — değişmedi** | `CURATED_START_ROUTES` hâlâ sessiz, "1/5" gibi açık adım göstergesi yok |
| 20 | RobotSpec metadata (marka) | Kısmen (alan yok) | **Kısmen — veri var, gösterilmiyor** | `metadata?: RobotMetadata` alanı + `RobotInfoLine.tsx` var; `meca500-r4` kaynaklı gerçek preset katalogda kayıtlı AMA hiçbir derste/bileşende `robot="meca500-r4"` kullanılmıyor — sourced veri üretildi, kullanıcıya hiç görünmüyor |
| 21 | Workspace/reachability görselleştirme | Kısmen (yalnız metin) | **HİÇ ELE ALINMADI** | Değişmedi — reachable/near-limit/singularity-risk bölge boyaması yok |
| 25 | Path Planning Lab (MoveJ/MoveL) | Kısmen (docs/16'nın kendi hatası — bkz. yukarıdaki düzeltme) | **TAMAMLANDI** | RobotCellStudio Yol provası (2026-08-12'den beri) + Faz B'nin zaman grafikleri (bugün) |
| 26 | Telemetry paneli (birleşik) | Yok | **Kısmen — parçalar iyileşti, birleşik panel yok** | TCP satırı (oyun-alanı) + joint/velocity/TCP zaman grafikleri (Faz B) var ama TEK, adlandırılmış, açılıp-kapanabilen "telemetry panel" hâlâ yok — her biri kendi bileşeninde dağınık |
| 27 | Zaman grafikleri | Yok | **TAMAMLANDI** | Oyun-alanı (eklem açısı) + robot hücresi (eklem açısı+hız+TCP konumu, Faz B). DlsTraceLab/PlannerRace bilinçli dışarıda — gerçek zaman verisi yok, Madde 52 dürüstlük ilkesi |
| 28 | Robot state machine | Kısmen | **HİÇ ELE ALINMADI** | Değişmedi — paylaşılan `IDLE/PLANNING/MOVING/...` state machine yok |
| 30 | "What if" çerçeveli deney | Kısmen | **HİÇ ELE ALINMADI** | Değişmedi |
| 33 | "Neden?" butonu | Kısmen (dağınık metin) | **Kısmen — mekanizma kanıtlı, kapsam dar** | `Neden.tsx`/`InlineNot.tsx` çalışıyor ama yalnız IkTarget'ta (8 ders) kullanılıyor; JacobianViz/DlsTraceLab/PlannerRace/SafetyZone/CspaceLab'a eklenen şey `NasilHesaplandi` (durağan), `Neden` (duruma bağlı) değil |
| 35 | Concept→Sim→Code (3 etiketli) | Kısmen | **HİÇ ELE ALINMADI** | `sablon` işi anlatı SIRASINI değiştiriyor, 3 ayrı etiketli bölüm oluşturmuyor — farklı eksen |
| 38 | Inline glossary | Yok | **Kısmen — mekanizma kanıtlı, kapsam çok dar** | `Terim`/`TerimInline.tsx` çalışıyor, test edilmiş, ama yalnız 2/94 derste (`a-lise-calisma-uzayi`, `b-universite-jacobian`) kullanılıyor |
| 39 | Command palette | Yok | **TAMAMLANDI** | Ctrl+K, `CommandPalette.tsx`, global |
| 41 | Knowledge graph (görsel) | Kısmen (yalnız veri) | **HİÇ ELE ALINMADI** | `onkosul` graph verisi hâlâ yalnız CI doğrulaması için, kullanıcıya görsel graph yok |
| 48/49 | Design system/micro-interactions | Kısmen | **Kısmen — ufak tutarlılık kazancı** | `RobotInfoLine` + complexity-mode toggle deseni tekrar kullanılabilir hale geldi ama sistematik "hata olan joint'i vurgula" gibi bir kalıp hâlâ doğrulanmadı |
| 55 | Debug mode (gizlenebilir) | Kısmen | **Kısmen — değişmedi** | Paneller HERKESE varsayılan kapalı ama her zaman görünür/tıklanabilir; "normal kullanıcı hiç görmesin" ayrımı yok |
| 63 | Bilgi mimarisi/navigasyon | Kısmen | **Kısmen — değişmedi** | Gerçek kullanıcı testi hâlâ yapılmadı |
| 64 | Empty state'ler | Kısmen | **Kısmen — değişmedi** | `StatePage.tsx` içeriği hâlâ tek tek doğrulanmadı |

## Özet tablo

**TAMAMLANDI (6):** Madde 3, 4, 10, 25, 27, 39.

**HÂLÂ KISMEN VAR (13):** Madde 5, 6, 7, 8, 9, 11, 20, 26, 33, 38, 48/49,
55, 63, 64.

**HİÇ ELE ALINMADI (5):** Madde 21, 28, 30, 35, 41.

(Madde 1-2, 12-19, 22-24, 29, 31-32, 34, 36-37, 40, 42-47, 50-54, 56-62,
65-67 zaten "ZATEN VAR" kategorisindeydi ve hiçbir Faz bunları bozmadı —
değişmedi, yeniden doğrulanmadı çünkü doğrulanacak yeni bir şey yok.)

## Önerilen sıradaki 5 — etki/risk sıralı

Aşağıdakiler KISMEN VAR + HİÇ ELE ALINMADI havuzundan, en düşük risk/en
yüksek etki mantığıyla seçildi. Ortak tema: **hepsi zaten inşa edilmiş,
test edilmiş bir mekanizmanın KAPSAMINI genişletiyor** — yeni mimari karar
gerektiren hiçbiri yok, hepsi "yayılım" işi.

1. **Madde 38 — Glossary'yi 2 dersten daha fazlasına yay.** En düşük risk:
   `Terim`/`TerimInline` zaten çalışıyor, test edilmiş, MDX allowlist'te.
   İş yalnız hangi terimlerin hangi derslerde ilk geçtiğini bulup
   `<Terim ad="...">` eklemek — içerik-yazım işi, kod değişikliği yok.
   Düşük risk, orta-yüksek etki (okunabilirlik, madde 38'in orijinal amacı
   "kullanıcı ayrı sayfaya gitmek zorunda kalmasın").

2. **Madde 20 — Meca500'ü gerçekten bir yerde göster.** Veri zaten
   kaynaklı ve test edilmiş (`meca500-r4`), ama hiçbir kullanıcı bunu
   göremiyor. En doğal yer: `d-universite-mecademic-python.mdx` dersine
   `<JointSliders robot="meca500-r4">` veya `<RobotInfoLine>` eklemek, ya
   da `/oyun-alani`/`RobotSelectionTable`a bir seçenek olarak katmak.
   Düşük risk (RobotSpec zaten var ve test edilmiş, yalnız içerik/bileşen
   bağlama işi), yüksek "kapanış" değeri — çok oturumluk bir kaynak
   araştırmasının meyvesi şu an kimseye görünmüyor.

3. **Madde 33 — "Neden?" bileşenini IkTarget dışına yay.** Desen kanıtlı
   ve test edilmiş; JacobianViz'in manipülabilite değeri, DlsTraceLab'ın
   güncel λ'sı, PlannerRace'in seçilen algoritma gerekçesi gibi DURUMA BAĞLI
   değerlere `Neden` eklenebilir (bunlar zaten `NasilHesaplandi` — durağan
   — taşıyor, `Neden` — duruma bağlı — ayrı ve tamamlayıcı). Düşük risk,
   orta etki.

4. **Madde 9 — Editördeki satır vurgusunu `jointTrace` adımına senkronla.**
   `PythonCodeEditor.tsx`'teki `errorLineField`/`setErrorLine` altyapısı
   ŞU AN yalnız hata satırı için var ama aynı mekanizma "şu an yürütülen
   satır" için de kullanılabilir — CodeRunner'ın zaten var olan
   `traceIndex` state'i editöre bir efekt olarak bağlanabilir. Düşük-orta
   risk (iki bileşen arası yeni bir bağlantı gerektirir), yüksek etki —
   platformun kendi iddiasının ("kodun robota dönüşümünü göster") tam
   karşılığı.

5. **Madde 26 — Dağınık telemetriyi tek, adlandırılmış bir panelde
   topla.** Faz B zaman grafikleri + oyun-alanının TCP satırı zaten VAR
   ama her biri kendi bileşeninde ayrı duruyor. Tek bir `TelemetryPanel`
   deseni (açılıp kapanabilen, docs/16 madde 26'nın istediği TCP/orientation/
   joint/velocity/frame/trajectory-progress alanlarını tek yerde toplayan)
   bu parçaları yeniden kullanabilir. Orta risk (tasarım kararı gerektirir
   — hangi lab'larda görünecek, hangi alanlar zorunlu), orta-yüksek etki.

**Kasıtlı olarak DIŞARIDA bırakılanlar** (düşük öncelik, yüksek
efor/mimari risk): Madde 7'nin D/E grupları (D zaten bilinçli "kesif"
kaldı, E yeni içerik ister — küçük bir "sonraki adım" değil, ayrı bir
içerik projesi), Madde 21 (workspace görselleştirme — yeni bir görsel
katman), Madde 41 (bilgi grafiği — yeni bir sayfa/görselleştirme), Madde
5'in literal 3-etiketli fidelity sistemi (mevcut 2-durumlu toggle'ın
üstüne yeniden etiketleme riski, muhtemelen gerekmiyor).
