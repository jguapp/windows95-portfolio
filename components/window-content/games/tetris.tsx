"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { CloseIcon } from "@/components/win95-controls"
import { createSound, type SynthAudio } from "@/lib/sound"
import { messageBox } from "@/components/win95-dialog"

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00FFFF", // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000FF", // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#FF7F00", // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#FFFF00", // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00FF00", // Green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#800080", // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#FF0000", // Red
  },
}

// Game constants
const ROWS = 20
const COLS = 10
const BLOCK_SIZE = 30
const INITIAL_SPEED = 1000 // ms
const SPEED_INCREASE = 0.9 // 10% faster per level
const POINTS_PER_LINE = 100
const LINES_PER_LEVEL = 10
/** How long completed rows blink before the stack collapses onto them. */
const LINE_FLASH_MS = 330
/**
 * How long a piece may rest on the stack before it locks.
 *
 * Without this a piece locks the instant gravity finds it cannot fall, so a
 * slide or rotation you were part-way through is simply lost. Half a second is
 * enough to finish the input and not enough to stall.
 */
const LOCK_DELAY_MS = 500

/** Reads the OS motion preference at the moment it matters. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Create empty board
// A cell is 0 when empty, otherwise the colour of the settled piece.
type Cell = 0 | string
/** A piece in play: its grid, its colour, and where its top-left corner sits. */
type Tetromino = ReturnType<typeof randomTetromino>

const createEmptyBoard = (): Cell[][] => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))

// Random tetromino generator
const randomTetromino = () => {
  const keys = Object.keys(TETROMINOES)
  const tetromino = keys[Math.floor(Math.random() * keys.length)]
  return {
    type: tetromino,
    shape: TETROMINOES[tetromino as keyof typeof TETROMINOES].shape,
    color: TETROMINOES[tetromino as keyof typeof TETROMINOES].color,
    position: { x: Math.floor(COLS / 2) - 1, y: 0 },
  }
}

type Piece = ReturnType<typeof randomTetromino>

interface TetrisProps {
  onReturn: () => void
}

export default function Tetris({ onReturn }: TetrisProps) {
  // Game state
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(randomTetromino())
  /**
   * The next three pieces, not one.
   *
   * Seeing only the next piece makes stacking guesswork; three is what every
   * version after the original settled on and what makes the game readable.
   */
  const [queue, setQueue] = useState<Tetromino[]>(() => [randomTetromino(), randomTetromino(), randomTetromino()])
  /** The piece parked in the hold slot, and whether hold is available. */
  const [held, setHeld] = useState<Tetromino | null>(null)
  const [holdUsed, setHoldUsed] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores] = useState<{ name: string; score: number }[]>([
    { name: "WIN95", score: 5000 },
    { name: "PLAYER", score: 3500 },
    { name: "TETRIS", score: 2000 },
  ])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)

  // Audio refs
  /**
   * Rows that have just completed and are blinking before they collapse.
   *
   * The board keeps the finished rows in place for the length of the flash, so
   * you get to see the line you made instead of it vanishing on the same frame
   * the piece landed.
   */
  const [clearingRows, setClearingRows] = useState<number[]>([])
  /** When the piece first touched down, so the lock delay can be measured. */
  const restingSinceRef = useRef<number | null>(null)
  /** When the last gravity step happened, for the sub-cell drop offset. */
  const lastStepRef = useRef(0)
  /** The layer holding the falling piece, moved directly rather than via state. */
  const pieceLayerRef = useRef<HTMLDivElement>(null)
  const moveSound = useRef<SynthAudio | null>(null)
  const rotateSound = useRef<SynthAudio | null>(null)
  const dropSound = useRef<SynthAudio | null>(null)
  const clearSound = useRef<SynthAudio | null>(null)
  const gameOverSound = useRef<SynthAudio | null>(null)
  const levelUpSound = useRef<SynthAudio | null>(null)
  const bgMusic = useRef<SynthAudio | null>(null)

  // Game loop ref
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      moveSound.current = createSound("/sounds/tetris/move.mp3")
      rotateSound.current = createSound("/sounds/tetris/rotate.mp3")
      dropSound.current = createSound("/sounds/tetris/drop.mp3")
      clearSound.current = createSound("/sounds/tetris/clear.mp3")
      gameOverSound.current = createSound("/sounds/tetris/gameover.mp3")
      levelUpSound.current = createSound("/sounds/tetris/levelup.mp3")
      bgMusic.current = createSound("/sounds/tetris/theme.mp3")

      // Set volume
      if (moveSound.current) moveSound.current.volume = 0.3
      if (rotateSound.current) rotateSound.current.volume = 0.3
      if (dropSound.current) dropSound.current.volume = 0.3
      if (clearSound.current) clearSound.current.volume = 0.3
      if (gameOverSound.current) gameOverSound.current.volume = 0.5
      if (levelUpSound.current) levelUpSound.current.volume = 0.5
      if (bgMusic.current) {
        bgMusic.current.volume = 0.2
        bgMusic.current.loop = true
      }
    }

    return () => {
      if (bgMusic.current) {
        bgMusic.current.pause()
        bgMusic.current.currentTime = 0
      }
    }
  }, [])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const newState = !prev
      if (newState && bgMusic.current && gameStarted && !gameOver) {
        bgMusic.current.play().catch((err) => console.log("Audio playback failed:", err))
      } else if (!newState && bgMusic.current) {
        bgMusic.current.pause()
      }
      return newState
    })
  }, [gameStarted, gameOver])

  // Play sound effect
  const playSound = useCallback(
    (sound: React.MutableRefObject<SynthAudio | null>) => {
      if (audioEnabled && sound.current) {
        sound.current.currentTime = 0
        sound.current.play().catch((err) => console.log("Audio playback failed:", err))
      }
    },
    [audioEnabled],
  )

  // Check collision
  const checkCollision = useCallback(
    (piece: Piece, position: { x: number; y: number }) => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          // Skip empty cells
          if (!piece.shape[y][x]) continue

          // Calculate position on board
          const boardX = position.x + x
          const boardY = position.y + y

          // Check boundaries
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true
          }

          // Check if cell is already occupied
          if (boardY >= 0 && board[boardY][boardX]) {
            return true
          }
        }
      }
      return false
    },
    [board],
  )

  // Rotate piece
  /**
   * Rotate, nudging the piece out of the way if it will not fit.
   *
   * Without kicks a rotation against a wall or on top of the stack simply fails
   * and the piece feels stuck, which is the single most common complaint about
   * a home-made Tetris. Trying a one-cell shift left, right and up covers
   * almost every case, and the I piece needs two.
   */
  const rotatePiece = useCallback(() => {
    if (paused || gameOver) return

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) => currentPiece.shape.map((row) => row[i])).reverse(),
    }

    const kicks = [0, -1, 1, -2, 2]
    for (const dx of kicks) {
      const position = { ...currentPiece.position, x: currentPiece.position.x + dx }
      if (!checkCollision(rotated, position)) {
        setCurrentPiece({ ...rotated, position })
        playSound(rotateSound)
        return
      }
      // Floor kick: a piece rotating off the bottom lifts a row instead.
      const lifted = { ...position, y: position.y - 1 }
      if (!checkCollision(rotated, lifted)) {
        setCurrentPiece({ ...rotated, position: lifted })
        playSound(rotateSound)
        return
      }
    }
  }, [currentPiece, checkCollision, paused, gameOver, playSound])

  /**
   * Hold: park the current piece and take whatever was parked before.
   *
   * Allowed once per piece, so it cannot be used to stall indefinitely.
   */
  const holdPiece = useCallback(() => {
    if (paused || gameOver || holdUsed) return

    const parked = { ...currentPiece, position: { x: 3, y: 0 } }
    if (held) {
      setCurrentPiece({ ...held, position: { x: 3, y: 0 } })
    } else {
      setCurrentPiece(queue[0])
      setQueue((q) => [...q.slice(1), randomTetromino()])
    }
    setHeld(parked)
    setHoldUsed(true)
    lastStepRef.current = performance.now()
    playSound(rotateSound)
  }, [currentPiece, held, queue, holdUsed, paused, gameOver, playSound])

  // Move piece
  const movePiece = useCallback(
    (direction: number) => {
      if (paused || gameOver) return

      const newPosition = { ...currentPiece.position, x: currentPiece.position.x + direction }
      if (!checkCollision(currentPiece, newPosition)) {
        if (restingSinceRef.current !== null) restingSinceRef.current = performance.now()
        setCurrentPiece({ ...currentPiece, position: newPosition })
        playSound(moveSound)
      }
    },
    [currentPiece, checkCollision, paused, gameOver, playSound],
  )

  /**
   * Writes a piece into the board and deals with what that lands on.
   *
   * Takes the piece rather than reading state, so a hard drop can settle a
   * piece at the bottom and lock it there in one go.
   */
  const lockPiece = useCallback(
    (piece: Tetromino) => {
      const newBoard = [...board]
      piece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = piece.position.y + y
            const boardX = piece.position.x + x
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              newBoard[boardY][boardX] = piece.color
            }
          }
        })
      })

      // Check for game over
      if (piece.position.y <= 0) {
        setGameOver(true)
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current)
          gameLoopRef.current = null
        }
        playSound(gameOverSound)
        if (bgMusic.current) {
          bgMusic.current.pause()
          bgMusic.current.currentTime = 0
        }
        return
      }

      // Check for completed lines
      const fullRows: number[] = []
      newBoard.forEach((row, y) => {
        if (row.every((cell) => cell)) fullRows.push(y)
      })

      const collapse = () => {
        const updatedBoard = newBoard.reduce((acc, row) => {
          if (row.every((cell) => cell)) acc.unshift(Array<Cell>(COLS).fill(0))
          else acc.push(row)
          return acc
        }, [] as Cell[][])

        if (fullRows.length > 0) {
          const newLines = lines + fullRows.length
          const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1

          setLines(newLines)
          setScore(score + fullRows.length * POINTS_PER_LINE * level)

          if (newLevel > level) {
            setLevel(newLevel)
            setSpeed(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel - 1))
            playSound(levelUpSound)
          } else {
            playSound(clearSound)
          }
        }

        setClearingRows([])
        setBoard(updatedBoard)
        setCurrentPiece(queue[0])
        setQueue((q) => [...q.slice(1), randomTetromino()])
        setHoldUsed(false)
        lastStepRef.current = performance.now()
      }

      if (fullRows.length > 0 && !prefersReducedMotion()) {
        // Show the completed rows blinking on the locked board, then collapse.
        // The next piece is held back until the flash is over, so nothing can
        // be moved during it and the pause cannot cost the player anything.
        playSound(dropSound)
        setBoard(newBoard)
        setClearingRows(fullRows)
        window.setTimeout(collapse, LINE_FLASH_MS)
        return
      }

      if (fullRows.length === 0) playSound(dropSound)
      collapse()
    },
    [board, queue, score, level, lines, playSound],
  )

  // Drop piece
  const dropPiece = useCallback(() => {
    if (paused || gameOver) return

    const newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 }
    if (!checkCollision(currentPiece, newPosition)) {
      lastStepRef.current = performance.now()
      restingSinceRef.current = null
      setCurrentPiece({ ...currentPiece, position: newPosition })
      return
    }

    // The piece has landed. Hold it for the lock delay so a slide or rotation
    // already under way still counts, and only lock once that has run out.
    const now = performance.now()
    if (restingSinceRef.current === null) {
      restingSinceRef.current = now
      return
    }
    if (now - restingSinceRef.current < LOCK_DELAY_MS) return

    restingSinceRef.current = null
    lockPiece(currentPiece)
  }, [currentPiece, checkCollision, paused, gameOver, lockPiece])

  /**
   * Hard drop.
   *
   * This used to set the piece to the landing row and then call dropPiece,
   * which read the piece from state that had not committed yet and so moved it
   * a single row instead of locking it at the bottom. Space soft-dropped one
   * cell and no amount of pressing it ever finished a piece.
   */
  const hardDrop = useCallback(() => {
    if (paused || gameOver) return

    let newY = currentPiece.position.y
    while (!checkCollision(currentPiece, { ...currentPiece.position, y: newY + 1 })) {
      newY++
    }

    // Two points a row for a hard drop against one for a soft drop, so
    // committing to a placement pays better than nudging it down.
    setScore((prev) => prev + (newY - currentPiece.position.y) * 2)
    restingSinceRef.current = null
    lockPiece({ ...currentPiece, position: { ...currentPiece.position, y: newY } })
  }, [currentPiece, checkCollision, lockPiece, paused, gameOver])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || showHelp || showHighScores) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault() // Prevent scrolling
          movePiece(-1)
          break
        case "ArrowRight":
          e.preventDefault() // Prevent scrolling
          movePiece(1)
          break
        case "ArrowDown":
          e.preventDefault() // Prevent scrolling
          dropPiece()
          break
        case "ArrowUp":
          e.preventDefault() // Prevent scrolling
          rotatePiece()
          break
        case " ":
          e.preventDefault() // Prevent scrolling
          hardDrop()
          break
        case "c":
        case "C":
        case "Shift":
          e.preventDefault()
          holdPiece()
          break
        case "p":
        case "P":
          togglePause()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted, movePiece, dropPiece, rotatePiece, hardDrop, holdPiece, showHelp, showHighScores])

  // Game loop
  useEffect(() => {
    if (gameStarted && !paused && !gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }

      gameLoopRef.current = setInterval(() => {
        lastStepRef.current = performance.now()
        dropPiece()
      }, speed)
      lastStepRef.current = performance.now()
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [gameStarted, paused, gameOver, speed, dropPiece])

  // Start background music
  useEffect(() => {
    if (gameStarted && !gameOver && !paused && audioEnabled && bgMusic.current) {
      bgMusic.current.play().catch((err) => console.log("Audio playback failed:", err))
    } else if ((!gameStarted || gameOver || paused) && bgMusic.current) {
      bgMusic.current.pause()
    }
  }, [gameStarted, gameOver, paused, audioEnabled])

  // Start new game
  const startNewGame = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentPiece(randomTetromino())
    setQueue([randomTetromino(), randomTetromino(), randomTetromino()])
    setHeld(null)
    setHoldUsed(false)
    setGameOver(false)
    setPaused(false)
    setScore(0)
    setLevel(1)
    setLines(0)
    setSpeed(INITIAL_SPEED)
    setGameStarted(true)
    setShowMenu(null)

    if (audioEnabled && bgMusic.current) {
      bgMusic.current.currentTime = 0
      bgMusic.current.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }, [audioEnabled])

  // Toggle pause
  const togglePause = useCallback(() => {
    if (gameOver) return

    setPaused((prev) => {
      const newPaused = !prev
      if (newPaused && bgMusic.current) {
        bgMusic.current.pause()
      } else if (!newPaused && audioEnabled && bgMusic.current) {
        bgMusic.current.play().catch((err) => console.log("Audio playback failed:", err))
      }
      return newPaused
    })
  }, [gameOver, audioEnabled])

  /**
   * Slides the falling piece between rows.
   *
   * Gravity still moves the piece a whole cell at a time, because anything else
   * would change collision and therefore the game. This only offsets where that
   * piece is drawn, by however far it is through the current interval, so it
   * travels instead of teleporting. The transform is written straight to the
   * node: doing it through state would re-render the whole board sixty times a
   * second for a purely visual nudge.
   */
  useEffect(() => {
    if (!gameStarted || paused || gameOver) {
      if (pieceLayerRef.current) pieceLayerRef.current.style.transform = "translateY(0px)"
      return
    }
    if (prefersReducedMotion()) return

    let frame = 0
    const tick = () => {
      const layer = pieceLayerRef.current
      if (layer) {
        const elapsed = performance.now() - lastStepRef.current
        // Capped at one cell so a slow frame cannot draw the piece past where
        // it is really about to land.
        const progress = Math.max(0, Math.min(elapsed / speed, 1))
        layer.style.transform = `translateY(${(progress * (BLOCK_SIZE + 1)).toFixed(2)}px)`
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gameStarted, paused, gameOver, speed])

  // Render board
  const renderBoard = () => {
    const boardWithPiece = [...board.map((row) => [...row])]
    // Cells the current piece would occupy if dropped now, drawn as an outline
    // so you can see where it lands without counting rows.
    const ghost = new Set<string>()

    if (!gameOver && !paused) {
      let drop = currentPiece.position.y
      while (!checkCollision(currentPiece, { x: currentPiece.position.x, y: drop + 1 })) drop++
      if (drop !== currentPiece.position.y) {
        currentPiece.shape.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (!cell) return
            const gy = drop + y
            const gx = currentPiece.position.x + x
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) ghost.add(`${gy}-${gx}`)
          })
        })
      }
    }

    // The falling piece is drawn as its own layer rather than written into the
    // grid, which is what lets it sit between two rows while it travels.
    const PITCH = BLOCK_SIZE + 1

    return (
      <div className="relative">
        <div
          className="tetris-board relative border-2 border-gray-400 bg-gray-800"
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
            gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
            gap: "1px",
            padding: "2px",
            backgroundColor: "#000",
            boxShadow: "inset 2px 2px 0px #fff, inset -2px -2px 0px #888",
          }}
        >
          {boardWithPiece.map((row, y) =>
            row.map((cell, x) => {
              const isGhost = !cell && ghost.has(`${y}-${x}`)
              return (
                <div
                  key={`${y}-${x}`}
                  data-ghost={isGhost || undefined}
                  data-clearing={clearingRows.includes(y) || undefined}
                  className={clearingRows.includes(y) ? "anim-row-flash" : undefined}
                  style={{
                    backgroundColor: cell || "#111",
                    border: cell
                      ? "1px solid rgba(255, 255, 255, 0.3)"
                      : isGhost
                        ? `1px solid ${currentPiece.color}`
                        : "1px solid rgba(0, 0, 0, 0.3)",
                    boxShadow: cell
                      ? "inset 2px 2px 0px rgba(255, 255, 255, 0.4), inset -2px -2px 0px rgba(0, 0, 0, 0.4)"
                      : "none",
                  }}
                />
              )
            }),
          )}

          {/* The falling piece */}
          {!gameOver && (
            <div
              ref={pieceLayerRef}
              data-piece
              // The shape as a string, so its rotation state is observable.
              data-piece-shape={currentPiece.shape.map((row) => row.join("")).join("/")}
              data-piece-x={currentPiece.position.x}
              className="pointer-events-none absolute"
              style={{ left: 2, top: 2, willChange: "transform" }}
            >
              {currentPiece.shape.map((row, y) =>
                row.map((cell, x) =>
                  cell ? (
                    <div
                      key={`p-${y}-${x}`}
                      className="absolute"
                      style={{
                        left: (currentPiece.position.x + x) * PITCH,
                        top: (currentPiece.position.y + y) * PITCH,
                        width: BLOCK_SIZE,
                        height: BLOCK_SIZE,
                        backgroundColor: currentPiece.color,
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        boxShadow:
                          "inset 2px 2px 0px rgba(255, 255, 255, 0.4), inset -2px -2px 0px rgba(0, 0, 0, 0.4)",
                      }}
                    />
                  ) : null,
                ),
              )}
            </div>
          )}
        </div>

        {/* Pause Overlay */}
        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="bg-gray-200 border-4 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-6 text-center">
              <h2 className="text-4xl font-bold mb-4">PAUSED</h2>
              <p className="text-lg">Press 'P' to resume</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  /** A small board showing one piece, used for the queue and the hold slot. */
  const renderPiece = (piece: Tetromino | null, size = 14) => (
    <div
      className="flex items-center justify-center"
      style={{
        width: size * 4 + 8,
        height: size * 2 + 8,
        backgroundColor: "#000",
        boxShadow: "inset 2px 2px 0px #fff, inset -2px -2px 0px #888",
      }}
    >
      {piece && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${piece.shape.length}, ${size}px)`,
            gridTemplateColumns: `repeat(${piece.shape[0].length}, ${size}px)`,
            gap: "1px",
          }}
        >
          {piece.shape.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`p-${y}-${x}`}
                style={{
                  backgroundColor: cell ? piece.color : "transparent",
                  border: cell ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                  boxShadow: cell
                    ? "inset 2px 2px 0px rgba(255, 255, 255, 0.4), inset -2px -2px 0px rgba(0, 0, 0, 0.4)"
                    : "none",
                }}
              />
            )),
          )}
        </div>
      )}
    </div>
  )

  // Render next piece preview: three deep, plus whatever is being held.
  const renderNextPiece = () => (
    <div data-queue className="flex flex-col gap-2">
      {queue.map((piece, i) => (
        <div key={`q-${i}`} data-queue-slot={i} data-slot-shape={piece.shape.map((row) => row.join("")).join("/")}>
          {renderPiece(piece, i === 0 ? 16 : 11)}
        </div>
      ))}
      <div className="mt-1 text-xs">Hold (C)</div>
      <div data-hold data-hold-empty={held ? undefined : ""} style={{ opacity: holdUsed ? 0.5 : 1 }}>
        {renderPiece(held, 11)}
      </div>
    </div>
  )

  // Render game controls
  const renderControls = () => (
    <div className="game-controls bg-gray-200 p-4 border-t-2 border-gray-400">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            onClick={startNewGame}
          >
            New Game
          </button>
          <button
            className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            onClick={togglePause}
            disabled={!gameStarted || gameOver}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            onClick={() => setShowHelp(true)}
          >
            Help
          </button>
          <button
            className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            onClick={toggleAudio}
          >
            Sound: {audioEnabled ? "On" : "Off"}
          </button>
          <button
            className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            onClick={onReturn}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )

  // Render game info
  const renderGameInfo = () => (
    <div className="game-info bg-gray-200 p-4 border-2 border-gray-400 flex flex-col space-y-4">
      <div className="next-piece">
        <h3 className="text-lg font-bold mb-2">Next Piece</h3>
        <div className="flex justify-center">{renderNextPiece()}</div>
      </div>
      <div className="stats">
        <div className="stat-item mb-2">
          <h4 className="font-bold">Score</h4>
          <div className="bg-white border-2 border-b-gray-800 border-r-gray-800 border-t-white border-l-white p-2">
            {score}
          </div>
        </div>
        <div className="stat-item mb-2">
          <h4 className="font-bold">Level</h4>
          <div className="bg-white border-2 border-b-gray-800 border-r-gray-800 border-t-white border-l-white p-2">
            {level}
          </div>
        </div>
        <div className="stat-item">
          <h4 className="font-bold">Lines</h4>
          <div className="bg-white border-2 border-b-gray-800 border-r-gray-800 border-t-white border-l-white p-2">
            {lines}
          </div>
        </div>
      </div>
      <div className="controls-info mt-4">
        <h3 className="text-lg font-bold mb-2">Controls</h3>
        <ul className="text-sm">
          <li>← → : Move</li>
          <li>↑ : Rotate</li>
          <li>↓ : Soft Drop</li>
          <li>Space : Hard Drop</li>
          <li>P : Pause</li>
        </ul>
      </div>
    </div>
  )

  // Render help modal
  const renderHelpModal = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-200 border-2 border-gray-400 w-[600px] max-h-[80vh] overflow-auto">
        <div className="window-title bg-blue-900 text-white p-1 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/images/help-icon.png" alt="Help" className="w-4 h-4 mr-2" />
            <span>Tetris Help</span>
          </div>
          <button
            className="w-5 h-5 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black"
            onClick={() => setShowHelp(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">How to Play Tetris</h2>

          <h3 className="text-lg font-bold mt-4 mb-2">Objective</h3>
          <p className="mb-2">
            The goal of Tetris is to score as many points as possible by clearing horizontal lines of blocks. The game
            ends when the blocks stack up to the top of the screen.
          </p>

          <h3 className="text-lg font-bold mt-4 mb-2">Game Elements</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>
              <strong>Tetrominoes:</strong> Seven different shapes made up of four blocks each. Each shape has a
              different color.
            </li>
            <li>
              <strong>Game Board:</strong> A 10×20 grid where the tetrominoes fall and stack.
            </li>
            <li>
              <strong>Next Piece:</strong> Shows the next tetromino that will appear after the current one.
            </li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">Controls</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>
              <strong>Left/Right Arrow Keys:</strong> Move the tetromino horizontally.
            </li>
            <li>
              <strong>Up Arrow Key:</strong> Rotate the tetromino clockwise.
            </li>
            <li>
              <strong>Down Arrow Key:</strong> Soft drop - move the tetromino down faster.
            </li>
            <li>
              <strong>Spacebar:</strong> Hard drop - instantly drop the tetromino to the bottom.
            </li>
            <li>
              <strong>P Key:</strong> Pause/Resume the game.
            </li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">Scoring</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>
              <strong>Line Clear:</strong> You score points by clearing lines. The more lines you clear at once, the
              more points you get.
            </li>
            <li>
              <strong>Level:</strong> The game speeds up as you clear more lines and advance to higher levels.
            </li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">Tips</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>Plan ahead using the Next Piece preview.</li>
            <li>Try to keep the stack as flat as possible.</li>
            <li>Leave a column open for the I-piece (the long straight one) to clear multiple lines at once.</li>
            <li>Use hard drop (Spacebar) to place pieces quickly when you're sure of their position.</li>
          </ul>

          <div className="flex justify-center mt-6">
            <button
              className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800"
              onClick={() => setShowHelp(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render high scores modal
  const renderHighScoresModal = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-200 border-2 border-gray-400 w-[400px]">
        <div className="window-title bg-blue-900 text-white p-1 flex justify-between items-center">
          <div className="flex items-center">
            <span>High Scores</span>
          </div>
          <button
            className="w-5 h-5 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black"
            onClick={() => setShowHighScores(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-center">High Scores</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-gray-400 p-2 text-left">Rank</th>
                <th className="border border-gray-400 p-2 text-left">Name</th>
                <th className="border border-gray-400 p-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {highScores.map((score, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-400 p-2">{index + 1}</td>
                  <td className="border border-gray-400 p-2">{score.name}</td>
                  <td className="border border-gray-400 p-2 text-right">{score.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-6">
            <button
              className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800"
              onClick={() => setShowHighScores(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render game over modal
  const renderGameOverModal = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-200 border-2 border-gray-400 w-[400px]">
        <div className="window-title bg-blue-900 text-white p-1 flex justify-between items-center">
          <div className="flex items-center">
            <span>Game Over</span>
          </div>
          <button
            className="w-5 h-5 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black"
            onClick={() => setGameOver(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Game Over</h2>
          <p className="text-center mb-4">Your score: {score}</p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800"
              onClick={startNewGame}
            >
              New Game
            </button>
            <button
              className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800"
              onClick={() => setShowHighScores(true)}
            >
              High Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render start screen
  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center h-full bg-blue-900 text-white p-8">
      <div className="tetris-logo text-center mb-8">
        <h1 className="text-6xl font-bold mb-2 text-yellow-400 drop-shadow-lg">TETRIS</h1>
        <p className="text-xl">Windows 95 Edition</p>
      </div>

      <div className="tetris-pieces flex justify-center mb-8">
        {Object.entries(TETROMINOES).map(([key, tetromino]) => (
          <div
            key={key}
            className="mx-2"
            style={{
              display: "grid",
              gridTemplateRows: `repeat(${tetromino.shape.length}, 15px)`,
              gridTemplateColumns: `repeat(${tetromino.shape[0].length}, 15px)`,
              gap: "1px",
            }}
          >
            {tetromino.shape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${key}-${y}-${x}`}
                  style={{
                    backgroundColor: cell ? tetromino.color : "transparent",
                    border: cell ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                    boxShadow: cell
                      ? "inset 1px 1px 0px rgba(255, 255, 255, 0.4), inset -1px -1px 0px rgba(0, 0, 0, 0.4)"
                      : "none",
                  }}
                />
              )),
            )}
          </div>
        ))}
      </div>

      <div className="start-buttons flex flex-col space-y-4 w-64">
        <button
          className="px-4 py-2 bg-gray-300 text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-gray-400"
          onClick={startNewGame}
        >
          New Game
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-gray-400"
          onClick={() => setShowHighScores(true)}
        >
          High Scores
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-gray-400"
          onClick={() => setShowHelp(true)}
        >
          How to Play
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-gray-400"
          onClick={toggleAudio}
        >
          Sound: {audioEnabled ? "On" : "Off"}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-gray-400 mt-4"
          onClick={onReturn}
        >
          Back to Games
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-300">
        <p>© 1984-1989 Tetris</p>
        <p>Windows 95 Edition</p>
      </div>
    </div>
  )

  // Render menu bar
  const renderMenuBar = () => (
    <div className="menu-bar flex border-b border-[#808080] bg-[#c0c0c0] px-1">
      <div className="flex">
        <div className="relative">
          <button
            className={`px-2 py-[2px] ${showMenu === "game" ? "bg-[#000080] text-white" : ""}`}
            onClick={() => setShowMenu(showMenu === "game" ? null : "game")}
          >
            Game
          </button>
          {showMenu === "game" && (
            <div className="absolute left-0 top-full bg-gray-200 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-48 z-10">
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  startNewGame()
                  setShowMenu(null)
                }}
              >
                New Game
              </button>
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  togglePause()
                  setShowMenu(null)
                }}
                disabled={!gameStarted || gameOver}
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <div className="border-t border-gray-400 my-1"></div>
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  setShowHighScores(true)
                  setShowMenu(null)
                }}
              >
                High Scores
              </button>
              <div className="border-t border-gray-400 my-1"></div>
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  onReturn()
                  setShowMenu(null)
                }}
              >
                Exit
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className={`px-2 py-[2px] ${showMenu === "options" ? "bg-[#000080] text-white" : ""}`}
            onClick={() => setShowMenu(showMenu === "options" ? null : "options")}
          >
            Options
          </button>
          {showMenu === "options" && (
            <div className="absolute left-0 top-full bg-gray-200 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-48 z-10">
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  toggleAudio()
                  setShowMenu(null)
                }}
              >
                Sound: {audioEnabled ? "On" : "Off"}
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className={`px-2 py-[2px] ${showMenu === "help" ? "bg-[#000080] text-white" : ""}`}
            onClick={() => setShowMenu(showMenu === "help" ? null : "help")}
          >
            Help
          </button>
          {showMenu === "help" && (
            <div className="absolute left-0 top-full bg-gray-200 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-48 z-10">
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  setShowHelp(true)
                  setShowMenu(null)
                }}
              >
                How to Play
              </button>
              <div className="border-t border-gray-400 my-1"></div>
              <button
                className="w-full text-left px-4 py-1 hover:bg-blue-700 hover:text-white"
                onClick={() => {
                  messageBox({ title: "About Tetris", text: "Tetris\n\nWindows 95 recreation.", icon: "information" })
                  setShowMenu(null)
                }}
              >
                About
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Main render
  return (
    <div className="tetris-game h-full flex flex-col">
      {/* Menu bar. The Games window carries the title bar. */}
      {renderMenuBar()}

      {/* Game content */}
      {!gameStarted ? (
        renderStartScreen()
      ) : (
        <div className="game-content flex-1 flex">
          <div className="game-area flex-1 flex justify-center items-center bg-gray-700 p-4">{renderBoard()}</div>
          <div className="game-sidebar w-64 bg-gray-200">{renderGameInfo()}</div>
        </div>
      )}

      {/* Game controls */}
      {gameStarted && renderControls()}

      {/* Modals */}
      {showHelp && renderHelpModal()}
      {showHighScores && renderHighScoresModal()}
      {gameOver && gameStarted && renderGameOverModal()}
    </div>
  )
}
