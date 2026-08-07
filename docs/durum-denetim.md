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

---

## Güncelleme — CodeRunner tarayıcıda doğrulandı, kök neden bulundu (2026-08-02)

Bir önceki oturumdan iki dosyada commit'lenmemiş değişiklik bulundu
(`CodeRunner.tsx`, `pyodideWorker.ts`) — bunlar yukarıdaki kontrol
listesinin 1-2. maddelerine tam uyan, `jsglobals` kısıtlamasını
gevşetip teşhis amaçlı `status` mesajları ekleyen bir ilk deneme
girişimiydi. Çakışan/atılması gereken bir şey değildi, doğru yöndeydi;
üzerine inşa edildi.

**Kök neden bulundu:** Hata `jsglobals` değil, tamamen başka bir
şeydi. `node_modules/pyodide/pyodide.mjs`, kendi içinde
`isClassicWorker()` kontrolü yapıyor (`WorkerGlobalScope` + çalışan
`importScripts` = klasik worker sinyali) ve klasik bir worker içinde
çalıştığını tespit ederse **bilinçli olarak** `"Classic web workers
are not supported"` hatası fırlatıyor. `scripts/build-worker.mjs`
worker'ları `format: "iife"` (klasik script) olarak derliyordu ve
`CodeRunner.tsx` da `new Worker(url)`'ü module tipi belirtmeden
çağırıyordu — bu ikisi birlikte pyodide'in reddettiği tam senaryoyu
oluşturuyordu. Hata `loadPyodide()` içinde bile değil, worker script'i
DAHA YÜKLENIRKEN, senkron ve "error" event'i olarak geliyordu — bu
yüzden önceki oturumun `message` event dinleyicisi bunu hiç görmedi
(sessizce yutuldu).

**Düzeltme:**
- `scripts/build-worker.mjs`: `pyodide-worker.js` artık `format: "esm"`
  ile derleniyor (planner-worker `iife` olarak kaldı, pyodide
  kullanmıyor).
- `components/interactive/CodeRunner.tsx`: `new Worker(url, { type:
  "module" })` — modül worker olarak başlatılıyor.
- Teşhis için eklenen `status` postMessage kanalı ve konsol log'ları,
  kök neden bulunup doğrulandıktan sonra kaldırıldı (gürültüydü,
  kalıcı bir ihtiyaç değildi). Worker'ın `error` event dinleyicisi
  (senkron/top-level hataları yakalar) kalıcı olarak bırakıldı —
  gerçek hata tam da bu sayede görülebildi.

**Doğrulama — gerçek tarayıcıda (Claude in Chrome):**
`d-lise-python-komut-dizisi` dersi açıldı, "Çalıştır"a basıldı.
Pyodide ~5 saniyede yüklendi, `robot.eklem_ac(0, 45)` /
`robot.eklem_ac(1, 30)` çalıştı, `print()` çıktısı
("Robot hazır konuma geldi.") ekranda göründü VE 3D sahnedeki robot
kolu görsel olarak büküldü (yatay çizgiden dirsekli poza geçti) —
yani Python → worker → `jointTrace` → React state → Three.js sahne
zinciri uçtan uca çalışıyor. Temizlik sonrası ikinci bir çalıştırmayla
da (yeni hata yok) doğrulandı.

Ayrıca `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (55/55),
`npx tsx scripts/check-content.ts` (40 ders), `npx tsx
scripts/validate-content-graph.ts`, `npx next build` (46 sayfa)
tekrar çalıştırıldı; hepsi temiz.

**Sonraki oturum için:** Faz 3 kontrol listesinin 3. maddesine
geçilebilir — Hat D'nin kalan 10 dersi, blok tabanlı editör (ortaokul),
Hat G'nin 8 dersi, indirilebilir Python deposu.

---

## Faz 3 — tamamlandı (2026-08-02)

Aynı oturumda devam edilip Faz 3'ün kalan tüm maddeleri bitirildi.

### Altyapı (elle yazıldı, subagent kullanılmadı)

- **`robot.hedefe_git(x, y)`** — `pyodideWorker.ts`'ye eklendi.
  `CodeRunner`'a artık tam RobotSpec (`robotSpec`) da gönderiliyor;
  robot 2 eklemliyse Python tarafına `hedefe_git` enjekte ediliyor,
  içeride `lib/robotics/kinematics.ts`'teki (zaten fixture'a karşı
  test edilmiş) `inverseKinematicsAnalytical2Dof` çağrılıyor. Erişilemeyen
  noktada açılar değişmeden `False` döner. Tarayıcıda `hedefe_git(1,1)`
  → `True`, `hedefe_git(100,100)` → `False` olarak doğrulandı.
- **`BlockEditor` bileşeni** (`components/interactive/BlockEditor.tsx`) —
  ortaokul Hat D için yeni bir bileşen. Saf yorumlayıcısı
  `lib/robotics/blockProgram.ts`'te (DOM/React import yok, vitest ile
  6/6 test), UI'ı tıkla-ekle blok ağacı (hareket / tekrarla / eğer-
  değilse, iç içe geçebilir, "Engel var" anahtarıyla dallanma). "Çalıştır"
  bloğu 600ms adımlarla oynatıp robotu 3D sahnede sürüyor. `allowedBlocks`
  prop'uyla ders başına palette kısıtlanabiliyor (ör. ilk ders sadece
  "hareket"). Tarayıcıda iç içe tekrarla bloğuyla uçtan uca test edildi.
- `components/interactive/index.ts`'e `BlockEditor` eklendi.

### İçerik — 5 paralel `ders-yazari` subagent'ı ile 18 ders

Faz 1/2'deki gibi proje `.claude/agents/ders-yazari.md` bu oturumun araç
kümesinde doğrudan proje subagent'ı olarak çağrılamadığı için, genel
amaçlı `Agent` çağrıları `ders-yazari.md`'nin tam talimatını taşıyarak
kullanıldı — her biri kendi hat+seviye grubunu yazdı, kaynaklarını
WebFetch ile doğruladı:

| Grup | Ders sayısı | Bileşen(ler) |
|---|---|---|
| Hat D / Ortaokul | 2 | `BlockEditor` |
| Hat D / Lise (kalan) | 2 | `CodeRunner` (`hedefe_git` dahil) |
| Hat D / Üniversite | 6 | `CodeRunner`, `Quiz` |
| Hat G / Ortaokul + Lise | 3 | `JointSliders`, `PlannerRace`, `IkTarget` |
| Hat G / Üniversite | 5 | `JointSliders`, `PlannerRace`, `IkTarget`, `JacobianViz`, `CodeRunner` |

Hat D artık 11/11, Hat G 8/8 tamam — 58 ders dosyası toplamda.

**Not — oturum limiti:** İlk 5 paralel ajan çağrısının 4'ü "session limit"
hatasıyla başarısız oldu (sıfırlanma 20:10 Europe/Istanbul olarak
bildirildi). `/loop 5m` ile bir yeniden-deneme cron'u kuruldu; ama sistem
saati kontrol edilince (21:17, sıfırlanmadan sonra) limitin zaten açılmış
olduğu anlaşıldı, cron silindi, 5 ajan da doğrudan yeniden başlatılıp
başarıyla tamamlandı.

### Yazım sırasında bulunan/düzeltilen 2 gerçek hata

- `d-lise-hareket-komutlari.mdx`: `baslik` alanında tırnaksız iki nokta
  üst üste (`baslik: X: Y`) YAML'ı bozuyordu — tırnaklandı.
- `d-ortaokul-sirali-tekrar-kosul.mdx`: bir `kazanimlar` satırı
  `- "Tekrarla" bloğuyla ...` şeklinde kısmi tırnaklıydı (YAML "bad
  indentation of a sequence entry" hatası) — iç tırnaklar kaldırıldı.

Bu ikisi `npx tsx scripts/check-content.ts` çalıştırılırken (js-yaml
parse hatası, node process crash olarak) yakalandı, elle düzeltildi.

### Diğer

- `reference-python/README.md`'ye "Öğrenciler için" bölümü eklendi —
  Hat G üniversite derslerinden depoya atıf yapıldığı için, depodan da
  platforma dönük 3 somut alıştırma önerisi (yeni planlayıcı yaz, engel
  senaryosu ekle, `p.GUI` ile 3D izle) eklendi.
- Dev sunucusu bir ara PID çakışması yüzünden (aynı anda iki `next dev`
  süreci) 500 hatası vermeye başladı — çakışan süreç `taskkill //PID ... //F`
  ile (Git Bash'te `/PID` MSYS tarafından yol olarak yorumlandığı için
  çift slash gerekiyor) sonlandırılıp tek sunucu ile temiz başlatıldı.

### Doğrulama

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (61/61),
`npx tsx scripts/check-content.ts` (58 ders), `npx tsx
scripts/validate-content-graph.ts` (58 ders, döngü/eksik referans yok),
`npx next build` (64 sayfa) — hepsi temiz. Tarayıcıda ayrıca:
`d-ortaokul-blok-komutlar` (BlockEditor, `allowedBlocks={["move"]}`
doğru kısıtlıyor), `d-lise-hareket-komutlari` (`hedefe_git` → `True`,
robot kolu görsel olarak hedefe büküldü), `g-lise-basit-sahne-kurma`
(`PlannerRace` + `initialObstacles` ile "masa" doğru render oldu) —
üçü de gerçek tarayıcıda (Claude in Chrome) çalıştırılıp doğrulandı.

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Faz 1/2'deki gibi: 18 yeni ders de dahil 58 dosyanın `durum: taslak`
kalması bilinçli — bu bir **yapay zeka** yazım/incelemesiydi, docs/06
Katman 3'ün istediği insan gözden geçirmesi değil. Hangi derslerin
okunup `yayinda` yapılacağına karar vermek kullanıcıya (Mert) ait.

### Sonraki için not

Faz 3 tamamlandı. Faz 4 (Hat E — haberleşme, Hat F — algılama) henüz
başlamadı; CLAUDE.md kuralı gereği yeni faz kapsamı kullanıcı onayı
gerektirir.

---

## Faz 4 — Hat E tamamlandı (2026-08-02)

Kullanıcı "Faz 4'e geç: Hat E'nin haberleşme dersleri" diyerek onay
verdi. Aynı oturumda (Faz 3'ün hemen ardından) Hat E'nin 10 dersinin
tamamı yazıldı.

### Altyapı — `SignalTimeline` bileşeni

`components/interactive/SignalTimeline.tsx` — bir veya birden fazla
sinyalin zaman içindeki AÇIK/KAPALI durumunu tıkla-ayarla + "Oynat"
düğmesiyle 500ms/adım playhead animasyonu. `BlockEditor`'dan farklı
olarak ayrı bir `lib/robotics/` yorumlayıcısı YOK — bu bilinçli bir
karar: bileşende test edilmesi gereken bir "hesaplama/algoritma" yok,
sadece UI durumu (JointSliders/IkTarget'ın yaptığı gibi). Doğru/yanlış
sinyal deseni bileşende değil, ders metninde/Quiz'de ele alınıyor —
`CodeRunner` gibi 3 temalı (`ortaokul`/`lise`/`universite`),
`JointSliders`/`IkTarget` gibi seviyeden bağımsız. Tarayıcıda el sıkışma
deseniyle (toggle + oynat + sıfırla) test edildi, `index.ts`'e kaydedildi.

### İçerik — 3 paralel `ders-yazari` subagent'ı ile 10 ders

| Grup | Ders sayısı | Bileşen(ler) |
|---|---|---|
| Hat E / Ortaokul | 2 | `SignalTimeline` |
| Hat E / Lise | 3 | `SignalTimeline` (3 dersde de farklı sinyal seti/görev) |
| Hat E / Üniversite | 5 | `SignalTimeline`, `CodeRunner`, `Quiz` |

Hat E artık 10/10 — toplam 68 ders dosyası.

**Paralel yazımın yan etkisi:** Ortaokul/lise/üniversite ajanları aynı
anda çalıştığı için ikisi (`e-lise-dijital-giris-cikis`,
`e-universite-tcpip-soket`) henüz yazılmamış kardeş derslere onkosul
veremedi, `onkosul: []` bıraktı. Doğrulama sırasında elle
`e-ortaokul-sinyal-var-yok` ve `e-lise-el-sikisma`'ya bağlandı.

**docs/05 Bölüm 2.3 güvenlik notu:** `e-universite-hata-durumlari.mdx`
belirgin bir "## Güvenlik notu" bölümü taşıyor — gerçek bir robotta
haberleşme koptuğunda "belki birazdan gelir" varsayımıyla harekete
devam etmenin neden tehlikeli olduğunu, ISO 10218-2/OSHA atıflarıyla
anlatıyor; platformun "gerçek robota bağlanmaz" duruşunu (docs/00)
tekrar vurguluyor.

### Yazım sırasında bulunan/düzeltilen hata

- `e-lise-el-sikisma.mdx`: bir `kazanimlar` satırı `- "Aldım" sinyalinin
  "hazırım" sinyalinden...` şeklinde kısmi tırnaklıydı (aynı YAML "bad
  indentation of a sequence entry" hatası, Faz 3'te de görülmüştü) —
  iç tırnaklar kaldırıldı.

### Doğrulama

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (61/61), `npx tsx
scripts/check-content.ts` (68 ders), `npx tsx
scripts/validate-content-graph.ts` (68 ders, döngü/eksik referans yok),
`npx next build` (74 sayfa) — hepsi temiz. Tarayıcıda: `SignalTimeline`
(toggle + oynat, geçici test dersiyle), `e-lise-el-sikisma` (el sıkışma
sahnesi görsel olarak doğru) ve `e-universite-hata-durumlari`
(`CodeRunner` ile `hedefe_git(5,5)` → `False` → "haberleşme hatası"
senaryosu doğru çalıştı) test edildi.

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Faz 1/2/3'teki gibi: 10 yeni ders `durum: taslak` kaldı — yapay zeka
yazım/incelemesiydi, docs/06 Katman 3'ün istediği insan gözden
geçirmesi değil.

### Sonraki için not

Hat E tamamlandı. Faz 4'ün geri kalanı — Hat F (algılama) — henüz
başlamadı; kullanıcı onayı bekliyor.

---

## Faz 4 — Hat F tamamlandı, Faz 4 tamamen bitti (2026-08-03)

Aynı `faz-3-programlama-simulasyon` branch'inde devam edildi. Bir önceki
oturumda Hat F için 3 bileşen (`PixelToWorld`, `ThresholdViewer`,
`ScanPath`) zaten yazılıp commit'lenmişti (`96b2319`); bu oturumda
içerik (11 ders) yazıldı.

### İçerik — 3 paralel `ders-yazari` subagent'ı ile 11 ders

Bu oturumda proje `.claude/agents/ders-yazari.md`, doğrudan proje
subagent'ı (`ders-yazari`) olarak çağrılabildi — önceki fazlardaki gibi
genel amaçlı `Agent` çağrısına talimat taşıtmaya gerek kalmadı.

| Grup | Ders sayısı | Bileşen(ler) |
|---|---|---|
| Hat F / Ortaokul | 2 | `PixelToWorld`, `SignalTimeline` |
| Hat F / Lise | 3 | `PixelToWorld` (kalibrasyon + perspektif), `ThresholdViewer` |
| Hat F / Üniversite | 6 | `PixelToWorld`, `ScanPath`, `ThresholdViewer`, `Quiz` |

Hat F artık 11/11 — toplam 79 ders dosyası. docs/01-mufredat.md'deki Hat
F madde sayısıyla birebir (ortaokul 2 + lise 3 + üniversite 6 = 11);
`docs/03-yol-haritasi.md`'deki eski "8 ders" tahmini güncellendi.

Kaynaklar arasında Keyence sensör dokümantasyonu, OpenCV kalibrasyon/
eşikleme belgeleri, Zhang (2000) ve Tsai & Lenz (1989) kamera/el-göz
kalibrasyonu makaleleri, Choset & Pignon (1997) ve Galceran & Carreras
(2013) kapsama planlaması yayınları, Besl & McKay (1992) ICP makalesi,
JCGM 200:2012 (VIM) ve ISO 5725-1:1994 var — hepsi WebFetch ile erişimi
doğrulanarak atfedildi (bazı üretici sayfaları 403/404 verdiği için
kaynak dışı bırakıldı).

Üniversite seviyesinde "Kaynak kodu" linki hiçbir derse eklenmedi:
`lib/robotics/` içinde kamera/görü/nokta bulutu matematiği yok, uydurma
link yazılmadı (docs/04 kuralı).

Graph doğrulaması iki "kök" (ön koşulsuz üniversite dersi) uyarısı
veriyor (`f-universite-kamera-kalibrasyonu`,
`f-universite-lazer-profil-sensoru`) — bu kasıtlı, Hat F'nin üniversite
seviyesinde iki bağımsız alt-konusu (kalibrasyon zinciri / tarama
zinciri) olduğu için, Hat E'deki benzer duruma paralel.

### Doğrulama

`npx tsx scripts/check-content.ts` (79 ders), `npx tsx
scripts/validate-content-graph.ts` (79 ders, döngü/eksik referans yok,
2 kasıtlı kök uyarısı), `npx tsc --noEmit`, `npx eslint .`, `npx vitest
run` (61/61), `npm run build` (85 sayfa) — hepsi temiz.

Tarayıcıda (Claude in Chrome) üç seviyeden örnek ders açılıp test
edildi: `f-lise-piksel-milimetre` (`PixelToWorld`, piksel (50,20) →
250mm/100mm, ders metnindeki sayıyla birebir), `f-universite-tarama-
yolu-uretimi` (`ScanPath`, "Tara" ile 4×12=48 nokta eksiksiz toplandı),
`f-ortaokul-robot-nasil-gorur` (`PixelToWorld` ortaokul temasıyla doğru
render).

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Faz 1/2/3/4(E)'teki gibi: 11 yeni ders `durum: taslak` kaldı — yapay
zeka yazım/incelemesiydi, docs/06 Katman 3'ün istediği insan gözden
geçirmesi değil.

### Sonraki için not

**Faz 4 tamamen bitti** (Hat E + Hat F). Sıradaki faz, Faz 5 (v1.0) —
Hat H (güvenlik), arama, sözlük, katkı süreci, erişilebilirlik/performans
denetimi. CLAUDE.md kuralı gereği yeni faz kapsamı kullanıcı onayı
gerektirir.

---

## Faz 3+4 sonrası kalite denetimi (2026-08-03)

Faz 3 ve Faz 4'ün main'e merge edilmesinden sonra, o iki fazda yazılan
**40 dersin tamamı** `kalite-denetci` subagent'ıyla denetlendi (Hat D 11,
Hat G 8, Hat E 10, Hat F 11). Ayrıca 79 dersin tamamı üzerinde ayrı bir
kanca (hook) çeşitliliği denetimi yapıldı.

### Denetimin kapsamı

Üç odak: (1) `BlockEditor` ve `hedefe_git`/`eklem_ac` Python API'sinin
öğrettiği şeyin `lib/robotics/blockProgram.ts` ve
`lib/workers/pyodideWorker.ts`'teki gerçek davranışla eşleşmesi,
(2) `SignalTimeline` / `PixelToWorld` / `ThresholdViewer` / `ScanPath`
bileşenlerinin sayısal örneklerinin doğruluğu, (3) `docs/04`'teki kanca
çeşitliliği kuralına uyum.

### Sonuç: KRİTİK bulgu yok

Hiçbir derste yanlış formül, çalışmayan örnek kod veya uydurma API
bulunmadı. Özellikle doğrulananlar:

- `eklem_ac(index, derece)`'in parametre sırası, derece birimi ve
  **mutlak atama** davranışı derslerde doğru anlatılmış.
- `hedefe_git` koda göre yalnızca `joints.length === 2` iken enjekte
  ediliyor; dersler bu kısıta uymuş (6-DOF derslerinde hiç çağrılmamış).
- Erişim aralığı örnekleri (a1=1.0, a2=0.8 → [0.2, 1.8]) gerçek IK
  mantığıyla tutarlı.
- Lazer üçgenleme (Z = b·tanθ), tarama örtüşmesi (s = W·(1−o)), ölçüm
  belirsizliği (x̄=10,004 mm, s≈0,029 mm) elle yeniden hesaplandı, doğru.
- URDF etiketleri ve PyBullet API çağrıları `reference-python/` içindeki
  gerçek kodla eşleşiyor; derslerin bahsettiği hiçbir dosya/komut adı
  uydurma değil.

### Düzeltilen bulgular

| Bulgu | Düzeltme |
|---|---|
| `PixelToWorld` prop'u `mmPerCell` adlanıyordu ama kod değeri **piksel** başına uyguluyordu (JSDoc "hücre" diyordu, 10× anlam farkı) | `mmPerPixel` olarak yeniden adlandırıldı; iki MDX kullanımı güncellendi. İçerikte yanlış sayı yoktu — dersler zaten mm/piksel diye doğru yorumlamıştı |
| 74 ders `<Quiz>` kullanıyor ama sadece 15'i `etkilesimli:`'de listeliyordu; 15'inin tamamı Faz 3+4 üniversite dersiydi | 15 dosyadan `Quiz` çıkarıldı, 64 dersin konvansiyonuna hizalandı. `Quiz` tek girdi olan 5 dosyada `etkilesimli: []` yapıldı (`b-universite-hiz-ivme-profilleri` emsali) |
| `f-universite-kamera-kalibrasyonu` ve `f-universite-lazer-profil-sensoru` ön koşulsuzdu (graph validator uyarısı) | Sırasıyla `f-lise-olcek-perspektif-hatasi` ve `f-lise-piksel-milimetre` ön koşul olarak eklendi. **Graph uyarıları 2 → 0** |
| `g-universite-cevrimdisi-programin-dogrulanmasi` "Kaynak kodu" linki `main.py#L64`'e gidiyordu; L64 dekoratör, `def create_plan` L65'te | Link `#L65` yapıldı |
| `f-lise-esikleme-nesne-bulma` "kabaca 82-188" diyordu, bileşenin gerçek aralığı 82-189 | 82-189 yapıldı |
| `ScanPath.tsx`'te ölü kod: `Math.min(CELL_PX, rowHeightPx)` her zaman `CELL_PX` veriyordu | `rowHeightPx` kaldırıldı |
| `e-lise-dijital-giris-cikis` "onlarca milisaniye" diyip bunu sahnede gösteriyordu, ama bileşen sabit 500 ms/adım | `e-universite-cycle-time-jitter`'daki gibi zamanlama sabiti açıkça belirtildi: adım bir sıra birimidir, gerçek zaman ölçeği değil |

### Kanca çeşitliliği: kural genelleştirildi

`docs/04`'ün **adıyla yasakladığı** "[durum] → Ama/Ancak → Peki...?"
iskeleti 79 dersin hiçbirinde kullanılmamış (doğrulandı: `## Kanca`
bölümlerinde "Peki" kelimesi hiç geçmiyor). Ama yerini başka bir kalıp
almıştı: **"Çoğu kişi X sanır, aslında Y"** yeni 40 dersin %25'inde
(10 ders), eski 39 dersin %5'inde (2 ders) kullanılıyordu. Ayrıca üç
yerde ardışık tekrar vardı (E/üni sıra 3-4, F/üni sıra 4-5, G/üni
sıra 4-5).

Bu, "bir kalıbı yasaklayınca yerini başkası alır" durumunun somut
örneği olduğu için kural genelleştirildi (`docs/04-icerik-rehberi.md`
"Kanca çeşitliliği" + `.claude/rules/content.md`):

- Genel ilke artık **hiçbir açılış kalıbı arka arkaya tekrar etmez** —
  belirli bir kalıbı yasaklamak değil.
- Aşınmış iki iskelet ("Ama...Peki...?" ve "Çoğu kişi...") yasak değil,
  **kotalı** olarak işaretlendi.
- Ardışıklık kontrolü üç maddeye bağlandı: aynı iskelet iki kez ardışık,
  açılış cümlesinin birebir aynı yapıda olması, ya da bir hat+seviyenin
  yarısından fazlasının tek kalıpta toplanması.
- Kalıbın adı konamıyorsa uygulanacak test eklendi: iki kancanın ilk
  cümlelerinin **gramer iskeletini** yan yana karşılaştır.

Yeni kurala göre 8 kanca yeniden yazıldı (`d-ortaokul-sirali-tekrar-kosul`,
`e-lise-zamanlama-neden-onemli`, `e-universite-plc-master-slave`,
`f-ortaokul-goz-olmadan-is-yapmak`, `f-universite-nokta-bulutu-yuzey-muayenesi`,
`g-lise-deneme-yanilma-maliyeti`, `g-universite-pybullet-sahne-fizik`,
`g-universite-cevrimdisi-programin-dogrulanmasi`). Sonuç: "Çoğu kişi"
kalıbı 10 → **3** derse indi (%25 → %7,5, eski içerikteki %5'e yakın),
üç ardışık tekrarın hepsi kırıldı. Yeni kancalar komşu derslerin
kalıbıyla çakışmayacak şekilde seçildi (mini senaryo, karşılaştırma,
şaşırtıcı gözlem, doğrudan meydan okuma, teknik çerçeve).

### Elle doğrulanması gereken kısım — kaynaklar

Denetimin en zayıf tarafı bu. WebFetch ile erişilebilen kaynakların
**hepsi** derslerdeki iddialarla birebir örtüştü (Mecademic
`mecademicpy`, OpenCV kalibrasyon/eşikleme, Keyence vision/photoelectric,
Wikipedia GSD, EtherCAT/PROFINET/EtherNet-IP, RoboDK, PyBullet,
arXiv:2009.13303, NASA dijital ikiz). Ancak ~20 kaynağa hiç
erişilemedi: ABB RAPID PDF'i bozuk metin verdi, `docs.ros.org` ve ROS
Wiki bot korumasına (Anubis) takıldı, KUKA KSS ve FANUC TP kılavuzları
kamuya açık değil, ISO/IEC standartları ve birkaç DOI paywall arkasında,
5 ders kitabı çevrimiçi mevcut değil.

Bunlar **"yanlış" değil, "teyit edilmedi"** olarak işaretlendi. docs/06
Katman 3'ün insan tarafından yapılması gereken kısmı tam burası.
Özellikle robot dili sözdizimi iddiaları taşıyan dersler (elle kontrol
listesi):

**ABB RAPID sözdizimi geçen dersler:**
- `content/a-temeller/lise/a-lise-koordinat-sistemleri.mdx`
- `content/a-temeller/lise/a-lise-tcp-kavrami.mdx`
- `content/b-kinematik/universite/b-universite-hiz-ivme-profilleri.mdx`
- `content/b-kinematik/universite/b-universite-movej-movel.mdx`
- `content/d-programlama/ortaokul/d-ortaokul-blok-komutlar.mdx`
- `content/d-programlama/ortaokul/d-ortaokul-sirali-tekrar-kosul.mdx`
- `content/d-programlama/lise/d-lise-python-komut-dizisi.mdx`
- `content/d-programlama/lise/d-lise-hareket-komutlari.mdx`
- `content/d-programlama/lise/d-lise-koordinat-hiz-bekleme.mdx`
- `content/d-programlama/universite/d-universite-abb-rapid.mdx` (en yoğun: `robtarget`, `wobjdata`, `PROC`/`ENDPROC`, `MoveJ`/`MoveL`)
- `content/d-programlama/universite/d-universite-fanuc-karsilastirma.mdx`
- `content/d-programlama/universite/d-universite-kuka-krl.mdx`
- `content/d-programlama/universite/d-universite-mecademic-python.mdx`
- `content/d-programlama/universite/d-universite-offline-programlama.mdx`
- `content/d-programlama/universite/d-universite-ros2-temelleri.mdx`
- `content/e-haberlesme/lise/e-lise-dijital-giris-cikis.mdx` (`SetDO`, `WaitDI`)
- `content/e-haberlesme/lise/e-lise-el-sikisma.mdx` (`SetDO`, `WaitDI`)
- `content/e-haberlesme/lise/e-lise-zamanlama-neden-onemli.mdx` (`SetDO`, `WaitDI`)
- `content/g-simulasyon/universite/g-universite-cevrimdisi-programin-dogrulanmasi.mdx`

**KUKA KRL sözdizimi geçen dersler:**
- `content/b-kinematik/universite/b-universite-movej-movel.mdx` (`PTP`, `LIN`)
- `content/d-programlama/ortaokul/d-ortaokul-blok-komutlar.mdx`
- `content/d-programlama/lise/d-lise-python-komut-dizisi.mdx`
- `content/d-programlama/lise/d-lise-koordinat-hiz-bekleme.mdx`
- `content/d-programlama/universite/d-universite-abb-rapid.mdx`
- `content/d-programlama/universite/d-universite-kuka-krl.mdx` (en yoğun: `PTP`/`LIN`/`CIRC`, `.src`/`.dat` ayrımı)
- `content/d-programlama/universite/d-universite-fanuc-karsilastirma.mdx`
- `content/d-programlama/universite/d-universite-mecademic-python.mdx`
- `content/d-programlama/universite/d-universite-offline-programlama.mdx`
- `content/d-programlama/universite/d-universite-ros2-temelleri.mdx`
- `content/g-simulasyon/universite/g-universite-cevrimdisi-programin-dogrulanmasi.mdx`

**FANUC TP sözdizimi geçen dersler:**
- `content/d-programlama/universite/d-universite-fanuc-karsilastirma.mdx` (en yoğun: `J`/`L`, `FINE`/`CNT`, birim ayrımı)
- `content/d-programlama/universite/d-universite-kuka-krl.mdx`
- `content/d-programlama/universite/d-universite-abb-rapid.mdx`
- `content/d-programlama/universite/d-universite-mecademic-python.mdx`
- `content/d-programlama/universite/d-universite-offline-programlama.mdx`

### Doğrulama

`npx tsx scripts/check-content.ts` (79 ders, hata yok), `npm run
validate-content-graph` (79 ders, **0 uyarı** — önceki 2 kök uyarısı
ön koşul eklenerek kapatıldı), `npx eslint .`, `npx vitest run` (61/61),
`npm run build` (85 sayfa) — her adımdan sonra ayrı ayrı koşuldu, hepsi
temiz.

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Denetim bir insan gözden geçirmesinin yerine geçmez. 40 ders
`durum: taslak` kalmaya devam ediyor; `durum: yayinda` için docs/06
Katman 3 (kaynakların elle karşılaştırılması — özellikle yukarıdaki
RAPID/KRL/TP listesi) hâlâ gerekli.

---

## Faz 5 — YARIM KALDI (2026-08-04, ara kayıt)

**Bu bölüm tamamlanmış bir faz kaydı DEĞİL.** Faz 5 (v1.0) başlatıldı,
altı maddeden ikisi bitti, dördü hiç başlamadı. Çalışma
`faz-5-guvenlik-ve-v1` dalına commit edildi; **main'e merge edilmedi ve
PR açılmadı** — bu adım faz bitince yapılacak. Sonraki oturum buradan
devam etmeli.

### Biten

**1. Hat H — güvenlik ve standartlar (10 ders).** `content/h-guvenlik/`
altında, hepsi `durum: taslak`:

| Seviye | Ders | sıra |
|---|---|---|
| Ortaokul | `h-ortaokul-robotlar-neden-tehlikeli` | 1 |
| Ortaokul | `h-ortaokul-temel-guvenlik-kurallari` | 2 |
| Lise | `h-lise-kafesli-robot-ve-kobot` | 1 |
| Lise | `h-lise-acil-durdurma-ve-guvenli-bolge` | 2 |
| Üniversite | `h-universite-iso-10218-ve-ts-15066` | 1 |
| Üniversite | `h-universite-risk-degerlendirmesi` | 2 |
| Üniversite | `h-universite-performans-seviyesi-ve-kategori` | 3 |
| Üniversite | `h-universite-guc-ve-kuvvet-sinirlama` | 4 |
| Üniversite | `h-universite-guvenli-durus-hiz-ve-mesafe` | 5 |
| Üniversite | `h-universite-guvenli-hucre-tasarimi` | 6 |

Bununla 8 hattın tamamı içerik olarak var: **89 ders dosyası.**

**2. Altyapı (Hat H için yazıldı, kalıcı):**

- `lib/robotics/safety.ts` — ayrım mesafesi matematiği (`travelDistance`,
  `stoppingDistance`, `requiredSeparation`, `zoneState`, `allowedSpeed`).
  Saf TypeScript, DOM/React importu yok.
- `lib/robotics/safety.test.ts` — 15 test, hepsi geçiyor.
- `components/interactive/SafetyZone.tsx` — üç seviyede de kullanılan tek
  sahne; `mode` prop'u ile sunum derinliği değişiyor (`bolge` /`mesafe` /
  `hesap`), alttaki hesap aynı. `index.ts`'e kaydedildi.
- `app/globals.css` — `--color-durum-dur/uyari/serbest` semantik durum
  renkleri. Her zaman ikon + metinle birlikte kullanılıyor (docs/07:
  renk tek başına bilgi taşımaz).
- `lib/content.ts` — `HAT_ETIKET` haritası ve `hatEtiket()` eklendi
  (daha önce hat adlarının görünen karşılığı hiçbir yerde yoktu).

**3. Sözlük — verisi hazır, sayfası YOK:**

- `content/sozluk.json` — 8 hattın tamamından **72 terim**, Türkçe-İngilizce
  karşılık + bir cümlelik tanım + hat etiketi. İçerik koddan ayrı tutuldu.
- `lib/sozluk.ts` — `getSozluk()` ve `getSozlukByHat()` okuyucuları.
- **Eksik:** `app/sozluk/page.tsx` yazılmadı.

### Kaynak durumu — Hat H için kritik

Kullanıcının açık talimatı vardı: güvenlik standartlarında doğrulanamayan
hiçbir şey iddia edilmeyecek, PL d/Cat 3 gibi sayısal detaylarda daha az
iddialı ifadeye çekilecek. Uygulanan yöntem:

**Doğrulanabilenler** (WebSearch/WebFetch ile, birden fazla bağımsız
kaynaktan teyit edildi):

- ISO 10218-1:2025 ve ISO 10218-2:2025 yayımlandı, 2011 baskılarının
  yerini aldı.
- **ISO/TS 15066'nın işbirlikçi uygulama içeriği ISO 10218 serisine
  alındı.** TS resmen geri çekilmedi; ISO/AWI 15066-1 halefi geliştiriliyor.
- Standart "kobot" yerine **işbirlikçi uygulama** terimine geçti.
- **Blok "PL d + Kategori 3" şartı büyük ölçüde terk edildi**, yerine
  fonksiyon bazlı PLr belirlemesi geldi. Acil durdurma için asgari seviye
  PL d'den bir kademe aşağıda.
- ISO 12100 risk değerlendirmesi adımları ve üç adımlı risk azaltma sırası.
- ISO/TS 15066'nın dört işbirlikçi çalışma biçimi.

**Doğrulanamayanlar** — hiçbiri derste sayı olarak yazılmadı:

- ISO 10218-1/-2:2025, ISO/TS 15066:2016, ISO 12100:2010, ISO 13849-1,
  ISO 13855, IEC 60204-1 **birincil metinlerinin hiçbirine erişilemedi**
  (ücretli erişim; iso.org 403 döndü).
- Bu yüzden bilinçli olarak YAZILMADI: PL'ler için sayısal arıza olasılığı
  aralıkları, 2025 baskısındaki fonksiyon–seviye tablosu, biyomekanik
  kuvvet/basınç sınır değerleri, vücut bölgesi sayısı, yay sabitleri,
  koruyucu ayrım mesafesinin standart formülü, programlama modundaki
  düşürülmüş hız sınırı, madde numaraları.

Üniversite derslerinin **hepsinde** görünür bir `> **Doğrulama notu.**`
bloğu var; neyin doğrulanmadığını ve neyin bilinçli olarak yazılmadığını
okuyucuya doğrudan söylüyor. Ayrıca `> **Uyarı.**` blokları docs/05 §2.3
gereği "bu ders risk değerlendirmesinin yerine geçmez" diyor.

`SafetyZone`'un arkasındaki model standardın formülü değil; hem
`lib/robotics/safety.ts` dosya başlığında hem ilgili derste bu açıkça
belirtildi.

### Yapılmayan — sonraki oturumun listesi

1. **Arama özelliği** — hiç başlanmadı. Planlanan yaklaşım: statik export
   olduğu için `scripts/build-search-index.mjs` ile `public/arama-index.json`
   üretip (`prebuild`/`predev`'e bağlanacak, `public/workers/` deseninin
   aynısı), `app/ara/page.tsx` istemci tarafında tembel yükleyip filtreleyecek.
   İlk yükleme JS bütçesi (<200 KB) bozulmamalı.
2. **Sözlük sayfası** — `app/sozluk/page.tsx`. Veri ve okuyucular hazır.
3. **Erişilebilirlik denetimi** — hiç başlanmadı.
4. **Performans denetimi (Lighthouse)** — hiç başlanmadı. docs/05 §3
   hedefleri: FCP < 1.0 sn, TTI < 2.0 sn, ilk yükleme JS < 200 KB,
   Lighthouse mobil ≥ 90.
5. **Katkı sürecinin resmileştirilmesi** — `CONTRIBUTING.md`, PR şablonu,
   `SECURITY.md` (hiçbiri repoda yok; `.github/` altında sadece
   `workflows/ci.yml` var).
6. **docs/03-yol-haritasi.md** Faz 5 kutuları işaretlenmedi.
7. **Commit + PR** açılmadı. Kullanıcının isteği: main'e doğrudan merge
   YOK, PR açılacak; `gh` CLI kurulu değil, `winget install GitHub.cli`
   denenecek, olmazsa lokal commit + push ile PR elle açılacak.

**Bilinen sarkan bağlantı:** `h-universite-guvenli-hucre-tasarimi` dersinin
"Sonraki" bölümü `/sozluk` ve `/ara` sayfalarına link veriyor; o iki sayfa
henüz yok. Build kırılmıyor (MDX içindeki düz bağlantılar), ama sayfalar
yazılana kadar 404 verir. Sayfalar yazıldığında bu kendiliğinden düzelir.

### Doğrulama (bu ara kayıt anındaki durum)

`npx vitest run` (6 dosya, **76/76** — safety.ts ile 15 test eklendi),
`npx eslint .`, `npx tsc --noEmit`, `npx tsx scripts/check-content.ts`
(**89 ders**, hata yok), `npm run validate-content-graph` (89 ders,
döngü/eksik referans yok, **0 uyarı**), `npm run build`
(**95 sayfa**, temiz) — hepsi geçiyor.

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Hat H'nin 10 dersi `durum: taslak`. Güvenlik hattı için insan gözden
geçirmesi diğer hatlardan daha kritik: yukarıdaki "doğrulanamayanlar"
listesindeki her madde, standardın kendisi alınarak kontrol edilmeli.

---

## Müfredat dosyası eski standart çerçeveyi yansıtıyordu — güncellendi (2026-08-04)

`docs/01-mufredat.md`'deki Hat H / Üniversite listesinde bir madde
**"Performans seviyesi (PL d) ve kategori (Cat 3) ne demek"** yazıyordu.
Bu satır, ISO 10218'in 2011 baskısı dönemindeki yaygın uygulamayı —
güvenlikle ilgili kontrol fonksiyonlarına topluca PL d + Kategori 3
şartı koymayı — bir öğretim hedefi gibi sabitliyordu.

Hat H yazılırken (yukarıdaki Faz 5 ara kaydı) doğrulanan durum bunun
tersi: **2025 baskılarında bu blok şart büyük ölçüde terk edildi**,
yerine her güvenlik fonksiyonu için ayrı ayrı, o fonksiyonun kendi
riskinden türetilen bir gerekli seviye (PLr) belirlemesi geldi. Ders
(`h-universite-performans-seviyesi-ve-kategori`) zaten bu doğru
çerçeveyle yazılmıştı; **eski olan müfredat dosyasıydı**, ders değil.

Madde, ders içeriğiyle hizalanacak şekilde yeniden yazıldı: PL ve
kategori kavramları + PLr'nin risk değerlendirmesinden türetilmesi +
2011→2025 yöntem değişimi. Sayısal tablo hedefi bilinçli olarak
konmadı; birincil standart metinleri ücretli erişim arkasında olduğu
için bu platformda sayısal eşik iddia edilmiyor (aynı gerekçe dersin
`> **Doğrulama notu.**` bloğunda okuyucuya da söyleniyor).

**Genel ders:** planlama dokümanları da içerik gibi eskiyebiliyor.
Bir hat yazılırken kaynak araştırması müfredattaki bir varsayımı
çürütüyorsa, düzeltilmesi gereken sadece ders değil, müfredat
maddesinin kendisi.

---

## Faz 5 tamamlandı (2026-08-04)

Yarım kalan dört madde bitirildi: arama, sözlük sayfası, erişilebilirlik
denetimi, performans denetimi ve katkı sürecinin resmileştirilmesi.
`docs/03-yol-haritasi.md` Faz 5 kutuları işaretlendi.

### 1. Arama (`/ara`)

Statik export olduğu için sunucu tarafı arama yok. Kurulan hat:

- `lib/arama.ts` — saf TypeScript (DOM/React importu yok): Türkçe→ASCII
  normalleştirme, indeks hazırlama, eşleştirme ve bağlam (snippet) çıkarma.
  MDX gövdesini düz metne indirgeyen `mdxDuzMetne` de burada (test edilebilir
  olsun diye script'te değil). `lib/arama.test.ts` — 10 test.
- `scripts/build-search-index.ts` — `predev`/`prebuild` içinde koşar,
  `public/arama-index.json` üretir (39 yayınlanmış ders, 88 KB / 29 KB gzip).
  `public/workers/` deseninin aynısı: üretilen dosya, `.gitignore`'da.
- `components/ui/AramaKutusu.tsx` — indeksi **kullanıcı yazmaya başlayınca**
  `fetch` ile getirir; ilk yükleme JS bütçesine hiç girmez.

Normalleştirmenin bir tasarım kısıtı var ve kodda not düşüldü: her harf
eşlemesi tek karakter → tek karakter, çünkü bağlam çıkarma normalleştirilmiş
metindeki indisin orijinal metinde de aynı yeri göstermesine dayanıyor.
Bunu doğrulayan ayrı bir test var.

Arama yalnızca `durum: yayinda` dersleri kapsıyor — ana sayfa ve seviye
sayfalarıyla aynı kural. Yani Hat D/E/F/G/H henüz aranamıyor; insan gözden
geçirmesinden geçtikçe kendiliğinden görünür olacaklar.

### 2. Sözlük (`/sozluk`)

`app/sozluk/page.tsx` — tamamen statik, hat başlıklarına çapa gezinmesi olan
bir tanım listesi. Veri (`content/sozluk.json`, 72 terim) ve okuyucular
(`lib/sozluk.ts`) Faz 5'in ilk yarısında hazırdı, eksik olan sayfaydı.
Ana sayfaya `/ara` ve `/sozluk` bağlantıları eklendi.

Bununla önceki turda not düşülen **sarkan bağlantı kapandı**:
`h-universite-guvenli-hucre-tasarimi` dersinin "Sonraki" bölümü bu iki
sayfaya link veriyordu, ikisi de artık var.

### 3. Erişilebilirlik denetimi

Lighthouse (mobil) erişilebilirlik puanı denetlenen her sayfada **100**.
Bulunan ve düzeltilen gerçek sorunlar:

| Bulgu | Neden ciddi | Düzeltme |
|---|---|---|
| **`IkTarget` yalnızca sürükleyerek kullanılabiliyordu** | Klavye kullanıcısı hedefi hiç oynatamıyordu — WCAG 2.1.1 ihlali ve docs/02'nin "her sahnenin klavye alternatifi olmalı" kuralının doğrudan ihlali | Hedefi konumlandıran X/Y kaydırıcıları eklendi; alttaki IK çözümü sürüklemeyle aynı |
| **`PlannerRace`'te engel koymak yalnızca dokunmayla yapılıyordu** | Aynı sorun; dersin ana etkileşimi (kendi engel düzenini kur) klavyeyle erişilemezdi | X/Y kaydırıcıları + "Bu noktaya engel ekle / kaldır" düğmesi; ikisi de aynı `handlePlaneClick`'e gidiyor |
| **Vurgu rengi `#0ea5a0` bağlantı metninde 2,88:1 kontrast** | Sitedeki HER ders bağlantısı bu renkteydi; WCAG AA 4,5:1 istiyor (docs/07 "kontrast WCAG AA karşılar") | Vurgu rengi ikiye ayrıldı: `--accent` (dolgu/kenarlık/3D, canlı kalır) ve `--accent-text` (metin, koyulaştırılmış). 19 kullanım yeni token'a geçti |
| **Soluk metin `ink/60` ≈ 4,2:1** | Yine AA altı, 29 yerde | Hepsi `ink/70`'e çıkarıldı (≈5,9:1) |
| **`JacobianViz` ve `PlannerRace`'te etiket metni renkle boyanıyordu** | Turuncu/mor metin AA'yı karşılamıyor; ayrıca renk tek başına bilgi taşıyordu | Renk, metinden ayrılıp yanına küçük bir kare olarak konuldu; metin tam kontrastlı ink renginde |
| **3D canvas ekran okuyucuya boş geliyordu** | docs/02: "her sahnenin metin özeti olmalı" | Sahne kutuları `aria-hidden`, bilgi içeriği `role="status"` taşıyan metin özetlerinde (uç nokta, manipülabilite, eşik üstü hücre sayısı, toplanan nokta sayısı, engel sayısı) |
| **Klavye odağı bazı zeminlerde kayboluyordu** | docs/07: "outline kaldırılmaz, yeniden tasarlanır" | `app/globals.css`'e tek, tutarlı bir `:focus-visible` halkası |
| **`favicon.ico` 404** | Konsol hatası, "best practices" puanını düşürüyordu | `app/icon.svg` — docs/07'deki iz çizgisi motifi |

`IkTarget`'ta ayrıca "kırmızı nokta erişim alanının dışında" ifadesi
renkten bağımsız hale getirildi.

### 4. Performans denetimi — kısmen hedefte

Ölçüm: `npx serve out` + `npx lighthouse --form-factor=mobile` (4× CPU
kısıtlamalı emülasyon).

| Sayfa | Perf | Erişilebilirlik | FCP | TTI | TBT | CLS |
|---|---|---|---|---|---|---|
| Ana sayfa | 98 | 100 | 0,8 sn | 2,4 sn | 120 ms | 0 |
| `/ara` | 98 | 100 | 0,8 sn | 2,4 sn | 60 ms | 0 |
| `/sozluk` | 99 | 100 | 0,8 sn | 2,3 sn | 120 ms | 0 |
| Ders — 3D **yok** (`h-lise-acil-durdurma`) | 98 | 100 | 0,8 sn | 2,4 sn | 100 ms | 0 |
| Ders — 3D **var** (`b-lise-ileri-kinematik`) | **73** | 100 | 0,8 sn | 4,8 sn | 1300 ms | 0 |

İlk yükleme JS bütçesi (docs/05: < 200 KB gzip):

| Sayfa | Önce | Sonra |
|---|---|---|
| Ana sayfa / ara / sözlük / seviye | 184-186 KB | değişmedi (bütçe içinde) |
| 3D'li ders sayfası | **434 KB** | **197 KB** |

Yapılan üç düzeltme:

1. **3D sahneler `next/dynamic` ile ayrı parçaya alındı** (`ssr: false`).
   Önceden `three` + `@react-three/fiber` + `drei` doğrudan import ediliyordu
   ve ders sayfasının İLK paketine giriyordu. Tek başına bu, 434 → 197 KB.
2. **`SahneAlani` bileşeni** — sahne, görünür alana yaklaşana kadar hiç
   bağlanmıyor (`IntersectionObserver`, 300 px pay). Ekranda olmayan
   sahneler artık hiç kurulmuyor. Aynı bileşen sahneyi ekran okuyucudan da
   gizliyor, iki iş tek yerde.
3. **Tembel parça tekilleştirildi.** Her sahne kendi dosyasından ayrı ayrı
   dynamic-import edilince derleyici `three`'yi her parçaya kopyalıyordu —
   ölçüldü: iki ayrı parçada birebir aynı 900 KB'lık gövde. `scenes.ts` tek
   giriş noktası yapılıp üç `dynamic()` çağrısı da oraya bağlandı; artık tek
   bir 236 KB'lık parça var. İki farklı sahne kullanan ders sayfaları bunu
   iki kez indirip iki kez çalıştırmıyor.

**Açık kalan madde — 3D'li ders sayfaları hedefin altında.** Kök neden
ölçüldü, tahmin değil: sahne parçasının ÇALIŞTIRILMASI (indirilmesi veya
ayrıştırılması değil) emüle mobil CPU'da ~1,2 sn ana thread tutuyor
(`bootup-time`: scripting 1183 ms, parse 108 ms). Bu, three.js'in kendi
modül başlatması ve WebGL bağlamının kurulmasıdır.

Denenmeyen tek seçenek `drei`'yi tamamen çıkarıp `Grid`/`Line`/`Cylinder`/
`Sphere` yerine three'nin çıplak ilkellerini kullanmak. **Bilinçli olarak
yapılmadı:** `drei`'nin `Line`'ı kalınlık verebilen tek yol (WebGL'in kendi
çizgisi 1 piksel), ve iz çizgisi docs/07'de projenin imza öğesi. Onu
hairline'a düşürmek ölçülebilir bir puan için görünür bir kalite kaybı
olurdu. Bu karar bakımcıya ait; cila fazının doğal maddesi.

Not: FCP (0,8 sn) ve CLS (0) hedefleri 3D'li sayfalarda da karşılanıyor —
sayfa hızlı boyanıyor, kayma yok; sorun yalnızca etkileşime hazır olma
süresi.

**Yanlış alarm:** `serve` ile yerelde koşarken konsolda RSC `.txt` 404'leri
görünüyor (`__next.ders.$d$slug.txt`). Dosyalar aslında `out/` altında
üretilmiş; `serve`, yoldaki `$` karakterini çözemiyor. Vercel'de böyle bir
sorun yok — yerel statik sunucu artefaktı, kodda düzeltilecek bir şey değil.

### 5. Katkı süreci resmileştirildi

- `CONTRIBUTING.md` — katkı türleri, yerel kurulum, çalıştırılacak
  kontroller, ders katkısının üç kapısı (kaynak / sayısal doğruluk / insan
  gözden geçirmesi), kod PR kontrol listesi (`docs/08`'den), dal ve merge
  kuralı, ilk PR'da CI'nin neden bakımcı onayı istediği.
- `SECURITY.md` — açık bildirimi GitHub'ın özel danışma kanalından (issue
  ile DEĞİL), kapsam içi/dışı ayrımı. Kapsam dışı listesi bilinçli olarak
  gerekçeli: kişisel veri sızıntısı senaryosu yok çünkü **hiç kişisel veri
  toplanmıyor**. Kapsam içine sıra dışı bir madde eklendi: ders içeriğinde
  yanlış güvenlik bilgisi de güvenlik bildirimi sayılıyor (Hat H'de
  yanlış anlatılmış bir standart gerçek dünyada zarar üretebilir).
- `.github/pull_request_template.md` — tür seçimi, altı kontrol komutu,
  içerik ve kod için ayrı kontrol listeleri.

### 6. Yapılmayan iki şey — bakımcı kararı bekliyor

- **`LICENSE` dosyası yok.** `docs/06` "MIT veya benzeri açık lisans" diyor
  ama kesinleştirmiyor. Eğitim içeriği olan bir projede kod (MIT) ile ders
  metinlerinin (ör. CC BY-SA) farklı lisanslanması yaygın ve sonuçları
  gerçekten farklı — bu yüzden kendi başıma seçilmedi. `CONTRIBUTING.md`
  açık kaynak olmaya atıf yapıyor; lisans dosyası eklenene kadar bu eksik.
- **`README.md` yok.** Katkı süreci resmileşti ama depoya ilk bakan kişi
  için bir giriş metni hâlâ yok. İstenen listede değildi, kapsam dışı
  bırakıldı.

### Doğrulama

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (**86/86** — arama ile
10 test eklendi), `npx tsx scripts/check-content.ts` (89 ders),
`npm run validate-content-graph` (89 ders, döngü/eksik referans yok, 0
uyarı), `npm run build` (**97 sayfa**) — hepsi temiz.

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Hat H'nin 10 dersi `durum: taslak` kalmaya devam ediyor. Güvenlik hattı
için insan gözden geçirmesi diğer hatlardan daha kritik: Faz 5 ara
kaydındaki "doğrulanamayanlar" listesindeki her madde standardın kendisi
alınarak kontrol edilmeli.

---

## Hat D/E/F/G taslak derslerinin kalite denetimi (2026-08-05)

Hat H dışında yayına alınmamış **40 taslak dersin tamamı** beş maddelik bir
kontrol listesiyle denetlendi. Amaç bilinçli olarak dar tutuldu: **ölç, sonra
yalnızca gerçekten eksik olana dokun.** Geçen derse dokunulmadı — çalışan
içeriği değiştirmek kalite değil risktir.

### Yöntem

Kontrol listesi (docs/04-icerik-rehberi.md'den türetildi):

| | Ölçüt |
|---|---|
| M1 | 6 bölüm tam mı (kanca / sahne / açıklama / gerçek dünya / dene / sonraki) |
| M2 | Seviye kalibrasyonu (ortaokul formülsüz · lise formül var türetme yok · üniversite türetme + sınırlar + gerçek koda link) |
| M3 | Kazanımlar net ve derste gerçekten karşılanıyor mu |
| M4 | Alıştırma dersteki sahneyle çözülebiliyor mu, ezber sormuyor mu |
| M5 | Kaynak var mı ve konuya gerçekten bağlı mı |

8 `kalite-denetci` çalıştırması, **2'şerli gruplar hâlinde sırayla** (oturum
limitini tek seferde tüketmemek için). Denetçilere açıkça "varsayılan sonuç
GEÇTİ, bulgu icat etme, cila önerisi yazma" talimatı verildi.

Denetim öncesi mekanik bir yapı taraması yapıldı (bölüm varlığı, sahne, Quiz,
kaynak sayısı, kod linki) — denetçi raporlarını çapraz kontrol etmek için.
Bu tarama iki bulguyu bağımsız olarak doğruladı (offline-programlama'da eksik
bölüm, 5 derste sahne yokluğu).

Denetçilerin kritik iddiaları elle yeniden doğrulandı: `blockProgram.ts:35`
(mutlak atama), `BlockEditor.tsx:305` (tekrar 20'ye kırpılı),
`CodeRunner.tsx:104` (yalnızca son duruş), KRL'de tam durmanın varsayılan
olması (bağımsız kaynak), OSHA'nın SMS tanımı (WebFetch ile birebir),
tarama yolu satır aritmetiği (elle).

### Sonuç: 40 ders → 12 GEÇTİ (dokunulmadı), 28 DÜZELTİLDİ

Hiçbir ders yeniden yazılmadı; her düzeltme yalnızca eksik çıkan maddeye
dokundu. 50 ders `durum: taslak` olarak kaldı — insan onayı ayrı adım.

**Dokunulmayan 12 ders:** `d-lise-hareket-komutlari`,
`d-lise-koordinat-hiz-bekleme`, `e-universite-tcpip-soket`,
`e-universite-cycle-time-jitter`, `e-universite-plc-master-slave`,
`f-ortaokul-goz-olmadan-is-yapmak`, `f-lise-piksel-milimetre`,
`f-lise-esikleme-nesne-bulma`, `f-universite-kamera-kalibrasyonu`,
`f-universite-lazer-profil-sensoru`, `g-ortaokul-simulasyon-nedir`,
`g-universite-dijital-ikiz`.

### En ciddi beş bulgu

1. **`f-universite-tarama-yolu-uretimi` — aritmetik hata.** Kapsama
   `W + (n−1)·s` olduğu hâlde ders `H/s` ile hesaplıyordu: "100/16 = 6,25 →
   7 satır, %40 artış". Doğrusu `n = ceil((H−W)/s) + 1 = 6` satır ve %20
   artış (kapsama 20 + 5·16 = tam 100 mm). Formül, örnek ve yüzde düzeltildi.
2. **`e-universite-hata-durumlari` — standart yanlış atfedilmiş.** OSHA'nın
   "safety-rated monitored stop" tanımı derste "bir arıza durumunda
   tetiklenen" deniyordu; kaynağın tanımı **korunan alana giriş
   algılandığında** etkinleşen duruş. "Category 2 Stop" nitelemesi de
   ANSI/RIA R15.06-2012 + ISO 10218-2:2011'e değil **NFPA 79-2017**'ye ait.
   Metin, `kaynaklar` satırı ve Quiz açıklaması hizalandı; haberleşme
   kopması için ayrı ve doğru bir çerçeve (koruyucu duruş) kuruldu.
   Kaynak metni WebFetch ile birebir doğrulanarak düzeltildi.
3. **`g-universite-pybullet-sahne-fizik` — kendi deposuyla çelişiyordu.**
   "reference-python'da gerçek fizik motoru bu kontrolü doğrulamak için
   kullanılıyor" ve "yolu tam fizik motoruyla doğruluyor" deniyordu;
   `reference-python/docs/architecture.md` tersini söylüyor (PyBullet yalnızca
   görselleştirme, çarpışma kararı bağımsız geometrik test). Ayrıca
   `setGravity` bir **ivme** vektörüdür, ders "kuvvet vektörü" diyordu.
4. **`d-universite-kuka-krl` — `FINE` KRL anahtar sözcüğü değil.** Ders
   `PTP P1 VEL=100% FINE` yazıyor ve `FINE`'ı bir KRL komutu gibi
   anlatıyordu. KRL'de **tam durma varsayılandır**; adı olan şey
   yaklaşmadır (`CONT`, genişliği `$APO` ile). Bu, aynı platformdaki FANUC
   dersiyle de çelişiyordu. Kod bloğu ve açıklama düzeltildi, iki dilin zıt
   varsayılanları açıkça anlatıldı.
5. **`e-lise-el-sikisma` + `e-lise-zamanlama-neden-onemli` — yanlış mimari.**
   `WaitDI diHazirim, 1;` PLC'ye atfedilmişti; RAPID ABB **robot
   kontrolörünün** dilidir, PLC RAPID çalıştırmaz. İki derste de talimatlar
   robot tarafına alındı ve PLC'nin kendi programı olduğu belirtildi.

### Diğer düzeltmeler (özet)

- **Sahnenin yapmadığı şeyi vaat eden metinler (7 ders).** En sık bulgu
  türü buydu: `d-ortaokul-sirali-tekrar-kosul` (mutlak atama yüzünden tek
  bloklu tekrar hiç hareket üretmiyor; ayrıca kanca "otuz kez" diyor ama
  bileşen 20'ye kırpıyor), `d-ortaokul-blok-komutlar` ("bloğu sil" —
  BlockEditor araya ekleme/silme desteklemiyor), `d-lise-python-komut-dizisi`
  (CodeRunner ara adımları oynatmıyor, yalnızca son duruşu çiziyor),
  `g-lise-basit-sahne-kurma` (engel ekleyince yol silinir, "Çalıştır"
  gerekir; "Engelleri temizle" masayı da siler), `f-lise-olcek-perspektif-hatasi`
  (bozulma sol üst köşede görünmüyor), `f-universite-el-goz-kalibrasyonu`
  (sahne kaymayı canlandırmıyor), `f-universite-tarama-yolu-uretimi`
  (satır arası boşluk çizilmiyor).
- **Kaynak uyumsuzlukları.** "Modern Robotics Bölüm 1" iki derste robot
  programlamaya kaynak gösterilmişti — o bölüm kitabın "Preview"ıdır ve
  konuyu hiç işlemez; ABB RAPID kılavuzuyla değiştirildi. Groover künyesi
  iki derste hatalıydı ("Digital Computers" → "Personal Computers"; bölüm
  numarası baskıya göre değiştiği için numara yerine bölüm başlığıyla
  atıf yapıldı). `g-universite-urdf-modelleme` kaynağı `urdf/XML/model`
  sayfasını gösteriyordu, iddiayı destekleyen sayfa `urdf/XML/joint`.
  `e-lise-dijital-giris-cikis`'te tarama döngüsü sayısı yalnızca
  Wikipedia'ya dayanıyordu (docs/04'ün kabul listesinde yok) — Groover'a
  taşındı.
- **Kaynaksız/abartılı iddialar.** `e-lise-zamanlama-neden-onemli`
  Therac-25'te "en az üç ölüm"ü tek bir yarış durumuna bağlıyordu; kayıtlar
  ölümleri birden fazla ayrı yazılım hatasına dağıtıyor — nedensel bağ
  daraltıldı. `d-universite-ros2-temelleri` kancası "iki kontrolör birbirine
  asla doğrudan bir cümle kuramaz" diyordu; platformun kendi Hat E dersleri
  bunun tersini öğretiyor (PROFINET/EtherNet-IP) — ifade program düzeyine
  sabitlendi, kaynaksız yaygınlık iddiası daraltıldı.
  `e-universite-endustriyel-protokoller`'deki "A/B sınıfı"/"C sınıfı" atfı
  kaynakta yoktu, kaldırıldı; protokol sayılarının koşullu olduğu eklendi.
- **Eksik üniversite derinliği.** `d-universite-abb-rapid` (`robconf`
  yalnızca ConfJ/ConfL açıkken bağlayıcı; `wobj` kalibrasyon hatası tüm
  hedefleri birlikte kaydırır), `d-universite-fanuc-karsilastirma` (teach
  pendant yaklaşımının sürüm kontrolü sınırı), `f-universite-el-goz-kalibrasyonu`
  (AX=XB'nin dejenere durumu), `f-universite-nokta-bulutu-yuzey-muayenesi`
  (ICP yerel arar, kötü başlangıç hizasında yanlış minimuma yakınsar),
  `g-universite-urdf-modelleme` (URDF bir ağaçtır, kapalı kinematik zincir
  doğrudan ifade edilemez) — hepsine sınır paragrafı eklendi.
- **Eksik bölüm.** `d-universite-offline-programlama`'da "Gerçek dünyada"
  bölümü hiç yoktu (yerindeki "Bu platformla bağlantısı" o işlevi
  karşılamıyordu, hiçbir OLP aracı adı geçmiyordu). RobotStudio/KUKA.Sim/
  ROBOGUIDE/RoboDK ve post-processor kavramıyla bölüm eklendi, kaynak
  eklendi.
- **Alıştırma sorunları.** `d-universite-mecademic-python`'da bir çeldirici
  ("Pyodide desteklemiyor") fiilen doğruydu, yani iki doğru cevap vardı —
  soru kökü niyete sabitlendi. `f-universite-olcum-belirsizligi-tekrarlanabilirlik`'in
  1. sorusu VIM tanımı ezberiydi — dersin kendi sayısal serisine bağlandı.
- **Eksik kod bağlantısı.** `g-universite-sim-to-real-farki` manipülabilite
  formülünü veriyordu ve karşılığı `computeJacobian`'da gerçekten var, ama
  "Kaynak kodu" satırı yoktu — eklendi. Hat G'nin diğer 7 bağlantısının
  hepsi (dosya + fonksiyon + satır no) doğrulandı, hatalı yok.
- **Çapraz referans hataları.** `f-universite-nokta-bulutu` "bir önceki
  derste görülen boustrophedon" diyordu, terim bir SONRAKİ derste
  tanımlanıyor. `g-lise-deneme-yanilma-maliyeti` Hat G üniversite
  derslerinin "ileride eklenecek" olduğunu söylüyordu, o dersler zaten var.

### Bilinçli olarak yapılmayan: sahne eksikliği (5 ders)

`d-universite-abb-rapid`, `d-universite-kuka-krl`,
`d-universite-fanuc-karsilastirma`, `d-universite-ros2-temelleri` ve
`e-universite-endustriyel-protokoller` derslerinde **hiç etkileşimli sahne
yok** (`etkilesimli: []`). Bu gerçek bir M1 eksiği ve docs/05'teki "önce
oyna" ilkesi bu beş derste hiç işlemiyor.

Bu turda **düzeltilmedi**: sahne eklemek bir etkileşim değişikliğidir ve
docs/03'e göre cila fazına ertelenmiş durumda. Beşinin de ayrıca içerik
bulgusu vardı, o bulgular düzeltildi. Cila fazında tutarlı bir grup olarak
ele alınmalı — yeni bileşen gerekmiyor, mevcut `CodeRunner`/`SignalTimeline`
yeterli.

### Sistemik bulgular (ders bazında düzeltilmedi, ayrı karar konusu)

1. **`aciklama` alanı ipucu yerine doğru cevabı tekrarlıyor.** docs/04
   "yanlış cevapta doğruyu söyleme, ipucu ver" diyor; `QuizSorusu.tsx` bu
   metni yalnızca YANLIŞ seçimde gösteriyor. Desen 89 dersin çoğunda var —
   Hat D/E/F/G'ye özgü değil, tek tek düzeltmek yerine bütün olarak karar
   verilmeli.
2. **Quiz soru sayısı çoğu derste 1**, docs/04 "2-4 soru" diyor. Yine proje
   geneli bir doküman-uygulama farkı.
3. **Üretici kaynaklarında doküman numarası/URL eksik** (KUKA KSS, FANUC TP).
   Bu turda **numara uydurulmadı** — doğrulanamayan künye yazmak projenin
   temel kuralını ihlal eder. Kılavuzlar kamuya kapalı olduğu için bu ancak
   elde nüsha olan biri tarafından kapatılabilir.
4. **Ders metninde okura `bkz. docs/...` iç referansı** — sitede `docs/`
   rotası yok, ölü bağlantı. 6 derste var.
5. **`docs/02-mimari.md` KaTeX'i yığında listeliyor ama kurulu değil.**
   Bu denetim sırasında fark edildi: `remark-math`/`rehype-katex` yok,
   `compileMDX` yalnızca `remarkGfm` kullanıyor. Dersler formülleri düz
   metin/kod bloğu olarak yazıyor ve bu çalışıyor — ama `$$...$$` yazan bir
   katkıcının formülü ham görünür. Ya KaTeX kurulmalı ya docs/02 düzeltilmeli.

### Doğrulama

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (86/86),
`npm run check-content` (89 ders), `npm run validate-content-graph`
(89 ders, 0 uyarı), `npm run build` — hepsi temiz. 50 ders `durum: taslak`
olarak korundu.

---

## Kalan P0 maddeleri — 3 bitti, 3 bekliyor (2026-08-07)

Bağımsız bir denetim oturumunun bulguları üzerine çalışıldı. **Not: o
oturumun raporu (`docs/10-harici-denetim-bulgulari.md`) bu depoda hiçbir
zaman bulunamadı** — çalışma ağacında, `origin/main`'de, hiçbir dalda, git
geçmişinde ve diskte yok. Maddeler kullanıcının sözlü listesinden alındı ve
**her iddia kabul edilmeden önce kodda bağımsız olarak doğrulandı.** Dördü
de gerçek çıktı; ayrıca doğrulama sırasında raporda olmayan iki hata daha
bulundu.

Dal: `p0-kalan-duzeltmeler`. Commit'ler: `e0cae97`, `18c39c7`.

### Biten 1 — Planlayıcı doğruluk hataları (`e0cae97`)

Dört iddianın dördü de kodda doğrulandı ve düzeltildi. Python referansında
da **aynı** hatalar vardı; TS'i tek başına düzeltmek fixture'ı bozacağı için
her iki taraf birlikte düzeltilip fixture yeniden üretildi (docs/02'nin
"Python doğruluk kaynağıdır" ilkesi korundu).

| Hata | Neydi | Düzeltme |
|---|---|---|
| RRT/RRT* son sıçrama | Hedefe `goalTolerance` kadar yaklaşan düğümden goal'e uzanan segment **hiç** kontrol edilmiyordu; engelin içinden geçen yol "başarılı" dönebiliyordu | `segmentFree` kontrolü eklendi (rrt.ts, rrtStar.ts, rrt.py) |
| A* köşe kesme | Çapraz hamlelerde yalnızca hedef hücrenin merkezi test ediliyordu; iki dolu hücrenin arasından geçen hamle engelin köşesini kesiyordu | `diagonalAllowed` / `_diagonal_allowed` (her iki dilde) |
| Z ekseni sızıntısı | `PlannerRace` üstten görünen 2B bir sahne ama planlayıcılar 3B arıyordu; yol kullanıcının göremediği z'den dolaşıp engeli "deliyordu" | `planar` seçeneği; PlannerRace kullanıyor |
| SafetyZone monoton olmayan hız | `durum === "dur" ? 0 : Math.min(robotSpeed, izinliHiz)` — `durum` komut hızına bağlı `required`'a baktığı için, komut hızı izinli hızı aşar aşmaz gösterilen değer kademeli düşmek yerine **sıfıra** düşüyordu. `Math.min` dalı matematiksel olarak hiç çalışmıyordu (durum "dur" olmasıyla `robotSpeed > izinliHiz` aynı koşul) | Gösterilen hız `min(komut, izinli)`; durum fiili sonuçtan türetiliyor |

**Test yazarken çıkan iki ek hata:**

1. **Segment örnekleme yukarı değil aşağı yuvarlıyordu.** `Math.round` /
   Python `int()` kullanılıyordu; fiili adım ilan edilen çözünürlükten kaba
   oluyor, ince engeller örnekler arasına sığıyordu. `ceil`e çevrildi
   (collision.ts, rrt.ts, rrt.py).
2. **A* yalnızca hücre merkezlerini test ediyordu**; ayrıca yol tam
   `start`/`goal` ile kapandığı için iki bağlantı segmenti ızgarada hiç yer
   almıyor ve hiç kontrol edilmiyordu. Kenar ve bağlantı segment kontrolü
   eklendi (her iki dilde).

**Fixture yeniden üretildi** ve bu, hataların yük taşıdığını kanıtladı: köşe
kesme fiilen oluşuyormuş (küre vakası 39 → 76 düğüm, kutu vakası 93 → 183;
yollar da uzadı çünkü artık köşeden sızmıyorlar).

**Test metodolojisi hakkında bir not — bu kayda değer.** İlk yazdığım
"dönen her yol çarpışmasızdır" değişmez testi **sabotajı yakalamadı**: üç
düzeltmeyi tek tek geri aldım, testler geçmeye devam etti. Sahneler yeterince
zorlayıcı değildi. Testler davranışsal biçime çevrildi (köşegen duvarı
geçebiliyor mu, kapalı duvarın içinden atlıyor mu) ve sabotaj tekrarlandı:
sırasıyla 6, 4 ve 4 test kırıldı. Hiç kırılmayan bir test, test değildir.

Ayrıca: örnekleme adımından **kısa** bir köşe yalaması, örneklemeye dayalı
her çarpışma kontrolünün yapısal sınırı — denetimi planlayıcıdan daha ince
yaparsak test tanım gereği tatmin edilemez hale gelir. Bu sınır gizlenmedi,
`yol-gecerliligi.test.ts` sonunda ayrı bir testle kayda geçirildi. Gerçek
çözümü engelleri güvenlik payıyla şişirmek (obstacle inflation); bu
`CollisionChecker` sözleşmesini değiştirdiği için docs/02 güncellenmeden
yapılmamalı.

Yan düzeltme: `eslint.config.mjs`'e `.codex-worktree-*/**` hariç tutma
eklendi — başka bir worktree'nin derleme çıktısı lint ediliyor ve 65 alakasız
hata üretiyordu.

### Biten 2 — Quiz şık konumu yanlılığı (`18c39c7`)

**Ölçüldü: 139 sorunun %89,2'sinde doğru cevap 1. index'teydi.** Soruyu
okumadan hep aynı şıkkı seçen bir öğrenci ~%89 doğru yapıyordu — alıştırmaların
ölçme değeri fiilen sıfırdı.

- `lib/quiz.ts` — sorunun kendi metninden türetilen **kararlı** karıştırma
  (FNV-1a → mulberry32 → Fisher-Yates). Kararlı olması şart: statik dışa
  aktarımda sunucu ve istemci aynı sırayı üretmeli (hidrasyon), ve kullanıcı
  sayfayı yenileyince şıklar yer değiştirmemeli.
- `QuizSorusu` bunu kullanıyor; doğru cevabın index'i karıştırma sonrasına
  göre hesaplanıyor.
- `scripts/check-quiz-dagilimi.ts` + CI — **öğrencinin gördüğü** dağılımı
  ölçer (yazılıyı değil), tek konum %50'yi aşarsa kırılır. Bu seçim bilinçli:
  aynı kontrol hem yanlılığı hem de karıştırmanın kaldırılmasını yakalar.

Sonuç: **%89,2 → %36,7** (3 şık için ideal ~%33).

Yazarların 139 soruyu elle dağıtması tercih edilmedi: tek seferlik ve kırılgan
olurdu, sonraki her yeni soruda aynı eğilim geri gelirdi.

### Biten 3 — MDX güvenlik açığı: AST allowlist (`18c39c7`)

`app/ders/[slug]/page.tsx` MDX'i `blockJS: false` ile derliyor. Bu ayar
bilinçli ve gerekli (`Quiz`'in `sorular={[...]}` prop'u için), ama açtığı
boşluk şuydu: bir ders dosyası MDX içinde **istediği JS'i** çalıştırabilirdi —
`{fetch(...)}`, `{process.env.X}`, `<script>`. docs/08 bu riskin dış katkı
başlamadan kapatılmasını zaten istiyordu.

`lib/mdxGuvenlik.ts` — AST düzeyinde allowlist:

1. JSX yalnızca izinli bileşenler (+ dar bir güvenli HTML kümesi).
2. Gövdede serbest `{ifade}` yasak.
3. `import`/`export` yasak.
4. Prop ifadeleri **yalnızca saf veri**: dizi, obje, literal, yerleştirmesiz
   şablon dizesi. Fonksiyon çağrısı, değişken, üye erişimi, yayılım prop'u
   reddedilir.

Yerleştirmesiz şablon dizesi bilinçli olarak serbest: `CodeRunner
initialCode` çok satırlı Python'u böyle taşıyor ve o düz metin. İçinde
`${...}` varsa reddediliyor.

`lib/izinliBilesenler.ts` tek kaynak; `components/interactive/index.ts`
`satisfies` ile ona bağlı — bir bileşen eklenip listeye yazılmazsa (veya
tersi) **derleme kırılıyor**, yani denetim sessizce eskiyemiyor. Bu bağın
çalıştığı, listeden bir ad çıkarılarak doğrulandı (hem tsc hata verdi hem
denetleyici o bileşeni kullanan 5 dersi işaretledi).

13 test: 8 saldırı denemesi reddediliyor, 5 meşru içerik geçiyor.
`scripts/check-mdx-guvenlik.ts` + CI.

`unified` / `remark-parse` / `remark-mdx` / `unist-util-visit` örtük
bağımlılıktı (`next-mdx-remote` ile geliyorlardı); açıkça
`devDependencies`'e yazıldı — ağaçta zaten vardılar, yeni tedarik zinciri
yüzeyi eklenmedi.

### Bekleyen 3 madde — YAPILMADI

Bu üçü bu turda **hiç ele alınmadı**, kapsam kullanıcı tarafından burada
kesildi:

1. **EK: Node sürüm uyuşmazlığı ve eksik site dosyaları.** CI Node 20
   kullanıyor (`.github/workflows/ci.yml`), yerel geliştirme de öyle, ama
   `package.json`'da `engines` alanı yok — sürüm hiçbir yerde
   sabitlenmemiş. Ayrıca `robots.txt`, `sitemap.xml` ve `manifest.json`
   yok. Bunlardan ilk ikisi SEO açısından önemli (docs/00: "Türkçe
   aramalarda bulunmak gerek") ve **sitemap yazılırken taslak derslerin
   dışarıda bırakılması şart** — aksi hâlde az önce kapatılan P0-1 açığı
   sitemap üzerinden geri gelir.
2. **Doküman numarası doğrulanamayan kaynakların şeffaf işaretlenmesi.**
   KUKA KSS ve FANUC TP kılavuzları kamuya kapalı; künyelerinde doküman
   numarası yok. İstenen biçim: "kaynak: [üretici adı], doküman numarası
   doğrulanamadı" — uydurmadan ama şeffaf. Önceki turlarda numara
   **uydurulmadı** (projenin temel kuralı), ama eksiklik de okuyucuya
   söylenmiyor; yapılacak iş bu boşluğu görünür kılmak.
3. **KaTeX kararı.** `docs/02-mimari.md` KaTeX'i yığın tablosunda
   listeliyor ama paket kurulu değil ve `compileMDX` yalnızca `remarkGfm`
   kullanıyor. İçerik formülleri düz metin/kod bloğu olarak yazıyor ve bu
   çalışıyor. Karar verilecek: gerçekten matematik render'ı gerekiyor mu —
   gerekiyorsa kurulup bağlanacak, gerekmiyorsa docs/02'den referans
   kaldırılacak. (Bu, bir önceki turda Hat F dersine `$$...$$` yazıp ham
   göründüğünü fark ederek ortaya çıkmıştı.)

### Doğrulama (her iki commit sonrası, dal üzerinde)

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (**143/143**),
`npm run check-content` (89 ders), `npm run validate-content-graph`
(0 uyarı), `npm run check-quiz-dagilimi` (en yüksek konum %36,7),
`npm run check-mdx-guvenlik` (89 ders temiz), `npm run build` (taslak
sızıntı kontrolü dahil), `npm audit --audit-level=high` (0 zafiyet) —
hepsi temiz.

**Dal `main`'e merge EDİLMEDİ**, kullanıcı incelemesi bekliyor.

### Dal hakkında bir uyarı

`p0-kalan-duzeltmeler` dalı **yalnızca yukarıdaki P0 çalışmasını içermiyor.**
Çalışma sırasında dala başka bir oturumun commit'i de girdi:
`e4e30f5 "fix: address P1 mobile accessibility findings"` — P1 mobil
erişilebilirlik bulguları (dokunmatik hedefler, `touch-pan-y`, seviyeye göre
odak rengi, `PixelToWorld`/`CodeRunner` düzenlemeleri), ayrıca
`.github/CODEOWNERS`, `.github/dependabot.yml` ve `AGENTS.md`.

Bu commit bu turun kapsamında değildi ve incelenmedi. Dal merge edilmeden
önce onun da ayrıca gözden geçirilmesi gerekiyor — özellikle `AGENTS.md` ve
`.github/CODEOWNERS` yönetişim dosyası sayılır (docs/09 §7: kuralın kendisini
değiştiren dosyalar elle onay ister).

Yukarıdaki doğrulama sayıları **birleşik ağaç** üzerinde alındı, yani her iki
çalışma bir arada temiz geçiyor.

---

## Büyük entegrasyon turu (2026-08-07)

Dört ayrı oturumdan biriken paralel dallar tek turda `main`'e alındı ve
push edildi. Sıra bilinçliydi: önce doğruluk/güvenlik düzeltmeleri, sonra
erişilebilirlik, sonra mimari, en sonda altyapı.

### Ne girdi

| Sıra | Dal | main'deki merge | İçerik |
|---|---|---|---|
| 1 | `p0-kalan-duzeltmeler` | `b6a4859` | Planlayıcı doğruluk hataları (A\* köşe kesme + son segment, RRT/RRT\* z sızıntısı), quiz şık yanlılığı, MDX bileşen allowlist'i |
| 2 | `codex-p1-erisilebilirlik` | `5798631` | 44×44 dokunmatik hedefler, `lib/seviyeTheme.ts`, `PixelToWorld`/`SignalTimeline` erişilebilirliği, `docs/10`, governance dosyaları |
| 3 | `codex-buyuk-mimari-onerisi` | `4ce4c94` | Seviye→Hat→Ders, `EvidenceEvent` modeli, yeni ana sayfa, capstone |
| 4 | `codex-node-seo-kaynak` | `014de62` | Node 24 pin, `robots.ts`/`sitemap.ts`, taslak sızıntı korumasının sitemap'e genişletilmesi |

### Fork noktası tuzağı (iki kez çıktı)

3. ve 4. dallar, kendilerinden önceki merge'lerden **önce** dallanmıştı.
Bu yüzden `git diff main <dal>` çıktısı, o dalın hiç dokunmadığı dosyaları
**silinmiş** gösteriyordu — 3. dalda `docs/10-harici-denetim-bulgulari.md`,
4. dalda mimari işin tamamı (capstone, `lib/evidence.ts`, `HeroExperiment`…).

Düz diff'i uygulayan bir "temiz branch" çıkarma girişimi bu dosyaları
silerdi. Doğru yöntem her iki seferde de güncel `main`'den dallanıp 3'lü
birleştirme yapmaktı; çakışmayan taraf otomatik korunuyor.

**Kural:** paralel dalları birleştirirken `diff` değil `merge` kullan.
Diff yönü, "bu dal bunu sildi" ile "bu dal bunu hiç görmedi"yi ayırt etmez.

### Çakışma kararları (4. dal)

- **Node 24** alındı (`.nvmrc`, `package.json` engines). Dalın kasıtlı
  katkısı ve Node 20 artık EOL. **Açık uç:** geliştirme makinesi hâlâ
  `v20.19.4`; `engine-strict` tanımlı olmadığı için yerelde yalnızca
  uyarı üretir, CI `.nvmrc`'yi okuduğu için orada 24'e geçer.
- **`app/sitemap.ts`** — `main`'in sürümü korundu; hat sayfalarını,
  capstone'u ve `lastModified` alanını içeriyor, dalın sürümü bunları
  bilmiyordu.
- **`app/robots.ts`** — `main`'in `disallow` kuralları + dalın `SITE_URL`
  sabiti birleştirildi.
- **`public/manifest.json` kaldırıldı** — `app/manifest.ts` aynı işi
  yapıyor ve `check-release-output.ts` onu doğruluyor; iki manifest
  tutmak yerine üretilen tek kaynak bırakıldı.
- **`vitest.config.ts`'e `@` alias'ı eklendi** — dalın sitemap testi,
  `main`'in `@/lib/content` import'unu çözemediği için patlıyordu.
  Alias yoktu; Next tarafında çalışıyor, Vitest kendi çözümleyicisini
  kullanıyor.

### Düzeltilen iki bulgu (tarayıcıda gezerek)

- **Koyu panellerde beyaz-üstüne-beyaz metin.** `.lab-panel` katmansız düz
  CSS olduğu için Tailwind'in utility katmanını yeniyordu; `bg-slate-950
  text-white` yazan kartlarda zemin beyaz kalıyor, metin de beyaz olduğu
  için başlık tamamen görünmez oluyordu. Kural `@layer components` içine
  alındı. Ölçülen sonuç: zemin `rgb(2,6,24)`, başlık kontrastı **20.16:1**,
  gövde **13.56:1** ve **7.66:1** — docs/07'nin WCAG AA şartının üstünde.
- **Ders breadcrumb'ı** `Laboratuvar / lise / Hat` yazıyordu; mevcut
  `SEVIYE_ETIKET` ve `hatEtiket()` kullanılarak
  `Laboratuvar / Lise / Hareket ve kinematik` yapıldı.

### Yanlış alarm: "capstone sayfası donuyor"

Tarayıcı denetimi sırasında `/laboratuvar/robot-hucresi` sayfasının
donduğu raporlandı — ekran görüntüsü ve script enjeksiyonu 30 sn'de zaman
aşımına uğruyordu, temiz sekmede de tekrar üretildi. **Bu teşhis
yanlıştı.** Ölçüm şunu gösterdi:

```
{ gorunurluk: "hidden", fps: 0, kare: 0 }
```

Sekme görünür değildi. Chrome görünmeyen sekmede `requestAnimationFrame`'i
ve kompozisyonu durdurur; yeni kare üretilmediği için CDP'nin
`Page.captureScreenshot` çağrısı zaman aşımına uğrar. Aracın verdiği
"renderer may be frozen" mesajı yanıltıcı.

Sayfanın sağlıklı olduğunun kanıtı: aynı sekmede senkron JS anında
çalışıyor ve capstone uçtan uca oynandı — kalibrasyon, rota, komut sırası
ve güvenli hız doğrulandı, **4/4 kanıt · %100 · "Hücre devreye alındı"**.

**Not:** aynı sebeple 3D sahneli ders sayfasında `canvas: 0` çıktı, yani
three.js sahnesi hiç mount olmadı. **3D performansı bu turda ölçülemedi**;
docs/05'teki bilinen ödünleşim hakkında yeni veri yok.

### Doğrulama

Her merge'den sonra sekiz kapı ayrı ayrı koşuldu: `tsc --noEmit`, `lint`,
`test`, `check-content`, `validate-content-graph`, `check-quiz-dagilimi`,
`check-mdx-guvenlik`, `build`. Son durum: **13 test dosyası / 146 test**,
89 ders, 50 taslağın hiçbiri üretim çıktısında veya `sitemap.xml`'de yok.

### Açık uçlar

- `durum: yayinda` işaretlemesi ve `incelendi_tarafindan` doldurulması hâlâ
  elle ve insana ait (docs/06 Katman 3). Merge edilmiş olmak yayınlanmış
  demek değil.
- ~~Geliştirme makinesindeki Node sürümü (20.19.4) ile yeni pin (24)
  arasındaki fark kapatılmalı.~~ **Kapandı (2026-08-07):** makine
  `v24.19.0`'a çıkarıldı, sekiz kapı + `npm ci` + `npm audit` Node 24
  altında yeniden koşuldu, hepsi temiz.
- Dependabot ilk PR'larını açtı (P1'de gelen `dependabot.yml` devrede);
  docs/08 gereği otomatik merge kapalı, her biri insan onayı bekliyor.
- 3D sahneli sayfaların gerçek performans ölçümü yapılmadı.

### Kalıcı not: npm 11 postinstall script'lerini atlıyor

Node 24 / npm 11 geçişinde ortaya çıktı. `npm ci` artık bazı paketlerin
postinstall script'lerini **varsayılan olarak çalıştırmıyor**, sadece
uyarıyor:

```
npm warn allow-scripts   esbuild@0.28.1 (postinstall: node install.js)
npm warn allow-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review
```

Bu, tedarik zinciri açısından iyi bir varsayılan (docs/08 §1) — ama bu
projede bir bağımlılığı var: **`scripts/build-worker.mjs` esbuild'e
dayanıyor** ve worker'ları `public/workers/` altına önceden derliyor
(bkz. `docs/02-mimari.md`, "Worker nasıl derleniyor").

**npm'in bu davranışı sertleşirse (uyarı yerine script'i tamamen bloke
ederse) ilk kırılacak yer `scripts/build-worker.mjs`'dir — worker
chunk'larının boş çıkıp çıkmadığı düzenli kontrol edilmeli.**

Bu, teorik bir endişe değil: docs/02'de kayıtlı olduğu üzere Faz 2'de
tam olarak bu semptom yaşandı — derlenen worker chunk'ına gerçek kod hiç
girmiyordu, dosya vardı ama boştu ve statik export'ta worker isteği
sonsuza kadar "pending" kalıyordu. Boş bir worker dosyası build'i
kırmaz, sessizce çalışma zamanında kırılır; bu yüzden dosyanın *varlığı*
yeterli kanıt değildir.

Kontrol yöntemi (2026-08-07'de bu şekilde doğrulandı — `npm ci` sonrası
`public/workers/` silinip sıfırdan build alındı):

```bash
rm -rf public/workers && npm run build
ls -l public/workers/            # dosyalar var mı, boyut makul mü
grep -c "astar\|rrt" public/workers/planner-worker.js   # gerçek kod girmiş mi
```

O tarihteki sonuç: `planner-worker.js` 7,6 KB (`astar`/`rrt` kodu içinde),
`pyodide-worker.js` 20 KB, `npx esbuild --version` → 0.28.1. Yani atlanan
postinstall'a rağmen esbuild binary'si sağlamdı. Uyarı şu an zararsız,
ama kırılırsa sessiz kırılacağı için not düşüldü.

---

## Dependabot turu (2026-08-08)

`dependabot.yml` devreye girdikten sonraki ilk parti: **4 PR açıldı,
1'i merge edildi, 3'ü beklemede.**

### Merge edilen

| PR | Değişim | Tür | CI |
|---|---|---|---|
| #3 | `next` 16.2.12 → **16.3.0** | minor | yeşil |

Merge sonrası dokuz kapı yeniden koşuldu (tsc, lint, test 13/146,
check-content, graph, quiz-dağılımı, mdx-güvenlik, audit, soğuk build) —
hepsi temiz. `public/workers/` silinip yeniden üretildi, chunk'lar dolu.

### Beklemede (major — karar kullanıcıya ait)

| PR | Değişim | Neden riskli |
|---|---|---|
| #1 | `actions/checkout` 4.4.0 → **7.0.1** | Üç major atlıyor. Runner/Node tabanı ve varsayılan davranışlar (submodule, fetch-depth, credential persistence) major'lar arasında değişti. |
| #2 | `actions/setup-node` 4.4.0 → **7.0.0** | Üç major. Bu proje `node-version-file: .nvmrc` kullanıyor ve cache davranışı major'larda değişti — CI'ın Node 24'ü doğru seçtiği ayrıca doğrulanmalı. |
| #5 | dev-dependencies grubu, 5 paket | **CI kırmızı.** Grup iki major içeriyor: `eslint` 9.39.5 → **10.8.0** ve `typescript` 6.0.3 → **7.0.2**. Yanında patch'ler var (`@types/three`, `tsx`, `eslint-config-next`). |

#5 hakkında not: Dependabot patch'leri ve major'ları **tek PR'da
grupluyor**, bu yüzden zararsız `tsx` 4.23.1 → 4.23.5 yükseltmesi,
TypeScript 7 geçişine rehin kalmış durumda. Grubu bölmek isteniyorsa
`dependabot.yml`'deki `development-dependencies` grubuna
`update-types: ["minor", "patch"]` eklenebilir; major'lar o zaman ayrı
PR olarak gelir. Bu bir yönetişim dosyası değişikliği, ayrıca karar
verilmeli.

### Bu turda çıkan güvenlik açığı (dependabot'tan bağımsız)

Merge sonrası `npm audit` **1 high** verdi: `nanoid <3.3.17`
(GHSA-2v37-7h3g-55p8, "custom generators can loop indefinitely when size
is zero").

**Bunu #3 getirmedi.** `nanoid@3.3.16` merge öncesi `main`'de, merge
sonrasında ve dependabot dalında birebir aynıydı — advisory bu turdan
yaklaşık 40 dakika önce yayımlandı, yani `main` zaten etkilenmişti ama
henüz bilinmiyordu. Aynı gün 23:47'de alınan audit 0 zafiyet gösteriyordu.

Sebep: proje `overrides` ile `postcss`'i 8.5.25'e pinliyor, o sürüm
`nanoid ^3.3.16` istiyor. `postcss` 8.5.26 `nanoid ^3.3.17` istiyor.
Pin bir patch yukarı alındı (`package.json`'da iki yerde: `devDependencies`
ve `overrides`), `nanoid` 3.3.18'e çıktı, audit temizlendi.

Bu, CI'ın `npm audit --audit-level=high` adımını (`.github/workflows/ci.yml`
satır 62, docs/08 §1) kıracaktı. Ders: **bir PR'ın GitHub'daki yeşil
rozeti, bugün de yeşil olacağı anlamına gelmiyor** — audit sonucu kod
değişmeden, yeni advisory yayımlandıkça değişir.

### Dependabot turu — ikinci parti (2026-08-08)

İlk partide bekletilen üç PR ele alındı ve gruplama kuralı düzeltildi.
**Toplam: 4 merge, 0 beklemede, 2 major bilinçli ertelendi.**

| PR | Değişim | Sonuç |
|---|---|---|
| #2 | `actions/setup-node` v4 → **v7.0.0** | merge |
| #1 | `actions/checkout` v4 → **v7.0.1** | merge |
| #7 | dev-dependencies: `@types/three` 0.185.4, `eslint-config-next` 16.3.0, `tsx` 4.23.5 | merge |
| #5 | eski gruplama (5 paket, 2 major) | Dependabot kapattı, yerine #7 geldi |

**Ertelendi (ayrı değerlendirilecek):** `eslint` 9.39.5 → 10.8.0 ve
`typescript` 6.0.3 → 7.0.2.

### Gruplama düzeltmesi

`dependabot.yml`'deki iki gruba `update-types: [minor, patch]` eklendi.
Öncesinde Dependabot patch'leri ve major'ları tek PR'da birleştiriyordu:
zararsız `tsx` 4.23.1 → 4.23.5 yükseltmesi, aynı PR'daki TypeScript 6 → 7
geçişine rehin kalmış ve PR bütünüyle bekletilmişti.

Sonuç doğrulandı: Dependabot #5'i kapatıp #7'yi açtı; yeni PR **yalnızca
3 minor/patch** içeriyor, iki major dışarıda kaldı. Kural işliyor.

### Node 24 doğrulaması — kalıcı bir CI adımına dönüştü

`setup-node` v7'nin `.nvmrc`'yi doğru okuduğunu kanıtlamak gerekiyordu.
Actions log'larını indirmek depo admin yetkisi ister (API `403`), o yüzden
log okumak yerine **CI'a kendi kendini doğrulayan bir adım** eklendi:

```yaml
- name: Node sürümü .nvmrc ile eşleşiyor mu
  run: |
    echo "Çalışan sürüm: $(node -v)"
    echo ".nvmrc: $(cat .nvmrc)"
    test "$(node -v | cut -d. -f1)" = "v$(tr -d '[:space:]' < .nvmrc)"
```

Bu, log satırı okumaktan daha güçlü bir kanıt: adım geçtiyse çalışan Node
major'ı `.nvmrc` ile aynıdır, geçmediyse CI kırmızıya döner. `44bf71a` ve
`5c5dd3a` koşularında adım **success** — yani CI gerçekten Node 24'te.

Kalıcı değeri: `package.json` `engines` alanı yalnızca uyarı üretir,
build'i kırmaz. `setup-node` sessizce runner varsayılanına düşerse (ör.
`node-version-file` okunamazsa) bunu yakalayacak başka bir kontrol yoktu.
Gelecekteki `setup-node` major yükseltmelerinde de sessiz regresyonu bu
adım yakalar.

### Not: PR'ın yeşil rozeti anlık bir ölçüm

`actions/checkout` PR'ı (#1) merge edildiğinde GitHub onu "merged" değil
"closed" olarak işaretledi — Dependabot aynı yükseltme için #6'yı da
açmıştı ve değişiklik `main`'e girince ikisini birden kapattı. Yükseltme
`main`'de mevcut (`ci.yml`'de v7.0.1 hash'i) ve CI 14 adımın tamamında
yeşil; PR'ın rozeti bu durumu tam yansıtmıyor.
