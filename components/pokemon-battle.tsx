"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { sfx } from "@/lib/sound"

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
const P = ["#9BBC0F", "#8BAC0F", "#306230", "#0F380F"] as const

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

/**
 * Sprites are 28x28 grids drawn at two logical pixels each, filling the 56x56
 * box Generation I used while staying legible in source. Each digit indexes
 * the palette; a dot is transparent.
 */
const DARKBYTE_FRONT = [
  "............................",
  "..........2222..............",
  ".........233332.............",
  "........23333332............",
  ".......2333333332...........",
  "......233332233332..........",
  ".....23332......23332.......",
  "....23332........23332......",
  "....2332....33....2332......",
  "....332....3333....332......",
  "...2332...333333...2332.....",
  "...2332..33300333..2332.....",
  "...2332..33033033..2332.....",
  "...23332.3303303323332......",
  "....2333233003332 3332......",
  "....2333323333332 3332......",
  ".....233332333323 332.......",
  "......23333233332332........",
  ".......2333323332332........",
  "........233332333332........",
  ".........23332333332........",
  "..........2332233332........",
  "..........2332..2332........",
  ".........2332....2332.......",
  "........2332......2332......",
  ".......2332........2332.....",
  "......2332..........2332....",
  ".....222..............222...",
]

const VIRUSITE_BACK = [
  "............................",
  "............................",
  "............................",
  "..........222222............",
  ".......2223333332222........",
  ".....22333333333333322......",
  "....2333333333333333332.....",
  "...233333322222233333332....",
  "..23333322........22333332..",
  "..2333322..........2233332..",
  "..233332............223332..",
  "..233332.............23332..",
  "..2333322...........223332..",
  "..23333322.........2233332..",
  "...23333322.......22333332..",
  "....233333222...2223333332..",
  ".....2333333322233333332....",
  "......233333333333333322....",
  ".......22333333333333222....",
  ".........222333333222.......",
  "...........2222222..........",
  "..........2333333322........",
  ".........233333333332.......",
  "........23333333333332......",
  "........233333333333332.....",
  ".......2333333333333332.....",
  "........22222222222222......",
  "............................",
]

interface Move {
  name: string
  power: number
  pp: number
  maxPp: number
}

interface Fighter {
  name: string
  level: number
  hp: number
  maxHp: number
  moves: Move[]
}

const PLAYER_START: Fighter = {
  name: "VIRUSITE",
  level: 37,
  hp: 118,
  maxHp: 118,
  moves: [
    { name: "SEG FAULT", power: 34, pp: 15, maxPp: 15 },
    { name: "FORK BOMB", power: 28, pp: 20, maxPp: 20 },
    { name: "NULL PTR", power: 22, pp: 25, maxPp: 25 },
    { name: "KERNELPANIC", power: 45, pp: 5, maxPp: 5 },
  ],
}

const FOE_START: Fighter = {
  name: "DARKBYTE",
  level: 34,
  hp: 104,
  maxHp: 104,
  moves: [
    { name: "STACK SMASH", power: 30, pp: 10, maxPp: 10 },
    { name: "RACE COND", power: 24, pp: 15, maxPp: 15 },
  ],
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

/** The Generation I bordered box: single-pixel frame, light fill. */
function Box({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={P[0]} />
      <rect x={x} y={y} width={w} height={1} fill={P[3]} />
      <rect x={x} y={y + h - 1} width={w} height={1} fill={P[3]} />
      <rect x={x} y={y} width={1} height={h} fill={P[3]} />
      <rect x={x + w - 1} y={y} width={1} height={h} fill={P[3]} />
    </>
  )
}

function HpBar({ x, y, ratio }: { x: number; y: number; ratio: number }) {
  const WIDTH = 48
  const filled = Math.max(0, Math.round(WIDTH * ratio))
  const shade = ratio > 0.5 ? P[2] : P[3]
  return (
    <>
      <rect x={x - 1} y={y - 1} width={WIDTH + 2} height={5} fill={P[3]} />
      <rect x={x} y={y} width={WIDTH} height={3} fill={P[0]} />
      <rect x={x} y={y} width={filled} height={3} fill={shade} />
      {ratio <= 0.2 &&
        // Dither the last stretch so a critical bar reads differently from a
        // merely low one without using colour.
        Array.from({ length: filled }).map((_, i) =>
          i % 2 === 0 ? <rect key={i} x={x + i} y={y} width={1} height={1} fill={P[0]} /> : null,
        )}
    </>
  )
}

function Label({ x, y, children, size = 8 }: { x: number; y: number; children: string; size?: number }) {
  return (
    <text
      x={x}
      y={y}
      fill={P[3]}
      fontSize={size}
      fontFamily='"Courier New", monospace'
      fontWeight="bold"
      style={{ letterSpacing: 0.3 }}
    >
      {children}
    </text>
  )
}

type Phase = "menu" | "fight" | "message" | "over"

interface PokemonBattleProps {
  onClose: () => void
}

export default function PokemonBattle({ onClose }: PokemonBattleProps) {
  const [player, setPlayer] = useState<Fighter>(PLAYER_START)
  const [foe, setFoe] = useState<Fighter>(FOE_START)
  const [phase, setPhase] = useState<Phase>("message")
  const [message, setMessage] = useState(`Wild ${FOE_START.name} appeared!`)
  const [cursor, setCursor] = useState(0)
  const [busy, setBusy] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    sfx.battleStart()
    const opening = setTimeout(() => {
      setMessage(`Go! ${PLAYER_START.name}!`)
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
          if (hp === 0) {
            setMessage(`${PLAYER_START.name} fainted!`)
            sfx.lose()
            setPhase("over")
          } else {
            setPhase("menu")
            setBusy(false)
          }
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
          if (hp === 0) {
            setMessage(`Enemy ${foe.name} fainted!`)
            sfx.win()
            setPhase("over")
          } else {
            foeTurn(player.hp)
          }
        })
      })
    },
    [after, busy, foe, foeTurn, player],
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

      const count = phase === "menu" ? 4 : player.moves.length
      if (e.key === "ArrowDown") setCursor((c) => (c + 1) % count)
      else if (e.key === "ArrowUp") setCursor((c) => (c - 1 + count) % count)
      else if (e.key === "Enter" || e.key.toLowerCase() === "z") {
        if (phase === "menu") {
          if (cursor === 0) {
            setPhase("fight")
            setCursor(0)
          } else if (cursor === 3) run()
          else setMessage("There's a time and place for everything!")
        } else {
          performMove(cursor)
        }
      } else if (e.key.toLowerCase() === "x" || e.key === "Backspace") {
        if (phase === "fight") {
          setPhase("menu")
          setCursor(0)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, cursor, onClose, phase, player.moves.length, run, performMove])

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

          {/* Opponent: front sprite upper right, status box upper left */}
          <Sprite grid={DARKBYTE_FRONT} x={96} y={0} />
          <Box x={4} y={12} w={86} h={26} />
          <Label x={9} y={23}>
            {foe.name}
          </Label>
          <Label x={70} y={23}>
            {`L${foe.level}`}
          </Label>
          <Label x={9} y={33} size={7}>
            HP:
          </Label>
          <HpBar x={32} y={28} ratio={foe.hp / foe.maxHp} />

          {/* Player: back sprite lower left, status box lower right */}
          <Sprite grid={VIRUSITE_BACK} x={10} y={46} />
          <Box x={74} y={66} w={84} h={34} />
          <Label x={79} y={77}>
            {player.name}
          </Label>
          <Label x={138} y={77}>
            {`L${player.level}`}
          </Label>
          <Label x={79} y={88} size={7}>
            HP:
          </Label>
          <HpBar x={102} y={83} ratio={player.hp / player.maxHp} />
          <Label x={104} y={97} size={7}>
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
          ) : (
            lines
              .slice(0, 2)
              .map((line, i) => (
                <Label key={i} x={8} y={120 + i * 13}>
                  {line.trim()}
                </Label>
              ))
          )}
        </svg>

        <p
          data-hint
          style={{ color: "#8BAC0F", fontFamily: "monospace", fontSize: 12, marginTop: 10, textAlign: "center" }}
        >
          &uarr; &darr; choose &nbsp;&middot;&nbsp; ENTER select &nbsp;&middot;&nbsp; X back &nbsp;&middot;&nbsp; ESC
          quit
        </p>
      </div>
    </div>,
    document.body,
  )
}
