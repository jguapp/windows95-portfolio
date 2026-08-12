/**
 * Synthesised sound effects.
 *
 * The project referenced 28 audio files that never existed: 22 game sounds
 * that were never committed, plus the startup chime and five Pokemon sounds
 * that used to live on an external bucket and now 404 there. Every play() call
 * failed silently because the promise rejection was swallowed.
 *
 * Rather than source 28 files, licence them and carry the bytes, these are
 * generated with the Web Audio API. Square and triangle oscillators with short
 * envelopes are exactly the 1995 palette, cost nothing to ship, and can be
 * tuned in code.
 *
 * Everything is lazy: the AudioContext is only created on the first play, so
 * no context is opened before a user gesture.
 */

type Wave = "square" | "triangle" | "sawtooth" | "sine"

let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // Browsers suspend the context until a gesture; resume is a no-op otherwise.
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

export function setMuted(value: boolean) {
  muted = value
}

export function isMuted() {
  return muted
}

interface ToneOptions {
  freq: number
  /** Seconds. */
  duration?: number
  wave?: Wave
  gain?: number
  /** Slide to this frequency across the note, for sweeps. */
  slideTo?: number
  /** Seconds to wait before starting, for building sequences. */
  delay?: number
}

export function tone({ freq, duration = 0.09, wave = "square", gain = 0.05, slideTo, delay = 0 }: ToneOptions) {
  const ac = audio()
  if (!ac || muted) return

  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()

  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration)

  // A short attack and exponential decay stops every note clicking.
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(amp).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** White-noise burst, for explosions and card shuffles. */
export function noise(duration = 0.2, gain = 0.05, filterHz = 1200) {
  const ac = audio()
  if (!ac || muted) return

  const frames = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)

  const src = ac.createBufferSource()
  src.buffer = buffer

  const lp = ac.createBiquadFilter()
  lp.type = "lowpass"
  lp.frequency.value = filterHz

  const amp = ac.createGain()
  amp.gain.value = gain

  src.connect(lp).connect(amp).connect(ac.destination)
  src.start()
}

function sequence(notes: [freq: number, at: number, dur?: number][], wave: Wave = "square", gain = 0.05) {
  for (const [freq, at, dur] of notes) tone({ freq, delay: at, duration: dur ?? 0.1, wave, gain })
}

/** Named effects, so callers ask for a sound rather than a frequency. */
export const sfx = {
  click: () => tone({ freq: 620, duration: 0.03, gain: 0.03 }),
  hover: () => tone({ freq: 880, duration: 0.02, gain: 0.015 }),
  select: () => tone({ freq: 720, duration: 0.05, gain: 0.035 }),

  // Windows 95 startup: a four-note rising chord, not the real recording.
  startup: () => sequence([[392, 0, 0.5], [523.25, 0.12, 0.5], [659.25, 0.24, 0.55], [783.99, 0.36, 0.7]], "triangle", 0.06),

  // Tetris
  move: () => tone({ freq: 330, duration: 0.03, gain: 0.03 }),
  rotate: () => tone({ freq: 520, duration: 0.04, gain: 0.035 }),
  drop: () => tone({ freq: 180, duration: 0.07, gain: 0.05, slideTo: 90 }),
  lineClear: () => sequence([[660, 0], [880, 0.06], [1174, 0.12, 0.16]], "square", 0.05),
  levelUp: () => sequence([[523, 0], [659, 0.08], [784, 0.16], [1047, 0.24, 0.2]], "square", 0.05),

  // Minesweeper
  flag: () => tone({ freq: 900, duration: 0.04, gain: 0.035 }),
  reveal: () => tone({ freq: 480, duration: 0.025, gain: 0.02 }),
  explosion: () => {
    noise(0.45, 0.09, 900)
    tone({ freq: 140, duration: 0.4, gain: 0.06, slideTo: 40, wave: "sawtooth" })
  },

  // Cards
  cardDeal: () => noise(0.07, 0.035, 3000),
  cardFlip: () => noise(0.05, 0.03, 5000),

  // Chess
  chessMove: () => tone({ freq: 300, duration: 0.05, gain: 0.04, wave: "triangle" }),
  chessCapture: () => {
    noise(0.09, 0.04, 2200)
    tone({ freq: 200, duration: 0.09, gain: 0.04, slideTo: 120 })
  },
  chessCheck: () => sequence([[880, 0], [740, 0.09, 0.14]], "square", 0.045),

  // Pong
  paddle: () => tone({ freq: 480, duration: 0.035, gain: 0.04 }),
  wall: () => tone({ freq: 360, duration: 0.03, gain: 0.035 }),
  score: () => sequence([[300, 0], [220, 0.09, 0.16]], "square", 0.05),

  // Outcomes
  win: () => sequence([[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3, 0.35]], "square", 0.055),
  lose: () => sequence([[392, 0], [330, 0.12], [262, 0.24, 0.4]], "sawtooth", 0.05),

  // Pokemon battle
  battleStart: () => sequence([[440, 0], [554, 0.08], [659, 0.16], [880, 0.24, 0.3]], "square", 0.05),
  hit: () => {
    noise(0.12, 0.05, 1400)
    tone({ freq: 220, duration: 0.1, gain: 0.04, slideTo: 110, wave: "sawtooth" })
  },
  menu: () => tone({ freq: 700, duration: 0.03, gain: 0.03 }),
}

export type SfxName = keyof typeof sfx

export function play(name: SfxName) {
  sfx[name]()
}

/** The paths the games were asking for, mapped onto synthesised effects. */
const BY_PATH: Record<string, SfxName> = {
  "/sounds/win95-startup.mp3": "startup",
  "/sounds/select.mp3": "select",
  "/sounds/hover.mp3": "hover",
  "/sounds/click.mp3": "click",
  "/sounds/arcade-music.mp3": "select",
  "/sounds/flag.mp3": "flag",
  "/sounds/explosion.mp3": "explosion",
  "/sounds/victory.mp3": "win",
  "/sounds/gameover.mp3": "lose",
  "/sounds/paddle.mp3": "paddle",
  "/sounds/score.mp3": "score",
  "/sounds/card-deal.mp3": "cardDeal",
  "/sounds/card-flip.mp3": "cardFlip",
  "/sounds/chess-move.mp3": "chessMove",
  "/sounds/chess-capture.mp3": "chessCapture",
  "/sounds/chess-check.mp3": "chessCheck",
  "/sounds/tetris/move.mp3": "move",
  "/sounds/tetris/rotate.mp3": "rotate",
  "/sounds/tetris/drop.mp3": "drop",
  "/sounds/tetris/clear.mp3": "lineClear",
  "/sounds/tetris/levelup.mp3": "levelUp",
  "/sounds/tetris/gameover.mp3": "lose",
  "/sounds/tetris/theme.mp3": "select",
  "/sounds/pokemon-battle.mp3": "battleStart",
  "/sounds/pokemon-hit.mp3": "hit",
  "/sounds/pokemon-victory.mp3": "win",
  "/sounds/pokemon-defeat.mp3": "lose",
  "/sounds/pokemon-menu.mp3": "menu",
}

/**
 * Stand-in for `new Audio(path)`.
 *
 * The games already hold these in state, set currentTime and volume, and call
 * play(). Matching that shape means each game keeps its own enable/disable
 * logic instead of every one being restructured.
 */
export interface SynthAudio {
  play: () => Promise<void>
  pause: () => void
  currentTime: number
  volume: number
  loop: boolean
  src: string
}

export function createSound(path: string): SynthAudio {
  const name = BY_PATH[path]
  return {
    src: path,
    currentTime: 0,
    volume: 1,
    loop: false,
    pause: () => {},
    play: async () => {
      if (name) sfx[name]()
    },
  }
}
