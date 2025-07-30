"use client"

import { useState, useEffect } from "react"
import Minesweeper from "./games/minesweeper"
import Pong from "./games/pong"
import Solitaire from "./games/solitaire"
import Chess from "./games/chess"
import Tetris from "./games/tetris"

type GameType = "launcher" | "minesweeper" | "solitaire" | "pong" | "chess" | "tetris"

export default function Games() {
  const [currentGame, setCurrentGame] = useState<GameType>("launcher")
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [selectSound, setSelectSound] = useState<HTMLAudioElement | null>(null)
  const [hoverSound, setHoverSound] = useState<HTMLAudioElement | null>(null)
  const [bgMusic, setBgMusic] = useState<HTMLAudioElement | null>(null)
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "arcade" | "board" | "puzzle">("all")

  // Initialize sounds
  useEffect(() => {
    const select = new Audio("/sounds/select.mp3")
    const hover = new Audio("/sounds/hover.mp3")
    const music = new Audio("/sounds/arcade-music.mp3")

    select.volume = 0.3
    hover.volume = 0.1
    music.volume = 0.2
    music.loop = true

    setSelectSound(select)
    setHoverSound(hover)
    setBgMusic(music)

    return () => {
      select.pause()
      hover.pause()
      music.pause()
    }
  }, [])

  // Toggle background music
  const toggleMusic = () => {
    if (!bgMusic) return

    if (audioEnabled) {
      bgMusic.pause()
    } else {
      bgMusic.play().catch((err) => console.log("Audio playback failed:", err))
    }

    setAudioEnabled(!audioEnabled)
  }

  // Play hover sound
  const playHoverSound = () => {
    if (hoverSound && audioEnabled) {
      hoverSound.currentTime = 0
      hoverSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  // Play select sound
  const playSelectSound = () => {
    if (selectSound && audioEnabled) {
      selectSound.currentTime = 0
      selectSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  // Return to the game launcher
  const returnToLauncher = () => {
    setCurrentGame("launcher")
    playSelectSound()
  }

  // Select a game
  const selectGame = (game: GameType) => {
    setCurrentGame(game)
    playSelectSound()
  }

  // Game data with categories
  const games = [
    {
      id: "chess",
      name: "Chess",
      description: "The classic strategy board game",
      image: "/images/games/chess-logo-king.png",
      category: "board",
      featured: true,
    },
    {
      id: "solitaire",
      name: "Solitaire",
      description: "The timeless card game",
      image: "/images/games/solitaire-logo.png",
      category: "card",
      featured: false,
    },
    {
      id: "tetris",
      name: "Tetris",
      description: "The addictive block-stacking game",
      image: "/images/games/tetris-icon.png",
      category: "puzzle",
      featured: true,
    },
    {
      id: "minesweeper",
      name: "Minesweeper",
      description: "Clear the minefield without exploding",
      image: "/images/games/minesweeper-logo.png",
      category: "puzzle",
      featured: false,
    },
    {
      id: "pong",
      name: "Pong",
      description: "The original arcade classic",
      image: "/images/games/pong-logo.png",
      category: "arcade",
      featured: false,
    },
  ]

  // Filter games by category
  const filteredGames = activeTab === "all" ? games : games.filter((game) => game.category === activeTab)

  // Render the selected game or the launcher
  const renderGame = () => {
    switch (currentGame) {
      case "minesweeper":
        return <Minesweeper onReturn={returnToLauncher} />
      case "solitaire":
        return <Solitaire onReturn={returnToLauncher} />
      case "pong":
        return <Pong onReturn={returnToLauncher} />
      case "chess":
        return <Chess onReturn={returnToLauncher} />
      case "tetris":
        return <Tetris onReturn={returnToLauncher} />
      default:
        return renderLauncher()
    }
  }

  // Render the game launcher interface
  const renderLauncher = () => (
    <div className="h-full w-full flex flex-col bg-[#c0c0c0] overflow-auto">
      {/* Title bar */}
      <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/images/desktop-icons/games.png" alt="Games" className="w-4 h-4 mr-2" />
          <span className="font-bold">Games</span>
        </div>
      </div>

      {/* Menu bar */}
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-1 flex space-x-4 text-sm">
        <button className="hover:bg-[#000080] hover:text-white px-2" onMouseEnter={playHoverSound}>
          File
        </button>
        <button className="hover:bg-[#000080] hover:text-white px-2" onMouseEnter={playHoverSound}>
          Options
        </button>
        <button className="hover:bg-[#000080] hover:text-white px-2" onMouseEnter={playHoverSound}>
          Help
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Category tabs */}
        <div className="mb-4 flex border-b border-[#808080]">
          {[
            { id: "all", label: "All Games" },
            { id: "arcade", label: "Arcade" },
            { id: "board", label: "Board Games" },
            { id: "puzzle", label: "Puzzle" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-1 mr-1 ${
                activeTab === tab.id
                  ? "bg-[#c0c0c0] border-t border-l border-r border-[#808080] border-b-0 relative -mb-px"
                  : "bg-[#d4d0c8] border border-[#808080]"
              }`}
              onClick={() => {
                setActiveTab(tab.id as any)
                playSelectSound()
              }}
              onMouseEnter={playHoverSound}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Featured games section */}
        <div className="mb-6">
          <div className="bg-[#000080] text-white px-2 py-1 mb-2">
            <h2 className="text-sm font-bold">Featured Games</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games
              .filter((game) => game.featured)
              .map((game) => (
                <div
                  key={game.id}
                  className="border-2 border-[#808080] bg-[#d4d0c8] p-2 cursor-pointer"
                  style={{
                    borderTopColor: "#ffffff",
                    borderLeftColor: "#ffffff",
                    borderBottomColor: "#404040",
                    borderRightColor: "#404040",
                  }}
                  onClick={() => selectGame(game.id as GameType)}
                  onMouseEnter={() => {
                    setHoveredGame(game.id)
                    playHoverSound()
                  }}
                  onMouseLeave={() => setHoveredGame(null)}
                >
                  <div className="flex items-center">
                    <div className="mr-3 border border-[#808080] bg-white p-2 flex-shrink-0">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold">{game.name}</h3>
                      <p className="text-sm mb-2">{game.description}</p>
                      <button
                        className="px-4 py-1 text-sm border-2 border-[#808080] bg-[#c0c0c0] active:bg-[#d4d0c8]"
                        style={{
                          borderTopColor: "#ffffff",
                          borderLeftColor: "#ffffff",
                          borderBottomColor: "#404040",
                          borderRightColor: "#404040",
                        }}
                      >
                        Play Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* All games grid */}
        <div>
          <div className="bg-[#000080] text-white px-2 py-1 mb-2">
            <h2 className="text-sm font-bold">
              {activeTab === "all" ? "All Games" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Games`}
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className={`flex flex-col items-center p-2 cursor-pointer border-2 ${
                  hoveredGame === game.id ? "bg-[#d4d0c8]" : "bg-[#c0c0c0]"
                }`}
                style={{
                  borderTopColor: "#ffffff",
                  borderLeftColor: "#ffffff",
                  borderBottomColor: "#404040",
                  borderRightColor: "#404040",
                }}
                onClick={() => selectGame(game.id as GameType)}
                onMouseEnter={() => {
                  setHoveredGame(game.id)
                  playHoverSound()
                }}
                onMouseLeave={() => setHoveredGame(null)}
              >
                <div className="mb-2 border border-[#808080] bg-white p-1 flex items-center justify-center h-16 w-16">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <h3 className="text-xs font-bold text-center mb-1">{game.name}</h3>
                <p className="text-xs text-center mb-1 hidden md:block">{game.description}</p>
                <div className="mt-auto">
                  <span className="inline-block px-1 py-0.5 text-xs border border-[#808080] bg-[#d4d0c8]">
                    {game.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="mt-6 flex justify-end">
          <button
            className="px-3 py-1 text-sm border-2 border-[#808080] bg-[#c0c0c0] flex items-center"
            style={{
              borderTopColor: "#ffffff",
              borderLeftColor: "#ffffff",
              borderBottomColor: "#404040",
              borderRightColor: "#404040",
            }}
            onClick={toggleMusic}
            onMouseEnter={playHoverSound}
          >
            <span className="mr-2">{audioEnabled ? "Sound: On" : "Sound: Off"}</span>
            <span>{audioEnabled ? "🔊" : "🔇"}</span>
          </button>
        </div>

        {/* Status bar */}
        <div className="mt-6 border-t border-[#808080] pt-1 flex justify-between text-xs">
          <div>5 games available</div>
          <div>© 1995 Microsoft Corporation</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Game Content - Full window */}
      <div className="flex-1 overflow-auto w-full h-full">{renderGame()}</div>
    </div>
  )
}
