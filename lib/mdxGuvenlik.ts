import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import matter from "gray-matter";
import type { Node } from "unist";
import { IZINLI_BILESEN_ADLARI } from "./izinliBilesenler";

/**
 * MDX içeriğinin AST düzeyinde allowlist denetimi.
 *
 * Neden gerekli: `app/ders/[slug]/page.tsx` MDX'i `blockJS: false` ile
 * derliyor. Bu ayar bilinçli — `Quiz` bileşenine `sorular={[...]}` gibi
 * obje/dizi prop'u verilebilmesi için gerekli (bkz. docs/08, "MDX derleme
 * ayarı: blockJS neden kapalı"). Ama kapalı olması, bir ders dosyasının MDX
 * içinde İSTEDİĞİ JS ifadesini çalıştırabilmesi anlamına da geliyor:
 * `{fetch(...)}`, `{process.env.X}`, `<script>` derleyiciden geçerdi.
 * docs/08 bu riskin dış katkı başlamadan kapatılmasını istiyor.
 *
 * Bu modül o boşluğu kapatır. `blockJS`'i açmak yerine (içerik bozulurdu)
 * içeriği AST'de denetliyoruz:
 *
 * 1. JSX elemanları yalnızca `components/interactive/index.ts` içindeki
 *    `mdxComponents` listesinden olabilir (+ dar bir güvenli HTML kümesi).
 * 2. Gövdede serbest `{ifade}` yasak (mdxFlowExpression/mdxTextExpression).
 * 3. `import`/`export` (mdxjsEsm) yasak.
 * 4. Prop değeri olan ifadeler YALNIZCA veri olabilir: dizi, obje, dize,
 *    sayı, boolean, null ve yerleştirmesiz şablon dizesi. Fonksiyon çağrısı,
 *    değişken, üye erişimi, ok fonksiyonu — hepsi reddedilir.
 *
 * Yani `sorular={[{ soru: "...", dogru: 1 }]}` geçer, `{eval("...")}` geçmez.
 */

/** Markdown'ın kendi ürettiği/gerekli olan dar HTML kümesi. */
const IZINLI_HTML = new Set(["br", "kbd", "sub", "sup", "abbr"]);
const IZINLI_BILESENLER = new Set<string>(IZINLI_BILESEN_ADLARI);

/** Prop ifadelerinde izin verilen estree düğüm türleri — hepsi saf veri. */
const IZINLI_ESTREE = new Set([
  "Program",
  "ExpressionStatement",
  "ArrayExpression",
  "ObjectExpression",
  "Property",
  "Literal",
  "UnaryExpression", // negatif sayılar: -1
  // Şablon dizesi yalnızca YERLEŞTİRMESİZ ise serbest (aşağıda kontrol
  // ediliyor): `CodeRunner initialCode` çok satırlı Python kodunu böyle
  // taşıyor ve o düz metindir. İçinde ${...} varsa keyfi kod çalışabilir.
  "TemplateLiteral",
  "TemplateElement",
]);

export interface Bulgu {
  dosya: string;
  satir: number | undefined;
  mesaj: string;
}

/** estree ağacını gezip yalnızca veri düğümlerine izin verir. */
function estreeDenetle(dugum: unknown, bildir: (mesaj: string) => void): void {
  if (dugum === null || typeof dugum !== "object") return;
  if (Array.isArray(dugum)) {
    for (const eleman of dugum) estreeDenetle(eleman, bildir);
    return;
  }

  const kayit = dugum as Record<string, unknown>;
  const tur = typeof kayit.type === "string" ? kayit.type : undefined;

  if (tur !== undefined) {
    if (tur === "Identifier") {
      bildir(`prop ifadesinde değişken kullanılamaz: "${String(kayit.name)}"`);
      return;
    }
    if (!IZINLI_ESTREE.has(tur)) {
      bildir(`prop ifadesinde izin verilmeyen JS yapısı: ${tur}`);
      return;
    }
    if (tur === "UnaryExpression" && kayit.operator !== "-" && kayit.operator !== "+") {
      bildir(`prop ifadesinde izin verilmeyen operatör: ${String(kayit.operator)}`);
      return;
    }
    if (tur === "TemplateLiteral") {
      const yerlestirmeler = kayit.expressions;
      if (Array.isArray(yerlestirmeler) && yerlestirmeler.length > 0) {
        bildir("şablon dizesinde ${...} yerleştirmesi kullanılamaz");
        return;
      }
    }
  }

  for (const [anahtar, deger] of Object.entries(kayit)) {
    // Obje anahtarları (Property.key) Identifier olabilir; onları atlıyoruz.
    if (tur === "Property" && anahtar === "key") continue;
    if (anahtar === "loc" || anahtar === "range" || anahtar === "start" || anahtar === "end") continue;
    estreeDenetle(deger, bildir);
  }
}

/** Bir MDX kaynağını denetler. `etiket` yalnızca bulgu mesajlarında görünür. */
export function mdxDenetle(ham: string, etiket = "<metin>"): Bulgu[] {
  const bulgular: Bulgu[] = [];

  // Frontmatter MDX değil YAML — ayrıştırıcıya verilirse `<` içeren kaynak
  // künyelerinde JSX sanıp patlar. Gövdeyi ayırıp satır numaralarını
  // frontmatter uzunluğu kadar kaydırıyoruz ki bulgu gerçek satırı göstersin.
  const { content: govde } = matter(ham);
  const satirKaymasi = ham.split(/\r?\n/).length - govde.split(/\r?\n/).length;
  const ekle = (satir: number | undefined, mesaj: string) =>
    bulgular.push({
      dosya: etiket,
      satir: satir === undefined ? undefined : satir + satirKaymasi,
      mesaj,
    });

  const agac = unified().use(remarkParse).use(remarkMdx).parse(govde);

  visit(agac, (dugum: Node) => {
    const satir = dugum.position?.start.line;
    const tur = dugum.type;

    if (tur === "mdxjsEsm") {
      ekle(satir, "ders dosyasında import/export kullanılamaz");
      return;
    }

    if (tur === "mdxFlowExpression" || tur === "mdxTextExpression") {
      ekle(satir, "ders gövdesinde serbest { } ifadesi kullanılamaz");
      return;
    }

    if (tur !== "mdxJsxFlowElement" && tur !== "mdxJsxTextElement") return;

    const eleman = dugum as Node & {
      name: string | null;
      attributes?: { type: string; name?: string; value?: unknown }[];
    };
    const ad = eleman.name;

    if (ad === null) {
      ekle(satir, "adsız JSX parçası (<>) kullanılamaz");
      return;
    }

    const bilesenMi = ad[0] === ad[0].toUpperCase();
    if (bilesenMi) {
      if (!IZINLI_BILESENLER.has(ad)) {
        ekle(satir, `"${ad}" izinli bileşen değil — components/interactive/index.ts listesine bak`);
        return;
      }
    } else if (!IZINLI_HTML.has(ad)) {
      ekle(satir, `"<${ad}>" HTML etiketi ders içeriğinde kullanılamaz`);
      return;
    }

    for (const oznitelik of eleman.attributes ?? []) {
      if (oznitelik.type === "mdxJsxExpressionAttribute") {
        ekle(satir, `<${ad}> üzerinde yayılım (spread) prop'u kullanılamaz`);
        continue;
      }
      const deger = oznitelik.value as { type?: string; data?: { estree?: unknown } } | string | null;
      if (deger === null || typeof deger === "string") continue; // düz dize prop
      if (deger.type !== "mdxJsxAttributeValueExpression") continue;

      const estree = deger.data?.estree;
      if (estree === undefined) {
        ekle(satir, `<${ad} ${oznitelik.name}={...}> ifadesi çözümlenemedi`);
        continue;
      }
      estreeDenetle(estree, (mesaj) => ekle(satir, `<${ad} ${oznitelik.name}>: ${mesaj}`));
    }
  });

  return bulgular;
}
