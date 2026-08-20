import type { Metadata } from "next";
import Link from "next/link";
import { TeacherPilotActions } from "@/components/teacher/TeacherPilotActions";
import { TeacherPilotSwitcher } from "@/components/teacher/TeacherPilotSwitcher";
import { KOD_AKADEMISI_TEACHER_PILOT_MODULES, KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS } from "@/lib/teacherPilot";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Öğretmen pilotu · Kod Akademisi",
  description:
    "Kod Akademisi'ne 40 dakikalık giriş akışı, üç modüllük hazır sıra, yazdırılabilir çalışma kâğıdı ve yerel kanıt kontrol rehberi.",
};

const LESSON_FLOW = [
  {
    time: "0–8 dk",
    title: "1. modül · gözlem",
    teacher: "“İlk çalıştırma”yı aç. Kodu okumadan önce Çalıştır’a bastır. “Tek satır kod robotu nasıl hareket ettirdi?” diye sor.",
    student: "Sonuç panelindeki eklem açılarını ve TCP koordinatlarını okur; çalışma kâğıdına neyin değiştiğini yazar.",
  },
  {
    time: "8–20 dk",
    title: "2. modül · ilk düzenleme",
    teacher: "“Değeri değiştir”e geç. Öğrencileri ikili gruplara ayır. `aci_1`in ne işe yaradığını sorup değiştirmeden önce tahmin ettir.",
    student: "`aci_1 = 60` yazıp çalıştırır, robotun birinci ekleminin döndüğünü gözler. “Tamamlandı ✓” görene kadar dener; istenirse ipucu açar.",
  },
  {
    time: "20–30 dk",
    title: "3. modül · sıfırdan yaz",
    teacher: "“Açıkla, sonra uygula”ya geç — editör artık BOŞ. `movej()`in liste beklediğini hatırlat, ama açık cevabı verme; ipucu kademelerini göster.",
    student: "Hedef açılara (`J1=90°, J2=-60°`) götürecek `robot.movej([...])` satırını sıfırdan yazar ve “Tamamlandı ✓” alana kadar dener.",
  },
  {
    time: "30–40 dk",
    title: "Kapanış · kanıtı dışa aktar",
    teacher: "Üç modülden en az ikisinde “Tamamlandı ✓” gören öğrenciyle sınıfça “kod ile robot arasındaki bağ” üzerine kısa bir tur yap. Yerel kayıttan JSON dışa aktarmayı göster.",
    student: "Sonuç cümlesini tamamlar. İstenirse deney kaydını indirir; hesap açmaz, ad girmez.",
  },
] as const;

export default function OgretmenKodAkademisiPage() {
  return (
    <main id="ana-icerik" data-ogretmen-kaynagi className={`${styles.page} min-h-screen bg-site-bg`}>
      <div className={`${styles.screenOnly} mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14`}>
        <nav className="flex items-center gap-2 text-sm text-site-muted">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Ana sayfa</Link>
          <span aria-hidden="true">/</span> Öğretmen pilotu · Kod Akademisi
        </nav>

        <div className="mt-4">
          <TeacherPilotSwitcher active="/ogretmen/kod-akademisi" />
        </div>

        <header className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[.16em] text-site-accent-text">Kod Akademisi · Temel · Öğretmen pilotu</p>
            <h1 className="mt-3 max-w-4xl font-heading text-4xl font-extrabold tracking-tight text-site-ink sm:text-6xl">
              Okumadan önce çalıştır.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-site-muted">
              Bu kaynakla Kod Akademisi’ne ilk girişi 40 dakikada gözlem, ilk düzenleme ve sıfırdan yazmaya çevirirsin. Sunum hazırlaman veya öğrenci hesabı açman gerekmez.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-site-border bg-site-surface p-4 text-center">
            <div><dt className="text-xs text-site-muted">Süre</dt><dd className="mt-1 font-mono text-lg font-bold">40 dk</dd></div>
            <div><dt className="text-xs text-site-muted">Düzen</dt><dd className="mt-1 font-mono text-lg font-bold">Tekli</dd></div>
            <div><dt className="text-xs text-site-muted">Hesap</dt><dd className="mt-1 font-mono text-lg font-bold">Yok</dd></div>
          </dl>
        </header>

        <section aria-labelledby="neden-kod-akademisi" className="mt-12 rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Neden Kod Akademisi?</p>
          <h2 id="neden-kod-akademisi" className="mt-2 font-heading text-2xl font-bold">21 modülün ilk üçü, tek başına 40 dakikalık bir giriş dersi.</h2>
          <p className="mt-3 max-w-4xl leading-7 text-site-muted">
            Her modül gerçek Python’u, Pyodide üzerinden tarayıcıda çalıştırır ve sonucu robotta gösterir. İlk üç modül kademeli zorlaşır — önce izle, sonra bir değeri değiştir, sonra sıfırdan yaz — bu yüzden ekstra hazırlığa gerek kalmadan doğrudan sınıfa taşınabilir.
          </p>
        </section>

        <section aria-labelledby="hazirlik" className="mt-12 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="rounded-2xl border border-site-border bg-site-soft p-6">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Dersten önce · 3 dakika</p>
            <h2 id="hazirlik" className="mt-2 font-heading text-2xl font-bold">Üç şeyi hazırla.</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-site-muted">
              <li><strong className="text-site-ink">1.</strong> Aşağıdaki üç modül bağlantısını bir öğrenci cihazında sırayla dene.</li>
              <li><strong className="text-site-ink">2.</strong> Her öğrenci için bir çalışma kâğıdı yazdır.</li>
              <li><strong className="text-site-ink">3.</strong> Bu derste her öğrenci kendi cihazında çalışsın — kod yazmak bireysel bir eylem.</li>
            </ol>
          </div>

          <div className="rounded-2xl border-2 border-site-accent bg-site-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Öğrenciye verilecek üç modül bağlantısı</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Sırayla aç — her biri kendi başlangıç koduyla gelir</h2>
            <p className="mt-3 leading-7 text-site-muted">
              Üç modülün de kodu önceden hazır (ilk ikisinde) ya da bilinçli olarak boş (üçüncüsünde) — sahne kurmana gerek yok, öğrenci doğrudan Çalıştır’a basabilir.
            </p>
            <ol className="mt-5 space-y-4">
              {KOD_AKADEMISI_TEACHER_PILOT_MODULES.map((pilotModule, index) => (
                <li key={pilotModule.modul}>
                  <p className="text-sm font-semibold text-site-ink">{index + 1}. {pilotModule.baslik}</p>
                  <a href={KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS[index]} className="mt-1 block break-all rounded-xl bg-site-soft p-3 font-mono text-xs font-semibold leading-6 text-site-accent-text underline underline-offset-4">
                    {KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS[index]}
                  </a>
                  <div className="mt-2">
                    <TeacherPilotActions taskUrl={KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS[index]} showPrint={index === KOD_AKADEMISI_TEACHER_PILOT_MODULES.length - 1} />
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs leading-5 text-site-subtle">
              Bağlantılar sabit modül adresleridir, URL parçası taşımaz — ad, hesap veya cihaz bilgisi hiç içermezler.
            </p>
          </div>
        </section>

        <section aria-labelledby="ders-akisi" className="mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">40 dakikalık akış</p>
            <h2 id="ders-akisi" className="mt-2 font-heading text-3xl font-bold">Üç modül, kademeli özerklik.</h2>
            <p className="mt-3 leading-7 text-site-muted">Öğrenci önce yalnız izler, sonra tek bir sayıyı değiştirir, sonunda sıfırdan yazar. Her adımda “Tamamlandı ✓” banner’ı görünene kadar deneme hakkı sınırsız — “yanlış” değil “tekrar dene” mesajı verir.</p>
          </div>
          <ol className="mt-8 grid gap-4">
            {LESSON_FLOW.map((step, index) => (
              <li key={step.time} className="grid gap-4 rounded-2xl border border-site-border bg-site-surface p-5 sm:grid-cols-[8rem_1fr] sm:p-6">
                <div>
                  <span className="font-mono text-xs font-bold text-site-accent-text">0{index + 1}</span>
                  <p className="mt-1 font-mono text-sm font-bold text-site-ink">{step.time}</p>
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold">{step.title}</h3>
                  <dl className="mt-3 grid gap-3 text-sm leading-6 md:grid-cols-2">
                    <div className="rounded-xl bg-site-soft p-4"><dt className="font-semibold text-site-ink">Sen yap</dt><dd className="mt-1 text-site-muted">{step.teacher}</dd></div>
                    <div className="rounded-xl bg-site-soft p-4"><dt className="font-semibold text-site-ink">Öğrenci çıktısı</dt><dd className="mt-1 text-site-muted">{step.student}</dd></div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="kanit-rehberi" className="mt-16 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Kanıt Okuyucu · 3 adım</p>
            <h2 id="kanit-rehberi" className="mt-2 font-heading text-3xl font-bold">JSON’u puan gibi değil, deney izi gibi oku.</h2>
            <ol className="mt-6 space-y-5">
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">1</span><p className="leading-7 text-site-muted">Öğrenci son modülün altındaki <strong className="text-site-ink">JSON dışa aktar</strong> düğmesiyle <code>robotik-deney-kaydi-v2.json</code> dosyasını indirir — bu dosya, o oturumda dokunduğu TÜM modülleri içerir.</p></li>
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">2</span><p className="leading-7 text-site-muted"><Link href="/kanit-okuyucu" className="font-semibold text-site-accent-text underline underline-offset-4">Kanıt Okuyucu’yu aç</Link>. Dosyayı seç veya kesikli alana sürükle. Dosya bu sekmeden dışarı gönderilmez.</p></li>
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">3</span><div className="leading-7 text-site-muted"><p>İki ders satırını ayrı ayrı kontrol et:</p><ul className="mt-2 list-disc space-y-1 pl-5"><li><code>koda-temel-degisken-degistir</code> satırında kanıtlanmış beceri <code>koda-temel-degisken-degistir-v1</code></li><li><code>koda-temel-acikla-sonra-uygula</code> satırında kanıtlanmış beceri <code>koda-temel-acikla-sonra-uygula-v1</code></li></ul><p className="mt-2">İlk modülün (İlk çalıştırma) ölçülebilir bir predicate’i yok — orası bilinçli olarak yalnız gözlem, kanıt beklemiyorsun.</p></div></li>
            </ol>
            <p className="mt-5 rounded-xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-ink">
              “Tamamlandı ✓” banner’ını görmek tek başına yeterli değildir — asıl kanıt JSON’daki <code>passed</code> satırıdır. “Eski sürüm” ya da boş kanıtlanmış beceri alanı görürsen öğrenci modülü yeniden çalıştırır.
            </p>
          </div>

          <aside className="rounded-2xl border border-site-border bg-site-soft p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Gizlilik sınırı</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Platform öğrenci listesi tutmaz.</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-site-muted">
              <li>Hesap, giriş, e-posta ve öğretmen paneli yoktur.</li>
              <li>Deney kaydı öğrencinin tarayıcısında kalır.</li>
              <li>JSON dosyası ad içermez. Dosyanın hangi öğrenciye ait olduğunu sınıf içinde sen yönetirsin.</li>
              <li>Kanıt Okuyucu dosyayı yüklemez; yalnız açık sekmede inceler.</li>
            </ul>
          </aside>
        </section>
      </div>

      <section aria-labelledby="calisma-kagidi" className={styles.worksheet}>
        <header className="border-b border-current/20 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">Kod Akademisi · Temel modüller</p>
              <h2 id="calisma-kagidi" className="mt-1 font-heading text-3xl font-extrabold">İzle, değiştir, yaz.</h2>
            </div>
            <div className="text-sm leading-6"><p>Sınıf: __________</p><p>Ad (isteğe bağlı): __________</p></div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-site-muted">Her bölümü modülü çalıştırdıktan sonra doldur. Kısa ve gözlenebilir cümleler yaz.</p>
        </header>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <section aria-labelledby="modul1-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">01 · İLK ÇALIŞTIRMA</p>
            <h3 id="modul1-baslik" className="mt-1 font-heading text-xl font-bold">Ne değişti?</h3>
            <p className="mt-3 text-sm font-semibold">Çalıştırmadan önce: robotun duruşu nasıl olacak sence?</p>
            <div className={styles.answerLine} />
            <p className="mt-3 text-sm font-semibold">Çalıştırdıktan sonra: eklem açıları ve TCP ne oldu?</p>
            <div className={styles.answerLine} />
          </section>

          <section aria-labelledby="modul2-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">02 · DEĞERİ DEĞİŞTİR</p>
            <h3 id="modul2-baslik" className="mt-1 font-heading text-xl font-bold">Tek sayı, yeni hedef</h3>
            <p className="mt-3 text-sm leading-6"><code>aci_1</code>i 60 yapınca robotun birinci eklemi:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><span className={styles.checkBox} aria-hidden="true" /> 30 derece daha döndü</li>
              <li><span className={styles.checkBox} aria-hidden="true" /> aynı kaldı</li>
              <li><span className={styles.checkBox} aria-hidden="true" /> ikinci eklemi de değiştirdi</li>
            </ul>
            <p className="mt-3 text-sm font-semibold">Kaç denemede “Tamamlandı ✓” gördün?</p>
            <div className={styles.answerLine} />
          </section>

          <section aria-labelledby="modul3-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">03 · SIFIRDAN YAZ</p>
            <h3 id="modul3-baslik" className="mt-1 font-heading text-xl font-bold">Kendi satırın</h3>
            <p className="mt-3 text-sm font-semibold">Yazdığın satır:</p>
            <div className={styles.answerBox} />
            <p className="mt-3 text-sm font-semibold">İpucu açman gerekti mi? Kaç tanesini?</p>
            <div className={styles.answerLine} />
          </section>
        </div>

        <section className="mt-5 border-t border-current/20 pt-4" aria-label="Kapanış kontrolü">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p><span className={styles.checkBox} aria-hidden="true" /> Üç modülü de çalıştırdım.</p>
            <p><span className={styles.checkBox} aria-hidden="true" /> En az iki “Tamamlandı ✓” gördüm.</p>
            <p><span className={styles.checkBox} aria-hidden="true" /> Kod ile robot arasındaki bağı bir cümleyle anlatabilirim.</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-site-muted">Bu kâğıt sınıfta kalır. Dijital deney kaydı ad içermez ve yalnız öğrencinin tarayıcısında oluşur.</p>
        </section>
      </section>
    </main>
  );
}
