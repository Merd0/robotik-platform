import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, pageCollectionJsonLd } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Robotik laboratuvarları",
  description: "Robot hücresi, arıza teşhisi ve tarayıcıda çalışan diğer robotik deneylerini keşfet.",
  path: "/laboratuvar",
});

interface Lab {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
}

interface LabCategory {
  id: string;
  title: string;
  description: string;
  labs: readonly Lab[];
}

const CATEGORIES: readonly LabCategory[] = [
  {
    id: "teshis",
    title: "Teşhis laboratuvarları",
    description: "Bir şey ters gitmiş; sınırlı veriyle kök nedeni bul.",
    labs: [
      {
        href: "/laboratuvar/ariza-klinigi",
        eyebrow: "Teşhis deneyi",
        title: "Arıza Kliniği",
        description: "Gizli bir encoder, iletişim veya aktüatör arızasını sınırlı telemetriyle teşhis et.",
        detail: "Deterministik trace · güvenli ilk eylem",
      },
      {
        href: "/laboratuvar/hata-muzesi",
        eyebrow: "Küratörlü karşı örnekler",
        title: "Hata Müzesi",
        description: "Üç golden trace’i önce cazip bir yanlış yorumla, sonra onu gerçekten çürüten ölçümle yeniden oku.",
        detail: "Yanlış zihinsel model · karşı kanıt · güvenli sıra",
      },
      {
        href: "/laboratuvar/dijital-ikiz-kaymasi",
        eyebrow: "Model–ölçüm senkronu",
        title: "Dijital İkiz Kayması",
        description: "İkiz tahmini ile sentetik fiziksel ölçüm arasındaki kalıcı farkı bul, yeniden kalibre et ve ayrı pozlarda doğrula.",
        detail: "TCP artığı · kalıcılık · bağımsız doğrulama",
      },
      {
        href: "/kirik-kod-laboratuvari",
        eyebrow: "Serbest deney",
        title: "Kırık Kod Laboratuvarı",
        description: "Gerçek, çalışan robot kodundaki yaygın hataları bul ve düzelt — her düzeltme gerçek Pyodide çalıştırmasıyla doğrulanır.",
        detail: "Kademeli ipucu · çözüm sonrası \"neden\" paneli",
      },
    ],
  },
  {
    id: "kinematik",
    title: "Kinematik deneyleri",
    description: "Eklem, hedef ve çalışma uzayı ilişkisini elleyerek keşfet.",
    labs: [
      {
        href: "/laboratuvar/ters-problem",
        eyebrow: "Çıktıdan girdiye",
        title: "Ters Problem Modu",
        description: "Sabit bir TCP hedefini üreten iki farklı eklem açısı çözümünü deneyerek bul.",
        detail: "Gerçek FK · çoklu IK çözümü",
      },
      {
        href: "/sinir-testi",
        eyebrow: "Serbest deney",
        title: "Sınır Testi",
        description: "Bir hedefin robot kolunun çalışma uzayına girip girmediğini tahmin et; gerçek cevap analitik ters kinematikle hesaplanır.",
        detail: "Tahmin et · gerçek IK sonucuyla karşılaştır",
      },
      {
        href: "/laboratuvar/robot-hucresi",
        eyebrow: "3B bütünleştirme",
        title: "Robot hücresini devreye al",
        description: "Altı eksenli kolu sür; rota, program sırası ve güvenli hız kararlarını aynı hücrede doğrula.",
        detail: "3B sahne · kinematik · capstone",
      },
    ],
  },
  {
    id: "karsilastirma",
    title: "Karşılaştırma ve keşif araçları",
    description: "Aynı bilginin farklı gösterimlerini yan yana koy.",
    labs: [
      {
        href: "/laboratuvar/dil-karsilastirici",
        eyebrow: "Vendor Rosetta",
        title: "Dil Karşılaştırıcı",
        description: "Aynı hareket niyetinin ABB RAPID ve Mecademic komutlarında nerede ayrıştığını karşılaştır.",
        detail: "MoveIntent · 5 ölçütlü semantik iz",
      },
      {
        href: "/robot-roportaji",
        eyebrow: "Serbest deney · devreye alma mülakatı",
        title: "Robot Röportajı",
        description: "Katalogdaki bir robota sorular sor; cevaplar gerçek RobotSpec verisinden ve üretici kaynağından gelir.",
        detail: "Jenerik robot marka uydurmaz · kaynağı olmayan sayı söylemez",
      },
      {
        href: "/bilgi-haritasi",
        eyebrow: "Robotics Knowledge Graph",
        title: "Bilgi Haritası",
        description: "Robotik dersleri, sözlük terimleri, laboratuvarları ve Kod Akademisi modüllerini önkoşul ve içerik ilişkileriyle keşfet.",
        detail: "206 düğüm · gerçek katalog verisi",
      },
    ],
  },
  {
    id: "ilerleme",
    title: "Kendi ilerlemen",
    description: "Bu araç bir robotik bulmacası değil — kendi kaydına bakar.",
    labs: [
      {
        href: "/zaman-kapsulu",
        eyebrow: "Serbest deney",
        title: "Zaman Kapsülü",
        description: "Tarayıcındaki gerçek deney kaydından 1 hafta, 1 ay, 3 ay ve 1 yıl önceki anları geri getirir. Hesap yok, sunucuya hiçbir şey gönderilmez.",
        detail: "Yalnız bu tarayıcıda · hesapsız",
      },
    ],
  },
] as const;

export default function LabsPage() {
  const jsonLd = pageCollectionJsonLd({
    name: "Robotik laboratuvarları",
    description: "Robot hücresi, arıza teşhisi ve tarayıcıda çalışan diğer robotik deneyleri.",
    path: "/laboratuvar",
    items: CATEGORIES.flatMap((category) => category.labs).map((lab) => ({ name: lab.title, path: lab.href })),
  });

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-site-muted"><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Ana sayfa</Link> <span aria-hidden="true">/</span> Laboratuvarlar</nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Oku değil, dene</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Robotik kararlarını çalışan deneylerde sınayabilirsin.</h1>
          <p className="mt-4 text-lg leading-8 text-site-muted">Her laboratuvar tarayıcıda ve hesapsız çalışır. Sayılar ile grafikler simülasyonun gerçek hesaplarından gelir; gerçek robota komut gönderilmez.</p>
        </header>

        <nav aria-label="Kategoriye atla" className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <a key={category.id} href={`#${category.id}`} className="min-h-11 rounded-full border border-site-border bg-site-surface px-4 py-2 text-sm font-semibold text-site-ink hover:border-site-accent">
              {category.title}
            </a>
          ))}
        </nav>

        {CATEGORIES.map((category) => (
          <section key={category.id} id={category.id} aria-labelledby={`${category.id}-baslik`} className="mt-14 scroll-mt-20">
            <h2 id={`${category.id}-baslik`} className="font-heading text-2xl font-semibold text-site-ink sm:text-3xl">{category.title}</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-site-muted">{category.description}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {category.labs.map((lab) => (
                <Link key={lab.href} href={lab.href} className="group flex min-h-72 flex-col rounded-2xl border border-site-border bg-site-surface p-6 transition-colors hover:border-site-accent">
                  <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-site-accent-text">{lab.eyebrow}</p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold text-site-ink">{lab.title}</h3>
                  <p className="mt-3 text-base leading-7 text-site-muted">{lab.description}</p>
                  <p className="mt-auto pt-8 text-xs font-semibold text-site-muted">{lab.detail}</p>
                  <span className="mt-3 inline-flex min-h-11 items-center font-semibold text-site-ink underline underline-offset-4">Laboratuvarı aç →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
