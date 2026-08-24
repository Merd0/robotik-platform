import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Robotik laboratuvarları",
  description: "Robot hücresi, arıza teşhisi ve tarayıcıda çalışan diğer robotik deneylerini keşfet.",
};

const LABS = [
  {
    href: "/laboratuvar/robot-hucresi",
    eyebrow: "3B bütünleştirme",
    title: "Robot hücresini devreye al",
    description: "Altı eksenli kolu sür; rota, program sırası ve güvenli hız kararlarını aynı hücrede doğrula.",
    detail: "3B sahne · kinematik · capstone",
  },
  {
    href: "/laboratuvar/ariza-klinigi",
    eyebrow: "Teşhis deneyi",
    title: "Arıza Kliniği",
    description: "Gizli bir encoder, iletişim veya aktüatör arızasını sınırlı telemetriyle teşhis et.",
    detail: "Deterministik trace · güvenli ilk eylem",
  },
] as const;

export default function LabsPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-site-muted"><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Ana sayfa</Link> <span aria-hidden="true">/</span> Laboratuvarlar</nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Oku değil, dene</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Robotik kararlarını çalışan deneylerde sınayabilirsin.</h1>
          <p className="mt-4 text-lg leading-8 text-site-muted">Her laboratuvar tarayıcıda ve hesapsız çalışır. Sayılar ile grafikler simülasyonun gerçek hesaplarından gelir; gerçek robota komut gönderilmez.</p>
        </header>
        <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Yayındaki laboratuvarlar">
          {LABS.map((lab) => (
            <Link key={lab.href} href={lab.href} className="group flex min-h-72 flex-col rounded-3xl border border-site-border bg-site-surface p-6 transition-colors hover:border-site-accent">
              <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">{lab.eyebrow}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-site-ink">{lab.title}</h2>
              <p className="mt-3 text-base leading-7 text-site-muted">{lab.description}</p>
              <p className="mt-auto pt-8 text-xs font-semibold text-site-muted">{lab.detail}</p>
              <span className="mt-3 inline-flex min-h-11 items-center font-semibold text-site-ink underline decoration-site-accent underline-offset-4">Laboratuvarı aç →</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
