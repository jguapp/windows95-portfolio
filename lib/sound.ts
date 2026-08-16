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
/**
 * Master volume, 0 to 1.
 *
 * Every effect multiplies its own gain by this, so one control governs the
 * whole desktop rather than each game keeping its own idea of loudness.
 * Changes are broadcast so the tray slider and anything else stay in step.
 */
let volume = 0.7
const volumeListeners = new Set<() => void>()

export function getVolume(): number {
  return volume
}

export function setVolume(value: number) {
  volume = Math.max(0, Math.min(1, value))
  for (const listener of volumeListeners) listener()
}

export function subscribeVolume(listener: () => void): () => void {
  volumeListeners.add(listener)
  return () => volumeListeners.delete(listener)
}

/** The gain an effect should actually use, after the master control. */
function level(gain: number): number {
  return gain * volume
}

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
  for (const listener of volumeListeners) listener()
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

function tone({ freq, duration = 0.09, wave = "square", gain = 0.05, slideTo, delay = 0 }: ToneOptions) {
  const ac = audio()
  if (!ac || muted || volume === 0) return

  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()

  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration)

  // A short attack and exponential decay stops every note clicking.
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level(gain)), start + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(amp).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** White-noise burst, for explosions and card shuffles. */
function noise(duration = 0.2, gain = 0.05, filterHz = 1200) {
  const ac = audio()
  if (!ac || muted || volume === 0) return

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
  amp.gain.value = level(gain)

  src.connect(lp).connect(amp).connect(ac.destination)
  src.start()
}

function sequence(notes: [freq: number, at: number, dur?: number][], wave: Wave = "square", gain = 0.05) {
  for (const [freq, at, dur] of notes) tone({ freq, delay: at, duration: dur ?? 0.1, wave, gain })
}

/**
 * A piece landing on a wooden board.
 *
 * This is what makes the chess.com sounds read the way they do: a very short
 * noise transient for the contact, over a low sine that drops away fast for the
 * body of the wood. A plain oscillator beep cannot sound like an object hitting
 * a surface no matter what frequency it is given.
 *
 * @param strength Louder and lower for a capture than for a quiet move.
 */
function knock(delay = 0, strength = 1) {
  const ac = audio()
  if (!ac || muted) return

  const start = ac.currentTime + delay

  // Contact: a few milliseconds of band-limited noise.
  const frames = Math.floor(ac.sampleRate * 0.03)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    const fade = (1 - i / frames) ** 3
    data[i] = (Math.random() * 2 - 1) * fade
  }

  const src = ac.createBufferSource()
  src.buffer = buffer

  const band = ac.createBiquadFilter()
  band.type = "bandpass"
  band.frequency.value = 2400
  band.Q.value = 0.9

  const clickAmp = ac.createGain()
  clickAmp.gain.value = level(0.05 * strength)

  src.connect(band).connect(clickAmp).connect(ac.destination)
  src.start(start)

  // Body: the board itself resonating, gone in under a tenth of a second.
  const body = ac.createOscillator()
  const bodyAmp = ac.createGain()
  body.type = "sine"
  body.frequency.setValueAtTime(190 / strength, start)
  body.frequency.exponentialRampToValueAtTime(90, start + 0.07)
  bodyAmp.gain.setValueAtTime(0.0001, start)
  bodyAmp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level(0.07 * strength)), start + 0.004)
  bodyAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.09)
  body.connect(bodyAmp).connect(ac.destination)
  body.start(start)
  body.stop(start + 0.12)
}

/**
 * A creature's cry.
 *
 * Generation I cries were a pitch sweep with a burst of noise over it, and no
 * two sounded alike, so each species supplies its own sweep, length, waveform
 * and roughness rather than sharing one hit sound.
 */
export function cry(options: { from: number; to: number; duration: number; wave: Wave; grit: number }) {
  const ac = audio()
  if (!ac || muted || volume === 0) return

  const start = ac.currentTime
  const osc = ac.createOscillator()
  const amp = ac.createGain()

  osc.type = options.wave
  osc.frequency.setValueAtTime(options.from, start)
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, options.to), start + options.duration)

  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level(0.06)), start + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + options.duration)

  osc.connect(amp).connect(ac.destination)
  osc.start(start)
  osc.stop(start + options.duration + 0.02)

  if (options.grit > 0) noise(options.duration * 0.7, 0.05 * options.grit, 400 + options.from)
}

/** Named effects, so callers ask for a sound rather than a frequency. */
export const sfx = {
  click: () => tone({ freq: 620, duration: 0.03, gain: 0.03 }),
  hover: () => tone({ freq: 880, duration: 0.02, gain: 0.015 }),
  select: () => tone({ freq: 720, duration: 0.05, gain: 0.035 }),

  // Windows 95 startup: a four-note rising chord, not the real recording.
  startup: () => sequence([[392, 0, 0.5], [523.25, 0.12, 0.5], [659.25, 0.24, 0.55], [783.99, 0.36, 0.7]], "triangle", 0.06),

  /*
    The system sounds.

    Windows 95 shipped a scheme where the message box you got told you what
    had happened before you read it: a bright two-note ding for information, a
    heavy falling chord for a critical stop, a short rise for a question, and
    a flat pair for a warning. The dialog picks between these by its icon.

    These are synthesised. The originals are Microsoft's recordings.
  */
  /** Asterisk. Information, and the one people remember. */
  ding: () => sequence([[1046.5, 0, 0.16], [1567.98, 0.07, 0.3]], "sine", 0.05),
  /** Critical Stop. Four notes falling, the sound of having done something wrong. */
  chord: () =>
    sequence([[440, 0, 0.5], [349.23, 0.14, 0.5], [293.66, 0.28, 0.5], [220, 0.42, 0.75]], "triangle", 0.055),
  /** Question. Rising, because it is waiting for an answer. */
  question: () => sequence([[587.33, 0, 0.18], [880, 0.09, 0.34]], "sine", 0.045),
  /** Exclamation. Two of the same note, which reads as a nudge rather than a fall. */
  exclamation: () => sequence([[698.46, 0, 0.14], [698.46, 0.11, 0.26]], "triangle", 0.05),
  /** Window opening and closing, the quiet pair under everything else. */
  windowOpen: () => tone({ freq: 620, duration: 0.05, gain: 0.025, slideTo: 880, wave: "sine" }),
  windowClose: () => tone({ freq: 880, duration: 0.05, gain: 0.025, slideTo: 560, wave: "sine" }),
  /** Minimising and restoring, sweeping the way the animation does. */
  minimize: () => tone({ freq: 760, duration: 0.09, gain: 0.03, slideTo: 260, wave: "sine" }),
  maximize: () => tone({ freq: 260, duration: 0.09, gain: 0.03, slideTo: 760, wave: "sine" }),
  /** Emptying the Recycle Bin: paper going down a chute. */
  emptyBin: () => noise(0.45, 0.045, 2600),

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

  // Chess.
  //
  // Modelled on the set chess.com uses, which is one wooden knock with
  // variations layered on top rather than a different beep per event. Those
  // recordings are theirs, so these are synthesised to the same shape: a piece
  // hitting a board, plus whatever the move means.
  chessMove: () => knock(0, 1),
  /** The opponent's reply, pitched slightly differently so turns are audible. */
  chessMoveOpponent: () => knock(0, 0.9),
  /** Two impacts close together: the captured piece, then the captor landing. */
  chessCapture: () => {
    knock(0, 1.35)
    knock(0.045, 0.85)
  },
  /** Two pieces moving, a beat apart. */
  chessCastle: () => {
    knock(0, 1)
    knock(0.11, 0.95)
  },
  chessCheck: () => {
    knock(0, 1.1)
    sequence([[1046, 0.05, 0.09], [1318, 0.12, 0.14]], "sine", 0.045)
  },
  chessPromote: () => {
    knock(0, 1)
    sequence([[784, 0.05, 0.1], [1046, 0.13, 0.1], [1318, 0.21, 0.22]], "sine", 0.04)
  },
  /** A dull thud with no click: the piece never left the square. */
  chessIllegal: () => tone({ freq: 150, duration: 0.14, gain: 0.05, slideTo: 110, wave: "sawtooth" }),
  chessGameStart: () => {
    knock(0, 1)
    sequence([[523, 0.06, 0.12], [659, 0.16, 0.2]], "sine", 0.04)
  },
  chessGameEnd: () => sequence([[659, 0, 0.16], [523, 0.14, 0.16], [392, 0.28, 0.34]], "sine", 0.045),

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
  /** A resisted hit: short and dull. */
  hitWeak: () => {
    noise(0.08, 0.035, 700)
    tone({ freq: 150, duration: 0.09, gain: 0.035, slideTo: 90, wave: "sawtooth" })
  },
  /** A super effective hit: sharp crack and a longer ring. */
  hitSuper: () => {
    noise(0.16, 0.06, 2400)
    tone({ freq: 320, duration: 0.16, gain: 0.05, slideTo: 120, wave: "sawtooth" })
    tone({ freq: 640, duration: 0.05, gain: 0.03, delay: 0.02 })
  },
  /** A stat falling: a descending warble. */
  statDown: () => sequence([[420, 0], [340, 0.07], [260, 0.14], [200, 0.21, 0.3]], "triangle", 0.045),
  /** A stat rising: the same figure upward. */
  statUp: () => sequence([[200, 0], [260, 0.07], [340, 0.14], [420, 0.21, 0.3]], "triangle", 0.045),
  /** A miss: air, nothing else. */
  miss: () => noise(0.18, 0.03, 3200),
  /** A fighter coming out: the rising whoosh of the send. */
  sendOut: () => {
    noise(0.14, 0.03, 1800)
    tone({ freq: 300, duration: 0.18, gain: 0.04, slideTo: 900, wave: "sine" })
  },
  menu: () => tone({ freq: 700, duration: 0.03, gain: 0.03 }),
}

export type SfxName = keyof typeof sfx

export function play(name: SfxName) {
  sfx[name]()
}

/**
 * Plays a sound as soon as the browser will allow it.
 *
 * The startup chime wants to go off when the desktop appears, but the boot
 * sequence runs on a timer rather than a click, so at that point there has
 * been no gesture and the AudioContext is still suspended. Calling play() then
 * produces silence. This waits for the first real interaction instead, which
 * is the closest a web page gets to a machine finishing its boot.
 *
 * @param name  Which effect to play.
 * @returns A function that cancels the pending play.
 */
export function playWhenAllowed(name: SfxName): () => void {
  const c = audio()
  if (c && c.state === "running") {
    play(name)
    return () => {}
  }

  // Capture, because a handler somewhere between the target and window may
  // stop propagation, and this needs the gesture whatever the page does with it.
  const events = ["pointerdown", "keydown"] as const
  const opts = { capture: true } as const
  const fire = () => {
    cancel()
    play(name)
  }
  const cancel = () => {
    for (const e of events) window.removeEventListener(e, fire, opts)
  }
  for (const e of events) window.addEventListener(e, fire, opts)
  return cancel
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
