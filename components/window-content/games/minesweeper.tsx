"use client"

import { useState, useEffect, useCallback } from "react"

interface MinesweeperProps {
  onReturn: () => void
}

type CellState = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

type Difficulty = "easy" | "medium" | "hard"

interface HighScore {
  name: string
  time: number
  difficulty: Difficulty
}

export default function Minesweeper({ onReturn }: MinesweeperProps) {
  const [gridSize, setGridSize] = useState({ rows: 9, cols: 9 })
  const [mineCount, setMineCount] = useState(10)
  const [grid, setGrid] = useState<CellState[][]>([])
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing")
  const [flagsPlaced, setFlagsPlaced] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [bombSound, setBombSound] = useState<HTMLAudioElement | null>(null)
  const [flagSound, setFlagSound] = useState<HTMLAudioElement | null>(null)
  const [winSound, setWinSound] = useState<HTMLAudioElement | null>(null)
  const [clickSound, setClickSound] = useState<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores, setHighScores] = useState<HighScore[]>([
    { name: "BOM", time: 45, difficulty: "easy" },
    { name: "MAN", time: 78, difficulty: "medium" },
    { name: "TNT", time: 120, difficulty: "hard" },
  ])
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Initialize sounds
  useEffect(() => {
    const bomb = new Audio("/sounds/explosion.mp3")
    const flag = new Audio("/sounds/flag.mp3")
    const win = new Audio("/sounds/victory.mp3")
    const click = new Audio("/sounds/click.mp3")

    bomb.volume = 0.3
    flag.volume = 0.2
    win.volume = 0.3
    click.volume = 0.1

    setBombSound(bomb)
    setFlagSound(flag)
    setWinSound(win)
    setClickSound(click)

    return () => {
      bomb.pause()
      flag.pause()
      win.pause()
      click.pause()
    }
  }, [])

  // Set difficulty
  const setGameDifficulty = (level: Difficulty) => {
    if (gameStatus !== "playing" || firstClick) {
      switch (level) {
        case "easy":
          setGridSize({ rows: 9, cols: 9 })
          setMineCount(10)
          break
        case "medium":
          setGridSize({ rows: 16, cols: 16 })
          setMineCount(40)
          break
        case "hard":
          setGridSize({ rows: 16, cols: 30 })
          setMineCount(99)
          break
      }
      setDifficulty(level)
      initializeGrid()
    } else {
      setShowConfirmation(true)
    }
  }

  const confirmDifficultyChange = (level: Difficulty) => {
    setShowConfirmation(false)
    switch (level) {
      case "easy":
        setGridSize({ rows: 9, cols: 9 })
        setMineCount(10)
        break
      case "medium":
        setGridSize({ rows: 16, cols: 16 })
        setMineCount(40)
        break
      case "hard":
        setGridSize({ rows: 16, cols: 30 })
        setMineCount(99)
        break
    }
    setDifficulty(level)
    initializeGrid()
  }

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  // Initialize the game grid
  const initializeGrid = useCallback(() => {
    const newGrid: CellState[][] = []

    // Create empty grid
    for (let i = 0; i < gridSize.rows; i++) {
      newGrid.push([])
      for (let j = 0; j < gridSize.cols; j++) {
        newGrid[i].push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        })
      }
    }

    setGrid(newGrid)
    setGameStatus("playing")
    setFlagsPlaced(0)
    setTimeElapsed(0)
    setFirstClick(true)
    setShowHelp(false)
    setShowHighScores(false)
    setShowNameInput(false)
    setShowSettings(false)
  }, [gridSize])

  // Place mines after first click
  const placeMines = (firstRow: number, firstCol: number) => {
    const newGrid = [...grid]
    let minesPlaced = 0

    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * gridSize.rows)
      const col = Math.floor(Math.random() * gridSize.cols)

      // Don't place mine on first click or where a mine already exists
      if ((row !== firstRow || col !== firstCol) && !newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true
        minesPlaced++
      }
    }

    // Calculate neighbor mines
    for (let i = 0; i < gridSize.rows; i++) {
      for (let j = 0; j < gridSize.cols; j++) {
        if (!newGrid[i][j].isMine) {
          let count = 0
          // Check all 8 neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue

              const ni = i + di
              const nj = j + dj

              if (ni >= 0 && ni < gridSize.rows && nj >= 0 && nj < gridSize.cols && newGrid[ni][nj].isMine) {
                count++
              }
            }
          }
          newGrid[i][j].neighborMines = count
        }
      }
    }

    setGrid(newGrid)
    setFirstClick(false)
  }

  // Reveal a cell
  const revealCell = (row: number, col: number) => {
    if (gameStatus !== "playing" || grid[row][col].isRevealed || grid[row][col].isFlagged) {
      return
    }

    // Play click sound
    if (clickSound && soundEnabled) {
      clickSound.currentTime = 0
      clickSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    // Handle first click
    if (firstClick) {
      placeMines(row, col)
    }

    const newGrid = [...grid]

    // If clicked on a mine, game over
    if (newGrid[row][col].isMine) {
      // Play explosion sound
      if (bombSound && soundEnabled) {
        bombSound.currentTime = 0
        bombSound.play().catch((err) => console.log("Audio playback failed:", err))
      }

      // Reveal all mines
      for (let i = 0; i < gridSize.rows; i++) {
        for (let j = 0; j < gridSize.cols; j++) {
          if (newGrid[i][j].isMine) {
            newGrid[i][j].isRevealed = true
          }
        }
      }
      setGrid(newGrid)
      setGameStatus("lost")
      return
    }

    // Reveal the clicked cell
    newGrid[row][col].isRevealed = true

    // If cell has no adjacent mines, reveal neighbors recursively
    if (newGrid[row][col].neighborMines === 0) {
      const revealEmptyCells = (r: number, c: number) => {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue

            const ni = r + di
            const nj = c + dj

            if (
              ni >= 0 &&
              ni < gridSize.rows &&
              nj >= 0 &&
              nj < gridSize.cols &&
              !newGrid[ni][nj].isRevealed &&
              !newGrid[ni][nj].isFlagged
            ) {
              newGrid[ni][nj].isRevealed = true
              if (newGrid[ni][nj].neighborMines === 0) {
                revealEmptyCells(ni, nj)
              }
            }
          }
        }
      }

      revealEmptyCells(row, col)
    }

    setGrid(newGrid)

    // Check if player has won
    checkWinCondition(newGrid)
  }

  // Toggle flag on a cell
  const toggleFlag = (row: number, col: number) => {
    if (gameStatus !== "playing" || grid[row][col].isRevealed) {
      return
    }

    const newGrid = [...grid]

    if (newGrid[row][col].isFlagged) {
      newGrid[row][col].isFlagged = false
      setFlagsPlaced(flagsPlaced - 1)
    } else if (flagsPlaced < mineCount) {
      // Play flag sound
      if (flagSound && soundEnabled) {
        flagSound.currentTime = 0
        flagSound.play().catch((err) => console.log("Audio playback failed:", err))
      }

      newGrid[row][col].isFlagged = true
      setFlagsPlaced(flagsPlaced + 1)
    }

    setGrid(newGrid)

    // Check if player has won
    checkWinCondition(newGrid)
  }

  // Check if the player has won
  const checkWinCondition = (currentGrid: CellState[][]) => {
    let allNonMinesRevealed = true

    for (let i = 0; i < gridSize.rows; i++) {
      for (let j = 0; j < gridSize.cols; j++) {
        if (!currentGrid[i][j].isMine && !currentGrid[i][j].isRevealed) {
          allNonMinesRevealed = false
          break
        }
      }
      if (!allNonMinesRevealed) break
    }

    if (allNonMinesRevealed) {
      // Play win sound
      if (winSound && soundEnabled) {
        winSound.currentTime = 0
        winSound.play().catch((err) => console.log("Audio playback failed:", err))
      }

      setGameStatus("won")
      setShowNameInput(true)
    }
  }

  // Save high score
  const saveHighScore = () => {
    if (playerName.trim() === "") return

    const newScore: HighScore = {
      name: playerName.substring(0, 3).toUpperCase(),
      time: timeElapsed,
      difficulty,
    }

    const newHighScores = [...highScores, newScore]
      .sort((a, b) => {
        // First sort by difficulty
        if (a.difficulty !== b.difficulty) {
          const difficultyOrder = { easy: 0, medium: 1, hard: 2 }
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]
        }
        // Then by time (lower is better)
        return a.time - b.time
      })
      .slice(0, 10) // Keep only top 10

    setHighScores(newHighScores)
    setShowNameInput(false)
    setShowHighScores(true)
  }

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameStatus === "playing" && !firstClick) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameStatus, firstClick])

  // Initialize grid on mount and when grid size changes
  useEffect(() => {
    initializeGrid()
  }, [initializeGrid])

  // Get cell color based on neighbor count
  const getCellColor = (count: number) => {
    switch (count) {
      case 1:
        return "text-blue-600"
      case 2:
        return "text-green-600"
      case 3:
        return "text-red-600"
      case 4:
        return "text-purple-600"
      case 5:
        return "text-orange-600"
      case 6:
        return "text-teal-600"
      case 7:
        return "text-pink-600"
      case 8:
        return "text-yellow-600"
      default:
        return ""
    }
  }

  // Game menu options
  const gameMenuOptions = [
    {
      label: "NEW GAME",
      action: initializeGrid,
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
      label: "SETTINGS",
      action: () => setShowSettings(true),
    },
  ]

  // Help menu options
  const helpMenuOptions = [
    {
      label: "HOW TO PLAY",
      action: () => setShowHelp(true),
    },
  ]

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 bg-[#c0c0c0] min-h-full w-full overflow-auto">
      {/* Game Header */}
      <div className="w-full max-w-4xl mx-auto mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setGameDifficulty("easy")}
              className={`win95-button ${difficulty === "easy" ? "border-inset bg-gray-300" : ""}`}
            >
              Easy
            </button>
            <button
              onClick={() => setGameDifficulty("medium")}
              className={`win95-button ${difficulty === "medium" ? "border-inset bg-gray-300" : ""}`}
            >
              Medium
            </button>
            <button
              onClick={() => setGameDifficulty("hard")}
              className={`win95-button ${difficulty === "hard" ? "border-inset bg-gray-300" : ""}`}
            >
              Hard
            </button>
          </div>
          <div className="flex space-x-2">
            <button onClick={initializeGrid} className="win95-button">
              New Game
            </button>
            <button onClick={onReturn} className="win95-button">
              Exit
            </button>
          </div>
        </div>

        {/* Game Info Panel */}
        <div className="flex justify-between items-center mb-4 p-2 border-2 border-t-gray-400 border-l-gray-400 border-r-white border-b-white bg-gray-200">
          <div className="flex items-center justify-center w-20 h-10 bg-black text-red-600 font-bold border-2 border-inset p-1">
            {mineCount - flagsPlaced}
          </div>
          <button
            onClick={initializeGrid}
            className="w-10 h-10 flex items-center justify-center border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 bg-gray-200 hover:bg-gray-300 active:border-inset"
          >
            {gameStatus === "lost" ? "😵" : gameStatus === "won" ? "😎" : "🙂"}
          </button>
          <div className="flex items-center justify-center w-20 h-10 bg-black text-red-600 font-bold border-2 border-inset p-1">
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="w-full max-w-4xl mx-auto">
        <div
          className="border-4 border-t-gray-400 border-l-gray-400 border-r-white border-b-white p-2 bg-gray-200 grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-8 h-8 flex items-center justify-center font-bold cursor-pointer select-none
                  ${
                    cell.isRevealed
                      ? "bg-gray-300 border border-t-gray-400 border-l-gray-400 border-r-gray-200 border-b-gray-200"
                      : "bg-gray-200 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 hover:bg-gray-300"
                  }`}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  toggleFlag(rowIndex, colIndex)
                }}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    <span className="text-black text-xl">💣</span>
                  ) : (
                    <span className={`${getCellColor(cell.neighborMines)} font-bold`}>
                      {cell.neighborMines > 0 ? cell.neighborMines : ""}
                    </span>
                  )
                ) : cell.isFlagged ? (
                  <span className="text-red-600">🚩</span>
                ) : (
                  ""
                )}
              </div>
            )),
          )}
        </div>
      </div>

      {/* Game Status */}
      {gameStatus === "won" && !showNameInput && (
        <div className="mt-4 p-4 bg-gray-200 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 text-center">
          <p className="font-bold text-green-600 text-xl">You Win!</p>
          <p className="text-black mt-2">All mines found in {formatTime(timeElapsed)}</p>
        </div>
      )}

      {gameStatus === "lost" && (
        <div className="mt-4 p-4 bg-gray-200 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 text-center">
          <p className="font-bold text-red-600 text-xl">Game Over</p>
          <p className="text-black mt-2">Better luck next time!</p>
          <button onClick={initializeGrid} className="win95-button mt-2">
            Try Again
          </button>
        </div>
      )}

      {/* Instructions and Exit */}
      <div className="mt-4 flex flex-col items-center">
        <p className="text-sm text-gray-700 mb-2">Left-click: Reveal | Right-click: Flag</p>
        <button onClick={onReturn} className="win95-button mt-2 px-6">
          Return to Games
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#5a5a5a] border-r-white border-b-white w-[500px] max-h-[80vh] overflow-auto">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="font-bold">Minesweeper - How to Play</span>
              <button
                onClick={() => setShowHelp(false)}
                className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-3 border border-[#5a5a5a] border-r-white border-b-white mb-4">
                <h2 className="text-lg font-bold mb-3">How to Play Minesweeper</h2>

                <h3 className="font-bold mt-4 mb-2">Objective:</h3>
                <p className="mb-3">
                  The goal is to clear the minefield without detonating any mines. You win when all safe squares are
                  revealed.
                </p>

                <h3 className="font-bold mt-4 mb-2">Game Setup:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>The game board contains hidden mines scattered throughout the grid.</li>
                  <li>The number of mines depends on the difficulty level you choose.</li>
                  <li>Easy: 9×9 grid with 10 mines</li>
                  <li>Medium: 16×16 grid with 40 mines</li>
                  <li>Hard: 16×30 grid with 99 mines</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">How to Play:</h3>
                <ol className="list-decimal pl-5 space-y-1 mb-3">
                  <li>Left-click on a square to reveal what's underneath.</li>
                  <li>If you reveal a mine, the game is over.</li>
                  <li>
                    If you reveal a number, it indicates how many mines are adjacent to that square (including
                    diagonals).
                  </li>
                  <li>
                    If you reveal a blank square (no number), all adjacent squares will automatically be revealed.
                  </li>
                  <li>Right-click on a square to place a flag where you think a mine is located.</li>
                  <li>Right-click again on a flagged square to remove the flag.</li>
                </ol>

                <h3 className="font-bold mt-4 mb-2">Game Elements:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>
                    <strong>Numbers (1-8):</strong> Indicate how many mines are in the adjacent 8 squares.
                  </li>
                  <li>
                    <strong>Flags (🚩):</strong> Mark squares you believe contain mines.
                  </li>
                  <li>
                    <strong>Mine Counter:</strong> Shows how many mines remain unflagged.
                  </li>
                  <li>
                    <strong>Timer:</strong> Tracks how long you've been playing.
                  </li>
                  <li>
                    <strong>Smiley Face:</strong> Shows game status and can be clicked to start a new game.
                  </li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">Strategy Tips:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Start by clicking in the middle of the board for the best chance of revealing a large area.</li>
                  <li>Use the numbers to deduce where mines must be located.</li>
                  <li>
                    If a square shows "1" and you've already flagged a mine adjacent to it, all other adjacent squares
                    must be safe.
                  </li>
                  <li>Look for patterns and use process of elimination to identify safe squares.</li>
                  <li>Don't guess unless absolutely necessary!</li>
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
          <div className="bg-gray-200 p-4 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 max-w-md">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-400 pb-2">
              <h2 className="text-xl font-bold">High Scores</h2>
              <button
                onClick={() => setShowHighScores(false)}
                className="w-6 h-6 flex items-center justify-center border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 bg-gray-200 hover:bg-gray-300 active:border-inset"
              >
                ✕
              </button>
            </div>
            <div className="text-black text-sm">
              <div className="grid grid-cols-3 gap-4 mb-2 font-bold border-b border-gray-400 pb-1">
                <div>Name</div>
                <div>Time</div>
                <div>Level</div>
              </div>
              {highScores.slice(0, 5).map((score, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-1 border-b border-gray-200 py-1">
                  <div>{score.name}</div>
                  <div>{formatTime(score.time)}</div>
                  <div>{score.difficulty.charAt(0).toUpperCase() + score.difficulty.slice(1)}</div>
                </div>
              ))}
            </div>
            <button className="mt-4 win95-button" onClick={() => setShowHighScores(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 p-4 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 max-w-md">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-400 pb-2">
              <h2 className="text-xl font-bold">New High Score!</h2>
              <button
                onClick={() => setShowNameInput(false)}
                className="w-6 h-6 flex items-center justify-center border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 bg-gray-200 hover:bg-gray-300 active:border-inset"
              >
                ✕
              </button>
            </div>
            <p className="text-black text-sm mb-4">Enter your name (3 characters):</p>
            <input
              type="text"
              maxLength={3}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              className="bg-white text-black border-2 border-inset p-2 w-full text-center text-xl mb-4"
              autoFocus
            />
            <div className="flex justify-between">
              <button className="win95-button" onClick={() => setShowNameInput(false)}>
                Cancel
              </button>
              <button className="win95-button" onClick={saveHighScore}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 p-4 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 max-w-md">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-400 pb-2">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-6 h-6 flex items-center justify-center border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 bg-gray-200 hover:bg-gray-300 active:border-inset"
              >
                ✕
              </button>
            </div>
            <div className="text-black text-sm space-y-4">
              <div className="flex items-center justify-between">
                <span>Sound Effects:</span>
                <button onClick={toggleSound} className="win95-button">
                  {soundEnabled ? "On" : "Off"}
                </button>
              </div>
              <div className="border-t border-gray-400 pt-4">
                <p className="font-bold mb-2">Difficulty:</p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setGameDifficulty("easy")}
                    className={`win95-button text-left ${difficulty === "easy" ? "border-inset bg-gray-300" : ""}`}
                  >
                    Easy (9x9, 10 mines)
                  </button>
                  <button
                    onClick={() => setGameDifficulty("medium")}
                    className={`win95-button text-left ${difficulty === "medium" ? "border-inset bg-gray-300" : ""}`}
                  >
                    Medium (16x16, 40 mines)
                  </button>
                  <button
                    onClick={() => setGameDifficulty("hard")}
                    className={`win95-button text-left ${difficulty === "hard" ? "border-inset bg-gray-300" : ""}`}
                  >
                    Hard (16x30, 99 mines)
                  </button>
                </div>
              </div>
            </div>
            <button className="mt-4 win95-button" onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 p-4 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 max-w-md">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-400 pb-2">
              <h2 className="text-xl font-bold">Change Difficulty?</h2>
              <button
                onClick={() => setShowConfirmation(false)}
                className="w-6 h-6 flex items-center justify-center border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 bg-gray-200 hover:bg-gray-300 active:border-inset"
              >
                ✕
              </button>
            </div>
            <p className="text-black text-sm mb-4">
              Changing difficulty will start a new game. Current progress will be lost.
            </p>
            <div className="flex justify-between">
              <button className="win95-button" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button className="win95-button" onClick={() => confirmDifficultyChange(difficulty)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
