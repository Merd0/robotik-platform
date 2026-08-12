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
