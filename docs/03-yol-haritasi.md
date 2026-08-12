# Yol haritası

Tarih değil, **faz** üzerinden ilerliyoruz. Her faz bir öncekinin üstüne kurulu
ve her fazın sonunda yayınlanabilir bir şey var.

Tek sabit tarih: **21 Ağustos 2026** — staj için gösterilecek bir şey olması
gereken gün. Faz 1'in sonu buraya denk gelecek şekilde planlandı. Yetişmezse
Faz 0'ın sonu bile gösterilebilir bir şeydir; panik yok.

**Bilinçli erteleme:** Tasarım/görsel cila, ders akıcılığı iyileştirmeleri ve
etkileşim zenginleştirmeleri bilinçli olarak ertelendi — Faz 5 sonrası ayrı
bir "cila" fazında ele alınacak. Şu an öncelik: içerik kapsamı (8 hat) ve
altyapı sağlamlığı (CI, hook, graph doğrulama).

---

## Faz 0 — İskelet ve ilk sahne

**Amaç:** platform ayakta, tek bir ders uçtan uca çalışıyor.

- [x] Next.js + TypeScript + Tailwind kurulumu, statik dışa aktarım çalışıyor
- [x] MDX içerik hattı: `content/` altındaki dosya siteye ders olarak dönüşüyor
- [x] Frontmatter şeması ve doğrulaması (`kaynaklar` zorunlu kontrolü dahil)
- [x] `lib/robotics/transform.ts` — dönüşüm matrisleri
- [x] `lib/robotics/kinematics.ts` — FK (DH tabanlı)
- [x] Python'dan doğrulama fixture'ları üretimi + TS testleri geçiyor
- [x] `components/scene/RobotArm.tsx` — Three.js ile basit robot kolu çizimi
- [x] `JointSliders` bileşeni — kaydırıcı oynat, robot hareket etsin
- [x] İlk ders yazıldı: **B / Ortaokul — eklemleri oynat**
- [x] Vercel'e yayınlandı, gerçek URL'de çalışıyor

**Çıktı:** İnternette, telefondan açılabilen, tek dersi olan çalışan bir site.

---

## Faz 1 — Kinematik hattı tamamlanıyor

**Amaç:** bir konu, üç seviyede de eksiksiz. Seviye sisteminin işe yaradığını kanıtla.

- [x] IK implementasyonu (analitik 2-DOF + sayısal genel)
- [x] `IkTarget` bileşeni — hedefi sürükle, robot uzansın
- [x] Jacobian ve tekillik görselleştirmesi
- [x] Ders: B / Ortaokul (3 ders)
- [x] Ders: B / Lise (4 ders)
- [x] Ders: B / Üniversite (7 ders)
- [x] `Quiz` bileşeni ve her derse alıştırma
- [x] Ön koşul zinciri ve "sonraki ders" gezinmesi
- [x] İlerleme takibi (tarayıcı belleğinde, hesap yok)
- [x] Ana sayfa ve seviye giriş sayfaları

**Çıktı:** ~14 dersle, gerçekten öğreten bir kinematik kursu. **Staj için
gösterilecek sürüm bu.**

---

## Faz 2 — Planlama ve temeller

**Güncel durum notu (2026-08-10):** Aşağıdaki tarihli faz notları o günkü
teslim durumunu kaydeder. Sonraki kararla korpustaki taslaklar yayına alındı
ve insan incelemesi yayın için opsiyonel oldu; güncel politika `docs/06`'dadır.

- [x] A*, RRT, RRT* TypeScript portu + Web Worker
- [x] `PlannerRace` bileşeni — algoritmaları aynı sahnede yarıştır
- [x] Kullanıcı kendi engel düzenini kurabilsin
- [x] Hat C tamamı (3 seviye, 11 ders; faz kapanışında taslaktı, sonra yayımlandı)
- [x] Hat A tamamı (3 seviye, 14 ders; faz kapanışında taslaktı, sonra yayımlandı)

**Çıktı:** Üç hat yayında. Site artık "bir kaynak" sayılır.

**Not (2026-08-01):** "Yayında" burada teknik anlamda — dosyalar `content/`
altında, testler/build/lint temiz, `durum: taslak`. Faz 1'deki gibi
(`docs/durum-denetim.md`), `durum: yayinda` işaretlemesi ve insan incelemesi
o tarihte ayrı bir adım olarak planlanmıştı; bu kural 2026-08-10'da yukarıdaki
güncel durum notuyla değişti. RRT/RRT* Python fixture'ına karşı bit-bit
doğrulanamadı (RNG farkı) — bunun yerine özellik testleriyle doğrulandı,
bkz. `lib/robotics/planners/rrt.test.ts` başındaki not. `new Worker(new
URL(...))` deseni bu projede (Next 16.2, hem Turbopack hem webpack) güvenilir
çalışmadı — gerçek planlayıcı kodu derlenen worker chunk'ına hiç girmiyordu;
çözüm `scripts/build-worker.mjs` ile esbuild üzerinden elle, önceden
derleyip `public/workers/` altına koymak oldu (bkz. o script'in yorumu).

---

## Faz 3 — Programlama ve simülasyon

- [x] Pyodide entegrasyonu, `CodeRunner` bileşeni
- [x] Blok tabanlı editör (ortaokul seviyesi için)
- [x] Hat D tamamı — robot dilleri (RAPID, KRL, Mecademic, ROS 2) — 11 ders
- [x] Hat G tamamı — simülasyon ve dijital ikiz — 8 ders
- [x] İndirilebilir Python alıştırma deposu — `reference-python/` zaten
      vardı, öğrenci odaklı alıştırma bölümü eklendi

**Çıktı:** Öğrenci artık gerçekten kod yazıyor.

**Not (2026-08-02):** Faz 2'deki gibi, "tamamlandı" burada teknik anlamda —
19 yeni dosya (10 Hat D + 8 Hat G + 1 altyapı) `durum: taslak`, testler/
build/lint temizdi. Yayın ve insan incelemesi o tarihte ayrı bir adım olarak
planlanmıştı; güncel opsiyonel inceleme politikası için yukarıdaki nota ve
`docs/durum-denetim.md` Faz 3 bölümü.

---

## Faz 4 — Endüstriyel gerçeklik

- [x] Hat E — haberleşme (protokol simülasyonları, zamanlama görselleştirmesi) — 10 ders
- [x] Hat F — algılama (kamera, lazer profil sensörü, tarama yolu üretimi) — 11 ders

**Çıktı:** Sahada çalışan bir mühendisin de işine yarayan içerik.

**Not (2026-08-02):** Hat E için yeni bir bileşen (`SignalTimeline`)
eklendi — sinyal/zamanlama sahnesi, ortaokuldan üniversiteye üç seviyede
de kullanılıyor. 10 ders `durum: taslak`; `docs/durum-denetim.md` Faz 4
bölümüne bkz.

**Not (2026-08-03):** Hat F için üç yeni bileşen eklendi (`PixelToWorld`,
`ThresholdViewer`, `ScanPath`) — kamera/piksel-mm kalibrasyonu, eşikleme
ve lazer tarama sahneleri. 11 ders (ortaokul 2, lise 3, üniversite 6)
`durum: taslak`; `docs/durum-denetim.md` Faz 4 bölümüne bkz. Faz 4 artık
tamamen bitti.

---

## Faz 5 — v1.0

- [x] Hat H — güvenlik ve standartlar (10 ders + `SafetyZone` bileşeni +
      `lib/robotics/safety.ts`)
- [x] Arama — `scripts/build-search-index.ts` → `public/arama-index.json`,
      `app/ara/page.tsx` tembel yükleyip filtreler; Türkçe karakter yazmadan
      da eşleşir (`lib/arama.ts`)
- [x] Sözlük (terimlerin Türkçe-İngilizce karşılıkları) — `app/sozluk/page.tsx`,
      72 terim `content/sozluk.json` içinde veri olarak
- [x] Katkı süreci resmileştirilir (şablon, PR akışı, inceleme rolleri
      genişletilir) — `CONTRIBUTING.md`, `SECURITY.md`,
      `.github/pull_request_template.md`. Not: proje zaten Faz 0'dan itibaren
      açık kaynak ve dış katkıya açık yapıda kuruldu (bkz.
      `06-kalite-ve-topluluk.md`); burada yapılan sadece süreci büyütmek
- [x] Erişilebilirlik denetimi — Lighthouse erişilebilirlik puanı denetlenen
      her sayfada **100**. Bulgular ve düzeltmeleri `docs/durum-denetim.md`
- [x] Performans denetimi — **kısmi.** 3D sahnesi olmayan sayfalar hedefte
      (perf 95-99, FCP 0,8 sn, CLS 0). 3D sahnesi olan ders sayfaları
      hedefin altında (perf ~73-76); ilk yükleme JS bütçesi 434 → 197 KB
      indirildi ama emüle mobil CPU'da three.js çalıştırması ~1 sn ana
      thread tutuyor. Ayrıntı ve açık madde `docs/durum-denetim.md`

---

## Bir sonraki sprint — contentVersion entegrasyonu + TransferChallenge predicate sertleştirmesi

**Amaç:** hazırlanmış kanıt hash altyapısını canlı Evidence sürüm sözleşmesine
bağlamak; “hash hesaplanabiliyor” durumunu “eski kanıt gerçekten geçersizleşiyor”
durumuna taşımak.

- [ ] Ders sayfasındaki `contentVersion`ı yalnız `teachingHash` yerine
      `computeEvidenceVersionRoot({ teachingHash, interactionHash,
      predicateHash })` sonucuna bağla. Bileşen, motor, robot spec, worker veya
      predicate sürümü değişince eski `passed` kaydı güncel sayılmamalı.
- [ ] `Quiz`, `PredictionPrompt` ve özellikle `TransferChallenge` bileşenlerini
      Evidence üreten bağımlılıklar olarak interaction manifest kapsamına al;
      ortak `lib/quiz.ts` karıştırma motorunu da hash'e kat.
- [ ] `TransferChallenge` assessment olayına kararlı challenge revizyonu ve
      seçenek kimliği ekle. Predicate yalnız `result: success` ve görüntülenen
      indexe güvenmemeli; beklenen challenge sürümünü doğrulamalı.
- [ ] Golden/negatif ve stale-version testleri ekle: doğru challenge + deney
      geçer; yanlış cevap, eski challenge revizyonu, uydurma success veya eski
      interaction/predicate kökü geçmez. Evidence dışa/içe aktarma stale ayrımı
      birleşik kökle doğrulanmalı.

**Bitti ölçütü:** canlı `LessonEvidenceProvider` birleşik kökü kullanıyor;
`TransferChallenge` veya `lib/quiz.ts` değişikliği eski kanıtı güncel göstermiyor;
testler bu davranışı kaynak kodu değişikliği simülasyonuyla kanıtlıyor.

---

## Sürekli işler (her fazda)

- Her ders için `kaynaklar` doldurulmuş mu kontrolü
- Ön koşul grafiğinin doğrulanması (`npm run validate-content-graph`) —
  döngü, eksik referans, kopuk düğüm kontrolü (bkz. `docs/09-ai-muhendisligi.md` bölüm 5)
- Gizlilik gözden geçirmesi: yayınlanan hiçbir şey iş yeri kaynaklı olmasın
- Mobil test
- Bir arkadaşa okutup "anladın mı" testi

---

## Riskler

| Risk | Etki | Önlem |
|---|---|---|
| İçerik yazımı kodlamadan yavaş | Yüksek | Faz başına ders sayısını az tut, kaliteyi düşürme |
| 3D performansı mobilde kötü | Orta | Basit geometri, düşük çokgen, erken test |
| Kapsam sürekli büyüyor | Yüksek | Yeni fikir → `docs/fikirler.md`, faza girmez |
| Gizlilik ihlali | Kritik | `kaynaklar` zorunlu, CI kontrolü, şüphede yayınlama |
| Motivasyon düşüşü (uzun proje) | Yüksek | Her faz yayınlanabilir; küçük ve sık kazanç |
| TS portunda matematik hatası | Orta | Python fixture'larına karşı test |
