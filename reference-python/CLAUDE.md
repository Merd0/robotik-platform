# Robot Arm Path Planner

Sanal robot kolunun engellerden kaçarak hedefe ulaşmasını sağlayan, web
arayüzünden kullanılabilen algoritma karşılaştırma aracı.

## Kurallar

- Kod ve değişken isimleri İngilizce, docstring ve yorumlar Türkçe.
- Her modül için `backend/tests/` altına test yaz. Test yoksa modül bitmiş sayılmaz.
- Tüm planlayıcılar `backend/planners/base.py` içindeki `Planner` arayüzünü uygular.
  İmzayı değiştirme: `plan(start, goal, obstacles) -> PlanResult`.
- Gereksiz yorum yazma. Yorum sadece "neden böyle" sorusunu cevaplasın, "ne yapıyor"u değil.
- Her tamamlanan adımda `docs/plan.md` içindeki kutucuğu işaretle.
- Yeni bir mimari karar verildiyse `docs/architecture.md` dosyasına tek paragraf ekle.
- Rutin işlerde onay için durma. Kodu yaz, testi çalıştır, commit at, devam et.
  Sadece şu durumlarda dur ve sor: (a) bir mimari/tasarım kararı gerekiyorsa
  ve birden fazla makul seçenek varsa, (b) Planner arayüzü gibi çekirdek bir
  sözleşmeyi değiştirmen gerekiyorsa, (c) plana yeni bir aşama/kapsam eklenecekse,
  (d) geri alınması zor bir işlem varsa (dosya silme, git history değiştirme).

## Yapı

```
backend/kinematics/   forward.py, inverse.py
backend/planners/     base.py (arayüz), astar.py, rrt.py, rrt_star.py
backend/simulation/   scene.py (PyBullet sahne), obstacles.py
backend/api/          main.py (FastAPI)
backend/benchmark.py  algoritma karşılaştırma scripti
frontend/             2D canvas arayüz
docs/                 plan.md, architecture.md, gunluk-loglar/
```

## Komutlar

```bash
pip install -r requirements.txt
pytest backend/tests/ -v
python -m backend.benchmark
uvicorn backend.api.main:app --reload
```

## Bilinmesi gerekenler

- Robot: KUKA iiwa (`kuka_iiwa/model.urdf`, PyBullet içinde hazır gelir, 7 dönel eklem).
- Testlerde PyBullet'i `p.DIRECT` modunda başlat — `p.GUI` pencere açar ve çok yavaştır.
- Planlama, robotun uç noktası (end-effector) için kartezyen uzayda yapılır.
  Tam eklem uzayında (7 boyutlu) planlama kapsam dışı, "gelecek çalışma".
- Web arayüzü 2D üstten görünüm. 3D render yok; 3D sadece PyBullet tarafında,
  demo videosu için.
- Hedef teslim tarihi: 21 Ağustos 2026.
