"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cry, sfx } from "@/lib/sound"

/**
 * Pokemon battle, Generation I.
 *
 * Windows 95 shipped in August 1995. Pokemon Red and Green followed in Japan
 * in February 1996 and Red and Blue reached North America in September 1998,
 * so Generation I on the original Game Boy is the closest contemporary. That
 * means a 160x144 screen in four shades of olive green, with no colour at all.
 *
 * The layout follows the Generation I grid: opponent front sprite upper right
 * with its status box upper left, player back sprite lower left with its box
 * lower right, and the text box across the bottom. The opponent's box carries
 * no HP numerals; the player's does. Levels read L34, not Lv34. Gender symbols
 * did not exist until Generation II, so there are none. The menu is FIGHT and
 * PKMN in the left column, ITEM and RUN in the right, which are the Generation
 * I labels rather than BAG and POKEMON.
 *
 * With no colour the HP bar cannot run green to yellow to red, so it darkens
 * through the palette and dithers when critical, which is how the hardware
 * conveyed the same thing.
 */

/** The DMG palette, lightest to darkest. */
/**
 * Four shades, black to white.
 *
 * Red and Blue were four tones and the hardware decided their colour: the
 * original Game Boy tinted them green, the Pocket showed them as grey. The
 * screenshots everyone remembers from the manuals and the guides are the grey
 * ones, so that is what this uses.
 */
const P = ["#ffffff", "#a8a8a8", "#585858", "#000000"] as const

const SCREEN_W = 160
const SCREEN_H = 144
/**
 * How many screen pixels per Game Boy pixel.
 *
 * At 4x the whole battle was 640x576 and the 8x8 pixel face left almost no
 * air between rows, so names and the party list read as cramped. Six keeps
 * the pixel grid exact and fits a laptop with room to spare.
 */
const SCALE = 6
/**
 * Where the move list sits inside the text box.
 *
 * Four moves at nine pixels apart from y=117 put the fourth baseline on 144,
 * the very bottom edge of the screen, so it was drawn off the panel and could
 * not be read. These keep all four inside the box.
 */

/** Six party rows have to fit between the text box's frame lines at 104 and
 *  144. Starting where the two move rows start put the sixth name on the
 *  bottom edge, so the list starts higher and steps tighter. */

/**
 * Sprites are 28x28 grids drawn at two logical pixels each, filling the 56x56
 * box Generation I used while staying legible in source. Each digit indexes
 * the palette; a dot is transparent.
 */
import { FOE_TEAM, PLAYER_TEAM, SPECIES, effectiveness, type Move, type Species } from "./pokemon-roster"
import { getVolume, isMuted } from "@/lib/sound"

/**
 * Optional soundtrack, dropped into public/audio by name. When a file is
 * absent the play() promise rejects, the handler swallows it, and the battle
 * keeps its synthesised jingles: music is an upgrade, never a requirement.
 */
const MUSIC = {
  /*
    loopStart is where the theme rejoins after each pass: the opening bars
    play once, then the track cycles from this point. Tune it by ear if the
    join sounds off; it is seconds into the file. The end of the loop is
    found automatically by trimming the recording's fade-out.
  */
  battle: { src: "/audio/10. Battle! (Trainer Battle).mp3", loop: true, loopStart: 4.0 },
  victory: { src: "/audio/12. Victory! (Trainer Battle).mp3", loop: false, loopStart: 0 },
}

/**
 * Where the recording starts fading out.
 *
 * OST rips end on a long fade, and looping across it means the music dips to
 * silence and jolts back. Scanning RMS in quarter-second windows from the
 * end, the loop point is the last window still at half the track's median
 * level; the fade past it is never played.
 */
function findLoopEnd(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0)
  const win = Math.floor(buffer.sampleRate * 0.25)
  const rms: number[] = []
  for (let i = 0; i + win <= data.length; i += win) {
    let sum = 0
    for (let j = i; j < i + win; j += 16) sum += data[j] * data[j]
    rms.push(Math.sqrt(sum / (win / 16)))
  }
  if (rms.length === 0) return buffer.duration
  const sorted = [...rms].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  /*
    The fade is over once a window falls below three quarters of the track's
    median level; backing off another 0.4s keeps the loop clear of the fade's
    very first shoulder, which is where the audible dip lived.
  */
  let end = rms.length - 1
  while (end > 0 && rms[end] < median * 0.75) end--
  const t = ((end + 1) * win) / buffer.sampleRate - 0.4
  return t > buffer.duration * 0.5 ? t : buffer.duration
}

/** The nearest sample where the wave crosses zero, so a loop join cannot click. */
function snapToZeroCrossing(buffer: AudioBuffer, seconds: number): number {
  const data = buffer.getChannelData(0)
  const centre = Math.min(data.length - 2, Math.max(1, Math.floor(seconds * buffer.sampleRate)))
  for (let d = 0; d < buffer.sampleRate / 20; d++) {
    for (const i of [centre - d, centre + d]) {
      if (i > 0 && i < data.length && data[i - 1] <= 0 && data[i] >= 0) {
        return i / buffer.sampleRate
      }
    }
  }
  return seconds
}

/** A creature in play: its species, plus the health, PP and stages it has. */
interface Fighter {
  species: Species
  name: string
  level: number
  hp: number
  maxHp: number
  moves: Move[]
  /** Stat stages, -6 to +6, reset whenever the fighter is sent out. */
  atkStage: number
  defStage: number
}

/** Rolls a species out into a fighter at full health. */
function toFighter(key: string): Fighter {
  const species = SPECIES[key]
  return {
    species,
    name: species.name,
    level: species.level,
    hp: species.maxHp,
    maxHp: species.maxHp,
    moves: species.moves.map((m) => ({ ...m })),
    atkStage: 0,
    defStage: 0,
  }
}

/**
 * A custom trainer sprite, quantised at runtime.
 *
 * Drop PNGs at /images/battle/trainer-player.png and trainer-rival.png and
 * they replace the drawn trainers, run through the same four-tone fit the
 * monsters use: longest side to 56, bottom-anchored, contrast-stretched.
 * Near-white counts as background so a sprite on white paper works as-is.
 */
function gridFromImage(img: HTMLImageElement): string[] {
  const SIZE = 56
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) return []
  const scale = SIZE / Math.max(img.width, img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  ctx.drawImage(img, Math.floor((SIZE - w) / 2), SIZE - h, w, h)
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data
  const lum = (i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
  const bg = (i: number) => d[i + 3] < 128 || (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)
  let lo = 255
  let hi = 0
  for (let i = 0; i < d.length; i += 4) {
    if (bg(i)) continue
    const v = lum(i)
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const span = Math.max(1, hi - lo)
  const rows: string[] = []
  for (let y = 0; y < SIZE; y++) {
    let row = ""
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      if (bg(i)) {
        row += "."
      } else {
        const t = (lum(i) - lo) / span
        row += t > 0.78 ? "0" : t > 0.52 ? "1" : t > 0.26 ? "2" : "3"
      }
    }
    rows.push(row)
  }
  return rows
}

/** Gen I stage arithmetic: +2 doubles, -2 halves, by way of (2+s)/2. */
const stageMult = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))

/** Collapse a sprite grid into horizontal runs so it renders as few rects. */
function runs(grid: string[]) {
  const out: { x: number; y: number; w: number; shade: number }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === "." || ch === " ") {
        x++
        continue
      }
      let w = 1
      while (x + w < row.length && row[x + w] === ch) w++
      out.push({ x, y, w, shade: Number(ch) })
      x += w
    }
  })
  return out
}

function Sprite({ grid, x, y, scale = 1 }: { grid: string[]; x: number; y: number; scale?: number }) {
  const cells = useMemo(() => runs(grid), [grid])
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={1} fill={P[c.shade]} />
      ))}
    </g>
  )
}

/**
 * The Generation I bordered box, from the components sheet: a two-pixel line
 * with stepped corner curls, the frame every dialog in Red and Blue wore.
 */
function Box({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const k = P[3]
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={P[0]} />
      {/* Thin outer line, held back from the corners. */}
      <rect x={x + 3} y={y} width={w - 6} height={1} fill={k} />
      <rect x={x + 3} y={y + h - 1} width={w - 6} height={1} fill={k} />
      <rect x={x} y={y + 3} width={1} height={h - 6} fill={k} />
      <rect x={x + w - 1} y={y + 3} width={1} height={h - 6} fill={k} />
      {/* Outer corner steps. */}
      <rect x={x + 1} y={y + 1} width={2} height={2} fill={k} />
      <rect x={x + w - 3} y={y + 1} width={2} height={2} fill={k} />
      <rect x={x + 1} y={y + h - 3} width={2} height={2} fill={k} />
      <rect x={x + w - 3} y={y + h - 3} width={2} height={2} fill={k} />
      {/* Thick inner line, one unit in from the outer. */}
      <rect x={x + 4} y={y + 2} width={w - 8} height={2} fill={k} />
      <rect x={x + 4} y={y + h - 4} width={w - 8} height={2} fill={k} />
      <rect x={x + 2} y={y + 4} width={2} height={h - 8} fill={k} />
      <rect x={x + w - 4} y={y + 4} width={2} height={h - 8} fill={k} />
    </>
  )
}

/**
 * The HP gauge as the sheet draws it: HP in its own little cap, a framed
 * channel with rounded ends, and the bar riding inside.
 */
function HpBar({ x, y, ratio }: { x: number; y: number; ratio: number }) {
  const WIDTH = 48
  const filled = Math.max(0, Math.round(WIDTH * ratio))
  const shade = ratio > 0.5 ? P[2] : P[3]
  return (
    <>
      {/* The HP cap: small, with its colon ending just shy of the bar. */}
      <text x={x - 12} y={y + 2.5} fill={P[3]} fontSize={3.75} className="font-pixel">
        HP:
      </text>
      {/* A slim frameless gauge: light track, dark fill, nothing else. */}
      <rect x={x} y={y} width={WIDTH} height={2} fill={P[1]} />
      {/* Full-width fill scaled to the ratio: scaling transitions, so damage
          trickles the bar down rather than cutting a chunk in one frame. */}
      <rect
        x={x}
        y={y}
        width={WIDTH}
        height={2}
        fill={shade}
        style={{
          transform: `scaleX(${Math.max(0, ratio)})`,
          transformBox: "fill-box",
          transformOrigin: "left center",
          transition: "transform 0.55s linear",
        }}
      />
      {ratio <= 0.2 &&
        Array.from({ length: filled }).map((_, i) =>
          i % 2 === 0 ? <rect key={i} x={x + i} y={y} width={1} height={1} fill={P[0]} /> : null,
        )}
    </>
  )
}

/**
 * A fighter seen from behind.
 *
 * Red and Blue drew dedicated back sprites; at 28 pixels those were the same
 * silhouette with the face gone and the shading kept. That is exactly what
 * this computes: mirror the stance, keep the outline, and flatten highlights
 * and dark face marks into the mid shades so the eyes disappear.
 */
function backView(grid: string[]): string[] {
  const height = grid.length
  const width = Math.max(...grid.map((row) => row.length))
  const cells = grid.map((row) => [...row.padEnd(width, ".")].reverse())
  const empty = (r: number, c: number) => cells[r][c] === "." || cells[r][c] === " "

  /*
    Eyes and mouths are often unpainted holes inside the ink, showing the
    background through, so flattening painted pixels alone leaves the face
    staring out of the back. A flood fill from the frame marks the true
    outside; every other empty cell is a hole and gets skinned over.
  */
  const outside = Array.from({ length: height }, () => Array<boolean>(width).fill(false))
  const stack: [number, number][] = []
  for (let r = 0; r < height; r++) {
    for (const c of [0, width - 1]) if (empty(r, c)) stack.push([r, c])
  }
  for (let c = 0; c < width; c++) {
    for (const r of [0, height - 1]) if (empty(r, c)) stack.push([r, c])
  }
  while (stack.length) {
    const [r, c] = stack.pop() as [number, number]
    if (r < 0 || r >= height || c < 0 || c >= width || outside[r][c] || !empty(r, c)) continue
    outside[r][c] = true
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1])
  }

  const isOutside = (r: number, c: number) => r < 0 || r >= height || c < 0 || c >= width || outside[r][c]
  return cells.map((row, r) =>
    row
      .map((ch, c) => {
        if (outside[r][c]) return "."
        const boundary = isOutside(r - 1, c) || isOutside(r + 1, c) || isOutside(r, c - 1) || isOutside(r, c + 1)
        if (boundary) return "3"
        if (empty(r, c)) return "2"
        return ch === "0" || ch === "3" ? "2" : ch
      })
      .join(""),
  )
}



/**
 * The party marker: a tiny ball, drawn from the supplied pixel art.
 * Alive is the full ball; fainted keeps only a dim outline.
 */
function Ball({ x, y, alive }: { x: number; y: number; alive: boolean }) {
  // 8x8 grid: # outline, G grey cap, W white, . empty.
  const rows = ["..####..", ".#GGGG#.", "#GGWGGG#", "#GGGGGG#", "#WWWWWW#", "#WWWWWW#", ".#WWWW#.", "..####.."]
  const tone = (ch: string) => (ch === "#" ? P[3] : ch === "G" ? P[2] : P[0])
  const cells: React.ReactElement[] = []
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === ".") continue
      if (!alive && ch !== "#") continue
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={x + i * 0.75}
          y={y + j * 0.75}
          width={0.75}
          height={0.75}
          fill={alive ? tone(ch) : P[1]}
        />,
      )
    }
  })
  return <g data-ball>{cells}</g>
}


function Label({
  x,
  y,
  children,
  size = 7,
  width,
}: {
  x: number
  y: number
  children: string
  size?: number
  /** Fit the text to exactly this width, for names that must match the bar. */
  width?: number
}) {
  // Press Start 2P is the classic 8x8 arcade face, which is as close to the
  // Game Boy character set as a web font gets.
  return (
    <text
      x={x}
      y={y}
      fill={P[3]}
      fontSize={size}
      className="font-pixel"
      textLength={width}
      lengthAdjust={width ? "spacingAndGlyphs" : undefined}
    >
      {children}
    </text>
  )
}

type Phase = "menu" | "fight" | "party" | "items" | "message" | "over"

interface PokemonBattleProps {
  onClose: () => void
}

export default function PokemonBattle({ onClose }: PokemonBattleProps) {
  /**
   * Six a side, as a real battle is.
   *
   * Both teams are held in full so a fainted creature is replaced rather than
   * ending the match, and so the PKMN menu can switch between the ones still
   * standing.
   */
  const [team, setTeam] = useState<Fighter[]>(() => PLAYER_TEAM.map(toFighter))
  const [foes, setFoes] = useState<Fighter[]>(() => FOE_TEAM.map(toFighter))
  const [active, setActive] = useState(0)
  const [foeActive, setFoeActive] = useState(0)

  const player = team[active]
  const foe = foes[foeActive]

  const setPlayer = useCallback(
    (update: (f: Fighter) => Fighter) => setTeam((t) => t.map((f, i) => (i === active ? update(f) : f))),
    [active],
  )
  const setFoe = useCallback(
    (update: (f: Fighter) => Fighter) => setFoes((t) => t.map((f, i) => (i === foeActive ? update(f) : f))),
    [foeActive],
  )

  /** The bag. Using one takes the turn, which is what an item costs. */
  const [items, setItems] = useState([
    { name: "POTION", heal: 20, count: 3 },
    { name: "SUPER POTION", heal: 50, count: 2 },
    { name: "FULL RESTORE", heal: 999, count: 1 },
    { name: "ETHER", heal: 0, count: 1 },
  ])
  /** The opening shows the two trainers before any monster appears. */
  const [trainersOnStage, setTrainersOnStage] = useState(true)
  /** Each side renders only after its send: the animation is the reveal. */
  const [playerOut, setPlayerOut] = useState(false)
  const [foeOut, setFoeOut] = useState(false)

  /** Drop-in trainer art, when the owner has put PNGs in /images/battle. */
  const [customTrainers, setCustomTrainers] = useState<{ player?: string[]; rival?: string[] }>({})

  useEffect(() => {
    let live = true
    const slots: [keyof typeof customTrainers, string][] = [
      ["player", "/images/battle/trainer-player.png"],
      ["rival", "/images/battle/trainer-rival.png"],
    ]
    for (const [key, src] of slots) {
      fetch(src, { method: "HEAD" })
        .then((res) => {
          if (!res.ok) return
          const img = new Image()
          img.onload = () => {
            if (!live) return
            const grid = gridFromImage(img)
            if (grid.length) setCustomTrainers((c) => ({ ...c, [key]: grid }))
          }
          img.src = src
        })
        .catch(() => {
          // No custom art; the drawn trainers carry the intro.
        })
    }
    return () => {
      live = false
    }
  }, [])
  /** One-shot CSS animation classes for each side and the whole screen. */
  const [playerAnim, setPlayerAnim] = useState<{ cls: string; t: number }>({ cls: "", t: 0 })
  const [foeAnim, setFoeAnim] = useState<{ cls: string; t: number }>({ cls: "", t: 0 })
  const [screenAnim, setScreenAnim] = useState<{ cls: string; t: number }>({ cls: "", t: 0 })
  /** The prompt line of the party and item screens; rejections land here. */
  const [note, setNote] = useState<string | null>(null)
  /** True while a faint forces the party screen: X cannot cancel, entry is free. */
  const [mustSwitch, setMustSwitch] = useState(false)

  const [phase, setPhase] = useState<Phase>("message")
  const [message, setMessage] = useState(`Enemy ${SPECIES[FOE_TEAM[0]].name} sent out!`)
  const [cursor, setCursor] = useState(0)
  const [busy, setBusy] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  /** Tears down whatever the scheduler has running: sources and timers. */
  const musicStopRef = useRef<(() => void) | null>(null)

  const stopMusic = useCallback(() => {
    musicStopRef.current?.()
    musicStopRef.current = null
  }, [])

  /*
    Web Audio rather than an <audio> element, for one reason: MP3 frames
    carry encoder padding, so element-level looping leaves a beat of silence
    at every join. A decoded buffer loops sample-accurately, which is what a
    battle theme needs. The fetch also answers the missing-file case without
    the red console 404 an element would log.
  */
  /*
    Looping by scheduler rather than by loop points: every join overlaps two
    sources under a ninety-millisecond equal fade, so the seam is a mix
    rather than a jump. The music also sits at a bed level, 0.35 of the
    shell volume, so the battle effects read over it.
  */
  const playMusic = useCallback(
    (track: { src: string; loop: boolean; loopStart: number }) => {
      fetch(encodeURI(track.src))
        .then(async (res) => {
          if (!res.ok) return
          const ctx = (audioCtxRef.current ??= new AudioContext())
          const buffer = await ctx.decodeAudioData(await res.arrayBuffer())
          stopMusic()
          const master = ctx.createGain()
          master.gain.value = isMuted() ? 0 : getVolume() * 0.25
          master.connect(ctx.destination)

          if (!track.loop) {
            const node = ctx.createBufferSource()
            node.buffer = buffer
            node.connect(master)
            node.start()
            musicStopRef.current = () => {
              try {
                node.stop()
              } catch {}
              master.disconnect()
            }
            return
          }

          const FADE = 0.3
          const loopStart = snapToZeroCrossing(buffer, Math.min(track.loopStart, buffer.duration / 2))
          const loopEnd = snapToZeroCrossing(buffer, findLoopEnd(buffer))
          const sources: AudioBufferSourceNode[] = []
          const timers: ReturnType<typeof setTimeout>[] = []
          let stopped = false

          /*
            Equal-power fades: a linear crossfade dips in the middle, which
            is the cut the ear catches at the seam. Sine and cosine curves
            hold the summed power flat across the overlap.
          */
          const STEPS = 64
          const fadeIn = new Float32Array(STEPS)
          const fadeOut = new Float32Array(STEPS)
          for (let i = 0; i < STEPS; i++) {
            const t = i / (STEPS - 1)
            fadeIn[i] = Math.sin((t * Math.PI) / 2)
            fadeOut[i] = Math.cos((t * Math.PI) / 2)
          }
          const spawn = (offset: number, when: number, duration: number) => {
            const src = ctx.createBufferSource()
            src.buffer = buffer
            const g = ctx.createGain()
            src.connect(g)
            g.connect(master)
            if (offset === 0) {
              g.gain.setValueAtTime(1, when)
            } else {
              g.gain.setValueCurveAtTime(fadeIn, when, FADE)
            }
            g.gain.setValueCurveAtTime(fadeOut, when + duration - FADE, FADE)
            src.start(when, offset, duration)
            sources.push(src)
          }

          let nextAt = ctx.currentTime + 0.05
          let offset = 0
          let duration = loopEnd
          const tick = () => {
            if (stopped) return
            spawn(offset, nextAt, duration)
            nextAt = nextAt + duration - FADE
            offset = loopStart
            duration = loopEnd - loopStart
            timers.push(setTimeout(tick, Math.max(50, (nextAt - ctx.currentTime - 0.5) * 1000)))
          }
          tick()

          musicStopRef.current = () => {
            stopped = true
            timers.forEach(clearTimeout)
            sources.forEach((src) => {
              try {
                src.stop()
              } catch {}
            })
            master.disconnect()
          }
        })
        .catch(() => {
          // Absent or offline: the synthesised jingles carry the battle.
        })
    },
    [stopMusic],
  )

  /*
    The turn logic runs inside timer chains, where captured state goes stale
    between renders. Every read goes through these refs instead: a timer always
    fires long after the render that followed the set, so the refs are current.
    The old direct reads once re-sent a fainted fighter for exactly this reason.
  */
  const teamRef = useRef(team)
  teamRef.current = team
  const foesRef = useRef(foes)
  foesRef.current = foes
  const activeRef = useRef(active)
  activeRef.current = active
  const foeActiveRef = useRef(foeActive)
  foeActiveRef.current = foeActive

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    sfx.battleStart()
    playMusic(MUSIC.battle)
    setMessage("RIVAL wants to fight!")
    const opening = setTimeout(() => {
      setTrainersOnStage(false)
      setMessage(`RIVAL sent out ${SPECIES[FOE_TEAM[0]].name}!`)
      setFoeOut(true)
      setFoeAnim({ cls: "pkmn-sendin", t: Date.now() })
      sfx.sendOut()
      cry(SPECIES[FOE_TEAM[0]].cry)
      const second = setTimeout(() => {
        setMessage(`Go! ${SPECIES[PLAYER_TEAM[0]].name}!`)
        setPlayerOut(true)
        setPlayerAnim({ cls: "pkmn-sendin", t: Date.now() })
        sfx.sendOut()
        cry(SPECIES[PLAYER_TEAM[0]].cry)
        const ready = setTimeout(() => setPhase("menu"), 1100)
        timers.current.push(ready)
      }, 1300)
      timers.current.push(second)
    }, 1500)
    timers.current.push(opening)
    const list = timers.current
    return () => {
      list.forEach(clearTimeout)
      stopMusic()
      audioCtxRef.current?.close().catch(() => {})
    }
    // playMusic is stable; listing it would re-run the opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Damage under the type chart and both fighters' stages. */
  const damage = (attacker: Fighter, defender: Fighter, move: Move) => {
    const eff = effectiveness(move.type, defender.species.type)
    const base = (move.power * attacker.level) / 40
    const scaled = (base * stageMult(attacker.atkStage)) / stageMult(defender.defStage)
    return { dealt: Math.max(1, Math.round(scaled * eff + Math.random() * 6)), eff }
  }

  /**
   * A stat-stage move lands: atkDown and defDown hit the user's opponent,
   * defUp the user itself. Returns the line to show; a stage already at its
   * cap fails the way Gen I said it did.
   */
  const runEffect = useCallback((userIsPlayer: boolean, move: Move): string => {
    const targetIsPlayer = move.effect === "defUp" ? userIsPlayer : !userIsPlayer
    const key = move.effect === "atkDown" ? "atkStage" : "defStage"
    const delta = move.effect === "defUp" ? 1 : -1
    const target = targetIsPlayer ? teamRef.current[activeRef.current] : foesRef.current[foeActiveRef.current]
    if ((delta > 0 && target[key] >= 6) || (delta < 0 && target[key] <= -6)) return "But it failed!"
    const apply = (f: Fighter) => ({ ...f, [key]: Math.max(-6, Math.min(6, f[key] + delta)) })
    if (targetIsPlayer) setPlayer(apply)
    else setFoe(apply)
    const owner = targetIsPlayer ? target.name : `Enemy ${target.name}`
    return `${owner}'s ${move.effect === "atkDown" ? "ATTACK" : "DEFENSE"} ${delta > 0 ? "rose" : "fell"}!`
  }, [setFoe, setPlayer])

  const foeTurn = useCallback(() => {
    const foe = foesRef.current[foeActiveRef.current]
    const player = teamRef.current[activeRef.current]
    const move = foe.moves[Math.floor(Math.random() * foe.moves.length)]
    const backToMenu = () => {
      setCursor(0)
      setPhase("menu")
      setBusy(false)
    }
    setMessage(`Enemy ${foe.name} used ${move.name}!`)
    if (!move.effect) setFoeAnim({ cls: "pkmn-lunge-foe", t: Date.now() })
    if (!move.effect) sfx.hit()
    else sfx.menu()
    after(900, () => {
      if (Math.random() * 100 >= move.accuracy) {
        setMessage(`Enemy ${foe.name}'s attack missed!`)
        sfx.miss()
        after(1000, backToMenu)
        return
      }
      if (move.effect) {
        const line = runEffect(false, move)
        setMessage(line)
        if (line.includes("rose")) sfx.statUp()
        else if (line.includes("fell")) sfx.statDown()
        // The wobble lands on whoever the stage change landed on.
        if (move.effect === "defUp") setFoeAnim({ cls: "pkmn-wobble", t: Date.now() })
        else setPlayerAnim({ cls: "pkmn-wobble", t: Date.now() })
        after(1100, backToMenu)
        return
      }
      const { dealt, eff } = damage(foe, player, move)
      const hp = Math.max(0, player.hp - dealt)
      setPlayer((f) => ({ ...f, hp }))
      if (eff > 1) sfx.hitSuper()
      else if (eff < 1) sfx.hitWeak()
      else sfx.hit()
      setPlayerAnim({ cls: "pkmn-blink", t: Date.now() })
      setHitFx({ side: "player", t: Date.now() })
      if (eff > 1) setScreenAnim({ cls: "pkmn-shake", t: Date.now() })
      const proceed = () => {
        if (hp !== 0) {
          backToMenu()
          return
        }
        setMessage(`${player.name} fainted!`)
        setPlayerAnim({ cls: "pkmn-faint", t: Date.now() })
        sfx.lose()
        const survivors = teamRef.current.some((f, i) => i !== activeRef.current && f.hp > 0)
        if (!survivors) {
          after(900, () => {
            stopMusic()
            setPhase("over")
          })
          return
        }
        // The player chooses the replacement; coming in after a faint is free.
        after(1000, () => {
          setMustSwitch(true)
          setNote(null)
          setCursor(teamRef.current.findIndex((f, i) => i !== activeRef.current && f.hp > 0))
          setPhase("party")
        })
      }
      if (eff !== 1) {
        after(700, () => {
          setMessage(eff > 1 ? "It's super effective!" : "It's not very effective...")
          after(900, proceed)
        })
      } else {
        after(700, proceed)
      }
    })
    // State is read through refs, which timers always see fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [after, runEffect])

  const performMove = useCallback(
    (index: number) => {
      if (busy) return
      const player = teamRef.current[activeRef.current]
      const foe = foesRef.current[foeActiveRef.current]
      const move = player.moves[index]
      if (move.pp === 0) {
        setMessage("No PP left for this move!")
        return
      }
      setBusy(true)
      setPhase("message")
      setPlayer((p) => ({ ...p, moves: p.moves.map((m, i) => (i === index ? { ...m, pp: m.pp - 1 } : m)) }))
      setMessage(`${player.name} used ${move.name}!`)
      // Only an attack lunges; a status move is a stance, not a strike.
      if (!move.effect) setPlayerAnim({ cls: "pkmn-lunge-player", t: Date.now() })
      if (!move.effect) sfx.hit()
      else sfx.menu()

      after(900, () => {
        if (Math.random() * 100 >= move.accuracy) {
          setMessage(`${player.name}'s attack missed!`)
          sfx.miss()
          after(1000, foeTurn)
          return
        }
        if (move.effect) {
          const line = runEffect(true, move)
          setMessage(line)
          if (line.includes("rose")) sfx.statUp()
          else if (line.includes("fell")) sfx.statDown()
          // The wobble lands on whoever the stage change landed on.
          if (move.effect === "defUp") setPlayerAnim({ cls: "pkmn-wobble", t: Date.now() })
          else setFoeAnim({ cls: "pkmn-wobble", t: Date.now() })
          after(1100, foeTurn)
          return
        }
        const { dealt, eff } = damage(player, foe, move)
        const hp = Math.max(0, foe.hp - dealt)
        setFoe((f) => ({ ...f, hp }))
        if (eff > 1) sfx.hitSuper()
        else if (eff < 1) sfx.hitWeak()
        else sfx.hit()
        setFoeAnim({ cls: "pkmn-blink", t: Date.now() })
        setHitFx({ side: "foe", t: Date.now() })
        if (eff > 1) setScreenAnim({ cls: "pkmn-shake", t: Date.now() })
        const proceed = () => {
          if (hp !== 0) {
            foeTurn()
            return
          }
          setMessage(`Enemy ${foe.name} fainted!`)
          setFoeAnim({ cls: "pkmn-faint", t: Date.now() })
          sfx.win()
          const next = foesRef.current.findIndex((f, i) => i !== foeActiveRef.current && f.hp > 0)
          if (next === -1) {
            after(900, () => {
              setMessage("You won the battle!")
              playMusic(MUSIC.victory)
              setPhase("over")
            })
            return
          }
          after(1000, () => {
            setFoes((t) => t.map((f, i) => (i === next ? { ...f, atkStage: 0, defStage: 0 } : f)))
            setFoeActive(next)
            setMessage(`Enemy sent out ${foesRef.current[next].name}!`)
            setFoeAnim({ cls: "pkmn-sendin", t: Date.now() })
            sfx.sendOut()
            cry(foesRef.current[next].species.cry)
            after(900, () => {
              setCursor(0)
              setPhase("menu")
              setBusy(false)
            })
          })
        }
        if (eff !== 1) {
          after(700, () => {
            setMessage(eff > 1 ? "It's super effective!" : "It's not very effective...")
            after(900, proceed)
          })
        } else {
          after(700, proceed)
        }
      })
    },
    // Same ref discipline as foeTurn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [after, busy, foeTurn, runEffect],
  )

  /**
   * Bring another of the six out by choice.
   *
   * The switch takes the turn, so the opponent gets a free hit, which is what
   * stops it being a way to dodge every attack. Stages reset on the way in,
   * as they always did.
   */
  const switchTo = useCallback(
    (index: number) => {
      const team = teamRef.current
      if (index === activeRef.current) {
        setNote(`${team[index].name} is already out!`)
        return
      }
      if (team[index].hp === 0) {
        setNote(`${team[index].name} has no energy left!`)
        return
      }

      setBusy(true)
      setPhase("message")
      setTeam((t) => t.map((f, i) => (i === index ? { ...f, atkStage: 0, defStage: 0 } : f)))
      setActive(index)
      setMessage(`Go! ${team[index].name}!`)
      setPlayerAnim({ cls: "pkmn-sendin", t: Date.now() })
      sfx.sendOut()
      cry(team[index].species.cry)
      after(1000, foeTurn)
    },
    [after, foeTurn],
  )

  /** The pick after a faint: free of the switch penalty, and X cannot skip it. */
  const replaceFainted = useCallback(
    (index: number) => {
      const team = teamRef.current
      if (index === activeRef.current || team[index].hp === 0) {
        setNote(`${team[index].name} has no energy left!`)
        return
      }
      setMustSwitch(false)
      setPhase("message")
      setTeam((t) => t.map((f, i) => (i === index ? { ...f, atkStage: 0, defStage: 0 } : f)))
      setActive(index)
      setMessage(`Go! ${team[index].name}!`)
      setPlayerAnim({ cls: "pkmn-sendin", t: Date.now() })
      sfx.sendOut()
      cry(team[index].species.cry)
      after(1000, () => {
        setCursor(0)
        setPhase("menu")
        setBusy(false)
      })
    },
    [after],
  )

  const applyItem = useCallback(
    (index: number) => {
      if (busy) return
      const item = items[index]
      if (item.count === 0) {
        setNote("There is none left!")
        return
      }
      // The ETHER restores PP rather than health.
      if (item.name === "ETHER") {
        if (player.moves.every((m) => m.pp === m.maxPp)) {
          setNote("It won't have any effect.")
          return
        }
        setBusy(true)
        setPhase("message")
        setItems((list) => list.map((it, i) => (i === index ? { ...it, count: it.count - 1 } : it)))
        setPlayer((f) => ({ ...f, moves: f.moves.map((m) => ({ ...m, pp: m.maxPp })) }))
        setMessage("JOEL used ETHER!")
        sfx.menu()
        after(900, () => {
          setMessage(`${player.name}'s PP was restored!`)
          after(1000, foeTurn)
        })
        return
      }
      if (player.hp === player.maxHp) {
        setNote("It won't have any effect.")
        return
      }
      setBusy(true)
      setPhase("message")
      setItems((list) => list.map((it, i) => (i === index ? { ...it, count: it.count - 1 } : it)))
      setMessage(`JOEL used ${item.name}!`)
      sfx.menu()
      after(900, () => {
        setPlayer((f) => ({ ...f, hp: Math.min(f.maxHp, f.hp + item.heal) }))
        setMessage(`${player.name}'s HP was restored!`)
        after(1000, foeTurn)
      })
    },
    [after, busy, foeTurn, items, player, setPlayer],
  )

  const run = useCallback(() => {
    setPhase("message")
    setMessage("Got away safely!")
    stopMusic()
    sfx.menu()
    after(1100, onClose)
  }, [after, onClose, stopMusic])

  // The Game Boy had no pointer, so this is keyboard-driven.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose()
      if (phase === "over") {
        if (e.key === "Enter") onClose()
        return
      }
      if (phase === "message") return
      if (busy && !(phase === "party" && mustSwitch)) return

      const count =
        phase === "menu" ? 4 : phase === "party" ? team.length : phase === "items" ? items.length + 1 : player.moves.length
      if (e.key === "ArrowDown") {
        setCursor((c) => (c + 1) % count)
        setNote(null)
      } else if (e.key === "ArrowUp") {
        setCursor((c) => (c - 1 + count) % count)
        setNote(null)
      } else if (e.key === "Enter" || e.key.toLowerCase() === "z") {
        if (phase === "menu") {
          if (cursor === 0) {
            setPhase("fight")
            setCursor(0)
          } else if (cursor === 1) {
            setNote(null)
            setPhase("party")
            setCursor(active)
          } else if (cursor === 2) {
            setNote(null)
            setPhase("items")
            setCursor(0)
          } else run()
        } else if (phase === "party") {
          if (mustSwitch) replaceFainted(cursor)
          else switchTo(cursor)
        } else if (phase === "items") {
          // The last row is CANCEL, as the original menu had.
          if (cursor === items.length) {
            setPhase("menu")
            setCursor(0)
          } else applyItem(cursor)
        } else {
          performMove(cursor)
        }
      } else if (e.key.toLowerCase() === "x" || e.key === "Backspace") {
        // A forced pick after a faint cannot be backed out of.
        if ((phase === "fight" || phase === "party" || phase === "items") && !mustSwitch) {
          setPhase("menu")
          setCursor(0)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, busy, cursor, items.length, mustSwitch, onClose, phase, player.moves.length, replaceFainted, run, performMove, switchTo, team.length, applyItem])

  /** The reference order: FIGHT and PkMn on top, ITEM and RUN below. */
  const MENU = [
    { label: "FIGHT", index: 0, col: 0, row: 0 },
    { label: "PKMN", index: 1, col: 1, row: 0 },
    { label: "ITEM", index: 2, col: 0, row: 1 },
    { label: "RUN", index: 3, col: 1, row: 1 },
  ]

  const playerBack = useMemo(() => backView(player.species.sprite), [player.species])

  /** A hit's visual: which side took it, and a key to restart the burst. */
  const [hitFx, setHitFx] = useState<{ side: "player" | "foe"; t: number } | null>(null)

  /** The party and item prompt line, wrapped the way the message box wraps. */
  const noteLines = (text: string) => (text.match(/.{1,24}(\s|$)/g) ?? [text]).slice(0, 2)

  // Size-6 glyphs advance 6 units, so 24 characters end at x=152 of 160.
  const lines = message.match(/.{1,24}(\s|$)/g) ?? [message]

  return createPortal(
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: "relative" }}>
        <style>{`
          .pkmn-lunge-player { animation: pkmn-lunge-p 0.45s ease-out; }
          @keyframes pkmn-lunge-p { 30% { transform: translate(10px, -5px); } }
          .pkmn-lunge-foe { animation: pkmn-lunge-f 0.45s ease-out; }
          @keyframes pkmn-lunge-f { 30% { transform: translate(-10px, 5px); } }
          .pkmn-blink { animation: pkmn-blink 0.5s steps(1); }
          @keyframes pkmn-blink { 0%, 40%, 80% { opacity: 0; } 20%, 60%, 100% { opacity: 1; } }
          .pkmn-wobble { animation: pkmn-wobble 0.5s ease-in-out; }
          @keyframes pkmn-wobble { 25% { transform: translateX(4px); } 50% { transform: translateX(-4px); } 75% { transform: translateX(3px); } }
          .pkmn-faint { animation: pkmn-faint 0.7s ease-in forwards; }
          @keyframes pkmn-faint { to { transform: translateY(46px); opacity: 0; } }
          .pkmn-shake { animation: pkmn-shake 0.45s linear; }
          @keyframes pkmn-shake { 20% { transform: translate(3px, 1px); } 40% { transform: translate(-3px, -1px); } 60% { transform: translate(2px, -1px); } 80% { transform: translate(-2px, 1px); } }
          .pkmn-burst-inner { animation: pkmn-burst 0.45s ease-out forwards; }
          @keyframes pkmn-burst { from { transform: scale(0.2); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
          .pkmn-flash { animation: pkmn-flash 0.4s steps(1) forwards; }
          .pkmn-sendin { animation: pkmn-sendin 0.4s ease-out; }
          @keyframes pkmn-sendin { from { transform: translateY(8px) scale(0.1); opacity: 0.4; } }
          @keyframes pkmn-flash { 0% { opacity: 0.9; } 25% { opacity: 0; } 50% { opacity: 0.9; } 75%, 100% { opacity: 0; } }
        `}</style>
        <svg
          data-gameboy
          width={SCREEN_W * SCALE}
          height={SCREEN_H * SCALE}
          viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated", display: "block", border: "10px solid #5a5a5a", borderRadius: 6 }}
        >
          <rect width={SCREEN_W} height={SCREEN_H} fill={P[0]} />
          <g key={`sa${screenAnim.t}`} className={screenAnim.cls}>

          {trainersOnStage ? (
            <>
              {/*
                The opening as the reference draws it: the rival top right,
                the player's back bottom left, each side's ball row on its
                line with the end hook.
              */}
              {customTrainers.rival && <Sprite grid={customTrainers.rival} x={96} y={0} />}
              {customTrainers.player && <Sprite grid={customTrainers.player} x={10} y={46} />}
              {foes.map((f, i) => (
                <Ball key={`fb${i}`} x={8 + i * 8} y={38} alive={f.hp > 0} />
              ))}
              {/* The ball-row lines wear the same rising hooks as the HP
                  panels: the riser climbs from the line toward the balls. */}
              <rect x={4} y={45} width={72} height={1} fill={P[3]} />
              <rect x={74} y={38} width={2} height={8} fill={P[3]} />
              {team.map((f, i) => (
                <Ball key={`pb${i}`} x={104 + i * 8} y={86} alive={f.hp > 0} />
              ))}
              <rect x={84} y={93} width={72} height={1} fill={P[3]} />
              <rect x={84} y={86} width={2} height={8} fill={P[3]} />
            </>
          ) : (
            <>
              {/* Opponent: front sprite upper right, thin status area upper left */}
              {foeOut && (
                <g key={`fa${foeAnim.t}`} className={foeAnim.cls}>
                  <Sprite grid={foe.species.sprite} x={96} y={6} />
                </g>
              )}
              {/* The name spans exactly the HP bar's width. */}
              <Label x={8} y={16} size={4.5} width={48}>
                {foe.name}
              </Label>
              <Label x={14} y={23} size={4}>
                {`:L${foe.level}`}
              </Label>
              <HpBar x={32} y={27} ratio={foe.hp / foe.maxHp} />
              {/* The panel's bracket: a full underline whose end rises past
                  the bar, framing the panel without touching it. */}
              <rect x={2} y={33} width={82} height={1} fill={P[3]} />
              <rect x={82} y={26} width={2} height={8} fill={P[3]} />

              {/* Player: back sprite lower left, thin status area lower right */}
              {playerOut && (
                <g key={`pa${playerAnim.t}`} className={playerAnim.cls}>
                  <Sprite grid={playerBack} x={10} y={46} />
                </g>
              )}
              <Label x={84} y={72} size={4.5} width={48}>
                {player.name}
              </Label>
              <Label x={90} y={79} size={4}>
                {`:L${player.level}`}
              </Label>
              <HpBar x={102} y={83} ratio={player.hp / player.maxHp} />
              <Label x={106} y={96} size={4}>
                {`${player.hp}/${player.maxHp}`}
              </Label>
              <rect x={74} y={100} width={84} height={1} fill={P[3]} />
              <rect x={74} y={93} width={2} height={8} fill={P[3]} />
            </>
          )}

          {/* Text box across the bottom two rows */}
          <Box x={0} y={104} w={SCREEN_W} h={40} />

          {phase === "menu" ? (
            <>
              <Label x={8} y={119} size={4.5}>
                What will
              </Label>
              <Label x={8} y={132} size={4.5}>
                {`${player.name} do?`}
              </Label>
              <Box x={86} y={104} w={74} h={40} />
              {MENU.map((m) => {
                const cx = 97 + m.col * 34
                const cy = 120 + m.row * 14
                return (
                  <g key={m.label}>
                    {cursor === m.index && (
                      <Label x={cx - 6} y={cy} size={4.5}>
                        &#9654;
                      </Label>
                    )}
                    {m.label === "PKMN" ? (
                      /* PkMn, with the small raised k and n of the original. */
                      <>
                        <Label x={cx} y={cy} size={4.5}>
                          P
                        </Label>
                        <Label x={cx + 4.5} y={cy - 2} size={3}>
                          K
                        </Label>
                        <Label x={cx + 7.8} y={cy} size={4.5}>
                          M
                        </Label>
                        <Label x={cx + 12.3} y={cy - 2} size={3}>
                          N
                        </Label>
                      </>
                    ) : (
                      <Label x={cx} y={cy} size={4.5}>
                        {m.label}
                      </Label>
                    )}
                  </g>
                )
              })}
            </>
          ) : phase === "fight" ? (
            <>
              {/* The reference fight layout: PP box and TYPE box on the
                  left, the move list in its own box reaching the edge. */}
              <Box x={0} y={60} w={86} h={18} />
              <Label x={10} y={72} size={4.5}>
                {`PP ${player.moves[cursor].pp}/${player.moves[cursor].maxPp}`}
              </Label>
              <Box x={0} y={78} w={86} h={22} />
              <Label x={8} y={89} size={3.75}>
                TYPE/
              </Label>
              <Label x={14} y={96} size={4.5}>
                {player.moves[cursor].type}
              </Label>
              <Box x={40} y={100} w={120} h={44} />
              {player.moves.map((m, i) => (
                <g key={m.name}>
                  {cursor === i && (
                    <Label x={46} y={112 + i * 8} size={4.5}>
                      &#9654;
                    </Label>
                  )}
                  <Label x={54} y={112 + i * 8} size={4.5}>
                    {m.name}
                  </Label>
                </g>
              ))}
            </>
          ) : (
            <>
              {lines.slice(0, 2).map((line, i) => (
                <Label key={i} x={8} y={118 + i * 12} size={4.5}>
                  {line.trim()}
                </Label>
              ))}
              {/* The waiting arrow, blinking as it always did. */}
              <path d="M150 138 l6 0 l-3 4 z" fill={P[3]}>
                <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
              </path>
            </>
          )}

          {/*
            The party screen: the full-page list Red and Blue opened, one row
            per creature with its mini sprite, level and gauge. Drawn last so
            it covers the field.
          */}
          {phase === "party" && (
            <g data-party>
              <rect width={SCREEN_W} height={SCREEN_H} fill={P[0]} />
              {team.map((f, i) => {
                const y = 4 + i * 18
                return (
                  <g key={f.name}>
                    {cursor === i && (
                      <Label x={1} y={y + 10} size={4.5}>
                        &#9654;
                      </Label>
                    )}
                    <Sprite grid={f.species.sprite} x={7} y={y} scale={0.275} />
                    <Label x={26} y={y + 8} size={4.5}>
                      {`${f.name}${i === active ? " *" : ""}`}
                    </Label>
                    <Label x={30} y={y + 15} size={3.75}>
                      {f.hp === 0 ? "FNT" : `:L${f.level}`}
                    </Label>
                    <HpBar x={108} y={y + 4} ratio={f.hp / f.maxHp} />
                    <Label x={108} y={y + 15} size={3.75}>
                      {`${f.hp}/${f.maxHp}`}
                    </Label>
                  </g>
                )
              })}
              <Box x={0} y={114} w={SCREEN_W} h={30} />
              {noteLines(note ?? (mustSwitch ? "Choose your next POKeMON." : "Choose a POKeMON.")).map((line, i) => (
                <Label key={i} x={8} y={127 + i * 10} size={4.5}>
                  {line.trim()}
                </Label>
              ))}
            </g>
          )}

          {/* The hit burst and the screen flash of a landing blow. */}
          {hitFx && (
            <g key={`fx${hitFx.t}`}>
              <g transform={hitFx.side === "foe" ? "translate(124 28)" : "translate(38 74)"}>
                <g className="pkmn-burst-inner">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                    <rect key={a} x={-1} y={-16} width={2} height={9} fill={P[3]} transform={`rotate(${a})`} />
                  ))}
                </g>
              </g>
              <rect className="pkmn-flash" width={SCREEN_W} height={SCREEN_H} fill={P[0]} opacity={0} />
            </g>
          )}
          </g>

          {/* The item menu, with the bag the trainer packed. */}
          {phase === "items" && (
            <g data-items>
              <rect width={SCREEN_W} height={SCREEN_H} fill={P[0]} />
              <Box x={0} y={0} w={SCREEN_W} h={114} />
              {items.map((it, i) => (
                <g key={it.name}>
                  {cursor === i && (
                    <Label x={7} y={16 + i * 14} size={4.5}>
                      &#9654;
                    </Label>
                  )}
                  <Label x={16} y={16 + i * 14} size={4.5}>
                    {it.name}
                  </Label>
                  <Label x={118} y={16 + i * 14} size={4.5}>
                    {`x${it.count}`}
                  </Label>
                </g>
              ))}
              {cursor === items.length && (
                <Label x={7} y={16 + items.length * 14} size={4.5}>
                  &#9654;
                </Label>
              )}
              <Label x={16} y={16 + items.length * 14} size={4.5}>
                CANCEL
              </Label>
              <Box x={0} y={114} w={SCREEN_W} h={30} />
              {noteLines(note ?? "Choose an ITEM.").map((line, i) => (
                <Label key={i} x={8} y={127 + i * 10} size={4.5}>
                  {line.trim()}
                </Label>
              ))}
            </g>
          )}
        </svg>

        <p
          data-hint
          style={{ color: "#a8a8a8", fontFamily: "monospace", fontSize: 12, marginTop: 10, textAlign: "center" }}
        >
          &uarr; &darr; choose &nbsp;&middot;&nbsp; ENTER select &nbsp;&middot;&nbsp; X back &nbsp;&middot;&nbsp; ESC
          quit
        </p>
      </div>
    </div>,
    document.body,
  )
}
