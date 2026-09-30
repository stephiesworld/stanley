import { ImageResponse } from "next/og";

// The link-preview card shown when Stanley's URL is shared (iMessage, Slack,
// Telegram, etc.). "The shape of the week" brand: cool paper, seven day
// columns, Wednesday's pile tipping. Uses the default font for reliable builds.
export const runtime = "nodejs";
export const alt = "Stanley protects the shape of your week.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// [top, height, colour, tilt°] per block; one list per day, Mon → Sun.
const WEEK: [number, number, string, number][][] = [
  [[40, 44, "#CFDCF6", 0], [150, 44, "#F5D2D9", 0], [300, 60, "#CFEADB", 0]],
  [[0, 96, "#E4E8EE", 0], [120, 60, "#CFDCF6", 0], [310, 80, "#F5D2D9", 0]],
  [[40, 40, "#CFDCF6", -4], [82, 40, "#CFDCF6", 3], [124, 40, "#CFDCF6", -2], [170, 30, "#CFDCF6", 4], [204, 40, "#CFEADB", -3], [246, 40, "#CFDCF6", 3]],
  [[120, 80, "#CFDCF6", 0], [440, 30, "#F3E3B9", 0]],
  [[200, 44, "#F5D2D9", 0], [470, 70, "#E2D7F3", 0]],
  [[0, 140, "#E4E8EE", 0], [160, 80, "#E2D7F3", 0]],
  [[0, 540, "#E4E8EE", 0]],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: "56px",
          padding: "0 70px",
          background: "#EEF1F4",
          color: "#13161B",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "480px", gap: "28px" }}>
          <div style={{ fontSize: "30px", fontWeight: 700 }}>Stanley</div>
          <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-3px" }}>
            Protects the shape of your week.
          </div>
          <div style={{ fontSize: "26px", color: "#5B6370" }}>Nothing moves until you say yes.</div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "18px",
            height: "560px",
            background: "#FFFFFF",
            border: "2px solid #D6DBE2",
            borderRadius: "22px",
          }}
        >
          {WEEK.map((day, d) => (
            <div
              key={d}
              style={{
                display: "flex",
                position: "relative",
                width: "58px",
                height: "100%",
                background: d === 2 ? "#FDF5E6" : "transparent",
              }}
            >
              {day.map(([top, h, bg, tilt], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: "4px",
                    top: `${top}px`,
                    width: "50px",
                    height: `${h}px`,
                    background: bg,
                    borderRadius: "8px",
                    border: tilt ? "2px solid #D9901A" : "none",
                    transform: `rotate(${tilt}deg)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
