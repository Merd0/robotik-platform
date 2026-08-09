interface JsonLdProps {
  data: Record<string, unknown>;
}

/** JSON-LD verisini çalıştırılabilir betiğe dönüşmeden güvenli biçimde gömer. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
