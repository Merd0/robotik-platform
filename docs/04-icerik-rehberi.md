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

## Kanca çeşitliliği (tekrar eden retorik kalıptan kaçınma)

Her dersin bir "kanca" ile açılması kural, ama **kancanın hep aynı retorik
şekle bürünmesi** ayrı bir sorun ve fark edilmesi zor çünkü her ders tek
başına makul görünür. Bir kalıp bir kez iyi çalışır, arka arkaya on dört kez
kullanılınca okuyucuya "hep aynı numara" hissi verir.

**Genel ilke: hiçbir açılış kalıbı arka arkaya tekrar etmez.** Kural belirli
bir kalıbı yasaklamak değil — herhangi bir retorik iskeletin sıradanlaşmasını
engellemek. Yasak liste tutmak işe yaramaz, çünkü bir kalıptan kaçınıldığında
yerini bir başkası alır ve o da aynı hızla aşınır.

Şimdiye kadar aşınmış, dolayısıyla özellikle dikkat isteyen iki iskelet:

- **"Ama...Peki...?"** — "[bir durum kur] → 'Ama/Ancak ...' (çelişki) →
  'Peki ...?' (soru ile bitir)."
- **"Çoğu kişi X sanır, aslında Y"** — "Çoğu kişi/mühendis [yaygın inanç]
  düşünür/sanır. Aslında/Gerçekte [düzeltme]." (Faz 3+4 denetiminde yeni
  40 dersin %25'inde çıktı, eski içerikte %5'ti — tam da "bir kalıptan
  kaçınınca yerini başkası alır" durumunun örneği.)

Bu ikisi yasak değil, **kotalı**: aşağıdaki ardışıklık kontrolüne tabidir ve
bir hat+seviye içinde baskın hale gelmemelidir.

Birbirinden gerçekten farklı açılış biçimleri kullanın — aşağıdakiler örnek,
tek liste değil:

- **Şaşırtıcı gözlem:** "Bir robotun kolu, aynı noktaya iki farklı şekilde
  uzanabilir. İkisi de doğru."
- **Mini senaryo:** "Kontrolör ekranında sadece altı sayı var: eklem
  açıları. Robot kolu hedefine ulaştı. Bu altı sayı nereden geldi?"
- **Yanlış cevap tuzağı:** "Çoğu kişi tekilliğe yaklaşınca robotun
  'yavaşladığını' düşünür. Aslında olan şey daha ilginç."
- **Doğrudan meydan okuma:** "Şu formülü ezbere uygulama — önce neden işe
  yaradığını gör."
- **Karşılaştırma açılışı:** "İki robot aynı hedefe gidiyor, biri 2 saniyede,
  diğeri 5 saniyede. İkisi de 'doğru' hareket ediyor."

### Ardışıklık kontrolü (yazarken uygulanır)

Bir ders yazılırken, aynı hat+seviyedeki **bir önceki 2-3 dersin kanca
cümlesine** bakılır. Şu üç durumdan biri varsa farklı bir açılış biçimi
seçilir:

1. Aynı retorik iskelet arka arkaya iki kez kullanılmışsa (hangi iskelet
   olduğu fark etmez — sadece yukarıdaki iki kalıp değil).
2. Açılış cümlesi neredeyse birebir aynı yapıdaysa ("Yeşil noktayı ...
   sürüklemeyi dene" gibi aynı emir kalıbının tekrarı).
3. Aynı hat+seviyedeki derslerin yarısından fazlası tek bir kalıpta
   toplanmışsa.

Kalıbın adını koyamıyorsanız şu testi uygulayın: iki kancayı yan yana koyup
ilk cümlelerin **gramer iskeletini** karşılaştırın. Konular farklı ama
iskelet aynıysa, tekrar var demektir.

Bu kontrol `kalite-denetci` subagent'ının denetim kapsamına da dahildir
(bkz. `06-kalite-ve-topluluk.md`) — sadece doğruluk değil, retorik çeşitlilik
de kontrol edilir. Denetçi belirli bir kalıbı değil, **kalıp dağılımını**
raporlar: hangi iskelet kaç derste, ardışık tekrar nerede.

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

## Üniversite seviyesinde gerçek koda bağlantı

Üniversite seviyesindeki bir dersin anlattığı formül/algoritma, bu
platformda (`lib/robotics/` altında) gerçekten çalışan bir
implementasyona karşılık geliyorsa, dersin sonuna (genelde "Dene"
bölümünden hemen önce veya sonra) TEK SATIRLIK bir "Kaynak kodu" satırı
eklenir: ilgili dosyanın/fonksiyonun GitHub linki
(`github.com/Merd0/robotik-platform` üzerinden, mümkünse satır
numarasıyla).

```
**Kaynak kodu:** [`computeJacobian`](https://github.com/Merd0/robotik-platform/blob/main/lib/robotics/kinematics.ts#L183)
```

Kurallar:

- **Uydurma link yazma.** Dersteki formül gerçekten o dosyada
  çalışmıyorsa (ör. henüz implementasyonu yoksa) bu satır hiç eklenmez
  — "yakında" veya varsayımsal bir link yerine, satırın kendisi
  atlanır.
- Tek satır — ders bunun için uzamaz, ekstra açıklama gerekmez, sadece
  bağlantı.
- Bu, Hat D'nin (robot programlama dilleri) kapsamlı, adım adım kod
  derslerinin yerine geçmez — Hat D ayrı kalır, bu sadece "bu formülü
  gerçekten çalıştıran kod burada" işaretidir.

## Ders ne zaman çok büyük

Şu işaretlerden biri varsa dersi böl:

- Süre 20 dakikayı geçiyorsa
- 3'ten fazla ön koşulu varsa
- 2'den fazla etkileşimli sahne varsa
- Kazanımları 4'ten fazlaysa