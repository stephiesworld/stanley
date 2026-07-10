import { ImageResponse } from "next/og";

// The link-preview card shown when Stanley's URL is shared (iMessage, Slack,
// Telegram, etc.). Keeper of Days brand: warm near-black, accent square,
// monumental uppercase. Uses the default font for reliable builds.
export const runtime = "nodejs";
export const alt = "Stanley — a calendar is the only honest autobiography.";
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
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "#0E0D0B",
          color: "#F2EFE6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "22px", height: "22px", background: "#FF4D2E" }} />
          <div style={{ fontSize: "26px", letterSpacing: "4px", fontWeight: 700 }}>STANLEY</div>
          <div style={{ fontSize: "26px", letterSpacing: "4px", color: "#6B675C" }}>/ KEEPER OF DAYS</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "92px",
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: "-1px",
          }}
        >
          <div style={{ display: "flex" }}>A calendar is the only</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            honest&nbsp;
            <div
              style={{
                display: "flex",
                color: "#FF4D2E",
                border: "2px solid #FF4D2E",
                padding: "0 14px",
              }}
            >
              autobiography.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: "24px", letterSpacing: "3px", color: "#6B675C" }}>
          HE PROPOSES. YOU DECIDE. THE LEDGER REMEMBERS.
        </div>
      </div>
    ),
    { ...size },
  );
}
