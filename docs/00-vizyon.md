# Vizyon ve konumlandırma

## Tek cümlelik tanım

Robotiği tarayıcıda oynayarak öğreten, ortaokuldan mühendis seviyesine kadar
kademeli ilerleyen, açık ve ücretsiz bir Türkçe kaynak.

## Neden bu var olmalı

Türkçe robotik kaynağı üç kategoriye sıkışmış durumda:

1. **MEB / meslek lisesi PDF modülleri** — doğru ama kuru, statik, 2000'ler formatında.
2. **Üniversite ders katalogları ve slaytlar** — akademik, bağlamsız, dersi almayan
   birine kapalı.
3. **Satıcı sayfaları ve hobi robotik siteleri** — ürün odaklı, kavram öğretmiyor.

İngilizce tarafta ise parçalar var ama dağınık: Northwestern'ın Modern Robotics
dersi (mükemmel müfredat, ağır matematik, video tabanlı), UAIbot gibi tarayıcıda
çalışan simülatörler (araç var, ders yok), tekil FK/IK hesaplayıcıları (tek konu).

**Boşluk:** seviyeli müfredat + tarayıcıda anında etkileşim + endüstriyel gerçeklik
(protokoller, robot dilleri, güvenlik) + Türkçe. Bu dördünün kesişiminde hiçbir şey yok.

## Kime hitap ediyor

| Seviye | Kim | Ne bekliyor |
|---|---|---|
| Ortaokul | 12-14 yaş, meraklı | Görsel, sezgisel, matematiksiz. "Vay be" hissi. |
| Lise | 15-18 yaş, mühendislik adayı | Trigonometri ve vektörle bağ kurma, basit Python. |
| Üniversite / mühendis | 18+, öğrenci veya sahada çalışan | Matris, DH, Jacobian, gerçek protokoller, üretim kodu. |

Seviye bir "kilit" değil, bir başlangıç noktası. Kullanıcı istediği seviyeden
girer, aynı konunun diğer seviyelerine geçebilir. Bir liseli, üniversite
seviyesindeki dersi merak edip açabilmeli.

## Tasarım ilkeleri

1. **Önce oyna, sonra oku.** Her ders etkileşimli bir sahneyle açılır. Metin,
   oynadıktan sonra "ne oldu"yu açıklar. Tersi değil.
2. **Kurulum yok.** Her şey tarayıcıda çalışır. İndirme, hesap, ödeme yok.
3. **Her kavramın karşılığı gerçek bir robotta gösterilir.** "Bu ABB'de RAPID'de
   şöyle yazılır, Mecademic'te şöyle" gibi. Kavram havada kalmaz.
4. **Türkçe ama terim kaçmaz.** Terimlerin Türkçesi kullanılır, ilk geçtiğinde
   İngilizcesi parantez içinde verilir: "ters kinematik (inverse kinematics)".
   Sektörde İngilizce konuşulduğu için öğrenci ikisini de bilmeli.
5. **Yanlış cevap ceza değil, geri bildirim.** Alıştırmalarda "yanlış" yerine
   "şuna dikkat et" denir.
6. **İçerik koddan ayrı.** Ders eklemek dosya eklemektir, kod yazmak değil.

## Ne DEĞİL (kapsam dışı)

- Sertifika, sınav, not verme sistemi değil.
- Gerçek robota bağlanan bir kontrol yazılımı değil (güvenlik ve sorumluluk riski).
- Kapsamlı bir robotik simülatörü değil (PyBullet/RoboDK'nın yerini almaz);
  öğretmek için yeterli sadeliktedir.
- Forum / sosyal ağ değil.
- Ücretli değil.

## Kritik kısıt: kaynak gizliliği

Bu proje savunma sanayinde çalışan biri tarafından yazılıyor. Bu yüzden **mutlak
kural**: platformdaki her teknik bilgi, herkese açık bir kaynağa dayanmalı
(üretici datasheet'i, resmi dokümantasyon, akademik yayın, standart metni).

Şunlar asla girmez: iş yerindeki kurulum detayları, hat konfigürasyonları,
entegrasyon yöntemleri, iç ağ yapısı, üretim süreçleri, proje isimleri, ekipman
envanteri.

Her ders dosyasının frontmatter'ında `kaynaklar:` alanı zorunludur. Kaynağı
gösterilemeyen bilgi yayınlanmaz. Şüphe varsa yayınlanmadan önce iş yerinde
danışılır.

## Başarı ölçütü

Bir yıl sonra: "robot kolu nasıl çalışır" diye Türkçe arayan bir lise öğrencisi
bu siteye düşsün, yarım saat oynasın, gerçekten anlamış olarak çıksın.
