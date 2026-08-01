# Güvenlik sertleştirme

`05-deneyim-ve-guvenlik.md` Bölüm 2, temel güvenlik kararlarını (veri
toplamama, statik mimari, Pyodide izolasyonu) belirledi. Bu doküman onu
**derinleştirir** — özellikle açık kaynak + dış katkı modeliyle birlikte
ortaya çıkan riskleri kapatır.

## Tehdit modeli — gerçekçi kalalım

Statik bir site + veri toplamayan bir mimari zaten geleneksel web
saldırılarının çoğunu (SQL injection, oturum çalma, veri sızıntısı) devre dışı
bırakıyor, çünkü çalınacak bir sunucu tarafı veri yok. Gerçek risk alanı üçü:

1. **Tedarik zinciri** — bağımlılıklar veya build süreci üzerinden kötü kod
   sızması.
2. **Topluluk katkısı** — açık kaynak olduğu için dışarıdan gelen PR'ların
   kötü niyetli içerik/kod taşıma ihtimali.
3. **İstemci tarafı çalıştırma** — Pyodide ile kullanıcının kendi kodunu
   çalıştırması, ve MDX'in React bileşeni gömebilmesi.

Aşağıdaki önlemler bu üçüne göre sıralı.

---

## 1. Tedarik zinciri sertleştirme

- **Kilitli bağımlılıklar.** `package-lock.json` commit edilir, `npm ci`
  kullanılır (build sırasında sürüm kayması olmaz).
- **Otomatik zafiyet taraması.** CI her push'ta `npm audit --audit-level=high`
  çalıştırır; yüksek/kritik zafiyet varsa build kırılır.
- **Bağımlılık güncelleme botu** (Dependabot veya Renovate) açık, ama
  otomatik merge kapalı — her güncelleme insan onayından geçer.
- **Minimum bağımlılık ilkesi.** Yeni bir paket eklemeden önce "bunu 50
  satır kendimiz yazabilir miyiz" sorusu sorulur. Her bağımlılık, o paketin
  kendi tedarik zincirini de miras alır.
- **Alt kaynak bütünlüğü (SRI).** Herhangi bir harici script/font CDN'den
  çekilecekse `integrity` hash'i zorunlu. Ama tercih edilen: fontlar ve
  kütüphaneler kendi build'imize gömülür, harici CDN'e hiç bağımlı
  olunmaz (bkz. `05-deneyim-ve-guvenlik.md` 2.2).
- **İmzalı commit'ler** (GPG) — en azından ana bakımcı(lar) için, geçmişte
  sahte commit ekleme riskini azaltır.

## 2. Topluluk katkısı güvenliği

Açık kaynak olmak (`06-kalite-ve-topluluk.md`), dışarıdan kod ve içerik
kabul etmek demek. Bu, kalite kapısının (3 katman) yanına bir de **güvenlik
kapısı** ister.

### PR inceleme kontrol listesi (kod)

Her dış PR, merge edilmeden önce şunlar kontrol edilir:

- Yeni bir bağımlılık eklendi mi? Neden gerekli, alternatifi var mı?
- `lib/robotics/` içine DOM/network erişimi giriyor mu? (Girmemeli —
  bkz. `07-tasarim-sistemi.md` mobil uyumluluk kuralı.)
- Herhangi bir dış URL'e istek atan kod var mı? (Statik site felsefesiyle
  çelişir, ekstra dikkat ister.)
- `eval`, `dangerouslySetInnerHTML`, veya benzeri "ham kod çalıştırma"
  deseni var mı? Varsa gerekçesi net değilse reddedilir.
- CI (test + lint + audit) yeşil olmadan hiçbir PR merge edilmez —
  insan gözden geçirmesi otomasyonun yerine geçmez, ikisi birlikte çalışır.

### PR inceleme kontrol listesi (içerik/MDX)

MDX, düz metinden farklı olarak React bileşeni gömebilir — bu bir esneklik
ama aynı zamanda bir risk yüzeyi. Kurallar:

- Ders içeriği (`content/`) sadece **önceden tanımlanmış, incelenmiş**
  bileşenleri kullanabilir (`components/interactive/` içindeki liste).
  Yeni bir React bileşenini bir MDX dosyası kendi başına icat edip
  çalıştıramaz.
- Bir PR hem yeni bir bileşen hem yeni bir ders ekliyorsa, bileşen ayrı,
  daha sıkı bir gözden geçirmeden geçer (kod incelemesi + `06`'daki üç
  katman ayrı ayrı uygulanır).
- Dış bağlantı (link) içeren içerikte hedef domain kontrol edilir; sadece
  güvenilir/resmi kaynaklara (üretici siteleri, akademik yayınlar,
  standart kuruluşları) izin verilir.

### MDX derleme ayarı: `blockJS` neden kapalı (Faz 1'de karar verildi)

`next-mdx-remote`, MDX içeriğini varsayılan olarak `blockJS: true` ile
derler — bu, `{...}` içindeki HER JS ifadesini (JSX prop'larındaki
obje/array literal'lar dahil) sessizce siler. Bu varsayım, MDX içeriğinin
**güvenilmeyen/üçüncü taraf** kaynaklı olabileceği senaryolar için var.

Faz 1'de `Quiz` bileşenine `sorular={[...]}` gibi obje dizisi prop'u
verilince bu filtre araya girdi ve prop'u sessizce `undefined` yaptı (uzun
bir hata ayıklama sürecinin kök nedeni). Çözüm: `app/ders/[slug]/page.tsx`
içindeki `compileMDX` çağrısında `blockJS: false` verildi;
`blockDangerousJS` varsayılan **açık** bırakıldı (bu, `eval` gibi belirgin
tehlikeli çağrıları hâlâ engeller).

**Bunun güvenli olmasının dayanağı — şu an:** `content/` altındaki HER
dosya birinci taraf içeriktir (bakımcı yazıyor, doğrudan repoya commit
ediliyor). Dış katkı PR akışı (`06-kalite-ve-topluluk.md` §2, bu dosyanın
üstündeki "PR inceleme kontrol listesi (içerik/MDX)") henüz devrede değil
— henüz hiçbir dış katkı yok.

**Dış katkı başladığında bu karar yeniden gözden geçirilmeli.** O noktada
ya `blockJS: true`'ya dönülüp içerik yazarlarının prop verisini
`export const` ile ayrı bir dosyadan/formattan vermesi istenir, ya da PR
inceleme kontrol listesindeki MDX kurallarının (sadece önceden tanımlı
bileşen, obje/array prop'larının içeriğinin gözden geçirilmesi) bu riski
yeterince kapattığına karar verilip mevcut ayar korunur — ama bu karar
tekrar bilinçli verilmeli, varsayılan olarak sürüklenmemeli.

### Otomatik önlemler

- Yeni katkıcıların ilk PR'ı otomatik olarak "onay bekliyor" statüsünde
  çalışır (CI, ilk kez katkı yapanlar için otomatik tetiklenmez, bakımcı
  onayı ister) — bu, kötü niyetli kodun CI ortamında sırf açılarak zarar
  vermesini (örn. secrets sızdırma denemesi) engeller.
- CI ortamında hiçbir secret/API anahtarı yok zaten (statik site,
  sunucu tarafı yok) — bu riski yapısal olarak ortadan kaldırır.

## 3. İstemci tarafı çalıştırma izolasyonu

- **Pyodide kum havuzu.** Kullanıcının yazdığı Python, WebAssembly içinde,
  kullanıcının kendi tarayıcı sekmesinde çalışır. Bu koda ağ erişimi
  verilmez (fetch/XHR devre dışı bırakılır) — kullanıcı kendi kodunu
  çalıştırırken bile dışarıya veri gönderemez.
- **Çalışma süresi sınırı.** Kullanıcı kodu sonsuz döngüye girerse sekmeyi
  kilitlemesin diye zaman aşımı ve "durdur" kontrolü olur.
- **İzole `iframe` + `sandbox` özniteliği**, eğer kullanıcı kodu çalıştırma
  ayrı bir çerçevede yapılırsa (teknik detay build aşamasında netleşir),
  ana sayfanın DOM'una erişimi olmaz.

## 4. HTTP güvenlik başlıkları

Statik olsa da, yayın platformu (Vercel/Cloudflare) üzerinden şu başlıklar
zorunlu tutulur:

- `Content-Security-Policy` — sadece kendi alan adımızdan script/style,
  harici kaynak yok
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — kamera, mikrofon, konum gibi izinler açıkça
  kapatılır (platform hiçbirini kullanmıyor)
- `Strict-Transport-Security` — HTTPS zorunlu

## 5. Olay müdahale planı (basit ama var olsun)

Küçük bir proje için ağır bir süreç gerekmez, ama şu asgari şey olmalı:

- Bir güvenlik açığı bildirimi nereye gelecek? (`SECURITY.md` dosyası,
  bir e-posta adresi.)
- Kritik bir açık bulunursa: bağımlılığı güncelle/kaldır → yeniden derle →
  yayınla. Statik site olduğu için "geri alma" hızlı (önceki build'e dönmek
  bir buton).
- Yayınlanmış bir derste yanlış/yanıltıcı bilgi fark edilirse: düzeltme
  bir PR kadar hızlı, `incelendi_tarih` güncellenir.

## 6. Gizlilik kuralının güvenlik karşılığı

`00-vizyon.md`'deki kaynak gizliliği kuralı (iş yeri bilgisi asla girmez) aynı
zamanda bir güvenlik kontrolü: CI'da, `content/` altındaki yeni/değişen
dosyalarda belirli anahtar kelimelerin (proje kod adları, iç sistem isimleri
— bakımcı tarafından tanımlanan kısa bir liste) geçip geçmediğini tarayan
basit bir betik (`scripts/check-sensitive-terms.ts`) bulunur. Bu, insan
hatasını yakalayan ikinci bir güvenlik ağı, tek başına yeterli değildir ama
ücretsiz bir ek katmandır.

## Neyin bilinçli olarak kapsam dışı bırakıldığı

- **Kullanıcı kimlik doğrulama güvenliği** — çünkü hesap sistemi yok
  (`05-deneyim-ve-guvenlik.md` 2.1). Var olmayan bir şeyi güvenli hale
  getirmeye çalışmak yerine, onu var etmemek tercih edildi.
- **Sunucu tarafı güvenlik duvarı / DDoS koruması** — statik site barındırma
  sağlayıcısının (Vercel/Cloudflare) kendi altyapısı bunu zaten sağlıyor,
  tekerleği yeniden icat etmiyoruz.
- **Ödeme güvenliği** — platform ücretsiz, ödeme akışı yok.

Bu üçünü "düşünmedik" değil, "bilinçli olarak gerekmiyor" diye işaretlemek
önemli — ileride biri "peki güvenlik neden X'i kapsamıyor" diye sorarsa cevap
hazır olsun.
