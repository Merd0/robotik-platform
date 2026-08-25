import type { Metadata } from "next";
import Link from "next/link";
import { TeacherPilotActions } from "@/components/teacher/TeacherPilotActions";
import { TeacherPilotSwitcher } from "@/components/teacher/TeacherPilotSwitcher";
import { TEACHER_PILOT_TASK_URL } from "@/lib/teacherPilot";
import styles from "./page.module.css";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Öğretmen pilotu · Hat B",
  description:
    "Hat B için 40 dakikalık ders akışı, önceden ayarlanmış öğrenci görevi, yazdırılabilir çalışma kâğıdı ve yerel kanıt kontrol rehberi.",
  path: "/ogretmen",
});

const LESSON_FLOW = [
  {
    time: "0–5 dk",
    title: "Giriş · önce tahmin",
    teacher: "Önceden ayarlanmış robot kolunu ekrana getir. Dirsek yönünü henüz değiştirme. “Aynı hedefe başka bir duruşla ulaşabilir mi?” diye sor.",
    student: "Çalışma kâğıdındaki ilk tahmini işaretler ve gerekçesini tek cümleyle yazar.",
  },
  {
    time: "5–25 dk",
    title: "Deney · çalıştır ve farkı gör",
    teacher: "Öğrencileri ikili ya da üçlü gruplara ayır. Her grupta bir kişi kontrolleri kullansın, bir kişi gözlemi okusun, bir kişi kâğıda yazsın. 8. dakikada rolleri değiştir.",
    student: "Dirsek yukarı ve dirsek aşağı duruşlarını karşılaştırır. Ardından meydan okumayı başlatıp bir ulaşılabilir, bir erişim dışı hedef kaydeder. Son kavram kontrolünü tamamlar.",
  },
  {
    time: "25–35 dk",
    title: "Tartışma · gözlemi savun",
    teacher: "Üç gruptan sonuç iste. “Uç nokta aynı kalırken ne değişti?”, “Erişim sınırını hangi gözlem gösterdi?” ve “Olay sayısı tek başına başarı mıdır?” sorularını sırayla aç.",
    student: "Tahminiyle gözlemini karşılaştırır. Sonucunu sahnedeki konum ve ulaşılabilirlik durumuyla destekler.",
  },
  {
    time: "35–40 dk",
    title: "Kapanış · kanıtı dışa aktar",
    teacher: "Her öğrenciden sonuç cümlesini tamamlamasını iste. Dersin altındaki yerel kayıt bölümünden JSON dışa aktarmayı göster.",
    student: "“Aynı hedef…” cümlesini tamamlar. İstenirse deney kaydını indirir; hesap açmaz ve ad girmez.",
  },
] as const;

export default function OgretmenPage() {
  return (
    <main id="ana-icerik" data-ogretmen-kaynagi className={`${styles.page} min-h-screen bg-site-bg`}>
      <div className={`${styles.screenOnly} mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14`}>
        <nav className="flex items-center gap-2 text-sm text-site-muted">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Ana sayfa</Link>
          <span aria-hidden="true">/</span> Öğretmen pilotu
        </nav>

        <div className="mt-4">
          <TeacherPilotSwitcher active="/ogretmen" />
        </div>

        <header className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[.16em] text-site-accent-text">Hat B · Lise · Öğretmen pilotu</p>
            <h1 className="mt-3 max-w-4xl font-heading text-4xl font-extrabold tracking-tight text-site-ink sm:text-6xl">
              Bir hedef, iki robot duruşu.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-site-muted">
              Bu kaynakla ters kinematiği 40 dakikada tahmin, deney, tartışma ve kanıt akışına çevirirsin. Sunum hazırlaman veya öğrenci hesabı açman gerekmez.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-site-border bg-site-surface p-4 text-center">
            <div><dt className="text-xs text-site-muted">Süre</dt><dd className="mt-1 font-mono text-lg font-bold">40 dk</dd></div>
            <div><dt className="text-xs text-site-muted">Düzen</dt><dd className="mt-1 font-mono text-lg font-bold">2–3 kişi</dd></div>
            <div><dt className="text-xs text-site-muted">Hesap</dt><dd className="mt-1 font-mono text-lg font-bold">Yok</dd></div>
          </dl>
        </header>

        <section aria-labelledby="neden-hat-b" className="mt-12 rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Neden Hat B?</p>
          <h2 id="neden-hat-b" className="mt-2 font-heading text-2xl font-bold">Pilot için en kısa güvenilir yol burada.</h2>
          <p className="mt-3 max-w-4xl leading-7 text-site-muted">
            <code>JointSliders</code> ve <code>IkTarget</code> için paylaşım, meydan okuma ve kanıt zinciri Sprint 2’de uçtan uca çalıştı. Bu yüzden ders süresini yeni bir aracı açıklamaya değil, öğrencinin aynı hedefi iki duruşla sınamasına ve gözlemini savunmasına ayırabilirsin.
          </p>
        </section>

        <section aria-labelledby="hazirlik" className="mt-12 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="rounded-2xl border border-site-border bg-site-soft p-6">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Dersten önce · 3 dakika</p>
            <h2 id="hazirlik" className="mt-2 font-heading text-2xl font-bold">Üç şeyi hazırla.</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-site-muted">
              <li><strong className="text-site-ink">1.</strong> Görev bağlantısını bir öğrenci cihazında aç.</li>
              <li><strong className="text-site-ink">2.</strong> Her öğrenci için bir çalışma kâğıdı yazdır.</li>
              <li><strong className="text-site-ink">3.</strong> Cihaz başına iki ya da üç öğrenci yerleştir.</li>
            </ol>
          </div>

          <div className="rounded-2xl border-2 border-site-accent bg-site-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Öğrenciye verilecek tek görev bağlantısı</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Önceden ayarlanmış IK sahnesi</h2>
            <p className="mt-3 leading-7 text-site-muted">
              Bağlantı, iki eklemli kolu ulaşılabilir bir hedefte ve dirsek yukarı duruşunda açar. Öğrenci önce tahmin eder; sonra dirseği değiştirir, erişim sınırını dener ve kavram kontrolünü tamamlar.
            </p>
            <a href={TEACHER_PILOT_TASK_URL} className="mt-5 block break-all rounded-xl bg-site-soft p-4 font-mono text-xs font-semibold leading-6 text-site-accent-text underline underline-offset-4">
              {TEACHER_PILOT_TASK_URL}
            </a>
            <div className="mt-5">
              <TeacherPilotActions taskUrl={TEACHER_PILOT_TASK_URL} />
            </div>
            <p className="mt-4 text-xs leading-5 text-site-subtle">
              URL parçası yalnız sahne ayarını taşır: robot, hedef, dirsek yönü ve çözücü. Ad, hesap veya cihaz bilgisi içermez.
            </p>
          </div>
        </section>

        <section aria-labelledby="ders-akisi" className="mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">40 dakikalık akış</p>
            <h2 id="ders-akisi" className="mt-2 font-heading text-3xl font-bold">Süreyi ekranda tut, açıklamayı kısa bırak.</h2>
            <p className="mt-3 leading-7 text-site-muted">Öğrenci önce bir iddia yazar. Sahneyi ancak bundan sonra çalıştırır. Tartışmada doğru cevabı değil, tahmin ile gözlem arasındaki farkı konuştur.</p>
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
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">1</span><p className="leading-7 text-site-muted">Öğrenci dersin sonundaki <strong className="text-site-ink">JSON dışa aktar</strong> düğmesiyle <code>robotik-deney-kaydi-v2.json</code> dosyasını indirir.</p></li>
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">2</span><p className="leading-7 text-site-muted"><Link href="/kanit-okuyucu" className="font-semibold text-site-accent-text underline underline-offset-4">Kanıt Okuyucu’yu aç</Link>. Dosyayı seç veya kesikli alana sürükle. Dosya bu sekmeden dışarı gönderilmez.</p></li>
              <li className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-site-ink font-mono text-xs font-bold text-site-surface">3</span><div className="leading-7 text-site-muted"><p>Şu üç işareti birlikte kontrol et:</p><ul className="mt-2 list-disc space-y-1 pl-5"><li><strong className="text-site-ink">Geçerli kanıt dosyası</strong></li><li>Ders satırında <code>b-lise-geometrik-ters-kinematik</code> ve <strong className="text-site-ink">güncel</strong> sürüm</li><li>Kanıtlanmış beceride <code>geometric-ik-boundary-v2</code></li></ul></div></li>
            </ol>
            <p className="mt-5 rounded-xl border border-warning-border bg-warning-surface p-4 text-sm leading-6 text-warning-ink">
              Çok olay görmek başarı anlamına gelmez. “Eski sürüm” ya da boş kanıtlanmış beceri alanı görürsen öğrenci görevi güncel bağlantıdan yeniden çalıştırır.
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
              <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">Hat B · Ters kinematik deneyi</p>
              <h2 id="calisma-kagidi" className="mt-1 font-heading text-3xl font-extrabold">Tahmin et, çalıştır, farkı gör.</h2>
            </div>
            <div className="text-sm leading-6"><p>Sınıf: __________</p><p>Masa / grup: __________</p></div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-site-muted">Önce tahmin bölümünü doldur. Sahneyi bundan sonra çalıştır. Kısa ve gözlenebilir cümleler yaz.</p>
        </header>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <section aria-labelledby="tahmin-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">01 · TAHMİN</p>
            <h3 id="tahmin-baslik" className="mt-1 font-heading text-xl font-bold">Dokunmadan önce</h3>
            <p className="mt-3 text-sm leading-6">Dirsek yönü değişince robotun ucu:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><span className={styles.checkBox} aria-hidden="true" /> aynı hedefte kalır</li>
              <li><span className={styles.checkBox} aria-hidden="true" /> başka noktaya gider</li>
              <li><span className={styles.checkBox} aria-hidden="true" /> hedefe ulaşamaz</li>
            </ul>
            <p className="mt-3 text-sm font-semibold">Neden?</p>
            <div className={styles.answerBox} />
          </section>

          <section aria-labelledby="gozlem-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">02 · GÖZLEM</p>
            <h3 id="gozlem-baslik" className="mt-1 font-heading text-xl font-bold">Sahneyi çalıştır</h3>
            <p className="mt-3 text-sm font-semibold">Dirsek yukarı duruşunda ne gördün?</p>
            <div className={styles.answerLine} />
            <p className="mt-3 text-sm font-semibold">Dirsek aşağı duruşunda ne değişti?</p>
            <div className={styles.answerLine} />
            <p className="mt-3 text-sm font-semibold">Ulaşılabilir hedef</p>
            <p className="mt-1 font-mono text-sm">x: ______ m · y: ______ m</p>
            <p className="mt-3 text-sm font-semibold">Erişim dışı hedef</p>
            <p className="mt-1 font-mono text-sm">x: ______ m · y: ______ m</p>
          </section>

          <section aria-labelledby="sonuc-baslik">
            <p className="font-mono text-xs font-bold text-site-accent-text">03 · SONUÇ</p>
            <h3 id="sonuc-baslik" className="mt-1 font-heading text-xl font-bold">Farkı açıkla</h3>
            <p className="mt-3 text-sm font-semibold">Aynı hedefe iki farklı duruşla ulaşılabilir, çünkü…</p>
            <div className={styles.answerBox} />
            <p className="mt-3 text-sm font-semibold">Tahminim ile gözlemim arasındaki fark:</p>
            <div className={styles.answerBox} />
          </section>
        </div>

        <section className="mt-5 border-t border-current/20 pt-4" aria-label="Kapanış kontrolü">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p><span className={styles.checkBox} aria-hidden="true" /> İki dirsek duruşunu denedim.</p>
            <p><span className={styles.checkBox} aria-hidden="true" /> Erişim sınırını gözledim.</p>
            <p><span className={styles.checkBox} aria-hidden="true" /> Son kavram kontrolünü tamamladım.</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-site-muted">Bu kâğıt sınıfta kalır. Dijital deney kaydı ad içermez ve yalnız öğrencinin tarayıcısında oluşur.</p>
        </section>
      </section>
    </main>
  );
}
