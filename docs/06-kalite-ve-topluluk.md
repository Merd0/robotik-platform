# Kalite güvencesi ve topluluk

Bu doküman şu sözü teknik bir sisteme bağlar: **bu platform gerçek katma değer
taşıyacak, dümenden olmayacak.** Türkçe kaynak bolluğu değil, Türkçe kaynak
*kalitesi* eksik olan bir alanda çalışıyoruz. Nicelik kaliteyi ezerse, bu
proje var olan yüzeysel Türkçe kaynaklardan farksızlaşır.

---

## 1. İçerik nasıl güvence altına alınır

Dersler büyük ölçüde yapay zeka yardımıyla (bu konuşmada olduğu gibi) yazılacak.
Bu hız kazandırır ama tek başına **doğruluk kanıtı değildir.** Bir formülün
yanlış yazılması, bir öğrencinin yanlış öğrenmesi demektir — ve bu tam
"katma değer" iddiasının tersi olur.

### Üç katmanlı doğrulama

**Katman 1 — Sayısal doğrulama (otomatik).**
Her matematik/fizik iddiası (FK, IK, Jacobian, planlama) `reference-python/`
içindeki bilinen doğru sonuçlara karşı test edilir (bkz. `02-mimari.md`
"Doğrulama stratejisi"). Bu, "kod doğru çalışıyor mu" sorusunu cevaplar.
Ama "doğru açıklanmış mı" sorusunu cevaplamaz.

**Katman 2 — Kaynak doğrulama (zorunlu, otomatik kontrol).**
Her dersin `kaynaklar` alanı dolu olmalı (bkz. `04-icerik-rehberi.md`).
Bir iddia, ders kitabı/standart/üretici dokümantasyonu gibi doğrulanabilir bir
kaynağa dayanmıyorsa yazılmaz. Bu, "iddia havada mı, yerde mi" sorusunu
cevaplar.

**Katman 3 — İnsan gözden geçirmesi (opsiyonel).**

**Karar (2026-08-10, bakımcı — kalıcı):** insan gözden geçirmesi artık yayın
için zorunlu değil. Hat H (güvenlik) dahil, istisna yok. Bir ders,
`kaynaklar` alanı dolu olduğu sürece insan okuması olmadan `durum: yayinda`
yapılabilir. Hook, CI ve arayüz bu karara göre hizalandı.

İnceleme aracı (`npm run review`, aşağıda) kaldırılmadı; isteyen kullanır,
kayıt sürüme bağlı ve doğrulanabilir kalır. Zorunlu olan tek şey artık
otomatik kontrollerdir.

Bir dersi elle okumayı seçtiğinde izlenecek adımlar aynı kalıyor:

1. Ders kaynaklarındaki orijinal metni/formülü aç
2. Derste yazılanla karşılaştır — sadece "kulağa doğru geliyor mu" değil,
   satır satır
3. Etkileşimli sahneyi kendin oyna, sayıların mantıklı çıktığını gör
4. Şüpheli bir nokta varsa düzelt

### Bu kararın kapsamı — dürüst kayıt

Bu belge yukarıda üç katmanlı bir doğrulama tarif ediyor. Katman 3 opsiyonele
döndüğünde geriye kalan iki katmanın **ne kontrol ettiği ile ne kontrol
etmediği** karıştırılmamalı:

| Katman | Gerçekte doğruladığı | Doğrulamadığı |
|---|---|---|
| 1 — sayısal | `lib/robotics/` matematiği, fixture'lara karşı | Ders metnindeki iddiaları; fixture'a bağlı olmayan hatları (D, E, F, G, H) |
| 2 — kaynak | `kaynaklar` alanının **dolu ve biçimsel olarak geçerli** olduğunu | Derste yazılanın o kaynakta yazanla uyuşup uyuşmadığını |
| 3 — insan | (opsiyonel) İddia ile kaynağın karşılaştırılmasını | — |

Yani Katman 3 zorunlu olmaktan çıkınca, **metnin doğru olup olmadığını
denetleyen otomatik bir katman yoktur.** Katman 1 ve 2 bu boşluğu kapatmaz;
kapsamları farklıdır. Bu bir eleştiri değil, kararın ne anlama geldiğinin
kaydıdır — ileride "bunu bilmiyorduk" denmemesi için burada duruyor.

Pratik sonucu: sitedeki içeriğin doğruluğu, üreten modelin doğruluğu kadardır.
Bir hata bildirimi geldiğinde savunma "inceledik" değil, "düzeltiriz" olur;
bu yüzden düzeltme yolunun (issue → PR → yayın) açık ve hızlı kalması, eskiden
inceleme kapısının taşıdığı yükü artık tek başına taşıyor.

### Sürüme bağlı inceleme kaydı

Frontmatter'daki eski alanlar geçmiş kayıt olarak okunur:

```yaml
incelendi_tarafindan: ""   # kim gözden geçirdi, ne zaman
incelendi_tarih: ""
```

Ancak bu iki alan güncel içeriğe bağlı değildir. Yeni yayınlarda doğrulama,
`content/review-receipts.json` içindeki Review Receipt v2 kaydıyla yapılır.
Her makbuz tek kapsam (`source`, `technical`, `pedagogical`, gerektiğinde
`safety`), tek karar ve tek inceleyen taşır; dersin ilgili sürüm köküne
(`sourceHash` / `teachingHash`, bkz. `02-mimari.md`) ve gerçek bir kaynak
commit'ine bağlanır. İlgili kök değiştiğinde o kapsam eskir; eski makbuz güncel
inceleme olarak gösterilmez. İnsan doğrulaması yapılmadıysa makbuz yazılmaz.

Legacy alanların zorunluluğu artık yalnız dondurulmuş 39 derslik borç
baseline'ı için geçerlidir. Bir yayının insan incelemesinden geçtiğini
gösterebilen tek kayıt makbuzdur — ama **makbuz artık yayın şartı değildir**
(yukarıdaki 2026-08-10 kararı). Makbuzun yokluğu "inceleme bekliyor" değil,
"bu ders elle okunmadı" demektir.

### İnceleme akışı: `npm run review`

İnceleme sırası ve kaydı elle tutulmaz:

```bash
npm run review kuyruk                 # risk sırasıyla ne incelenmeli
npm run review goster <ders-id>       # tek ekranda inceleme malzemesi
npm run review onayla <ders-id> --kapsam hepsi --kim "Ad Soyad" [--yayinla]
```

`kuyruk`, açık kayıtları yayında olma, içerik değişimi, güvenlik hattı, ön
koşul merkeziliği, düz metin kaynak ve kaynak tazeliği sinyallerinden bir risk
puanıyla sıralar. `goster`, kaynakları, kazanımları, kapsam durumunu ve sürüm
köklerini tek çıktıda toplar — Katman 3 okuması bunun üstünde yapılır.
`onayla`, insanın verdiği kararı kapsam makbuzlarına yazar, gerekiyorsa dersi
yayına alır ve borç kaydını düşürür.

Bu araç **inceleme yapmaz**. Otomasyon neyin okunacağını küçültür ve kararı
doğrulanabilir biçimde kaydeder; okumayı ve kararı insan verir. Örnekleme veya
otomatik denetim, okunmamış bir dersi "insan onaylı" yapmaz.

### Yapay zekayla çalışırken dikkat noktaları

- Yapay zeka bir formülü **kendinden emin** yanlış yazabilir. "Kesin" ton,
  doğruluk kanıtı değildir.
- Yapay zekaya "şu kaynağa göre yaz" demek, "bunu yaz" demekten daha güvenlidir.
  Kaynak vermeden üretilen teknik içerik her zaman Katman 3'ten geçer.
- Sayısal örnekler (örnek açı değerleri, örnek sonuçlar) mutlaka kodla
  üretilsin, elle uydurulmasın — bu yüzden Katman 1 var.

---

## 2. Topluluğa açıklık — sonraya bırakılan bir özellik değil, kuruluş ilkesi

`03-yol-haritasi.md` Faz 5'te "katkı rehberi" son sıraya yazılmıştı. Bu
yanlıştı — dokümanı burada düzeltiyoruz. **Açık kaynak olmak, projenin en
başından itibaren bir tasarım kısıtıdır,** sonradan eklenen bir özellik değil.

### Bunun pratik anlamı

- Repo en baştan açık (GitHub, MIT veya benzeri açık lisans). "Bir gün açık
  kaynak yaparız" değil, ilk commit'ten itibaren açık.
- `04-icerik-rehberi.md` zaten "başkası nasıl ders yazar" sorusuna cevap
  verecek şekilde yazıldı — bu doküman aynı zamanda dış katkıya davettir.
- Yeni bir konu hattı, yeni bir robot tanımı, yeni bir dil çevirisi —
  hepsi PR (pull request) ile gelebilir. Kalite kapısı (3 katman) dış
  katkıda da aynı şekilde işler, ayrıcalık tanımaz.
- İlk aşamada (Faz 0-2) katkı süreci resmi değil — sen ve ben. Ama kod ve
  içerik yapısı en baştan "başkası da katkı yapabilir" varsayımıyla kurulur:
  net dosya yapısı, açık şablon, yazılı kurallar.

### Neden bu önemli

Senin cümlen "kendimiz üreteceğimiz, onlar da faydalanacağı" değil,
"kendimiz üreteceğimiz, onlarında faydalanacağı" — yani hem sen üret hem
onlar faydalansın, hem de zamanla onlar da üretsin, sen de faydalan. Bu,
projenin tek kişilik bir angarya olmaktan çıkıp gerçek bir topluluk kaynağına
dönüşmesinin yoludur. Türkiye'de bunu yapan bir robotik kaynağı yok — bu
senin gerçek özgünlüğün, sadece "interaktif ve Türkçe olması" değil.

---

## 3. Özgünlük testi

Her büyük karar öncesi kendine şunu sor, dürüst cevap ver:

> Bunu sadece var olan İngilizce bir kaynağı çevirerek mi yapıyoruz, yoksa
> gerçekten bir şey mi katıyoruz?

Katma değer somut olarak şunlardan gelir:

- **Türkçe teknik dilin kendisi** — "ters kinematik", "tekillik", "el-göz
  kalibrasyonu" gibi terimlerin doğru, tutarlı, öğretici Türkçesi şu an
  dağınık; bunu bir araya getirmek başlı başına değerli.
- **Endüstriyel gerçeklik bağlantısı** — ABB, Mecademic, Keyence gibi gerçek
  markaların kamuya açık üretici dokümanlarıyla bağ kurmak, akademik derslerin
  çoğunda yok. Kişisel işyeri veya staj bilgisi kaynak değildir.
- **Seviye kademelemesi** — ortaokuldan mühendise aynı platformda, aynı
  motor üstünde ilerleme; İngilizce kaynaklarda bile nadir.
- **Açıklık** — MIT/Stanford'ın kapalı ders materyalleri değil, herkesin
  katkı yapabildiği canlı bir kaynak.

Bunların hiçbiri "İngilizce videoyu çevir" ile elde edilmez. Şüphen varsa,
bu listeye dönüp bak.

---

## Frontmatter şemasına ek

`04-icerik-rehberi.md`'deki ders şablonu, kalite güvencesi alanlarıyla
güncellenir:

```yaml
---
id: ...
baslik: ...
hat: ...
seviye: ...
sure: ...
onkosul: [...]
kazanimlar: [...]
kaynaklar: [...]           # zorunlu, boş olamaz
incelendi_tarafindan: ""   # legacy kayıt; yeni onayın kanıtı değildir
incelendi_tarih: ""        # legacy kayıt
etkilesimli: [...]
durum: taslak
---
```

Yayın için zorunlu olan tek içerik şartı `kaynaklar` alanının dolu ve
yapılandırılmış olmasıdır. Review Receipt v2 opsiyoneldir; yazıldığında dersin
güncel sürüm kökleriyle eşleşmek zorundadır. Mevcut 39 yayının borç kaydı
`content/review-debt.json` içindeki `baselineIds` olarak dondurulmuştur ve
`scripts/check-review-debt.ts` içindeki tek sabit onu çıpalar; bu kayıt artık
bir kapı değil, tarihsel bir izdir. `check-review-debt` ve
`check-review-integrity` bilgilendiricidir (`REVIEW_STRICT=1` ile eski kapı
davranışına dönerler). GitHub branch protection ise repo içinden
doğrulanamaz; CI zorunluluğu ve koruma kuralı barındırma ayarlarında ayrıca
insan tarafından etkinleştirilmelidir.
