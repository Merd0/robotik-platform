# Durum denetimi — Faz 1 içerik kalite taraması

Bu dosya, Faz 1'de yazılan 14 dersin `kalite-denetci` subagent'ıyla (bkz.
`.claude/agents/kalite-denetci.md`) taranması, bulunan sorunların
düzeltilmesi ve düzeltmelerin doğrulanması sürecini kayıt altına alır.
Tarih: 2026-08-01.

## Yöntem

14 ders 3 paralel `kalite-denetci` çalıştırmasıyla incelendi (7+4+3 ders).
Her çalıştırma salt-okunur: dersteki formülleri/sayısal örnekleri
`lib/robotics/kinematics.ts`, `kinematics.test.ts` ve
`reference-python/fixtures/generic-2dof-fk.json` ile, kaynak atıflarını ise
genel bilgiyle (Modern Robotics'in bilinen bölüm yapısı, ABB/KUKA komut
isimlendirmesi) karşılaştırdı. Düzeltme yapmadı, sadece bulgu raporladı.

## Bulgular ve yapılan düzeltmeler

| Ders | Bulgu | Durum |
|---|---|---|
| `b-ortaokul-eklemleri-oynat` | Sorun yok | Değişmedi |
| `b-ortaokul-birden-fazla-yol` | Sorun yok | Değişmedi |
| `b-ortaokul-erisemedigi-noktalar` | Kaynak ataması zorlama: "Bölüm 4 (çalışma uzayı)" deniyordu, ama Bölüm 4 aslında "İleri Kinematik"; erişilebilirlik/limit kavramı Lynch & Park'ta Bölüm 2 (Konfigürasyon Uzayı) ile daha örtüşür | **Düzeltildi** — kaynak "Bölüm 2 (konfigürasyon uzayı ve erişilebilir çalışma uzayı kavramı)" olarak değiştirildi |
| `b-lise-ileri-kinematik` | Sorun yok — formül ve sayısal örnek fixture'la birebir (θ=45°,45° → x=0.7071 doğrulandı) | Değişmedi |
| `b-lise-geometrik-ters-kinematik` | Sorun yok — IK formülü kodla birebir | Değişmedi |
| `b-lise-aci-birimleri` | Sorun yok — ISO 80000-3 ataması makul | Değişmedi |
| `b-lise-eklem-limitleri` | Sorun yok | Değişmedi |
| `b-universite-dh-ileri-kinematik` | Sorun yok — DH matrisi `dhTransform` ile birebir | Değişmedi |
| `b-universite-ters-kinematik` | Sorun yok — DLS formülü kodla birebir | Değişmedi |
| `b-universite-jacobian` | **Yanlış öğretim.** "Dene" bölümü "turuncu çizginin (eklem 2) kısaldığını gözlemle" diyordu. Matematiksel olarak `\|col_i\| = z × (p_uç−p_i)` bir birim vektörle çapraz çarpım olduğundan uzunluk korunur — `\|col2\|` her zaman `a2 = 0.8`'dir, hiç değişmez (fixture'da θ2=0°, 90°, 180° için doğrulandı). Tekillikte gerçekte olan şey iki sütunun **paralel/ters paralel** hale gelmesidir (θ2=180°'de fixture'da col2 = −4×col1, tam çakışık doğrultuda) | **Düzeltildi** — "Dene" bölümü artık sütunların doğrultusunun paralel hale geldiğini gözlemlemeyi istiyor, uzunluk değişimi iddiası kaldırıldı |
| `b-universite-tekillik` | Sorun yok — manipülabilite formülü bağımsız Python formülüyle birebir | Değişmedi |
| `b-universite-yorunge-uretimi` | Sorun yok, ama üniversite seviyesi için formül eksikti (docs/04 "üniversitede türetme var" kuralı) | **Genişletildi** — yol/zaman ölçeklemesi (path/time-scaling) ayrıştırması ve doğrusal + dairesel parametrizasyon formülleri eklendi |
| `b-universite-hiz-ivme-profilleri` | Sorun yok, aynı formül eksikliği | **Genişletildi** — yamuk profilin parçalı hız formülü ve S-eğrisinin (ivme yamuk → hız S-şekilli) matematiksel ilişkisi eklendi |
| `b-universite-movej-movel` | Sorun yok — ABB/KUKA eşlemesi doğru | Değişmedi |

Tüm düzeltmeler sonrası `npx tsx scripts/check-content.ts`, `npx vitest run`,
`npx tsc --noEmit`, `npx eslint .` ve `npx next build` tekrar çalıştırıldı;
hepsi temiz.

## Yapılmayan adım: `durum: yayinda` işaretlemesi

İstenen bir adım burada bilinçli olarak **yapılmadı**: 14 dersin
`incelendi_tarafindan` / `incelendi_tarih` alanlarını doldurup
`durum: yayinda` yapmak.

**Neden:** `docs/06-kalite-ve-topluluk.md`'deki Katman 3 açık: "her ders,
yayınlanmadan önce en az bir kişi tarafından, kaynaklarıyla karşılaştırılarak
okunur... bu en kritik katman ve atlanamaz." Bu adım özellikle şunu talep
ediyor: kaynağın orijinal metnini açıp derste yazılanla satır satır
karşılaştırmak, etkileşimli sahneyi bizzat oynamak. `kalite-denetci`
subagent'ı bunu iyi bir ilk elemeyle yaptı (ve gerçekten bir hata buldu —
yukarıdaki Jacobian dersi), ama bu bir **yapay zeka** incelemesi, `CLAUDE.md`
ve `docs/06`'nın ısrarla ayırdığı "insan gözden geçirmesi" değil.
`incelendi_tarafindan` alanına bir isim yazmak, o kişinin bunu gerçekten
yaptığına dair bir kayıt/iddiadır — bunu ben dolduramam, çünkü fiilen
olmadı. Bu alanları boş bıraktım; `.claude/hooks/check-lesson-frontmatter.mjs`
zaten bunu `durum: yayinda` + boş alan kombinasyonunda otomatik reddediyor.

**Şu an durum:** 14 dersin tamamı `durum: taslak`. Ana sayfa ve seviye giriş
sayfaları sadece `durum: yayinda` dersleri listelediği için hiçbiri
üretim sitesinde listelenmiyor (URL bilinirse taslak olarak açılabilirler).

**Bekleyen karar:** Kullanıcı (proje sahibi) hangi dersleri bizzat
inceleyip `yayinda` yapmak istediğine karar verecek — bu doküman ve
yukarıdaki bulgu tablosu o incelemeye başlangıç noktası olsun diye
yazıldı.

---

## Güncelleme — Kanca çeşitliliği ve ilk yayın (2026-08-01)

`docs/04-icerik-rehberi.md`'ye "Kanca çeşitliliği" bölümü eklendi:
14 dersin hepsi tekrar edilen bir retorik kalıba ("[durum kur] → 'Ama/Ancak
...' → 'Peki ...?'") düşüp düşmediği kontrol edildi.

### Kalıba düşen 4 ders — yeniden yazıldı

| Ders | Eski açılış kalıbı | Yeni biçim |
|---|---|---|
| `b-ortaokul-eklemleri-oynat` | Tam kalıp ("Ama...Peki...?") | Şaşırtıcı gözlem |
| `b-lise-aci-birimleri` | Tam kalıp ("Ama...Peki...?") | Yanlış cevap tuzağı |
| `b-universite-ters-kinematik` | Kısmi ("Peki...?" ile bitiş) | Doğrudan meydan okuma |
| `b-universite-hiz-ivme-profilleri` | Kısmi ("Ama...nasıl değişmeli?") | Mini senaryo |

Her düzeltmede sadece açılış paragrafı değişti; kazanımlar, formüller,
sayısal örnekler, kaynaklar ve sonraki bölümler aynı kaldı. Diğer 10 ders
zaten farklı açılış biçimleri kullanıyordu, dokunulmadı. Hiçbir ders artık
aynı "Ama...Peki...?" iskeletini ikinci kez kullanmıyor.

### İlk yayınlanan ders

`b-universite-ters-kinematik`, proje sahibi tarafından bizzat incelenip
onaylandı. Frontmatter'ı güncellendi:

```yaml
incelendi_tarafindan: "Mert"
incelendi_tarih: "2026-08-01"
durum: yayinda
```

Bu, docs/06 Katman 3'ün ("insan gözden geçirmesi") ilk kez fiilen
karşılandığı derstir — önceki turda ben bu alanları kasıtlı boş
bırakmıştım, çünkü inceleyen ben değildim. Diğer 13 ders `durum: taslak`
olarak kaldı, dokunulmadı.

Tüm değişiklikler sonrası `npx tsx scripts/check-content.ts`, `npx vitest
run` (31/31), `npx tsc --noEmit`, `npx eslint .` ve `npx next build`
tekrar çalıştırıldı; hepsi temiz. 4 yeniden yazılan Kanca ve yayınlanan
ders tarayıcıda görsel olarak da doğrulandı.

---

## Güncelleme — Faz 2 sonu: 39 dersin tamamının kalite denetimi (2026-08-02)

Faz 2 (Hat A, 14 ders + Hat C, 11 ders) tamamlandıktan sonra, artık 39
dersin tamamı tek seferde tarandı. Faz 1'deki gibi `kalite-denetci`
görevi doğrudan proje subagent'ı olarak çağrılamadığı için (bu oturumun
araç kümesinde proje `.claude/agents/` tanımları otomatik yüklenmiyor),
5 paralel genel amaçlı ajan `kalite-denetci.md`'nin talimatlarını
(salt-okunur, kaynakla karşılaştır, düzeltme yapma, sadece bulgu
raporla) taşıyarak çalıştırıldı — her biri 7-9 dersten oluşan bir grubu
inceledi (Hat A ortaokul+lise, Hat A üniversite+Hat C ortaokul, Hat C
lise+üniversite, Hat B ortaokul+lise, Hat B üniversite). Sonuçlar tek
bir tabloda birleştirilip kullanıcıya (Mert) sunuldu.

### Sonuç

**Sıfır matematik/kod hatası.** Tüm sayısal iddialar, formüller,
fixture karşılaştırmaları, robot tanımları ve bileşen prop'ları kodla
birebir doğrulandı — Faz 1'deki gibi bu turda da hesaplama katmanında
hiçbir hata bulunmadı. 13/39 derste bulgu vardı, üçü gerçek kaynak
sorunu, geri kalanı kanca (hook) çeşitliliği kalıp tekrarıydı.

### Düzeltilen üç kaynak sorunu

| Ders | Sorun | Düzeltme |
|---|---|---|
| `a-universite-dh-parametreleri`, `b-universite-dh-ileri-kinematik` | "Modern Robotics Bölüm 4" DH parametrelerine değil, kitabın product-of-exponentials (PoE) formülasyonuna ait — DH parametreleri kitapta **Appendix C**'de işleniyor | Kaynak ataması "Bölüm 4/4.1" → "Appendix C" olarak düzeltildi. Sayılar (α/a/d) zaten doğruydu, sadece atıf yanlıştı |
| `b-lise-eklem-limitleri` | "Motora giden kablo demeti bir sınırda kopar" iddiası kaynaksızdı (Modern Robotics Bölüm 2'de böyle bir iddia yok) | Genel, kaynaksız-doğru bir ifadeye yumuşatıldı: "eklem limitleri genelde mekanik parçaların — kablolar, contalar — zarar görmemesi için konur" |
| `a-ortaokul-robot-nedir`, `a-ortaokul-robot-ile-makine-farki` | ISO 8373:2021 madde 3.1 (genel "robot" tanımı) eksen sayısı belirtmiyor; "üç veya daha fazla eksen" kriteri ayrı bir madde olan "endüstriyel robot" tanımına ait | İki tanım ayrı ayrı, doğru madde/isimle atfedildi; ders metni de buna göre güncellendi (demo robotun 2 eksenli olup gerçek bir endüstriyel robottan daha az eksenli olduğu açıkça belirtildi) |

### Kanca çeşitliliği — ikinci tur

`docs/04-icerik-rehberi.md`'deki "Kanca çeşitliliği" denetimi bu kez
**39 dersin tamamı yan yana konarak** yapıldı (Faz 1'de sadece 14 ders
içindi). İki tekrarlayan kalıp bulundu:

1. **"[durum kur] → Ama → Peki...?"** — klasik yasak iskelet, 6 derste
2. **"Çoğu kişi ... sanır"** — ayrı bir kalıp ama aynı sorunu taşıyor (4 derste birebir aynı açılış cümlesi kalıbı)

Toplam **10 ders** yeniden yazıldı (aşağıdaki listede toplandı, üçü her
iki kalıba da giriyordu). Her ders için komşu/benzer derslerin kancasına
bakılıp genuinely farklı bir açılış biçimi (mini senaryo, şaşırtıcı
gözlem, karşılaştırma, doğrudan teknik çerçeve) seçildi. Sadece "Kanca"
paragrafı değişti; kazanımlar, formüller, kaynaklar, sonraki bölümler
aynı kaldı.

| Ders | Eski kalıp | Yeni biçim |
|---|---|---|
| `a-ortaokul-robot-nedir` | Çift soru + Ama | Mini senaryo (gündelik nesneler) |
| `a-ortaokul-robot-turleri` | robot-nedir ile aynı iskelet | Şaşırtıcı gözlem |
| `a-ortaokul-robot-ile-makine-farki` | "Çoğu kişi...Peki...mu?" | Doğrudan meydan okuma |
| `a-universite-homojen-donusum` | Ama→çözüm-adı (robot-mimarileri ile aynı) | Şaşırtıcı gözlem (somut sayısal örnek) |
| `a-universite-robot-mimarileri` | homojen-donusum ile aynı iskelet | Karşılaştırma açılışı |
| `a-universite-poz-gosterimleri` | "Çoğu kişi...sanır" | Mini senaryo (uçak/gimbal kilidi) |
| `c-ortaokul-en-kisa-yol-her-zaman-en-iyi-mi` | poz-gosterimleri ile aynı kalıp | Mini senaryo (iki arkadaş) |
| `a-lise-koordinat-sistemleri` | "Ama İLERİ neye göre?" | Mini senaryo (kaptan/gemi) |
| `b-lise-geometrik-ters-kinematik` | "Önceki derste...Şimdi..." (b-lise-ileri-kinematik ile aynı) | Doğrudan teknik çerçeve |
| `c-universite-c-space` | "Ama...neden hep nokta?" | Şaşırtıcı gözlem/doğrudan ifade |

Bu turdan sonra 39 dersin açılışı tekrar yan yana kontrol edildi — hiçbir
ikili aynı rhetorik iskeleti paylaşmıyor (bazı isimli biçimler —
"karşılaştırma açılışı", "mini senaryo" — birden fazla derste kullanılıyor,
ama bu docs/04'ün beklediği bir şey: farklı biçimlerin DÖNGÜSEL kullanımı,
her birinin kelimesi kelimesine aynı olmaması).

Tüm düzeltmeler sonrası `npx tsc --noEmit`, `npx tsx scripts/check-content.ts`,
`npx tsx scripts/validate-content-graph.ts`, `npx eslint .`, `npx vitest run`
(55/55) ve `npx next build` tekrar çalıştırıldı; hepsi temiz.

### O zamanki adım — yine `durum: yayinda` işaretlemesi bekliyordu

Faz 1'deki gibi: bu tur da bir **yapay zeka** incelemesiydi (5 paralel
ajan + benim gözden geçirmem), `docs/06`'nın ısrar ettiği "insan gözden
geçirmesi" değil. 39 dersin 38'i o an hâlâ `durum: taslak`
(`b-universite-ters-kinematik` Faz 1'de zaten insan tarafından
incelenip yayınlanmıştı). Hangi derslerin okunup `yayinda` yapılacağına
karar vermek kullanıcıya (Mert) aitti — bu doküman ve yukarıdaki bulgu
tablosu o incelemeye başlangıç noktası olarak yazıldı.

---

## Güncelleme — 39 dersin tamamı yayınlandı (2026-08-02)

Yukarıdaki bulgu tablosundan 9 ders örnek olarak seçildi (her hattın her
seviyesinden bir tane: A/ortaokul, A/lise, A/üniversite, B/ortaokul,
B/lise, B/üniversite, C/ortaokul, C/lise, C/üniversite — beşi az önce
düzeltilen derslerden). Bu 9 ders **Mert tarafından bizzat, tarayıcıda
açılıp incelendi** — docs/06 Katman 3'ün istediği gerçek insan
gözden geçirmesi bu 9 ders için fiilen gerçekleşti.

Kalan 30 ders için Mert şu kararı verdi: hepsi aynı otomatik denetim
turundan (5 paralel `kalite-denetci` taraması + bu turdaki düzeltmeler)
geçtiği ve o taramada sıfır matematik/kod hatası bulunduğu için, tek
tek açıp okumadan **toplu onay** verildi.

**Bu ayrım önemli ve ileride kaybolmamalı:** 39 dersin `incelendi_tarafindan`
alanının hepsinde artık "Mert" yazıyor, ama bu tek bir anlama gelmiyor:

- **9 ders** (aşağıda listeli) — gerçekten satır satır, kaynağıyla
  karşılaştırılarak, etkileşimli sahnesi oynanarak incelendi.
- **30 ders** — otomatik denetimden geçti (sıfır hata bulundu) ve
  toplu onaylandı; tek tek insan gözüyle okunmadı.

Bu, docs/06'daki "insan gözden geçirmesi" tanımının tam anlamıyla
karşılanmadığı, bilinçli bir kısayoldur — proje sahibinin kendi kararı,
şeffaf şekilde burada kayıt altına alınıyor.

### Bizzat incelenen 9 ders

- `a-ortaokul-robot-nedir` (A/ortaokul)
- `a-lise-koordinat-sistemleri` (A/lise)
- `a-universite-dh-parametreleri` (A/üniversite)
- `b-ortaokul-eklemleri-oynat` (B/ortaokul)
- `b-lise-geometrik-ters-kinematik` (B/lise)
- `b-universite-ters-kinematik` (B/üniversite — Faz 1'den beri zaten yayında)
- `c-ortaokul-en-kisa-yol-her-zaman-en-iyi-mi` (C/ortaokul)
- `c-lise-a-yildiz-sezgisel` (C/lise)
- `c-universite-rrt-rrt-star-prm` (C/üniversite)

### Toplu onaylanan 30 ders

`a-lise-calisma-uzayi`, `a-lise-doner-dogrusal-eklemler`,
`a-lise-serbestlik-derecesi`, `a-lise-tcp-kavrami`,
`a-ortaokul-eksen-ne-demek`, `a-ortaokul-robot-ile-makine-farki`,
`a-ortaokul-robot-turleri`, `a-universite-homojen-donusum`,
`a-universite-kinematik-zincir`, `a-universite-poz-gosterimleri`,
`a-universite-robot-mimarileri`, `b-lise-aci-birimleri`,
`b-lise-eklem-limitleri`, `b-lise-ileri-kinematik`,
`b-ortaokul-birden-fazla-yol`, `b-ortaokul-erisemedigi-noktalar`,
`b-universite-dh-ileri-kinematik`, `b-universite-hiz-ivme-profilleri`,
`b-universite-jacobian`, `b-universite-movej-movel`,
`b-universite-tekillik`, `b-universite-yorunge-uretimi`,
`c-lise-engelden-kacinma`, `c-lise-grid-arama-maliyet`,
`c-ortaokul-labirentte-yol-bulma`, `c-universite-algoritma-karsilastirma-deneyi`,
`c-universite-c-space`, `c-universite-carpisma-kontrolu`,
`c-universite-optimallik-hiz-odunlesimi`, `c-universite-yol-duzlestirme`

Tüm 39 dosyada `incelendi_tarafindan: "Mert"`, `incelendi_tarih:
"2026-08-02"` (yalnız `b-universite-ters-kinematik`'te tarih Faz 1'den
kalma `"2026-08-01"`), `durum: yayinda`. Değişiklik sonrası `npx tsc
--noEmit`, `npx tsx scripts/check-content.ts`, `npx tsx
scripts/validate-content-graph.ts`, `npx eslint .`, `npx vitest run`
(55/55) ve `npx next build` tekrar çalıştırıldı; hepsi temiz.

**Sonraki için not:** Bu projede artık "yayında" statüsü tek başına
"bir insan bunu satır satır okudu" garantisi vermiyor — kimin gerçekten
okunduğunu görmek için bu dosyaya (yukarıdaki iki listeye) bakmak
gerekiyor. İleride yeni bir kalite turu yapılırsa, bu 30 ders de
zamanla tek tek gerçek incelemeden geçirilebilir; şimdilik otomatik
denetimin bulduğu "sıfır matematik hatası" sonucuna güvenilerek
yayınlandılar.

---

## Güncelleme — Kaynak kodu bağlantıları, CI, homepage kontrolü (2026-08-02)

Dört ayrı iş yapıldı:

### 1. `docs/04-icerik-rehberi.md` — eksik başlık ve yeni kural

"Ders yazma iş akışı" numaralı listesi dosyada başlıksız duruyordu
(bir önceki düzenlemede başlık kaybolmuş) — düzeltildi. Ayrıca yeni bir
bölüm eklendi: **"Üniversite seviyesinde gerçek koda bağlantı"** — bir
dersin anlattığı formül/algoritmanın arkasında `lib/robotics/` içinde
gerçek bir implementasyon varsa, dersin sonuna tek satırlık bir
"Kaynak kodu" linki eklenmesini zorunlu kılıyor. Uydurma link yasak;
implementasyon yoksa satır hiç eklenmiyor.

Bu kural, üniversite seviyesindeki 14 derse (kullanıcının belirttiği
liste) uygulandı — **12'sine link eklendi, 2'sine eklenemedi:**

| Ders | Kaynak kodu |
|---|---|
| `b-universite-dh-ileri-kinematik` | `transform.ts` `dhTransform` |
| `b-universite-ters-kinematik` | `kinematics.ts` `inverseKinematicsNumerical` |
| `b-universite-jacobian` | `kinematics.ts` `computeJacobian` |
| `b-universite-tekillik` | `kinematics.ts` `isNearSingularity` |
| `b-universite-yorunge-uretimi` | **eklenmedi** — yörünge/zaman ölçekleme kodu `lib/robotics/`'ta yok |
| `b-universite-hiz-ivme-profilleri` | **eklenmedi** — yamuk profil/S-eğrisi kodu `lib/robotics/`'ta yok |
| `c-universite-rrt-rrt-star-prm` | `planners/rrt.ts` `RrtPlanner`, `planners/rrtStar.ts` `RrtStarPlanner` |
| `c-universite-carpisma-kontrolu` | `collision.ts` `isPointFree`/`isSegmentFree` |
| `c-universite-optimallik-hiz-odunlesimi` | `planners/base.ts` `Planner` arayüzü |
| `a-universite-dh-parametreleri` | `robots/genericSixDof.ts` `genericSixDofRobot` |
| `a-universite-homojen-donusum` | `transform.ts` `multiply` |
| `a-universite-robot-mimarileri` | `kinematics.ts` `RobotSpec` |
| `a-universite-poz-gosterimleri` | `transform.ts` `rotationX`/`rotationY`/`rotationZ` |
| `c-universite-c-space` | `planners/base.ts` `Planner` arayüzü |

**Yörünge üretimi ve hız/ivme profilleri dersleri hâlâ tamamen
kavramsal** — bu iki ders formülleri anlatıyor ama platformda çalışan
bir implementasyon yok (Hat B'nin "sürekli işler" kapsamına, Faz 3+'ta
gerçek bir implementasyon eklenirse buraya link dönebilir).

### 2. Ana sayfa "1 ders gösteriyor" bulgusu — kod hatası DEĞİL

`app/page.tsx` incelendi: `getAllLessons().filter(durum === "yayinda")`
zaten tam dinamik, hiçbir hardcoded link/liste yok. Yerel build
(`out/index.html`) 39 dersin hepsini doğru listeliyor. GitHub API
üzerinden kontrol edilince, son publish commit'inin (`38c6d58`) Vercel'e
otomatik deploy olduğu ve deploy'un `success` durumunda tamamlandığı
görüldü.

**Muhtemel gerçek sebep:** Vercel her deploy'a KENDİNE ÖZGÜ, değişmez
bir URL veriyor (ör. `robotik-platform-<hash>-...vercel.app`); bu
URL'lerden biri bir yerde (sekme, yer imi) açık kalmışsa, o sekme SONSUZA
KADAR o deploy anındaki hâli gösterir — proje güncellense bile. Gerçek
"canlı" adres proje panelindeki asıl production alan adı/alias'ıdır, o
her zaman en son deploy'a işaret eder. Mert'in Vercel panelinden
"Visit" ile açtığı adresin güncel olup olmadığını kontrol etmesi
öneriliyor; kod tarafında düzeltilecek bir şey bulunamadı.

### 3. CI pipeline kuruldu

`.github/workflows/ci.yml` — her push (main) ve her PR'da otomatik
çalışıyor: `npm ci` → `npx tsc` → `npm run lint` → `npm test` →
`npx tsx scripts/check-content.ts` → `npx tsx
scripts/validate-content-graph.ts` → `npm audit --audit-level=high`
(bu son adım istenen 5 komuta ek — `docs/08-guvenlik-sertlestirme.md`'nin
"Otomatik zafiyet taraması" kuralı zaten böyle tanımlanmıştı, CI ilk
kez kurulurken devreye alındı). Node 20 kullanılıyor (yerel geliştirme
ortamıyla aynı sürüm). `npm audit` yerelde de temiz (0 zafiyet).

`next build` bilinçli olarak CI'ya eklenmedi — istenen liste sadece bu
5 komuttu; ileride eklenmek istenirse ayrı bir karar.

### 4. `docs/03-yol-haritasi.md` — cila ertelemesi notu

Dosyanın başına, tüm fazları kapsayan bir not eklendi: görsel
cila/etkileşim zenginleştirmesi bilinçli olarak Faz 5 sonrasına
erteleniyor, şu anki öncelik içerik kapsamı ve altyapı sağlamlığı.

Tüm değişiklikler sonrası `npx tsc --noEmit`, `npx eslint .`, `npx
vitest run` (55/55), `npx tsx scripts/check-content.ts`, `npx tsx
scripts/validate-content-graph.ts` ve `npx next build` tekrar
çalıştırıldı; hepsi temiz. Eklenen "Kaynak kodu" linklerinin build
çıktısında doğru render olduğu (`out/ders/b-universite-jacobian.html`
üzerinden) doğrulandı.

---

## Faz 3 — kontrol noktası (yarım kaldı, 2026-08-02)

Faz 3'ün TAMAMI istendi (Pyodide, CodeRunner, blok editör, Hat D'nin ve
Hat G'nin tam kapsamı, indirilebilir Python deposu), `faz-3-programlama-simulasyon`
branch'inde çalışmaya başlandı. Tarayıcı testi kullanıcı tarafından
durduruldu (tool-call reddi), iş bu noktada duraklatıldı. Aşağıda tam
durum — ne bitti, ne yarım, hangi risk var.

### Bitti ve commit'lendi (`879a126`, branch: `faz-3-programlama-simulasyon`)

- `lib/workers/pyodideWorker.ts` — Python kodunu Pyodide (WASM CPython)
  ile Web Worker içinde çalıştırıyor. `jsglobals` kısıtlanarak
  Python'dan `import js` ile fetch/XHR erişimi engellendi (docs/08).
  `robot.eklem_ac(index, derece)` API'si enjekte ediliyor, her çağrı
  `jointTrace`'e kaydediliyor.
- `scripts/copy-pyodide-assets.mjs` — Pyodide'in çekirdek dosyalarını
  (`pyodide.mjs`, `.asm.mjs`, `.asm.wasm`, `python_stdlib.zip`,
  `pyodide-lock.json` — 13 MB) `node_modules/pyodide`'den
  `public/pyodide/`'a kopyalıyor; dış CDN kullanılmıyor (docs/08).
  Ekstra bilimsel paketler (numpy vb.) BİLİNÇLİ OLARAK kopyalanmadı —
  gerekirse ayrı bir kararla eklenir.
- `scripts/build-worker.mjs` — artık `lib/workers/` altındaki birden
  fazla worker'ı (planner + pyodide) ayrı ayrı esbuild ile derliyor.
  `pyodide.mjs`'nin sadece Node'da çalışan (tarayıcıda hiç
  yürütülmeyen) dinamik `node:*` importları build'i kırıyordu —
  `external: ["node:*"]` ile çözüldü.
- `components/interactive/CodeRunner.tsx` — kod editörü (textarea) +
  Çalıştır/Durdur/Sıfırla; `robot` prop'u verilirse `RobotArm`'ı
  Python'dan gelen `jointTrace`'in son durumuyla sürüyor. `mdxComponents`
  listesine eklendi.
- `content/d-programlama/lise/d-lise-python-komut-dizisi.mdx` — Hat
  D'nin ilk dersi (`sira: 1`), `CodeRunner`'ı kullanıyor.
- `eslint.config.mjs` — `public/pyodide/**` ve `public/workers/**`
  ignore listesine eklendi (bunlar olmadan, kopyalanan üçüncü taraf
  `pyodide.asm.mjs` dosyası lint hatası veriyordu — gerçek bir bug,
  bu turda bulunup düzeltildi).

**Doğrulama:** `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
(55/55), `npx tsx scripts/check-content.ts` (40 ders), `npx tsx
scripts/validate-content-graph.ts`, `npx next build` (46 sayfa) —
hepsi temiz. Build çıktısında `/workers/pyodide-worker.js` ve
`/pyodide/*` dosyalarının doğru üretildiği, ders sayfasının
`robot.eklem_ac` içeren kodu doğru render ettiği dosya sistemi
üzerinden doğrulandı.

### YARIM / DOĞRULANMADI — önemli

**CodeRunner'ın tarayıcıda GERÇEKTEN çalıştığı hiç doğrulanmadı.**
Yukarıdaki "Doğrulama" sadece derleme/statik üretim katmanı — Pyodide'in
tarayıcıda gerçekten yüklenip yüklenmediği, `robot.eklem_ac()`
çağrısının işleyip işlemediği, stdout'un doğru yakalanıp yakalanmadığı,
`jsglobals` kısıtlamasının Pyodide'in kendi iç başlatma sürecini
bozup bozmadığı HİÇ test edilmedi — canlı tarayıcı testi tam bu adımda,
kullanıcının tool-call'ı reddetmesiyle durduruldu. Bu, mimarideki en
riskli varsayılan nokta: `jsglobals: { console: {...} }` gibi dar bir
nesne vermek Pyodide'in kendi başlatma kodunun ihtiyaç duyduğu bir
global'i kırabilir, bu durumda `loadPyodide()` hiç tamamlanmayabilir.
**Bir sonraki oturumda ilk iş bu olmalı: gerçek tarayıcıda bir ders
açıp "Çalıştır"a basmak.**

### Hiç başlanmadı

- Blok tabanlı editör (ortaokul Hat D)
- Hat D içerik: ortaokul (2), lise (kalan 2/3), üniversite (6) — sadece
  1/11 ders yazıldı
- Hat G içeriği (8 ders, hiçbiri yok)
- İndirilebilir Python alıştırma deposu düzenlemesi
- Faz 4 (Hat E) — Faz 3 bitmeden başlanmayacak zaten

### Cron/loop durumu

- **Aktif**, ID `4cb1628e` — her 5 dakikada bir (`*/5 * * * *`)
  tetikleniyor, "önce `/usage` kontrol et, limitliysen hiçbir şey
  yapma" talimatını taşıyor.
- **Session-only** — bu CLI oturumu kapanırsa iş de biter, diskte
  kalıcı değil. Oturum yeniden başlarsa bu cron job'ı da kaybolur,
  yeniden kurulması gerekir.
- Durdurmak için: `/loop stop` (veya CronDelete `4cb1628e`).

### Sonraki oturum için kontrol listesi

1. Dev sunucusunu başlat, `d-lise-python-komut-dizisi` dersini aç,
   "Çalıştır"a bas — Pyodide yüklenip robot hareket ediyor mu?
2. Çalışmıyorsa: önce `jsglobals` kısıtlamasını gevşetip (`jsglobals`
   parametresini hiç vermeden) dene — sorunun kaynağı bu mu anla.
   Kesin yasak: sorunu "çözmek" için testi/doğrulamayı zayıflatma,
   kök nedeni bul.
3. Çalışıyorsa: Hat D'nin kalan 10 dersine, blok editöre ve Hat G'ye
   geç (görev listesi: TaskList, #19-#28 numaralı görevler).
