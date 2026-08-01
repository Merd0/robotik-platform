# Yol haritası

Tarih değil, **faz** üzerinden ilerliyoruz. Her faz bir öncekinin üstüne kurulu
ve her fazın sonunda yayınlanabilir bir şey var.

Tek sabit tarih: **21 Ağustos 2026** — staj için gösterilecek bir şey olması
gereken gün. Faz 1'in sonu buraya denk gelecek şekilde planlandı. Yetişmezse
Faz 0'ın sonu bile gösterilebilir bir şeydir; panik yok.

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
- [ ] Vercel'e yayınlandı, gerçek URL'de çalışıyor

**Çıktı:** İnternette, telefondan açılabilen, tek dersi olan çalışan bir site.

---

## Faz 1 — Kinematik hattı tamamlanıyor

**Amaç:** bir konu, üç seviyede de eksiksiz. Seviye sisteminin işe yaradığını kanıtla.

- [ ] IK implementasyonu (analitik 2-DOF + sayısal genel)
- [ ] `IkTarget` bileşeni — hedefi sürükle, robot uzansın
- [ ] Jacobian ve tekillik görselleştirmesi
- [ ] Ders: B / Ortaokul (3 ders)
- [ ] Ders: B / Lise (4 ders)
- [ ] Ders: B / Üniversite (7 ders)
- [ ] `Quiz` bileşeni ve her derse alıştırma
- [ ] Ön koşul zinciri ve "sonraki ders" gezinmesi
- [ ] İlerleme takibi (tarayıcı belleğinde, hesap yok)
- [ ] Ana sayfa ve seviye giriş sayfaları

**Çıktı:** ~14 dersle, gerçekten öğreten bir kinematik kursu. **Staj için
gösterilecek sürüm bu.**

---

## Faz 2 — Planlama ve temeller

- [ ] A*, RRT, RRT* TypeScript portu + Web Worker
- [ ] `PlannerRace` bileşeni — algoritmaları aynı sahnede yarıştır
- [ ] Kullanıcı kendi engel düzenini kurabilsin
- [ ] Hat C tamamı (3 seviye, ~11 ders)
- [ ] Hat A tamamı (3 seviye, ~14 ders)

**Çıktı:** Üç hat yayında. Site artık "bir kaynak" sayılır.

---

## Faz 3 — Programlama ve simülasyon

- [ ] Pyodide entegrasyonu, `CodeRunner` bileşeni
- [ ] Blok tabanlı editör (ortaokul seviyesi için)
- [ ] Hat D tamamı — robot dilleri (RAPID, KRL, Mecademic, ROS 2)
- [ ] Hat G tamamı — simülasyon ve dijital ikiz
- [ ] İndirilebilir Python alıştırma deposu

**Çıktı:** Öğrenci artık gerçekten kod yazıyor.

---

## Faz 4 — Endüstriyel gerçeklik

- [ ] Hat E — haberleşme (protokol simülasyonları, zamanlama görselleştirmesi)
- [ ] Hat F — algılama (kamera, lazer profil sensörü, tarama yolu üretimi)

**Çıktı:** Sahada çalışan bir mühendisin de işine yarayan içerik.

---

## Faz 5 — v1.0

- [ ] Hat H — güvenlik ve standartlar
- [ ] Arama
- [ ] Sözlük (terimlerin Türkçe-İngilizce karşılıkları)
- [ ] Katkı süreci resmileştirilir (şablon, PR akışı, inceleme rolleri
      genişletilir) — not: proje zaten Faz 0'dan itibaren açık kaynak ve
      dış katkıya açık yapıda kuruldu (bkz. `06-kalite-ve-topluluk.md`);
      burada yapılan sadece süreci büyütmek
- [ ] Erişilebilirlik denetimi
- [ ] Performans denetimi

---

## Sürekli işler (her fazda)

- Her ders için `kaynaklar` doldurulmuş mu kontrolü
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
