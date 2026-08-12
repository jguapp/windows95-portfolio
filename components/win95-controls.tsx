/**
 * Title-bar control glyphs, drawn as SVG rather than text.
 *
 * globals.css forces `font-size: 1.2rem !important` on every <button>, which
 * overrides any Tailwind text-[Npx] class and rendered these glyphs at 19.2px
 * inside 16px buttons. Drawing them means they no longer depend on font size,
 * on the font having a □ glyph, or on how a given platform shapes an "X".
 *
 * Each icon is a 1-unit-per-pixel grid with crispEdges, matching the Windows 95
 * bitmaps: the shapes stay sharp at any zoom or device pixel ratio.
 */

const shared = {
  fill: "currentColor",
  shapeRendering: "crispEdges" as const,
  "aria-hidden": true,
  focusable: false,
}

export function MinimizeIcon() {
  // A short bar resting on the baseline, as in Win95.
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" {...shared}>
      <rect x="1" y="6" width="6" height="2" />
    </svg>
  )
}

export function MaximizeIcon() {
  // An outlined window with a doubled top edge standing in for its title bar.
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" {...shared}>
      <path d="M0 0h9v9H0V0zm1 3v5h7V3H1z" />
    </svg>
  )
}

export function CloseIcon() {
  // The 8x7 Win95 close bitmap, one <rect> per run of pixels.
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" {...shared}>
      <rect x="0" y="0" width="2" height="1" />
      <rect x="6" y="0" width="2" height="1" />
      <rect x="1" y="1" width="2" height="1" />
      <rect x="5" y="1" width="2" height="1" />
      <rect x="2" y="2" width="4" height="1" />
      <rect x="3" y="3" width="2" height="1" />
      <rect x="2" y="4" width="4" height="1" />
      <rect x="1" y="5" width="2" height="1" />
      <rect x="5" y="5" width="2" height="1" />
      <rect x="0" y="6" width="2" height="1" />
      <rect x="6" y="6" width="2" height="1" />
    </svg>
  )
}
