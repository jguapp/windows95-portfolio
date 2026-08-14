"use client"

import { useState, useEffect } from "react"
import Minesweeper from "./games/minesweeper"
import Pong from "./games/pong"
import Solitaire from "./games/solitaire"
import Chess from "./games/chess"
import Tetris from "./games/tetris"
import FreeCell from "./games/freecell"
import Hearts from "./games/hearts"
import Reversi from "./games/reversi"
import { createSound, type SynthAudio } from "@/lib/sound"
import { messageBox } from "@/components/win95-dialog"

type GameType = "launcher" | "minesweeper" | "solitaire" | "pong" | "chess" | "tetris" | "freecell" | "hearts" | "reversi"

export default function Games() {
  const [currentGame, setCurrentGame] = useState<GameType>("launcher")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [selectSound, setSelectSound] = useState<SynthAudio | null>(null)
  const [hoverSound, setHoverSound] = useState<SynthAudio | null>(null)
  const [bgMusic, setBgMusic] = useState<SynthAudio | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "arcade" | "board" | "puzzle">("all")
  /** The icon with the selection box round it, as in any Explorer window. */
  const [selected, setSelected] = useState<string | null>(null)
  const [menu, setMenu] = useState<string | null>(null)

  // Initialize sounds
  useEffect(() => {
    const select = createSound("/sounds/select.mp3")
    const hover = createSound("/sounds/hover.mp3")
    const music = createSound("/sounds/arcade-music.mp3")

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
      image: "/images/win95/chess-32.png",
      category: "board",
      featured: true,
    },
    {
      id: "solitaire",
      name: "Solitaire",
      description: "The timeless card game",
      image: "/images/win95/solitaire-32.png",
      category: "card",
      featured: false,
    },
    {
      id: "tetris",
      name: "Tetris",
      description: "The addictive block-stacking game",
      image: "/images/win95/tetris-32.png",
      category: "puzzle",
      featured: true,
    },
    {
      id: "minesweeper",
      name: "Minesweeper",
      description: "Clear the minefield without exploding",
      image: "/images/win95/minesweeper-32.png",
      category: "puzzle",
      featured: false,
    },
    {
      id: "freecell",
      name: "FreeCell",
      description: "All 32,000 deals, numbered as they always were",
      image: "/images/win95/freecell-32.png",
      category: "card",
      featured: true,
    },
    {
      id: "hearts",
      name: "Hearts",
      description: "Four hands, and nobody wants the queen of spades",
      image: "/images/win95/hearts-32.png",
      category: "card",
      featured: false,
    },
    {
      id: "reversi",
      name: "Reversi",
      description: "Corner the board and turn it over",
      image: "/images/win95/reversi-32.png",
      category: "board",
      featured: false,
    },
    {
      id: "pong",
      name: "Pong",
      description: "The original arcade classic",
      image: "/images/win95/pong-32.png",
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
      case "freecell":
        return <FreeCell onReturn={returnToLauncher} />
      case "hearts":
        return <Hearts onReturn={returnToLauncher} />
      case "reversi":
        return <Reversi onReturn={returnToLauncher} />
      default:
        return renderLauncher()
    }
  }

  /**
   * The launcher, drawn as an Explorer folder rather than a card grid.
   *
   * Windows 95 had no games launcher: games lived in the Start menu and, if you
   * went looking, in a folder full of program icons. The card grid with hover
   * states belonged to a much later decade. This keeps the window, which is
   * wanted, but dresses it as the folder it would have been, so it reuses the
   * chrome the rest of the shell already uses.
   */
  const renderLauncher = () => {
    const shown = activeTab === "all" ? games : games.filter((game) => game.category === activeTab)

    const menus: Record<string, { label: string; action: () => void; checked?: boolean; sep?: boolean }[]> = {
      File: [
        { label: "Open", action: () => selected && selectGame(selected as GameType) },
        {
          label: "Close",
          action: () => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "games" } })),
          sep: true,
        },
      ],
      View: [
        { label: "All Games", action: () => setActiveTab("all"), checked: activeTab === "all" },
        { label: "Arcade", action: () => setActiveTab("arcade"), checked: activeTab === "arcade" },
        { label: "Board Games", action: () => setActiveTab("board"), checked: activeTab === "board" },
        { label: "Puzzle", action: () => setActiveTab("puzzle"), checked: activeTab === "puzzle" },
      ],
      Options: [{ label: `Sound: ${audioEnabled ? "On" : "Off"}`, action: toggleMusic }],
      Help: [
        {
          label: "About Games",
          action: () =>
            messageBox({
              title: "About Games",
              text: `Games\n\n${games.length} games, in the folder they would have lived in.`,
              icon: "information",
            }),
        },
      ],
    }

    return (
      <div
        className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
        data-games-folder
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

        {/* Address bar, as Explorer had */}
        <div className="flex items-center gap-1 border-b border-[#808080] px-2 py-1">
          <span>Address</span>
          <div className="ml-1 flex flex-1 items-center gap-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]">
            <img
              src="/images/win95/games-16.png"
              alt=""
              className="h-4 w-4"
              style={{ imageRendering: "pixelated" }}
            />
            {"C:\\Program Files\\Accessories\\Games"}
          </div>
        </div>

        {/* Contents */}
        <div
          data-contents
          className="flex-1 overflow-auto bg-white p-2"
          onClick={() => {
            setSelected(null)
            setMenu(null)
          }}
        >
          <div className="flex flex-wrap content-start gap-2">
            {shown.map((game) => (
              <button
                key={game.id}
                type="button"
                data-game={game.id}
                title={game.description}
                className={`flex w-[112px] flex-col items-center gap-2 p-2 text-center ${
                  selected === game.id ? "bg-[#000080] text-white" : "text-black"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(game.id)
                  playSelectSound()
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  selectGame(game.id as GameType)
                }}
                onMouseEnter={playHoverSound}
              >
                <img
                  src={game.image}
                  alt=""
                  className="h-16 w-16"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="break-words leading-tight">{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[3px]">
          <span data-status className="flex-1">
            {selected ? games.find((g) => g.id === selected)?.description : `${shown.length} object(s)`}
          </span>
          <span>Double-click to play</span>
        </div>
      </div>
    )
  }

  const open = games.find((g) => g.id === currentGame)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* One strip, shared by every game.
          Chess, Pong and Solitaire each drew their own navy title bar inside a
          window that already had one, and the other five offered no way back
          except an Exit buried in a menu. This replaces both: a grey toolbar,
          so it does not read as a second title bar, with the way out on it. */}
      {open && (
        <div
          data-game-bar
          className="win95-type flex items-center gap-2 border-b border-b-[#808080] bg-[#c0c0c0] px-2 py-1"
          style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
        >
          <button
            type="button"
            data-return
            onClick={returnToLauncher}
            className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[2px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            &#9664; Return to Games
          </button>
          <img
            src={open.image}
            alt=""
            className="h-4 w-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="font-bold">{open.name}</span>
        </div>
      )}

      {/* Game Content - Full window */}
      <div className="min-h-0 flex-1 overflow-auto w-full">{renderGame()}</div>
    </div>
  )
}
