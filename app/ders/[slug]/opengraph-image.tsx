import { ImageResponse } from "next/og";
import { getPublicLessonBySlug, getPublicLessons, hatEtiket, SEVIYE_ETIKET, type Seviye } from "@/lib/content";

export const alt = "Robotik Laboratuvarı ders kartı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return getPublicLessons().map((lesson) => ({ slug: lesson.slug }));
}

const PALETTE: Record<Seviye, { background: string; surface: string; ink: string; muted: string; accent: string }> = {
  ortaokul: { background: "#faf9f7", surface: "#ffffff", ink: "#16231f", muted: "#526176", accent: "#0ea5a0" },
  lise: { background: "#f7f8fa", surface: "#ffffff", ink: "#161d23", muted: "#526176", accent: "#0c8c87" },
  universite: { background: "#fcfcfc", surface: "#ffffff", ink: "#0f172a", muted: "#526176", accent: "#1e293b" },
};

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getPublicLessonBySlug(slug);
  const seviye = lesson?.frontmatter.seviye ?? "ortaokul";
  const palette = PALETTE[seviye];
  const title = lesson?.frontmatter.baslik ?? "Robotik Laboratuvarı";
  const hat = lesson ? hatEtiket(lesson.frontmatter.hat) : "Etkileşimli robotik";
  const sure = lesson ? `${lesson.frontmatter.sure} dakika` : "Açık ve ücretsiz";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          background: palette.background,
          color: palette.ink,
          padding: "64px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", inset: 0 }}>
          <path d="M -40 500 C 160 330, 280 570, 470 390 S 800 210, 1240 80" fill="none" stroke={palette.accent} strokeWidth="6" strokeDasharray="18 14" opacity="0.22" />
          <circle cx="470" cy="390" r="11" fill={palette.background} stroke={palette.accent} strokeWidth="5" opacity="0.7" />
          <circle cx="980" cy="150" r="11" fill={palette.background} stroke={palette.accent} strokeWidth="5" opacity="0.7" />
        </svg>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: palette.accent, marginRight: 14 }} />
            Robotik Laboratuvarı
          </div>
          <div style={{ display: "flex", padding: "12px 20px", border: `2px solid ${palette.accent}`, borderRadius: 999, color: palette.accent, fontSize: 23, fontWeight: 700 }}>
            {SEVIYE_ETIKET[seviye]}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "88%", padding: "34px 38px", borderLeft: `8px solid ${palette.accent}`, background: palette.surface }}>
          <div style={{ display: "flex", color: palette.accent, fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Deney dersi
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: title.length > 46 ? 48 : 58, lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.035em" }}>
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", color: palette.muted, fontSize: 23 }}>
          <div style={{ display: "flex" }}>{hat}</div>
          <div style={{ display: "flex", fontFamily: "monospace" }}>{sure} · robotik-platform.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
