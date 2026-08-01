# Uygulama planı

Aşamalar bağımlılık sırasına göre dizildi — her aşama bir öncekinin üstüne kurulu.
Takvim yok, sırayla ilerle. Biten maddenin kutucuğunu işaretle.

Hedef teslim: 21 Ağustos 2026

---

## Aşama 0 — Kurulum

- [x] `pip install -r requirements.txt` çalışıyor
- [x] Git repo başlatıldı, ilk commit atıldı
- [x] `pytest backend/tests/ -v` hatasız çalışıyor (henüz test boş olabilir)

---

## Aşama 1 — Simülasyon ortamı

- [x] `simulation/scene.py`: PyBullet başlatma, zemin + KUKA iiwa yükleme
- [x] Sahne hem `GUI` hem `DIRECT` modunu destekliyor
- [x] Robotun eklem sayısı, tipleri ve açı limitlerini döndüren fonksiyon
- [x] `simulation/obstacles.py`: küre ve kutu engelleri sahneye ekleme
- [x] Test: sahne açılıyor, robot yükleniyor, 7 dönel eklem tespit ediliyor

**Çıktı:** Sahne açılıyor, robot ve engeller görünüyor.

---

## Aşama 2 — Kinematik

- [x] `kinematics/forward.py`: eklem açıları → uç nokta konumu
- [x] FK doğrulama: PyBullet `getLinkState` ile karşılaştır, en az 5 farklı poz
- [x] `kinematics/inverse.py`: hedef konum → eklem açıları
- [x] IK doğrulama: FK(IK(hedef)) ≈ hedef, hata < 1 cm
- [x] Eklem limitleri dışına çıkan çözümleri reddetme

**Çıktı:** Robot, verilen 3D koordinata ulaşabiliyor.

---

## Aşama 3 — Çarpışma kontrolü

- [x] Verilen bir uç nokta konumu engellerle çakışıyor mu? (`is_collision_free`)
- [x] İki nokta arasındaki doğru parçası güvenli mi? (`is_path_segment_free`)
- [x] Test: bilinen çakışan/çakışmayan senaryolar

**Çıktı:** Planlayıcıların kullanacağı güvenlik kontrolü hazır.

---

## Aşama 4 — Planlayıcı arayüzü

- [x] `planners/base.py` gözden geçirildi (`Planner`, `PlanResult` hazır geliyor)
- [x] Basit bir `StraightLinePlanner` yazılıp arayüz test edildi
  (engelleri yok sayar, sadece arayüzün çalıştığını kanıtlar)

**Çıktı:** Ortak sözleşme çalışıyor, algoritmalar buna göre yazılacak.

---

## Aşama 5 — Algoritmalar

- [x] A* — grid tabanlı arama
- [x] A* testi: bilinen bir labirentte doğru yolu buluyor
- [x] RRT — rastgele örnekleme
- [x] RRT testi: çözüm buluyor ve yol çarpışmasız
- [x] RRT* — RRT'nin optimize edilmiş hali
- [x] RRT* testi: RRT'den daha kısa yol üretiyor (aynı sahne, yeterli iterasyon)

**Çıktı:** 3 algoritma aynı arayüzden çağrılabiliyor.

---

## Aşama 6 — Karşılaştırma

- [x] `benchmark.py`: 3 algoritmayı aynı sahnede N kez çalıştırır
- [x] Toplanan metrikler: süre, yol uzunluğu, düğüm sayısı, başarı oranı
- [x] Sonuçları tablo olarak yazdırır + JSON'a kaydeder
- [x] En az 3 farklı zorluk seviyesinde sahne (az/orta/çok engel)

**Çıktı:** Sayısal karşılaştırma verisi — projenin asıl katkısı bu.

---

## Aşama 7 — API

- [x] FastAPI iskeleti
- [x] `POST /plan` — hedef, engeller, algoritma adı alır; `PlanResult` döner
- [x] `GET /algorithms` — mevcut algoritmaları listeler
- [x] CORS ayarları (frontend erişebilsin)
- [x] Test: API çağrısı geçerli sonuç dönüyor

**Çıktı:** Python tarafı web'e açıldı.

---

## Aşama 8 — Frontend

- [x] 2D canvas: sahneyi üstten göster
- [x] Tıklayarak engel ekleme / hedef belirleme
- [x] Algoritma seçimi (dropdown)
- [x] "Planla" butonu → API çağrısı → bulunan yolu çiz
- [x] Metrik paneli: süre, yol uzunluğu, düğüm sayısı
- [x] Aynı sahnede 3 algoritmayı üst üste karşılaştırma görünümü

**Çıktı:** Tarayıcıdan kullanılabilen araç.

---

## Aşama 9 — Cila

- [x] README: ne olduğu, nasıl çalıştırılacağı, ekran görüntüsü
- [ ] Demo videosu (PyBullet 3D görünümü + web arayüzü)
- [x] Karşılaştırma sonuçlarının kısa analizi (`docs/sonuclar.md`)
- [ ] Staj defteri notlarının derlenmesi

---

## Yedek planlar

- **IK uzarsa:** PyBullet'in hazır `calculateInverseKinematics` fonksiyonunu kullan,
  kendi çözümünü "gelecek çalışma"ya bırak.
- **3 algoritma yetişmezse:** A* + RRT ile devam et, RRT*'ı sonraya bırak.
- **Frontend yetişmezse:** Streamlit ile bir günde basit arayüz çıkarılabilir.
