/**
 * Ham MDX ders gövdesinden ("Sesli Anlatım" özelliği, FAZ 6) okunabilir düz
 * metin çıkarır. JSX bileşen bloklarını (`<JointSliders .../>`, çok satırlı
 * `<Quiz .../>`, `<Neden>...</Neden>`) ve kod bloklarını tamamen atlar —
 * bunlar veri/etkileşim, düzyazı değil. Kalan satırlardan markdown
 * biçimlendirmesini (başlık işaretleri, kalın/italik/kod işaretleri,
 * bağlantı sözdizimi) temizler. Sezgisel bir ayrıştırıcı — tam bir MDX/AST
 * çözümleyici değil, "sesli okuma" için yeterli sadelikte.
 */

function stripInlineMarkdown(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
}

export function extractPlainText(mdxBody: string): string {
  const lines = mdxBody.split("\n");
  const kept: string[] = [];

  let mode: "prose" | "code" | "jsx" = "prose";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (mode === "code") {
      if (line.startsWith("```")) mode = "prose";
      continue;
    }
    if (mode === "jsx") {
      if (line.endsWith("/>") || /^<\/\w+>$/.test(line)) mode = "prose";
      continue;
    }

    if (line.startsWith("```")) {
      mode = "code";
      continue;
    }
    if (line.startsWith("<")) {
      // Tek satırda hem açılıp hem kapanan bir etiket ("<A>metin</A>") nadir
      // ama olası — yine de bileşen içeriği düzyazı sayılmaz, tamamen atlanır.
      if (!(line.endsWith("/>") || /^<\w+[^>]*>.*<\/\w+>$/.test(line))) mode = "jsx";
      continue;
    }

    if (line.length === 0) continue;
    kept.push(stripInlineMarkdown(line));
  }

  return kept.join(" ");
}
