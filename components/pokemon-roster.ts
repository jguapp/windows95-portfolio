/**
 * The twelve creatures, their sprites and their cries.
 *
 * Hand-drawing twelve 28x28 grids as ASCII would be about four hundred lines of
 * art that is hard to read and harder to adjust. Each species is described here
 * as a short list of shapes instead, and the grid is drawn from that once at
 * module load. It keeps the silhouettes genuinely different from one another
 * while staying small enough to change a single ear or fin without recounting
 * a wall of characters.
 *
 * Shades are the four Game Boy tones: 0 lightest, 3 darkest.
 */

export const SPRITE_SIZE = 28

type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; shade: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; shade: number }
  | { kind: "tri"; x: number; y: number; w: number; h: number; shade: number; flip?: boolean }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; shade: number }
  | { kind: "dot"; x: number; y: number; shade: number }

const ellipse = (cx: number, cy: number, rx: number, ry: number, shade: number): Shape => ({
  kind: "ellipse",
  cx,
  cy,
  rx,
  ry,
  shade,
})
const rect = (x: number, y: number, w: number, h: number, shade: number): Shape => ({ kind: "rect", x, y, w, h, shade })
const tri = (x: number, y: number, w: number, h: number, shade: number, flip = false): Shape => ({
  kind: "tri",
  x,
  y,
  w,
  h,
  shade,
  flip,
})
const line = (x1: number, y1: number, x2: number, y2: number, shade: number): Shape => ({
  kind: "line",
  x1,
  y1,
  x2,
  y2,
  shade,
})
const dot = (x: number, y: number, shade: number): Shape => ({ kind: "dot", x, y, shade })

/** Eyes and a mouth, the pair every one of them shares. */
const face = (cx: number, cy: number, spread = 4): Shape[] => [
  dot(cx - spread, cy, 3),
  dot(cx - spread + 1, cy, 3),
  dot(cx + spread - 1, cy, 3),
  dot(cx + spread, cy, 3),
  line(cx - 2, cy + 3, cx + 2, cy + 3, 3),
]

function draw(shapes: Shape[]): string[] {
  const grid: number[][] = Array.from({ length: SPRITE_SIZE }, () => Array(SPRITE_SIZE).fill(-1))

  const put = (x: number, y: number, shade: number) => {
    const px = Math.round(x)
    const py = Math.round(y)
    if (px < 0 || px >= SPRITE_SIZE || py < 0 || py >= SPRITE_SIZE) return
    grid[py][px] = shade
  }

  for (const shape of shapes) {
    if (shape.kind === "ellipse") {
      for (let y = shape.cy - shape.ry; y <= shape.cy + shape.ry; y++) {
        for (let x = shape.cx - shape.rx; x <= shape.cx + shape.rx; x++) {
          const dx = (x - shape.cx) / shape.rx
          const dy = (y - shape.cy) / shape.ry
          if (dx * dx + dy * dy <= 1.02) put(x, y, shape.shade)
        }
      }
    } else if (shape.kind === "rect") {
      for (let y = shape.y; y < shape.y + shape.h; y++) for (let x = shape.x; x < shape.x + shape.w; x++) put(x, y, shape.shade)
    } else if (shape.kind === "tri") {
      // A wedge that tapers to a point, either upward or downward.
      for (let i = 0; i < shape.h; i++) {
        const t = shape.flip ? i / shape.h : 1 - i / shape.h
        const half = Math.max(0, Math.round((shape.w / 2) * t))
        for (let x = shape.x - half; x <= shape.x + half; x++) put(x, shape.y + i, shape.shade)
      }
    } else if (shape.kind === "line") {
      const steps = Math.max(Math.abs(shape.x2 - shape.x1), Math.abs(shape.y2 - shape.y1))
      for (let i = 0; i <= steps; i++) {
        put(shape.x1 + ((shape.x2 - shape.x1) * i) / steps, shape.y1 + ((shape.y2 - shape.y1) * i) / steps, shape.shade)
      }
    } else {
      put(shape.x, shape.y, shape.shade)
    }
  }

  return grid.map((row) => row.map((shade) => (shade < 0 ? "." : String(shade))).join(""))
}

/**
 * A cry.
 *
 * Generation I cries were short bursts of noise and pitch sweep, and no two
 * sounded alike. Each species carries its own shape here: where the sweep
 * starts and ends, how long it lasts, how rough it is, and what waveform
 * carries it.
 */
export interface Cry {
  from: number
  to: number
  duration: number
  wave: "square" | "sawtooth" | "triangle" | "sine"
  /** How much filtered noise rides on top, 0 to 1. */
  grit: number
}

export interface Move {
  name: string
  power: number
  pp: number
  maxPp: number
}

export interface Species {
  name: string
  level: number
  maxHp: number
  moves: Move[]
  cry: Cry
  sprite: string[]
}

const mv = (name: string, power: number, pp: number): Move => ({ name, power, pp, maxPp: pp })

/** Every creature, drawn from its shapes at load. */
export const SPECIES: Record<string, Species> = {
  // --- the player's side ----------------------------------------------------
  VIRUSITE: {
    name: "VIRUSITE",
    level: 37,
    maxHp: 118,
    moves: [mv("SEG FAULT", 34, 15), mv("FORK BOMB", 28, 20), mv("NULL PTR", 22, 25), mv("KERNELPANIC", 45, 5)],
    cry: { from: 420, to: 190, duration: 0.34, wave: "square", grit: 0.35 },
    sprite: draw([
      ellipse(14, 16, 10, 9, 2),
      ellipse(14, 16, 8, 7, 1),
      // Spikes around the crown.
      tri(6, 4, 5, 5, 3),
      tri(14, 2, 5, 6, 3),
      tri(22, 4, 5, 5, 3),
      rect(9, 24, 3, 4, 3),
      rect(17, 24, 3, 4, 3),
      ...face(14, 15),
    ]),
  },
  PIXELPUP: {
    name: "PIXELPUP",
    level: 33,
    maxHp: 96,
    moves: [mv("BYTE BITE", 30, 20), mv("TAIL LOOP", 20, 25), mv("YIP", 14, 35)],
    cry: { from: 700, to: 520, duration: 0.2, wave: "square", grit: 0.15 },
    sprite: draw([
      ellipse(13, 18, 9, 6, 2),
      ellipse(13, 18, 7, 4, 1),
      ellipse(20, 12, 6, 5, 2),
      ellipse(20, 12, 4, 3, 1),
      tri(17, 5, 4, 5, 3),
      tri(24, 5, 4, 5, 3),
      rect(7, 23, 3, 5, 3),
      rect(13, 23, 3, 5, 3),
      rect(18, 23, 3, 5, 3),
      line(4, 16, 2, 10, 3),
      ...face(20, 11, 3),
    ]),
  },
  CACHEWYRM: {
    name: "CACHEWYRM",
    level: 35,
    maxHp: 104,
    moves: [mv("COIL", 26, 20), mv("EVICT", 33, 12), mv("THRASH", 40, 8)],
    cry: { from: 260, to: 640, duration: 0.4, wave: "sawtooth", grit: 0.2 },
    sprite: draw([
      // A body that snakes down the sprite.
      ellipse(20, 7, 6, 5, 2),
      ellipse(20, 7, 4, 3, 1),
      ellipse(14, 14, 5, 4, 2),
      ellipse(9, 20, 5, 4, 2),
      ellipse(14, 25, 6, 3, 2),
      line(3, 24, 1, 20, 3),
      ...face(20, 6, 3),
    ]),
  },
  HEAPHOG: {
    name: "HEAPHOG",
    level: 34,
    maxHp: 126,
    moves: [mv("ALLOC", 18, 30), mv("FRAGMENT", 31, 15), mv("OVERFLOW", 44, 6)],
    cry: { from: 180, to: 120, duration: 0.42, wave: "sawtooth", grit: 0.6 },
    sprite: draw([
      ellipse(14, 17, 11, 9, 2),
      ellipse(14, 17, 9, 7, 1),
      // A ring of quills.
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (Math.PI * (i + 0.5)) / 8 + Math.PI
        return line(14 + Math.cos(a) * 10, 17 + Math.sin(a) * 8, 14 + Math.cos(a) * 14, 17 + Math.sin(a) * 12, 3)
      }),
      rect(10, 25, 3, 3, 3),
      rect(16, 25, 3, 3, 3),
      ...face(14, 16),
    ]),
  },
  BITWING: {
    name: "BITWING",
    level: 36,
    maxHp: 88,
    moves: [mv("PARITY", 24, 20), mv("SWOOP", 32, 15), mv("XOR GUST", 38, 10)],
    cry: { from: 900, to: 1500, duration: 0.22, wave: "triangle", grit: 0.1 },
    sprite: draw([
      ellipse(14, 14, 5, 6, 2),
      ellipse(14, 13, 3, 4, 1),
      // Wings, spread wide.
      tri(6, 8, 12, 7, 2, true),
      tri(22, 8, 12, 7, 2, true),
      line(1, 12, 8, 8, 3),
      line(27, 12, 20, 8, 3),
      tri(14, 4, 4, 4, 3),
      rect(12, 20, 2, 5, 3),
      rect(15, 20, 2, 5, 3),
      ...face(14, 12, 3),
    ]),
  },
  STACKTOAD: {
    name: "STACKTOAD",
    level: 32,
    maxHp: 112,
    moves: [mv("PUSH", 22, 25), mv("POP", 22, 25), mv("UNWIND", 36, 10)],
    cry: { from: 150, to: 300, duration: 0.28, wave: "square", grit: 0.45 },
    sprite: draw([
      ellipse(14, 19, 12, 8, 2),
      ellipse(14, 19, 10, 6, 1),
      ellipse(9, 11, 4, 4, 2),
      ellipse(19, 11, 4, 4, 2),
      dot(9, 11, 3),
      dot(19, 11, 3),
      line(9, 22, 19, 22, 3),
      rect(3, 24, 5, 3, 3),
      rect(20, 24, 5, 3, 3),
    ]),
  },

  // --- the opposing side ----------------------------------------------------
  DARKBYTE: {
    name: "DARKBYTE",
    level: 34,
    maxHp: 104,
    moves: [mv("STACK SMASH", 30, 10), mv("RACE COND", 24, 15), mv("DEADLOCK", 36, 8)],
    cry: { from: 320, to: 150, duration: 0.36, wave: "sawtooth", grit: 0.5 },
    sprite: draw([
      rect(5, 8, 18, 16, 2),
      rect(7, 10, 14, 12, 1),
      tri(8, 2, 5, 7, 3),
      tri(20, 2, 5, 7, 3),
      rect(5, 24, 5, 4, 3),
      rect(18, 24, 5, 4, 3),
      ...face(14, 14, 5),
    ]),
  },
  NULLMOTH: {
    name: "NULLMOTH",
    level: 33,
    maxHp: 92,
    moves: [mv("DUST", 18, 30), mv("VOID BEAM", 34, 10), mv("LULL", 12, 20)],
    cry: { from: 1100, to: 700, duration: 0.3, wave: "sine", grit: 0.05 },
    sprite: draw([
      ellipse(14, 15, 4, 7, 2),
      ellipse(6, 12, 6, 8, 2),
      ellipse(22, 12, 6, 8, 2),
      ellipse(6, 12, 3, 5, 0),
      ellipse(22, 12, 3, 5, 0),
      ellipse(5, 21, 4, 5, 2),
      ellipse(23, 21, 4, 5, 2),
      line(12, 6, 9, 1, 3),
      line(16, 6, 19, 1, 3),
      ...face(14, 12, 2),
    ]),
  },
  RAMSPRITE: {
    name: "RAMSPRITE",
    level: 35,
    maxHp: 98,
    moves: [mv("REFRESH", 16, 30), mv("BIT FLIP", 29, 15), mv("LATENCY", 33, 12)],
    cry: { from: 1300, to: 1900, duration: 0.18, wave: "triangle", grit: 0.05 },
    sprite: draw([
      rect(9, 8, 10, 18, 2),
      rect(11, 10, 6, 14, 0),
      // Contacts down both edges, like a memory module.
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(6, 11 + i * 3, 3, 2, 3)),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(19, 11 + i * 3, 3, 2, 3)),
      line(14, 8, 14, 2, 3),
      ellipse(14, 2, 2, 2, 3),
      ...face(14, 14, 2),
    ]),
  },
  LOOPFISH: {
    name: "LOOPFISH",
    level: 31,
    maxHp: 86,
    moves: [mv("WHILE", 20, 25), mv("RECURSE", 35, 8), mv("BREAK", 26, 15)],
    cry: { from: 560, to: 380, duration: 0.24, wave: "sine", grit: 0.25 },
    sprite: draw([
      ellipse(15, 15, 10, 6, 2),
      ellipse(15, 15, 8, 4, 1),
      tri(3, 9, 9, 12, 2, true),
      tri(16, 5, 6, 5, 3),
      line(10, 21, 20, 21, 3),
      dot(20, 13, 3),
      dot(21, 13, 3),
      ellipse(15, 24, 3, 2, 3),
    ]),
  },
  GLITCHIMP: {
    name: "GLITCHIMP",
    level: 30,
    maxHp: 82,
    moves: [mv("SCRAMBLE", 21, 20), mv("HEX HEX", 27, 12), mv("CORRUPT", 33, 8)],
    cry: { from: 800, to: 200, duration: 0.26, wave: "square", grit: 0.55 },
    sprite: draw([
      ellipse(14, 13, 7, 6, 2),
      ellipse(14, 13, 5, 4, 1),
      // Oversized ears.
      tri(5, 3, 7, 9, 2),
      tri(23, 3, 7, 9, 2),
      rect(11, 19, 6, 6, 2),
      rect(10, 25, 3, 3, 3),
      rect(16, 25, 3, 3, 3),
      line(21, 20, 26, 16, 3),
      ...face(14, 12, 3),
    ]),
  },
  DAEMONYX: {
    name: "DAEMONYX",
    level: 40,
    maxHp: 140,
    moves: [mv("ROOT KIT", 38, 10), mv("SIGKILL", 48, 5), mv("ZOMBIE", 26, 15), mv("FORK", 30, 12)],
    cry: { from: 240, to: 90, duration: 0.5, wave: "sawtooth", grit: 0.7 },
    sprite: draw([
      ellipse(14, 16, 8, 10, 3),
      ellipse(14, 15, 6, 8, 2),
      tri(7, 1, 5, 8, 3),
      tri(21, 1, 5, 8, 3),
      // Ragged wings.
      tri(3, 8, 10, 10, 3, true),
      tri(25, 8, 10, 10, 3, true),
      line(0, 10, 6, 6, 3),
      line(28, 10, 22, 6, 3),
      rect(10, 25, 3, 3, 3),
      rect(16, 25, 3, 3, 3),
      dot(11, 14, 0),
      dot(12, 14, 0),
      dot(17, 14, 0),
      dot(18, 14, 0),
      line(12, 19, 17, 19, 0),
    ]),
  },
}

/** The six the visitor plays, in order. */
export const PLAYER_TEAM = ["VIRUSITE", "PIXELPUP", "CACHEWYRM", "HEAPHOG", "BITWING", "STACKTOAD"]

/** The six they face, ending with the one that hits hardest. */
export const FOE_TEAM = ["DARKBYTE", "NULLMOTH", "RAMSPRITE", "LOOPFISH", "GLITCHIMP", "DAEMONYX"]
