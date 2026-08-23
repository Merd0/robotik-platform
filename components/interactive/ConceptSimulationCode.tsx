interface ConceptSimulationCodeProps {
  concept: string;
  simulation: string;
  code: string;
  codeHref: string;
  codeLabel: string;
}

/**
 * Bir dersin zaten var olan kavram, deney ve kod uygulamasını tek öğrenme
 * akışında görünür kılar. Metin ve eşleşme MDX'te kalır; bileşen yalnız sunar.
 */
export function ConceptSimulationCode({
  concept,
  simulation,
  code,
  codeHref,
  codeLabel,
}: ConceptSimulationCodeProps) {
  const steps = [
    { title: "Kavram", detail: concept },
    { title: "Simülasyon", detail: simulation },
    { title: "Kod", detail: code },
  ];

  return (
    <section
      aria-labelledby="concept-simulation-code-title"
      className="my-2 rounded-2xl border border-site-border bg-site-soft p-4 sm:p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">
        Öğrenme köprüsü
      </p>
      <h2 id="concept-simulation-code-title" className="mt-1 font-heading text-xl font-semibold text-site-ink">
        Kavram → Simülasyon → Kod
      </h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-site-border bg-site-surface p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[.12em] text-site-accent-text">
              {index + 1}. {step.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-site-muted">{step.detail}</p>
            {index === 2 ? (
              <a
                href={codeHref}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-site-accent-text underline underline-offset-4"
              >
                {codeLabel} <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
