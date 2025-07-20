"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface PongProps {
  onReturn: () => void
}

interface HighScore {
  name: string
  score: number
}

export default function Pong({ onReturn }: PongProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState({ player: 0, computer: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player" | "computer" | null>(null)
  const [paddleSound, setPaddleSound] = useState<HTMLAudioElement | null>(null)
  const [scoreSound, setScoreSound] = useState<HTMLAudioElement | null>(null)
  const [gameOverSound, setGameOverSound] = useState<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores, setHighScores] = useState<HighScore[]>([
    { name: "NEO", score: 5 },
    { name: "ARK", score: 4 },
    { name: "PON", score: 3 },
  ])
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [showGameMenu, setShowGameMenu] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)

  // Game constants
  const PADDLE_HEIGHT = 80
  const PADDLE_WIDTH = 10
  const BALL_SIZE = 10
  const WINNING_SCORE = 5

  // Animation frame reference
  const animationRef = useRef<number>(0)

  // Game state references for animation loop
  const playerPosRef = useRef(0)
  const computerPosRef = useRef(0)
  const ballPosRef = useRef({ x: 0, y: 0 })
  const ballSpeedRef = useRef({ x: 0, y: 0 })
  const pausedRef = useRef(paused)
  const gameOverRef = useRef(gameOver)
  const difficultyRef = useRef(difficulty)

  // Initialize sounds
  useEffect(() => {
    const paddle = new Audio("/sounds/paddle.mp3")
    const score = new Audio("/sounds/score.mp3")
    const gameOver = new Audio("/sounds/gameover.mp3")

    paddle.volume = 0.2
    score.volume = 0.3
    gameOver.volume = 0.3

    setPaddleSound(paddle)
    setScoreSound(score)
    setGameOverSound(gameOver)

    return () => {
      paddle.pause()
      score.pause()
      gameOver.pause()
    }
  }, [])

  // Update refs when state changes
  useEffect(() => {
    pausedRef.current = paused
    gameOverRef.current = gameOver
    difficultyRef.current = difficulty
  }, [paused, gameOver, difficulty])

  // Set difficulty
  const setGameDifficulty = (level: "easy" | "medium" | "hard") => {
    setDifficulty(level)
    if (gameStarted) {
      initGame()
    }
  }

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  // Initialize game
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Reset positions and scores
    playerPosRef.current = (canvas.height - PADDLE_HEIGHT) / 2
    computerPosRef.current = (canvas.height - PADDLE_HEIGHT) / 2

    // Reset ball to center with random direction
    ballPosRef.current = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    }

    // Set initial ball speed
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8 // Random angle between -22.5 and 22.5 degrees
    const direction = Math.random() > 0.5 ? 1 : -1 // Random initial direction
    ballSpeedRef.current = {
      x: Math.cos(angle) * 5 * direction,
      y: Math.sin(angle) * 5,
    }

    setScore({ player: 0, computer: 0 })
    setGameOver(false)
    setWinner(null)
    gameOverRef.current = false
    setPaused(false)
    setShowHelp(false)
    setShowHighScores(false)
    setShowNameInput(false)

    // Start game loop
    if (!gameStarted) {
      setGameStarted(true)
      gameLoop()
    }
  }

  // Save high score
  const saveHighScore = () => {
    if (playerName.trim() === "") return

    const newScore: HighScore = {
      name: playerName.substring(0, 3).toUpperCase(),
      score: score.player,
    }

    const newHighScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score) // Sort by score (higher is better)
      .slice(0, 10) // Keep only top 10

    setHighScores(newHighScores)
    setShowNameInput(false)
    setShowHighScores(true)
  }

  // Game loop
  const gameLoop = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas with a neon grid background
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw neon grid
    ctx.strokeStyle = "rgba(255, 0, 255, 0.2)"
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    if (!pausedRef.current && !gameOverRef.current) {
      // Update ball position
      ballPosRef.current.x += ballSpeedRef.current.x
      ballPosRef.current.y += ballSpeedRef.current.y

      // Ball collision with top and bottom walls
      if (ballPosRef.current.y <= 0 || ballPosRef.current.y >= canvas.height - BALL_SIZE) {
        ballSpeedRef.current.y = -ballSpeedRef.current.y
      }

      // Ball collision with paddles
      // Player paddle
      if (
        ballPosRef.current.x <= PADDLE_WIDTH &&
        ballPosRef.current.y + BALL_SIZE >= playerPosRef.current &&
        ballPosRef.current.y <= playerPosRef.current + PADDLE_HEIGHT
      ) {
        // Play paddle sound
        if (paddleSound && soundEnabled) {
          paddleSound.currentTime = 0
          paddleSound.play().catch((err) => console.log("Audio playback failed:", err))
        }

        // Calculate angle based on where ball hits paddle
        const hitPos = (ballPosRef.current.y - playerPosRef.current) / PADDLE_HEIGHT
        const angle = ((hitPos - 0.5) * Math.PI) / 3 // -30 to 30 degrees

        ballSpeedRef.current.x = Math.cos(angle) * 6
        ballSpeedRef.current.y = Math.sin(angle) * 6
      }

      // Computer paddle
      if (
        ballPosRef.current.x >= canvas.width - PADDLE_WIDTH - BALL_SIZE &&
        ballPosRef.current.y + BALL_SIZE >= computerPosRef.current &&
        ballPosRef.current.y <= computerPosRef.current + PADDLE_HEIGHT
      ) {
        // Play paddle sound
        if (paddleSound && soundEnabled) {
          paddleSound.currentTime = 0
          paddleSound.play().catch((err) => console.log("Audio playback failed:", err))
        }

        // Calculate angle based on where ball hits paddle
        const hitPos = (ballPosRef.current.y - computerPosRef.current) / PADDLE_HEIGHT
        const angle = ((hitPos - 0.5) * Math.PI) / 3 // -30 to 30 degrees

        ballSpeedRef.current.x = -Math.cos(angle) * 6
        ballSpeedRef.current.y = Math.sin(angle) * 6
      }

      // Ball out of bounds - scoring
      if (ballPosRef.current.x < 0) {
        // Play score sound
        if (scoreSound && soundEnabled) {
          scoreSound.currentTime = 0
          scoreSound.play().catch((err) => console.log("Audio playback failed:", err))
        }

        // Computer scores
        setScore((prev) => {
          const newScore = { ...prev, computer: prev.computer + 1 }

          // Check for game over
          if (newScore.computer >= WINNING_SCORE) {
            if (gameOverSound && soundEnabled) {
              gameOverSound.currentTime = 0
              gameOverSound.play().catch((err) => console.log("Audio playback failed:", err))
            }

            setGameOver(true)
            gameOverRef.current = true
            setWinner("computer")
          }

          return newScore
        })

        // Reset ball
        ballPosRef.current = {
          x: canvas.width / 2,
          y: canvas.height / 2,
        }

        ballSpeedRef.current = {
          x: -5,
          y: Math.random() * 4 - 2,
        }
      } else if (ballPosRef.current.x > canvas.width) {
        // Play score sound
        if (scoreSound && soundEnabled) {
          scoreSound.currentTime = 0
          scoreSound.play().catch((err) => console.log("Audio playback failed:", err))
        }

        // Player scores
        setScore((prev) => {
          const newScore = { ...prev, player: prev.player + 1 }

          // Check for game over
          if (newScore.player >= WINNING_SCORE) {
            if (gameOverSound && soundEnabled) {
              gameOverSound.currentTime = 0
              gameOverSound.play().catch((err) => console.log("Audio playback failed:", err))
            }

            setGameOver(true)
            gameOverRef.current = true
            setWinner("player")
            setShowNameInput(true)
          }

          return newScore
        })

        // Reset ball
        ballPosRef.current = {
          x: canvas.width / 2,
          y: canvas.height / 2,
        }

        ballSpeedRef.current = {
          x: 5,
          y: Math.random() * 4 - 2,
        }
      }

      // Computer AI - follow the ball with difficulty-based speed
      const computerCenter = computerPosRef.current + PADDLE_HEIGHT / 2
      const ballCenter = ballPosRef.current.y + BALL_SIZE / 2

      // Set computer speed based on difficulty
      let computerSpeed = 4 // Default medium

      switch (difficultyRef.current) {
        case "easy":
          computerSpeed = 3
          break
        case "medium":
          computerSpeed = 4
          break
        case "hard":
          computerSpeed = 5.5
          break
      }

      if (computerCenter < ballCenter - 10) {
        computerPosRef.current += computerSpeed
      } else if (computerCenter > ballCenter + 10) {
        computerPosRef.current -= computerSpeed
      }

      // Keep computer paddle in bounds
      if (computerPosRef.current < 0) {
        computerPosRef.current = 0
      } else if (computerPosRef.current > canvas.height - PADDLE_HEIGHT) {
        computerPosRef.current = canvas.height - PADDLE_HEIGHT
      }
    }

    // Draw center line
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.strokeStyle = "rgba(255, 0, 255, 0.5)"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.setLineDash([])

    // Draw paddles with neon glow
    ctx.shadowBlur = 15
    ctx.shadowColor = "#ff00ff"
    ctx.fillStyle = "#ff00ff"

    // Player paddle
    ctx.fillRect(0, playerPosRef.current, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Computer paddle
    ctx.fillRect(canvas.width - PADDLE_WIDTH, computerPosRef.current, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Draw ball with neon glow
    ctx.shadowBlur = 20
    ctx.shadowColor = "#00ffff"
    ctx.fillStyle = "#00ffff"
    ctx.fillRect(ballPosRef.current.x, ballPosRef.current.y, BALL_SIZE, BALL_SIZE)

    // Reset shadow
    ctx.shadowBlur = 0

    // Draw score
    ctx.font = "24px 'Press Start 2P'"
    ctx.textAlign = "center"
    ctx.fillStyle = "#ff00ff"
    ctx.fillText(score.player.toString(), canvas.width / 4, 30)
    ctx.fillStyle = "#00ffff"
    ctx.fillText(score.computer.toString(), (canvas.width / 4) * 3, 30)

    // Draw game over message
    if (gameOverRef.current) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#ff00ff"
      ctx.font = "24px 'Press Start 2P'"
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30)

      if (winner === "player") {
        ctx.fillStyle = "#00ffff"
        ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2)
      } else {
        ctx.fillStyle = "#ff0000"
        ctx.fillText("COMPUTER WINS!", canvas.width / 2, canvas.height / 2)
      }

      ctx.font = "16px 'Press Start 2P'"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("PRESS NEW GAME", canvas.width / 2, canvas.height / 2 + 30)
    }

    // Draw pause message
    if (pausedRef.current && !gameOverRef.current) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00ffff"
      ctx.font = "24px 'Press Start 2P'"
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(gameLoop)
  }

  // Handle mouse movement for player paddle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || pausedRef.current || gameOverRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseY = e.clientY - rect.top

    // Update player paddle position
    playerPosRef.current = mouseY - PADDLE_HEIGHT / 2

    // Keep paddle in bounds
    if (playerPosRef.current < 0) {
      playerPosRef.current = 0
    } else if (playerPosRef.current > canvas.height - PADDLE_HEIGHT) {
      playerPosRef.current = canvas.height - PADDLE_HEIGHT
    }
  }

  // Toggle pause
  const togglePause = () => {
    setPaused(!paused)
  }

  // Start/stop game loop on mount/unmount
  useEffect(() => {
    // Set canvas size
    if (canvasRef.current) {
      canvasRef.current.width = 600
      canvasRef.current.height = 400
    }

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        togglePause()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Game menu options
  const gameMenuOptions = [
    {
      label: "NEW GAME",
      action: initGame,
    },
    {
      label: "HIGH SCORES",
      action: () => setShowHighScores(true),
    },
    {
      label: "EXIT",
      action: onReturn,
    },
  ]

  // Options menu options
  const optionsMenuOptions = [
    {
      label: `SOUND: ${soundEnabled ? "ON" : "OFF"}`,
      action: toggleSound,
    },
    {
      label: "EASY",
      action: () => setGameDifficulty("easy"),
      disabled: difficulty === "easy" && gameStarted && !gameOver,
    },
    {
      label: "MEDIUM",
      action: () => setGameDifficulty("medium"),
      disabled: difficulty === "medium" && gameStarted && !gameOver,
    },
    {
      label: "HARD",
      action: () => setGameDifficulty("hard"),
      disabled: difficulty === "hard" && gameStarted && !gameOver,
    },
  ]

  // Help menu options
  const helpMenuOptions = [
    {
      label: "HOW TO PLAY",
      action: () => setShowHelp(true),
    },
  ]

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0] overflow-auto">
      {/* Windows 95 Title Bar */}
      <div className="w-full bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/images/games/pong-logo.png" alt="Pong" className="w-5 h-5 mr-2" />
          <span className="font-bold">Pong</span>
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
            onClick={() => setShowGameMenu(!showGameMenu)}
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
                  disabled={option.disabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
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
                  disabled={option.disabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowHelpMenu(!showHelpMenu)}
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
                  disabled={option.disabled}
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
            onClick={togglePause}
            disabled={!gameStarted || gameOver}
            className={`px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white ${
              !gameStarted || gameOver ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm mr-2">Difficulty:</span>
            <select
              value={difficulty}
              onChange={(e) => setGameDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="px-2 py-1 bg-white border border-[#5a5a5a] text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex items-center">
            <span className="text-sm mr-2">Sound:</span>
            <button
              onClick={toggleSound}
              className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
            >
              {soundEnabled ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex justify-center items-center p-4 bg-[#808080]">
        <div className="relative">
          {/* Score Display */}
          <div className="absolute top-[-40px] left-0 right-0 flex justify-between px-4">
            <div className="bg-[#c0c0c0] px-4 py-1 border border-[#5a5a5a] border-r-white border-b-white">
              <span className="text-sm font-bold">Player: {score.player}</span>
            </div>
            <div className="bg-[#c0c0c0] px-4 py-1 border border-[#5a5a5a] border-r-white border-b-white">
              <span className="text-sm font-bold">Computer: {score.computer}</span>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="border-4 border-[#5a5a5a] border-r-white border-b-white">
            <canvas ref={canvasRef} className="bg-black" onMouseMove={handleMouseMove} />
          </div>

          {/* Game Status */}
          <div className="absolute bottom-[-40px] left-0 right-0 flex justify-center">
            <div className="bg-[#c0c0c0] px-4 py-1 border border-[#5a5a5a] border-r-white border-b-white">
              <span className="text-sm">
                {!gameStarted
                  ? "Click New Game to start"
                  : gameOver
                    ? winner === "player"
                      ? "You Win!"
                      : "Computer Wins!"
                    : paused
                      ? "Game Paused"
                      : "Game in Progress"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full bg-[#c0c0c0] p-4 border-t border-white">
        <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white">
          <h3 className="text-sm font-bold mb-2">How to Play:</h3>
          <ul className="text-xs space-y-1 list-disc pl-5">
            <li>Move your mouse up and down to control your paddle (left side)</li>
            <li>Try to hit the ball past the computer's paddle</li>
            <li>First to {WINNING_SCORE} points wins!</li>
            <li>Press P to pause the game</li>
          </ul>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReturn}
            className="px-4 py-2 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[400px]">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Pong - Help</span>
              <button
                onClick={() => setShowHelp(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-bold mb-3">How to Play Pong</h2>
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Move your mouse up and down to control your paddle on the left side of the screen.</li>
                  <li>The ball will bounce off paddles and the top and bottom walls.</li>
                  <li>Score points when your opponent misses the ball.</li>
                  <li>First player to reach {WINNING_SCORE} points wins the game.</li>
                  <li>You can pause the game at any time by pressing the P key or clicking the Pause button.</li>
                  <li>Adjust difficulty in the Options menu to change the computer's paddle speed.</li>
                </ol>
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
              <span className="font-bold">Pong - High Scores</span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((score, index) => (
                      <tr key={index} className="border-b border-[#efefef] last:border-b-0">
                        <td className="py-1 px-2">{index + 1}</td>
                        <td className="py-1 px-2">{score.name}</td>
                        <td className="py-1 px-2 text-right">{score.score}</td>
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
      {showNameInput && gameOver && winner === "player" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[400px]">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Pong - New High Score!</span>
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
                <p className="text-center mb-4">You scored {score.player} points!</p>
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
                  onClick={() => {
                    setShowNameInput(false)
                    initGame()
                  }}
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
