import { ImageResponse } from "next/og"

// Generated at build time, so there's no binary asset to keep in sync.
// Next wires this into both og:image and twitter:image automatically.
// The Node build of @vercel/og bundled with Next 14 fails to prerender on
// Windows (fileURLToPath on a win32 path); the edge runtime is unaffected and
// is what this runs on in production anyway.
export const runtime = "edge"

export const alt = "joel.codes() — a portfolio built as a working Windows 95 desktop"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const TEAL = "#008080"
const GRAY = "#c0c0c0"
const NAVY = "#000080"

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: TEAL,
        fontFamily: "sans-serif",
      }}
    >
      {/* Win95 window chrome */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 900,
          background: GRAY,
          border: `4px solid ${GRAY}`,
          borderTopColor: "#ffffff",
          borderLeftColor: "#ffffff",
          borderRightColor: "#404040",
          borderBottomColor: "#404040",
          boxShadow: "8px 8px 0 rgba(0,0,0,0.35)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: NAVY,
            color: "#ffffff",
            padding: "10px 14px",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <span>joel.codes() // human-readable</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["minimize", "maximize", "close"].map((kind) => (
              <div
                key={kind}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 28,
                  background: GRAY,
                  color: "#000000",
                  fontSize: 20,
                  border: "2px solid #ffffff",
                  borderRightColor: "#404040",
                  borderBottomColor: "#404040",
                }}
              >
                {/* Drawn rather than glyphs — the default font has no □ */}
                {kind === "minimize" && <div style={{ width: 12, height: 3, background: "#000000", marginTop: 12 }} />}
                {kind === "maximize" && (
                  <div style={{ width: 14, height: 12, borderWidth: 2, borderStyle: "solid", borderColor: "#000000" }} />
                )}
                {kind === "close" && <span style={{ fontSize: 18, lineHeight: 1 }}>×</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 44px", color: "#000000" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Joel Vasquez</div>
          <div style={{ fontSize: 34, marginTop: 18, color: "#202020" }}>
            A portfolio rebuilt as a working Windows 95 desktop.
          </div>
          <div style={{ fontSize: 26, marginTop: 34, color: "#404040" }}>
            Draggable windows · Start menu · MS Paint · 5 classic games
          </div>
        </div>
      </div>
    </div>,
    size,
  )
}
