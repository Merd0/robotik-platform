# Mimari kararlar

Verilen her önemli teknik karar buraya tek paragraf olarak eklenir.
Amaç: ileride "bunu neden böyle yapmıştık" sorusuna cevap verebilmek.

---

## Planlama uzayı: kartezyen, eklem uzayı değil

Planlama, robotun uç noktasının 3B konumu üzerinde yapılıyor; 7 eklemin
tamamının oluşturduğu 7 boyutlu uzayda değil. Gerekçe: 7B uzayda planlama
hem çok daha yavaş hem de görselleştirmesi zor. Kartezyen uzayda bulunan yol,
sonradan inverse kinematics ile eklem açılarına çevriliyor. Sınırı: robotun
gövdesinin engele çarpma ihtimali tam kontrol edilmiyor, sadece uç nokta.
Bu bilinen bir kısıt, README'de "gelecek çalışma" olarak belirtilecek.

## Planlayıcılar engelleri doğrudan görmez

`Planner` sınıfı engellerin geometrisini bilmiyor; kendisine verilen
`collision_checker` fonksiyonuna "bu nokta güvenli mi" diye soruyor.
Gerekçe: algoritma kodu ile simülasyon kodu birbirinden ayrık kalıyor,
her ikisi de bağımsız test edilebiliyor.

## Web arayüzü 2B

Tarayıcıda 3B render (WebGL) yapmak proje süresine sığmıyor. Arayüz üstten
2B görünüm gösteriyor; 3B görselleştirme PyBullet tarafında kalıyor ve
demo videosu için kullanılıyor.

`frontend/index.html` tek dosyalık, build adımı olmayan saf HTML/CSS/JS.
Üstten görünüm X-Y düzlemine sabit bir Z (0.3 m) ile izdüşüm; tıklamayla
eklenen engellerin ve start/goal'ün Z'si hep bu sabit değer. Gerekçe: gerçek
bir "üstten 2B görünüm" için Z ekseni zaten gösterilmiyor, sabit tutmak
tıklama-nokta eşlemesini basitleştiriyor. Bilinen kısıt: kullanıcı farklı
yükseklikte engel/hedef tanımlayamıyor; gerekirse ileride bir Z kaydırıcısı
eklenebilir.

## Çarpışma kontrolü PyBullet'ten bağımsız, saf geometri

`is_collision_free` ve `is_path_segment_free` (`simulation/obstacles.py`)
PyBullet sorgusu yapmıyor; `Obstacle` verisindeki merkez/boyut bilgisiyle saf
Python matematiği kullanıyor (küre: mesafe < yarıçap, kutu: eksen hizalı sınır
kontrolü). Gerekçe: planlayıcılar bu fonksiyonu binlerce kez çağırıyor, her
seferinde PyBullet çapraz-süreç sorgusu yapmak performansı ciddi düşürür.
`add_obstacle` hâlâ PyBullet sahnesine ekliyor ama bu sadece görselleştirme
içindir; çarpışma kararı PyBullet durumundan bağımsız.

## Planlayıcılar arama uzayını start/goal'den türetir

`Planner.plan()` imzasında sabit bir çalışma alanı (workspace) sınırı yok;
`AStarPlanner` grid sınırlarını, `RRTPlanner`/`RRTStarPlanner` örnekleme
sınırlarını start ve goal noktalarının etrafına sabit bir payla (`padding` /
`workspace_margin`) genişleterek kendileri hesaplıyor. Gerekçe: arayüz
sözleşmesi değiştirilemez ve sahne boyutu şimdilik sabit değil. Bilinen
kısıt: start-goal çok uzaksa engelin etrafından geniş bir dolambaç gerekebilir
ve bu payın dışında kalabilir — RRT/RRT* için `workspace_margin`,
A* için `padding` parametresiyle ayarlanabilir. RRT* aynı zamanda ilk çözümü
bulduktan sonra da `max_iterations` bitene kadar aramaya devam ediyor
(rewire ile yol maliyetini düşürmek için), bu yüzden RRT'ye göre
`nodes_expanded` her zaman daha yüksek çıkar — bu beklenen bir durum,
karşılaştırma tablosunda süre/yol uzunluğu ile birlikte yorumlanmalı.
