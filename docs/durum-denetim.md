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

### Yapılmayan adım — yine `durum: yayinda` işaretlemesi

Faz 1'deki gibi: bu tur da bir **yapay zeka** incelemesiydi (5 paralel
ajan + benim gözden geçirmem), `docs/06`'nın ısrar ettiği "insan gözden
geçirmesi" değil. 39 dersin 38'i hâlâ `durum: taslak` (`b-universite-ters-kinematik`
Faz 1'de zaten insan tarafından incelenip yayınlanmıştı). Hangi
derslerin okunup `yayinda` yapılacağına karar vermek kullanıcıya
(Mert) ait — bu doküman ve yukarıdaki bulgu tablosu o incelemeye
başlangıç noktası.
