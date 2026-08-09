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

**Katman 3 — İnsan gözden geçirmesi (zorunlu, elle).**
Bu en kritik katman ve atlanamaz: **her ders, yayınlanmadan önce en az bir
kişi tarafından, kaynaklarıyla karşılaştırılarak okunur.** Başlangıçta bu kişi
sensin. Bir dersi "yayinda" yapmadan önce:

1. Ders kaynaklarındaki orijinal metni/formülü aç
2. Derste yazılanla karşılaştır — sadece "kulağa doğru geliyor mu" değil,
   satır satır
3. Etkileşimli sahneyi kendin oyna, sayıların mantıklı çıktığını gör
4. Şüpheli bir nokta varsa yayınlama, önce netleştir

Bu üç saatlik bir angarya değil, 15-20 dakikalık bir kontrol — ama
atlanmaması gereken 15-20 dakika.

### Sürüme bağlı inceleme kaydı

Frontmatter'daki eski alanlar geçmiş kayıt olarak okunur:

```yaml
incelendi_tarafindan: ""   # kim gözden geçirdi, ne zaman
incelendi_tarih: ""
```

Ancak bu iki alan güncel içeriğe bağlı değildir. Yeni yayınlarda doğrulama,
`content/review-receipts.json` içindeki Review Receipt v1 kaydıyla yapılır.
Makbuz; kanonik ders artifact SHA-256 hash'ini, tam kaynak commit'ini, inceleyen
kişiyi, tarihi ve kapsamları (`source`, `technical`, `pedagogical`, gerektiğinde
`safety`) taşır. Ders içeriği değiştiğinde hash değişir; eski makbuz güncel
inceleme olarak gösterilmez. İnsan doğrulaması yapılmadıysa makbuz yazılmaz.

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

Yeni yayın için ayrıca güncel artifact hash'iyle eşleşen Review Receipt v1
zorunludur. Mevcut 39 yayının borç kaydı dondurulmuştur; yeni bir ders bu
legacy listeye eklenemez. GitHub branch protection ise repo içinden
doğrulanamaz; CI zorunluluğu ve koruma kuralı barındırma ayarlarında ayrıca
insan tarafından etkinleştirilmelidir.
