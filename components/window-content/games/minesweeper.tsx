"use client"

import { useState, useEffect, useCallback } from "react"
import { CloseIcon } from "@/components/win95-controls"
import { createSound, type SynthAudio } from "@/lib/sound"
import { messageBox } from "@/components/win95-dialog"
import { loadScores, saveScore, type ScoreEntry } from "@/lib/high-scores"
import { Counter, Flag, Mine, Smiley, type Face } from "./minesweeper-parts"

interface MinesweeperProps {
  onReturn: () => void
}

/** How long each ring of an opening region waits before it is painted. */
const RIPPLE_STEP_MS = 26
/** How long the mine you stepped on flashes alone before the rest appear. */
const MINE_FLASH_MS = 420
/** Windows 95 drew Minesweeper cells at 16x16. */
const CELL_PX = 16

/** The three boards Windows 95 shipped, with their mine counts. */
const BOARDS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type CellState = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  /** Right-click cycles flag -> question mark -> empty, as Windows 95 did. */
  isQuestioned: boolean
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
  /** The mine that was stepped on, so it can flash before the rest resolve. */
  const [detonated, setDetonated] = useState<{ row: number; col: number } | null>(null)
  const [flagsPlaced, setFlagsPlaced] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [bombSound, setBombSound] = useState<SynthAudio | null>(null)
  const [flagSound, setFlagSound] = useState<SynthAudio | null>(null)
  const [winSound, setWinSound] = useState<SynthAudio | null>(null)
  const [clickSound, setClickSound] = useState<SynthAudio | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [showHelp, setShowHelp] = useState(false)
  const [showHighScores, setShowHighScores] = useState(false)
  const [highScores, setHighScores] = useState<HighScore[]>([
    { name: "BOM", time: 45, difficulty: "easy" },
    { name: "MAN", time: 78, difficulty: "medium" },
    { name: "TNT", time: 120, difficulty: "hard" },
  ])

  // Best times are read once on the client. Reading during render would not
  // match what the server sent and would blow up hydration.
  useEffect(() => {
    const stored = loadScores("minesweeper", [])
    if (stored.length > 0) {
      setHighScores(
        stored.map((e) => ({ name: e.name, time: e.value, difficulty: (e.category as Difficulty) ?? "easy" })),
      )
    }
  }, [])
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  /** Open menu, and whether the mouse is held down over the board. */
  const [menu, setMenu] = useState<string | null>(null)
  const [pressing, setPressing] = useState(false)
  /** Marks toggles the question-mark step in the right-click cycle. */
  const [marks, setMarks] = useState(true)

  // Initialize sounds
  useEffect(() => {
    const bomb = createSound("/sounds/explosion.mp3")
    const flag = createSound("/sounds/flag.mp3")
    const win = createSound("/sounds/victory.mp3")
    const click = createSound("/sounds/click.mp3")

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
    const size = BOARDS[level]
    setGridSize({ rows: size.rows, cols: size.cols })
    setMineCount(size.mines)
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
          isQuestioned: false,
          neighborMines: 0,
        })
      }
    }

    setGrid(newGrid)
    setGameStatus("playing")
    setDetonated(null)
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
  /**
   * Reveals a cell, and everything the cell opens up.
   *
   * A blank square used to open its whole region on a single frame, which is
   * the one moment in Minesweeper that deserves to be watched. The region is
   * now walked outwards from the click and revealed a ring at a time, so it
   * spreads instead of appearing. The set of cells revealed is identical
   * either way; only when they are painted changes.
   */
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

      // The mine that was actually stepped on shows first and flashes; the
      // rest of the board resolves behind it a beat later.
      newGrid[row][col].isRevealed = true
      setDetonated({ row, col })
      setGrid([...newGrid])
      setGameStatus("lost")

      const revealRest = () => {
        const finalGrid = newGrid.map((r) => [...r])
        for (let i = 0; i < gridSize.rows; i++) {
          for (let j = 0; j < gridSize.cols; j++) {
            if (finalGrid[i][j].isMine) finalGrid[i][j].isRevealed = true
          }
        }
        setGrid(finalGrid)
      }

      if (reducedMotion()) revealRest()
      else window.setTimeout(revealRest, MINE_FLASH_MS)
      return
    }

    // Reveal the clicked cell
    newGrid[row][col].isRevealed = true

    // Walk outwards from the click, keeping each cell's distance from it, so
    // the reveal can be played back in rings.
    const rings: { r: number; c: number }[][] = []
    if (newGrid[row][col].neighborMines === 0) {
      let frontier = [{ r: row, c: col }]
      const seen = new Set([`${row}-${col}`])

      while (frontier.length > 0) {
        const next: { r: number; c: number }[] = []
        for (const { r, c } of frontier) {
          if (newGrid[r][c].neighborMines !== 0) continue
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue
              const ni = r + di
              const nj = c + dj
              const key = `${ni}-${nj}`
              if (
                ni < 0 ||
                ni >= gridSize.rows ||
                nj < 0 ||
                nj >= gridSize.cols ||
                seen.has(key) ||
                newGrid[ni][nj].isRevealed ||
                newGrid[ni][nj].isFlagged
              ) {
                continue
              }
              seen.add(key)
              next.push({ r: ni, c: nj })
            }
          }
        }
        if (next.length > 0) rings.push(next)
        frontier = next
      }
    }

    if (rings.length === 0 || reducedMotion()) {
      for (const ring of rings) for (const { r, c } of ring) newGrid[r][c].isRevealed = true
      setGrid([...newGrid])
      checkWinCondition(newGrid)
      return
    }

    setGrid([...newGrid])

    // Paint one ring per step. The board is already decided at this point, so
    // a click during the ripple cannot change the outcome.
    rings.forEach((ring, i) => {
      window.setTimeout(
        () => {
          for (const { r, c } of ring) newGrid[r][c].isRevealed = true
          setGrid((prev) => prev.map((r2, ri) => (ring.some((x) => x.r === ri) ? [...r2] : r2)))
          if (i === rings.length - 1) checkWinCondition(newGrid)
        },
        (i + 1) * RIPPLE_STEP_MS,
      )
    })
  }

  // Toggle flag on a cell
  /**
   * Chording. On a revealed number whose neighbouring flags already equal its
   * count, reveal every unflagged neighbour. This is how the game is played at
   * speed, and it will happily detonate a mine if the flags are wrong.
   */
  const chord = (row: number, col: number) => {
    if (gameStatus !== "playing") return
    const cell = grid[row][col]
    if (!cell.isRevealed || cell.neighborMines === 0) return

    const neighbours: [number, number][] = []
    let flagged = 0
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue
        const ni = row + di
        const nj = col + dj
        if (ni < 0 || ni >= gridSize.rows || nj < 0 || nj >= gridSize.cols) continue
        if (grid[ni][nj].isFlagged) flagged++
        else if (!grid[ni][nj].isRevealed) neighbours.push([ni, nj])
      }
    }

    if (flagged !== cell.neighborMines) return
    for (const [ni, nj] of neighbours) revealCell(ni, nj)
  }

  const toggleFlag = (row: number, col: number) => {
    if (gameStatus !== "playing" || grid[row][col].isRevealed) {
      return
    }

    const newGrid = [...grid]

    if (newGrid[row][col].isFlagged) {
      // Flag becomes a question mark, which does not count against the mine
      // counter, and a second right-click clears it. With Marks turned off in
      // the Game menu, the middle step is skipped entirely.
      newGrid[row][col].isFlagged = false
      newGrid[row][col].isQuestioned = marks
      setFlagsPlaced(flagsPlaced - 1)
    } else if (newGrid[row][col].isQuestioned) {
      newGrid[row][col].isQuestioned = false
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

  // F2 for a new game, which is what every Windows 95 game used.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault()
        initializeGrid()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [initializeGrid])

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

    // Written to localStorage so a best time survives the window closing,
    // which is the only thing that makes it a best time.
    const stored: ScoreEntry[] = saveScore(
      "minesweeper",
      { name: newScore.name, value: newScore.time, category: difficulty },
      true,
    )
    setHighScores(
      stored.map((e) => ({ name: e.name, time: e.value, difficulty: (e.category as Difficulty) ?? "easy" })),
    )
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

  /**
   * The Windows 95 number colours, which are fixed and instantly recognisable.
   * Anything else reads as wrong to anyone who played it, so these are exact
   * hex values rather than the nearest Tailwind shade.
   */
  const NUMBER_COLOR: Record<number, string> = {
    1: "#0000ff", // blue
    2: "#008000", // green
    3: "#ff0000", // red
    4: "#000080", // navy
    5: "#800000", // maroon
    6: "#008080", // teal
    7: "#000000", // black
    8: "#808080", // grey
  }

  const getCellColor = (count: number) => NUMBER_COLOR[count] ?? "#000000"

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const face: Face = pressing && gameStatus === "playing" ? "oh" : gameStatus === "won" ? "cool" : gameStatus === "lost" ? "dead" : "smile"

  const menus: Record<string, { label: string; action: () => void; checked?: boolean; sep?: boolean }[]> = {
    Game: [
      { label: "New", action: initializeGrid },
      { label: "Beginner", action: () => setGameDifficulty("easy"), checked: difficulty === "easy", sep: true },
      { label: "Intermediate", action: () => setGameDifficulty("medium"), checked: difficulty === "medium" },
      { label: "Expert", action: () => setGameDifficulty("hard"), checked: difficulty === "hard" },
      { label: "Marks (?)", action: () => setMarks((m) => !m), checked: marks, sep: true },
      { label: "Best Times...", action: () => setShowHighScores(true) },
      { label: "Exit", action: onReturn, sep: true },
    ],
    Help: [
      { label: "How to Play", action: () => setShowHelp(true) },
      {
        label: "About Minesweeper",
        action: () => messageBox({ title: "About Minesweeper", text: "Minesweeper\n\nWindows 95 recreation.", icon: "information" }),
      },
    ],
  }

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-minesweeper
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
                  <div key={item.label}>
                    {item.sep && <div className="my-1 border-t border-t-[#808080] border-b border-b-white" />}
                    <button
                      type="button"
                      className="flex w-full items-center px-2 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                      onClick={() => {
                        item.action()
                        setMenu(null)
                      }}
                    >
                      <span className="mr-2 w-3">{item.checked ? "\u2713" : ""}</span>
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* The board sizes itself; the window does not stretch it. */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-3" onClick={() => setMenu(null)}>
        <div
          className="p-[6px]"
          style={{
            backgroundColor: "#c0c0c0",
            boxShadow: "inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff, inset -3px -3px 0 0 #808080, inset 3px 3px 0 0 #ffffff",
          }}
        >
          {/* Counter panel */}
          <div
            className="mb-[6px] flex items-center justify-between px-[5px] py-[4px]"
            style={{
              boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #808080, inset -2px -2px 0 0 #ffffff",
            }}
          >
            <Counter value={mineCount - flagsPlaced} label="mines" />
            <button
              type="button"
              data-smiley
              aria-label="New game"
              onClick={initializeGrid}
              className="flex h-[26px] w-[26px] items-center justify-center bg-[#c0c0c0]"
              style={{
                boxShadow: "inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff, inset -2px -2px 0 0 #808080, inset 2px 2px 0 0 #dfdfdf",
              }}
            >
              <Smiley face={face} />
            </button>
            <Counter value={timeElapsed} label="time" />
          </div>

          {/* Board */}
          <div
            data-board
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize.cols}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${gridSize.rows}, ${CELL_PX}px)`,
              boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #808080, inset -2px -2px 0 0 #ffffff",
              padding: 3,
              backgroundColor: "#c0c0c0",
            }}
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => setPressing(false)}
            onMouseLeave={() => setPressing(false)}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const blown = detonated?.row === rowIndex && detonated?.col === colIndex
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-cell={`${rowIndex}-${colIndex}`}
                    data-detonated={blown ? "" : undefined}
                    className={`flex select-none items-center justify-center ${blown ? "anim-mine-flash" : ""}`}
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      fontFamily: '"MS Sans Serif", sans-serif',
                      fontSize: 13,
                      fontWeight: "bold",
                      lineHeight: 1,
                      cursor: "default",
                      backgroundColor: blown ? "#ff0000" : "#c0c0c0",
                      // Raised until revealed, then a flat cell with a single
                      // grey edge, which is exactly what the original drew.
                      boxShadow: cell.isRevealed
                        ? "inset 1px 1px 0 0 #808080"
                        : "inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff, inset -2px -2px 0 0 #808080, inset 2px 2px 0 0 #ffffff",
                      color: getCellColor(cell.neighborMines),
                    }}
                    onClick={() => revealCell(rowIndex, colIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      toggleFlag(rowIndex, colIndex)
                    }}
                    onMouseDown={(e) => {
                      // Chording: both buttons on a satisfied number clears its
                      // neighbours. buttons is a bitmask, 3 means left and right.
                      if (e.buttons === 3) {
                        e.preventDefault()
                        chord(rowIndex, colIndex)
                      }
                    }}
                  >
                    {cell.isRevealed ? (
                      cell.isMine ? (
                        <Mine size={CELL_PX - 2} />
                      ) : cell.neighborMines > 0 ? (
                        cell.neighborMines
                      ) : null
                    ) : cell.isFlagged ? (
                      <Flag size={CELL_PX - 2} />
                    ) : cell.isQuestioned ? (
                      "?"
                    ) : null}
                  </div>
                )
              }),
            )}
          </div>
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
                <CloseIcon />
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
                <CloseIcon />
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
                <CloseIcon />
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
    </div>
  )
}
