"use client"

/**
 * Paint's tool list, colour palette and tool glyphs.
 *
 * The palette used to be seventy hand-written buttons, each repeating the same
 * class string, which is how several of them ended up disagreeing about what
 * "selected" looked like. Both palettes are data now, and the glyphs are drawn
 * on a pixel grid rather than loaded as images, so they stay sharp and cost
 * nothing.
 */

export type PaintTool =
  | "freeform"
  | "select"
  | "eraser"
  | "fill"
  | "eyedropper"
  | "magnifier"
  | "pencil"
  | "brush"
  | "airbrush"
  | "text"
  | "line"
  | "curve"
  | "rectangle"
  | "polygon"
  | "circle"
  | "roundedRect"

/** In the order Paint laid them out: down the left column, then the right. */
export const TOOLS: { id: PaintTool; label: string }[] = [
  { id: "freeform", label: "Free-Form Select" },
  { id: "select", label: "Select" },
  { id: "eraser", label: "Eraser/Color Eraser" },
  { id: "fill", label: "Fill With Color" },
  { id: "eyedropper", label: "Pick Color" },
  { id: "magnifier", label: "Magnifier" },
  { id: "pencil", label: "Pencil" },
  { id: "brush", label: "Brush" },
  { id: "airbrush", label: "Airbrush" },
  { id: "text", label: "Text" },
  { id: "line", label: "Line" },
  { id: "curve", label: "Curve" },
  { id: "rectangle", label: "Rectangle" },
  { id: "polygon", label: "Polygon" },
  { id: "circle", label: "Ellipse" },
  { id: "roundedRect", label: "Rounded Rectangle" },
]

/**
 * The twenty-eight colours, twice: the standard row and the lighter row under
 * it. Reading down each column gives the pair Paint showed together.
 */
export const PALETTE: string[] = [
  // The 28 colours MS Paint shipped, stored column-wise: each pair is the
  // top-row colour then the one below it, left to right across the box.
  "#000000", "#ffffff",
  "#808080", "#c0c0c0",
  "#800000", "#ff0000",
  "#808000", "#ffff00",
  "#008000", "#00ff00",
  "#008080", "#00ffff",
  "#000080", "#0000ff",
  "#800080", "#ff00ff",
  "#808040", "#ffff80",
  "#004040", "#00ff80",
  "#0080ff", "#80ffff",
  "#004080", "#8080ff",
  "#4000ff", "#ff0080",
  "#804000", "#ff8040",
]

const grid = {
  shapeRendering: "crispEdges" as const,
  "aria-hidden": true,
  focusable: false,
}

/** Tools with a bitmap icon from the original set. The simple shapes
 *  (select, line, rectangle, ellipse, rounded rectangle) stay drawn, since
 *  they are bare geometry either way. */
const TOOL_BITMAPS: Partial<Record<PaintTool, string>> = {
  freeform: "/images/paint/freeform.png",
  eraser: "/images/paint/eraser.png",
  fill: "/images/paint/fill.png",
  eyedropper: "/images/paint/eyedropper.png",
  magnifier: "/images/paint/magnifier.png",
  pencil: "/images/paint/pencil.png",
  brush: "/images/paint/brush.png",
  airbrush: "/images/paint/airbrush.png",
  text: "/images/paint/text.png",
  curve: "/images/paint/curve.png",
  polygon: "/images/paint/polygon.png",
}

/** A 16x16 glyph for each tool: the original bitmap where one exists, drawn
 *  geometry otherwise. */
export function ToolGlyph({ tool }: { tool: PaintTool }) {
  const bitmap = TOOL_BITMAPS[tool]
  if (bitmap) {
    return <img src={bitmap} alt="" width={34} height={34} aria-hidden />
  }
  const ink = "#000000"
  const box = (children: React.ReactNode) => (
    <svg width="34" height="34" viewBox="0 0 16 16" fill={ink} {...grid}>
      {children}
    </svg>
  )

  switch (tool) {
    case "pencil":
      return box(
        <>
          <path d="M10 2h2v2h-2zM8 4h2v2H8zM6 6h2v2H6zM4 8h2v2H4zM3 11h2v2H3z" />
          <rect x="2" y="12" width="2" height="2" />
        </>,
      )
    case "brush":
      return box(
        <>
          <rect x="9" y="2" width="4" height="2" />
          <rect x="7" y="4" width="5" height="2" />
          <rect x="5" y="6" width="5" height="2" />
          <rect x="4" y="8" width="4" height="4" />
          <rect x="3" y="12" width="3" height="2" />
        </>,
      )
    case "airbrush":
      return box(
        <>
          <rect x="8" y="3" width="4" height="6" />
          <rect x="6" y="9" width="4" height="4" />
          {[2, 4, 3, 5].map((x, i) => (
            <rect key={i} x={x} y={2 + i * 2} width="1" height="1" />
          ))}
          <rect x="12" y="4" width="1" height="1" />
          <rect x="13" y="7" width="1" height="1" />
        </>,
      )
    case "eraser":
      return box(
        <>
          <rect x="3" y="8" width="10" height="5" />
          <rect x="5" y="4" width="8" height="4" fill="#ffffff" stroke={ink} />
          <rect x="5" y="4" width="8" height="1" />
          <rect x="5" y="7" width="8" height="1" />
        </>,
      )
    case "fill":
      return box(
        <>
          <rect x="4" y="4" width="8" height="6" />
          <rect x="3" y="10" width="10" height="2" />
          <rect x="12" y="2" width="2" height="5" />
          <rect x="1" y="13" width="3" height="2" />
        </>,
      )
    case "eyedropper":
      return box(
        <>
          <rect x="10" y="2" width="4" height="2" />
          <rect x="8" y="4" width="4" height="2" />
          <rect x="3" y="8" width="6" height="2" transform="rotate(-45 6 9)" />
          <rect x="2" y="12" width="3" height="2" />
        </>,
      )
    case "magnifier":
      return box(
        <>
          <rect x="4" y="2" width="7" height="1" />
          <rect x="4" y="9" width="7" height="1" />
          <rect x="3" y="3" width="1" height="6" />
          <rect x="11" y="3" width="1" height="6" />
          <rect x="10" y="10" width="2" height="2" />
          <rect x="12" y="12" width="3" height="3" />
        </>,
      )
    case "text":
      return box(
        <>
          <rect x="3" y="3" width="10" height="2" />
          <rect x="7" y="5" width="2" height="9" />
        </>,
      )
    case "line":
      return box(<rect x="2" y="12" width="14" height="1.5" transform="rotate(-40 8 12)" />)
    case "curve":
      return box(<path d="M2 12c3-9 9-9 12 0h-2C9 5 6 5 4 12z" />)
    case "rectangle":
      return box(
        <>
          <rect x="2" y="4" width="12" height="1" />
          <rect x="2" y="11" width="12" height="1" />
          <rect x="2" y="4" width="1" height="8" />
          <rect x="13" y="4" width="1" height="8" />
        </>,
      )
    case "roundedRect":
      return box(
        <>
          <rect x="4" y="4" width="8" height="1" />
          <rect x="4" y="11" width="8" height="1" />
          <rect x="2" y="6" width="1" height="4" />
          <rect x="13" y="6" width="1" height="4" />
          <rect x="3" y="5" width="1" height="1" />
          <rect x="12" y="5" width="1" height="1" />
          <rect x="3" y="10" width="1" height="1" />
          <rect x="12" y="10" width="1" height="1" />
        </>,
      )
    case "circle":
      return box(
        <>
          <rect x="5" y="3" width="6" height="1" />
          <rect x="5" y="12" width="6" height="1" />
          <rect x="3" y="5" width="1" height="6" />
          <rect x="12" y="5" width="1" height="6" />
          <rect x="4" y="4" width="1" height="1" />
          <rect x="11" y="4" width="1" height="1" />
          <rect x="4" y="11" width="1" height="1" />
          <rect x="11" y="11" width="1" height="1" />
        </>,
      )
    case "polygon":
      return box(<path d="M8 2l6 5-2 7H4L2 7z" fillOpacity="0" stroke={ink} strokeWidth="1.4" />)
    case "select":
      return box(
        <>
          {[2, 5, 8, 11].map((x) => (
            <rect key={`t${x}`} x={x} y="3" width="2" height="1" />
          ))}
          {[2, 5, 8, 11].map((x) => (
            <rect key={`b${x}`} x={x} y="12" width="2" height="1" />
          ))}
          {[4, 7, 10].map((y) => (
            <rect key={`l${y}`} x="2" y={y} width="1" height="2" />
          ))}
          {[4, 7, 10].map((y) => (
            <rect key={`r${y}`} x="13" y={y} width="1" height="2" />
          ))}
        </>,
      )
    case "freeform":
      return box(
        <path
          d="M3 9c1-5 5-7 8-5s3 6 0 8-6 1-8-3z"
          fillOpacity="0"
          stroke={ink}
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />,
      )
    default:
      return box(<rect x="6" y="6" width="4" height="4" />)
  }
}
