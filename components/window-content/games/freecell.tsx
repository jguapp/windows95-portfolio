"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { play } from "@/lib/sound"
import FitBoard from "./fit-board"
import { CARD_H, CardSlot, PlayingCard, SUITS, SUIT_SYMBOL, type Card, type Suit, cardId, isRed } from "./cards"

/**
 * FreeCell, as it shipped with Windows 95.
 *
 * Eight columns, four free cells, four foundations. A card moves onto a card of
 * the opposite colour one rank higher, and a run can be moved wholesale as long
 * as there is somewhere to have put each card individually.
 *
 * The deal numbers are the part people remember, so they are the real ones:
 * game 617 here is the same 617 everyone spent an afternoon on.
 */

interface FreeCellProps {
  onReturn: () => void
}

const CARD_W = 62
const STACK_STEP = 22
const COLUMNS = 8

/**
 * Microsoft's deal numbering.
 *
 * The shuffle is driven by the same linear congruential generator the C runtime
 * used, seeded with the game number, and cards are dealt across the columns in
 * the order it produces. Reimplementing it exactly is the only way deal 617
 * means anything, so the constants are the original ones rather than something
 * that merely looks random.
 */
function msDeal(gameNumber: number): Card[][] {
  // The joke deals. The original hid games -1 and -2, laid out by hand as
  // a prank rather than shuffled. Here they deal the deck unshuffled, aces
  // first, which buries every ace under its whole suit: technically legal,
  // practically hopeless, faithfully mean.
  if (gameNumber === -1 || gameNumber === -2) {
    const dealOrder: Suit[] = ["clubs", "diamonds", "hearts", "spades"]
    const deck: Card[] = []
    for (let n = 0; n < 52; n++) {
      const rank = Math.floor(n / 4) + 1
      const suit = dealOrder[n % 4]
      deck.push({ id: cardId(rank, suit), rank, suit })
    }
    const columns: Card[][] = Array.from({ length: COLUMNS }, () => [])
    deck.forEach((card, i) => {
      // -1 deals across the row; -2 fills column by column. Same trap,
      // different furniture.
      if (gameNumber === -1) columns[i % COLUMNS].push(card)
      else columns[Math.floor(i / 7)].push(card)
    })
    return columns
  }

  let seed = gameNumber >>> 0

  const rand = () => {
    seed = (Math.imul(seed, 214013) + 2531011) >>> 0
    // The runtime returned bits 16 to 30, not the whole word.
    return (seed >>> 16) & 0x7fff
  }

  // Card n is rank n/4, suit n%4, with the suits in clubs/diamonds/hearts/
  // spades order. That ordering is part of the algorithm, not a presentation
  // choice: change it and every deal number points at a different game.
  const dealOrder: Suit[] = ["clubs", "diamonds", "hearts", "spades"]
  const deck: Card[] = []
  for (let n = 0; n < 52; n++) {
    const rank = Math.floor(n / 4) + 1
    const suit = dealOrder[n % 4]
    deck.push({ id: cardId(rank, suit), rank, suit })
  }

  const columns: Card[][] = Array.from({ length: COLUMNS }, () => [])
  let left = 52
  for (let i = 0; i < 52; i++) {
    const j = rand() % left
    columns[i % COLUMNS].push(deck[j])
    deck[j] = deck[left - 1]
    left -= 1
  }

  return columns
}

/**
 * The Statistics table, as the original kept it: wins, losses, and the
 * running streak (positive while winning, negative while losing), with the
 * best of each remembered. Lives in localStorage so it means something.
 */
interface Stats {
  wins: number
  losses: number
  streak: number
  bestWin: number
  bestLose: number
}

const STATS_KEY = "win95:freecell-stats"
const EMPTY_STATS: Stats = { wins: 0, losses: 0, streak: 0, bestWin: 0, bestLose: 0 }

function readStats(): Stats {
  if (typeof window === "undefined") return EMPTY_STATS
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (!raw) return EMPTY_STATS
    const s = JSON.parse(raw)
    return typeof s?.wins === "number" && typeof s?.losses === "number" ? { ...EMPTY_STATS, ...s } : EMPTY_STATS
  } catch {
    return EMPTY_STATS
  }
}

function writeStats(s: Stats) {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(s))
  } catch {
    // Storage disabled costs a statistic, not a crash.
  }
}

function recordResult(win: boolean): Stats {
  const s = readStats()
  const next: Stats = win
    ? { ...s, wins: s.wins + 1, streak: s.streak >= 0 ? s.streak + 1 : 1 }
    : { ...s, losses: s.losses + 1, streak: s.streak <= 0 ? s.streak - 1 : -1 }
  next.bestWin = Math.max(next.bestWin, next.streak)
  next.bestLose = Math.min(next.bestLose, next.streak)
  writeStats(next)
  return next
}

type Zone = "free" | "foundation" | "column"
interface Spot {
  zone: Zone
  index: number
}

interface Board {
  columns: Card[][]
  free: (Card | null)[]
  foundations: Card[][]
}

const foundationIndex = (suit: Suit) => SUITS.indexOf(suit)

function canStack(card: Card, onto: Card | undefined): boolean {
  if (!onto) return true
  return isRed(card.suit) !== isRed(onto.suit) && onto.rank === card.rank + 1
}

function canFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1
  return pile[pile.length - 1].rank === card.rank - 1
}

/** The tail of a column that is already a valid descending alternating run. */
function movableRun(column: Card[]): number {
  let n = 1
  for (let i = column.length - 1; i > 0; i--) {
    if (canStack(column[i], column[i - 1])) n += 1
    else break
  }
  return n
}

/**
 * How many cards can be moved at once.
 *
 * FreeCell has no special multi-card move: a run only travels because each card
 * could have been parked somewhere and picked back up. So the limit is the free
 * cells plus one, doubled for every empty column, and an empty column that is
 * itself the destination does not count.
 */
function maxMove(board: Board, toEmptyColumn: boolean): number {
  const freeCells = board.free.filter((c) => c === null).length
  const emptyColumns = board.columns.filter((c) => c.length === 0).length
  const usable = toEmptyColumn ? Math.max(0, emptyColumns - 1) : emptyColumns
  return (freeCells + 1) * 2 ** usable
}

export default function FreeCell({ onReturn }: FreeCellProps) {
  const [gameNumber, setGameNumber] = useState(() => Math.floor(Math.random() * 32000) + 1)
  const [board, setBoard] = useState<Board>(() => ({
    columns: msDeal(1),
    free: [null, null, null, null],
    foundations: [[], [], [], []],
  }))
  const [selected, setSelected] = useState<Spot | null>(null)
  const [moves, setMoves] = useState(0)
  // Undo stack; read only through functional updates, so the value binding
  // goes unused on purpose.
  const [, setHistory] = useState<Board[]>([])
  const [status, setStatus] = useState("")
  const [menu, setMenu] = useState<string | null>(null)
  const [askNumber, setAskNumber] = useState(false)
  const [numberInput, setNumberInput] = useState("")
  const [won, setWon] = useState(false)
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [showStats, setShowStats] = useState(false)

  // Stats come off the client after mount; reading during render would not
  // match the server HTML.
  useEffect(() => setStats(readStats()), [])

  const deal = (n: number) => {
    // Walking away from a live game is the loss it is, as the original ruled.
    if (moves > 0 && !won) setStats(recordResult(false))
    const special = n === -1 || n === -2
    const clamped = special ? n : Math.min(32000, Math.max(1, Math.floor(n) || 1))
    setGameNumber(clamped)
    setBoard({ columns: msDeal(clamped), free: [null, null, null, null], foundations: [[], [], [], []] })
    setSelected(null)
    setMoves(0)
    setWon(false)
    setHistory([])
    setStatus(`Game #${clamped}`)
    play("cardDeal")
  }

  // Deal a game on first mount.
  useEffect(() => {
    deal(Math.floor(Math.random() * 32000) + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const won52 = board.foundations.reduce((n, pile) => n + pile.length, 0) === 52
  useEffect(() => {
    if (won52 && !won) {
      setWon(true)
      setStatus(`You won game #${gameNumber} in ${moves} moves.`)
      setStats(recordResult(true))
      play("win")
    }
  }, [won52, won, gameNumber, moves])

  /** The card sitting at a spot, if there is one. */
  const cardAt = (b: Board, spot: Spot): Card | undefined => {
    if (spot.zone === "free") return b.free[spot.index] ?? undefined
    if (spot.zone === "foundation") return b.foundations[spot.index].at(-1)
    return b.columns[spot.index].at(-1)
  }

  const commit = (next: Board, sound: "move" | "foundation" = "move") => {
    setHistory((h) => [...h.slice(-40), board])
    setBoard(next)
    setMoves((m) => m + 1)
    setSelected(null)
    play(sound === "foundation" ? "cardFlip" : "cardDeal")
  }

  const clone = (b: Board): Board => ({
    columns: b.columns.map((c) => [...c]),
    free: [...b.free],
    foundations: b.foundations.map((f) => [...f]),
  })

  /** Send a single card to its foundation if the rules allow it. */
  const toFoundation = (from: Spot): boolean => {
    const card = cardAt(board, from)
    if (!card || from.zone === "foundation") return false
    const fi = foundationIndex(card.suit)
    if (!canFoundation(card, board.foundations[fi])) return false

    const next = clone(board)
    if (from.zone === "free") next.free[from.index] = null
    else next.columns[from.index].pop()
    next.foundations[fi].push(card)
    commit(next, "foundation")
    return true
  }

  const moveTo = (from: Spot, to: Spot): boolean => {
    if (from.zone === to.zone && from.index === to.index) return false

    const card = cardAt(board, from)
    if (!card) return false

    if (to.zone === "foundation") {
      if (from.zone === "column" || from.zone === "free") {
        const fi = foundationIndex(card.suit)
        if (fi !== to.index || !canFoundation(card, board.foundations[fi])) {
          setStatus("That card does not go there yet.")
          return false
        }
        return toFoundation(from)
      }
      return false
    }

    if (to.zone === "free") {
      if (board.free[to.index] !== null) return false
      if (from.zone === "foundation") return false
      const next = clone(board)
      if (from.zone === "free") next.free[from.index] = null
      else next.columns[from.index].pop()
      next.free[to.index] = card
      commit(next)
      return true
    }

    // Moving into a column, possibly as a run.
    const target = board.columns[to.index]
    const targetTop = target.at(-1)

    if (from.zone !== "column") {
      if (!canStack(card, targetTop)) {
        setStatus("That card does not go there.")
        return false
      }
      const next = clone(board)
      if (from.zone === "free") next.free[from.index] = null
      else next.foundations[from.index].pop()
      next.columns[to.index].push(card)
      commit(next)
      return true
    }

    const source = board.columns[from.index]
    const run = movableRun(source)

    // Take the longest tail of the run that legally lands on the target.
    let take = 0
    for (let n = 1; n <= run; n++) {
      const head = source[source.length - n]
      if (canStack(head, targetTop)) take = n
    }
    if (take === 0) {
      setStatus("That card does not go there.")
      return false
    }

    const capacity = maxMove(board, target.length === 0)
    if (take > capacity) {
      setStatus(`Not enough free cells to move ${take} cards. You can move ${capacity}.`)
      play("lose")
      return false
    }

    const next = clone(board)
    const moving = next.columns[from.index].splice(next.columns[from.index].length - take, take)
    next.columns[to.index].push(...moving)
    commit(next)
    return true
  }

  const clickSpot = (spot: Spot) => {
    if (won) return
    setStatus("")

    if (!selected) {
      const card = cardAt(board, spot)
      if (!card) return
      if (spot.zone === "foundation") return
      setSelected(spot)
      play("select")
      return
    }

    if (selected.zone === spot.zone && selected.index === spot.index) {
      setSelected(null)
      return
    }

    if (!moveTo(selected, spot)) setSelected(null)
  }

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      setBoard(h[h.length - 1])
      setSelected(null)
      setMoves((m) => Math.max(0, m - 1))
      setWon(false)
      return h.slice(0, -1)
    })
  }

  /** Everything that could go up right now, played in one pass. */
  const autoplay = () => {
    let working = clone(board)
    let placed = 0

    const safeToPlay = (card: Card, b: Board) => {
      // A card is only sent up automatically when neither opposite-colour card
      // one rank below it could still need it, which is the rule the original
      // used and the reason it never strands you.
      const need = card.rank - 1
      if (need <= 1) return true
      return SUITS.filter((s) => isRed(s) !== isRed(card.suit)).every(
        (s) => b.foundations[foundationIndex(s)].length >= need,
      )
    }

    let moved = true
    while (moved) {
      moved = false
      const spots: Spot[] = [
        ...working.columns.map((_, i) => ({ zone: "column" as Zone, index: i })),
        ...working.free.map((_, i) => ({ zone: "free" as Zone, index: i })),
      ]
      for (const spot of spots) {
        const card = spot.zone === "free" ? working.free[spot.index] : working.columns[spot.index].at(-1)
        if (!card) continue
        const fi = foundationIndex(card.suit)
        if (!canFoundation(card, working.foundations[fi]) || !safeToPlay(card, working)) continue

        const next = clone(working)
        if (spot.zone === "free") next.free[spot.index] = null
        else next.columns[spot.index].pop()
        next.foundations[fi].push(card)
        working = next
        placed += 1
        moved = true
      }
    }

    if (placed === 0) {
      setStatus("Nothing to move up.")
      return
    }
    setHistory((h) => [...h.slice(-40), board])
    setBoard(working)
    setMoves((m) => m + placed)
    setSelected(null)
    play("cardFlip")
  }

  const menus: Record<string, { label: string; action: () => void }[]> = {
    Game: [
      { label: "New Game", action: () => deal(Math.floor(Math.random() * 32000) + 1) },
      { label: "Restart Game", action: () => deal(gameNumber) },
      { label: "Select Game...", action: () => { setNumberInput(String(gameNumber)); setAskNumber(true) } },
      { label: "Statistics...", action: () => setShowStats(true) },
      { label: "Undo", action: undo },
      { label: "Move All Home", action: autoplay },
      { label: "Exit", action: onReturn },
    ],
    Help: [
      {
        label: "About FreeCell",
        action: () =>
          setStatus(
            "Build the four foundations up from ace to king. Columns build down in alternating colours. Free cells hold one card each.",
          ),
      },
    ],
  }

  const isSelected = (spot: Spot) => selected?.zone === spot.zone && selected.index === spot.index
  const freeCount = board.free.filter((c) => c === null).length
  const columnHeight = useMemo(
    () => Math.max(...board.columns.map((c) => c.length)) * STACK_STEP + CARD_H,
    [board.columns],
  )

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-freecell
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
                    className="block w-full px-3 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      item.action()
                      setMenu(null)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="relative flex-1 overflow-hidden bg-[#008000]" onClick={() => setMenu(null)}>
        <FitBoard w={660} h={540}>
        <div className="relative h-full w-full p-3">
        {/* Free cells and foundations */}
        <div className="mb-4 flex items-start justify-between" style={{ maxWidth: COLUMNS * (CARD_W + 10) }}>
          <div className="flex gap-[6px]">
            {board.free.map((card, i) => (
              <div key={`free-${i}`} data-free={i} onClick={() => clickSpot({ zone: "free", index: i })}>
                {card ? (
                  <PlayingCard
                    card={card}
                    width={CARD_W}
                    selected={isSelected({ zone: "free", index: i })}
                    onDoubleClick={() => toFoundation({ zone: "free", index: i })}
                  />
                ) : (
                  <CardSlot width={CARD_W} />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-[6px]">
            {SUITS.map((suit, i) => {
              const pile = board.foundations[i]
              const top = pile.at(-1)
              return (
                <div key={suit} data-foundation={suit} onClick={() => clickSpot({ zone: "foundation", index: i })}>
                  {top ? (
                    <PlayingCard card={top} width={CARD_W} />
                  ) : (
                    <CardSlot width={CARD_W} label={SUIT_SYMBOL[suit]} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Columns */}
        <div className="flex gap-[10px]" style={{ minHeight: columnHeight }}>
          {board.columns.map((column, i) => (
            <div
              key={`col-${i}`}
              data-column={i}
              className="relative"
              style={{ width: CARD_W, minHeight: CARD_H }}
              onClick={() => {
                // An empty column can only be a destination.
                if (column.length === 0) clickSpot({ zone: "column", index: i })
              }}
            >
              {column.length === 0 && <CardSlot width={CARD_W} />}
              {column.map((card, j) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  width={CARD_W}
                  selected={isSelected({ zone: "column", index: i }) && j >= column.length - 1}
                  style={{ position: "absolute", top: j * STACK_STEP, left: 0 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    clickSpot({ zone: "column", index: i })
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (j === column.length - 1) toFoundation({ zone: "column", index: i })
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Select Game dialog */}
        {askNumber && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[300px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]">
              <div className="flex items-center justify-between bg-[#000080] px-2 py-[2px] text-white">
                <span className="font-bold">Game Number</span>
              </div>
              <div className="p-3">
                <label className="mb-2 block">Enter a number from 1 to 32000:</label>
                <input
                  id="deal-number"
                  autoFocus
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value.replace(/[^0-9-]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      deal(Number(numberInput))
                      setAskNumber(false)
                    }
                    if (e.key === "Escape") setAskNumber(false)
                  }}
                  className="w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                    onClick={() => {
                      deal(Number(numberInput))
                      setAskNumber(false)
                    }}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                    onClick={() => setAskNumber(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Statistics dialog */}
        {showStats && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40" data-stats>
            <div className="w-[300px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]">
              <div className="flex items-center justify-between bg-[#000080] px-2 py-[2px] text-white">
                <span className="font-bold">FreeCell Statistics</span>
              </div>
              <div className="p-3">
                <div className="mb-3 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-2">
                  {(
                    [
                      ["Games won", String(stats.wins)],
                      ["Games lost", String(stats.losses)],
                      [
                        "Win rate",
                        stats.wins + stats.losses === 0
                          ? "-"
                          : `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%`,
                      ],
                      [
                        "Current streak",
                        stats.streak === 0
                          ? "-"
                          : `${Math.abs(stats.streak)} ${stats.streak > 0 ? "win" : "loss"}${Math.abs(stats.streak) === 1 ? "" : stats.streak > 0 ? "s" : "es"}`,
                      ],
                      ["Best winning streak", String(stats.bestWin)],
                      ["Worst losing streak", String(Math.abs(stats.bestLose))],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-[1px]">
                      <span>{label}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    data-stats-clear
                    className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                    onClick={() => {
                      writeStats(EMPTY_STATS)
                      setStats(EMPTY_STATS)
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                    onClick={() => setShowStats(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        </FitBoard>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[3px]">
        <span data-status className="flex-1">
          {status || (won ? "You won." : "Click a card, then click where it goes. Double-click sends it home.")}
        </span>
        <span>Game #{gameNumber}</span>
        <span>Moves: {moves}</span>
        <span>
          Free: {freeCount}/{board.free.length}
        </span>
      </div>
    </div>
  )
}
