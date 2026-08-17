"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createSound, type SynthAudio } from "@/lib/sound"
import FitBoard from "./fit-board"
import CardCascade from "./card-cascade"

interface SolitaireProps {
  onReturn: () => void
}

// Card types
type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"
type CardState = {
  suit: Suit
  rank: Rank
  faceUp: boolean
  id: string
}

/**
 * The deck designs from Game > Deck.
 *
 * The originals were painted bitmaps; these are gradients and repeating
 * patterns in the same palette, which costs nothing to ship and scales.
 */
const DECKS: { name: string; style: React.CSSProperties }[] = [
  {
    name: "Blue",
    style: {
      backgroundColor: "#00007b",
      backgroundImage:
        "repeating-linear-gradient(45deg, #4a4ac8 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, #4a4ac8 0 2px, transparent 2px 5px)",
    },
  },
  {
    name: "Red",
    style: {
      backgroundColor: "#8b0000",
      backgroundImage:
        "repeating-linear-gradient(45deg, #d05a5a 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, #d05a5a 0 2px, transparent 2px 5px)",
    },
  },
  { name: "Castle", style: { backgroundColor: "#004000", backgroundImage: "repeating-linear-gradient(0deg, #0a6a0a 0 3px, #004000 3px 6px)" } },
  { name: "Beach", style: { backgroundColor: "#0b6ea8", backgroundImage: "repeating-linear-gradient(90deg, #f2d16b 0 4px, #0b6ea8 4px 10px)" } },
  { name: "Roses", style: { backgroundColor: "#7b0037", backgroundImage: "radial-gradient(circle at 4px 4px, #ff8ab5 1.5px, transparent 2px)", backgroundSize: "8px 8px" } },
  { name: "Fish", style: { backgroundColor: "#006d6d", backgroundImage: "repeating-linear-gradient(45deg, #3fbcbc 0 3px, transparent 3px 8px)" } },
  { name: "Shell", style: { backgroundColor: "#5a3a1a", backgroundImage: "radial-gradient(circle at 5px 5px, #c99a5b 2px, transparent 3px)", backgroundSize: "10px 10px" } },
  { name: "Mountain", style: { backgroundColor: "#2f3f6f", backgroundImage: "repeating-linear-gradient(135deg, #7f8fc0 0 2px, transparent 2px 7px)" } },
  { name: "Sunset", style: { backgroundImage: "linear-gradient(#ff8c00, #8b0045)" } },
  { name: "Robot", style: { backgroundColor: "#404040", backgroundImage: "repeating-linear-gradient(0deg, #a0a0a0 0 2px, transparent 2px 6px), repeating-linear-gradient(90deg, #a0a0a0 0 2px, transparent 2px 6px)" } },
  { name: "Plaid", style: { backgroundColor: "#1f4f1f", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 9px), repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 9px)" } },
  { name: "Night", style: { backgroundColor: "#101040", backgroundImage: "radial-gradient(circle at 3px 3px, #ffffff 1px, transparent 1.5px)", backgroundSize: "9px 9px" } },
]

// Pile types
type PileType = "stock" | "waste" | "foundation" | "tableau"

// Dragging state
type DragState = {
  cards: CardState[]
  sourceType: PileType
  sourceIndex: number
  offsetX: number
  offsetY: number
} | null

export default function Solitaire({ onReturn }: SolitaireProps) {
  // Game state
  const [stock, setStock] = useState<CardState[]>([])
  const [waste, setWaste] = useState<CardState[]>([])
  const [foundations, setFoundations] = useState<CardState[][]>(Array(4).fill([]))
  const [tableau, setTableau] = useState<CardState[][]>(Array(7).fill([]))
  const [dragState, setDragState] = useState<DragState>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dealSound, setDealSound] = useState<SynthAudio | null>(null)
  const [flipSound, setFlipSound] = useState<SynthAudio | null>(null)
  const [winSound, setWinSound] = useState<SynthAudio | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores, setHighScores] = useState<{ name: string; score: number; time: number }[]>([
    { name: "ACE", score: 500, time: 120 },
    { name: "KNG", score: 450, time: 180 },
    { name: "QEN", score: 400, time: 210 },
  ])
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  // Snapshot of the foundations at the moment of victory, handed to the
  // cascade so it keeps running while the piles themselves are cleared.
  const [cascadePiles, setCascadePiles] = useState<CardState[][] | null>(null)
  const [cascadeOrigins, setCascadeOrigins] = useState<{ x: number; y: number }[]>([])
  /** Draw Three is the harder, and the default the original shipped with. */
  const [drawThree, setDrawThree] = useState(true)
  /** Vegas scores in dollars and starts you 52 down; Standard scores points. */
  const [vegas, setVegas] = useState(false)
  /** Which of the card backs is in use, from Game > Deck. */
  const [deck, setDeck] = useState(0)
  const [showDeckPicker, setShowDeckPicker] = useState(false)
  /** The cards turned over by the last draw, so Draw Three can fan them. */

  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Initialize sounds
  useEffect(() => {
    const deal = createSound("/sounds/card-deal.mp3")
    const flip = createSound("/sounds/card-flip.mp3")
    const win = createSound("/sounds/victory.mp3")

    deal.volume = 0.2
    flip.volume = 0.2
    win.volume = 0.3

    setDealSound(deal)
    setFlipSound(flip)
    setWinSound(win)

    return () => {
      deal.pause()
      flip.pause()
      win.pause()
    }
  }, [])

  // Play sounds
  const playDealSound = () => {
    if (dealSound && soundEnabled) {
      dealSound.currentTime = 0
      dealSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  const playFlipSound = () => {
    if (flipSound && soundEnabled) {
      flipSound.currentTime = 0
      flipSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  const playWinSound = () => {
    if (winSound && soundEnabled) {
      winSound.currentTime = 0
      winSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameStarted && !gameWon) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameStarted, gameWon])

  // Cards that are mid-animation. Both animations are one-shot and short, so
  // the id is simply dropped from the set once the CSS has had time to run.
  const [flipping, setFlipping] = useState<Set<string>>(new Set())
  const [landing, setLanding] = useState<Set<string>>(new Set())

  const mark = (setter: typeof setFlipping, id: string, ms: number) => {
    setter((prev) => new Set(prev).add(id))
    setTimeout(
      () =>
        setter((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        }),
      ms,
    )
  }

  const markFlip = (id: string) => mark(setFlipping, id, 200)
  const markLanding = (id: string) => mark(setLanding, id, 160)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Initialize game. The scoring mode is a parameter because the Options
  // toggle re-deals in the same click that flips it, before the state lands.
  const initGame = (vegasMode: boolean = vegas) => {
    // Create and shuffle deck
    const deck = createDeck()

    // Deal cards to tableau
    const newTableau: CardState[][] = Array(7)
      .fill([])
      .map(() => [])
    const newStock: CardState[] = []

    // Deal cards to tableau (each pile i gets i+1 cards)
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = deck.pop()
        if (card) {
          // Only the top card is face up
          card.faceUp = j === i
          newTableau[i].push(card)
        }
      }
    }

    // Remaining cards go to stock
    while (deck.length > 0) {
      const card = deck.pop()
      if (card) {
        newStock.push(card)
      }
    }

    // Set initial game state
    setStock(newStock)
    setWaste([])
    setFoundations(
      Array(4)
        .fill([])
        .map(() => []),
    )
    setTableau(newTableau)
    setMoves(0)
    // Vegas buys the deck: every deal starts $52 down, and the game is
    // getting back above water. Standard starts from nothing.
    setScore(vegasMode ? -52 : 0)
    setGameWon(false)
    setCascadePiles(null)
    setTimeElapsed(0)
    setGameStarted(true)

    playDealSound()
  }

  // Create and shuffle a deck of cards
  const createDeck = () => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    const deck: CardState[] = []

    // Create cards
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          faceUp: false,
          id: `${rank}-${suit}`,
        })
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    return deck
  }

  // Draw from stock to waste
  const drawFromStock = () => {
    if (stock.length === 0) {
      // If stock is empty, recycle waste
      if (waste.length > 0) {
        setStock([...waste].reverse().map((card) => ({ ...card, faceUp: false })))
        setWaste([])
        setMoves(moves + 1)
        // Vegas charges you for going back through the deck; Standard does not.
        if (vegas) setScore((sc) => sc - 5)
        playFlipSound()
      }
      return
    }

    // Turn one or three, depending on Options.
    const newStock = [...stock]
    const count = Math.min(drawThree ? 3 : 1, newStock.length)
    const drawn: CardState[] = []
    for (let i = 0; i < count; i++) {
      const card = newStock.pop()
      if (!card) break
      card.faceUp = true
      markFlip(card.id)
      drawn.push(card)
    }

    if (drawn.length > 0) {
      setStock(newStock)
      setWaste([...waste, ...drawn])
      setMoves(moves + 1)
      playFlipSound()
    }
  }

  // Check if a card can be moved to a foundation pile
  const canMoveToFoundation = (card: CardState, foundationIndex: number) => {
    const foundation = foundations[foundationIndex]

    // If foundation is empty, only Ace can be placed
    if (foundation.length === 0) {
      return card.rank === "A"
    }

    // Otherwise, check if card is same suit and next rank
    const topCard = foundation[foundation.length - 1]
    return card.suit === topCard.suit && getCardValue(card.rank) === getCardValue(topCard.rank) + 1
  }

  // Check if a card can be moved to a tableau pile
  const canMoveToTableau = (card: CardState, tableauIndex: number) => {
    const pile = tableau[tableauIndex]

    // If tableau is empty, only King can be placed
    if (pile.length === 0) {
      return card.rank === "K"
    }

    // Otherwise, check if card is opposite color and one rank lower
    const topCard = pile[pile.length - 1]
    return isOppositeColor(card.suit, topCard.suit) && getCardValue(card.rank) === getCardValue(topCard.rank) - 1
  }

  // Get card value (A=1, J=11, Q=12, K=13)
  const getCardValue = (rank: Rank): number => {
    if (rank === "A") return 1
    if (rank === "J") return 11
    if (rank === "Q") return 12
    if (rank === "K") return 13
    return Number.parseInt(rank)
  }

  // Check if two suits are opposite colors
  const isOppositeColor = (suit1: Suit, suit2: Suit): boolean => {
    const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds"
    return isRed(suit1) !== isRed(suit2)
  }

  // Start dragging cards
  const startDrag = (cards: CardState[], sourceType: PileType, sourceIndex: number, e: React.MouseEvent) => {
    if (cards.length === 0 || !cards[0].faceUp) return

    // Calculate offset from cursor to card top-left
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDragState({
      cards,
      sourceType,
      sourceIndex,
      offsetX,
      offsetY,
    })

    setIsDragging(true)
    setDragPosition({ x: e.clientX, y: e.clientY })
  }

  // Handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragPosition({ x: e.clientX, y: e.clientY })
    }
  }

  // End dragging and attempt to drop cards
  const endDrag = (targetType: PileType, targetIndex: number) => {
    if (!isDragging || !dragState) return

    // Try to move cards from source to target
    const { cards, sourceType, sourceIndex } = dragState
    let moved = false

    // Handle different target types
    if (targetType === "foundation") {
      // Only single cards can be moved to foundation
      if (cards.length === 1 && canMoveToFoundation(cards[0], targetIndex)) {
        moveCardToFoundation(sourceType, sourceIndex, targetIndex)
        moved = true
      }
    } else if (targetType === "tableau") {
      // Check if cards can be moved to tableau
      if (canMoveToTableau(cards[0], targetIndex)) {
        moveCardsToTableau(sourceType, sourceIndex, targetIndex, cards.length)
        moved = true
      }
    }

    // Play sound if moved
    if (moved) {
      playFlipSound()
    }

    // Reset drag state
    setIsDragging(false)
    setDragState(null)
  }

  // Move a card to a foundation pile
  const moveCardToFoundation = (sourceType: PileType, sourceIndex: number, foundationIndex: number) => {
    // Handle different source types
    if (sourceType === "waste") {
      if (waste.length === 0) return

      const newWaste = [...waste]
      const card = newWaste.pop()

      if (card) {
        const newFoundations = [...foundations]
        newFoundations[foundationIndex] = [...newFoundations[foundationIndex], card]

        markLanding(card.id)
        setWaste(newWaste)
        setFoundations(newFoundations)
        setMoves(moves + 1)
        setScore(score + (vegas ? 5 : 10)) // Vegas pays $5 a card; Standard 10 points
      }
    } else if (sourceType === "tableau") {
      const pile = tableau[sourceIndex]
      if (pile.length === 0) return

      const newTableau = [...tableau]
      const card = newTableau[sourceIndex].pop()

      if (card) {
        const newFoundations = [...foundations]
        newFoundations[foundationIndex] = [...newFoundations[foundationIndex], card]

        // Flip the new top card if needed
        if (newTableau[sourceIndex].length > 0) {
          const newTopCard = newTableau[sourceIndex][newTableau[sourceIndex].length - 1]
          if (!newTopCard.faceUp) {
            newTopCard.faceUp = true
            markFlip(newTopCard.id)
            setScore(score + (vegas ? 0 : 5)) // Vegas pays nothing for turning a card
          }
        }

        markLanding(card.id)
        setTableau(newTableau)
        setFoundations(newFoundations)
        setMoves(moves + 1)
        setScore(score + (vegas ? 5 : 10)) // Vegas pays $5 a card; Standard 10 points
      }
    }
  }

  /**
   * Sends every card that can go home, in one pass.
   *
   * Right-clicking the table did this in the original, and it is how a won
   * game is actually finished rather than dragging thirteen cards a suit.
   */
  const sendAllHome = () => {
    const workingWaste = [...waste]
    let workingTableau = tableau.map((pile) => [...pile])
    const workingFoundations = foundations.map((pile) => [...pile])
    let placed = 0

    let moved = true
    while (moved) {
      moved = false

      const tops: { card: CardState; take: () => void }[] = [
        ...(workingWaste.length
          ? [{ card: workingWaste[workingWaste.length - 1], take: () => workingWaste.pop() as CardState }]
          : []),
        ...workingTableau.flatMap((pile, i) =>
          pile.length && pile[pile.length - 1].faceUp
            ? [{ card: pile[pile.length - 1], take: () => workingTableau[i].pop() as CardState }]
            : [],
        ),
      ]

      for (const { card, take } of tops) {
        const target = workingFoundations.findIndex((pile) =>
          pile.length === 0 ? card.rank === "A" : canFollow(pile[pile.length - 1], card),
        )
        if (target === -1) continue
        take()
        workingFoundations[target] = [...workingFoundations[target], card]
        placed += 1
        moved = true
        break
      }
    }

    if (placed === 0) return

    // Turning up whatever the departures exposed, as a real move would.
    workingTableau = workingTableau.map((pile) => {
      if (pile.length === 0) return pile
      const top = pile[pile.length - 1]
      if (!top.faceUp) {
        top.faceUp = true
        markFlip(top.id)
      }
      return pile
    })

    setWaste(workingWaste)
    setTableau(workingTableau)
    setFoundations(workingFoundations)
    setMoves(moves + placed)
    setScore(score + placed * (vegas ? 5 : 10))
    playFlipSound()
  }

  /** True when `card` is the next card up from `below` in the same suit. */
  const canFollow = (below: CardState, card: CardState) => {
    if (below.suit !== card.suit) return false
    const order = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    return order.indexOf(card.rank) === order.indexOf(below.rank) + 1
  }

  /**
   * Sends a card straight to the first foundation that will take it.
   *
   * The status bar has always promised this and nothing implemented it, so a
   * double-click did nothing at all.
   */
  const sendToFoundation = (sourceType: PileType, sourceIndex: number, card: CardState) => {
    for (let f = 0; f < 4; f += 1) {
      if (canMoveToFoundation(card, f)) {
        moveCardToFoundation(sourceType, sourceIndex, f)
        playFlipSound()
        return
      }
    }
  }

  // Move cards to a tableau pile
  const moveCardsToTableau = (sourceType: PileType, sourceIndex: number, targetIndex: number, count: number) => {
    // Handle different source types
    if (sourceType === "waste") {
      if (waste.length === 0) return

      const newWaste = [...waste]
      const card = newWaste.pop()

      if (card) {
        const newTableau = [...tableau]
        newTableau[targetIndex] = [...newTableau[targetIndex], card]

        markLanding(card.id)
        setWaste(newWaste)
        setTableau(newTableau)
        setMoves(moves + 1)
      }
    } else if (sourceType === "tableau") {
      const sourcePile = tableau[sourceIndex]
      if (sourcePile.length === 0 || count > sourcePile.length) return

      const newTableau = [...tableau]
      const cardsToMove = newTableau[sourceIndex].splice(newTableau[sourceIndex].length - count)
      newTableau[targetIndex] = [...newTableau[targetIndex], ...cardsToMove]

      // Flip the new top card if needed
      if (newTableau[sourceIndex].length > 0) {
        const newTopCard = newTableau[sourceIndex][newTableau[sourceIndex].length - 1]
        if (!newTopCard.faceUp) {
          newTopCard.faceUp = true
          markFlip(newTopCard.id)
          setScore(score + (vegas ? 0 : 5)) // Vegas pays nothing for turning a card
        }
      }

      for (const c of cardsToMove) markLanding(c.id)
      setTableau(newTableau)
      setMoves(moves + 1)
    }
  }

  // Check if the game is won.
  //
  // This watches the foundations rather than running inside the move handlers,
  // which read the pre-move state and so missed the winning move entirely.
  useEffect(() => {
    const isWon = foundations.every((foundation) => foundation.length === 13)
    if (!isWon || gameWon) return

    setGameWon(true)
    playWinSound()
    // Standard pays the original's time bonus, 700000 / seconds once the
    // game has run past half a minute. Vegas pays only what the cards paid.
    if (!vegas) {
      const bonus = timeElapsed > 30 ? Math.round(700000 / timeElapsed) : 0
      setScore((s) => s + 100 + bonus)
    }

    // Measure where the piles sit before the cascade takes the table over, so
    // the cards appear to leave the foundations they were stacked on.
    const area = gameAreaRef.current
    if (area) {
      const base = area.getBoundingClientRect()
      const origins = Array.from(area.querySelectorAll<HTMLElement>("[data-foundation]")).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - base.left, y: r.top - base.top }
      })
      setCascadeOrigins(origins)
    }
    setCascadePiles(foundations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundations, gameWon])

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  // Save high score
  const saveHighScore = () => {
    if (playerName.trim() === "") return

    const newScore = {
      name: playerName.substring(0, 3).toUpperCase(),
      score: score,
      time: timeElapsed,
    }

    const newHighScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score) // Sort by score (higher is better)
      .slice(0, 10) // Keep only top 10

    setHighScores(newHighScores)
    setShowNameInput(false)
    setShowHighScores(true)
  }

  // Initialize game on mount
  useEffect(() => {
    initGame()
    // Deal once on mount. Depending on initGame would redeal the table
    // whenever any of its inputs changed, mid-game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Alt+Shift+2 won the game on the spot in the original, cascade and all.
  // Kept, because everyone who ever knew it will try it here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.altKey && e.shiftKey && e.code === "Digit2")) return
      e.preventDefault()
      const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
      const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
      setStock([])
      setWaste([])
      setTableau(Array(7).fill([]).map(() => []))
      setFoundations(
        suits.map((suit) => ranks.map((rank) => ({ suit, rank, faceUp: true, id: `${rank}-${suit}` }))),
      )
      setGameStarted(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Game menu options
  const gameMenuOptions = [
    {
      label: "New Game",
      action: initGame,
    },
    {
      label: "Deck...",
      action: () => setShowDeckPicker(true),
    },
    {
      label: "High Scores",
      action: () => setShowHighScores(true),
    },
    {
      label: "Exit",
      action: onReturn,
    },
  ]

  // Options menu options
  const optionsMenuOptions = [
    {
      label: `Draw ${drawThree ? "Three" : "One"}`,
      action: () => {
        setDrawThree((v) => !v)
        initGame()
      },
    },
    {
      label: `${vegas ? "Vegas" : "Standard"} scoring`,
      action: () => {
        const next = !vegas
        setVegas(next)
        initGame(next)
      },
    },
    {
      label: `Sound: ${soundEnabled ? "On" : "Off"}`,
      action: toggleSound,
    },
  ]

  // Help menu options
  const helpMenuOptions = [
    {
      label: "How to Play",
      action: () => setShowHelp(true),
    },
  ]

  // Render a card
  const renderCard = (card: CardState, index: number, isStacked = false) => {
    if (!card.faceUp) {
      // Card back
      return (
        <div
          key={card.id}
          data-card={card.id}
          data-face="down"
          className={`w-16 h-24 rounded border border-gray-400 bg-blue-700 ${isStacked ? "" : ""}`}
          style={isStacked ? { top: `${index * 20}px` } : {}}
        >
          <div className="h-full w-full" style={DECKS[deck].style} />
        </div>
      )
    }

    // Card front
    const isRed = card.suit === "hearts" || card.suit === "diamonds"
    const suitSymbol = card.suit === "hearts" ? "♥" : card.suit === "diamonds" ? "♦" : card.suit === "clubs" ? "♣" : "♠"

    // A card is either turning face-up or settling onto a pile, never both.
    const motion = flipping.has(card.id) ? "anim-card-flip" : landing.has(card.id) ? "anim-card-land" : ""

    return (
      <div
        key={card.id}
        data-card={card.id}
        data-face="up"
        className={`w-16 h-24 rounded border border-gray-400 bg-white ${motion}`}
        style={isStacked ? { top: `${index * 20}px` } : {}}
      >
        <div className="p-1 flex flex-col justify-between h-full">
          <div className="flex justify-between">
            <div className={`text-sm font-bold ${isRed ? "text-red-600" : "text-black"}`}>{card.rank}</div>
            <div className={`text-sm ${isRed ? "text-red-600" : "text-black"}`}>{suitSymbol}</div>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className={`text-2xl ${isRed ? "text-red-600" : "text-black"}`}>{suitSymbol}</div>
          </div>
          <div className="flex justify-between transform rotate-180">
            <div className={`text-sm font-bold ${isRed ? "text-red-600" : "text-black"}`}>{card.rank}</div>
            <div className={`text-sm ${isRed ? "text-red-600" : "text-black"}`}>{suitSymbol}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="win95-type h-full w-full flex flex-col bg-[#c0c0c0] overflow-auto" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      {/* Menu bar, in the style every game shares. */}
      <div className="flex border-b border-[#808080] bg-[#c0c0c0] px-1" onMouseLeave={() => setOpenMenu(null)}>
        {(
          [
            ["Game", gameMenuOptions],
            ["Options", optionsMenuOptions],
            ["Help", helpMenuOptions],
          ] as const
        ).map(([name, options]) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] ${openMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenMenu(openMenu === name ? null : name)}
              onMouseEnter={() => openMenu && setOpenMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[170px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="flex w-full items-center px-3 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      option.action()
                      setOpenMenu(null)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Game area */}
      <div
        className="flex-1 relative bg-green-700 overflow-hidden"
        onMouseMove={handleMouseMove}
        ref={gameAreaRef}
        data-table
        onContextMenu={(e) => {
          // Right-clicking the table sent every playable card home in the
          // original, and it is how a won game is actually finished.
          e.preventDefault()
          sendAllHome()
        }}
      >
        <FitBoard w={700} h={560}>
        <div className="relative h-full w-full p-4">
        {/* Top row: Stock, Waste, and Foundations, spread as the original
            spread them. The spacer sits where the seventh station would be. */}
        <div className="mb-6 flex w-full max-w-[980px] justify-between gap-2 mx-auto">
          {/* Stock pile */}
          <div
            className="w-16 h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
            onClick={drawFromStock}
          >
            {stock.length > 0 ? (
              <div className="h-full w-full" style={DECKS[deck].style} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-white border-dashed"></div>
              </div>
            )}
          </div>

          {/* Waste pile */}
          <div className="w-16 h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative">
            {waste.length > 0 && (
              <div
                onMouseDown={(e) => {
                  if (waste.length > 0) {
                    const card = waste[waste.length - 1]
                    startDrag([card], "waste", 0, e)
                  }
                }}
                onDoubleClick={() => {
                  if (waste.length > 0) sendToFoundation("waste", 0, waste[waste.length - 1])
                }}
              >
                {renderCard(waste[waste.length - 1], 0)}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="w-8"></div>

          {/* Foundation piles */}
          {foundations.map((pile, i) => (
            <div
              key={`foundation-${i}`}
              data-foundation={i}
              className="w-16 h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
              onMouseUp={() => endDrag("foundation", i)}
            >
              {pile.length > 0 && (
                <div
                  onMouseDown={(e) => {
                    if (pile.length > 0) {
                      const card = pile[pile.length - 1]
                      startDrag([card], "foundation", i, e)
                    }
                  }}
                >
                  {renderCard(pile[pile.length - 1], 0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tableau piles */}
        <div className="flex w-full max-w-[980px] justify-between gap-2 mx-auto">
          {tableau.map((pile, i) => (
            <div
              key={`tableau-${i}`}
              className="w-16 min-h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
              onMouseUp={() => endDrag("tableau", i)}
            >
              {pile.map((card, j) => (
                <div
                  key={card.id}
                  style={{ top: `${j * 20}px` }}
                  className="absolute w-16"
                  onMouseDown={(e) => {
                    if (card.faceUp) {
                      // Start dragging this card and all cards below it
                      const cardsToMove = pile.slice(j)
                      startDrag(cardsToMove, "tableau", i, e)
                    }
                  }}
                  onDoubleClick={() => {
                    // Only the exposed card at the bottom of a pile can fly off.
                    if (card.faceUp && j === pile.length - 1) sendToFoundation("tableau", i, card)
                  }}
                >
                  {renderCard(card, j, true)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Game > Deck */}
        {showDeckPicker && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40" data-deck-picker>
            <div className="w-[330px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]">
              <div className="bg-[#000080] px-2 py-[2px] font-bold text-white">Select Card Back</div>
              <div className="grid grid-cols-4 gap-2 p-3">
                {DECKS.map((design, i) => (
                  <button
                    key={design.name}
                    type="button"
                    title={design.name}
                    data-deck={i}
                    onClick={() => {
                      setDeck(i)
                      setShowDeckPicker(false)
                    }}
                    className="h-[54px] w-[38px] rounded border border-gray-500"
                    style={{
                      ...design.style,
                      boxShadow: deck === i ? "0 0 0 2px #000080" : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 px-3 pb-3">
                <button
                  type="button"
                  className="min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040]"
                  onClick={() => setShowDeckPicker(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The winning cascade, painted over the table until it runs out or is clicked away */}
        {cascadePiles && (
          <CardCascade cards={cascadePiles} origins={cascadeOrigins} onDone={() => setCascadePiles(null)} />
        )}

        {/* Dragging cards */}
        {isDragging && dragState && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: `${dragPosition.x - (dragState.offsetX || 0)}px`,
              top: `${dragPosition.y - (dragState.offsetY || 0)}px`,
            }}
          >
            {dragState.cards.map((card, i) => (
              <div key={card.id} style={{ top: `${i * 20}px` }} className="absolute">
                {renderCard(card, i)}
              </div>
            ))}
          </div>
        )}
        </div>
        </FitBoard>
      </div>

      {/* Game status and controls */}
      <div className="w-full bg-[#c0c0c0] px-2 py-1 border-t border-white flex justify-between items-center text-sm">
        <span>{gameWon ? "Game Won!" : "Drag cards to move them. Double-click to send to foundation."}</span>
        <span className="flex gap-4">
          <span data-score>{vegas ? `$${score}` : `Score: ${score}`}</span>
          <span>Time: {formatTime(timeElapsed)}</span>
          <span>Moves: {moves}</span>
        </span>
      </div>

      {/* Win message, held back until the cascade has had its moment */}
      {gameWon && !cascadePiles && !showNameInput && !showHighScores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[400px]">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Solitaire - Game Won!</span>
              <button
                onClick={() => setGameWon(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <h3 className="text-center font-bold mb-3">Congratulations!</h3>
                <p className="text-center mb-2">You won with a score of {score}!</p>
                <p className="text-center mb-4">
                  Time: {formatTime(timeElapsed)} | Moves: {moves}
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={() => setShowNameInput(true)}
                >
                  Save Score
                </button>
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={() => initGame()}
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[500px] max-h-[80vh] overflow-auto">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Solitaire - How to Play</span>
              <button
                onClick={() => setShowHelp(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <h2 className="text-lg font-bold mb-3">How to Play Solitaire</h2>

                <h3 className="font-bold mt-4 mb-2">Objective:</h3>
                <p className="mb-3">
                  The goal is to move all cards to the four foundation piles, sorted by suit from Ace to King.
                </p>

                <h3 className="font-bold mt-4 mb-2">Game Setup:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>Cards are dealt into seven tableau piles, with the top card of each pile face up.</li>
                  <li>The remaining cards form the stock pile.</li>
                  <li>Four empty foundation piles are created at the top right.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">Card Movement Rules:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>
                    In the tableau, cards must be placed in descending order (King to Ace) and alternating colors.
                  </li>
                  <li>Only Kings can be placed on empty tableau spots.</li>
                  <li>
                    In the foundation piles, cards must be placed in ascending order (Ace to King) of the same suit.
                  </li>
                  <li>Only Aces can be placed on empty foundation spots.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">How to Play:</h3>
                <ol className="list-decimal pl-5 space-y-1 mb-3">
                  <li>Click the stock pile to draw cards to the waste pile.</li>
                  <li>Drag cards from the waste pile or tableau to move them.</li>
                  <li>Build sequences in the tableau in descending order with alternating colors.</li>
                  <li>Move cards to the foundation piles in ascending order by suit.</li>
                  <li>When the stock pile is empty, click it to recycle the waste pile.</li>
                </ol>

                <h3 className="font-bold mt-4 mb-2">Scoring:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>Moving a card to a foundation: 10 points</li>
                  <li>Turning over a tableau card: 5 points</li>
                  <li>Winning the game: 100 bonus points</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">Tips:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Try to reveal face-down cards in the tableau as quickly as possible.</li>
                  <li>Don't rush to move cards to the foundation piles if they're useful in the tableau.</li>
                  <li>Keep track of which cards are still hidden to plan your strategy.</li>
                </ul>
              </div>
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={() => setShowHelp(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High Scores Modal */}
      {showHighScores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[400px]">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Solitaire - High Scores</span>
              <button
                onClick={() => setShowHighScores(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#5a5a5a]">
                      <th className="text-left py-1 px-2 font-bold">Rank</th>
                      <th className="text-left py-1 px-2 font-bold">Name</th>
                      <th className="text-right py-1 px-2 font-bold">Score</th>
                      <th className="text-right py-1 px-2 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((score, index) => (
                      <tr key={index} className="border-b border-[#efefef] last:border-b-0">
                        <td className="py-1 px-2">{index + 1}</td>
                        <td className="py-1 px-2">{score.name}</td>
                        <td className="py-1 px-2 text-right">{score.score}</td>
                        <td className="py-1 px-2 text-right">{formatTime(score.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={() => setShowHighScores(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[400px]">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Solitaire - New High Score!</span>
              <button
                onClick={() => setShowNameInput(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <h3 className="text-center font-bold mb-3">Congratulations!</h3>
                <p className="text-center mb-4">You scored {score} points!</p>
                <div className="flex flex-col items-center">
                  <label className="mb-2 font-bold">Enter your name (3 characters):</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    className="bg-white border border-[#5a5a5a] p-2 w-20 text-center font-bold text-xl mb-2"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={saveHighScore}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
                  onClick={() => setShowNameInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
