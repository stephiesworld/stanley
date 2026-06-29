import { ImageResponse } from "next/og";

// The link-preview card shown when stanley's URL is shared (iMessage, Slack,
// Telegram, etc.). Brass crest + wordmark + tagline on racing green. Uses the
// default font for reliable builds; the brand serif is on the site itself.
export const runtime = "nodejs";
export const alt = "Stanley — he protects the shape of your week.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "radial-gradient(120% 100% at 50% -10%, #1c3327, #122019)",
          color: "#efe7d6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div
            style={{
              width: "104px",
              height: "104px",
              borderRadius: "999px",
              background: "#d8b65f",
              color: "#2a2008",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "62px",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: "44px", letterSpacing: "0.3em", color: "#c9a24b" }}>STANLEY</div>
        </div>
        <div style={{ display: "flex", marginTop: "48px", fontSize: "84px", fontWeight: 700, lineHeight: 1.05 }}>
          He protects the shape
        </div>
        <div style={{ display: "flex", fontSize: "84px", fontWeight: 700, lineHeight: 1.05 }}>
          of your week.
        </div>
        <div style={{ display: "flex", marginTop: "36px", fontSize: "34px", color: "#9aa890" }}>
          A personal calendar butler you reach by text.
        </div>
      </div>
    ),
    { ...size },
  );
}
