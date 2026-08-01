# İçerik yazım rehberi

Bu proje uzun vadede kodla değil **içerikle** ayakta kalacak. Kötü yazılmış
100 ders, iyi yazılmış 20 dersten değersizdir. Bu dosya, ders yazarken
uyulacak kuralları tanımlar.

## Seviye kalibrasyonu

Aynı kavram, üç seviyede üç farklı şekilde anlatılır. Örnek: **ters kinematik**

**Ortaokul:** "Robotun eline 'şuraya git' diyorsun. Peki omuz ve dirsek kaç
derece dönmeli? Robot bunu kendi bulmalı. Bazen iki farklı yolu var — dirseğini
yukarı ya da aşağı kırarak aynı noktaya uzanabilir. Kaydırıcıyı oynat, dene."

**Lise:** "İki eklemli bir kolda, uç noktanın (x, y) konumunu biliyorsan,
kosinüs teoremiyle eklem açılarını bulabilirsin. İki çözüm çıkar çünkü kosinüs
hem pozitif hem negatif açı için aynı değeri verir. Formülü şu:  ..."

**Üniversite:** "Genel durumda ters kinematiğin kapalı form çözümü her robot
için yoktur. Sayısal yaklaşımda Jacobian'ın tersini (veya sözde-tersini)
kullanarak iteratif yaklaşırız. Tekillik yakınında Jacobian tekil hale gelir
ve çözüm patlar; sönümlü en küçük kareler (damped least squares) bunu
yumuşatır."

Kural: **ortaokulda formül yok, lisede formül var ama türetme yok, üniversitede
türetme ve sınırlar var.**

## Dil kuralları

- Sen dili kullan, siz değil. Samimi ama ciddiyetsiz değil.
- Terimin Türkçesini kullan, ilk geçtiğinde İngilizcesini parantez içinde ver:
  "tekillik (singularity)". Sonraki kullanımlarda sadece Türkçe.
- Cümleler kısa. Bir cümlede bir fikir.
- Pasif çatıdan kaçın: "hesaplanır" yerine "hesaplarsın".
- Abartı yok: "inanılmaz", "muhteşem", "çok kolay" kullanma. "Çok kolay" diyip
  öğrenci anlamazsa, kendini aptal hisseder.
- Ünlem işareti neredeyse hiç.

## Ders şablonu

```mdx
---
id: ...
baslik: ...
hat: ...
seviye: ...
sure: ...
onkosul: [...]
kazanimlar: [...]
kaynaklar: [...]
etkilesimli: [...]
durum: taslak
---

## Kanca

Bir soru veya şaşırtıcı gözlem. 2-3 cümle. Okuyucu "hı, gerçekten neden?"
demeli.

<JointSliders robot="generic-2dof" />

## Ne oldu

Az önce oynadığın şeyin açıklaması. Seviyeye uygun derinlikte.

## Gerçek dünyada

Bu kavram hangi robotta nasıl karşımıza çıkar. Somut örnek, marka ve model
adıyla. Kaynak göster.

## Dene

<Quiz
  sorular={[
    { soru: "...", secenekler: [...], dogru: 1, aciklama: "..." }
  ]}
/>

## Sonraki

- Bir üst seviye: [...]
- İlgili: [...]
```

## Etkileşimli sahne kuralları

- Her sahne **tek bir şey** öğretmeli. İki kavram = iki sahne.
- Varsayılan durum anlamlı olmalı; kullanıcı hiçbir şeye dokunmadan da
  bir şey görmeli.
- "Sıfırla" düğmesi her zaman olsun.
- Kullanıcı sahneyi bozamamalı (robot ekrandan çıkmamalı, kamera kaybolmamalı).
- Sayılar ekranda gösterilirken yuvarlanmalı (3 ondalık yeter).
- Yükleme 1 saniyeden uzun sürecekse iskelet (skeleton) göster.

## Alıştırma kuralları

- Soru, dersteki etkileşimli sahneyle çözülebilmeli — ezber sorma.
- Yanlış cevapta doğruyu söyleme, ipucu ver: "Dirsek açısını değiştirmeden
  omzu döndürsen uç nokta nereye giderdi?"
- 2-4 soru yeter. Fazlası sıkar.

## Kaynak gösterme kuralı

Her ders en az bir kaynak listelemeli. Kabul edilen kaynaklar:

- Üretici teknik veri sayfaları ve resmi dokümantasyon (URL ile)
- Ders kitapları (yazar, kitap, bölüm)
- Akademik yayınlar (DOI veya arXiv)
- Standart metinleri (ISO numarası)

**Kabul edilmeyen:** "iş yerinde gördüm", "bize öyle anlattılar", kaynağı
belirsiz bloglar, forum gönderileri.

Bu kural hem akademik dürüstlük hem de gizlilik koruması. Kaynağı
gösterilemeyen bilgi yayınlanmaz.

## Ders yazma iş akışı

1. `content/<hat>/<seviye>/<id>.mdx` dosyasını şablondan oluştur
2. Önce `kazanimlar` yaz — bu ders bitince öğrenci ne yapabilecek
3. Kancayı yaz
4. Hangi etkileşimli bileşenin gerektiğini belirle; yoksa önce onu yaz
5. Açıklamayı yaz
6. Alıştırmaları yaz
7. `durum: inceleme` yap
8. Yüksek sesle oku — takıldığın her cümle yeniden yazılmalı
9. Mümkünse hedef seviyeden birine okut
10. `durum: yayinda`

## Ders ne zaman çok büyük

Şu işaretlerden biri varsa dersi böl:

- Süre 20 dakikayı geçiyorsa
- 3'ten fazla ön koşulu varsa
- 2'den fazla etkileşimli sahne varsa
- Kazanımları 4'ten fazlaysa
