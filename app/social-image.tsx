import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage() {
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
          background: "#f7f8fa",
          color: "#16231f",
          padding: "62px 70px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", inset: 0 }}>
          <path d="M -30 520 C 150 330, 340 570, 520 360 S 830 190, 1230 70" fill="none" stroke="#0c8c87" strokeWidth="7" strokeDasharray="20 14" opacity="0.22" />
          <circle cx="520" cy="360" r="13" fill="#f7f8fa" stroke="#0c8c87" strokeWidth="6" opacity="0.8" />
          <circle cx="990" cy="135" r="13" fill="#f7f8fa" stroke="#0c8c87" strokeWidth="6" opacity="0.8" />
        </svg>

        <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: "#0c8c87", marginRight: 15 }} />
          Robotik Laboratuvarı
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "91%", padding: "38px 42px", borderLeft: "9px solid #0c8c87", background: "#ffffff" }}>
          <div style={{ display: "flex", color: "#0c8c87", fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em" }}>
            Etkileşimli Türkçe kaynak
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 59, lineHeight: 1.06, fontWeight: 700, letterSpacing: "-0.04em" }}>
            Robotu dene. Farkı gör. Nedenini öğren.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", color: "#526176", fontSize: 23 }}>
          <div style={{ display: "flex" }}>Ortaokuldan üniversiteye ücretsiz dersler</div>
          <div style={{ display: "flex", fontFamily: "monospace" }}>robotik-platform.vercel.app</div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
