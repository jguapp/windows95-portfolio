"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { play } from "@/lib/sound"

/**
 * Reversi, which shipped with Windows 3.1 and kept the same look into 95.
 *
 * Place a disc so that it traps a line of the opponent's discs between it and
 * one of yours, and every disc in that line turns over. Whoever holds more of
 * the board when nobody can move has won.
 */

interface ReversiProps {
  onReturn: () => void
}

type Player = 1 | 2
type Square = 0 | Player
type Board = Square[]

const SIZE = 8
const CELL = 44

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

const at = (row: number, col: number) => row * SIZE + col
const inside = (row: number, col: number) => row >= 0 && row < SIZE && col >= 0 && col < SIZE
const other = (p: Player): Player => (p === 1 ? 2 : 1)

function startingBoard(): Board {
  const board: Board = Array<Square>(SIZE * SIZE).fill(0)
  board[at(3, 3)] = 2
  board[at(4, 4)] = 2
  board[at(3, 4)] = 1
  board[at(4, 3)] = 1
  return board
}

/** Every disc a move would turn over, or an empty list if it is not a move. */
function flipsFor(board: Board, row: number, col: number, player: Player): number[] {
  if (board[at(row, col)] !== 0) return []

  const flips: number[] = []
  for (const [dr, dc] of DIRECTIONS) {
    const run: number[] = []
    let r = row + dr
    let c = col + dc
    while (inside(r, c) && board[at(r, c)] === other(player)) {
      run.push(at(r, c))
      r += dr
      c += dc
    }
    // Only counts if the run is closed off by one of the player's own discs.
    if (run.length > 0 && inside(r, c) && board[at(r, c)] === player) flips.push(...run)
  }
  return flips
}

function legalMoves(board: Board, player: Player): Map<number, number[]> {
  const moves = new Map<number, number[]>()
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const flips = flipsFor(board, row, col, player)
      if (flips.length > 0) moves.set(at(row, col), flips)
    }
  }
  return moves
}

function count(board: Board): [number, number] {
  let a = 0
  let b = 0
  for (const s of board) {
    if (s === 1) a += 1
    else if (s === 2) b += 1
  }
  return [a, b]
}

/**
 * How much a square is worth to the computer.
 *
 * Corners cannot be flipped once taken, so they are worth far more than the
 * count they produce; the squares next to a corner hand one over and are worth
 * avoiding. This is the standard weighting, and it is what makes the computer
 * feel like it is playing rather than grabbing.
 */
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
]

function botMove(board: Board, player: Player): number | null {
  const moves = legalMoves(board, player)
  if (moves.size === 0) return null

  let best: number | null = null
  let bestScore = -Infinity
  for (const [square, flips] of moves) {
    // Position first, then how many discs it turns, then how much it restricts
    // the reply, which is what stops it filling the board early.
    const next = [...board]
    next[square] = player
    for (const f of flips) next[f] = player
    const replies = legalMoves(next, other(player)).size
    const score = WEIGHTS[square] + flips.length - replies * 2
    if (score > bestScore) {
      bestScore = score
      best = square
    }
  }
  return best
}

export default function Reversi({ onReturn }: ReversiProps) {
  const [board, setBoard] = useState<Board>(startingBoard)
  const [turn, setTurn] = useState<Player>(1)
  const [status, setStatus] = useState("Black to move.")
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(true)
  const [flipping, setFlipping] = useState<Set<number>>(new Set())
  const [lastPlaced, setLastPlaced] = useState<number | null>(null)
  /** The game's own sound switch. A ref backs it so memoised closures obey. */
  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef = useRef(true)
  const snd: typeof play = (...args) => {
    if (soundOnRef.current) play(...args)
  }

  const moves = useMemo(() => legalMoves(board, turn), [board, turn])
  const [black, white] = count(board)

  const newGame = useCallback(() => {
    setBoard(startingBoard())
    setTurn(1)
    setOver(false)
    setLastPlaced(null)
    setFlipping(new Set())
    setStatus("Black to move.")
    snd("select")
  }, [])

  const place = useCallback(
    (square: number, player: Player) => {
      const flips = flipsFor(board, Math.floor(square / SIZE), square % SIZE, player)
      if (flips.length === 0) return false

      const next = [...board]
      next[square] = player
      for (const f of flips) next[f] = player

      setBoard(next)
      setLastPlaced(square)
      setFlipping(new Set(flips))
      setTurn(other(player))
      snd("cardFlip")
      window.setTimeout(() => setFlipping(new Set()), 260)
      return true
    },
    [board],
  )

  // Pass a turn nobody can play, and end the game when neither side can.
  useEffect(() => {
    if (over) return
    if (moves.size > 0) {
      setStatus(turn === 1 ? "Black to move." : "White is thinking...")
      return
    }

    if (legalMoves(board, other(turn)).size === 0) {
      const [b, w] = count(board)
      setOver(true)
      setStatus(b === w ? `A draw at ${b} each.` : b > w ? `Black wins, ${b} to ${w}.` : `White wins, ${w} to ${b}.`)
      snd(b > w ? "win" : "lose")
      return
    }

    setStatus(`${turn === 1 ? "Black" : "White"} has no move and passes.`)
    const timer = setTimeout(() => setTurn(other(turn)), 900)
    return () => clearTimeout(timer)
  }, [board, turn, moves, over])

  // The computer plays white.
  useEffect(() => {
    if (over || turn !== 2 || moves.size === 0) return
    const timer = setTimeout(() => {
      const square = botMove(board, 2)
      if (square !== null) place(square, 2)
    }, 650)
    return () => clearTimeout(timer)
  }, [turn, board, moves, over, place])

  const click = (square: number) => {
    if (over || turn !== 1) return
    if (!moves.has(square)) {
      setStatus("That square would not turn anything over.")
      snd("lose")
      return
    }
    place(square, 1)
  }

  const menus: Record<string, { label: string; action: () => void; checked?: boolean }[]> = {
    Game: [
      { label: "New Game", action: newGame },
      { label: "Exit", action: onReturn },
    ],
    Options: [
      { label: "Show Legal Moves", action: () => setShowHints((v) => !v), checked: showHints },
      {
        label: "Sound",
        action: () =>
          setSoundOn((v) => {
            soundOnRef.current = !v
            return !v
          }),
        checked: soundOn,
      },
    ],
    Help: [
      {
        label: "About Reversi",
        action: () =>
          setStatus("Trap a line of your opponent's discs between two of yours and they all turn over."),
      },
    ],
  }

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-reversi
    >
      {/* Menu bar */}
      <div className="flex border-b border-[#808080] px-1" onMouseLeave={() => setMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] ${menu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setMenu(menu === name ? null : name)}
              onMouseEnter={() => menu && setMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {menu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[170px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center px-3 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      item.action()
                      setMenu(null)
                    }}
                  >
                    <span className="mr-2 w-3">{item.checked ? "✓" : ""}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-[#808080] p-3" onClick={() => setMenu(null)}>
        <div
          data-board
          className="border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`,
            gridTemplateRows: `repeat(${SIZE}, ${CELL}px)`,
            backgroundColor: "#c0c0c0",
          }}
        >
          {board.map((square, i) => {
            const isMove = showHints && turn === 1 && !over && moves.has(i)
            return (
              <div
                key={i}
                data-square={i}
                data-disc={square === 0 ? undefined : square === 1 ? "blue" : "red"}
                onClick={() => click(i)}
                className="relative flex items-center justify-center"
                style={{
                  boxSizing: "border-box",
                  border: "1px solid #808080",
                  cursor: turn === 1 && !over && moves.has(i) ? "pointer" : "default",
                  backgroundColor: lastPlaced === i ? "#009900" : undefined,
                }}
              >
                {square !== 0 && (
                  <div
                    className={flipping.has(i) ? "anim-card-flip" : undefined}
                    style={{
                      width: CELL - 10,
                      height: CELL - 10,
                      borderRadius: "50%",
                      background:
                        square === 1
                          ? "radial-gradient(circle at 35% 30%, #6c8cff 0%, #0000c8 70%)"
                          : "radial-gradient(circle at 35% 30%, #ff8c7a 0%, #c80000 70%)",
                      border: "1px solid #00000060",
                    }}
                  />
                )}
                {square === 0 && isMove && (
                  <div
                    data-hint
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.45)",
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[3px]">
        <span data-status className="flex-1">
          {status}
        </span>
        <span data-black>Black: {black}</span>
        <span data-white>White: {white}</span>
      </div>
    </div>
  )
}
