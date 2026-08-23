# Teknik mimari

## En kritik karar: hesaplama tarayıcıda yapılır

Mevcut proje Python + PyBullet + FastAPI olarak kuruldu. Bu, **herkese açık bir
eğitim sitesi için yanlış mimari.** Sebepleri:

- Her ziyaretçi için sunucuda fizik simülasyonu çalıştırmak pahalı ve yavaş.
- Kaydırıcıyı oynattığında cevabın anında gelmesi gerekir; ağ gecikmesi
  öğrenme deneyimini bitirir.
- Sunucu maliyeti projeyi sürdürülemez kılar (bu proje ücretsiz olacak).

**Karar:** etkileşimli hesaplama (FK, IK, planlama, çarpışma) TypeScript'e
taşınır ve tarayıcıda çalışır. Site statik olarak yayınlanır, sunucu maliyeti
sıfıra yakın olur.

### Peki mevcut Python kodu ne olacak

Çöpe gitmiyor, üç işi üstleniyor:

1. **Doğruluk kaynağı (test oracle).** TypeScript portu, Python + PyBullet
   sonuçlarıyla karşılaştırılarak doğrulanır. "Aynı girdiye aynı çıktı" testleri.
2. **İleri seviye indirilebilir alıştırmalar.** Üniversite seviyesindeki
   öğrenci kendi makinesinde gerçek PyBullet ile çalışsın diye hazır depo.
3. **İçerik üretim aracı.** Referans görseller, animasyonlar, örnek veri
   üretmek için.

### Üniversite seviyesinde Python tarayıcıda

İleri derslerde öğrencinin gerçekten Python yazması gerekiyor. Bunun için
Pyodide (WebAssembly üzerinde CPython) kullanılır: öğrenci tarayıcıda gerçek
Python yazar, çıktısı 3D sahneyi sürer. Ağır bir bağımlılık (~10 MB), o yüzden
sadece gerektiği derste, tembel yüklemeyle (lazy load) getirilir.

---

## Yığın (stack)

| Katman | Seçim | Gerekçe |
|---|---|---|
| Çatı | Next.js (App Router), statik dışa aktarım | SEO önemli — Türkçe aramalarda bulunmak gerek. Statik = bedava yayın. |
| Dil | TypeScript | Tip güvenliği, matematik kodunda hata yakalar. |
| 3D | Three.js + react-three-fiber | Olgun, iyi belgelenmiş, React ile uyumlu. |
| 3D yardımcı | @react-three/drei | Kamera kontrolü, ızgara, yardımcı nesneler hazır. |
| İçerik | MDX | Markdown içine etkileşimli React bileşeni gömülebilir. |
| Stil | Tailwind CSS | Hızlı, tutarlı, öğrenmesi kolay. |
| Matematik gösterimi | KaTeX | Formüller düzgün görünsün. |
| Python (ileri dersler) | Pyodide | Tarayıcıda gerçek Python. |
| Test | Vitest (birim), Playwright (uçtan uca) | |
| Yayın | Vercel veya Cloudflare Pages | Statik, ücretsiz katman yeterli. |
| Analitik | Plausible veya hiç | Gizlilik dostu; ya da hiç izleme yok. |

---

## Klasör yapısı

```
robotik-platform/
├── app/                      Next.js sayfaları
│   ├── page.tsx              ana sayfa
│   ├── seviye/[seviye]/      seviye giriş sayfaları
│   └── ders/[slug]/          ders sayfası (MDX render)
├── content/                  TÜM DERS İÇERİĞİ — kod değil, veri
│   ├── a-temeller/
│   │   ├── ortaokul/
│   │   ├── lise/
│   │   └── universite/
│   ├── b-kinematik/
│   └── ...
├── lib/
│   ├── robotics/             ÇEKİRDEK MATEMATİK (TypeScript)
│   │   ├── transform.ts      homojen dönüşüm, dönme matrisleri
│   │   ├── kinematics.ts     FK, IK, Jacobian
│   │   ├── collision.ts      çarpışma kontrolü
│   │   ├── planners/         astar.ts, rrt.ts, rrtStar.ts
│   │   └── robots/           robot tanımları (DH parametreleri)
│   ├── content.ts            MDX okuma, frontmatter ayrıştırma
│   └── evidence.ts           sürümlü deney olayları (tarayıcı belleğinde)
├── components/
│   ├── scene/                3D sahne bileşenleri
│   │   ├── RobotArm.tsx
│   │   ├── Workspace.tsx
│   │   └── PathTrace.tsx
│   ├── interactive/          derslere gömülen etkileşimli bloklar
│   │   ├── JointSliders.tsx  eklem kaydırıcıları (FK dersi)
│   │   ├── IkTarget.tsx      hedef sürükle (IK dersi)
│   │   ├── PlannerRace.tsx   algoritma yarışı (planlama dersi)
│   │   ├── CodeRunner.tsx    Python/blok çalıştırıcı
│   │   └── Quiz.tsx          alıştırma bileşeni
│   └── ui/                   düğme, kart, navigasyon
├── reference-python/         mevcut Python projesi (oracle + indirilebilir)
└── docs/                     bu planlama dokümanları
```

### `lib/robotics/` geliştirici haritası ve veri akışı

`lib/robotics/` bir sahne veya durum yöneticisi değil, tarayıcıda çalışan saf
TypeScript hesaplama katmanıdır. Yeni kodu hangi dosyaya koyacağını şu ayrımla
belirle:

| Katman | Dosyalar | Sorumluluk |
|---|---|---|
| Matematik temeli | `transform.ts`, `kinematics.ts`, `collision.ts`, `random.ts` | Matris/vektör işlemleri, FK/IK/Jacobian, çarpışma ve deterministik rastgelelik |
| Algoritmalar | `planners/` | Ortak `Planner` sözleşmesini kullanan A*, RRT ve RRT* |
| Robot verisi | `robots/` | Değişmez `RobotSpec` presetleri ve id → preset kayıt defteri |
| Deney motorları | `learningLabs.ts`, `fourLensTrace.ts`, `safety.ts`, `blockProgram.ts`, `robotCell*.ts` | UI'dan bağımsız deney durumu, hesap ve doğrulama kuralları |
| Sınır/uyarlayıcı | `pythonBridge.ts`, `customRobot.ts` | Dış girdiyi doğrulayıp çekirdek sözleşmelere çevirme |
| Testler | Aynı dizindeki `*.test.ts` dosyaları | Saf motoru DOM/React olmadan doğrulama |

Tipik veri akışı şöyledir:

```text
MDX prop'ları + kullanıcı girdisi
  → etkileşimli bileşenin yerel durumu
  → getRobotById(...) + saf lib/robotics fonksiyonu
  → sonuç (poz, iz, plan, çarpışma veya hata)
  ├─→ React/SVG/Three.js sunumu
  └─→ semantik Evidence olayı → kayıtlı predicate → gerekirse passed
```

Çekirdek; React state, DOM, `window`, `localStorage`, çizim veya Evidence
kaydetmez. UI, çekirdeğe SI birimlerinde girdi verir ve sonucu gösterim
birimine çevirir. Uzun hesap worker'a taşınsa da iş kuralının kaynak dosyası
ve worker kaynağı `interactionHash` kapsamına alınır.

### Koordinat ve birim sözleşmesi

Hesaplama katmanında tek sözleşme vardır; kullanıcıya gösterilen derece/mm
değerleri bu sözleşmenin parçası değildir:

| Değer | Çekirdek birimi / düzeni |
|---|---|
| Konum, hedef, engel, DH `a` ve `d` | metre |
| DH `alpha`, `theta`; döner eklem girdisi ve limiti | radyan |
| Doğrusal eklem girdisi ve limiti | metre |
| `maxVelocity` | döner eklemde rad/s, doğrusal eklemde m/s |
| `Mat4` | satır öncelikli; öteleme son sütunda |
| DH dönüşümü | klasik/standart DH: `Rz(theta) · Tz(d) · Tx(a) · Rx(alpha)` |
| Robotik dünya | sağ elli, Z-yukarı |

`forwardKinematics(robot, jointValues)` içindeki ikinci argümanın tarihsel adı
`jointAngles` olsa da karma zincirde değer eklem türüne göre yorumlanır:
döner eklemde radyan olarak sabit `theta` ofsetine, doğrusal eklemde metre
olarak sabit `d` ofsetine eklenir. Derece veya milimetre kabul eden bir UI/API,
dönüşümü **giriş sınırında bir kez** yapar; çekirdekte iki birim birlikte
taşınmaz. `RobotMetadata.maxReachMm` üretici iddiasını gösteren metadata'dır,
FK girdisi değildir ve metreye çevrilmeden hesaba katılmaz.

Three.js Y-yukarı çalıştığı için 3B renderer, çekirdek sonucunu
`components/scene/robotFrames.ts` içindeki dönüşümle taşır:
`(x, y, z)_robotik → (x, z, -y)_sahne`. Bu yalnız görselleştirme sınırıdır;
çekirdek koordinatını değiştirmez. Düzlemsel öğretim robotları robotik XY
düzleminde (`z = 0`) çalışır. UI'da gösterilen takım yönelimi ZYX
roll-pitch-yaw ve derecedir; kinematik hesabın girdisi değildir.

---

## Değişmez sözleşmeler

Bu üçü projenin bel kemiği. Değiştirilmeden önce `docs/02-mimari.md`
güncellenmeli.

### 1. Robot tanımı

```ts
type JointType = "revolute" | "prismatic";

interface JointSpec {
  type: JointType;
  dhParams: { a: number; alpha: number; d: number; theta: number };
  limits: { min: number; max: number };   // radyan veya metre
  maxVelocity: number;
}

interface RobotSpec {
  id: string;                 // "meca500", "generic-2dof"
  displayName: string;
  joints: JointSpec[];
  meshUrl?: string;           // yoksa basit geometriyle çizilir
  metadata?: RobotMetadata;   // bkz. aşağıda — opsiyonel, geriye dönük uyumlu
}
```

Robot tanımları veri, kod değil. Yeni robot eklemek dosya eklemektir.

### 1.1 `RobotMetadata` — gerçek ürün kimliği (Faz 6, 2026-08-23)

```ts
interface RobotMetadataSource {
  kind: "official-doc" | "software-doc" | "book" | "paper" | "standard" | "dataset" | "other";
  title: string;
  publisher?: string;
  url?: string;
  version?: string;
  accessedAt?: string;
}

interface RobotMetadata {
  manufacturer: string;
  model: string;
  maxReachMm?: number;   // üreticinin veri sayfasındaki sayı, DH toplamından türetilmiş TAHMİN değil
  payloadKg?: number;    // yalnız bilgi amaçlı — platform yük/dinamik modellemez
  imageUrl?: string;     // üreticinin kendi sayfasına bağlantı, dosya bu repoya gömülmez
  source: RobotMetadataSource;
}
```

`lib/robotics/kinematics.ts`'te tanımlı, `lib/content.ts`'teki ders `SourceRef`inden BİLİNÇLİ olarak ayrı (bu dosya fs'e dokunan `content.ts`'i import etmez — `lib/robotics/CLAUDE.md`'nin "window/document/React'e özel import yok" mobil-port saflığı kuralı fs importunu da kapsar).

**Kural: `metadata` yalnız GERÇEK, kaynak gösterilebilir bir üretici ürününe karşılık gelen bir `RobotSpec`te doldurulur.** `generic-2dof`, `generic-prismatic`, `generic-6dof` ve kullanıcı tanımlı `custom-robot` örnekleri kasıtlı olarak jeneriktir; DH parametreleri hiçbir gerçek üretici modelinin veri sayfasından gelmez. Bu robotlara marka/model metadata'sı eklemek yanlış özdeşleştirme olur ve yasaktır. `meca500-r4`, kamuya açık üretici dokümanındaki geometri, limit, hız ve erişim verileriyle eklenen ilk gerçek preset örneğidir; jenerik presetlerin statüsünü değiştirmez.

Görsel katman (`components/interactive/RobotInfoLine.tsx`, JointSliders ve IkTarget'a bağlı) bu ayrımı kullanıcıya da taşır: `metadata` varsa gerçek marka/model + kaynak linki gösterir; yoksa robotun jenerik olduğunu açıkça söyler ve (yalnız matematiksel olarak geçerli olduğu durumda — düz, `alpha=0`, tamamen döner bir zincir) kendi DH uzunluklarından hesaplanan azami erişimi gösterir. Genel bir DH zincirinde (d ofseti veya alpha bükümü olan) bu toplam yanlış olacağı için hiç gösterilmez.

`RobotSpec` yalnız depodaki sabit katalog robotlarıyla sınırlı değildir.
`/oyun-alani`, kullanıcı girdisini önce saf `lib/robotics/customRobot.ts`
doğrulayıcısından geçirir, sonra aynı sözleşmenin tarayıcıda üretilmiş bir
örneğine dönüştürür. V1 kullanıcı robotu 1–6 düzlemsel, yalnız dönel eklemden
oluşur; her eklem DH `a` uzunluğu ile radyan cinsine çevrilen mekanik limitleri
taşır. Üretilen örnek katalog kayıt defterine eklenmez ve mevcut
`generic-*` robotları değiştirmez; FK/IK hesapları doğrudan aynı `RobotSpec`
üzerinden çalışır.

Kullanıcı robotunun paylaşılabilir durumu `labState` içinde sürümlü
`custom-robot` türüdür: doğrulanmış tanım, eklem duruşu ve IK hedefi URL
fragment'ına kodlanabilir. Aynı kod yerel kalıcılıkta da kullanılır; böylece
localStorage ve paylaşım için iki ayrı doğrulama yolu oluşmaz. Bu genişleme
`RobotSpec` arayüzünü değiştirmez, sözleşmenin zaten izin verdiği kullanıcı
tanımlı örnekleri devreye alır.

`custom-robot` v1 durumu geriye uyumlu, isteğe bağlı bir öğretim programı da
taşıyabilir: paylaşımda en fazla 32 temsilî eklem pozu ve `0.05–1.0` hız ölçeği. Eski bağlantılarda
bu alan yoksa boş program olarak açılır. `lib/robotics/customRobotMotion.ts`,
her pozu bağımsız eklem limitleri ve düzlemsel bağlantı merkez çizgilerinin
öz-kesişimi açısından denetler; pozlar arasındaki hareketi sıfır uç-hızlı kübik
profille zamanlar ve süreyi `JointSpec.maxVelocity` aşılmayacak şekilde uzatır.
Ara yol en fazla 2° eklem adımıyla tekrar denetlenmeden oynatılmaz; URL'den
açılan program da oyun alanında aynı provayı yeniden geçer. Sayısal IK başlangıç
tahminini ve her DLS iterasyonunu mekanik limitlere izdüşürür; çözücü limit
dışından geçip yalnız son noktada kontrol yapamaz.

Canlı yol kaydı tarayıcının ürettiği her `pointer`/`input` olayını waypoint
saymaz. Adaptif örnekleyici, hızlı hareketi en çok saniyede bir; yavaş ve hassas
hareketi ise eklem/TCP mesafesi anlamlı olduğunda kaydeder. Temsilî poz bütçesi
dolduğunda kayıt kesilmez: başlangıç, geometrik köşeler ve en yeni poz korunup
en az bilgi taşıyan eski ara poz seyreltilir. Böylece cihazın olay frekansı URL
boyutunu veya öğretim hakkını belirlemez; oynatma öncesi yoğun 2° ara-yol
doğrulaması aynı kalır.

Bu bir **kinematik dijital prova**, tam rijit-cisim dinamiği değildir. V1;
tork, yerçekimi, yük, ivme/jerk, denetleyici gecikmesi, bağlantı kalınlığı,
motor gövdesi, kablo kaynaklı bağlı limitler ve çevre çarpışmasını modellemez.
Dolayısıyla öğretilen yol gerçek robot komutu olarak dışa aktarılmaz; bu sınır
arayüzde de deneyin hemen yanında görünür.

#### Yeni robot preset'i ekleme

Meca500 R4 deseni sırasıyla `lib/robotics/robots/meca500R4.ts`,
`lib/robotics/robots/index.ts` ve `lib/robotics/robots/catalog.test.ts`
dosyalarında görülebilir.

1. Önce testleri yaz: id'nin katalogdan çözülmesini, DH tablosunu, limit/hız
   değerlerini, metadata kaynağını ve en az bir bilinen FK pozunu beklenen
   değerlerle sabitle. Jenerik presetlerin metadata'sız kaldığı negatif testi
   koru.
2. Her sayısal alanı kamuya açık birincil kaynağa bağla. Üreticinin resmî
   teknik dokümanı; başlık, yayıncı, URL, sürüm ve erişim tarihiyle
   `metadata.source` içine yazılır. Kaynakta olmayan geometri, limit, hız,
   erişim veya yük değeri tahmin edilmez; alan opsiyonelse boş bırakılır,
   zorunluysa preset eklenmez.
3. `lib/robotics/robots/<model>.ts` içinde tek bir `RobotSpec` tanımla.
   Kaynaktaki mm ve derece değerlerini dosya sınırında metre ve radyana çevir;
   nesnede çekirdek birimlerini sakla. Kullanılan DH çeşidini ve üretici
   çerçevesinden standart DH'ye yapılan doğrulanabilir eşlemeyi yorumda açıkla.
4. Gerçek ürünse `metadata.manufacturer`, `model` ve `source` alanlarını ekle.
   `maxReachMm` gibi gösterim metadata'sını DH toplamından türetme. Öğretim
   amaçlı jenerik bir zincirse `metadata` ekleme ve marka çağrışımlı id kullanma.
5. Preset'i `lib/robotics/robots/index.ts` kayıt defterine ekle ve dışa aktar.
   Ders MDX'i bu id'yi bir bileşenin `robot="..."` prop'unda kullanacaksa ayrıca
   `lib/interactionManifest.ts` içindeki robot id → spec dosyası eşlemesine
   ekle; yalnız katalogda bulunması bu adımı gerektirmez.
6. Önce hedefli katalog testini, ardından tam kontrol paketini çalıştır.
   Kaynağın gerçekten erişilebilir olduğunu ve sayısal iddiaların ilgili tablo/
   şekille birebir uyuştuğunu ayrıca elle doğrula.

Meca500 örneğinde üreticinin **MC-UM-MECA500 — Technical specifications,
Table 7 and Figure 18** belgesi tek sayısal kaynaktır:
<https://resources.mecademic.com/en/doc/MC-UM-MECA500/2026.B/manual/technical-specifications.html>.
Dosya, mm → m ve derece → radyan dönüşümünü tanım sınırında yapar; katalog
testi sıfır pozunu golden sonuç olarak, kaynak metadata'sını ve bütün eklem
limit/hız dizilerini ayrı ayrı sabitler.

### 2. Planlayıcı arayüzü

Mevcut Python `Planner` sözleşmesinin TypeScript karşılığı:

```ts
interface PlanResult {
  success: boolean;
  path: Vec3[];
  elapsedMs: number;
  nodesExpanded: number;
  algorithm: string;
}

type CollisionChecker = (p: Vec3) => boolean;

interface Planner {
  name: string;
  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult;
}
```

### 3. Ders frontmatter

```yaml
---
id: b-lise-ileri-kinematik
baslik: İki eklemli kolda ileri kinematik
hat: b-kinematik
seviye: lise            # ortaokul | lise | universite
sure: 15                # dakika
onkosul:
  - a-lise-dof
kazanimlar:
  - Eklem açılarından uç nokta konumunu trigonometri ile hesaplayabilme
  - Açı değişiminin uç noktayı nasıl etkilediğini açıklayabilme
kaynaklar:
  - kind: book
    title: "Modern Robotics, Bölüm 4"
    publisher: "Cambridge University Press"
  - kind: official-doc
    title: "Meca500 teknik veri sayfası"
    publisher: "Mecademic"
    url: "https://www.mecademic.com/..."
    accessedAt: "2026-08-09"
etkilesimli:
  - JointSliders
durum: taslak           # taslak | inceleme | yayinda
---
```

`kaynaklar` alanı boş bırakılamaz — gizlilik kuralının teknik zorlayıcısı budur.
Bir CI kontrolü, `durum: yayinda` olan ve `kaynaklar` boş olan dersi reddeder.

Yeni yayınlarda kaynaklar yapılandırılmış `SourceRef` nesneleridir. Eski metin
kaynaklar yalnızca mevcut legacy yayınları okuyabilmek için desteklenir. URL
kaynaklarında erişim tarihi; yazılım dokümantasyonunda ayrıca sürüm zorunludur.

### 4. Sürüme bağlı insan incelemesi (Review Receipt v2)

`incelendi_tarafindan` ve `incelendi_tarih` alanları legacy kayıttır; tek başına
güncel sürümün incelendiğini kanıtlamaz. Yeni model `content/review-receipts.json`
içindeki Review Receipt v2 kayıtlarıdır.

**Ders sürümü tek hash değil, üç bağımsız köktür** (`lib/lessonArtifact.ts`,
kanonikleştirme adı `lesson-artifact-v2`):

| Kök | Kapsadığı frontmatter + gövde | Eskittiği inceleme kapsamı |
|---|---|---|
| `sourceHash` | `kaynaklar` | `source`, `technical`, `safety` |
| `teachingHash` | `baslik`, `hat`, `seviye`, `onkosul`, `kazanimlar`, `etkilesimli` + ders gövdesi | `technical`, `pedagogical`, `safety` |
| `presentationHash` | `id`, `sure`, `sira`, `durum`, legacy inceleme alanları | **hiçbiri** |

Bu ayrım bir kolaylık değil, bir doğruluk düzeltmesi. v1'de tek `artifactHash`
frontmatter'ın tamamını kapsıyordu; `durum` da içindeydi. Sonuç: incelenip
makbuza bağlanan bir taslak, yayına alındığı anda hash'i değiştiği için
makbuzunu geçersiz kılıyordu — yani "önce incele, sonra yayınla" sırası
teknik olarak imkânsızdı. `presentationHash` hiçbir kapsamı eskitmediği için
bu kapı artık çalışıyor. Aynı ayrım, bir kaynağın erişim tarihini tazelemenin
pedagojik incelemeyi çöpe atmasını da engeller.

Makbuz **kapsam başınadır ve append-only'dir**: her kayıt tek ders, tek kapsam
(`source` / `technical` / `pedagogical` / gerektiğinde `safety`), tek karar
(`approved` / `changes-requested`) ve tek inceleyen taşır; `subject` alanına
yalnız o kapsamın bağlı olduğu kökler yazılır. Var olan bir kayıt düzenlenmez
veya silinmez — düzeltme yeni makbuz yazılarak yapılır.

`sourceCommit` biçimsel bir alan değil: CI, commit nesnesi elde varsa dersi o
commit'ten okuyup kökleri yeniden hesaplar ve makbuzla karşılaştırır. Uydurma
ama 40 hex karakterli bir değer reddedilir.

Makbuzlar elle yazılmaz; `npm run review onayla` üretir. Aynı komut borç
kaydını da düşürür — bu yüzden bir dersi onaylamak hiçbir script düzenlemesi
gerektirmez.

### 5. Evidence v2

Yerel öğrenme kaydı `robotik-platform:evidence:v2` anahtarında dersin birleşik
`contentVersion` değeriyle tutulur. Bu değer `teachingHash`, `interactionHash`
ve `predicateHash` köklerini birleştirir: öğretilen metin, çalışan deney veya
başarı ölçütü değişirse eski kanıt geçersiz olur. `sourceHash` ve
`presentationHash` bu köke girmez; bir kaynağın erişim tarihini güncellemek ya
da dersi taslaktan yayına almak öğrencinin kaydını eskitmez. İnceleme
geçerliliği ile öğrenci ilerlemesi ayrı sorulardır ve aynı anahtara bağlanmaz.
`read`, `predicted`, `tried`, `observed` ve
`assessed` kullanıcı/bileşen olaylarıdır; bunların hiçbiri doğrudan başarı
değildir. `passed` yalnız `lib/evidence.ts` içindeki kayıtlı predicate'in aynı
ders ve aynı artifact sürümündeki ölçülebilir olay dizisini doğrulamasıyla
üretilen `registry-predicate` olayıdır.

V1 olayları ve eski manuel "tamamlandı" kimlikleri önce v2'ye
`legacy-unverified` olarak yazılır; yalnız başarılı yazımdan sonra eski
anahtarlar silinir. Eski `passed` olayı doğrulanmış başarıya yükseltilmez.
Depolama engellenirse oturum içi bellek kullanılır ve UI bunu açıkça söyler.
Kullanıcı tüm kaydı JSON olarak dışa aktarabilir veya iki adımlı onayla silebilir.

### 6. Bağımlılık manifesti — interactionHash ve predicateHash (Sprint 2 pilotu)

`teachingHash` yalnız ders METNİNİN sürümüdür. Bir laboratuvarı gerçekten
ÇALIŞTIRAN kod (bileşen + saf motor + robot spesifikasyonu + varsa worker) ya
da bir predicate'in mantığı değişse bile, ders metni aynı kaldığı sürece
`teachingHash` değişmez — yani öğrencinin gördüğü deney artık farklı
çalışıyor olsa bile eski kanıt hâlâ "güncel" görünür. `lib/interactionManifest.ts`
bu boşluğu iki ayrı, doğrulanabilir hash ile kapatır:

- **`interactionHash`** — kullanılan bileşen(ler) + dayandıkları saf motor
  dosyaları + kullanılan robot spesifikasyonu + (varsa) worker kaynağının
  içerik hash'lerinden üretilir. Kullanılan bileşenler `etkilesimli`
  frontmatter alanına değil, MDX AST'sinin kendisine bakılarak çıkarılır
  (`extractUsedComponents`) — yazarın elle girdiği alan yanlış/eski olabilir.
- **`predicateHash`** — o derse bağlı `lib/evidence.ts` predicate id'lerinin
  (zaten `-v1`/`-v2` gibi sürümlü) sıralı kümesinden üretilir.

`lib/lessonArtifact.ts`'teki `computeEvidenceVersionRoot(teachingHash,
interactionHash, predicateHash)` üçünü tek bir kökte birleştirir. Bilinçli
olarak SAF (fs'e dokunmaz) — `interactionHash`in kendisi fs okuduğu için ayrı
bir modülde yaşıyor, tıpkı `computeLessonSubjectHashes`'in saf kalıp
`scripts/git-lesson.ts`'in fs/git tarafını üstlenmesi gibi.

**Kapsam ve durum (güncellendi — bkz. docs/durum-denetim.md "Faz 2 — Kanıt
zincirindeki eksik bağlantı"):** Sprint 2'de yalnız üç pilot laboratuvar
kayıtlıyken, artık MDX'te izinli 20 bileşenin TAMAMI `LAB_DEPENDENCY_REGISTRY`'de
tanımlı (`lib/interactionManifest.test.ts` bunu regresyona karşı doğruluyor);
kayıtlı olmayan bir bileşen için `computeInteractionHash` hâlâ açıkça hata
fırlatır. `computeEvidenceVersionRoot` artık canlı ders sayfasına BAĞLI:
`app/ders/[slug]/page.tsx`, `lib/interactionManifest.ts`teki
`computeLessonContentVersion(lessonId, lessonBody, teachingHash)` üzerinden
`LessonEvidenceProvider`a `contentVersion={computeTeachingHash(lesson)}`
değil, üç kökün birleşimini veriyor — bileşen/motor/predicate kodu
değiştiğinde eski kanıt artık otomatik eskiyor.

#### Yeni deney/laboratuvar ekleme

`DlsTraceLab` ve `CspaceLab`, saf deney motoru + kontrollü UI + Evidence +
bağımlılık manifesti deseninin küçük örnekleridir. Yeni bir deney şu sırayla
eklenir:

1. **Davranışı test-first tanımla.** Hesap/karar mantığını mümkünse
   `lib/robotics/<deney>.ts` içinde saf fonksiyon olarak kur; React, DOM ve
   depolama ekleme. Bilinen sonuç (golden), sınır ve geçersiz girdi testlerini
   yanındaki `<deney>.test.ts` dosyasına önce yaz.
2. **İnce UI adaptörünü ekle.** `components/interactive/<Deney>.tsx`, kullanıcı
   girdisini çekirdek birimine çevirir, motoru çağırır ve sonucu gösterir.
   Paylaşılabilir durum gerekiyorsa `LabChallengeUi` içindeki sürümlü
   `useSharedLabState` / `createLabShareUrl` desenini kullan. Bileşeni
   `components/interactive/index.ts` ve `lib/izinliBilesenler.ts` kayıtlarına
   ekle; eşitliği `components/interactive/index.test.ts` korur.
3. **Semantik Evidence olayı kaydet.** `useEvidenceRecorder()` ile yalnız
   anlamlı commit/çalıştırma anında `tried`, `observed` veya `assessed` yaz.
   Her pointer/input karesini kaydetme. `skillId`, `result`, gerekiyorsa `seed`
   ve predicate'in bağımsız doğrulayabileceği ham metrikleri taşı; bileşen
   hiçbir zaman `passed` yazamaz.
4. **Predicate'i sürümle.** `lib/evidence.ts` içindeki
   `EVIDENCE_PREDICATES` listesine ders id'si ve aynı `skillId` ile bir
   `<anlamlı-ad>-v1` kaydı ekle. Predicate, yalnız UI'ın `result: success`
   iddiasına güvenmemeli; doğru ders/sürümdeki birden fazla ölçülebilir olayı,
   ham metrikleri ve gerekiyorsa assessment'ı birlikte doğrulamalıdır. Mantık
   veya olayı üretme semantiği değişirse eski id'yi yeniden kullanma, `-v2`
   olarak sürümle.
5. **Çalışan kodu `interactionHash`e bağla.** `lib/interactionManifest.ts`
   içindeki `LAB_DEPENDENCY_REGISTRY` kaydına bileşenin kendisini, davranışını
   etkileyen bütün motor/ortak yardımcı dosyalarını ve varsa worker kaynağını
   ekle. MDX'te literal `robot="..."` kullanılıyorsa robot id'sinin spec
   eşlemesini de ekle. `lib/interactionManifest.test.ts`te tam beklenen
   bağımlılık kümesini ve bilinmeyen kaydın açıkça hata verdiğini doğrula.
6. **Derse bağla ve zinciri doğrula.** MDX bileşenini kullandığında ders
   sayfası AST'den bileşen/robot id'lerini çıkarır;
   `computeLessonContentVersion`, `teachingHash + interactionHash +
   predicateHash` kökünü otomatik olarak `LessonEvidenceProvider`a verir.
   Elle contentVersion yazma. Predicate testinde tek olayın/başarısız koşunun
   geçmediği negatif senaryoyu ve gerekli bütün olayların geçtiği golden
   senaryoyu yan yana tut; gerekiyorsa Playwright ile gerçek etkileşimden
   `passed` üretildiğini sınırdan sınırına doğrula.

Evidence zincirinin güvenlik sınırı şudur: bileşen yalnız gözlem/assessment
olayı üretir; `appendEvidence`, aynı `contentVersion` olaylarını kayıtlı
predicate'e verir; başarılı `passed` olayını yalnız bu registry üretir.
Dolayısıyla bir deney davranışı, bağımlılığı veya başarı ölçütü değiştiğinde
ilgili manifest/predicate sürümü de aynı değişiklikte güncellenmelidir.

### 7. Python↔robot köprüsü (Pyodide)

`components/interactive/CodeRunner.tsx`, öğrencinin Pyodide'de çalıştırdığı
Python koduna `robot` adlı, kasıtlı olarak KÜÇÜK bir API yüzeyi enjekte eder
(`lib/workers/pyodideWorker.ts`, bkz. bölüm 3 "MoveJ/MoveL komut örneği"
yerine burada gerçek çalışan bir sürüm): `eklem_ac(index, derece)` ve
(sadece 2 eklemli robotlarda) `hedefe_git(x, y)`; ayrıca (robotSpec
verildiğinde, eklem sayısından bağımsız) `movej(acilar)`, `movel(x, y, z,
speed=None)`, `get_joints()`, `get_tcp()`, `forward_kinematics(acilar)`,
`inverse_kinematics(x, y, z)`. `movej`/`movel` `eklem_ac`/`hedefe_git`'in
YERİNE geçmez — aynı bridge'e sonradan eklendi, ikisi de aynı
`currentAngles`/`jointTrace` durumunu paylaşır (bkz. `content/d-programlama/`
lise dersleri, `eklem_ac`/`hedefe_git` önce öğretilip sonra "gerçek
endüstriyel isimleri" olarak `movej`/`movel`'e bağlanıyor).

Girdi doğrulama ve hata mesajı üretimi (`lib/robotics/pythonBridge.ts`) SAF
bir modül — worker'ın Pyodide/PyProxy detaylarından ayrı, bu yüzden Vitest
ile doğrudan test edilebiliyor. Yeni matematik içermez; `forwardKinematics`/
`inverseKinematicsNumerical`'ı sarıp Türkçe, öğretici hata mesajı üretir
(ör. yanlış eklem sayısı, eklem limiti ihlali, çalışma uzayı dışı hedef).
`speed` parametresi kabul edilir ama şu an hiçbir yerde kullanılmaz — bu
platform gerçek zamanlı hız/animasyon simülasyonu yapmaz (bkz. bölüm
"kinematik dijital prova" sınırı, aynı dürüstlük ilkesi).

Bu genişleme `RobotSpec`/`PlanResult`/`Planner` sözleşmelerini değiştirmez;
`pythonBridge.ts` yalnız var olan `kinematics.ts` fonksiyonlarını tüketir.
`LAB_DEPENDENCY_REGISTRY`'deki `CodeRunner` girdisine yeni saf dosya
eklendi (`lib/robotics/pythonBridge.ts`) — bu yüzden bu köprünün mantığı
değişirse `interactionHash` de değişir, eski kanıt otomatik eskir.

---

## Doğrulama stratejisi

Değişiklik sırası **kırmızı test → en küçük uygulama → refactor → tam kapı**dır.
Testi atlamak, `skip`lemek, anlamlı assertion'ı silmek veya toleransı yalnız
test geçsin diye genişletmek kabul edilmez. Bir hata düzeltmesi önce hatayı
üreten regresyon testiyle görünür hâle gelir.

| Test deseni | Ne zaman | Örnek |
|---|---|---|
| Analitik birim testi | Küçük, elle hesaplanabilir matematik | 2R kolun 0°/90° FK sonucu |
| Golden/fixture | Sabit, bağımsız kaynaktan beklenen tam çıktı | Meca500 sıfır pozu; `reference-python/fixtures/` sonuçları |
| Negatif/sınır testi | Yanlış başarının veya sessiz kabulün önlenmesi | Limit dışı eklem, erişilemez IK, çarpışan yol, eksik Evidence olayı |
| Özellik/değişmez testi | Çok sayıda girdide yapısal doğruluk | `FK(IK(hedef)) ≈ hedef`, planın bütün segmentlerinin çarpışmasızlığı |
| Entegrasyon/E2E | UI, worker, paylaşım ve Evidence kabloları | Gerçek etkileşimden sürümlü `passed` üretimi |

Golden sonuç uygulamanın kendi çıktısını kopyalayarak üretilmez. Kaynağı test
yorumunda belirtilir: analitik türetim, resmî üretici tablosu veya bağımsız
Python oracle/fixture. Python ile aynı girdiler çalıştırılıp JSON fixture'lara
yazılan çapraz doğrulamada (`reference-python/scripts/generate_fixtures.py`)
mevcut sayısal tolerans `1e-6`dır; tolerans değişikliği gerekçe ve hata analizi
olmadan yapılmaz.

Her başarı testi, aynı davranışın aşırı izin verici olmadığını gösteren en az
bir negatif karşılıkla düşünülür. Özellikle Evidence predicate testlerinde
yalnız `result: success`, eksik olay kümesi, yanlış metrik, başarısız/timeout
çalışma ve eski predicate id'si başarı üretmemelidir. `interactionHash`
testleri de kayıtlı bağımlılığın hash'e girdiğini ve bilinmeyen bileşen/robotun
sessizce atlanmak yerine hata verdiğini korur.

Hedefli Vitest dosyası geliştirme döngüsünü hızlandırır; teslim kapısı değildir.
Teslimde `docs/06-kalite-ve-topluluk.md` içindeki CI ile birebir tam komut
listesi çalıştırılır. Playwright matematik oracle'ı olarak kullanılmaz; saf
motor doğruluğu Vitest/fixture katmanında, tarayıcı kablosu E2E katmanında
doğrulanır.

---

## Performans sınırları

- 3D sahne 60 FPS'de dönmeli. Karmaşık mesh yerine basit geometri + iyi
  malzeme kullan.
- Planlama algoritmaları ana iş parçacığını (main thread) kilitlemesin;
  RRT gibi uzun sürenler Web Worker içinde çalışsın.

  **Worker nasıl derleniyor (Faz 2'de karar verildi):** Next.js'in kendi
  `new Worker(new URL('./x.ts', import.meta.url))` desteği bu projede (Next
  16.2, hem Turbopack hem webpack) güvenilir değil — derlenen worker
  chunk'ına gerçek kod hiç girmiyor, boş/eksik çıkıyordu (statik export'ta
  worker isteği sonsuza kadar "pending" kalıyordu). Bunun yerine
  `lib/workers/plannerWorker.ts`, `scripts/build-worker.mjs` içinde esbuild
  ile önceden (dev/build başlamadan, `predev`/`prebuild` npm script'iyle)
  tek bir klasik (non-module) script'e derlenip `public/workers/` altına
  yazılıyor; bileşen ona sabit bir yoldan (`new Worker("/workers/planner-worker.js")`)
  bağlanıyor. `public/workers/` gitignore'da — kaynak değil, üretilen dosya.
- Planlayıcı deneyi her algoritma koşusu için yeni worker açar ve en geç 5
  saniyede sonlandırır. İstek bir `seed` taşır; RRT/RRT* bu seed'den üretilen
  RNG'yi kullanır. Worker'ın döndürdüğü başarılı yol başlangıç/hedef, sonlu
  koordinat, düzlemsellik ve **bütün segmentlerde** çarpışmasızlık açısından
  doğrulanmadan UI'a aktarılmaz.
- `CodeRunner` istekleri temiz bir Python globals sözlüğünde çalışır. UI worker'ı
  8 saniyede sonlandırır; worker 64 KiB/100 çıktı olayı ve 500 eklem izi örneği
  sınırını uygular. Kesilen çıktı başarı gibi gizlenmez, kullanıcıya işaretlenir.
- İlk yükleme 200 KB JS altında kalsın; 3D ve Pyodide tembel yüklensin.
- Mobilde çalışmalı — Türkiye'de öğrencilerin çoğu telefondan girecek.
  Dokunmatik kontroller ilk sınıf vatandaş.

## Erişilebilirlik

- Her etkileşimli sahnenin klavyeyle kullanılabilir bir alternatifi olmalı
  (kaydırıcılar zaten klavye destekli).
- Her sahnenin metin özeti olmalı (ekran okuyucu için).
- Renk tek başına bilgi taşımasın.
