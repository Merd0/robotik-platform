# AI mühendisliği pratikleri

Bu doküman "daha iyi nasıl çalışırız" sorusuna cevap verir — proje İÇERİĞİ değil,
proje ÜRETİM SÜRECİ hakkında. Amaç: token verimli, sürdürülebilir, kendi
kendini denetleyen bir çalışma şekli kurmak. Kavramlar Claude Code'un güncel
belgelerinden doğrulandı (tahmini/eski bilgi değil).

Bunların hiçbiri bir kerede kurulmuyor. Her biri, ilgili faza geldiğimizde,
tek tek ve anlayarak devreye alınır. Aşağıda hem ne olduğu hem de HANGİ
FAZDA devreye gireceği yazıyor.

---

## 1. Neden bağlam (context) bir kaynak gibi düşünülmeli

Her Claude Code oturumu, sıfırlanmış bir bağlam penceresiyle başlar.
`CLAUDE.md` her oturumda otomatik okunur — bu rahatlık, ama bir bedeli var:
ne kadar uzarsa o kadar çok token yer kaplar VE talimatlara uyum düşer (200
satırın altı önerilir). Yani "her şeyi tek dev dosyaya yaz" en kötü strateji.

Doğru zihniyet: **her bilgi parçası, sadece gerektiğinde bağlama girsin.**
Bunu sağlayan üç katman var, aşağıda sırayla.

### 1.1 Katmanlı CLAUDE.md (nested memory)

Claude Code, çalışma dizininden yukarı doğru her klasörü tarayıp `CLAUDE.md`
dosyalarını **oturum başında tam olarak** yükler. Ama çalışma dizininin
ALTINDAKİ alt klasörlerde bulunan `CLAUDE.md` dosyaları farklı davranır:
**Claude o alt klasördeki bir dosyayı okuduğu anda** yüklenir, oturum başında
değil.

Bunun pratik sonucu: kök `robotik-platform/CLAUDE.md` küçük ve evrensel kalır.
Sadece o klasörle ilgili kurallar, o klasörün kendi `CLAUDE.md`'sine gider ve
sadece o klasörde çalışırken bağlama girer.

**Bu proje için planlanan katmanlar:**

```
robotik-platform/
├── CLAUDE.md                      # evrensel: 8-9 satır, her oturumda yüklü
├── content/CLAUDE.md               # ders yazma kuralları, sadece içerik yazarken yüklü
├── lib/robotics/CLAUDE.md          # "asla DOM/React import etme" kuralı, sadece o dizinde yüklü
└── reference-python/CLAUDE.md      # zaten var, eski projenin kendi kuralları
```

**Ne zaman kuruyoruz:** Faz 0'da `content/` ve `lib/robotics/` klasörleri
oluşunca hemen. Maliyeti yok, sadece doğru dosyalama alışkanlığı.

### 1.2 `.claude/rules/` — dosya türüne bağlı kurallar

Büyüyen projelerde, kuralları tek dosyaya yığmak yerine konu başına ayrı
dosyalara bölüp, `paths:` alanıyla hangi dosyalarla çalışırken yükleneceğini
belirtebiliyoruz. Örneğin:

```yaml
---
paths:
  - "content/**/*.mdx"
---
# İçerik kuralları
- Her ders kaynaklar alanı dolu olmadan yayinda olamaz
- ...
```

Bu, ders dosyalarıyla çalışılmadığı sürece bağlama hiç girmez.

**Ne zaman kuruyoruz:** Faz 1'de, `docs/04-icerik-rehberi.md`'deki kuralları
tekrar tekrar hatırlatmak yerine buraya taşıyacağız.

### 1.3 Auto memory — Claude'un kendi kendine tuttuğu notlar

CLAUDE.md'nin yanında bir de "auto memory" var: Claude, senin düzeltmelerinden
ve tercihlerinden kendi notlarını tutar (`~/.claude/projects/.../memory/`).
Sen yazmıyorsun, Claude yazıyor — "bu komutu hep böyle çalıştır" gibi
kalıcı öğrenmeleri kendi biriktiriyor. Bunu biz kurmuyoruz, kendiliğinden
işliyor; bilmen yeterli.

### 1.4 `.agents/` — aynalanan ajan yapılandırması, otomatik senkron YOK

Depoda `.claude/` dışında iki ajan yapılandırma dizini daha var: `.codex/`
(Codex karşılığı, TOML biçiminde) ve `.agents/`. `.agents/`, `.claude/`'un
birebir aynası olarak tutuluyor — aynı skill, aynı iki ajan tanımı, aynı
`rules/content.md`, aynı frontmatter hook'u.

İki uyarı:

- **`.agents/` dizinini hangi aracın okuduğu bilinmiyor ve belgeli değil.**
  Depoda hiçbir yerde (bu dosya dahil `docs/`, `CLAUDE.md`, `AGENTS.md`,
  `.gitignore`) tüketicisi tanımlı değil. Tam aynalama bilinçli bir karardı,
  ama bir çalışma zamanının onu gerçekten okuduğu doğrulanmış değil.
- **Otomatik senkron yok.** `.claude/` altında bir kural, hook, skill veya
  ajan tanımı değiştiğinde `.agents/` **elle** güncellenmeli. Şu an aynı
  içerik iki yerde birden duruyor; bunu koruyan bir CI kontrolü veya script
  yok, sapma sessizce oluşur.

Pratik sonuç: `.claude/` altında bir şey değiştirdiğinde `.agents/`
karşılığını da güncelle, yoksa iki dizin zamanla birbirinden ayrışır ve
hangisinin geçerli olduğu belirsizleşir.

---

## 2. Subagent'lar — işi ayrı bir bağlamda yapıp özet döndürme

Bir subagent, kendi sıfır bağlamıyla başlayan, kendi araç kısıtlamalarına
sahip, işi bitirince SADECE ÖZET döndüren bir alt-çalışan. Ana bağlamı
şişirecek (uzun log, çok sayıda arama sonucu, ayrıntılı deneme-yanılma)
işleri buraya taşımak, ana konuşmayı temiz tutar.

### Bu proje için tanımlanacak üç subagent

**`fixture-generator`** (Faz 0 sonunda)
Python referans kodunu (`reference-python/`) çalıştırıp TypeScript
testlerinin karşılaştıracağı doğrulama verilerini (JSON fixture) üretir.
Ayrıntılı çalıştırma çıktısı kendi bağlamında kalır, ana konuşmaya
"38 fixture üretildi, hepsi tutarlı" gibi bir özet döner.

```yaml
---
name: fixture-generator
description: Python referans kodunu calistirip TypeScript testleri icin dogrulama fixture'lari uretir. FK/IK/planlayici sonuclarini JSON olarak reference-python/fixtures/ altina yazar.
tools: Read, Bash, Write
model: sonnet
---
Python referans kodundaki (reference-python/) fonksiyonlari bilinen girdilerle
calistir, sonuclari JSON fixture olarak reference-python/fixtures/ altina yaz.
Her fixture: girdi, beklenen cikti, tolerans. Islem bitince kac fixture
uretildigini ve hepsinin makul (NaN/inf yok) oldugunu ozetle.
```

**`ders-yazari`** (Faz 1'de, ilk ders yazımına başlarken)
Bir dersin taslağını, kaynak aramasını ve örnek üretimini kendi bağlamında
yapar. `docs/04-icerik-rehberi.md`'deki şablona ve `docs/06`'daki kaynak
zorunluluğuna sıkı sıkıya uyar. Sonuçta tek bir `.mdx` dosyası döner.

**`kalite-denetci`** (Faz 1'de, ilk ders taslağı çıkınca)
Yazılmış bir dersi, kaynaklarıyla satır satır karşılaştırıp
`docs/06-kalite-ve-topluluk.md`'deki üç katmanlı doğrulamayı uygular.
Salt-okunur (Read, Grep, WebFetch — Edit/Write yok), çünkü onun işi
düzeltmek değil, bulguyu raporlamak. Sonunda insan (sen) son kararı verir.

```yaml
---
name: kalite-denetci
description: Yazilmis bir dersi kaynaklariyla karsilastirip dogruluk kontrolu yapar. Duzeltme yapmaz, sadece bulgu raporlar.
tools: Read, Grep, WebFetch
model: sonnet
---
Verilen ders dosyasini oku. kaynaklar alanindaki her kaynagi ac, derste
yazilan her teknik iddiayi kaynakla karsilastir. Uyusmayan, abartili veya
kaynaksiz iddiaları listele. Sayisal ornekleri (aci, mesafe vb.) reference-python
fixture'lariyla karsilastir. Duzeltme yapma, sadece bulgu listesi don.
```

**Neden hepsini şimdi kurmuyoruz:** Bir subagent'ı, o işi gerçekten birkaç kez
elle yaptıktan sonra tanımlamak daha iyi sonuç verir — önce "nasıl bir iş bu"
diye kendimiz görürüz, sonra o deneyimi subagent'ın sistem promptuna yazarız.
Erken tanımlanan subagent'lar genelde yeniden yazılıyor.

---

## 3. Skill'ler (özel komutlar) — tekrar eden işleri tek komutla çalıştırma

Bir skill, `.claude/skills/<isim>/SKILL.md` dosyası — `/isim` yazınca
çalışan, tekrar tekrar yazacağın uzun bir talimatı bir komuta sıkıştıran
mekanizma. (Not: bu özellik eskiden "custom commands" olarak biliniyordu,
şimdi "skills" adı altında birleşti; ikisi de aynı şekilde çalışıyor.)

### Bu proje için planlanan skill'ler

**`/yeni-ders`** (Faz 1'de)
`docs/04-icerik-rehberi.md`'deki şablonu, doğru frontmatter'la, doğru
klasöre (`content/<hat>/<seviye>/`) oluşturur.

```yaml
---
name: yeni-ders
description: Yeni bir ders dosyasi olusturur
disable-model-invocation: true
argument-hint: [hat] [seviye] [ders-id]
---
$0 hattinda, $1 seviyesinde, "$2" id'li yeni bir ders dosyasi olustur.
docs/04-icerik-rehberi.md'deki sablonu kullan. Dogru klasore
(content/$0/$1/) yerlestir. durum: taslak olarak basla.
```

**`/plan-durumu`** (Faz 0'dan itibaren)
`docs/03-yol-haritasi.md`'yi okuyup hangi fazda, hangi maddede olduğumuzu
özetler — her oturuma "nerede kalmıştık" diye başlamak yerine.

**Neden `disable-model-invocation: true`:** Bu ikisi yan etkili işlemler
(dosya oluşturma) — Claude'un kendiliğinden, sen istemeden tetiklememesi
gerekir. Sadece sen `/yeni-ders` yazınca çalışsın.

---

## 4. Hook'lar — "her zaman olsun" dediğin şeyi garantiye almak

CLAUDE.md bir *rica*: Claude okur, uymaya çalışır, ama garanti değil.
Hook ise bir *kural*: belirli bir olayda (dosya kaydedilirken, oturum
bitmeden önce) otomatik çalışan bir kabuk komutu. Claude ne düşünürse
düşünsün çalışır — reddedebilir bile.

### Bu proje için planlanan hook

**Kaynak zorunluluğu kontrolü** (Faz 1'de kuruldu — `.claude/settings.json`
+ `.claude/hooks/check-lesson-frontmatter.mjs`)

`docs/06-kalite-ve-topluluk.md`'deki kural — `kaynaklar` boşken
`durum: yayinda` olamaz — artık "hatırlanması gereken bir kural" değil,
otomatik reddedilen bir durum:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/check-lesson-frontmatter.mjs\""
          }
        ]
      }
    ]
  }
}
```

Bash betiği yerine Node (`.mjs`) kullanıldı — proje zaten `gray-matter`'a
bağımlı, frontmatter'ı elle regex'lemek yerine aynı ayrıştırıcıyı burada da
kullanmak daha güvenilir. Script mantığı: eğer değiştirilen dosya
`content/**/*.mdx` ise VE (Write ise `content`, Edit ise mevcut dosya +
`old_string`→`new_string` uygulanarak yeniden kurulan) sonuç içerik
`durum: yayinda` yazıyorsa VE `kaynaklar` boşsa veya `incelendi_tarafindan`/
`incelendi_tarih` boşsa → çık kodu 2 (engelle), sebebini Claude'a bildir.

**Korumalı dosyalar** (Faz 0'da kurulabilir)
`reference-python/` klasörünün yanlışlıkla silinmesini/bozulmasını
engelleyen basit bir koruma — `docs/08-guvenlik-sertlestirme.md`'deki
"PR kontrol listesi" fikrinin yerel/otomatik hali.

**Neden hepsini şimdi kurmuyoruz:** Hook yazmak için önce "hangi hata tekrar
tekrar oluyor" diye görmek lazım. İlk birkaç dersi elle yazıp kontrol ettikten
sonra, gerçekten unutulan noktayı hook'a çeviririz.

---

## 5. "Graph dünyası" — ders bağımlılıklarını gerçek bir graph olarak doğrulamak

`docs/01-mufredat.md`'deki `onkosul:` (ön koşul) alanları aslında bir
**yönlü graph** tanımlıyor: her ders bir düğüm, her ön koşul bir kenar.
Bunu "yorumla anlaşılan bir liste" olmaktan çıkarıp gerçekten doğrulanan
bir veri yapısına çevirebiliriz.

### Ne demek bu somut olarak

`scripts/validate-content-graph.ts` adında bir script (Faz 2'de, ders
sayısı arttıkça değerli olmaya başlar):

- Tüm `content/**/*.mdx` dosyalarının `onkosul:` alanlarını okur
- Bir graph kurar (ders → ön koşulları)
- **Döngü var mı?** (A, B'nin ön koşulu; B, A'nın ön koşulu — böyle bir
  şey olursa öğrenci hiçbir zaman başlayamaz)
- **Kopuk düğüm var mı?** (hiçbir dersten erişilemeyen, "yetim" bir ders)
- **Ön koşulu olmayan bir dersin `seviye: universite` olması makul mü?**
  (muhtemelen değil — bir uyarı, hata değil)

Bu, ders sayısı 10-15'i geçtiğinde elle takip edilemez hale gelir; script
bunu saniyeler içinde kontrol eder. Aynı zamanda `docs/03-yol-haritasi.md`
"sürekli işler" listesine eklenir.

**Ne zaman kuruyoruz:** Faz 2'de, üç hat (A, B, C) tamamlanıp ders sayısı
gerçek bir graph'ı anlamlı kılacak kadar arttığında. Şimdiden kurmak
erken optimizasyon olur — henüz doğrulanacak yeterli düğüm yok.

---

## 6. Neyi şimdi yapıyoruz, neyi sonraya bırakıyoruz

| Pratik | Ne zaman | Neden o zaman |
|---|---|---|
| Katmanlı CLAUDE.md (`content/`, `lib/robotics/`) | Faz 0 | Klasörler zaten oluşuyor, maliyeti yok |
| `/plan-durumu` skill'i | Faz 0 | Her oturumda işe yarar, basit |
| `fixture-generator` subagent | Faz 0 sonu | Python↔TS doğrulaması tam o an gerekiyor |
| `.claude/rules/` (içerik kuralları) | **Kuruldu (Faz 2)** | `.claude/rules/content.md` — Faz 1'de planlanmıştı, fiilen Faz 2'de (25 yeni ders yazılırken) kuruldu |
| `/yeni-ders` skill'i | **Kuruldu (Faz 2)** | `.claude/skills/yeni-ders/SKILL.md` |
| `kalite-denetci` subagent'ı | **Kuruldu (Faz 1)** | `.claude/agents/kalite-denetci.md` — 14 derse karşı çalıştırıldı |
| `ders-yazari` subagent'ı | **Kuruldu (Faz 2)** | `.claude/agents/ders-yazari.md` — Faz 2'nin 25 dersi yine elle yazıldı (motor + bileşen doğruluğu için sıkı kontrol gerekiyordu), ama subagent artık sonraki fazlar için hazır |
| Kaynak-zorunluluğu hook'u | **Kuruldu (Faz 1)** | `.claude/hooks/check-lesson-frontmatter.mjs` |
| Graph doğrulama script'i | **Kuruldu (Faz 2)** | `scripts/validate-content-graph.ts` — 39 dersle (14+11+14) ilk kez anlamlı hale geldi |

Bu tabloyu `docs/03-yol-haritasi.md` ile birlikte oku — her faz bittiğinde
bu doküman da güncellenir, hangi pratiğin gerçekten işe yaradığı, hangisinin
gereksiz kaldığı not edilir.

---

## 7. Dal (branch) ve merge kuralı

Faz 1-4 boyunca her faz bir dalda bitirilip PR açılıyor, PR insan onayı
bekliyordu. Bu, tek kişilik bir projede fiilen bir gecikmeden başka bir şey
üretmedi: PR'ı açan da onaylayan da aynı kişiydi, ve gerçek kalite kapısı
zaten PR'ın kendisi değil, **otomatik kontroller + `durum: yayinda`
işaretlemesi** idi. Kural sadeleştirildi.

### Varsayılan: otomatik merge

Aşağıdaki kontrollerin **hepsi** temiz geçtiyse, PR açıp beklemeye gerek
yok — dal doğrudan `main`'e merge edilir:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run check-content
npm run validate-content-graph
npm run build
```

Yeni/değişen ders içeriği varsa buna **`kalite-denetci` subagent'ı** da
eklenir (mümkün olduğunda — bkz. bölüm 2). Denetçi bulgu raporlarsa,
bulgular düzeltilip kontroller tekrar koşulmadan merge edilmez.

Bunun güvenli olmasının dayanağı: bu kontroller `kaynaklar` zorunluluğunu,
ön koşul graph'ının bütünlüğünü, matematik testlerini ve build'i zaten
kapsıyor. Bir insanın PR ekranında yapacağı ek şey yok. `durum: yayinda`
işaretlemesi ayrı ve elle kalmaya devam ediyor (docs/06 Katman 3) — merge
edilmiş olmak "yayınlandı" demek değil.

### Tek istisna: yönetişim (governance) dosyaları

Şunlardan biri değişiyorsa otomatik merge YOK — dur ve kullanıcıya sor:

- `CONTRIBUTING.md`, `SECURITY.md`, PR/issue şablonları, `LICENSE`
- `CLAUDE.md` (kök veya klasör içi) ve `docs/` altındaki kural
  dokümanlarının kendisi
- `.claude/` altındaki kural/hook/subagent tanımları

Gerekçe: bunlar **kuralın kendisini** değiştiren dosyalar. Kodun kuralı
ihlal edip etmediğini otomatik kontroller yakalar; kuralın kendisinin
değişmesi gerekip gerekmediğini yakalayacak bir otomasyon yok. Bir ajanın
kendi üzerindeki kısıtları sessizce gevşetebilmesi istenmeyen bir yetki —
bu yüzden o kapı elle açılır.

Aynı dalda hem sıradan iş hem governance değişikliği varsa, istisna tüm
dala uygulanır (governance dosyasını ayırıp iki kez merge etmeye çalışma).
