"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"

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

// Create empty board
const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0))

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

interface TetrisProps {
  onReturn: () => void
}

export default function Tetris({ onReturn }: TetrisProps) {
  // Game state
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(randomTetromino())
  const [nextPiece, setNextPiece] = useState(randomTetromino())
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores, setHighScores] = useState<{ name: string; score: number }[]>([
    { name: "WIN95", score: 5000 },
    { name: "PLAYER", score: 3500 },
    { name: "TETRIS", score: 2000 },
  ])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)

  // Audio refs
  const moveSound = useRef<HTMLAudioElement | null>(null)
  const rotateSound = useRef<HTMLAudioElement | null>(null)
  const dropSound = useRef<HTMLAudioElement | null>(null)
  const clearSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)
  const levelUpSound = useRef<HTMLAudioElement | null>(null)
  const bgMusic = useRef<HTMLAudioElement | null>(null)

  // Game loop ref
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      moveSound.current = new Audio("/sounds/tetris/move.mp3")
      rotateSound.current = new Audio("/sounds/tetris/rotate.mp3")
      dropSound.current = new Audio("/sounds/tetris/drop.mp3")
      clearSound.current = new Audio("/sounds/tetris/clear.mp3")
      gameOverSound.current = new Audio("/sounds/tetris/gameover.mp3")
      levelUpSound.current = new Audio("/sounds/tetris/levelup.mp3")
      bgMusic.current = new Audio("/sounds/tetris/theme.mp3")

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
    (sound: React.MutableRefObject<HTMLAudioElement | null>) => {
      if (audioEnabled && sound.current) {
        sound.current.currentTime = 0
        sound.current.play().catch((err) => console.log("Audio playback failed:", err))
      }
    },
    [audioEnabled],
  )

  // Check collision
  const checkCollision = useCallback(
    (piece: any, position: { x: number; y: number }) => {
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
  const rotatePiece = useCallback(() => {
    if (paused || gameOver) return

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) => currentPiece.shape.map((row) => row[i])).reverse(),
    }

    if (!checkCollision(rotated, currentPiece.position)) {
      setCurrentPiece(rotated)
      playSound(rotateSound)
    }
  }, [currentPiece, checkCollision, paused, gameOver, playSound])

  // Move piece
  const movePiece = useCallback(
    (direction: number) => {
      if (paused || gameOver) return

      const newPosition = { ...currentPiece.position, x: currentPiece.position.x + direction }
      if (!checkCollision(currentPiece, newPosition)) {
        setCurrentPiece({ ...currentPiece, position: newPosition })
        playSound(moveSound)
      }
    },
    [currentPiece, checkCollision, paused, gameOver, playSound],
  )

  // Drop piece
  const dropPiece = useCallback(() => {
    if (paused || gameOver) return

    const newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 }
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition })
    } else {
      // Lock piece in place
      const newBoard = [...board]
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              newBoard[boardY][boardX] = currentPiece.color
            }
          }
        })
      })

      // Check for game over
      if (currentPiece.position.y <= 0) {
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
      let linesCleared = 0
      const updatedBoard = newBoard.reduce((acc, row) => {
        if (row.every((cell) => cell)) {
          linesCleared++
          acc.unshift(Array(COLS).fill(0))
        } else {
          acc.push(row)
        }
        return acc
      }, [] as any[][])

      // Update score and level
      if (linesCleared > 0) {
        const newLines = lines + linesCleared
        const newScore = score + linesCleared * POINTS_PER_LINE * level
        const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1

        setLines(newLines)
        setScore(newScore)

        // Level up
        if (newLevel > level) {
          setLevel(newLevel)
          setSpeed(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel - 1))
          playSound(levelUpSound)
        } else {
          playSound(clearSound)
        }
      } else {
        playSound(dropSound)
      }

      setBoard(updatedBoard)
      setCurrentPiece(nextPiece)
      setNextPiece(randomTetromino())
    }
  }, [currentPiece, nextPiece, board, checkCollision, paused, gameOver, score, level, lines, playSound])

  // Hard drop
  const hardDrop = useCallback(() => {
    if (paused || gameOver) return

    let newY = currentPiece.position.y
    while (!checkCollision(currentPiece, { ...currentPiece.position, y: newY + 1 })) {
      newY++
    }

    setCurrentPiece({ ...currentPiece, position: { ...currentPiece.position, y: newY } })
    dropPiece()
    playSound(dropSound)
  }, [currentPiece, checkCollision, dropPiece, paused, gameOver, playSound])

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
  }, [gameStarted, movePiece, dropPiece, rotatePiece, hardDrop, showHelp, showHighScores])

  // Game loop
  useEffect(() => {
    if (gameStarted && !paused && !gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }

      gameLoopRef.current = setInterval(() => {
        dropPiece()
      }, speed)
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
    setNextPiece(randomTetromino())
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

  // Render board
  const renderBoard = () => {
    const boardWithPiece = [...board.map((row) => [...row])]

    // Add current piece to board
    if (!gameOver) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              boardWithPiece[boardY][boardX] = currentPiece.color
            }
          }
        })
      })
    }

    return (
      <div className="relative">
        <div
          className="tetris-board border-2 border-gray-400 bg-gray-800"
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
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                style={{
                  backgroundColor: cell || "#111",
                  border: cell ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(0, 0, 0, 0.3)",
                  boxShadow: cell
                    ? "inset 2px 2px 0px rgba(255, 255, 255, 0.4), inset -2px -2px 0px rgba(0, 0, 0, 0.4)"
                    : "none",
                }}
              />
            )),
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

  // Render next piece preview
  const renderNextPiece = () => {
    const shape = nextPiece.shape
    const color = nextPiece.color
    const width = shape[0].length
    const height = shape.length

    return (
      <div
        className="next-piece-preview border-2 border-gray-400 bg-gray-800 p-2"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${height}, ${BLOCK_SIZE}px)`,
          gridTemplateColumns: `repeat(${width}, ${BLOCK_SIZE}px)`,
          gap: "1px",
          justifyContent: "center",
          alignContent: "center",
          padding: "10px",
          backgroundColor: "#000",
          boxShadow: "inset 2px 2px 0px #fff, inset -2px -2px 0px #888",
        }}
      >
        {shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`next-${y}-${x}`}
              style={{
                backgroundColor: cell ? color : "transparent",
                border: cell ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                boxShadow: cell
                  ? "inset 2px 2px 0px rgba(255, 255, 255, 0.4), inset -2px -2px 0px rgba(0, 0, 0, 0.4)"
                  : "none",
              }}
            />
          )),
        )}
      </div>
    )
  }

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
            ✕
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
            ✕
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
            ✕
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
    <div className="menu-bar bg-gray-200 border-b border-gray-400">
      <div className="flex">
        <div className="relative">
          <button
            className={`px-4 py-1 ${showMenu === "game" ? "bg-gray-300" : "hover:bg-gray-300"}`}
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
            className={`px-4 py-1 ${showMenu === "options" ? "bg-gray-300" : "hover:bg-gray-300"}`}
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
            className={`px-4 py-1 ${showMenu === "help" ? "bg-gray-300" : "hover:bg-gray-300"}`}
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
                  alert("Tetris Windows 95 Edition\nCreated for Windows 95 Portfolio")
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
      {/* Title bar */}
      <div className="window-title bg-blue-900 text-white p-1 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/images/games/tetris-icon.png" alt="Tetris" className="w-4 h-4 mr-2" />
          <span>Tetris</span>
        </div>
        <div className="flex">
          <button
            className="w-5 h-5 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black mr-1"
            onClick={() => onReturn()}
          >
            _
          </button>
          <button
            className="w-5 h-5 bg-gray-300 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black"
            onClick={() => onReturn()}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu bar */}
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
