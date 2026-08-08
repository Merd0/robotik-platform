# Tasarım sistemi

Bu doküman iki soruyu cevaplar: platform görsel olarak nasıl bir kimliğe
sahip olacak, ve bugünkü web mimarisi ileride mobil uygulamaya nasıl taşınır.

## Neden bu doküman gerekli

`02-mimari.md` teknoloji seçimini (Next.js, Tailwind, Three.js) belirledi ama
**nasıl göründüğünü** belirlemedi. "Tailwind kullan" bir görsel kimlik değil,
bir araçtır. Araç aynı olsa da iki proje birbirinden çok farklı görünebilir —
biri jenerik "yapay zeka ile üretilmiş site" hissi verir, diğeri özgün durur.
Bu dokümanın amacı ikincisini garanti altına almak.

## Kaçınılması gereken jenerik kalıplar

Şu an yapay zeka destekli tasarımlar üç kalıba sıkışıyor: kremsi bej zemin +
yüksek kontrastlı serif başlık + toprak tonu vurgu; neredeyse siyah zemin +
tek parlak asit-yeşili veya vermilyon vurgu; veya ince çizgili, keskin köşeli
gazete-tipi düzen. Bunların hiçbiri **bu projenin kendisinden** gelmiyor,
herhangi bir brief'e uyduruluyor. Robotik platformun kimliği kendi konusundan
(eksenler, hassasiyet, hareket, mühendislik çizimi estetiği) gelmeli.

## Görsel kimliğin kaynağı: mühendislik çizimi + canlı hareket

Platformun görsel dünyası şuradan besleniyor: **teknik çizim kağıdı ile canlı
robot hareketinin çatışması.** Statik sayfalar sakin, ince çizgili, ölçülü —
teknik bir çizim gibi. Ama her sayfada bir yerde gerçek hareket var — robot
dönüyor, yol çiziliyor, sayı değişiyor. Sakinlik ile hareketin karşıtlığı
kimliğin kendisi olur.

### Renk

Sabit bir palet yerine, **seviyeye göre değişen ama aynı aileden** üç ton:

| | Zemin | Vurgu | Karakter |
|---|---|---|---|
| Ortaokul | Açık, sıcak beyaz (#FAFAF7) | Canlı mavi-turkuaz (#0EA5A0 civarı) | Oyuncu ama çocuksu değil |
| Lise | Aynı zemin ailesi, biraz daha nötr (#F7F8FA) | Aynı vurgu ailesinden, biraz kısılmış | Meraklı, temiz |
| Üniversite | Neredeyse beyaz, teknik kağıt hissi (#FCFCFC) | Tek bir koyu lacivert/grafit (#1E293B), renk neredeyse yok | Ciddi, referans gibi |

Üç seviye de aynı temel tondan türer (aynı hue ailesi, farklı doygunluk) —
böylece kullanıcı seviye değiştirdiğinde "başka bir siteye geçmiş" hissetmez,
"aynı yerin daha derini" hisseder.

Bunlar başlangıç noktası, kod yazmaya geçilirken 4-6 tam hex değeriyle
netleştirilecek — ama ilke burada sabit: **tek bir marka rengi yok, seviyeyle
birlikte olgunlaşan bir renk ailesi var.**

### Tipografi

- **Başlık yazı tipi:** teknik/mühendislik hissi veren, orta-geometrik bir
  sans-serif (örnek yönelim: Söhne, General Sans, Inter Tight gibi ailelerden
  biri — kod yazarken netleştirilecek). Jenerik "her sitede gördüğün" serif
  başlık kullanılmayacak.
- **Gövde metni:** okunabilirliği yüksek, nötr bir sans-serif (Inter veya
  benzeri).
- **Sayısal/teknik veri:** monospace bir yazı tipi (JetBrains Mono veya
  benzeri) — eklem açıları, koordinatlar, kod blokları hep bu ailede. Bu,
  "burada gerçek bir sayı var" sinyalini verir, süs değildir.

İlk production çekirdeğinde harici veya depoya gömülü font dosyası yoktur.
Bu nedenle uygulanmış tokenlar yüklüymüş gibi `Inter`/`JetBrains Mono` adı
vermez: gövde ve başlık için platformun sistem sans ailesi; teknik veri için
`Cascadia Code`/`SFMono-Regular`/`Consolas` sıralı sistem monospace stack'i
kullanılır. Özel font ancak dosyası, lisansı, preload davranışı ve ölçülmüş
performans etkisi birlikte eklendiğinde tokena yazılabilir.

### İmza öğesi (signature element)

Her sayfanın hatırlanacağı tek bir görsel unsur: **ince, sürekli çizilen bir
"iz çizgisi"** — robotun uç noktasının geçtiği yolu temsil eden, sayfa
kaydırıldıkça veya etkileşim oldukça beliren soluk bir eğri. Bu motif ana
sayfada büyük ölçekte (dekoratif), ders içindeki 3D sahnede işlevsel (gerçek
yol izi) olarak tekrar eder. Dekorasyon ile işlev aynı görsel dile sahip.

### Hareket (motion)

- Sayfa yüklenirken tek, düzenli bir giriş animasyonu (öğeler tek tek değil,
  bir kompozisyon olarak belirir).
- Kaydırma tetiklemeli efektler minimal — konu zaten hareketli (3D robot),
  arayüzün kendisi sakin kalmalı, gösteriş sahneye ait.
- Hover mikro-etkileşimleri ince: renk/gölge değişimi yeterli, büyüme/döndürme
  gibi abartılı efekt yok.
- Azaltılmış hareket tercihine (`prefers-reduced-motion`) tüm animasyonlar
  saygı gösterir.

### Yapısal diller

- Numaralandırma (01/02/03 gibi) sadece gerçekten sıralı olan yerde kullanılır
  (örn. ders adımları). Süs olarak kullanılmaz.
- Bölücü çizgiler ince ve amaçlı — bir bölümün bittiğini, yenisinin
  başladığını gösterir, dekor değildir.

## Bileşen felsefesi

- Tek bir paylaşılan `components/ui/` kiti: düğme, kart, rozet, sekme gibi
  temel öğeler tüm seviyelerde aynı bileşenden türer, sadece tema token'ı
  değişir (renk, tipografi ağırlığı). İki ayrı tasarım sistemi yazılmaz.
- Etkileşimli sahne bileşenleri (`components/scene/`) seviyeden bağımsızdır;
  seviyeye göre değişen şey çerçeveleme metni ve renk temasıdır, sahnenin
  kendisi değil (bkz. `05-deneyim-ve-guvenlik.md` "seviyeye göre doz").

### Ürün durumları

- `app/loading.tsx` sakin bir iskelet gösterir ve `aria-busy` ile yüklenme
  durumunu bildirir.
- `app/error.tsx` deneyi yeniden başlatma ve ana laboratuvara dönme yollarını
  birlikte sunar; hata ayrıntısını veya kişisel veriyi ekrana basmaz.
- `app/not-found.tsx`, bilinmeyen adres ile production dışında tutulan taslağı
  aynı güvenli 404 sınırında açıklar ve yalnız yayınlı arama/ana sayfaya bağlar.
- Bu durumlar imza iz çizgisini yalnız yön ve durum anlatmak için kullanır;
  işlevsiz dekoratif animasyon eklemez.

Ana sayfadaki ders, etkileşim ve review sayıları production içerik
manifestinden hesaplanır. Bir seviye kartı kodda bulunmayan laboratuvarı veya
mevcut olmayan insan review makbuzunu vaat edemez.

## Erişilebilirlik ve kalite tabanı (pazarlıksız)

- Mobil dahil her ekran genişliğinde çalışır (bkz. mobil bölümü aşağıda).
- Klavye odağı her zaman görünür (outline kaldırılmaz, yeniden tasarlanır).
- Kontrast oranı WCAG AA karşılar.
- Renk tek başına anlam taşımaz (başarı/hata sadece renkle değil, ikon/metinle
  de belirtilir).

---

## Mobil uygulamaya uyarlama yolu

Şu an web platformu (Next.js) olarak kuruluyoruz. İleride yerel bir mobil
uygulama (iOS/Android) gerekirse, bugünden alınacak iki mimari karar bu geçişi
ucuza getirir:

### 1. Robotik motoru UI'dan tamamen bağımsız tutulur

`lib/robotics/` (transform, kinematics, collision, planners) zaten saf
TypeScript — DOM'a, tarayıcıya, React'e bağımlı değil. Bu paket olduğu gibi
React Native projesine de taşınabilir. **Kural: bu klasöre asla `window`,
`document`, veya React'e özel bir import girmez.** Bu disiplin bugün ücretsiz,
yarın bir mobil portu haftalar değil günler yapar.

### 2. İçerik yine veri olarak kalır

Dersler MDX/veri olarak `content/` altında durduğu sürece, render katmanı
(web için Next.js, mobil için React Native) değişse bile içeriğin kendisi
değişmez. Render'ı içerikten ayrı tutmak bu geçişin ikinci güvencesi.

### 3. 3D sahne katmanı ayrı düşünülür

Three.js web'de çalışır ama React Native'de doğrudan çalışmaz (React Native
tarafında `react-three-fiber`'ın kendi mobil karşılığı veya farklı bir 3D
motoru gerekir). Bu yüzden `components/scene/` bilinçli olarak "değişebilir"
bir katman sayılır — motoru değil, görünümü taşır. Mobil portu gündeme
geldiğinde yeniden yazılacak tek katman burasıdır, ve bu baştan böyle
planlandığı için sürpriz olmaz.

### Bugün ne yapılır, ne yapılmaz

- **Yapılır:** yukarıdaki iki disiplin (motor UI-bağımsız, içerik veri
  olarak ayrı) baştan uygulanır. Bunun ek maliyeti yoktur, sadece doğru
  klasörleme alışkanlığıdır.
- **Yapılmaz:** şimdiden React Native projesi açılmaz, "hem web hem mobil"
  aynı anda inşa edilmez. Bu, kapsamı ikiye katlar ve hiçbirini bitirmez.
  Mobil, web sürümü oturduktan sonra ayrı bir faz olarak ele alınır
  (`03-yol-haritasi.md`'ye Faz 5 sonrası "mobil" notu düşülür, faz olarak
  şimdi açılmaz).

## Duyarlı tasarım (responsive) stratejisi bugünden

Mobil web'de birinci sınıf olması gerektiği için (bkz. `05-deneyim-ve-guvenlik.md`),
şu breakpoint mantığıyla kurulur:

- Mobil öncelikli CSS (önce dar ekran stillenir, sonra genişletilir)
- 3D sahne mobilde tam ekran genişliğinde ama sadeleştirilmiş kontrol
  paneliyle (kaydırıcılar alt sekmede, üstte sahne)
- Dokunmatik hedefler en az 44×44 piksel
- Metin sütun genişliği mobilde tek sütuna düşer, masaüstünde yan panel +
  sahne yan yana durur
