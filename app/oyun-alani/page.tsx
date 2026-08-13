import type { Metadata } from "next";
import { CustomRobotPlayground } from "@/components/playground/CustomRobotPlayground";

export const metadata: Metadata = {
  title: "Kendi robotun",
  description: "1–6 eksenli özel robotunu tanımla; TCP’yi elle yönlendir, hareketi öğret, fiziksel ön kontrolden geçir ve bağlantıyla paylaş.",
};

export default function OyunAlaniPage() {
  return (
    <main id="ana-icerik" data-seviye="universite" data-playground-page className="min-h-screen bg-universite-bg text-universite-ink">
      <header className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-slate-50">
        <div aria-hidden="true" className="lab-grid absolute inset-0 opacity-80" />
        <svg aria-hidden="true" viewBox="0 0 900 280" className="absolute -right-24 bottom-0 h-full w-[48rem] max-w-none opacity-35">
          <path d="M40 225 C155 190, 210 80, 330 130 S510 250, 650 95 S790 80, 870 38" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="7 9" />
          {[[40,225],[330,130],[650,95],[870,38]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r="7" fill="#0f172a" stroke="#5eead4" strokeWidth="3" />)}
        </svg>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Deney ortamı / RobotSpec v1</p>
            <h1 className="mt-4 max-w-4xl font-heading text-5xl font-black leading-[0.9] tracking-[-0.035em] sm:text-7xl lg:text-8xl">Kendi robotunu tasarla.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Ders yok, puan yok. Kinematik zincirini tanımla; TCP’yi elle yönlendir, hareketi robota öğret ve hız-sınırlı dijital provada ne olacağını gör.</p>
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-700 bg-slate-700 text-center font-mono">
            <div className="bg-slate-900/95 px-3 py-4"><dt className="text-[10px] uppercase tracking-wider text-slate-400">DOF</dt><dd className="mt-1 text-xl font-bold text-teal-300">1—6</dd></div>
            <div className="bg-slate-900/95 px-3 py-4"><dt className="text-[10px] uppercase tracking-wider text-slate-400">Motor</dt><dd className="mt-1 text-xl font-bold text-teal-300">FK+IK</dd></div>
            <div className="bg-slate-900/95 px-3 py-4"><dt className="text-[10px] uppercase tracking-wider text-slate-400">Veri</dt><dd className="mt-1 text-xl font-bold text-teal-300">Yerel</dd></div>
          </dl>
        </div>
      </header>

      <CustomRobotPlayground />
    </main>
  );
}
