/**
 * The screensavers, as canvas renderers.
 *
 * Each is a draw function over a small state object, so the same code runs
 * full screen and inside the little preview monitor on the Screen Saver tab.
 * They are recreations of the set Windows 95 actually shipped:
 *
 *   Flying Windows      the default: logos streaming out of the centre
 *   Mystify Your Mind   two bouncing polylines trailing ghosts of themselves
 *   3D Pipes            a pipe growing through a grid, restarting when boxed in
 *   Scrolling Marquee   a line of text crossing a black screen
 *   Starfield           points pushed outward from the centre
 *
 * All of them draw on black, which is what made them screen SAVERS: dark
 * phosphor was the point.
 */

export type SaverId = "flying-windows" | "mystify" | "pipes" | "marquee" | "starfield"

export const SAVERS: { id: SaverId; name: string }[] = [
  { id: "flying-windows", name: "Flying Windows" },
  { id: "mystify", name: "Mystify Your Mind" },
  { id: "pipes", name: "3D Pipes" },
  { id: "marquee", name: "Scrolling Marquee" },
  { id: "starfield", name: "Starfield Simulation" },
]

export interface Saver {
  /** Called once per frame. dt is seconds since the last frame, capped. */
  step: (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => void
}

/* ------------------------------------------------------------------ */
/* Flying Windows                                                      */
/* ------------------------------------------------------------------ */

interface Logo {
  x: number
  y: number
  z: number
}

/** The four-pane flag, drawn wavy the way the boxed art showed it. */
function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const pane = size / 2
  const gap = Math.max(1, size / 12)
  const colours = ["#ff0000", "#00a000", "#0000ff", "#ffcc00"]
  const wave = size / 6
  for (let i = 0; i < 4; i++) {
    const px = x + (i % 2) * (pane + gap)
    const py = y + Math.floor(i / 2) * (pane + gap)
    ctx.fillStyle = colours[i]
    ctx.beginPath()
    ctx.moveTo(px, py + wave)
    ctx.quadraticCurveTo(px + pane / 2, py - wave / 2, px + pane, py)
    ctx.lineTo(px + pane, py + pane)
    ctx.quadraticCurveTo(px + pane / 2, py + pane + wave / 2, px, py + pane + wave)
    ctx.closePath()
    ctx.fill()
  }
}

function flyingWindows(): Saver {
  const logos: Logo[] = Array.from({ length: 24 }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 90 + 10,
  }))
  return {
    step(ctx, w, h, dt) {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)
      for (const l of logos) {
        l.z -= 26 * dt
        if (l.z <= 1) {
          l.x = Math.random() * 2 - 1
          l.y = Math.random() * 2 - 1
          l.z = 100
        }
        const k = 100 / l.z
        const px = w / 2 + l.x * k * w * 0.45
        const py = h / 2 + l.y * k * h * 0.45
        const size = Math.max(3, (1 - l.z / 100) * (w / 10))
        if (px < -size || px > w || py < -size || py > h) {
          l.z = 100
          continue
        }
        drawFlag(ctx, px, py, size)
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* Mystify Your Mind                                                   */
/* ------------------------------------------------------------------ */

interface Corner {
  x: number
  y: number
  vx: number
  vy: number
}

interface Poly {
  corners: Corner[]
  trail: { x: number; y: number }[][]
  hue: number
  drift: number
}

function mystify(): Saver {
  const make = (hue: number): Poly => ({
    corners: Array.from({ length: 4 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() * 0.14 + 0.08) * (Math.random() < 0.5 ? -1 : 1),
      vy: (Math.random() * 0.14 + 0.08) * (Math.random() < 0.5 ? -1 : 1),
    })),
    trail: [],
    hue,
    drift: 12,
  })
  const polys = [make(180), make(300)]

  return {
    step(ctx, w, h, dt) {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)
      for (const poly of polys) {
        for (const c of poly.corners) {
          c.x += c.vx * dt
          c.y += c.vy * dt
          if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx) }
          if (c.x > 1) { c.x = 1; c.vx = -Math.abs(c.vx) }
          if (c.y < 0) { c.y = 0; c.vy = Math.abs(c.vy) }
          if (c.y > 1) { c.y = 1; c.vy = -Math.abs(c.vy) }
        }
        poly.trail.push(poly.corners.map((c) => ({ x: c.x, y: c.y })))
        if (poly.trail.length > 10) poly.trail.shift()
        poly.hue = (poly.hue + poly.drift * dt) % 360

        poly.trail.forEach((ring, i) => {
          const a = ((i + 1) / poly.trail.length) * 0.9
          ctx.strokeStyle = `hsla(${poly.hue}, 100%, 60%, ${a})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ring.forEach((c, j) => {
            const px = c.x * w
            const py = c.y * h
            if (j === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.closePath()
          ctx.stroke()
        })
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* 3D Pipes                                                            */
/* ------------------------------------------------------------------ */

interface PipeState {
  x: number
  y: number
  dir: number
  colour: string
  visited: Set<string>
  cell: number
  fade: number
}

const PIPE_COLOURS = ["#c0c0c0", "#008080", "#800080", "#808000", "#c00000", "#0000c0", "#00a000"]

function pipes(): Saver {
  let p: PipeState | null = null
  let painted: { x: number; y: number; nx: number; ny: number; colour: string }[] = []

  const reset = (w: number, h: number) => {
    const cell = Math.max(18, Math.round(Math.min(w, h) / 22))
    p = {
      x: Math.floor((w / cell) * 0.5),
      y: Math.floor((h / cell) * 0.5),
      dir: Math.floor(Math.random() * 4),
      colour: PIPE_COLOURS[Math.floor(Math.random() * PIPE_COLOURS.length)],
      visited: new Set(),
      cell,
      fade: 0,
    }
    painted = []
  }

  const DIRS = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]

  let acc = 0

  return {
    step(ctx, w, h, dt) {
      if (!p || p.fade > 0) {
        if (p && p.fade > 0) {
          // Fade the finished sculpture out, then start again.
          p.fade -= dt
          ctx.fillStyle = "rgba(0,0,0,0.16)"
          ctx.fillRect(0, 0, w, h)
          if (p.fade <= 0) reset(w, h)
          return
        }
        reset(w, h)
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, w, h)
      }
      const s = p as PipeState
      const cols = Math.floor(w / s.cell)
      const rows = Math.floor(h / s.cell)

      // Grow a few cells per second rather than one per frame.
      acc += dt
      const stepTime = 0.05
      while (acc >= stepTime) {
        acc -= stepTime
        /*
          Take any open neighbour, preferring straight ahead.

          An earlier version rolled dice on each turn and could refuse every
          open cell, which killed the pipe with space all around it. On the
          little preview monitor that meant it spent most of its life fading.
          Death now means actually boxed in.
        */
        const open = [s.dir, (s.dir + 1) % 4, (s.dir + 3) % 4, (s.dir + 2) % 4].filter((d) => {
          const nx = s.x + DIRS[d][0]
          const ny = s.y + DIRS[d][1]
          return nx >= 1 && ny >= 1 && nx < cols - 1 && ny < rows - 1 && !s.visited.has(`${nx},${ny}`)
        })
        if (open.length === 0) {
          s.fade = 0.9
          break
        }
        // Keep going straight two times in three; otherwise turn at random.
        const d =
          open[0] === s.dir && Math.random() < 0.66
            ? s.dir
            : open[Math.floor(Math.random() * open.length)]
        const nx = s.x + DIRS[d][0]
        const ny = s.y + DIRS[d][1]
        painted.push({ x: s.x, y: s.y, nx, ny, colour: s.colour })
        s.visited.add(`${nx},${ny}`)
        s.x = nx
        s.y = ny
        s.dir = d
        // Occasionally change colour at a joint, as the original did.
        if (Math.random() < 0.02) s.colour = PIPE_COLOURS[Math.floor(Math.random() * PIPE_COLOURS.length)]
      }

      // Repaint the whole sculpture each frame: cheap at this scale, and it
      // keeps resize correct.
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)
      const r = Math.max(3, s.cell / 3)
      for (const seg of painted) {
        ctx.strokeStyle = seg.colour
        ctx.lineWidth = r * 2
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(seg.x * s.cell + s.cell / 2, seg.y * s.cell + s.cell / 2)
        ctx.lineTo(seg.nx * s.cell + s.cell / 2, seg.ny * s.cell + s.cell / 2)
        ctx.stroke()
        // A highlight along the top edge sells the cylinder.
        ctx.strokeStyle = "rgba(255,255,255,0.35)"
        ctx.lineWidth = Math.max(1, r / 2)
        ctx.beginPath()
        ctx.moveTo(seg.x * s.cell + s.cell / 2, seg.y * s.cell + s.cell / 2 - r / 2)
        ctx.lineTo(seg.nx * s.cell + s.cell / 2, seg.ny * s.cell + s.cell / 2 - r / 2)
        ctx.stroke()
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* Scrolling Marquee                                                   */
/* ------------------------------------------------------------------ */

function marquee(text = "Joel Vasquez — builtbyjoel.dev"): Saver {
  let x: number | null = null
  return {
    step(ctx, w, h, dt) {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)
      const size = Math.max(16, Math.round(h / 6))
      ctx.font = `bold ${size}px "Times New Roman", serif`
      ctx.textBaseline = "middle"
      const width = ctx.measureText(text).width
      if (x === null) x = w
      x -= w * 0.12 * dt
      if (x < -width) x = w
      ctx.fillStyle = "#ff00ff"
      ctx.fillText(text, x, h / 2)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Starfield                                                           */
/* ------------------------------------------------------------------ */

function starfield(): Saver {
  const stars = Array.from({ length: 260 }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 99 + 1,
  }))
  return {
    step(ctx, w, h, dt) {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = "#ffffff"
      for (const star of stars) {
        star.z -= 33 * dt
        if (star.z <= 1) {
          star.x = Math.random() * 2 - 1
          star.y = Math.random() * 2 - 1
          star.z = 100
        }
        const k = 128 / star.z
        const px = w / 2 + star.x * k * w * 0.5
        const py = h / 2 + star.y * k * h * 0.5
        if (px < 0 || px >= w || py < 0 || py >= h) {
          star.z = 100
          continue
        }
        const size = Math.max(1, Math.round((1 - star.z / 100) * 3))
        ctx.fillRect(Math.round(px), Math.round(py), size, size)
      }
    },
  }
}

export function makeSaver(id: SaverId): Saver {
  switch (id) {
    case "flying-windows":
      return flyingWindows()
    case "mystify":
      return mystify()
    case "pipes":
      return pipes()
    case "marquee":
      return marquee()
    case "starfield":
      return starfield()
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/**
 * The stored screensaver choice.
 *
 * Kept in localStorage under the keys the Display Properties dialog has
 * always used, so an existing visitor's saved choice still counts. A custom
 * event carries changes across components in the same tab, because the
 * storage event only fires in other tabs.
 */
export interface SaverSettings {
  saver: SaverId | "none"
  waitMinutes: number
}

export const SAVER_CHANGE_EVENT = "win95-screensaver-change"

export function readSaverSettings(): SaverSettings {
  if (typeof window === "undefined") return { saver: "starfield", waitMinutes: 15 }
  const saved = localStorage.getItem("win95-screensaver")
  let wait = Number.parseInt(localStorage.getItem("win95-screensaver-wait") ?? "", 10)
  // An earlier build shipped a two-minute default, which cut in while people
  // were reading. Anyone still carrying that stored default moves to fifteen
  // minutes, the wait Windows itself suggested.
  if (wait === 2) wait = 15
  const valid = SAVERS.some((s) => s.id === saved)
  return {
    saver: saved === "none" ? "none" : valid ? (saved as SaverId) : "starfield",
    waitMinutes: Number.isFinite(wait) && wait >= 1 ? wait : 15,
  }
}

export function writeSaverSettings(settings: SaverSettings) {
  localStorage.setItem("win95-screensaver", settings.saver)
  localStorage.setItem("win95-screensaver-wait", String(settings.waitMinutes))
  window.dispatchEvent(new CustomEvent(SAVER_CHANGE_EVENT))
}
