BÜYÜK ÜRÜN DENETİMİ — sadece analiz, henüz kod yazma.

Mert'ten gelen kapsamlı bir "projeyi uçtan uca ele al" talebi var (68
maddelik, aşağıda tam metni var). Bunu doğrudan uygulamıyoruz — önce
gerçek bir denetim yapıyoruz, çünkü bu maddelerin büyük kısmı muhtemelen
ZATEN VAR (bu proje aylarca, çok sayıda sprint'te geliştirildi).

KESİN KAPSAM DIŞI: 14, 15, 16. maddeler (kullanıcı hesabı, login, "My
Lab", kaydedilen kişisel workspace). Mert açıkça "hesapsız ilke kalsın"
dedi — docs/00 ve docs/05'teki mimari karar (statik site, sunucu yok,
veri toplanmaz, hedef kitlede çocuk var) tekrar teyit edildi. Bu üç
maddeyle İLGİLİ HİÇBİR ŞEY yapma, rapora "kapsam dışı, kalıcı karar" diye
yaz, geç.

GÖREV: Aşağıdaki 68 maddelik listeyi (madde madde) gerçek kod tabanına
karşı denetle. Her madde için:
- ZATEN VAR: hangi dosya/bileşen/derste karşılığı var, kanıtla (dosya
  yolu ver). Değiştirme, sadece işaretle.
- KISMEN VAR: ne var, ne eksik, somut olarak belirt.
- YOK, GERÇEK BOŞLUK: bu gerçekten eksik ve değerli mi, yoksa zaten
  var olan bir şeyin tekrarı mı olur, değerlendir.
- ÇELİŞİYOR: mevcut docs/00-15'teki bir ilkeyle çelişiyorsa (14-16
  dışında başka varsa) işaretle, uygulama.

Sonucu docs/16-urun-denetimi.md adında yeni bir dosyaya yaz (kod
yazma, sadece rapor). Dört kategoriye ayrılmış, madde madde. En sonda
kendi önerini ekle: gerçek boşluklardan hangi 5-8 tanesi en yüksek
etki/en düşük risk taşıyor, hangi sırayla ele alınmalı.

Commit at, push et, bana raporla. Onayımı almadan hiçbir uygulama
fazına geçme.

═══════════════════════════════════════════════════════════════════
MERT'İN ORİJİNAL 68 MADDELİK TALEBİ (tam metin, aşağıda):
═══════════════════════════════════════════════════════════════════

# PROJEYİ UÇTAN UCA YENİDEN ELE AL — ÜRÜN, EĞİTİM, ROBOTİK VE TEKNİK ALTYAPI REVİZYONU

Bu projeyi artık basit bir web arayüzü, birkaç parametre girilip sonuç gösterilen bir demo veya birkaç robot animasyonundan oluşan bir site olarak görmeni istemiyorum.

Amacımız projeyi gerçek teknik temeli olan, öğretici, interaktif, kullanması keyifli, profesyonel görünümlü ve insanların tekrar dönmek isteyeceği bir robotik öğrenme ve simülasyon platformuna dönüştürmek.

Projeye uçtan uca el at.

Ancak bunu yaparken mevcut sistemi körü körüne silip yeniden yazma.

Önce:

1. Mevcut kod tabanını ve mimariyi analiz et.
2. Şu anda bulunan tüm sayfaları, özellikleri, componentleri, deney alanlarını, simülasyonları ve içerikleri çıkar.
3. Güçlü tarafları belirle.
4. Tekrarlanan, yüzeysel, gereksiz veya zayıf alanları belirle.
5. Teknik olarak hatalı veya sadece görsel olarak çalışıyormuş izlenimi veren bölümleri tespit et.
6. Kullanıcı deneyimindeki kopuklukları belirle.
7. Ardından sistemi sistematik olarak geliştir.

## ANA HEDEF

Kullanıcı siteye girdiğinde şu hissi almalı:

"Bu sadece güzel hazırlanmış bir web sitesi değil. Arkasında gerçekten robotik, matematik, kinematik, kontrol, programlama ve mühendislik bilgisi bulunan ciddi bir sistem var."

Bunun yanında:

- Yeni başlayan biri korkmamalı.
- Teknik kullanıcı sistemi basit bulmamalı.
- Öğrenci bir şeyler gerçekten öğrenmeli.
- Deney yapmak isteyen kullanıcı özgür olmalı.
- Siteyi gezen biri her sayfada aynı yapıyla karşılaşmamalı.
- Kullanıcı yaptığı işlemin robotik sistemde gerçekte ne anlama geldiğini anlayabilmeli.
- Platform insan eliyle düşünülmüş, tasarlanmış ve mühendislik mantığıyla hazırlanmış hissettirmeli.

---

# 1. ÖNCE TÜM PROJEYİ AUDIT ET

Kod yazmaya başlamadan önce mevcut sistemi incele.

Her önemli bölüm için şu değerlendirmeyi yap:

- Şu anda ne yapıyor?
- Neden var?
- Kullanıcı için gerçekten değer oluşturuyor mu?
- Teknik açıdan doğru mu?
- Kullanıcı bunu anlayabiliyor mu?
- Fazla tekrar var mı?
- Daha iyi nasıl yapılabilir?
- Silinmeli mi?
- Birleştirilmeli mi?
- Geliştirilmeli mi?
- Baştan mı tasarlanmalı?

Sadece görsel analiz yapma.

Aynı zamanda:

- component mimarisi,
- state yönetimi,
- veri modeli,
- routing,
- simulation logic,
- matematiksel hesaplama bölümleri,
- kod editörü,
- kullanıcı akışları,
- hata yönetimi,
- güvenlik,
- performans,
- responsive yapı,
- accessibility,
- sürdürülebilirlik

gibi konuları da incele.

Ardından yapılacak geliştirmeleri önceliklendir:

Critical / High / Medium / Nice-to-have

şeklinde ayır.

---

# 2. "RANDOM SAYI GİRDİM ROBOT HAREKET ETTİ" HİSSİNİ TAMAMEN KALDIR

Projenin en önemli noktalarından biri bu.

Kullanıcı hiçbir zaman:

"Buraya sayı girdim, sistem de kafasına göre robotu hareket ettirdi."

hissine kapılmamalı.

Her hareketin altında mümkün olduğunca gerçek robotik hesaplama bulunmalı.

Örneğin:

- Forward Kinematics
- Inverse Kinematics
- Transformation Matrices
- Homogeneous Transformations
- Joint Space
- Cartesian Space
- TCP
- Tool Frame
- Base Frame
- Coordinate Transformations
- Joint Limits
- Workspace
- Singularity
- Velocity
- Acceleration
- Trajectory
- Interpolation
- Jacobian
- Collision mantığı
- Reachability

gibi gerçek kavramlardan yararlan.

Fakat bunları sadece isim olarak UI üzerine yazmak yeterli değil.

Hesaplama gerçekten kullanılmalı.

---

# 3. "BU HAREKET NEDEN OLDU?" KATMANI EKLE

Simülasyonun en güçlü özelliklerinden biri bu olabilir.

Robot hareket ettikten sonra kullanıcı isterse sistemin yaptığı işlemi açabilmeli.

Örneğin:

## Nasıl hesaplandı?

Robotun:

- başlangıç joint değerleri,
- hedef joint değerleri,
- TCP başlangıç konumu,
- TCP hedef konumu,
- kullanılan coordinate frame,
- transformation matrix,
- kullanılan IK çözümü,
- trajectory yöntemi,
- joint limit kontrolü

görülebilsin.

Örneğin kullanıcı:

"Bu hareket neden mümkün değil?"

dediğinde sistem:

Joint 3 gerekli açıya ulaşamıyor.
Hesaplanan açı: 178.4°
Robot limiti: ±165°

gibi gerçek bir açıklama verebilsin.

Sadece:

Invalid position.

deme.

---

# 4. TEKNİK DOĞRULUK GÖRÜNÜR OLSUN

Sistemin arkasındaki mühendisliği kullanıcıya göstermek için ayrı bir yaklaşım geliştir.

Örneğin simülasyonların yanında küçük:

Under the Hood

veya

Bu simülasyon nasıl çalışıyor?

alanları olabilir.

Burada kısa ve anlaşılır şekilde:

- kullanılan matematik,
- robot modeli,
- varsayımlar,
- limitler,
- gerçek sistem ile simülasyon arasındaki farklar

gösterilebilir.

İsteyen kullanıcı:

Basit Açıklama

ile başlayıp,

Teknik Detay

bölümünü açabilsin.

Hatta mümkünse:

Formülü Göster

seçeneği olsun.

Ama kullanıcıyı ilk anda formül bombardımanına tutma.

Progressive disclosure kullan.

---

# 5. SİMÜLASYON GÜVENİLİRLİĞİ / FIDELITY SİSTEMİ

Bu projeyi sıradan simülatörlerden ayırabilecek bir özellik düşün.

Her deney için bir simülasyon doğruluk seviyesi gösterilebilir.

Örneğin:

### Conceptual

Eğitim amacıyla basitleştirilmiş model.

### Kinematic

Gerçek kinematik hesaplamalar kullanılıyor.

### Advanced

Kinematik + joint limits + trajectory + collision gibi daha gelişmiş parametreler kullanılıyor.

Kullanıcı böylece simülasyonun gerçeğe ne kadar yaklaştığını bilir.

Kesinlikle gerçekte hesaplamadığımız şeyi hesaplıyormuşuz gibi göstermeyelim.

---

# 6. DENEY ALANLARINI PROJENİN MERKEZİNE TAŞI

Mevcut deney alanlarını ciddi şekilde geliştir.

Deney bölümleri yalnızca:

Parametre gir → Run → Sonuç

şeklinde olmamalı.

Her deney küçük bir mühendislik laboratuvarı gibi hissettirmeli.

Örnek yapı:

### Amaç

Kullanıcı neyi deneyimliyor?

### Sistem

Robotun hangi özelliği inceleniyor?

### Playground

Parametrelerle deney yap.

### Observe

Robotu hareket halinde izle.

### Inspect

Joint açıları, TCP, trajectory, koordinatlar vb. incele.

### Explain

Sistem neden böyle davrandı?

### Challenge

Kullanıcıya küçük bir mühendislik problemi ver.

Ancak bütün deneyleri bu aynı şablona hapsetme.

Deney türüne göre farklı akışlar oluştur.

---

# 7. AYNI SAYFA FORMATINI SÜREKLİ TEKRARLAMAYI BIRAK

Bu konu çok önemli.

Platform sürekli:

- Ne öğrendin?
- Ne yaptın?
- Sonuç ne?
- Sonraki konu

gibi aynı kartlardan oluşursa bir süre sonra kullanıcıyı sıkar.

Her modülün anlatım biçimi aynı olmak zorunda değil.

Farklı öğrenme deneyimleri tasarla.

Örneğin:

## Guided Discovery

Kullanıcıya direkt cevabı verme.

Robotu hareket ettirerek kavramı keşfetsin.

## Mission

"Robotun TCP'sini bu hedefe joint limitlerine çarpmadan ulaştır."

## Debug the Robot

Bilerek hatalı bir robot hareketi ver.

Kullanıcı problemi bulsun.

## Predict Before Run

Robot hareket etmeden önce:

"Sence hangi joint en fazla hareket edecek?"

diye sor.

Sonrasında gerçek sonuç gösterilsin.

## Compare

PTP ve Linear hareketleri yan yana karşılaştır.

## What Went Wrong?

Başarısız bir simülasyon göster.

Kullanıcı sebebi araştırabilsin.

## Build It

Kullanıcı adım adım robot programı oluştursun.

## Free Lab

Hiçbir yönlendirme olmadan özgürce deney yapabilsin.

## Engineering Story

Gerçek hayattan kısa bir senaryo oluştur.

Örneğin:

Bir robotun dar bir çalışma hücresinde parçayı A noktasından B noktasına taşıması gerekiyor.

Sonra kullanıcı bu problemi çözsün.

## Visual Explanation

Uzun metin yerine animasyonla kavram anlat.

## Interactive Diagram

Coordinate frame veya transformation mantığını kullanıcı sürükleyerek anlayabilsin.

Bu listeyle sınırlı kalma.

Sen de yeni öğretim ve etkileşim formatları tasarla.

Ama sadece farklı görünmeleri için değil, öğrenme kalitesini artırmaları için kullan.

---

# 8. KOD ALANINI CİDDİ ŞEKİLDE GELİŞTİR

Kod bölümü projenin en değerli yerlerinden biri olabilir.

Basit textarea + Run butonu istemiyorum.

Gerçek bir robot programlama laboratuvarına yakın hissettirsin.

Kod editöründe mümkünse:

- syntax highlighting,
- line numbers,
- autocomplete,
- error highlighting,
- hover açıklamaları,
- documentation tooltip,
- reset,
- format,
- run,
- stop,
- step,
- execution state,
- console,
- simulation bağlantısı

gibi özellikleri düşün.

Kullanıcı kod yazdığında robot simülasyonuyla ilişkisini görebilmeli.

Örneğin:

robot.move_to(
    x=450,
    y=120,
    z=300,
    method="linear"
)

çalıştırıldığında:

1. Kod parse edilir.
2. Hedef pose oluşturulur.
3. IK çözümü bulunur.
4. Joint limit kontrolü yapılır.
5. Trajectory hesaplanır.
6. Robot simülasyonda hareket eder.
7. Kullanıcı sonuçları inceleyebilir.

---

# 9. KODUN ROBOTA NASIL DÖNÜŞTÜĞÜNÜ GÖSTER

Çok öğretici bir özellik olabilir.

Kod satırı çalışırken:

robot.move_to(...)

satırı highlight olsun.

Yan tarafta:

Target pose oluşturuldu.

ardından:

Inverse kinematics çözülüyor.

ardından:

IK solution #2 selected.

ardından:

Joint limits valid.

ardından:

Linear trajectory generated.

gibi süreç görülebilsin.

Böylece kodun "sihirli" olmadığı anlaşılır.

---

# 10. BEGINNER / ENGINEERING MODLARI

Platform hem yeni başlayanlara hem teknik kullanıcılara hitap edebilmeli.

Bunun için örneğin iki görünüm düşünülebilir:

## Learn Mode

Daha sade.

Kavramlar açıklanır.

Matematik gizlenebilir.

Yönlendirme fazladır.

## Engineering Mode

Daha fazla teknik bilgi.

- joint values
- matrices
- trajectory
- frames
- Jacobian
- solver output
- limits
- calculation details

görülebilir.

Bunları iki tamamen ayrı uygulama yapma.

Aynı sistem üzerinde complexity layer kullan.

---

# 11. YENİ KULLANICI SİTEYE GİRDİĞİNDE KAYBOLMAMALI

İlk kez giren kullanıcı şu soruların cevabını birkaç saniyede anlayabilmeli:

Bu site ne?

Burada ne yapabilirim?

Ben neden bunu kullanmalıyım?

Nereden başlamalıyım?

Ana sayfayı buna göre yeniden değerlendir.

Gerekirse interaktif onboarding oluştur.

Örneğin:

### Robotu Keşfet

↓

### İlk Hareketini Yap

↓

### Koordinat Sistemlerini Öğren

↓

### Kodla Kontrol Et

↓

### Kendi Deneyini Tasarla

gibi doğal bir progression olabilir.

Ama bunu klasik sıkıcı course listesine çevirmemeye dikkat et.

---

# 12. ANA SAYFAYI BİR ÜRÜN DENEYİMİ OLARAK TASARLA

Ana sayfa sadece:

Hero
Features
Cards
Footer

şeklindeki klasik yapıya mahkûm olmasın.

Siteye girer girmez robot hareketini veya platformun temel değerini gösterebilecek interaktif bir bölüm düşün.

Örneğin kullanıcı hero alanında küçük bir robotu hareket ettirebilir.

Sonra:

Az önce yalnızca bir animasyon oynatmadın.
Hedef noktan için inverse kinematics hesaplandı.

gibi platformun teknik karakterini ortaya çıkarabiliriz.

---

# 13. YAPAY ZEKA TARAFINDAN ÜRETİLMİŞ SOĞUK BİR SITE HİSSİ VERMESİN

Bu çok önemli.

Şunlardan kaçın:

- Her yerde aynı gradient kartlar.
- Gereksiz emoji kullanımı.
- Sürekli "Unlock your potential" tarzı generic başlıklar.
- Her bölümde üç kart.
- Aynı layout'un tekrar tekrar kullanılması.
- Aşırı yuvarlatılmış componentler.
- Gereksiz glassmorphism.
- Her yerde anlamsız statistics.
- "AI generated startup landing page" görünümü.
- Aynı uzunlukta açıklamalar.
- Gereksiz büyük sloganlar.

UI insan eliyle tasarlanmış gibi hissettirmeli.

Teknik, samimi, modern ve karakterli bir görsel dil oluştur.

Robotik/mühendislik kimliği olsun.

---

# 14. KULLANICI GİRİŞİ ANCAK GERÇEK DEĞER SAĞLIYORSA OLSUN

[KAPSAM DIŞI — Mert'in kararı: hesapsız ilke kalıyor, bu madde ve
15-16 uygulanmayacak. Aşağıdaki orijinal metin sadece referans için
korunuyor.]

Login/Register ekleyelim diye boş bir authentication sistemi ekleme.

Kullanıcı hesabı açıyorsa gerçekten karşılığını almalı.

Giriş yapan kullanıcı örneğin:

- ilerlemesini kaydedebilmeli,
- deneylerini saklayabilmeli,
- kendi robot programlarını kaydedebilmeli,
- kendi workspace'ine sahip olabilmeli,
- tamamladığı görevleri görebilmeli,
- favori deneylerini saklayabilmeli,
- kaldığı yerden devam edebilmeli,
- kişisel ayarlarını kaydedebilmeli,
- oluşturduğu robot konfigürasyonlarını saklayabilmeli,
- kod snippetlerini saklayabilmeli,
- deney geçmişini görebilmeli.

---

# 15. "MY LAB" / KİŞİSEL ÇALIŞMA ALANI

[KAPSAM DIŞI — 14. madde ile aynı gerekçe.]

Login sisteminin gerçek değerini artırmak için kullanıcıya kişisel laboratuvar alanı oluşturmayı değerlendir.

Burada:

## Recent Experiments

En son yaptığı deneyler.

## Saved Robots

Kaydettiği robot konfigürasyonları.

## Code Projects

Yazdığı programlar.

## Learning Progress

Tamamladığı konular.

## Challenges

Çözdüğü görevler.

## Bookmarks

Kaydettiği teknik içerikler.

## Continue

En son kaldığı noktadan devam.

gibi özellikler olabilir.

Bu alan klasik dashboard gibi hissettirilmek zorunda değil.

Gerçek bir robotics workspace gibi düşün.

---

# 16. KULLANICI PROFİLİNE GÖRE DENEYİM

[KAPSAM DIŞI — 14. madde ile aynı gerekçe, kalıcı hesap/profil
gerektiriyor.]

İlk girişte isterse kullanıcıya:

- Robotik konusunda yeniyim
- Biraz biliyorum
- Üniversite öğrencisiyim
- Robot programlamayı öğreniyorum
- Teknik olarak detay görmek istiyorum

gibi seçenekler sunulabilir.

Bunun sonucunda içerik karmaşıklığı uyarlanabilir.

Ancak kullanıcıyı kalıcı bir kategoriye hapsetme.

Her zaman değiştirebilsin.

---

# 17. GÜVENLİĞİ CİDDİYE AL

Projeyi güvenlik açısından baştan incele.

Özellikle:

- Authentication
- Authorization
- Session management
- Password handling
- Secure cookies
- CSRF
- XSS
- Injection
- API validation
- Rate limiting
- Brute-force protection
- User input validation
- Secrets
- environment variables
- dependency vulnerabilities
- file handling
- database permissions

konularını incele.

[NOT: Authentication/Authorization/Session/Password/database maddeleri
14-16 kapsam dışı bırakıldığı için geçerli değil — statik site, sunucu
yok. XSS/injection/input validation/secrets/dependency vulnerabilities/
rate limiting mevcut mimariye (MDX güvenlik, CI audit, sensitive-terms
taraması) göre denetlenmeli.]

---

# 18. KOD ÇALIŞTIRMA ALANI ÇOK GÜVENLİ OLMALI

Eğer kullanıcı tarafından yazılan kod çalıştırılacaksa güvenliği ayrı bir problem olarak ele al.

Kullanıcı kodunun:

- sunucu dosyalarına,
- sistem komutlarına,
- diğer kullanıcı verilerine,
- network kaynaklarına,
- secret/environment variable'lara

erişememesi gerekir.

Browser sandbox, Web Worker, WASM, Pyodide veya mevcut stack için uygun başka bir yöntem değerlendir.

Infinite loop durumunda uygulama kilitlenmemeli.

Execution timeout düşün.

Memory sınırı düşün.

Hatalı kod bütün simülasyonu çökertmemeli.

---

# 19. ROBOT PROGRAMLAMA API'Sİ TASARLA

Kod laboratuvarı için küçük ama anlaşılır bir API tasarlanabilir.

Örneğin:

robot.move_joint(...)
robot.move_linear(...)
robot.move_to(...)
robot.get_tcp()
robot.get_joints()
robot.set_tool(...)
robot.wait(...)

Ama gerçek robot markasının API'sini taklit etmek zorunda değiliz.

Önce öğretici ve tutarlı bir abstraction oluştur.

Sonrasında isteyen kullanıcı için:

How this maps to real robots

bölümü oluşturabiliriz.

Örneğin kavramsal olarak:

- ABB RAPID
- KUKA KRL
- ROS 2
- Python robotics libraries

ile benzerlikler gösterilebilir.

Markalara dair iddialarda teknik doğruluğu koru.

---

# 20. ROBOT MODELİNİ DATA-DRIVEN HALE GETİR

Robotların özelliklerini component içine hard-code etmek yerine uygun bir robot model yapısı tasarla.

Örneğin:

RobotModel

name
manufacturer
jointCount
jointLimits
linkLengths
homeConfiguration
maxReach
toolFrame
baseFrame
kinematics
visualModel

Böylece gelecekte yeni robot eklemek kolay olsun.

Robot modelleme standardı gerekiyorsa URDF benzeri yapılardan yararlanmanın mantıklı olup olmadığını değerlendir.

---

# 21. ROBOT WORKSPACE / REACHABILITY GÖRSELLEŞTİRMESİ

Robotun ulaşabileceği alanı kullanıcı görsel olarak anlayabilsin.

Örneğin:

- reachable
- near limit
- unreachable
- singularity risk

alanları gösterilebilir.

Kullanıcı hedef noktayı hareket ettirdiğinde:

Reachable

veya

Unreachable because Joint 2 exceeds its range.

gibi açıklama gelsin.

---

# 22. SINGULARITY LAB

Özel ve güçlü bir eğitim alanı tasarla.

Kullanıcı robotu singularity durumuna yaklaşırken görebilsin.

Göster:

- robot pose,
- joint angles,
- Jacobian behavior,
- condition number gerekiyorsa,
- warning indicator,
- TCP velocity / joint velocity ilişkisi.

Öğrenci sadece:

"Singularity kötüdür."

demesin.

Neden olduğunu görerek öğrensin.

---

# 23. COORDINATE FRAME LAB

Base / World / Tool / TCP kavramlarını anlatmak için interaktif alan oluştur.

Kullanıcı frame'i hareket ettirdiğinde:

- eksenler,
- transformation,
- TCP position

canlı güncellensin.

XYZ eksenlerini fiziksel olarak anlamasını sağla.

---

# 24. FORWARD / INVERSE KINEMATICS LAB

Bunu gerçek bir deney haline getir.

Forward:

Joint açılarını değiştir → TCP değişimini gözlemle.

Inverse:

TCP'yi hareket ettir → joint çözümlerini gözlemle.

Birden fazla IK solution varsa bunu kullanıcıya anlat.

---

# 25. PATH PLANNING LAB

Kullanıcıya iki nokta ver.

Farklı yöntemlerle robotu hareket ettirsin.

Örneğin:

Joint interpolation

vs

Cartesian linear movement.

Path'i 3D sahnede göster.

TCP trajectory çizgisi göster.

Joint grafiklerini göster.

Sonra kullanıcı farkı anlayabilsin.

---

# 26. TELEMETRY PANEL

Robot hareket ederken gerektiğinde açılabilecek engineering telemetry panel geliştir.

Örneğin:

TCP
X
Y
Z

Orientation

Joint 1
Joint 2
Joint 3
...

Velocity

Current frame

Trajectory progress

Distance to target

Ama ekranı sürekli teknik değerlerle doldurma.

Panel açılıp kapanabilsin.

---

# 27. ZAMAN GRAFİKLERİ

Özellikle trajectory deneylerinde:

- joint angle vs time
- velocity vs time
- TCP position vs time

grafikleri gösterilebilir.

Grafikler dekoratif değil gerçekten hesaplanan veriden oluşmalı.

---

# 28. ROBOT STATE SİSTEMİ

Robot için açık bir state modeli oluşturmayı değerlendir.

Örneğin:

IDLE
PLANNING
MOVING
PAUSED
COMPLETED
ERROR
COLLISION
UNREACHABLE

UI buna göre tutarlı davranmalı.

---

# 29. HATA MESAJLARINI EĞİTİCİ HALE GETİR

Hata mesajları:

ERROR 421.

gibi kullanıcıyı ortada bırakmasın.

Örneğin:

### Target unreachable

Robot hedefe mevcut tool ve joint limitleriyle erişemiyor.

Neden?

Joint 2 gerekli açıya ulaşamıyor.

Ne yapabilirsin?

- Target Z değerini artır.
- Robot base konumunu değiştir.
- Tool uzunluğunu azalt.

gibi açıklamalar kullanılabilir.

---

# 30. "WHAT IF?" DENEYLERİ

Kullanıcının merakını tetikle.

Örneğin:

Tool'u 20 cm uzatırsan ne olur?

Joint 2 limitini azaltırsan workspace nasıl değişir?

TCP frame'i döndürürsen Cartesian hareket nasıl etkilenir?

Kullanıcı değiştirsin ve sonucu gözlemlesin.

---

# 31. CHALLENGE SİSTEMİ

Basit quizlerden kaçın.

Robotik problem çözmeye dayalı görevler oluştur.

Örneğin:

TCP'yi hedef bölgeye ulaştır fakat Joint 4 hiçbir zaman ±90°'yi geçmesin.

veya:

A → B hareketini en kısa Cartesian path ile gerçekleştir.

Sistem çözümü kontrol etsin.

---

# 32. SANDBOX MODU

Öğrenme içeriklerinden bağımsız tamamen özgür bir alan oluşturmayı değerlendir.

Kullanıcı:

- robot seçsin,
- jointleri değiştirsin,
- TCP hedefi belirlesin,
- tool seçsin,
- kod yazsın,
- trajectory oluştursun,
- simülasyonu çalıştırsın.

Bu alan platformun uzun vadede en güçlü bölümlerinden biri olabilir.

---

# 33. "WHY?" BUTONU

Platformun her tarafında kullanılabilecek küçük ama güçlü bir sistem düşün.

Kullanıcı anlamadığı değerin yanında:

Why?

butonuna basabilir.

Örneğin:

J3: 142°

Why?

Robotun TCP hedefini koruyabilmesi için inverse kinematics çözümü Joint 3'ü 142° konumuna getirdi.

Bu şekilde öğrenme simülasyonun içine gömülmüş olur.

---

# 34. FORMÜL → GEOMETRİ → ROBOT BAĞLANTISI

Matematik soyut kalmasın.

Örneğin transformation matrix anlatılırken:

1. Matrix göster.
2. İlgili değer highlight olsun.
3. 3D robot üzerindeki frame hareket etsin.
4. Kullanıcı matrix değerini değiştirince sonucu görsün.

Bu platformun çok güçlü bir eğitim yaklaşımı olabilir.

---

# 35. "CONCEPT → SIMULATION → CODE" MODELİ

Bazı konularda şu üçlü bağlantıyı kullan:

### Concept

Kavram ne?

↓

### Simulation

Robot üzerinde ne yapıyor?

↓

### Code

Programda nasıl ifade ediliyor?

Böylece teori, simülasyon ve programlama birbirinden kopmaz.

---

# 36. BAŞARI / PROGRESS SİSTEMİNİ OYUNLAŞTIR AMA ÇOCUKLAŞTIRMA

XP, coin ve anlamsız badge yağmurundan kaçın.

Bunun yerine mühendislik odaklı progression kullan.

Örneğin:

- Coordinate Systems Explorer
- Kinematics Fundamentals
- Motion Programmer
- Path Planning
- Robot Debugging

gibi competency alanları olabilir.

Kullanıcı:

%72 robotik öğrendin

gibi anlamsız metric yerine hangi yeteneklerde ilerlediğini görebilsin.

---

# 37. GERÇEK HAYAT BAĞLANTISI

Konuların sonunda kısa:

Gerçek robotta bunun karşılığı nedir?

alanı eklenebilir.

Örneğin:

TCP konusu bittikten sonra:

End-effector değiştirdiğinizde robotun doğru hareket edebilmesi için TCP tanımının doğru olması gerekir.

gibi bağlantılar kur.

---

# 38. TEKNİK TERİMLERİ TIKLANABİLİR HALE GETİR

Kullanıcı:

- TCP
- joint
- singularity
- Jacobian
- workspace

gibi bir terimi gördüğünde anlamını hızlıca açabilsin.

Mini teknik glossary oluştur.

Ama kullanıcıyı başka sayfaya sürekli göndermek yerine context içinde açıklama göster.

---

# 39. COMMAND PALETTE / HIZLI ERİŞİM

Platform büyüdükçe navigasyon zorlaşacak.

Ctrl + K

gibi command palette düşünülebilir.

Örneğin kullanıcı:

inverse kinematics

yazınca ilgili:

- ders,
- deney,
- challenge,
- glossary

sonuçlarına ulaşabilir.

---

# 40. GLOBAL SEARCH

İçerik büyüyünce arama sistemi oluştur.

Kullanıcı:

TCP

yazınca sadece başlık değil:

- deney,
- açıklama,
- kod örneği,
- glossary,
- challenge

sonuçları gösterilebilir.

---

# 41. PLATFORMUN BİR "ROBOTICS KNOWLEDGE GRAPH" MANTIĞI OLSUN

Konuları birbirinden bağımsız sayfalar olarak görme.

Örneğin:

TCP

→ Coordinate Frames
→ Transformations
→ Forward Kinematics
→ Cartesian Motion

ile bağlantılı.

Kullanıcı bu ilişkileri görebilmeli.

---

# 42. "NEXT BEST STEP"

Kullanıcı bir konuyu tamamladığında rastgele sonraki ders gösterme.

Örneğin:

Forward Kinematics tamamlandıysa:

Inverse Kinematics öğrenmeye hazırsın.

gibi mantıklı progression kullan.

---

# 43. SESSION CONTINUITY

[NOT: hesapsız, sadece localStorage tabanlı — 14-16 kapsam dışı
kararıyla tutarlı şekilde uygulanmalı, login GEREKTİRMEMELİ.]

Login olan kullanıcı siteye tekrar geldiğinde:

Geçen sefer Inverse Kinematics Lab'de çalışıyordun.

gibi kaldığı yerden devam edebilsin.

---

# 44. PAYLAŞILABİLİR DENEYLER

İleride kullanıcı kendi deney konfigürasyonunu oluşturup link olarak paylaşabilsin.

Örneğin:

Robot:
6-DOF Arm

Joints:
...

Tool:
...

Target:
...

Bir öğretmen öğrencilerine belirli deneyler gönderebilir.

Bu özelliğin mimarisini şimdiden engellemeyecek şekilde tasarla.

---

# 45. PERFORMANCE

3D ve simülasyon bölümleri performansı öldürmemeli.

Kontrol et:

- unnecessary rerenders
- heavy calculations
- animation loops
- WebGL resources
- memory leaks
- expensive state changes
- lazy loading
- code splitting
- asset loading

Özellikle düşük güçlü laptoplarda da kullanılabilir olmasına çalış.

---

# 46. RESPONSIVE TASARIM

Site sadece desktop ekranlarında iyi görünmemeli.

Ancak robot programlama ve 3D simülasyon gibi alanların mobil deneyiminin desktop ile aynı olmak zorunda olmadığını kabul et.

Mobil için akıllı sadeleştirmeler yap.

---

# 47. ACCESSIBILITY

Kontrol et:

- contrast
- keyboard navigation
- focus states
- labels
- ARIA
- screen reader compatibility
- reduced motion

Özellikle 3D deneylerde mümkün olduğunca alternatif açıklamalar sağla.

---

# 48. TASARIM SİSTEMİNİ DÜZENE SOK

Typography, spacing, button, card, panel, code editor, status indicator vb. componentlerin tutarlı bir design system'i olsun.

Ancak bu:

"her şeyi aynı karta koy"

anlamına gelmesin.

Tutarlılık ile monotonluğu birbirine karıştırma.

---

# 49. MICRO-INTERACTIONS

Robotik hissi artıracak küçük etkileşimler düşün.

Örneğin:

- joint değişince ilgili eksenin highlight olması,
- TCP değişince coordinate frame'in hareket etmesi,
- trajectory hesaplanırken path'in çizilmesi,
- hata olduğunda problemli joint'in vurgulanması.

Bunlar dekoratif değil bilgi taşıyan animasyonlar olsun.

---

# 50. ÖLÇÜ BİRİMLERİNE DİKKAT

Robotik sistemlerde:

- mm
- m
- degree
- radian
- mm/s
- deg/s

karışıklıkları ciddi problemdir.

Sistemde unit handling mantığını sağlam kur.

UI her değerin birimini açıkça göstermeli.

Gerekirse kullanıcı unit değiştirebilsin.

---

# 51. SAYISAL GİRDİLERİ GÜVENLİ HALE GETİR

Input validation oluştur.

Örneğin kullanıcı:

999999999 mm

girdiğinde sistem saçma davranmamalı.

Robot limitleri ve mantıklı simülasyon sınırları uygulanmalı.

---

# 52. GERÇEĞE AYKIRI SONUÇLAR ÜRETME

Bir özellik teknik olarak henüz uygulanmadıysa:

Simulated approximation

olarak belirt.

Gerçek fizik simülasyonu yoksa fizik hesaplıyormuş gibi göstermeyelim.

Robotik güvenilirliğimizi koruyalım.

---

# 53. TEST ALTYAPISI

Özellikle matematik ve robotik calculation layer için testler oluştur.

Örneğin:

- forward kinematics known pose
- inverse kinematics validation
- joint limits
- transformation matrix
- coordinate conversion
- trajectory endpoints
- unreachable target

testleri.

UI testlerinden daha önemli olabilir.

Çünkü simülasyon yanlış hesap yapıyorsa güzel UI'ın anlamı yok.

---

# 54. ENGINEERING VALIDATION

Her önemli matematiksel modül için mümkünse:

- expected input
- expected output
- assumptions
- units
- numerical tolerance

belirle.

Floating point tolerance konusunda bilinçli ol.

---

# 55. DEBUG MODE

Geliştirici için optional debug mode düşünülebilir.

Örneğin:

IK solver:
Iterations: 14
Residual: 0.00031
Solution: valid

Trajectory:
Samples: 240
Duration: 3.4 s

Normal kullanıcı bunu görmek zorunda değil.

---

# 56. MİMARİYİ UZUN VADEYE HAZIRLA

Bugün birkaç deney olabilir.

Ama ileride:

- daha fazla robot,
- ROS 2,
- robot communication concepts,
- sensors,
- PLC,
- digital twin,
- computer vision,
- path planning,
- industrial protocols

eklenebilir.

Mimari bunları eklemeyi zorlaştırmamalı.

Ancak sırf gelecekte lazım olabilir diye gereksiz overengineering de yapma.

---

# 57. İÇERİK KALİTESİNİ YÜKSELT

Uzun AI paragraflarından kaçın.

Teknik içeriği:

- kısa açıklama,
- görsel,
- simülasyon,
- interaction,
- gerçek örnek,
- kod

kombinasyonlarıyla anlat.

Her konuyu sadece text card ile anlatma.

---

# 58. SAMİMİ FAKAT CİDDİ TON

Platform kullanıcıyla ders kitabı gibi konuşmamalı.

Ama aşırı arkadaşça, emoji dolu, çocukça bir tona da düşmemeli.

Örneğin:

Robot hedefe ulaşamadı.

yerine:

Bu hedef biraz problemli. Joint 2 limitine çarpıyoruz. Hedefi biraz yukarı taşı ve tekrar deneyelim.

gibi doğal anlatımlar düşünülebilir.

---

# 59. BOŞ İSTATİSTİKLERDEN KAÇIN

"500+ simulations"

"10,000 students"

gibi gerçek olmayan rakamları UI'a koyma.

Fake social proof kullanma.

---

# 60. PLATFORMUN ÖZGÜN KİMLİĞİNİ OLUŞTUR

Bu proje:

Coursera değil.

Udemy değil.

LeetCode değil.

RobotStudio değil.

Bir robotics documentation sitesi de değil.

Bunlardan bazı fikirleri alabilir ama kendi kimliği olmalı.

Ben platformu kabaca şöyle görüyorum:

Learn robotics by experimenting with robots, not just reading about them.

Ama sen bundan daha iyi ürün positioning fikirleri geliştirebilirsin.

---

# 61. EKSTRA FİKİR ÜRET

Buradaki maddeleri yapılacakların üst sınırı olarak görme.

Bu promptta bulunmayan fakat projeyi ciddi şekilde geliştirecek fikirlerin varsa ekle.

Özellikle şu alanlarda yaratıcı davran:

- robotik eğitim,
- simulation UX,
- interactive learning,
- developer tools,
- visualization,
- technical credibility,
- engagement,
- user accounts, [KAPSAM DIŞI]
- collaboration,
- experimentation,
- progress tracking.

Her yeni fikir için kendine şu soruyu sor:

Bu gerçekten kullanıcıya değer katıyor mu?

Cevap hayırsa ekleme.

---

# 62. HER ÖZELLİK İÇİN "NEDEN?" SORUSUNU SOR

Yeni bir component veya özellik eklemeden önce:

1. Kullanıcı problemi ne?
2. Bu özellik problemi nasıl çözüyor?
3. Daha basit çözümü var mı?
4. Platformun ana amacına hizmet ediyor mu?
5. Teknik borç yaratıyor mu?

Sadece ekranı doldurmak için feature ekleme.

---

# 63. BİLGİ MİMARİSİNİ YENİDEN DEĞERLENDİR

Navigasyon dahil tüm site yapısını gözden geçir.

Kullanıcı:

- Learn
- Labs
- Code
- Sandbox
- Challenges
- My Lab [KAPSAM DIŞI]

gibi alanlar arasında kaybolmamalı.

Gerekirse mevcut sayfa yapısını değiştir.

---

# 64. EMPTY STATE'LERİ BİLE DÜŞÜN

Örneğin kullanıcı henüz deney kaydetmediyse:

No experiments.

yazmak yerine:

İlk deneyini oluştur. Robotunu seçip çalışma alanını keşfetmeye başlayabilirsin.

gibi yönlendirici empty state kullan.

---

# 65. LOADING / ERROR / SUCCESS DURUMLARI

Her önemli interaction için düşün.

Simülasyon hesaplanırken kullanıcı sistemin donduğunu sanmamalı.

Ama sahte progress bar da kullanma.

---

# 66. TEKNİK DÖKÜMANTASYON

Kod tabanının içine kısa ama kaliteli teknik dokümantasyon ekle.

Özellikle:

- architecture
- simulation engine
- coordinate conventions
- units
- robot model format
- adding new experiments
- adding new robots

konuları geliştirici tarafından anlaşılabilir olsun.

---

# 67. ÜRÜN DÜZEYİNDE SON KONTROL

İşin sonunda siteyi şu farklı kullanıcılar gibi düşünerek baştan sona test et:

### Kullanıcı 1

Robotik hakkında hiçbir şey bilmiyor.

Siteyi anlayabiliyor mu?

### Kullanıcı 2

Bilgisayar mühendisliği öğrencisi.

Bir şey gerçekten öğreniyor mu?

### Kullanıcı 3

Robotikle ilgilenen mühendis.

Teknik altyapıyı fazla yüzeysel buluyor mu?

### Kullanıcı 4

Sadece 5 dakika siteyi deneyecek.

Platformun değerini anlayabiliyor mu?

### Kullanıcı 5

Bir hafta sonra geri geliyor.

Geri gelmesinin bir nedeni var mı?

---

# 68. UYGULAMA STRATEJİN

Bütün projeyi tek seferde kontrolsüz biçimde değiştirme.

Şu sırayı kullan:

## PHASE 1 — Audit

Mevcut sistemi çıkar.

## PHASE 2 — Architecture

Gerekli temel refactorları yap.

## PHASE 3 — Simulation Core

Teknik/matematik altyapısını sağlamlaştır.

## PHASE 4 — Core UX

Navigasyon, onboarding ve kullanıcı akışlarını düzelt.

## PHASE 5 — Labs

Deney alanlarını geliştir.

## PHASE 6 — Code Lab

Programlama ortamını geliştir.

## PHASE 7 — Learning Experience

Tekrarlanan eğitim yapısını çeşitlendir.

## PHASE 8 — Accounts & My Lab

[KAPSAM DIŞI]

## PHASE 9 — Security

Security audit + hardening yap.

## PHASE 10 — Polish

Animation, empty state, error UX, responsive, accessibility ve design polish.

## PHASE 11 — Testing

Teknik hesaplama + UI + regression testleri.

## PHASE 12 — Final Product Review

Platformu baştan sona tekrar değerlendir.

---

# ÇALIŞMA PRENSİPLERİN

Kod yazarken şu kurallara uy:

- Mevcut çalışan özellikleri sebepsiz bozma.
- Önce mevcut kodu anlamaya çalış.
- Gereksiz dependency ekleme.
- Gereksiz abstraction yapma.
- Duplicate kod bırakma.
- Büyük componentleri mantıklı şekilde böl.
- Magic number kullanma.
- Robotik hesaplamaları UI componentlerinin içine gömme.
- Simulation/math layer mümkün olduğunca UI'dan ayrılmış olsun.
- Input validation ekle.
- Error handling ekle.
- Type safety kullan.
- Performance'ı düşün.
- Accessibility'yi düşün.
- Security'yi düşün.
- Responsive davranışı kontrol et.
- Fake functionality oluşturma.
- Placeholder özellikleri gerçek özellikmiş gibi gösterme.
- Teknik olarak emin olmadığın robotik bilgiyi uydurma.

---

# EN ÖNEMLİ PRENSİP

Bütün geliştirmelerde şu kriteri kullan:

Bu özellik platformu gerçekten daha iyi bir robotik öğrenme ve deney ortamına mı dönüştürüyor, yoksa sadece daha fazla web componenti mi ekliyor?

Eğer ikinciyse yapma.

İnsan siteyi kapattığında:

"Güzel siteydi."

demesinden çok:

"Robotun neden böyle hareket ettiğini gerçekten anladım."

demesini istiyorum.

Ve teknik bir kullanıcı projeyi incelediğinde:

"Bunlar sadece Three.js ile bir robot modelini oynatmamışlar; gerçekten kinematik, koordinat sistemleri, trajectory ve robot modelleme mantığını sisteme oturtmuşlar."

hissini almalı.
