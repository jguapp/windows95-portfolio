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
 * Where the move list sits inside the text box.
 *
 * Four moves at nine pixels apart from y=117 put the fourth baseline on 144,
 * the very bottom edge of the screen, so it was drawn off the panel and could
 * not be read. These keep all four inside the box.
 */
const MOVE_TOP = 113
const MOVE_STEP = 8

/** Six party rows have to fit between the text box's frame lines at 104 and
 *  144. Starting where the two move rows start put the sixth name on the
 *  bottom edge, so the list starts higher and steps tighter. */
const PARTY_TOP = 113
const PARTY_STEP = 5.5

/**
 * Sprites are 28x28 grids drawn at two logical pixels each, filling the 56x56
 * box Generation I used while staying legible in source. Each digit indexes
 * the palette; a dot is transparent.
 */
import { FOE_TEAM, PLAYER_TEAM, SPECIES, SPRITE_SIZE, type Move, type Species } from "./pokemon-roster"

/** A creature in play: its species, plus the health and PP it has left. */
interface Fighter {
  species: Species
  name: string
  level: number
  hp: number
  maxHp: number
  moves: Move[]
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
  }
}

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

function Sprite({ grid, x, y }: { grid: string[]; x: number; y: number }) {
  const cells = useMemo(() => runs(grid), [grid])
  return (
    <g transform={`translate(${x} ${y}) scale(2)`}>
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
      {/* Edges, held back from the corners. */}
      <rect x={x + 4} y={y + 1} width={w - 8} height={2} fill={k} />
      <rect x={x + 4} y={y + h - 3} width={w - 8} height={2} fill={k} />
      <rect x={x + 1} y={y + 4} width={2} height={h - 8} fill={k} />
      <rect x={x + w - 3} y={y + 4} width={2} height={h - 8} fill={k} />
      {/* Stepped corner curls. */}
      <rect x={x + 2} y={y + 2} width={2} height={2} fill={k} />
      <rect x={x + w - 4} y={y + 2} width={2} height={2} fill={k} />
      <rect x={x + 2} y={y + h - 4} width={2} height={2} fill={k} />
      <rect x={x + w - 4} y={y + h - 4} width={2} height={2} fill={k} />
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
      {/* The HP cap. */}
      <text x={x - 14} y={y + 4} fill={P[3]} fontSize={6} className="font-pixel">
        HP:
      </text>
      {/* The channel: 1px frame, ends stepped to read as rounded. */}
      <rect x={x - 1} y={y - 1} width={WIDTH + 2} height={6} fill={P[3]} />
      <rect x={x - 1} y={y - 1} width={1} height={1} fill={P[0]} />
      <rect x={x + WIDTH} y={y - 1} width={1} height={1} fill={P[0]} />
      <rect x={x - 1} y={y + 4} width={1} height={1} fill={P[0]} />
      <rect x={x + WIDTH} y={y + 4} width={1} height={1} fill={P[0]} />
      <rect x={x} y={y} width={WIDTH} height={4} fill={P[0]} />
      <rect x={x} y={y + 1} width={filled} height={2} fill={shade} />
      {ratio <= 0.2 &&
        Array.from({ length: filled }).map((_, i) =>
          i % 2 === 0 ? <rect key={i} x={x + i} y={y + 1} width={1} height={1} fill={P[0]} /> : null,
        )}
    </>
  )
}

/**
 * Where a sprite's painted pixels actually sit inside its 28x28 grid.
 *
 * The species are not the same size or shape. A squat one fills the bottom
 * rows; a tall one with antennae reaches the top row and leaves its feet well
 * short of the bottom. One hard-coded platform position therefore fitted one
 * of them and left the rest standing beside their disc rather than on it.
 */
function inkBounds(grid: string[]) {
  let minX = SPRITE_SIZE
  let maxX = -1
  let maxY = -1
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === ".") continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  })
  return { minX, maxX, maxY }
}

/**
 * The disc under a fighter, measured from the fighter rather than guessed.
 *
 * @param grid  The sprite the disc goes under.
 * @param x     Where that sprite is drawn, in screen units.
 * @param y     Likewise, vertically.
 * @param rx    Half-width of the disc. The opponent's is small and the
 *              player's wide, which is most of what sells the distance.
 * @param ry    Half-height.
 */
function Ground({
  grid,
  x,
  y,
  rx,
  ry,
}: {
  grid: string[]
  x: number
  y: number
  rx: number
  ry: number
}) {
  const { minX, maxX, maxY } = inkBounds(grid)
  // Sprites are drawn at scale 2, so one grid cell is two screen units.
  const cx = x + (minX + maxX + 1)
  const feet = y + (maxY + 1) * 2
  // Seat the feet just inside the top of the disc rather than on top of it.
  return <Platform cx={cx} cy={feet - ry} rx={rx} ry={ry} />
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

/** A flat disc for a fighter to stand on, drawn a row at a time. */
function Platform({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const rows = []
  for (let i = -ry; i <= ry; i++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (i / ry) ** 2)))
    if (half <= 0) continue
    // The rim is a shade darker than the face, which is what gives it an edge.
    const edge = Math.abs(i) >= ry - 1
    rows.push(
      <rect key={i} x={cx - half} y={cy + i} width={half * 2} height={1} fill={P[edge ? 2 : 1]} />,
    )
  }
  return <g data-platform>{rows}</g>
}

function Label({ x, y, children, size = 7 }: { x: number; y: number; children: string; size?: number }) {
  // Press Start 2P is the classic 8x8 arcade face, which is as close to the
  // Game Boy character set as a web font gets.
  return (
    <text x={x} y={y} fill={P[3]} fontSize={size} className="font-pixel">
      {children}
    </text>
  )
}

type Phase = "menu" | "fight" | "switch" | "message" | "over"

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

  const [phase, setPhase] = useState<Phase>("message")
  const [message, setMessage] = useState(`Enemy ${SPECIES[FOE_TEAM[0]].name} sent out!`)
  const [cursor, setCursor] = useState(0)
  const [busy, setBusy] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    sfx.battleStart()
    cry(SPECIES[FOE_TEAM[0]].cry)
    const opening = setTimeout(() => {
      setMessage(`Go! ${SPECIES[PLAYER_TEAM[0]].name}!`)
      cry(SPECIES[PLAYER_TEAM[0]].cry)
      const ready = setTimeout(() => setPhase("menu"), 1100)
      timers.current.push(ready)
    }, 1300)
    timers.current.push(opening)
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  const damage = (attacker: Fighter, move: Move) =>
    Math.max(1, Math.round((move.power * attacker.level) / 40 + Math.random() * 6))

  const foeTurn = useCallback(
    (playerHp: number) => {
      const move = foe.moves[Math.floor(Math.random() * foe.moves.length)]
      setMessage(`Enemy ${foe.name} used ${move.name}!`)
      sfx.hit()
      after(900, () => {
        const dealt = damage(foe, move)
        const hp = Math.max(0, playerHp - dealt)
        setPlayer((p) => ({ ...p, hp }))
        after(700, () => {
          if (hp !== 0) {
            setPhase("menu")
            setBusy(false)
            return
          }

          setMessage(`${player.name} fainted!`)
          sfx.lose()
          const next = team.findIndex((f, i) => i !== active && f.hp > 0)
          if (next === -1) {
            after(900, () => setPhase("over"))
            return
          }
          after(1000, () => {
            setActive(next)
            setMessage(`Go! ${team[next].name}!`)
            cry(team[next].species.cry)
            after(900, () => {
              setPhase("menu")
              setBusy(false)
            })
          })
        })
      })
    },
    [after, foe],
  )

  const performMove = useCallback(
    (index: number) => {
      if (busy) return
      const move = player.moves[index]
      if (move.pp === 0) {
        setMessage("No PP left for this move!")
        return
      }
      setBusy(true)
      setPhase("message")
      setPlayer((p) => ({ ...p, moves: p.moves.map((m, i) => (i === index ? { ...m, pp: m.pp - 1 } : m)) }))
      setMessage(`${player.name} used ${move.name}!`)
      sfx.hit()

      after(900, () => {
        const dealt = damage(player, move)
        const hp = Math.max(0, foe.hp - dealt)
        setFoe((f) => ({ ...f, hp }))
        after(700, () => {
          if (hp !== 0) {
            foeTurn(player.hp)
            return
          }

          setMessage(`Enemy ${foe.name} fainted!`)
          sfx.win()
          const next = foes.findIndex((f, i) => i !== foeActive && f.hp > 0)
          if (next === -1) {
            after(900, () => {
              setMessage("You won the battle!")
              setPhase("over")
            })
            return
          }
          after(1000, () => {
            setFoeActive(next)
            setMessage(`Enemy sent out ${foes[next].name}!`)
            cry(foes[next].species.cry)
            after(900, () => {
              setPhase("menu")
              setBusy(false)
            })
          })
        })
      })
    },
    [after, busy, foe, foeTurn, player],
  )

  /**
   * Bring another of the six out.
   *
   * The switch takes the turn, so the opponent gets a free hit, which is what
   * stops it being a way to dodge every attack.
   */
  const switchTo = useCallback(
    (index: number) => {
      if (index === active) {
        setMessage(`${team[index].name} is already out!`)
        return
      }
      if (team[index].hp === 0) {
        setMessage(`${team[index].name} has no energy left!`)
        return
      }

      setBusy(true)
      setPhase("message")
      setActive(index)
      setMessage(`Go! ${team[index].name}!`)
      cry(team[index].species.cry)
      after(1000, () => foeTurn(team[index].hp))
    },
    [active, after, foeTurn, team],
  )

  const run = useCallback(() => {
    setPhase("message")
    setMessage("Got away safely!")
    sfx.menu()
    after(1100, onClose)
  }, [after, onClose])

  // The Game Boy had no pointer, so this is keyboard-driven.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose()
      if (phase === "over") {
        if (e.key === "Enter") onClose()
        return
      }
      if (busy || phase === "message") return

      const count = phase === "menu" ? 4 : phase === "switch" ? team.length : player.moves.length
      if (e.key === "ArrowDown") setCursor((c) => (c + 1) % count)
      else if (e.key === "ArrowUp") setCursor((c) => (c - 1 + count) % count)
      else if (e.key === "Enter" || e.key.toLowerCase() === "z") {
        if (phase === "menu") {
          if (cursor === 0) {
            setPhase("fight")
            setCursor(0)
          } else if (cursor === 1) {
            setPhase("switch")
            setCursor(active)
          } else if (cursor === 3) run()
          else setMessage("There's a time and place for everything!")
        } else if (phase === "switch") {
          switchTo(cursor)
        } else {
          performMove(cursor)
        }
      } else if (e.key.toLowerCase() === "x" || e.key === "Backspace") {
        if (phase === "fight" || phase === "switch") {
          setPhase("menu")
          setCursor(0)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, busy, cursor, onClose, phase, player.moves.length, run, performMove, switchTo, team.length])

  /** FIGHT and PKMN fill the left column, ITEM and RUN the right. */
  const MENU = [
    { label: "FIGHT", index: 0, col: 0, row: 0 },
    { label: "PKMN", index: 1, col: 0, row: 1 },
    { label: "ITEM", index: 2, col: 1, row: 0 },
    { label: "RUN", index: 3, col: 1, row: 1 },
  ]

  const lines = message.match(/.{1,26}(\s|$)/g) ?? [message]

  return createPortal(
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: "relative" }}>
        <svg
          data-gameboy
          width={SCREEN_W * 4}
          height={SCREEN_H * 4}
          viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated", display: "block", border: "10px solid #5a5a5a", borderRadius: 6 }}
        >
          <rect width={SCREEN_W} height={SCREEN_H} fill={P[0]} />

          {/*
            One ball per creature, filled while it is still standing. Gen I put
            these beside each trainer's status box so you could see at a glance
            how much of a team was left.
          */}
          {foes.map((f, i) => (
            <Ball key={`fb${i}`} x={7 + i * 7.5} y={40} alive={f.hp > 0} />
          ))}
          {team.map((f, i) => (
            <Ball key={`pb${i}`} x={111 + i * 7.5} y={97} alive={f.hp > 0} />
          ))}

          {/*
            The ground each fighter stands on.

            Red and Blue drew a flat ellipse under each: a light disc with a
            darker rim, the opponent's small and high on the field and the
            player's wider and low, which is most of what makes the two look
            like they are standing at different distances rather than floating.
          */}
          <Ground grid={foe.species.sprite} x={96} y={0} rx={30} ry={6} />
          <Ground grid={player.species.sprite} x={10} y={46} rx={34} ry={8} />

          {/* Opponent: front sprite upper right, status box upper left */}
          <Sprite grid={foe.species.sprite} x={96} y={0} />
          <Box x={4} y={12} w={86} h={26} />
          <Label x={9} y={23} size={6}>
            {foe.name}
          </Label>
          <Label x={68} y={23} size={6}>
            {`L${foe.level}`}
          </Label>
          <HpBar x={32} y={28} ratio={foe.hp / foe.maxHp} />

          {/* Player: back sprite lower left, status box lower right */}
          <Sprite grid={player.species.sprite} x={10} y={46} />
          <Box x={74} y={66} w={84} h={34} />
          <Label x={79} y={77} size={6}>
            {player.name}
          </Label>
          <Label x={136} y={77} size={6}>
            {`L${player.level}`}
          </Label>
          <HpBar x={102} y={83} ratio={player.hp / player.maxHp} />
          <Label x={104} y={97} size={6}>
            {`${player.hp}/${player.maxHp}`}
          </Label>

          {/* Text box across the bottom two rows */}
          <Box x={0} y={104} w={SCREEN_W} h={40} />

          {phase === "menu" ? (
            <>
              <Label x={8} y={119}>
                What will
              </Label>
              <Label x={8} y={132}>
                {`${player.name} do?`}
              </Label>
              <Box x={86} y={104} w={74} h={40} />
              {MENU.map((m) => {
                const cx = 94 + m.col * 34
                const cy = 120 + m.row * 14
                return (
                  <g key={m.label}>
                    {cursor === m.index && (
                      <Label x={cx - 7} y={cy}>
                        &#9654;
                      </Label>
                    )}
                    <Label x={cx} y={cy}>
                      {m.label}
                    </Label>
                  </g>
                )
              })}
            </>
          ) : phase === "fight" ? (
            <>
              {player.moves.map((m, i) => (
                <g key={m.name}>
                  {cursor === i && (
                    <Label x={5} y={MOVE_TOP + i * MOVE_STEP} size={7}>
                      &#9654;
                    </Label>
                  )}
                  <Label x={13} y={MOVE_TOP + i * MOVE_STEP} size={7}>
                    {m.name}
                  </Label>
                </g>
              ))}
              <Label x={104} y={MOVE_TOP} size={7}>
                {`PP ${player.moves[cursor].pp}/${player.moves[cursor].maxPp}`}
              </Label>
            </>
          ) : phase === "switch" ? (
            <>
              {team.map((f, i) => (
                <g key={f.name}>
                  {cursor === i && (
                    <Label x={4} y={PARTY_TOP + i * PARTY_STEP} size={4.5}>
                      &#9654;
                    </Label>
                  )}
                  <Label x={11} y={PARTY_TOP + i * PARTY_STEP} size={4.5}>
                    {`${f.name}${i === active ? " *" : ""}`}
                  </Label>
                  <Label x={104} y={PARTY_TOP + i * PARTY_STEP} size={4.5}>
                    {f.hp === 0 ? "FNT" : `${f.hp}/${f.maxHp}`}
                  </Label>
                </g>
              ))}
            </>
          ) : (
            <>
              {lines.slice(0, 2).map((line, i) => (
                <Label key={i} x={8} y={120 + i * 13}>
                  {line.trim()}
                </Label>
              ))}
              {/* The waiting arrow, blinking as it always did. */}
              <path d="M150 138 l6 0 l-3 4 z" fill={P[3]}>
                <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
              </path>
            </>
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
