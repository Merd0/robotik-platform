# Teknik mimari

## En kritik karar: hesaplama tarayıcıda yapılır

Mevcut proje Python + PyBullet + FastAPI olarak kuruldu. Bu, **herkese açık bir
eğitim sitesi için yanlış mimari.** Sebepleri:

- Her ziyaretçi için sunucuda fizik simülasyonu çalıştırmak pahalı ve yavaş.
- Kaydırıcıyı oynattığında cevabın anında gelmesi gerekir; ağ gecikmesi
  öğrenme deneyimini bitirir.
- Sunucu maliyeti projeyi sürdürülemez kılar (bu proje ücretsiz olacak).

**Karar:** etkileşimli hesaplama (FK, IK, planlama, çarpışma) TypeScript'e
taşınır ve tarayıcıda çalışır. Site statik olarak yayınlanır, sunucu maliyeti
sıfıra yakın olur.

### Peki mevcut Python kodu ne olacak

Çöpe gitmiyor, üç işi üstleniyor:

1. **Doğruluk kaynağı (test oracle).** TypeScript portu, Python + PyBullet
   sonuçlarıyla karşılaştırılarak doğrulanır. "Aynı girdiye aynı çıktı" testleri.
2. **İleri seviye indirilebilir alıştırmalar.** Üniversite seviyesindeki
   öğrenci kendi makinesinde gerçek PyBullet ile çalışsın diye hazır depo.
3. **İçerik üretim aracı.** Referans görseller, animasyonlar, örnek veri
   üretmek için.

### Üniversite seviyesinde Python tarayıcıda

İleri derslerde öğrencinin gerçekten Python yazması gerekiyor. Bunun için
Pyodide (WebAssembly üzerinde CPython) kullanılır: öğrenci tarayıcıda gerçek
Python yazar, çıktısı 3D sahneyi sürer. Ağır bir bağımlılık (~10 MB), o yüzden
sadece gerektiği derste, tembel yüklemeyle (lazy load) getirilir.

---

## Yığın (stack)

| Katman | Seçim | Gerekçe |
|---|---|---|
| Çatı | Next.js (App Router), statik dışa aktarım | SEO önemli — Türkçe aramalarda bulunmak gerek. Statik = bedava yayın. |
| Dil | TypeScript | Tip güvenliği, matematik kodunda hata yakalar. |
| 3D | Three.js + react-three-fiber | Olgun, iyi belgelenmiş, React ile uyumlu. |
| 3D yardımcı | @react-three/drei | Kamera kontrolü, ızgara, yardımcı nesneler hazır. |
| İçerik | MDX | Markdown içine etkileşimli React bileşeni gömülebilir. |
| Stil | Tailwind CSS | Hızlı, tutarlı, öğrenmesi kolay. |
| Matematik gösterimi | KaTeX | Formüller düzgün görünsün. |
| Python (ileri dersler) | Pyodide | Tarayıcıda gerçek Python. |
| Test | Vitest (birim), Playwright (uçtan uca) | |
| Yayın | Vercel veya Cloudflare Pages | Statik, ücretsiz katman yeterli. |
| Analitik | Plausible veya hiç | Gizlilik dostu; ya da hiç izleme yok. |

---

## Klasör yapısı

```
robotik-platform/
├── app/                      Next.js sayfaları
│   ├── page.tsx              ana sayfa
│   ├── seviye/[seviye]/      seviye giriş sayfaları
│   └── ders/[slug]/          ders sayfası (MDX render)
├── content/                  TÜM DERS İÇERİĞİ — kod değil, veri
│   ├── a-temeller/
│   │   ├── ortaokul/
│   │   ├── lise/
│   │   └── universite/
│   ├── b-kinematik/
│   └── ...
├── lib/
│   ├── robotics/             ÇEKİRDEK MATEMATİK (TypeScript)
│   │   ├── transform.ts      homojen dönüşüm, dönme matrisleri
│   │   ├── kinematics.ts     FK, IK, Jacobian
│   │   ├── collision.ts      çarpışma kontrolü
│   │   ├── planners/         astar.ts, rrt.ts, rrtStar.ts
│   │   └── robots/           robot tanımları (DH parametreleri)
│   ├── content.ts            MDX okuma, frontmatter ayrıştırma
│   └── progress.ts           ilerleme takibi (tarayıcı belleğinde)
├── components/
│   ├── scene/                3D sahne bileşenleri
│   │   ├── RobotArm.tsx
│   │   ├── Workspace.tsx
│   │   └── PathTrace.tsx
│   ├── interactive/          derslere gömülen etkileşimli bloklar
│   │   ├── JointSliders.tsx  eklem kaydırıcıları (FK dersi)
│   │   ├── IkTarget.tsx      hedef sürükle (IK dersi)
│   │   ├── PlannerRace.tsx   algoritma yarışı (planlama dersi)
│   │   ├── CodeRunner.tsx    Python/blok çalıştırıcı
│   │   └── Quiz.tsx          alıştırma bileşeni
│   └── ui/                   düğme, kart, navigasyon
├── reference-python/         mevcut Python projesi (oracle + indirilebilir)
└── docs/                     bu planlama dokümanları
```

---

## Değişmez sözleşmeler

Bu üçü projenin bel kemiği. Değiştirilmeden önce `docs/02-mimari.md`
güncellenmeli.

### 1. Robot tanımı

```ts
type JointType = "revolute" | "prismatic";

interface JointSpec {
  type: JointType;
  dhParams: { a: number; alpha: number; d: number; theta: number };
  limits: { min: number; max: number };   // radyan veya metre
  maxVelocity: number;
}

interface RobotSpec {
  id: string;                 // "meca500", "generic-2dof"
  displayName: string;
  joints: JointSpec[];
  meshUrl?: string;           // yoksa basit geometriyle çizilir
}
```

Robot tanımları veri, kod değil. Yeni robot eklemek dosya eklemektir.

### 2. Planlayıcı arayüzü

Mevcut Python `Planner` sözleşmesinin TypeScript karşılığı:

```ts
interface PlanResult {
  success: boolean;
  path: Vec3[];
  elapsedMs: number;
  nodesExpanded: number;
  algorithm: string;
}

type CollisionChecker = (p: Vec3) => boolean;

interface Planner {
  name: string;
  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult;
}
```

### 3. Ders frontmatter

```yaml
---
id: b-lise-ileri-kinematik
baslik: İki eklemli kolda ileri kinematik
hat: b-kinematik
seviye: lise            # ortaokul | lise | universite
sure: 15                # dakika
onkosul:
  - a-lise-dof
kazanimlar:
  - Eklem açılarından uç nokta konumunu trigonometri ile hesaplayabilme
  - Açı değişiminin uç noktayı nasıl etkilediğini açıklayabilme
kaynaklar:
  - "Lynch & Park, Modern Robotics, Bölüm 4"
  - "https://mecademic.com/... (Meca500 teknik veri sayfası)"
etkilesimli:
  - JointSliders
durum: taslak           # taslak | inceleme | yayinda
---
```

`kaynaklar` alanı boş bırakılamaz — gizlilik kuralının teknik zorlayıcısı budur.
Bir CI kontrolü, `durum: yayinda` olan ve `kaynaklar` boş olan dersi reddeder.

---

## Doğrulama stratejisi

TypeScript matematiği doğru mu? Üç katman:

1. **Birim testleri** — bilinen analitik sonuçlar (2 eklemli kol elle çözülebilir).
2. **Çapraz doğrulama** — Python/PyBullet ile aynı girdiler çalıştırılıp
   sonuçlar JSON'a yazılır (`reference-python/generate_fixtures.py`),
   TypeScript testleri bu fixture'lara karşı koşar. Tolerans: 1e-6.
3. **Özellik testleri** — `FK(IK(hedef)) ≈ hedef` gibi değişmezler.

---

## Performans sınırları

- 3D sahne 60 FPS'de dönmeli. Karmaşık mesh yerine basit geometri + iyi
  malzeme kullan.
- Planlama algoritmaları ana iş parçacığını (main thread) kilitlemesin;
  RRT gibi uzun sürenler Web Worker içinde çalışsın.
- İlk yükleme 200 KB JS altında kalsın; 3D ve Pyodide tembel yüklensin.
- Mobilde çalışmalı — Türkiye'de öğrencilerin çoğu telefondan girecek.
  Dokunmatik kontroller ilk sınıf vatandaş.

## Erişilebilirlik

- Her etkileşimli sahnenin klavyeyle kullanılabilir bir alternatifi olmalı
  (kaydırıcılar zaten klavye destekli).
- Her sahnenin metin özeti olmalı (ekran okuyucu için).
- Renk tek başına bilgi taşımasın.
