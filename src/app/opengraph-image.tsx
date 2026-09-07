import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const alt = SITE_NAME;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0B3A66 0%, #0F4C81 45%, #175FA6 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: "64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontWeight: 400,
            color: "#E8F1FA",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            fontWeight: 600,
            color: "#9AD0F5",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Política · Transparência · Memória
        </div>
      </div>
    ),
    { ...size }
  );
}