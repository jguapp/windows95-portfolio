"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { play } from "@/lib/sound"
import FitBoard from "./fit-board"
import { PlayingCard, orderedDeck, shuffled, type Card, type Suit } from "./cards"

/**
 * Hearts, as it shipped with Windows 95.
 *
 * Four hands, three of them played by the computer. Every heart is a point and
 * the queen of spades is thirteen, so the game is about losing tricks rather
 * than winning them, and the first player to twenty-six points loses.
 *
 * Shooting the Moon is in: take all twenty-six and everyone else takes them
 * instead.
 */

interface HeartsProps {
  onReturn: () => void
}

const CARD_W = 58
const TARGET = 26
const QUEEN_OF_SPADES = "Q-spades"

/** North, East and South are the computer; the visitor plays South's hand. */
const SEATS = ["You", "West", "North", "East"] as const
type Seat = 0 | 1 | 2 | 3

type Phase = "passing" | "playing" | "handOver" | "gameOver"

interface Play {
  seat: Seat
  card: Card
}

const isHeart = (c: Card) => c.suit === "hearts"
const isQueen = (c: Card) => c.id === QUEEN_OF_SPADES
const points = (c: Card) => (isQueen(c) ? 13 : isHeart(c) ? 1 : 0)

/** Sorted the way a player would hold them: by suit, then by rank. */
function sortHand(hand: Card[]): Card[] {
  const order: Suit[] = ["clubs", "diamonds", "spades", "hearts"]
  return [...hand].sort((a, b) => order.indexOf(a.suit) - order.indexOf(b.suit) || a.rank - b.rank)
}

/**
 * The cards a seat is allowed to play.
 *
 * The first trick must be led with the two of clubs and cannot contain points,
 * hearts cannot be led until they have been broken, and you must follow suit
 * whenever you can.
 */
function legalPlays(hand: Card[], trick: Play[], heartsBroken: boolean, firstTrick: boolean): Card[] {
  if (trick.length === 0) {
    if (firstTrick) return hand.filter((c) => c.id === "2-clubs")
    const nonHearts = hand.filter((c) => !isHeart(c))
    // Hearts can only be led once they are broken, unless that is all there is.
    return heartsBroken || nonHearts.length === 0 ? hand : nonHearts
  }

  const led = trick[0].card.suit
  const following = hand.filter((c) => c.suit === led)
  if (following.length > 0) return following

  // Void in the led suit. Nothing scoring may be discarded on the first trick.
  if (firstTrick) {
    const safe = hand.filter((c) => points(c) === 0)
    if (safe.length > 0) return safe
  }
  return hand
}

function trickWinner(trick: Play[]): Seat {
  const led = trick[0].card.suit
  let best = trick[0]
  for (const p of trick) {
    if (p.card.suit === led && p.card.rank > best.card.rank) best = p
  }
  // Aces are high in Hearts, so promote the ace above the king.
  const aces = trick.filter((p) => p.card.suit === led && p.card.rank === 1)
  if (aces.length > 0) best = aces[0]
  return best.seat
}

/**
 * The computer's choice.
 *
 * Not a solver: it ducks under the current winner when it can, sheds the queen
 * and high spades when it is void, and leads low. That is enough to make the
 * hand feel played rather than random, which is all the original managed too.
 */
function botChoice(hand: Card[], trick: Play[], heartsBroken: boolean, firstTrick: boolean): Card {
  const legal = legalPlays(hand, trick, heartsBroken, firstTrick)
  if (legal.length === 1) return legal[0]

  if (trick.length === 0) {
    // Lead the lowest card in the shortest safe suit.
    const safe = legal.filter((c) => !isHeart(c) && !isQueen(c))
    const pool = safe.length > 0 ? safe : legal
    return pool.reduce((lo, c) => (c.rank < lo.rank ? c : lo))
  }

  const led = trick[0].card.suit
  const following = legal.filter((c) => c.suit === led)

  if (following.length > 0) {
    const highestSoFar = trick
      .filter((p) => p.card.suit === led)
      .reduce((hi, p) => (p.card.rank === 1 || (hi.rank !== 1 && p.card.rank > hi.rank) ? p.card : hi), trick[0].card)
    const under = following.filter((c) => c.rank !== 1 && (highestSoFar.rank === 1 || c.rank < highestSoFar.rank))
    if (under.length > 0) return under.reduce((hi, c) => (c.rank > hi.rank ? c : hi))
    // Forced to take it, so take it with the cheapest card.
    return following.reduce((lo, c) => (lo.rank === 1 ? c : c.rank !== 1 && c.rank < lo.rank ? c : lo))
  }

  // Void: get rid of the most dangerous card there is.
  const queen = legal.find(isQueen)
  if (queen) return queen
  const highSpade = legal.filter((c) => c.suit === "spades" && c.rank >= 12)
  if (highSpade.length > 0) return highSpade[0]
  const hearts = legal.filter(isHeart)
  if (hearts.length > 0) return hearts.reduce((hi, c) => (c.rank === 1 ? c : hi.rank === 1 ? hi : c.rank > hi.rank ? c : hi))
  return legal.reduce((hi, c) => (c.rank === 1 ? c : hi.rank === 1 ? hi : c.rank > hi.rank ? c : hi))
}

/** Passing rotates left, right, across, then not at all. */
const PASS_DIRECTION = ["left", "right", "across", "none"] as const
const passTarget = (seat: Seat, round: number): Seat => {
  const dir = PASS_DIRECTION[round % 4]
  if (dir === "left") return ((seat + 1) % 4) as Seat
  if (dir === "right") return ((seat + 3) % 4) as Seat
  if (dir === "across") return ((seat + 2) % 4) as Seat
  return seat
}

export default function Hearts({ onReturn }: HeartsProps) {
  const [hands, setHands] = useState<Card[][]>([[], [], [], []])
  const [scores, setScores] = useState([0, 0, 0, 0])
  const [handPoints, setHandPoints] = useState([0, 0, 0, 0])
  const [trick, setTrick] = useState<Play[]>([])
  const [turn, setTurn] = useState<Seat>(0)
  const [heartsBroken, setHeartsBroken] = useState(false)
  const [firstTrick, setFirstTrick] = useState(true)
  const [phase, setPhase] = useState<Phase>("passing")
  const [round, setRound] = useState(0)
  const [chosen, setChosen] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [menu, setMenu] = useState<string | null>(null)
  const [lastTrick, setLastTrick] = useState<Play[]>([])
  /** The original asked for your name before the first deal. So does this. */
  const [names, setNames] = useState<string[]>([...SEATS])
  const [askName, setAskName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  /** Points gained per completed hand, one row per hand for the score sheet. */
  const [history, setHistory] = useState<number[][]>([])
  /** Who shot the moon last hand, for the celebration. Null when nobody. */
  const [lastShooter, setLastShooter] = useState<number | null>(null)

  // The name survives visits; only a visitor with none stored is asked.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("win95:hearts-name")
      if (stored) setNames((n) => [stored, ...n.slice(1)])
      else setAskName(true)
    } catch {
      setAskName(true)
    }
  }, [])

  const confirmName = () => {
    const name = nameInput.trim().substring(0, 12) || "You"
    setNames((n) => [name, ...n.slice(1)])
    try {
      window.localStorage.setItem("win95:hearts-name", name)
    } catch {
      // A name that does not stick is still a name for this game.
    }
    setAskName(false)
  }

  const direction = PASS_DIRECTION[round % 4]
  /** The arrow the original put on the pass button. */
  const PASS_ARROW: Record<string, string> = { left: "←", right: "→", across: "↑", none: "" }

  const dealHand = useCallback((nextRound: number) => {
    const deck = shuffled(orderedDeck())
    const dealt = [0, 1, 2, 3].map((i) => sortHand(deck.slice(i * 13, i * 13 + 13)))
    setHands(dealt)
    setHandPoints([0, 0, 0, 0])
    setTrick([])
    setLastTrick([])
    setHeartsBroken(false)
    setFirstTrick(true)
    setChosen([])
    setRound(nextRound)
    // A round with no passing goes straight to the first trick.
    setPhase(PASS_DIRECTION[nextRound % 4] === "none" ? "playing" : "passing")
    setStatus(
      PASS_DIRECTION[nextRound % 4] === "none"
        ? "No passing this hand."
        : `Choose three cards to pass ${PASS_DIRECTION[nextRound % 4]}.`,
    )
    play("cardDeal")
  }, [])

  const newGame = useCallback(() => {
    setScores([0, 0, 0, 0])
    setHistory([])
    setLastShooter(null)
    dealHand(0)
  }, [dealHand])

  useEffect(() => {
    newGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Whoever holds the two of clubs leads the first trick.
  useEffect(() => {
    if (phase !== "playing" || !firstTrick || trick.length > 0) return
    const holder = hands.findIndex((h) => h.some((c) => c.id === "2-clubs"))
    if (holder >= 0) setTurn(holder as Seat)
  }, [phase, firstTrick, hands, trick.length])

  const playCard = useCallback(
    (seat: Seat, card: Card) => {
      setHands((prev) => prev.map((h, i) => (i === seat ? h.filter((c) => c.id !== card.id) : h)))
      setTrick((prev) => [...prev, { seat, card }])
      if (isHeart(card)) setHeartsBroken(true)
      play("cardFlip")
    },
    [],
  )

  // The computer takes its turn.
  useEffect(() => {
    if (phase !== "playing" || turn === 0 || trick.length >= 4) return
    const timer = setTimeout(() => {
      const hand = hands[turn]
      if (hand.length === 0) return
      playCard(turn, botChoice(hand, trick, heartsBroken, firstTrick))
      setTurn(((turn + 1) % 4) as Seat)
    }, 550)
    return () => clearTimeout(timer)
  }, [phase, turn, trick, hands, heartsBroken, firstTrick, playCard])

  // Settle a completed trick.
  useEffect(() => {
    if (trick.length !== 4) return
    const timer = setTimeout(() => {
      const winner = trickWinner(trick)
      const taken = trick.reduce((n, p) => n + points(p.card), 0)
      setHandPoints((prev) => prev.map((p, i) => (i === winner ? p + taken : p)))
      setLastTrick(trick)
      setTrick([])
      setFirstTrick(false)
      setTurn(winner)
      setStatus(`${names[winner]} took the trick${taken > 0 ? ` and ${taken} point${taken === 1 ? "" : "s"}` : ""}.`)
      if (taken > 0) play("select")
    }, 900)
    return () => clearTimeout(timer)
    // names is display-only; a rename must not re-settle the trick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trick])

  // Score the hand once the cards run out.
  useEffect(() => {
    if (phase !== "playing" || trick.length > 0) return
    if (hands.some((h) => h.length > 0)) return

    // Shooting the Moon: all twenty-six to one player means everyone else takes
    // them instead, which is the whole reason anyone collects hearts on purpose.
    const shooter = handPoints.findIndex((p) => p === 26)
    const gained = shooter >= 0 ? handPoints.map((_, i) => (i === shooter ? 0 : 26)) : handPoints

    const next = scores.map((s, i) => s + gained[i])
    setScores(next)
    setHistory((h) => [...h, gained])
    setLastShooter(shooter >= 0 ? shooter : null)
    setPhase("handOver")
    setStatus(
      shooter >= 0
        ? `${names[shooter]} shot the moon. Everyone else takes 26.`
        : `Hand over. ${gained.map((g, i) => `${names[i]} ${g}`).join(", ")}.`,
    )
    play(shooter === 0 ? "win" : "levelUp")

    if (Math.max(...next) >= TARGET) {
      const lowest = Math.min(...next)
      setPhase("gameOver")
      setStatus(`Game over. ${names[next.indexOf(lowest)]} wins with ${lowest}.`)
      play(next.indexOf(lowest) === 0 ? "win" : "lose")
    }
    // names is display-only here; re-running on a rename would double-score.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trick.length, hands, handPoints, scores])

  const togglePass = (card: Card) => {
    if (phase !== "passing") return
    setChosen((prev) =>
      prev.includes(card.id) ? prev.filter((id) => id !== card.id) : prev.length >= 3 ? prev : [...prev, card.id],
    )
    play("click")
  }

  const confirmPass = () => {
    if (chosen.length !== 3) return

    // Everyone passes at once, so build all four selections before applying any.
    const outgoing: Card[][] = hands.map((hand, seat) => {
      if (seat === 0) return hand.filter((c) => chosen.includes(c.id))
      // The computer sheds its highest danger: the queen, high spades, then
      // whatever is simply highest.
      const ranked = [...hand].sort((a, b) => {
        const danger = (c: Card) => (isQueen(c) ? 100 : c.suit === "spades" && c.rank >= 12 ? 90 : c.rank)
        return danger(b) - danger(a)
      })
      return ranked.slice(0, 3)
    })

    const next = hands.map((hand, seat) => hand.filter((c) => !outgoing[seat].some((o) => o.id === c.id)))
    for (let seat = 0; seat < 4; seat++) {
      next[passTarget(seat as Seat, round)].push(...outgoing[seat])
    }

    setHands(next.map(sortHand))
    setChosen([])
    setPhase("playing")
    setStatus("Cards passed. The two of clubs leads.")
    play("cardDeal")
  }

  const clickCard = (card: Card) => {
    if (phase === "passing") {
      togglePass(card)
      return
    }
    if (phase !== "playing" || turn !== 0 || trick.length >= 4) return

    const legal = legalPlays(hands[0], trick, heartsBroken, firstTrick)
    if (!legal.some((c) => c.id === card.id)) {
      setStatus(
        firstTrick && trick.length === 0
          ? "The two of clubs leads the first trick."
          : trick.length > 0
            ? `You must follow ${trick[0].card.suit}.`
            : "Hearts have not been broken yet.",
      )
      play("lose")
      return
    }

    setStatus("")
    playCard(0, card)
    setTurn(1)
  }

  const legalNow = useMemo(
    () => (phase === "playing" && turn === 0 ? legalPlays(hands[0], trick, heartsBroken, firstTrick) : []),
    [phase, turn, hands, trick, heartsBroken, firstTrick],
  )

  const menus: Record<string, { label: string; action: () => void }[]> = {
    Game: [
      { label: "New Game", action: newGame },
      { label: "Exit", action: onReturn },
    ],
    Help: [
      {
        label: "About Hearts",
        action: () =>
          setStatus(
            "Avoid taking hearts and the queen of spades. First to 26 loses. Take all 26 yourself and everyone else takes them instead.",
          ),
      },
    ],
  }

  /** Where each seat's played card sits on the table. */
  const seatStyle: React.CSSProperties[] = [
    { bottom: 8, left: "50%", transform: "translateX(-50%)" },
    { left: 8, top: "50%", transform: "translateY(-50%)" },
    { top: 8, left: "50%", transform: "translateX(-50%)" },
    { right: 8, top: "50%", transform: "translateY(-50%)" },
  ]

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-hearts
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
              <div className="absolute left-0 top-full z-50 min-w-[150px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
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
        <FitBoard w={660} h={480}>
        <div className="relative h-full w-full p-2">
        {/*
          The table as the original set it: West stacked down the left edge,
          North across the top, East down the right, full-size cards
          overlapped to slivers.
        */}
        {([1, 2, 3] as Seat[]).map((seat) => {
          const vertical = seat !== 2
          return (
            <div
              key={seat}
              data-seat={seat}
              className="absolute text-white"
              style={
                seat === 1
                  ? { left: 6, top: 48 }
                  : seat === 2
                    ? { left: "50%", top: 4, transform: "translateX(-50%)" }
                    : { right: 6, top: 48 }
              }
            >
              <div className="mb-1 text-center font-bold">{names[seat]}</div>
              <div className={vertical ? "flex flex-col items-center" : "flex justify-center"}>
                {hands[seat].map((card, i) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    faceUp={false}
                    width={52}
                    style={vertical ? { marginTop: i === 0 ? 0 : -52 } : { marginLeft: i === 0 ? 0 : -38 }}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* The trick in the middle */}
        <div className="absolute" style={{ inset: "110px 150px 130px 150px" }} data-trick>
          {trick.map((p) => (
            <div key={p.card.id} className="absolute" style={seatStyle[p.seat]}>
              <PlayingCard card={p.card} width={CARD_W} />
              <div className="mt-[2px] text-center text-white">{names[p.seat]}</div>
            </div>
          ))}
          {trick.length === 0 && lastTrick.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white opacity-80">
              {status}
            </div>
          )}
        </div>

        {/* Your hand */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center" data-hand>
          {hands[0].map((card, i) => {
            const playable =
              phase === "passing" ? true : legalNow.length > 0 && legalNow.some((c) => c.id === card.id)
            return (
              <PlayingCard
                key={card.id}
                card={card}
                width={CARD_W}
                selected={chosen.includes(card.id)}
                dimmed={phase === "playing" && turn === 0 && !playable}
                style={{
                  marginLeft: i === 0 ? 0 : -22,
                  transform: chosen.includes(card.id) ? "translateY(-12px)" : undefined,
                  cursor: "pointer",
                  zIndex: i,
                }}
                onClick={() => clickCard(card)}
              />
            )
          })}
        </div>

        {/* Passing prompt, arrow first, as the original's pass button wore it */}
        {phase === "passing" && !askName && (
          <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] p-3 text-center">
            <div className="mb-2">
              Pass three cards {direction}. Chosen: {chosen.length}/3
            </div>
            <button
              type="button"
              data-pass
              disabled={chosen.length !== 3}
              onClick={confirmPass}
              className="min-w-[110px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              <span className="mr-1 text-[15px] leading-none" aria-hidden>
                {PASS_ARROW[direction]}
              </span>
              Pass {direction}
            </button>
          </div>
        )}

        {/* Name entry, before anything else, as the original insisted */}
        {askName && (
          <div className="absolute left-1/2 top-1/2 z-50 w-[280px] -translate-x-1/2 -translate-y-1/2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]" data-name-entry>
            <div className="bg-[#000080] px-2 py-[2px] font-bold text-white">The Microserf Hearts Network</div>
            <div className="p-3">
              <label className="mb-2 block">What is your name?</label>
              <input
                autoFocus
                maxLength={12}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmName()}
                className="mb-3 w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
                data-name-input
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  data-name-ok
                  onClick={confirmName}
                  className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The moon, for whoever shot it. Yours rises with fanfare. */}
        {(phase === "handOver" || phase === "gameOver") && lastShooter !== null && (
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" data-moon>
            {/* Centring lives in the keyframes, which own transform. */}
            <div className="anim-moon-rise absolute left-1/2" style={{ bottom: -80 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="46" fill="#f5f1c9" stroke="#c9c17f" strokeWidth="3" />
                <circle cx="44" cy="48" r="7" fill="#d9d3a0" />
                <circle cx="72" cy="70" r="10" fill="#d9d3a0" />
                <circle cx="66" cy="38" r="5" fill="#d9d3a0" />
              </svg>
              <div className="mt-1 text-center font-bold text-white" style={{ textShadow: "1px 1px 0 #000" }}>
                {lastShooter === 0 ? "You shot the moon!" : `${names[lastShooter]} shot the moon.`}
              </div>
            </div>
          </div>
        )}

        {/* Between hands: the running score sheet, one row per hand. */}
        {(phase === "handOver" || phase === "gameOver") && (
          <div className="absolute left-1/2 top-1/2 z-40 w-[340px] -translate-x-1/2 -translate-y-1/2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]" data-score-sheet>
            <div className="bg-[#000080] px-2 py-[2px] font-bold text-white">
              {phase === "gameOver" ? "Game Over" : "Hand Complete"}
            </div>
            <div className="p-3">
              <div className="mb-3">{status}</div>
              <div className="mb-3 max-h-[160px] overflow-auto border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#808080]">
                      <th className="px-2 py-[2px] text-left font-bold">Hand</th>
                      {names.map((name, i) => (
                        <th key={SEATS[i]} className="px-2 py-[2px] text-right font-bold">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, h) => (
                      <tr key={h}>
                        <td className="px-2 py-[1px]">{h + 1}</td>
                        {row.map((g, i) => (
                          <td key={SEATS[i]} className="px-2 py-[1px] text-right">
                            {g}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t border-[#808080] font-bold">
                      <td className="px-2 py-[1px]">Total</td>
                      {scores.map((s, i) => (
                        <td key={SEATS[i]} className="px-2 py-[1px] text-right">
                          {s}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  data-continue
                  onClick={() => (phase === "gameOver" ? newGame() : dealHand(round + 1))}
                  className="min-w-[90px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  {phase === "gameOver" ? "New Game" : "Next Hand"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        </FitBoard>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[3px]">
        <span data-turn className="min-w-[110px] font-bold">
          {phase === "passing"
            ? `Pass ${direction}`
            : phase === "playing"
              ? turn === 0
                ? "Your turn"
                : `${SEATS[turn]} to play`
              : ""}
        </span>
        <span data-status className="flex-1">
          {status}
        </span>
        {names.map((name, i) => (
          <span key={SEATS[i]} data-score={SEATS[i]}>
            {name}: {scores[i]}
            {handPoints[i] > 0 ? ` (+${handPoints[i]})` : ""}
          </span>
        ))}
      </div>
    </div>
  )
}
