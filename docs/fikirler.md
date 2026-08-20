# Fikirler (henüz kapsamda değil)

Aklına gelen ama şu anki faza girmeyen her şey buraya. Kapsam kaymasını
önlemenin tek yolu bu.

- Robot kolu için sesli komut
- Kullanıcıların kendi robot tanımını yükleyebilmesi (URDF)
- Çoklu robot senaryoları (iki kol birlikte çalışıyor)
- Mobil robot / AGV hattı (kol dışı robotlar)
- Yarışma modu: en kısa yolu bulan öğrenci
- İngilizce çeviri
- Öğretmen paneli: sınıfa ödev verme

## 3B Robot Hücresi — doğrulama sonrası kilometre taşları

`/laboratuvar/robot-hucresi` için marka bağımsız 6R kol, gerçek DH/FK,
eklem limitleri, TCP/RPY telemetrisi ve üç kamera açısını içeren ilk dikey
dilim ayrı bir dalda geliştirildi. İkinci dilimde kapsül–kutu hareket örnekleme,
açıklanabilir ilk temas ve MoveJ/konumsal MoveL karşılaştırması eklendi. Bu
çalışma `/oyun-alani`ndaki 2B Kendi Robotun deneyinden bağımsız kalır; 2B deney
değiştirilmeden korunur.

- Kapsül–kutu örneklemesini robot öz-çarpışması ve swept-volume sürekli denetime
  yükselt; örnekler arası kaçırma payını hesaplayıp arayüzde raporla.
- Konumsal `MoveL` çözümünü takım yönelimini de izleyen tam poz IK'ye yükselt;
  hız/ivme/jerk profili uygulanmadan gerçek çevrim süresi iddiası verme.
- Program zaman çizelgesine sensör, tutucu ve bekleme koşulları ekle; oynatıcıyı
  durdur/devam ettir/tek adımla ilerlet kipleriyle gerçek devreye alma akışına
  yaklaştır.
- URDF içe aktarmayı ancak birim, eklem ekseni, limit ve görsel/çarpışma mesh'i
  için doğrulama sözleşmesi tasarlandıktan sonra aç.
- Öğretmenin hazırladığı hücreyi salt veri olarak URL ile paylaş; kod çalıştırma,
  harici mesh URL'si ve üretici kontrol programı dışa aktarma V1 kapsamına girmez.

## Kendi Robotun — sonraki gerçekçilik katmanları

- Bağlantı kalınlığı + motor gövdesi tanımıyla sürekli çarpışma/swept-volume
  provası; mevcut merkez çizgisi kontrolünün yerini almalı, üstüne sessizce
  eklenmemeli.
- Engel yerleştirme ve “öğretilen yol mu, planlayıcının bulduğu yol mu?”
  karşılaştırması. Aynı başlangıç/hedef için süre, eklem hareketi ve açıklanabilir
  ret nedenlerini yan yana gösterme.
- Eklem-uzayı ve Kartezyen interpolasyonu aynı iki öğretilmiş poz üzerinde
  hayalet robotlarla karşılaştırma; TCP'nin neden farklı bir eğri çizdiğini
  uygulamalı gösterme.
- Kütle, ağırlık merkezi ve payload girildiğinde statik tork zarfı. Dinamik
  doğruluk iddiasından önce üretici datası/atalet modeli zorunlu olmalı.
- Limit-duyarlı çalışma uzayı haritası: yalnız geometrik erişim çemberi yerine
  mekanik limitler ve öz-çarpışma nedeniyle gerçekten denenmiş bölgeleri
  açıklanabilir bir ısı haritasıyla gösterme.
- İki paylaşım bağlantısındaki robot programını “motion diff” olarak açıp hangi
  waypoint'in, sürenin veya limit payının değiştiğini öğretmen/öğrenci için
  görselleştirme.

## Kod Akademisi — iki plan arasında uzlaştırma kararı (2026-08-19)

docs/15 (Kod Akademisi, 4 aşamalı) uygulandı ve main'de.
docs/guncel-fikirler.md §13'te farklı, daha büyük kapsamlı (6
laboratuvar) bir alternatif Kod Akademisi planı var, uygulanmadı.
İkisi arasında ileride bir uzlaştırma/genişletme kararı gerekebilir —
docs/15'in devamı olarak mı büyütülür, yoksa §13 ayrı bir faz mı olur,
netleştirilmeli.

## Kod Akademisi — zincirleme proje anlatısı (2026-08-20, ertelendi)

docs/15'in "İkinci derinlik turu" kararı sırasında değerlendirildi:
modüller tek bir uzun anlatıya bağlanır ("aynı depo robotunun bir
haftası" gibi), her modül önceki modülün devamı olur. Bilinçli olarak
ERTELENDİ — bir gün önce bitirilen senaryo çeşitliliği turuyla (bkz.
docs/durum-denetim.md, 2026-08-20 "Kod Akademisi — yazarlık kalitesi
ve çeşitlilik turu") doğrudan çelişiyor: o turda komşu modüllerin FARKLI
sektör bağlamı kullanması bilinçli bir karardı ("hep aynı robot,
koymak için konulmuş" şikayetine cevaben). Sürekli tek anlatı bu kararı
geri sarar. İleride denenmek istenirse, mevcut 17+ modüle dokunmadan,
YENİ bir aşama veya paralel bir "hikaye modu" olarak ele alınmalı —
var olan modüllerin senaryo çeşitliliğini bozmadan.
