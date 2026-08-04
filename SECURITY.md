# Güvenlik politikası

Bu dosya `docs/08-guvenlik-sertlestirme.md` §5'teki "olay müdahale planı"nın
kamuya dönük hâli: bir açık bulursan nereye bildireceğin ve ne bekleyeceğin.

## Açık bildirimi

**Güvenlik açığı için issue AÇMA.** Herkese açık bir issue, düzeltme
yayınlanmadan önce açığı duyurmuş olur.

Bunun yerine GitHub'ın özel bildirim kanalını kullan:
[**Security → Report a vulnerability**](https://github.com/Merd0/robotik-platform/security/advisories/new)

Bildirimde şunlar olsun: neyi etkiliyor, nasıl tetikleniyor (adımlar), ne
yapılabiliyor. Kavram kanıtı varsa ekle.

**Yanıt süresi:** bu tek bakımcılı, gönüllü yürüyen bir proje. 7 gün içinde
bir yanıt vermeyi hedefliyoruz; kritik bir bulguda düzeltme statik sitede
hızlıdır (yeniden derle + yayınla, geri alma tek buton).

## Kapsam

Bu bir eğitim sitesi: **statik olarak yayınlanıyor, sunucu tarafı kodu yok,
veritabanı yok, hesap sistemi yok.** Bu yüzden klasik web açıklarının çoğu
yapısal olarak mevcut değil. Anlamlı kapsam:

**Kapsam içinde**

- Tedarik zinciri: bağımlılıklarda veya derleme sürecinde kötü kod.
- İstemci tarafı kod çalıştırma kaçışı: `CodeRunner`'daki Pyodide kum
  havuzundan çıkma, kullanıcı Python'undan ağ erişimi elde etme.
- MDX üzerinden script enjeksiyonu (`content/` içeriğiyle XSS).
- HTTP güvenlik başlıklarında (CSP vb.) gerçek bir zayıflık.
- Ders içeriğinde **yanlış veya yanıltıcı güvenlik bilgisi** — özellikle
  Hat H (robot güvenliği). Bunu da güvenlik bildirimi sayıyoruz; yanlış
  anlatılmış bir güvenlik standardı gerçek dünyada zarar üretebilir.

**Kapsam dışı**

- Kişisel veri sızıntısı senaryoları — **hiç kişisel veri toplanmıyor.**
  Hesap, giriş, e-posta, çerez, üçüncü taraf izleyici yok; ilerleme yalnızca
  tarayıcının `localStorage`'ında duruyor ve sunucuya hiçbir şey gitmiyor
  (bkz. `docs/05-deneyim-ve-guvenlik.md` §2.1). En güvenli veri, toplanmayan
  veridir.
- Kimlik doğrulama / oturum açıkları — kimlik doğrulama yok.
- Ödeme güvenliği — platform ücretsiz, ödeme akışı yok.
- Barındırma sağlayıcısının (Vercel/Cloudflare) kendi altyapısına yönelik
  DDoS/WAF konuları.
- Kullanıcının kendi tarayıcısında kendi yazdığı Python'la kendi sekmesini
  kilitlemesi — kum havuzu kaçışı değilse etki kullanıcının kendisiyle
  sınırlıdır.

## Bu projenin güvenlik duruşu (özet)

- Statik site, sunucu tarafı kod yok → uzaktan kod çalıştırma yüzeyi yok.
- Kullanıcı Python'u WebAssembly (Pyodide) içinde, kullanıcının kendi
  sekmesinde çalışır; `fetch`/XHR erişimi kapatılmıştır.
- Dış CDN kullanılmaz; yazı tipleri ve kütüphaneler kendi derlememize gömülü.
- `package-lock.json` commit edilir, `npm ci` kullanılır; CI her push'ta
  `npm audit --audit-level=high` koşar ve yüksek/kritik bulguda derleme kırılır.
- CI ortamında hiçbir secret/API anahtarı yok.

## Fiziksel güvenlik uyarısı

Bu platform robot programlamayı **öğretir**, gerçek bir robota bağlanmaz ve
hiçbir yerde "bu kodu gerçek robotunda çalıştır" demez. Simülasyon
simülasyondur; gerçek robot eğitimli personel ve resmi risk değerlendirmesi
ister. Ders içeriğinde bu duruşu zayıflatan bir ifade görürsen, yukarıdaki
kanaldan bildir.

## Yayınlanmış içerikte hata

Güvenlik açığı değil ama yanlış/yanıltıcı teknik bilgi fark ettiysen normal
bir issue veya PR yeterli. Düzeltme bir PR kadar hızlıdır; `incelendi_tarih`
güncellenir.
