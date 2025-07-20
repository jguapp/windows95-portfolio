"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

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
  const [showMenu, setShowMenu] = useState(false)
  const [showGameMenu, setShowGameMenu] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [dealSound, setDealSound] = useState<HTMLAudioElement | null>(null)
  const [flipSound, setFlipSound] = useState<HTMLAudioElement | null>(null)
  const [winSound, setWinSound] = useState<HTMLAudioElement | null>(null)
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

  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Initialize sounds
  useEffect(() => {
    const deal = new Audio("/sounds/card-deal.mp3")
    const flip = new Audio("/sounds/card-flip.mp3")
    const win = new Audio("/sounds/victory.mp3")

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

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Initialize game
  const initGame = () => {
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
    setScore(0)
    setGameWon(false)
    setTimeElapsed(0)
    setGameStarted(true)

    playDealSound()
  }

  // Create and shuffle a deck of cards
  const createDeck = () => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10" | "J", "Q", "K"]
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
        playFlipSound()
      }
      return
    }

    // Draw one card from stock to waste
    const newStock = [...stock]
    const card = newStock.pop()

    if (card) {
      card.faceUp = true
      setStock(newStock)
      setWaste([...waste, card])
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
  const endDrag = (e: React.MouseEvent, targetType: PileType, targetIndex: number) => {
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
      checkWinCondition()
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

        setWaste(newWaste)
        setFoundations(newFoundations)
        setMoves(moves + 1)
        setScore(score + 10) // Points for moving to foundation
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
            setScore(score + 5) // Points for revealing a card
          }
        }

        setTableau(newTableau)
        setFoundations(newFoundations)
        setMoves(moves + 1)
        setScore(score + 10) // Points for moving to foundation
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
          setScore(score + 5) // Points for revealing a card
        }
      }

      setTableau(newTableau)
      setMoves(moves + 1)
    }
  }

  // Check if the game is won
  const checkWinCondition = () => {
    // Game is won when all foundations have 13 cards (A through K)
    const isWon = foundations.every((foundation) => foundation.length === 13)

    if (isWon && !gameWon) {
      setGameWon(true)
      playWinSound()
      // Add bonus points for winning
      setScore(score + 100)
      setShowNameInput(true)
    }
  }

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
  }, [])

  // Game menu options
  const gameMenuOptions = [
    {
      label: "New Game",
      action: initGame,
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
          className={`w-16 h-24 rounded border border-gray-400 bg-blue-700 ${isStacked ? "" : ""}`}
          style={isStacked ? { top: `${index * 20}px` } : {}}
        >
          <div className="w-full h-full bg-[url('/images/card-back.png')] bg-cover"></div>
        </div>
      )
    }

    // Card front
    const isRed = card.suit === "hearts" || card.suit === "diamonds"
    const suitSymbol = card.suit === "hearts" ? "♥" : card.suit === "diamonds" ? "♦" : card.suit === "clubs" ? "♣" : "♠"

    return (
      <div
        key={card.id}
        className={`w-16 h-24 rounded border border-gray-400 bg-white ${isStacked ? "" : ""}`}
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
    <div className="h-full w-full flex flex-col bg-[#c0c0c0] overflow-auto">
      {/* Windows 95 Title Bar */}
      <div className="w-full bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/images/games/solitaire-logo.png" alt="Solitaire" className="w-5 h-5 mr-2" />
          <span className="font-bold">Solitaire</span>
        </div>
        <button
          onClick={onReturn}
          className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
        >
          X
        </button>
      </div>

      {/* Menu Bar */}
      <div className="w-full bg-[#c0c0c0] border-b border-[#5a5a5a] px-2 py-1 flex space-x-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowGameMenu(!showGameMenu)
              setShowOptionsMenu(false)
              setShowHelpMenu(false)
            }}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm"
          >
            Game
          </button>
          {showGameMenu && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border border-black shadow-md z-50 w-40">
              {gameMenuOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action()
                    setShowGameMenu(false)
                  }}
                  className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white text-sm border-b border-[#efefef] last:border-b-0"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowOptionsMenu(!showOptionsMenu)
              setShowGameMenu(false)
              setShowHelpMenu(false)
            }}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm"
          >
            Options
          </button>
          {showOptionsMenu && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border border-black shadow-md z-50 w-40">
              {optionsMenuOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action()
                    setShowOptionsMenu(false)
                  }}
                  className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white text-sm border-b border-[#efefef] last:border-b-0"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowHelpMenu(!showHelpMenu)
              setShowGameMenu(false)
              setShowOptionsMenu(false)
            }}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm"
          >
            Help
          </button>
          {showHelpMenu && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border border-black shadow-md z-50 w-40">
              {helpMenuOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action()
                    setShowHelpMenu(false)
                  }}
                  className="w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white text-sm border-b border-[#efefef] last:border-b-0"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="w-full bg-[#c0c0c0] p-2 flex justify-between items-center border-b border-[#5a5a5a]">
        <div className="flex space-x-2">
          <button
            onClick={initGame}
            className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
          >
            New Game
          </button>
          <button
            onClick={toggleSound}
            className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
          >
            Sound: {soundEnabled ? "On" : "Off"}
          </button>
          <button
            onClick={onReturn}
            className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
          >
            Return to Games
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-[#c0c0c0] border border-[#5a5a5a] border-r-white border-b-white px-3 py-1">
            <span className="text-sm">Score: {score}</span>
          </div>
          <div className="bg-[#c0c0c0] border border-[#5a5a5a] border-r-white border-b-white px-3 py-1">
            <span className="text-sm">Time: {formatTime(timeElapsed)}</span>
          </div>
          <div className="bg-[#c0c0c0] border border-[#5a5a5a] border-r-white border-b-white px-3 py-1">
            <span className="text-sm">Moves: {moves}</span>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 p-4 relative bg-green-700 overflow-auto" onMouseMove={handleMouseMove} ref={gameAreaRef}>
        {/* Top row: Stock, Waste, and Foundations */}
        <div className="flex gap-4 mb-6">
          {/* Stock pile */}
          <div
            className="w-16 h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
            onClick={drawFromStock}
          >
            {stock.length > 0 ? (
              <div className="w-full h-full bg-[url('/images/card-back.png')] bg-cover"></div>
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
              className="w-16 h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
              onMouseUp={(e) => endDrag(e, "foundation", i)}
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
        <div className="flex gap-4">
          {tableau.map((pile, i) => (
            <div
              key={`tableau-${i}`}
              className="w-16 min-h-24 rounded border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] bg-green-800 relative"
              onMouseUp={(e) => endDrag(e, "tableau", i)}
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
                >
                  {renderCard(card, j, true)}
                </div>
              ))}
            </div>
          ))}
        </div>

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

      {/* Game status and controls */}
      <div className="w-full bg-[#c0c0c0] p-2 border-t border-white flex justify-between items-center">
        <div>
          <span className="text-sm">
            {gameWon ? "Game Won!" : "Drag cards to move them. Double-click to send to foundation."}
          </span>
        </div>
        <button
          onClick={onReturn}
          className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
        >
          Exit Game
        </button>
      </div>

      {/* Win message */}
      {gameWon && !showNameInput && !showHighScores && (
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
                  onClick={initGame}
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
