# Karşılaştırma sonuçları

`python -m backend.benchmark` çıktısı, her sahnede her algoritma 5 kez
çalıştırılarak üretildi (ham veri: `results/benchmark.json`).

| sahne      | algoritma | başarı | süre (s) | yol uzunluğu | düğüm |
|------------|-----------|-------:|---------:|-------------:|------:|
| az_engel   | astar     |   100% |   0.0039 |         1.200 |    25 |
| az_engel   | rrt       |   100% |   0.0012 |         1.426 |    29 |
| az_engel   | rrt_star  |   100% |   0.7268 |         1.237 |   800 |
| orta_engel | astar     |   100% |   0.0937 |         1.407 |   618 |
| orta_engel | rrt       |   100% |   0.0023 |         1.621 |    38 |
| orta_engel | rrt_star  |   100% |   0.7198 |         1.393 |   800 |
| cok_engel  | astar     |   100% |   0.3072 |         1.512 |  1457 |
| cok_engel  | rrt       |   100% |   0.0037 |         1.753 |    43 |
| cok_engel  | rrt_star  |   100% |   0.8234 |         1.479 |   800 |

## Gözlemler

**A\*** en kısa (neredeyse optimal) yolları üretiyor, çünkü 26-komşuluklu
sabit çözünürlüklü grid sürekli uzayı iyi yaklaştırıyor. Bedeli açık: süre ve
genişletilen düğüm sayısı engel yoğunluğuyla birlikte hızla artıyor
(25 → 618 → 1457 düğüm, 4ms → 94ms → 307ms). Daha büyük veya daha yoğun
engelli bir sahnede bu artış sorun olabilir.

**RRT** açık farkla en hızlısı (tüm sahnelerde <5ms) ve en az düğüm
kullanan; karşılığında en uzun yolları üretiyor (üç sahnede de en kötü yol
uzunluğu). Yol kalitesinin kritik olmadığı, hız önceliğiyse iyi bir aday.

**RRT\*** her sahnede RRT'den daha kısa yol üretiyor (rewire mekanizması
işe yarıyor), ama bu sürümde ilk çözümü bulduktan sonra da tüm iterasyon
bütçesini (800) tüketiyor — bu yüzden süresi RRT'nin ~100-200 katı, hatta
`cok_engel` sahnesinde A\*'tan bile yavaş. İterasyon sayısı zaten 3000'den
800'e düşürüldü (bkz. `docs/architecture.md`); daha az iterasyonla süre
düşer ama yol kalitesi RRT'ye yaklaşır.

**Başarı oranı** üç algoritma için de üç sahnede de %100 çıktı — seçilen
sahneler (az/orta/çok engel) hiçbirini başarısızlığa zorlayacak kadar zor
değil. Başarı oranını gerçekten ayırt etmek için daha dar geçitli veya daha
uzun start-goal mesafeli sahneler denenebilir; bu, gelecek çalışma olarak
bırakıldı.

## Bilinen kısıt

Bu sonuçlar yalnızca uç noktanın (end-effector) kartezyen yolunu
değerlendiriyor; robotun gövdesinin engellere çarpma ihtimali kontrol
edilmiyor (bkz. `docs/architecture.md` — "Planlama uzayı: kartezyen, eklem
uzayı değil"). Yani "başarılı" bir plan, gerçek robotta hâlâ bir gövde
çarpışmasına yol açabilir; bu proje kapsamının bilinçli olarak dışında
bırakıldı.
