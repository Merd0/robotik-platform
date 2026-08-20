import Link from "next/link";

const PILOTS = [
  { href: "/ogretmen", label: "Hat B · Ters kinematik" },
  { href: "/ogretmen/hat-c", label: "Hat C · Planlayıcı karşılaştırması" },
  { href: "/ogretmen/kod-akademisi", label: "Kod Akademisi · Giriş" },
] as const;

/**
 * Üç öğretmen pilotu sayfası arasındaki gezinme — "her an nerede olduğunu
 * bil" ilkesinin (docs/05) bu sayfa ailesindeki karşılığı. Yazdırma
 * görünümünde diğer ekran-öncesi öğelerle birlikte gizlenir (bkz.
 * app/ogretmen/*.module.css `.screenOnly`).
 */
export function TeacherPilotSwitcher({ active }: { active: (typeof PILOTS)[number]["href"] }) {
  return (
    <nav aria-label="Öğretmen pilotları" className="flex flex-wrap gap-2">
      {PILOTS.map((pilot) => {
        const isActive = pilot.href === active;
        return (
          <Link
            key={pilot.href}
            href={pilot.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${
              isActive
                ? "border-site-ink bg-site-ink text-site-surface"
                : "border-site-border bg-site-surface text-site-ink"
            }`}
          >
            {pilot.label}
          </Link>
        );
      })}
    </nav>
  );
}
