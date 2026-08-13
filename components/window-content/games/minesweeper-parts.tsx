"use client"

/**
 * The pieces of Minesweeper's chrome that have to be pixel-exact.
 *
 * The counters, the smiley and the mine and flag glyphs are the parts anyone
 * who played it will recognise instantly, and emoji get none of them right: a
 * 🙂 is not the Minesweeper face, and 💣 is not the Minesweeper mine. Each of
 * these is drawn on a one-unit-per-pixel grid, so they are sharp at any zoom
 * and identical on every platform.
 */

const grid = {
  shapeRendering: "crispEdges" as const,
  "aria-hidden": true,
  focusable: false,
}

/**
 * One digit of the seven-segment counter.
 *
 * Lit segments are #ff0000 on black; unlit ones are the dark red that made the
 * original look like an LED panel rather than blank space.
 */
const SEGMENTS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
  "-": "g",
  " ": "",
}

function Digit({ char }: { char: string }) {
  const on = SEGMENTS[char] ?? ""
  const lit = (s: string) => (on.includes(s) ? "#ff0000" : "#3b0000")

  // 13x23 with 2px-thick bars, the proportions of the original panel.
  return (
    <svg width="13" height="23" viewBox="0 0 13 23" {...grid}>
      <rect x="0" y="0" width="13" height="23" fill="#000000" />
      <rect x="3" y="1" width="7" height="2" fill={lit("a")} />
      <rect x="10" y="3" width="2" height="7" fill={lit("b")} />
      <rect x="10" y="13" width="2" height="7" fill={lit("c")} />
      <rect x="3" y="20" width="7" height="2" fill={lit("d")} />
      <rect x="1" y="13" width="2" height="7" fill={lit("e")} />
      <rect x="1" y="3" width="2" height="7" fill={lit("f")} />
      <rect x="3" y="10.5" width="7" height="2" fill={lit("g")} />
    </svg>
  )
}

/**
 * The three-digit counters either side of the smiley.
 *
 * Values are clamped the way the original was: it counted down past zero into
 * negatives when you over-flagged, and stopped at 999.
 */
export function Counter({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(-99, Math.min(999, Math.round(value)))
  const text = clamped < 0 ? `-${String(Math.abs(clamped)).padStart(2, "0")}` : String(clamped).padStart(3, "0")

  return (
    <div
      data-counter={label}
      aria-label={label}
      className="flex"
      style={{
        boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #000000",
        padding: 2,
        backgroundColor: "#000000",
      }}
    >
      {text.split("").map((c, i) => (
        <Digit key={i} char={c} />
      ))}
    </div>
  )
}

export type Face = "smile" | "oh" | "cool" | "dead"

/** The face on the button, in its four states. */
export function Smiley({ face }: { face: Face }) {
  const dead = face === "dead"
  const cool = face === "cool"
  const oh = face === "oh"

  return (
    <svg width="17" height="17" viewBox="0 0 17 17" data-face={face} {...grid}>
      {/* Head: a circle roughed out on the grid, yellow with a black rim. */}
      {[
        [5, 1, 7],
        [3, 2, 11],
        [2, 3, 13],
        [1, 5, 15],
        [2, 12, 13],
        [3, 14, 11],
        [5, 15, 7],
      ].map(([x, y, w], i) => (
        <rect key={`h${i}`} x={x} y={y} width={w} height={i === 3 ? 7 : 1} fill="#000000" />
      ))}
      {[
        [5, 2, 7],
        [3, 3, 11],
        [2, 4, 13],
        [2, 5, 13],
        [2, 6, 13],
        [2, 7, 13],
        [2, 8, 13],
        [2, 9, 13],
        [2, 10, 13],
        [2, 11, 13],
        [3, 12, 11],
        [5, 13, 7],
      ].map(([x, y, w], i) => (
        <rect key={`f${i}`} x={x} y={y} width={w} height={1} fill="#ffff00" />
      ))}

      {cool ? (
        // Sunglasses.
        <>
          <rect x="3" y="6" width="11" height="1" fill="#000000" />
          <rect x="3" y="7" width="4" height="2" fill="#000000" />
          <rect x="10" y="7" width="4" height="2" fill="#000000" />
          <rect x="7" y="7" width="3" height="1" fill="#000000" />
        </>
      ) : dead ? (
        // Crosses for eyes.
        <>
          {[4, 11].map((ox) =>
            [0, 1, 2].map((i) => (
              <g key={`${ox}-${i}`}>
                <rect x={ox + i} y={6 + i} width="1" height="1" fill="#000000" />
                <rect x={ox + 2 - i} y={6 + i} width="1" height="1" fill="#000000" />
              </g>
            )),
          )}
        </>
      ) : (
        <>
          <rect x="5" y="6" width="2" height="3" fill="#000000" />
          <rect x="10" y="6" width="2" height="3" fill="#000000" />
        </>
      )}

      {oh ? (
        // A small open mouth.
        <>
          <rect x="7" y="10" width="3" height="1" fill="#000000" />
          <rect x="6" y="11" width="1" height="2" fill="#000000" />
          <rect x="10" y="11" width="1" height="2" fill="#000000" />
          <rect x="7" y="13" width="3" height="1" fill="#000000" />
        </>
      ) : dead ? (
        <rect x="6" y="11" width="5" height="1" fill="#000000" />
      ) : (
        <>
          <rect x="5" y="10" width="1" height="1" fill="#000000" />
          <rect x="11" y="10" width="1" height="1" fill="#000000" />
          <rect x="6" y="11" width="5" height="1" fill="#000000" />
        </>
      )}
    </svg>
  )
}

/** The mine: a black disc with spikes and a white highlight. */
export function Mine({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" data-mine {...grid}>
      <rect x="7" y="2" width="2" height="12" fill="#000000" />
      <rect x="2" y="7" width="12" height="2" fill="#000000" />
      <rect x="4" y="4" width="8" height="8" fill="#000000" />
      <rect x="3" y="5" width="10" height="6" fill="#000000" />
      <rect x="5" y="3" width="6" height="10" fill="#000000" />
      {/* Diagonal spikes. */}
      <rect x="4" y="4" width="1" height="1" fill="#000000" />
      <rect x="11" y="4" width="1" height="1" fill="#000000" />
      <rect x="4" y="11" width="1" height="1" fill="#000000" />
      <rect x="11" y="11" width="1" height="1" fill="#000000" />
      {/* The highlight that made it read as a sphere. */}
      <rect x="5" y="5" width="2" height="2" fill="#ffffff" />
    </svg>
  )
}

/** The flag: red pennant on a black pole with a black base. */
export function Flag({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" data-flag {...grid}>
      <rect x="7" y="3" width="1" height="1" fill="#ff0000" />
      <rect x="5" y="4" width="3" height="1" fill="#ff0000" />
      <rect x="3" y="5" width="5" height="1" fill="#ff0000" />
      <rect x="5" y="6" width="3" height="1" fill="#ff0000" />
      <rect x="7" y="7" width="1" height="1" fill="#ff0000" />
      <rect x="7" y="3" width="1" height="7" fill="#000000" />
      <rect x="6" y="10" width="3" height="1" fill="#000000" />
      <rect x="4" y="11" width="7" height="2" fill="#000000" />
    </svg>
  )
}
