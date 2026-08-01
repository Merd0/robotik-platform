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
